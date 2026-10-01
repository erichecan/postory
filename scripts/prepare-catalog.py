"""把 src/data/orshot-selection.json 里的 Orshot 模板（图层数据在 src/data/orshot-layers/）
统一成 src/data/catalog.json（页面 + 图层格式），并把缩略图与图层引用的远程图片下载到 public/assets/templates/，
保证同源可导出。Orshot 的样式扩展字段在这里转换成渲染器使用的 CSS 形式。"""
import hashlib
import json
import os
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src/data")
PUBLIC = os.path.join(ROOT, "public")
ASSET_DIR = "/assets/templates/orshot-assets"
THUMB_DIR = "/assets/templates/orshot"
os.makedirs(PUBLIC + ASSET_DIR, exist_ok=True)
os.makedirs(PUBLIC + THUMB_DIR, exist_ok=True)

SIZE_PLATFORM = {
    (1080, 1920): "instagram-story",
    (1280, 720): "youtube",
    (1920, 1080): "youtube",
    (1200, 600): "twitter",
    (1500, 500): "twitter",
    (1000, 1500): "pinterest",
    (1200, 630): "facebook",
}

KEEP_STYLE = {
    "color", "fontSize", "fontFamily", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textAlign",
    "textDecoration", "textMode", "minFontSize", "verticalAlign", "backgroundColor", "fill", "stroke", "strokeWidth",
    "borderRadius", "borderColor", "borderStyle", "borderWidth", "objectFit", "objectPosition", "opacity", "filter",
    "mixBlendMode", "textTransform", "writingMode", "svgColor",
}

FONT_ALIASES = {"Hanken Grotesque": "Hanken Grotesk"}

downloads = []


def local(url: str, directory: str, name: str | None = None) -> str:
    ext = ".png" if url.split("?")[0].lower().endswith(".png") else ".jpg"
    name = name or hashlib.md5(url.encode()).hexdigest()[:16] + ext
    downloads.append((url, PUBLIC + f"{directory}/{name}"))
    return f"{directory}/{name}"


def download(pair):
    url, dest = pair
    if os.path.exists(dest):
        return None
    res = subprocess.run(["curl", "-sfL", "--retry", "3", "-A", "Mozilla/5.0", url, "-o", dest])
    if res.returncode != 0:
        if os.path.exists(dest):
            os.remove(dest)
        return dest
    return None


def px(v) -> float:
    try:
        return float(str(v).replace("px", "") or 0)
    except ValueError:
        return 0.0


def transparent(color) -> bool:
    c = str(color or "").replace(" ", "").lower()
    return c in ("", "transparent", "none") or c.endswith(",0)")


def shadow(st, prefix):
    x, y, blur = (px(st.get(f"{prefix}{k}")) for k in ("X", "Y", "Blur"))
    color = st.get(f"{prefix}Color")
    if (x == 0 and y == 0 and blur == 0) or transparent(color):
        return None
    return f"{x:g}px {y:g}px {blur:g}px {color}"


def norm_style(e):
    st = e.get("style", {}) or {}
    out = {k: v for k, v in st.items() if k in KEEP_STYLE and v not in (None, "")}
    if out.get("fontFamily") in FONT_ALIASES:
        out["fontFamily"] = FONT_ALIASES[out["fontFamily"]]
    t = e["type"]
    drop = shadow(st, "dropShadow") or (st.get("dropShadow") or None)
    box = shadow(st, "boxShadow") or (st.get("boxShadow") or None)
    if t == "text":
        if drop:
            out["textShadow"] = drop
        if box:
            out["boxShadow"] = box
        if px(st.get("textStrokeWidth")) > 0 and not transparent(st.get("textStrokeColor")):
            out["textStroke"] = f"{px(st['textStrokeWidth']):g}px {st['textStrokeColor']}"
        if not transparent(st.get("textBackgroundColor")):
            out["textBackground"] = st["textBackgroundColor"]
            out["textBackgroundRadius"] = st.get("textBackgroundRadius", "0px")
        if px(st.get("paddingX")) or px(st.get("paddingY")):
            out["padding"] = f"{px(st.get('paddingY')):g}px {px(st.get('paddingX')):g}px"
        if px(st.get("textBorderWidth")) > 0 and not transparent(st.get("textBorderColor")):
            out["border"] = f"{px(st['textBorderWidth']):g}px solid {st['textBorderColor']}"
    else:
        if st.get("border"):
            out["border"] = st["border"]
        if drop:
            out["filter"] = f"{out.get('filter', '')} drop-shadow({drop})".strip()
        if box:
            out["boxShadow"] = box
    if "opacity" in e and "opacity" not in out:
        out["opacity"] = float(e["opacity"])
    if isinstance(out.get("opacity"), str):
        out["opacity"] = float(out["opacity"])
    return out


