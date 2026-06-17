# 用 CC Switch 安装 RuleDoctor Skill

[CC Switch](https://ccswitch.io) 是桌面工具，可以把 GitHub 上的 Skill 文件夹同步到 Claude、Codex 等应用。

## 步骤

1. 打开 CC Switch → **Skills**
2. **仓库管理** → **添加仓库**
   - Owner：`syf2211`
   - Name：`ruledoctor`
   - Branch：`main`
   - 子目录：`skills`
3. 刷新列表 → 找到 **ruledoctor** → **安装**
4. 在 CC Switch 里选中要同步的 App（Claude / Codex 等）
5. **新开一场对话**（旧对话可能不会加载新 Skill）

## 一键添加仓库（已安装 CC Switch 的 Mac）

在浏览器或终端打开（Claude）：

```
ccswitch://v1/import?resource=skill&app=claude&name=ruledoctor&repo=syf2211/ruledoctor&directory=skills&branch=main
```

Codex 用户把 `app=claude` 改成 `app=codex` 再导入一次。

链接生成器：<https://farion1231.github.io/cc-switch/deplink.html>

## 装好后

阅读 [用户指南.md](用户指南.md) 里的「怎么判断已经生效」。

**说明：** CC Switch 只复制 Skill 文件夹（`SKILL.md`）。不会自动安装命令行 `ruledoctor`；命令行是可选的自查工具。

## CC Switch 会搜整个 GitHub 吗？

不会。它只扫描你添加的仓库列表，以及应用内提供的 **skills.sh** 搜索。要把本仓库加入列表，需要按上面步骤添加，或使用深链接。

维护者说明见 `docs/internal/cc-switch-技能分发-维护者.md`（从原 CC-Switch 技能分发.md 迁移时可读）。
