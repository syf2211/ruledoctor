# 本机真实会话扫描（2026-06-17）

数据来源：`~/.claude/projects/**/*.jsonl`（顶层 23）、`~/.codex/sessions/**/rollout-*.jsonl`（64）。

## 结论先说

| 现象 | 事实 |
|------|------|
| Claude 会话最多的 cwd | `/Users/syf/Downloads`（21 场）→ **目录下没有** CLAUDE.md / AGENTS.md / .cursorrules |
| Codex 真实开发项目 | `/Users/syf/Desktop/code4Mac`（13 场 rollout）→ **有** `.cursorrules` + `.cursor/rules/*.mdc` |
| RuleDoctor 仓库 | 规则文件齐全，但 **历史会话 cwd 从未指向该仓库** |
| 用户家目录 `/Users/syf` | 2 场 Claude 会话；**有** `.cursorrules`、`.claude/settings.json`、4 个 `~/.claude/skills/` |

**没有「编造场景」的最佳真实样本**：用 **code4Mac + 真实 Codex rollout** 做读到率演示；用 **Downloads 无规则文件** 说明「只有聊天、没有项目规则」时 Skill 该怎么触发。

## Top cwd（合并 Claude + Codex）

| cwd | 会话数 | 磁盘上的规则文件 |
|-----|--------|------------------|
| `/Users/syf/Downloads` | 21 | 无 |
| `/Users/syf/Documents/Codex/2026-05-14/cursor` | 16 | 无（临时 Codex 工作目录） |
| `/Users/syf/Desktop/code4Mac` | 13 | `.cursorrules`、`.cursor/rules/ai-operating-context.mdc` |
| `/Users/syf` | 2 | `.cursorrules`、`.claude/settings.json`、`~/.claude/skills/*` |
| `/Users/syf/Desktop/RuleDoctor工作区/rule-doctor` | 0 | CLAUDE.md、.ruledoctor.json、skills/ |

## 转录里和「规则」相关的内容

- **Claude `f9df071c-...`（Downloads，682 行）**：大量 RuleDoctor 产品讨论；cwd 下**当时无 CLAUDE.md**。
- **Claude `3edb9977-...`（Downloads，1137 行）**：对话中出现 `.cursorrules`、`CLAUDE.md`、`skill` 字样。
- **Codex code4Mac rollout**：每轮系统注入 `# AGENTS.md instructions`（内容与 ai-operating-context 一致），非磁盘上的 AGENTS.md 文件。

## 真实体检命令（code4Mac）

```bash
cd rule-doctor && npm run build
node dist/index.js --cwd /Users/syf/Desktop/code4Mac \
  --session ~/.codex/sessions/2026/06/15/rollout-2026-06-15T21-32-03-019ecb7b-692b-7750-9810-5f8cc5daa06d.jsonl \
  --rules /Users/syf/Desktop/code4Mac/.cursorrules
```

**真实结果（2026-06-17 复跑）**：90/100 仅读到率；20 条从 `.cursorrules` 拆出的规则里，**R18/R20（要求先读 ai-operating-context README 与 three-machine-ssh-access.md）读到 0%** —— 说明这场真实 Codex 会话里 Agent **没有按规则去读那两份文件**，尽管机器别名等条目 100% 出现在上下文里。

## Demo 建议

1. **行为 Skill 演示 cwd**：`/Users/syf/Desktop/code4Mac`（真实规则 + 真实会话）。
2. **「无规则项目」演示 cwd**：`/Users/syf/Downloads`（Skill 应触发：帮用户落地 CLAUDE.md，而不是跑假 session.jsonl）。
