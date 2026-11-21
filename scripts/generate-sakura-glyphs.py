#!/usr/bin/env python3
"""Generate build-time font outlines for Sakura demo campaign imagery.

No fonts, web fonts or Pango/librsvg font matching are needed at runtime.
All SVG labels are rendered from deterministic vector paths instead of <text>.
Fonts are taken from Debian's installed Liberation / DejaVu font packages.
"""
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "public/demo/typography/sakura-glyphs.json"
FONT_DIR = Path("/usr/share/fonts/truetype")
OPTIONS = {
    "regular": [
        FONT_DIR / "liberation2/LiberationSans-Regular.ttf",
        FONT_DIR / "dejavu/DejaVuSans.ttf",
    ],
    "bold": [
        FONT_DIR / "liberation2/LiberationSans-Bold.ttf",
        FONT_DIR / "dejavu/DejaVuSans-Bold.ttf",
    ],
}
CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /.,?!:;-'&+()↗"

def load_font(path):
    if not path.is_file():
        return None
    tt = TTFont(path)
    return tt, tt.getBestCmap(), tt.getGlyphSet()

def write():
    result = {"version": 1, "fonts": {}}
    for style, paths in OPTIONS.items():
        fonts = [v for p in paths if (v := load_font(p)) is not None]
        if not fonts:
            raise SystemExit("ERROR: Missing font for " + style)
        data = {}
        for c in set(CHARS):
            cp = ord(c)
            selected = next(((tt, cmap, glyphs) for tt, cmap, glyphs in fonts if cp in cmap), None)
            if selected is None:
                raise SystemExit(f"ERROR: No glyph for U+{cp:04X} in {style}")
            tt, cmap, glyphs = selected
            glyph_name = cmap[cp]
            pen = SVGPathPen(glyphs)
            glyphs[glyph_name].draw(pen)
            advance = tt["hmtx"][glyph_name][0]
            data[c] = {"path": pen.getCommands(), "advance": advance, "units": tt["head"].unitsPerEm}
        result["fonts"][style] = data
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":"), sort_keys=True), encoding="utf-8")
    print(f"Generated {TARGET} ({TARGET.stat().st_size} bytes, {len(set(CHARS))} chars per weight)")

if __name__ == "__main__":
    write()