def rotation_of(e):
    rot = float(e.get("rotation") or 0)
    m = re.match(r"rotate\((-?[\d.]+)deg\)", str((e.get("style") or {}).get("transform", "")))
    return rot + (float(m.group(1)) if m else 0)


def pretty(pid):
    return pid.replace("_", " ").strip().capitalize() if pid else None


def norm_element(e):
    t = e["type"]
    el = {
        "id": e["id"],
        "type": "image" if t == "element" else t,
        "name": e.get("name") or pretty(e.get("parameterId")),
        "x": e["position"]["x"],
        "y": e["position"]["y"],
        "w": e["dimensions"]["width"],
        "h": e["dimensions"]["height"],
        "z": e.get("zIndex", 1),
        "rotation": rotation_of(e),
        "style": norm_style(e),
    }
    if t == "shape":
        shape = e.get("shapeType") or (e.get("style") or {}).get("shapeType") or "rectangle"
        el["shapeType"] = shape if shape in ("rectangle", "circle", "line") else "rectangle"
    if t == "text":
        el["content"] = e.get("content", "")
    if t in ("image", "element"):
        src = e.get("content") or e.get("src") or e.get("src_url") or ""
        if src.startswith("http"):
            src = local(src, ASSET_DIR)
        el["content"] = src
        el["style"].setdefault("objectFit", "contain" if t == "element" else "cover")
    return el


SCENE_SETTLE = 1.0
SOLID_COLOR = re.compile(r"^(#[0-9a-f]{3}|#[0-9a-f]{6}|rgb\([^)]*\)|[a-z]+)$")


def timing(e):
    tr = e.get("transitions") or {}
    return float(tr.get("showAt") or 0), float(tr["hideAt"]) if tr.get("hideAt") is not None else float("inf")


def covers_canvas(e, w, h):
    x, y = e["position"]["x"], e["position"]["y"]
    ew, eh = e["dimensions"]["width"], e["dimensions"]["height"]
    return x <= 0 and y <= 0 and x + ew >= w and y + eh >= h


def opaque(e):
    st = e.get("style") or {}
    if float(e.get("opacity", st.get("opacity", 1)) or 1) < 1:
        return False
    if e["type"] == "image":
        return True
    return e["type"] == "shape" and bool(SOLID_COLOR.match(str(st.get("fill", "")).replace(" ", "").lower()))


def split_scenes(p):
    """视频模板把多个场景按时间轴叠在同一页：按每个铺满画布的不透明背景出现后的时刻各取一帧，拆成多页。"""
    w, h = p["canvas"]["width"], p["canvas"]["height"]
    els = p["elements"]
    if not p.get("videoDuration") or not any(e.get("transitions") for e in els):
        return [p]
    backdrops = [e for e in els if covers_canvas(e, w, h) and opaque(e)]
    moments = []
    for e in backdrops:
        show, hide = timing(e)
        moments.append(min(show + SCENE_SETTLE, (show + hide) / 2))
    moments.append(max(timing(e)[0] for e in els) + SCENE_SETTLE)

    def frame(t):
        visible = [e for e in els if timing(e)[0] <= t < timing(e)[1]]
        floor = max((e.get("zIndex", 1) for e in visible if e in backdrops), default=float("-inf"))
        return [e for e in visible if e.get("zIndex", 1) >= floor]

    frames = [frame(t) for t in sorted(set(moments))]
    ids = [{e["id"] for e in f} for f in frames]
    kept = [f for i, f in enumerate(frames) if f and not any(ids[i] <= ids[j] for j in range(i + 1, len(frames)))]
    if len(kept) < 2:
        return [p]
    # 编辑器默认打开第一页，但这批模板的营销缩略图是 Orshot 自己挑的"最好看那一帧"（通常在时间线靠后、
    # 带图片），不一定是时间上最早的那一幕。按时间排最早的一幕常常是纯文字片头，没有图片——
    # 进编辑器第一眼就"背景图不见了"。这里把有图片的场景排到前面（保持各自原有的相对顺序），
    # 纯文字/图形场景挪到后面，不丢任何一页，只是改变默认打开看到哪一页。
    has_hero = lambda f: any(e["type"] == "image" and covers_canvas(e, w, h) for e in f)
    with_image = [f for f in kept if has_hero(f)]
    without_image = [f for f in kept if not has_hero(f)]
    kept = with_image + without_image
    return [{**p, "name": f"{p.get('name') or 'Scene'} {k + 1}/{len(kept)}", "elements": f} for k, f in enumerate(kept)]


