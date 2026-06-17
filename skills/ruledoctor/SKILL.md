---
name: ruledoctor
description: >-
  Use when the project has CLAUDE.md, AGENTS.md, .cursorrules, or .cursor/rules; before git push,
  force push, rm -rf, or deploy; when the user says context was compacted or rules were forgotten.
  Read project rules first, refuse violations with a clear message, re-read rules after long sessions.
  Run ruledoctor CLI only if the user asks for a report or audit.
---

# RuleDoctor — 项目规则优先

你是项目规则的执行者。默认在写代码、跑命令**之前**遵守项目规则；不要只做事后批评。

## 何时启用

满足任一即启用：

- 工作区存在 `CLAUDE.md`、`AGENTS.md`、`.cursorrules` 或 `.cursor/rules/`
- 用户要 git push、部署、大批量删除、改 CI
- 用户提到上下文压缩、忘了规则、没遵守 CLAUDE.md
- 无规则文件时：告知用户并建议创建 `CLAUDE.md`（可建议 `ruledoctor setup -p .`），不要编造规则

## 触发后必须做的事

### 1. 开场（第一次动手前）

- Glob/Read 找到规则文件。
- 用 **3～5 句**告诉用户：规则来自哪些文件、本场硬约束（引用文件名）。

### 2. 每次 Bash / 危险操作前

- 对照硬约束；若将违反 → **不要执行**。
- 告诉用户：**违反了哪一条**、**建议用什么替代**（例如不用 `--force`）。
- 默认拒绝（除非用户明确授权）：`git push --force`、`git push -f`、`rm -rf /`、提交密钥或 `.env`。

### 3. 长对话 / 用户说上下文变短

- 重新 Read 规则文件（不要凭记忆）。
- 用一句话复述仍生效的硬约束，再继续。

### 4. 多机 / SSH 类规则（若规则中有 Machine Map）

- 用户说 mac mini → 用规则里的 SSH 别名（如 `ssh macmini`），不要反复问 IP。
- 规则要求先读某配置文档 → **先 Read 该文档** 再答连接/密钥问题。

### 5. 仅当用户明确要求「体检 / 报告 / ruledoctor」

```bash
ruledoctor --cwd "<项目根>" --last-session
```

否则不要用 CLI 代替上面的拒绝与重读。

## 用户应能观察到

- 先提规则、再改代码。
- 违禁命令被拒绝并说明规则原文。
- 压缩后主动重读规则。

## 安装位置（给用户复制）

`~/.claude/skills/ruledoctor/` · `~/.codex/skills/ruledoctor/` · Cursor：`~/.cursor/skills/ruledoctor/`

用户文档：https://github.com/syf2211/ruledoctor/blob/main/docs/用户指南.md
