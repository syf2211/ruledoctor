# Session: Agent Skills 分发渠道调研 (2026-06-17)

## 目标
为 RuleDoctor README 改写收集 2025–2026 Skills 推广/分发模式（多渠道对比 + 示例 URL）。

## 方法
- MiniMax `web-search` 多组查询（skills.sh、Cursor、anthropics、Codex、CC Switch、安装教程）
- curl 拉取 anthropics/skills、obra/superpowers、Composio awesome、OpenSkills、CC Switch README 首屏
- Exa MCP 补充 vercel-labs/skills、skills.sh 页面要点

## 主要结论（简）
- **skills.sh + npx skills** 成为跨 60+ agent 的 de facto 包管理器
- **官方 anthropics/skills**：插件市场 `/plugin marketplace add` + skills.sh badge
- **obra/superpowers**：方法论叙事 + 多 harness 分节安装 + 官方 marketplace
- **Cursor**：原生 `~/.cursor/skills/` + OpenSkills（AGENTS.md）或 `npx skills -a cursor`
- **CC Switch**：GUI Skills 管理（非主要发现渠道，偏分发/同步）
- **Composio awesome**：策展列表 + 横幅 CTA，分类目录

## 交付
父 agent 子任务：中文 bullet 报告 + 3–5 示例 URL
