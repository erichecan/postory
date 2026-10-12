import type { LayeredTemplateDefinition, TemplateRatioId } from "../contracts";

export function resolveTemplateLayout(definition: LayeredTemplateDefinition, outputId: TemplateRatioId) {
  const layout = definition.layouts[outputId];
  if (!layout) throw new Error(`Template ${definition.id}@${definition.version} does not support ${outputId}`);
  return {
    outputId,
    width: layout.width,
    height: layout.height,
    aspectRatio: layout.width / layout.height,
    layout,
    watermarkSafeArea: layout.watermarkSafeArea,
  } as const;
}

export function fitFontSizeCqw(text: string, boxWidth: number, baseFontSizeCqw: number, maxLines: number, minimumScale = 0.68) {
  const chars = Array.from(text.replace(/\s/gu, ""));
  if (!chars.length) return { fontSizeCqw: baseFontSizeCqw, overflow: false };
  const glyphUnits = chars.reduce((sum, char) => sum + (/[^\u0000-\u00ff]/u.test(char) ? 1 : /[MW@%]/u.test(char) ? 0.82 : 0.54), 0);
  const maximumUnits = (boxWidth * 100 * maxLines) / (baseFontSizeCqw * 1.08);
  const scale = Math.min(1, maximumUnits / glyphUnits);
  const minimum = baseFontSizeCqw * minimumScale;
  return {
    fontSizeCqw: Math.max(minimum, baseFontSizeCqw * scale),
    overflow: scale < minimumScale,
  };
}