def norm_page(i, p):
    canvas = p["canvas"]
    elements = [norm_element(e) for e in p["elements"]]
    bg_img = canvas.get("backgroundImage")
    if bg_img and str(bg_img).startswith("http"):
        elements.insert(0, {
            "id": "canvas-bg", "type": "image", "name": "背景图", "x": 0, "y": 0, "w": canvas["width"], "h": canvas["height"],
            "z": 0, "rotation": 0, "style": {"objectFit": "cover"}, "content": local(bg_img, ASSET_DIR),
        })
    return {
        "name": p.get("name") or f"第 {i + 1} 页",
        "width": canvas["width"],
        "height": canvas["height"],
        "background": canvas.get("backgroundColor", "#ffffff"),
        "elements": sorted(elements, key=lambda x: x["z"]),
    }


def platform_of(w, h):
    return SIZE_PLATFORM.get((w, h), "instagram-post")


def main():
    selection = json.load(open(os.path.join(DATA, "orshot-selection.json")))
    catalog, needs = [], {}
    for order, oid in enumerate(selection):
        start = len(downloads)
        layers = json.load(open(os.path.join(DATA, "orshot-layers", f"{oid}.json")))
        scenes = [s for p in layers["pages_data"] for s in split_scenes(p)]
        pages = [norm_page(i, p) for i, p in enumerate(scenes)]
        thumbs = [
            local(m["thumbnail_url"], THUMB_DIR, f"orshot-{oid}-{i + 1}.png")
            for i, m in enumerate(layers.get("pages_meta") or [])
            if m.get("thumbnail_url")
        ]
        needs[f"orshot-{oid}"] = {dest for _, dest in downloads[start:]}
        first = pages[0]
        catalog.append({
            "id": f"orshot-{oid}",
            "source": "orshot",
            "title": re.sub(r"\s+", " ", layers["name"]).strip(),
            "description": layers.get("description"),
            "platform": platform_of(first["width"], first["height"]),
            "width": first["width"],
            "height": first["height"],
            "thumbnails": thumbs,
            "pages": pages,
            "editable": True,
            "sourceUrl": f"https://orshot.com/templates/{oid}",
            "sortOrder": order,
        })
    uniq = list(dict(downloads).items())
    with ThreadPoolExecutor(8) as ex:
        failed = {d for d in ex.map(download, uniq) if d}
    broken = [t["id"] for t in catalog if needs[t["id"]] & failed]
    catalog = [t for t in catalog if t["id"] not in broken]
    for order, t in enumerate(catalog):
        t["sortOrder"] = order
    if broken:
        print(f"剔除引用失效图片的模板 {len(broken)} 个: {', '.join(broken)}")
    json.dump(catalog, open(os.path.join(DATA, "catalog.json"), "w"), ensure_ascii=False)
    fonts = {e["style"]["fontFamily"] for t in catalog for p in t["pages"] for e in p["elements"] if e["style"].get("fontFamily")}
    for t in catalog:
        for p in t["pages"]:
            for e in p["elements"]:
                for fam in re.findall(r"font-family\s*:\s*([^;\"']+)", e.get("content") or ""):
                    fonts.add(FONT_ALIASES.get(fam.split(",")[0].strip(), fam.split(",")[0].strip()))
    fonts = sorted(fonts)
    json.dump(fonts, open(os.path.join(DATA, "template-fonts.json"), "w"), ensure_ascii=False)
    print(f"templates={len(catalog)} files={len(uniq)} fonts={len(fonts)}")


if __name__ == "__main__":
    main()
