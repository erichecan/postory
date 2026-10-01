#!/usr/bin/env python3
"""launchd 的入口 —— 每天跑一次 AI 模板生成（10个/天，凌晨3点）。

⛔ 存在的唯一理由是 TCC，不是为了加功能。

   本仓库在外置卷 /Volumes/datacenter 上，launchd 起的进程默认**没有该卷的
   读权限**。businessskills/ximalaya 都踩过这个坑（7 个任务以退出码 2/126
   静默失败）。修法是把 Program 固定成 /opt/homebrew/bin/python3——它的进程
   映像是 Python.app，在「完全磁盘访问权限」面板里永远可选且已经授权过。

   这个 runner 由那个解释器执行，再把 `npx tsx` 作为**子进程**拉起来——
   子进程继承同一份 TCC 授权，于是 npx/node 也读得动 /Volumes。
"""
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOG = Path.home() / "Library" / "Logs" / "postory" / "ai-daily-templates.log"

MAX_LOG_BYTES = 5 * 1024 * 1024


def main():
    LOG.parent.mkdir(parents=True, exist_ok=True)
    if LOG.exists() and LOG.stat().st_size > MAX_LOG_BYTES:
        LOG.write_text(LOG.read_text(encoding="utf-8", errors="replace")[-MAX_LOG_BYTES // 2:], encoding="utf-8")

    stamp = datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"\n{'=' * 70}\n▶ {stamp}  ai-daily-templates\n{'=' * 70}\n")
        f.flush()
        npx = Path("/opt/homebrew/bin/npx")
        if not npx.exists() and not ROOT.exists():
            f.write(f"⛔ 找不到项目目录：{ROOT}\n   多半是 launchd 读不到外置卷（TCC）。确认"
                    f" /opt/homebrew/bin/python3 在「完全磁盘访问权限」里。\n")
            return 2
        r = subprocess.run(
            ["/opt/homebrew/bin/npx", "tsx", "scripts/generate-daily-templates.ts"],
            cwd=str(ROOT), stdout=f, stderr=subprocess.STDOUT,
        )
        f.write(f"\n◀ 退出码 {r.returncode} · {datetime.now().astimezone():%H:%M:%S}\n")
        return r.returncode


if __name__ == "__main__":
    sys.exit(main())
