"use client";

import { toCanvas } from "html-to-image";
import { WATERMARK_POLICY_VERSION, type OutputId } from "./contracts";

export interface RenderKeyInput {
  sessionId: string;
  industryId: string;
  configVersion: string;
  templateId: string;
  templateVersion: string;
  rendererVersion: string;
  assetHashes: string[];
  bindings: unknown;
  fields: Record<string, unknown>;
  outputId: OutputId;
}

export const RENDERER_VERSION = "demo-render-v1";

/** Canonical JSON: sorted object keys so field order never changes the hash (V2.0 §9.2). */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return entries.reduce<Record<string, unknown>>((acc, [k, v]) => {
      acc[k] = canonicalize(v);
      return acc;
    }, {});
  }
  return value;
}

export async function computeRenderKey(input: RenderKeyInput): Promise<string> {
  const canonical = canonicalize({ ...input, watermarkPolicyVersion: WATERMARK_POLICY_VERSION });
  const json = JSON.stringify(canonical);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(json));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface SafeArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Renders `node` to the exact output pixel size (independent of devicePixelRatio),
 * then bakes the PoStory watermark into the canvas pixels before encoding —
 * never a CSS overlay, per V2.0 §9.3.
 */
export async function renderWatermarkedPng(
  node: HTMLElement,
  options: { outputWidth: number; outputHeight: number; safeArea: SafeArea },
): Promise<Blob> {
  const nodeRect = node.getBoundingClientRect();
  const pixelRatio = options.outputWidth / nodeRect.width;

  // cacheBust appends `?timestamp` to every <img src>, which corrupts blob: URLs
  // (they don't support query strings) — our photos are always fresh local
  // blob/object URLs, so cache-busting buys nothing and must stay off.
  const canvas = await toCanvas(node, {
    pixelRatio,
    cacheBust: false,
    width: nodeRect.width,
    height: nodeRect.height,
  });

  if (canvas.width !== options.outputWidth || canvas.height !== options.outputHeight) {
    const resized = document.createElement("canvas");
    resized.width = options.outputWidth;
    resized.height = options.outputHeight;
    const ctx = resized.getContext("2d");
    if (!ctx) throw new Error("canvas-2d-unavailable");
    ctx.drawImage(canvas, 0, 0, options.outputWidth, options.outputHeight);
    paintWatermark(ctx, options.outputWidth, options.outputHeight, options.safeArea);
    return canvasToPngBlob(resized);
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-2d-unavailable");
  paintWatermark(ctx, options.outputWidth, options.outputHeight, options.safeArea);
  return canvasToPngBlob(canvas);
}

function paintWatermark(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, safeArea: SafeArea) {
  const areaX = safeArea.x * canvasWidth;
  const areaY = safeArea.y * canvasHeight;
  const areaW = safeArea.width * canvasWidth;
  const areaH = safeArea.height * canvasHeight;

  const markWidth = Math.min(areaW, canvasWidth * 0.18);
  const markHeight = Math.min(areaH, markWidth * 0.32);
  const margin = Math.min(areaW, areaH) * 0.1;
  const x = areaX + areaW - markWidth - margin;
  const y = areaY + areaH - markHeight - margin;

  ctx.save();
  const radius = markHeight / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + markWidth, y, x + markWidth, y + markHeight, radius);
  ctx.arcTo(x + markWidth, y + markHeight, x, y + markHeight, radius);
  ctx.arcTo(x, y + markHeight, x, y, radius);
  ctx.arcTo(x, y, x + markWidth, y, radius);
  ctx.closePath();
  ctx.fillStyle = "rgba(17, 17, 20, 0.55)";
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(markHeight * 0.42)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText("PoStory", x + markWidth / 2, y + markHeight / 2 + 1);
  ctx.restore();
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode-failed"))), "image/png");
  });
}

export function downloadFilename(industryId: string, artifactShortId: string, width: number, height: number) {
  return `postory-${industryId}-${artifactShortId}-${width}x${height}.png`;
}
