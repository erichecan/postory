"""Draft generation using the configured, signed-in Codex CLI."""
from __future__ import annotations

import os
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory

from .runtime import PipelineContext


def run_prompt(context: PipelineContext, prompt: str, *, route: str, timeout: int) -> str:
    config = context.model_route(route)
    executable = os.path.expandvars(os.path.expanduser(config["executable"]))
    context.data_root.mkdir(parents=True, exist_ok=True, mode=0o700)
    with TemporaryDirectory(prefix="postory-xhs-") as directory:
        reply = Path(directory) / "reply.txt"
        command = [
            executable, "exec", "-C", str(context.data_root),
            "--sandbox", "read-only", "--ephemeral", "--skip-git-repo-check",
            "--output-last-message", str(reply),
        ]
        if config.get("model"):
            command.extend(["--model", config["model"]])
        command.append("-")
        env = dict(os.environ)
        # The existing route uses the local ChatGPT login instead of API credentials.
        env.pop("OPENAI_API_KEY", None)
        env.pop("CODEX_API_KEY", None)
        result = subprocess.run(
            command, input=prompt, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
            env=env, text=True, timeout=timeout, check=False,
        )
        if result.returncode:
            raise RuntimeError(f"Codex 生成失败（退出码 {result.returncode}），请检查本地 CLI 登录")
        if not reply.is_file() or not (text := reply.read_text(encoding="utf-8").strip()):
            raise RuntimeError("Codex 未返回草稿")
        return text
