# 真实 Demo：code4Mac × Codex 会话

这不是 `examples/demo-project` 里的假 jsonl，而是你本机已有的一次 Codex 工作会话。

## 证据链

| 项 | 路径 / 值 |
|----|-----------|
| 项目 cwd | `/Users/syf/Desktop/code4Mac` |
| 规则来源 | `.cursorrules` + `.cursor/rules/ai-operating-context.mdc` |
| Codex 会话 | `~/.codex/sessions/2026/06/15/rollout-2026-06-15T21-32-03-019ecb7b-692b-7750-9810-5f8cc5daa06d.jsonl` |
| 会话 meta cwd | `/Users/syf/Desktop/code4Mac`（首行 `session_meta`） |

## 规则里要求、但这场会话没做到的事（Skill 要解决的「真问题」）

`.cursorrules` 要求动手前先读：

- `~/.config/ai-operating-context/README.md`
- `~/Desktop/three-machine-ssh-access.md`

对这场 rollout 做读到率扫描（仅统计 transcript，不调模型）：

```
● R18  ~/.config/ai-operating-context/README.md     读到   0%
● R20  ~/Desktop/three-machine-ssh-access.md        读到   0%
```

而「macmini / NetBird / ssh 别名」类条目多为 **100%** —— 说明 **部分规则进了上下文，关键约束被忽略**。这正是 Skill 要改的**行为**（见 `skills/ruledoctor/SKILL.md` 触发后第 2、3 步），而不是再出一份「90 分很好看」就结束。

## 复现命令

```bash
cd "/Users/syf/Desktop/RuleDoctor工作区/rule-doctor"
npm run build
node dist/index.js --cwd /Users/syf/Desktop/code4Mac \
  --session "$HOME/.codex/sessions/2026/06/15/rollout-2026-06-15T21-32-03-019ecb7b-692b-7750-9810-5f8cc5daa06d.jsonl" \
  --rules /Users/syf/Desktop/code4Mac/.cursorrules
```

## 装上 Skill 后，你在下一场 Codex/Claude 里应**肉眼看到**的行为

在 **code4Mac** 开新会话，并确保已安装 `~/.codex/skills/ruledoctor` 或 `~/.claude/skills/ruledoctor`：

1. **会话开头**：Agent 主动列出当前项目规则来源（`.cursorrules` / `.cursor/rules`），并 **Read** 上述两个路径（若存在）——不要等用户问 Mac mini IP。
2. **你说「推到远端」且带 force**：Agent **拒绝执行**，并引用项目或 `.ruledoctor.json` 中的禁止项。
3. **你说「上下文被压缩了」**：Agent **重新 Read** 规则文件，并用一句话复述仍生效的硬约束。

若只有「终端里 90/100」而没有 1–3，那只是审计 CLI，不是 Skill 生效。

## 与 CLI 的关系

- **Skill** = 改变 Agent 当下怎么做（读规则、拒绝、复述）。
- **`ruledoctor` CLI** = 事后用日志证明「当时读没读到」（本页上面的 R18/R20 即为证）。

用户没要求审计时，Agent **不要**主动跑 CLI 刷屏。
