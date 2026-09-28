"""把抓取的 templates.json + orshot-layers/*.json 统一成 src/data/catalog.json（页面 + 图层格式）。
Orshot 图层里引用的 Unsplash 图片下载到 public/templates/orshot-assets/，保证同源可导出。"""
import hashlib
import json
import os
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src/data")
ASSETS = os.path.join(ROOT, "public/templates/orshot-assets")
os.makedirs(ASSETS, exist_ok=True)

PLATFORM = {
    "instagram post": "instagram-post",
    "instagram story": "instagram-story",
    "youtube thumbnail": "youtube",
    "twitter post": "twitter",
    "twitter banner": "twitter",
    "pinterest pin": "pinterest",
    "facebook event cover": "facebook",
}
PLATFORM_LABEL = {
    "instagram-post": "Instagram 帖子",
    "instagram-story": "Instagram 快拍",
    "youtube": "YouTube 封面",
    "twitter": "X / Twitter",
    "pinterest": "Pinterest",
    "facebook": "Facebook",
}


def local_asset(url: str) -> str:
    name = hashlib.md5(url.encode()).hexdigest()[:16] + ".jpg"
    return f"/templates/orshot-assets/{name}", os.path.join(ASSETS, name)


def download(pair):
    url, dest = pair
    if not os.path.exists(dest):
        subprocess.run(["curl", "-sfL", "-A", "Mozilla/5.0", url, "-o", dest], check=True)


def pretty(pid):
    return pid.replace("_", " ").strip().capitalize() if pid else None


def norm_element(e, downloads):
    t = e["type"]
    el = {
        "id": e["id"],
        "type": "image" if t == "element" else t,
        "name": pretty(e.get("parameterId")),
        "x": e["position"]["x"],
        "y": e["position"]["y"],
        "w": e["dimensions"]["width"],
        "h": e["dimensions"]["height"],
        "z": e.get("zIndex", 1),
        "rotation": e.get("rotation", 0),
        "style": dict(e.get("style", {})),
    }
    if t == "shape":
        el["shapeType"] = e.get("shapeType", "rectangle")
    if t == "text":
        el["content"] = e.get("content", "")
    if t in ("image", "element"):
        src = e.get("content", "")
        if src.startswith("http"):
            rel, dest = local_asset(src)
            downloads.append((src, dest))
            src = rel
        el["content"] = src
        if t == "element":
            el["style"].setdefault("objectFit", "contain")
    return el


def main():
    raw = json.load(open(os.path.join(DATA, "templates.json")))
    catalog, downloads = [], []
    for order, t in enumerate(raw):
        if t["source"] == "orshot":
            oid = t["id"].split("-")[1]
            layers = json.load(open(os.path.join(DATA, "orshot-layers", f"{oid}.json")))
            pages = [
                {
                    "name": p.get("name") or f"第 {i + 1} 页",
                    "width": p["canvas"]["width"],
                    "height": p["canvas"]["height"],
                    "background": p["canvas"].get("backgroundColor", "#ffffff"),
                    "elements": sorted(
                        (norm_element(e, downloads) for e in p["elements"]), key=lambda x: x["z"]
                    ),
                }
                for i, p in enumerate(layers["pages_data"])
            ]
            first = pages[0]
            platform = "instagram-story" if first["height"] / first["width"] > 1.6 else "instagram-post"
            description = layers.get("description")
            editable = True
        else:
            platform = PLATFORM[t["type"]]
            pages = [
                {
                    "name": "第 1 页",
                    "width": t["width"],
                    "height": t["height"],
                    "background": "#ffffff",
                    "elements": [
                        {
                            "id": "background",
                            "type": "image",
                            "name": "模板底图",
                            "x": 0,
                            "y": 0,
                            "w": t["width"],
                            "h": t["height"],
                            "z": 0,
                            "rotation": 0,
                            "locked": True,
                            "style": {"objectFit": "cover"},
                            "content": t["localImages"][0],
                        }
                    ],
                }
            ]
            description = None
            editable = False
        catalog.append(
            {
                "id": t["id"],
                "source": t["source"],
                "title": re.sub(r"\s+", " ", t["title"]).strip(),
                "description": description,
                "platform": platform,
                "platformLabel": PLATFORM_LABEL[platform],
                "width": pages[0]["width"],
                "height": pages[0]["height"],
                "thumbnails": t["localImages"],
                "pages": pages,
                "editable": editable,
                "sourceUrl": t["sourceUrl"],
                "sortOrder": order,
            }
        )
    uniq = list(dict(downloads).items())
    with ThreadPoolExecutor(8) as ex:
        list(ex.map(download, uniq))
    json.dump(catalog, open(os.path.join(DATA, "catalog.json"), "w"), ensure_ascii=False)
    print(f"templates={len(catalog)} editable={sum(c['editable'] for c in catalog)} assets={len(uniq)}")


if __name__ == "__main__":
    main()
