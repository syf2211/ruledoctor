---
name: install-ruledoctor
description: >-
  Deprecated alias — use the ruledoctor skill instead. Installs RuleDoctor CLI, setup hooks, and project rules.
  Use when the user asks to install RuleDoctor, 规则体检, or rule compliance tooling.
---

# 安装 RuleDoctor

请改用主技能 **`ruledoctor`**（`skills/ruledoctor/SKILL.md`），内容更全（CC Switch、compaction、强制遵守）。

## 快速步骤

1. 用户项目根：`ruledoctor setup -p .`（或 `npm i -g ruledoctor` 后同上）
2. CC Switch：添加仓库 `syf2211/ruledoctor`，子目录 `skills`，安装 **ruledoctor** 技能
3. 深链接见 `docs/CC-Switch-技能分发.md`

## 三句话交付

- 规则在 `CLAUDE.md` / `.ruledoctor.json`
- compaction 后会重新注入规则；违禁命令会被 Hook 拦住
- 会话结束自动出 `.ruledoctor/last-report.html`
