"""从 Orshot 公开接口（不需要登录）按行业分类批量抓取模板，追加进
src/data/orshot-layers/ 和 src/data/orshot-selection.json，供 prepare-catalog.py 转换入库。

数据来源说明：
- 列表 https://orshot.com/api/templates/community?category={cat}&page=1&pageSize=200
- 详情 https://orshot.com/templates/{id}  页面 HTML 里内联了完整的 pages_data（Next.js
  RSC flight payload 中一段被 JSON 转义过的对象文本，不走官方 api.orshot.com 的 Render API，
  因为官方 API 只返回渲染后的图片，不暴露图层坐标）。两者都已验证不需要登录态。
"""
import json
import os
import re
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src/data")
LAYERS_DIR = os.path.join(DATA, "orshot-layers")

CATEGORIES = ["restaurant", "food", "beauty", "fitness", "healthcare"]
# Orshot 没有美发/美甲这两个细分类目，退而求其次用关键词从已抓到的模板里命中
HAIR_NAIL_KEYWORDS = ["hair", "salon", "nail", "mani", "pedi", "barber"]
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
SLEEP_SECONDS = 0.4


def http_get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read()


def fetch_list(category: str) -> list[dict]:
    url = f"https://orshot.com/api/templates/community?category={category}&page=1&pageSize=200"
    data = json.loads(http_get(url))
    return data.get("templates", [])


def extract_detail(html: str, template_id: int) -> dict | None:
    anchor = '{\\"id\\":' + str(template_id) + ","
    start = html.find(anchor)
    if start == -1:
        return None
    depth, i = 0, start
    while i < len(html):
        c = html[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                break
        i += 1
    raw = html[start : i + 1]
    try:
        unescaped = json.loads('"' + raw + '"')
        return json.loads(unescaped)
    except (json.JSONDecodeError, ValueError):
        return None


def clean_dollar_escaping(value):
    """Orshot 用 "$$" 表示字面 "$"（避免跟参数插值语法冲突），跟仓库已有数据保持一致。"""
    if isinstance(value, dict):
        return {k: clean_dollar_escaping(v) for k, v in value.items()}
    if isinstance(value, list):
        return [clean_dollar_escaping(v) for v in value]
    if isinstance(value, str):
        return value.replace("$$", "$")
    return value


def main():
    selection_path = os.path.join(DATA, "orshot-selection.json")
    selection = json.load(open(selection_path))
    existing = set(selection)

    candidates: dict[int, set[str]] = {}
    for cat in CATEGORIES:
        for t in fetch_list(cat):
            candidates.setdefault(t["id"], set()).update(t.get("categories") or [])
        print(f"分类 {cat}: 列表返回 {sum(1 for c in candidates.values())} 累计候选")

    new_ids = sorted(i for i in candidates if i not in existing)
    print(f"目标 5 个分类覆盖 {len(candidates)} 个模板，已有 {len(candidates) - len(new_ids)} 个，待抓取 {len(new_ids)} 个")

    fetched, failed, hair_nail_hits = [], [], []
    for idx, tid in enumerate(new_ids):
        try:
            html = http_get(f"https://orshot.com/templates/{tid}").decode("utf-8")
            obj = extract_detail(html, tid)
            if not obj or not obj.get("pages_data"):
                failed.append(tid)
                continue
            obj = clean_dollar_escaping(obj)
            json.dump(obj, open(os.path.join(LAYERS_DIR, f"{tid}.json"), "w"), ensure_ascii=False)
            fetched.append(tid)
            text = f"{obj.get('name', '')} {obj.get('description', '')}".lower()
            if any(k in text for k in HAIR_NAIL_KEYWORDS):
                hair_nail_hits.append((tid, obj.get("name")))
        except Exception as e:
            failed.append(tid)
            print(f"  失败 id={tid}: {e}")
        time.sleep(SLEEP_SECONDS)
        if (idx + 1) % 20 == 0:
            print(f"进度 {idx + 1}/{len(new_ids)}")

    selection = selection + fetched
    json.dump(selection, open(selection_path, "w"), ensure_ascii=False)

    print(f"\n新增模板 {len(fetched)} 个，失败 {len(failed)} 个")
    if failed:
        print(f"失败 id 列表: {failed}")
    print(f"美发/美甲关键词命中 {len(hair_nail_hits)} 个:")
    for tid, name in hair_nail_hits:
        print(f"  {tid}: {name}")


if __name__ == "__main__":
    main()
