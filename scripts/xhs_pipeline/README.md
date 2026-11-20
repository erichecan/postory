# PoStory 小红书生成器

从已有的公开采集素材或本地经营资料生成封面、图卡和发布文案。每篇选择一条长期故事线：主动营销、经营算账或咨询塑造品牌。

1. 安装 Python 3.10+ 和 Pillow（`python3 -m pip install -r scripts/xhs_pipeline/requirements.txt`），准备已用 ChatGPT 登录的 Codex CLI。
2. 沿用 Mac 上已有的 `~/.config/xhs-pipelines/pipelines.json`，或用 `--config` 指定外部配置。使用其中启用的 `postory-xhs` 及其素材、数据目录和模型设置。配置、登录状态、客户素材和草稿留在本机。
3. 可用 `POSTORY_XHS_MASCOT_DIR` 指向现有角色目录（包含 `poses/*.png`）。默认寻找仓库内的 `assets/postory-xhs/mascot/`。缺少合适姿势时，封面使用与标题对应的图解。

```sh
python3 scripts/xhs_pipeline/generate.py --brief '周六路过的人多，为什么没人进店？'
```

输出保存在配置数据目录的 `drafts/` 下，状态为 `needs_human_review`。这个入口只生成待审核草稿。Mac 上已有的采集、审核和发布任务需单独核对运行路径。
