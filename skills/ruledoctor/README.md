# ruledoctor（Agent Skill）

**让编程助手在改代码前先读项目规则，并遵守你声明的硬约束。**

| | |
|---|---|
| **解决什么问题** | 写了 `CLAUDE.md` / `.cursorrules` 但助手仍乱改、忘读深层文档、危险 push |
| **你需要什么** | Claude Code、Codex CLI 或 Cursor（开启 Agent Skills） |
| **核心文件** | 本目录下的 **`SKILL.md`**（仅此一个文件即完整 Skill） |

---

## 安装

```bash
git clone https://github.com/syf2211/ruledoctor.git
cp -R ruledoctor/skills/ruledoctor ~/.claude/skills/
cp -R ruledoctor/skills/ruledoctor ~/.codex/skills/
# Cursor：~/.cursor/skills/ 或 项目 .cursor/skills/
```

或使用 skills 生态：

```bash
npx skills add syf2211/ruledoctor --skill ruledoctor -g -y
```

**新开一场对话**，在有规则文件的项目里试一句小需求，看助手是否先报「读了哪些文件 + 最多 3 条硬约束」。

---

## 使用方式（你不需要背 SKILL.md）

1. 在项目里放好规则文件，或在 `.ruledoctor.json` 配置 **`required_reads`**（必读清单，不扫全库）。
2. 正常用 Agent 写代码；Skill 会在匹配场景时让助手先 Read 再动手。
3. 需要完整规则摘要时，在对话里说「展开全部规则」。

可选（**不是**装 Skill 的必做步骤）：

- **CLI**：事后用会话日志自查 → 见仓库根 [README](../../README.md#可选-cli-与-hook)。
- **Hook**：硬拦 `git push --force` 等 shell → [Hook 是什么？](../../docs/Hook是什么.md)

---

## 文档

- [用户指南（中文）](../../docs/用户指南.md)
- [Hook 是什么？](../../docs/Hook是什么.md)
- [分数是什么意思？](../../docs/分数是什么意思.md)

---

## 本仓库其它目录（Skill 用户可忽略）

| 目录 | 用途 |
|------|------|
| `skills/ruledoctor/` | **你只装这个** |
| `src/`、`test/` | CLI 开发与 CI |
| `scripts/`、`plugin/` | 可选 Hook / Claude 插件 |
| `docs/internal/` | 维护者研究笔记 |
