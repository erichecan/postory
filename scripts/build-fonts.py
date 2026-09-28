"""为 template-fonts.json 里的每个字体族探测 Google Fonts CSS2 可用的轴参数，生成 src/data/font-stylesheets.json。"""
import json
import os
import subprocess
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src/data")
SPECS = ["ital,wght@0,100..900;1,100..900", "wght@100..900", "ital,wght@0,400;0,700;1,400;1,700", "wght@400;700", ""]
EXTRA = ["Noto Sans SC"]


def family_param(name, spec):
    fam = urllib.parse.quote_plus(name)
    return f"family={fam}:{spec}" if spec else f"family={fam}"


def probe(name):
    for spec in SPECS:
        url = f"https://fonts.googleapis.com/css2?{family_param(name, spec)}&display=swap"
        code = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-A", "Mozilla/5.0", url], capture_output=True, text=True).stdout
        if code == "200":
            return name, spec
    return name, None


def main():
    families = sorted(set(json.load(open(os.path.join(DATA, "template-fonts.json"))) + EXTRA))
    with ThreadPoolExecutor(8) as ex:
        results = list(ex.map(probe, families))
    missing = [n for n, s in results if s is None]
    ok = [(n, s) for n, s in results if s is not None]
    chunks = [ok[i : i + 20] for i in range(0, len(ok), 20)]
    sheets = ["https://fonts.googleapis.com/css2?" + "&".join(family_param(n, s) for n, s in c) + "&display=swap" for c in chunks]
    json.dump({"families": [n for n, _ in ok], "specs": {n: s for n, s in ok}, "stylesheets": sheets}, open(os.path.join(DATA, "font-stylesheets.json"), "w"), indent=1)
    print(f"ok={len(ok)} missing={missing} sheets={len(sheets)}")
    for url in sheets:
        code = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-A", "Mozilla/5.0", url], capture_output=True, text=True).stdout
        print(code, len(url))


if __name__ == "__main__":
    main()
