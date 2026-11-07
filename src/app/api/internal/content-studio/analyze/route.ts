import { NextResponse } from "next/server";
import { assertAdmin, AuthError } from "@/lib/auth/session";

export const runtime = "nodejs";
export const maxDuration = 60;

type FrameInput = { time: number; dataUrl: string };

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    await assertAdmin();
    if (!process.env.OPENAI_API_KEY) {
      return invalid("尚未配置 OPENAI_API_KEY。可先使用本地抽帧和裁切；配置密钥后启用商品识别。", 503);
    }
    const body: unknown = await req.json();
    if (!body || typeof body !== "object") return invalid("无效请求");
    const { frames, context } = body as { frames?: FrameInput[]; context?: string };
    if (!Array.isArray(frames) || frames.length < 1 || frames.length > 8) {
      return invalid("每次请选择 1–8 张关键帧");
    }
    const safeFrames = frames.map((frame, i) => {
      if (
        !frame || typeof frame.time !== "number" || !Number.isFinite(frame.time) ||
        typeof frame.dataUrl !== "string" ||
        !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(frame.dataUrl) ||
        frame.dataUrl.length > 1_500_000
      ) throw new Error("第 " + (i + 1) + " 帧无效或过大");
      return frame;
    });
    const safeContext = typeof context === "string" ? context.slice(0, 1000) : "";
    const userContent: Array<Record<string, unknown>> = [
      { type: "input_text", text: [
        "你是 PoStory 内部实拍素材审片员。逐帧查看并识别实际可见的商品，服务于门窗、折扣家电、家具等本地行业。",
        "每张图像前有对应时间戳。product.frameIndex 必须是所给关键帧的零基序号；同一商品在不同帧重复出现时合并成一个商品，选最清楚的一帧。",
        "bbox 使用 [x,y,width,height] 四个 0–100 的百分数，必须全部位于画面内。仅建议裁剪位置，不能保证像素级精确抠图。拿不准就使用 [10,10,80,80] 并在 caution 说明。",
        "不能依据外观编造品牌、精确型号、价格、库存、保修或规格；不确定写待确认。给出实际可见的外观特征与适合拍摄/展示的建议。",
        "候选内容角度必须基于素材中真实可见的证据。不要声称能保证爆款。",
        "只返回 JSON 对象，字段为 summary:string, products: array，每个 product 包括 id:string, name:string, category:string, features:string[], frameIndex:number, bbox:number[4], caution:string, angles:string[]。",
        "商品最多 12 个；若画面没有商品，products 为空数组。",
        "代理商提供的上下文（只能作为待核实线索）：" + safeContext
      ].join("\n") }
    ];
    safeFrames.forEach((frame, index) => {
      userContent.push({ type: "input_text", text: "关键帧 " + index + "，源视频时间 " + frame.time.toFixed(2) + " 秒" });
      userContent.push({ type: "input_image", image_url: frame.dataUrl, detail: "high" });
    });
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.POSTORY_VISION_MODEL || "gpt-4.1-mini",
        input: [{ role: "user", content: userContent }],
        text: { format: { type: "json_object" } },
        max_output_tokens: 2400,
        store: false
      }),
      signal: AbortSignal.timeout(55000)
    });
    if (!upstream.ok) {
      const error = await upstream.text();
      console.error("Content Studio vision request failed", upstream.status, error.slice(0, 300));
      return invalid("商品识别服务暂不可用，请检查 API 密钥、模型权限或稍后重试。", 502);
    }
    const result = await upstream.json() as {
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const raw = result.output?.flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text || "").join("") || "";
    if (!raw) return invalid("识别服务没有返回分析文本，请重试。", 502);
    const parsed = JSON.parse(raw) as { summary?: unknown; products?: unknown };
    const products = Array.isArray(parsed.products) ? parsed.products.slice(0, 12).map((item, i) => {
      const p = item as Record<string, unknown>;
      const box = Array.isArray(p.bbox) && p.bbox.length === 4 ? p.bbox.map(x => Number(x)) : [10,10,80,80];
      const validBox = box.every(x => Number.isFinite(x) && x >= 0 && x <= 100) && box[2] > 0 && box[3] > 0 && box[0]+box[2] <= 100 && box[1]+box[3] <= 100;
      return {
        id: "product-" + (i+1),
        name: typeof p.name === "string" ? p.name.slice(0, 140) : "待确认商品",
        category: typeof p.category === "string" ? p.category.slice(0, 80) : "待分类",
        features: Array.isArray(p.features) ? p.features.filter(x=>typeof x === "string").slice(0, 6) : [],
        frameIndex: typeof p.frameIndex === "number" && Number.isInteger(p.frameIndex) ? Math.max(0,Math.min(safeFrames.length-1,p.frameIndex)) : 0,
        bbox: validBox ? box : [10,10,80,80],
        caution: typeof p.caution === "string" ? p.caution.slice(0, 400) : "商品信息需要人工确认",
        angles: Array.isArray(p.angles) ? p.angles.filter(x=>typeof x === "string").slice(0, 4) : []
      };
    }) : [];
    return NextResponse.json({ summary: typeof parsed.summary === "string" ? parsed.summary : "识别完成", products });
  } catch (error) {
    if (error instanceof AuthError) return invalid(error.message, error.status);
    if (error instanceof SyntaxError) return invalid("识别结果解析失败，请重试。", 502);
    console.error("Content Studio analysis failed", error);
    return invalid(error instanceof Error && error.message.startsWith("第 ") ? error.message : "商品分析失败，请重试。", 400);
  }
}
