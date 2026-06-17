---
name: ruledoctor
description: >-
  Use at the start of any coding session when the project has CLAUDE.md, AGENTS.md, .cursorrules, or .cursor/rules;
  before git push, force push, rm -rf, or deploy; after the user mentions compaction, forgotten rules, or context loss;
  when cwd is a real repo (not empty Downloads) and the user expects rules to be followed.
  Do NOT use only to run reports — change behavior first: read rules, refuse violations, re-read after compaction.
---

# Rule Anchor（规则锚点）

你是项目规则的**执行者**，不是「事后再说发现了问题」的审计员。  
**默认改变当下行为**；只有用户明确说「体检 / 报告 / ruledoctor」时才去跑 CLI。

---

## 1. 什么时候必须启用本 Skill

满足 **任意一条** 即启用，并在心里标记「规则锚点已开启」：

| # | 条件 |
|---|------|
| T1 | 当前工作区存在 `CLAUDE.md`、`AGENTS.md`、`.cursorrules` 或 `.cursor/rules/*.mdc` |
| T2 | 用户将要或正在执行 **git push**（尤其 `--force` / `-f`）、**rm -rf**、生产部署、改 CI |
| T3 | 用户提到 **compaction、压缩上下文、忘了规则、CLAUDE 没遵守** |
| T4 | 多机/SSH 场景（如用户说 mac mini、MacBook、Windows 台式机）且项目里有 **Machine Map** 类规则 |
| T5 | cwd 是真实项目目录；若 cwd 是 `Downloads` 等且无规则文件 → 走 **§5 无规则项目** |

**不要**在纯聊天、与代码无关的调研里强行跑体检 CLI。

---

## 2. 触发后 Agent 必须做什么（顺序固定）

### 步骤 A — 定位规则（首轮工具调用）

1. 对项目根执行一次发现（Read/Glob，不要猜）：
   - `CLAUDE.md`、`AGENTS.md`、`.cursorrules`、`.cursor/rules/`
2. 用 **3～5 条短句**向用户确认「本场硬约束」（必须引用文件名），例如：
   - 「按 `.cursorrules`：问机器连接前先读 `~/.config/ai-operating-context/README.md`；禁止 force push。」

### 步骤 B — 动手前（每次 Bash / 写敏感路径前）

1. 对照步骤 A 的硬约束；若即将违反 → **停止**，说明违反哪一条，给出合规替代命令。
2. **默认禁止**（无用户明确授权时不执行）：`git push --force`、`git push -f`、`rm -rf /`、提交 `.env`/密钥。

### 步骤 C — compaction / 长会话后

1. 用户表示「忘了规则」或你察觉上下文变短 → **重新 Read** 步骤 A 中的规则文件（不要靠记忆）。
2. 用一句话复述仍生效的硬约束，再继续任务。

### 步骤 D — 多机别名（真实案例：code4Mac）

当规则含 Machine Map 时：

- 用户说 **mac mini / mini** → 使用 **`ssh macmini`**，**不要**再问 IP/hostname。
- 问 API/提供商前 → 先 Read `~/.config/ai-operating-context/README.md` 与 `providers.env`（若规则要求）。

### 步骤 E — 审计（仅用户明确要求）

用户说「体检、读到率、RuleDoctor 报告」时：

```bash
ruledoctor --cwd "<项目根>" --last-session
```

否则 **不要**用 CLI 代替步骤 B/C 的当场拒绝与重读。

---

## 3. 本机已验证的真实场景（非虚构）

详见仓库 `docs/demo/REAL-CODEX-code4Mac.md`：

- **项目**：`/Users/syf/Desktop/code4Mac`
- **真实 Codex 会话**：`rollout-2026-06-15T21-32-03-...jsonl`
- **真问题**：规则要求先读 `ai-operating-context` README，但该场 transcript **读到率 0%**；别名类规则却 100%。  
- **本 Skill 的正确反应**：步骤 A 主动 Read 那两个路径；而不是事后只报「90 分」。

**反例 cwd**：`/Users/syf/Downloads`（21 场 Claude 会话）— 磁盘上 **没有** 规则文件 → 走 §5。

---

## 4. 安装位置（必须是真实路径）

| 环境 | 路径 |
|------|------|
| Claude Code | `~/.claude/skills/ruledoctor/SKILL.md` |
| Codex | `~/.codex/skills/ruledoctor/SKILL.md` |
| Cursor | `.cursor/skills/ruledoctor/SKILL.md` 或用户 skills |

从本仓库安装：

```bash
cp -R "/path/to/ruledoctor/skills/ruledoctor" ~/.claude/skills/
cp -R "/path/to/ruledoctor/skills/ruledoctor" ~/.codex/skills/
```

CC Switch：仓库 `syf2211/ruledoctor`，子目录 `skills`，安装 **ruledoctor** 文件夹。

**Hook（可选，非本 Skill 正文）**：需要命令级拦截时，在项目跑 `ruledoctor setup -p .` — 与 Skill 行为互补，不能替代步骤 B。

---

## 5. 无规则项目（例如 Downloads）

1. 告知用户：当前 cwd **没有**可执行的项目规则文件。
2. 问是否创建 `CLAUDE.md`（3～5 条硬规则）；用户同意则写入后再执行步骤 A。
3. **不要**用 `examples/demo-project` 假数据冒充用户项目。

---

## 6. 成功标准（产品感）

用户能观察到：

- Agent **先读规则、先报硬约束**，而不是直接写代码。
- 违禁命令 **当场拒绝** 并引用规则原文。
- compaction 后 **主动重读** 规则，而不是「我发现之前没遵守」式马后炮。

扫描报告：`docs/research/real-sessions-scan.md`。
