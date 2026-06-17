---
name: ruledoctor
description: >-
  Enforces project coding rules after context compaction and blocks forbidden shell commands via user hooks.
  On first use run bootstrap (node .../bootstrap.mjs or ruledoctor bootstrap-skill) then ruledoctor setup -p .
  Use in every coding session when CLAUDE.md, AGENTS.md, .cursorrules, RuleDoctor, 规则, compaction, or compliance matters.
---

# RuleDoctor（装上就要真管用）

## 安装后 30 秒内必做（Agent 替用户执行，不要只口头说）

```bash
node ~/.claude/skills/ruledoctor/scripts/bootstrap.mjs
# 或已装 CLI：ruledoctor bootstrap-skill
cd "<项目根>" && ruledoctor setup -p .
```

- **bootstrap**：把 reinject / rule-guard / session-end 写进 `~/.claude/settings.json` 与 `~/.cursor/hooks.json`（一次即可，幂等）。
- **setup**：在当前项目生成规则 + `.ruledoctor.json` + 项目级 Hook。

若用户刚从 CC Switch 安装本 Skill、尚未 bootstrap：**本会话第一件事**就是跑上面两条，再写代码。

## 装上之后实际发生什么（不是文档）

| 时机 | 行为 |
|------|------|
| 每次 SessionStart / compaction 前 | `reinject-rules.mjs` 把 `CLAUDE.md`（或 skill 内置 `rules-anchor.md`）塞回 `additionalContext` |
| 每次 Bash / shell | `rule-guard.mjs` 拒绝 `push --force` / `push -f` 及 `.ruledoctor.json` 里的 forbid-command |
| 会话结束 | `session-end.mjs` 跑体检 → `.ruledoctor/last-report.html` |

## Agent 硬性要求（本 Skill 生效时）

1. 未 bootstrap → **先 bootstrap**，未 setup → **先 setup**，再动代码。
2. Hook 拒绝命令 → 换安全做法，**不得**换写法绕过（例如 `git push -f` 改别名）。
3. compaction / 长会话后 → 主动 Read `CLAUDE.md`；若用户抱怨忘了规则 → 确认 PreCompact hook 已装。
4. 任务结束前 → 无报告则 `ruledoctor --cwd . --last-session` 并摘要违规项。

## CC Switch

添加 `syf2211/ruledoctor`，子目录 `skills`，安装 **ruledoctor**（必须含 `scripts/` 与 `rules-anchor.md`）。

`ccswitch://v1/import?resource=skill&app=claude&name=ruledoctor&repo=syf2211/ruledoctor&directory=skills&branch=main`

## 文件

| 路径 | 作用 |
|------|------|
| `scripts/bootstrap.mjs` | 用户级 Hook 安装 |
| `scripts/reinject-rules.mjs` | 抗 compaction |
| `scripts/rule-guard.mjs` | 强制拦截 |
| `rules-anchor.md` | 无项目规则时的默认硬规则 |

更多：`docs/CC-Switch-技能分发.md`、`docs/使用说明.md`。
