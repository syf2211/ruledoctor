# 本机规则与真实会话索引（给 Agent 读）

用户机器上已核对过的路径（2026-06-17）。

## 有规则的真实项目

### `/Users/syf/Desktop/code4Mac`

- `.cursorrules` — Machine Map、SSH 别名、先读 `~/.config/ai-operating-context/`
- `.cursor/rules/ai-operating-context.mdc` — `alwaysApply: true`
- 真实 Codex 会话示例见 `docs/demo/REAL-CODEX-code4Mac.md`

### `/Users/syf`

- `.cursorrules`
- `~/.claude/settings.json`
- `~/.claude/skills/`：`reddit`, `web-search`, `mine-painpoints`, `painpoint-to-oss` 等

### `/Users/syf/Desktop/RuleDoctor工作区/rule-doctor`

- `CLAUDE.md`、`.ruledoctor.json`
- 开发用；历史会话 cwd 未指向此处

## 无项目规则但会话很多

### `/Users/syf/Downloads`

- Claude 顶层约 **21** 场 jsonl
- **无** CLAUDE.md / .cursorrules
- 含「AI coding tools pain points」长会话（RuleDoctor 调研）

## 会话日志位置

| 工具 | 路径模式 |
|------|----------|
| Claude Code | `~/.claude/projects/<encoded-cwd>/*.jsonl` |
| Codex | `~/.codex/sessions/**/rollout-*.jsonl` |
| Cursor | `~/.cursor/projects/**/agent-transcripts/**/*.jsonl` |

审计 CLI（可选）：`ruledoctor --cwd <dir> --last-session`
