---
name: ruledoctor
description: >-
  Enforces and audits project coding rules (CLAUDE.md, AGENTS.md, .cursorrules) for Claude Code, Codex, and Cursor.
  Re-injects rules after context compaction, blocks forbidden shell commands via hooks, and runs offline read-rate/compliance
  reports from session logs. Use when the user mentions rules, CLAUDE.md, compliance, compaction, context loss, RuleDoctor,
  规则体检, 遵守规则, or wants the agent to follow team standards after long sessions.
---

# RuleDoctor（规则体检 + 强制遵守）

## 卖点（对用户怎么说）

1. **不只事后打分**：Hook 在 **compaction / 新会话** 时把规则重新写回上下文，解决「聊久了忘了 CLAUDE.md」。
2. **能拦就拦**：`.ruledoctor.json` 里配置的 **forbid-command** 会在执行 `git push --force` 等命令前被 **PreToolUse / beforeShellExecution** 拒绝。
3. **可证明**：会话 jsonl 离线扫描 **读到率**；配置了 checker 才有 **遵守率**（见 `.ruledoctor/last-report.html`）。

## 安装（任选一种）

### A. CC Switch（推荐，Claude + Codex 一键）

CC Switch **不会**爬整个 GitHub。它只扫描：

- 内置/你添加的 **技能仓库**（`owner/name` + 可选 `branch`、`subdirectory`）
- **skills.sh** 公共索引（在「仓库管理」里搜）
- 你手动「添加仓库」后的目录

**添加本仓库：**

1. CC Switch → Skills → 仓库管理 → 添加仓库  
   - Owner: `syf2211`  
   - Name: `ruledoctor`  
   - Branch: `main`  
   - Subdirectory: `skills`（下面有 `ruledoctor/` 文件夹）  
2. 刷新 → 安装 **ruledoctor** 技能  
3. 安装会同步到 `~/.claude/skills/ruledoctor/` 与 `~/.codex/skills/ruledoctor/`（取决于你在 CC Switch 里选的应用）

**一键添加仓库（深链接，在已安装 CC Switch 的 Mac 上打开）：**

```
ccswitch://v1/import?resource=skill&app=claude&name=ruledoctor&repo=syf2211/ruledoctor&directory=skills&branch=main
```

Codex 把 `app=codex` 再开一次即可。

### B. Claude Code 插件（含 Hooks）

```bash
claude plugin marketplace add syf2211/ruledoctor
# 或本地：/plugin install ruledoctor@<path-to-repo>/plugin
```

### C. Cursor

复制或软链到项目：

```bash
mkdir -p .cursor/skills
cp -R path/to/ruledoctor/skills/ruledoctor .cursor/skills/ruledoctor
```

并在项目跑：`ruledoctor setup -p .`（写入 `.cursor/hooks.json`）。

### D. npm CLI

```bash
npm i -g ruledoctor
ruledoctor setup -p /your/project
```

## 项目内必做（Agent 帮用户执行）

在用户**项目根**（不是 ruledoctor 源码仓）运行：

```bash
ruledoctor setup -p .
```

这会生成/保留规则文件、`.ruledoctor.json`，并安装：

- SessionEnd / sessionEnd → 自动 HTML 报告  
- SessionStart + **PreCompact** → `reinject-rules.mjs`（抗压缩）  
- PreToolUse Bash + beforeShellExecution → `rule-guard.mjs`（强制拦截）

## Agent 必须遵守的行为（装上本 Skill 后）

1. **会话开始或用户提到 compaction/上下文丢了**：确认项目已 `setup`；必要时 Read `CLAUDE.md` 与 `.ruledoctor.json`。
2. **每次准备跑破坏性 git / 部署命令**：对照 `.ruledoctor.json`；Hook 拒绝时向用户解释并给安全替代方案。
3. **长任务结束前**：若 Hook 未触发，主动运行 `ruledoctor --cwd . --last-session` 并摘要红灯规则。
4. **规则与用户指令冲突**：先说明冲突，再执行；不要静默违反 `CLAUDE.md` 硬性条目。

## 文件位置

| 路径 | 作用 |
|------|------|
| `CLAUDE.md` / `AGENTS.md` / `.cursorrules` | 规则来源（明文） |
| `.ruledoctor.json` | 可执行的遵守检查（forbid-command 等） |
| `.ruledoctor/last-report.html` | 最近一次体检 |
| 仓库 `scripts/reinject-rules.mjs` | compaction 后重新注入 |
| 仓库 `scripts/rule-guard.mjs` | 命令拦截 |

详细说明：`docs/使用说明.md`、`docs/CC-Switch-技能分发.md`。
