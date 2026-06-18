<p align="center">
  <a href="https://skills.sh/syf2211/ruledoctor"><img src="https://skills.sh/b/syf2211/ruledoctor" alt="skills.sh" /></a>
</p>

<p align="center">
  <a href="docs/promo/github-banner.png"><img src="github-banner.png" alt="RuleDoctor — 让 AI 先读项目规则，再改代码" width="880" /></a>
</p>

<h3 align="center">开源 Agent Skill：让助手先读你的规则，再改代码</h3>

<p align="center">
  <strong>一句话：</strong>装了 Skill、<strong>新开对话</strong>后，助手会先读 <code>CLAUDE.md</code> / <code>.cursorrules</code> 和你配置的必读文档，再动手改仓库。
</p>

<p align="center">
  <a href="https://skills.sh/syf2211/ruledoctor/ruledoctor"><strong>一键安装</strong></a>
  ·
  <a href="skills/ruledoctor/README.md">Skill 说明</a>
  ·
  <a href="docs/用户指南.md">用户指南</a>
  ·
  <a href="docs/promo/README.md">宣传图与文案</a>
</p>

<p align="center">
  支持 <strong>Claude Code</strong> · <strong>Codex</strong> · <strong>Cursor</strong> · <strong>OpenCode</strong>（via <code>npx skills</code>）<br/>
  npm 包 <code>ruledoctor</code> 尚未发布；Skill 安装不依赖 npm。
</p>

```bash
npx skills add syf2211/ruledoctor@ruledoctor -g -y
```

---

## 为什么需要这个 Skill？

你已经在仓库里写了 `CLAUDE.md`、`.cursor/rules` 或 `AGENTS.md`，但助手仍然可能：

- **没读**就改代码，像规则不存在  
- **嘴上答应**「按规范完成」，测试和提交习惯却对不上  
- **聊久了忘记**项目禁忌，尤其是上下文被压缩之后  

RuleDoctor 把「读规则」变成 Agent 的**开场动作**：默认只告诉你读了哪些文件、本场几条硬规矩（不长篇刷屏）。需要较真时，还可以用可选工具看规则有没有被遵守、危险命令有没有出现。

---

## 这个 Skill 解决什么问题？

| 你遇到的烦事 | Skill 帮你 |
|--------------|------------|
| 有规则文件但助手不读 | 开场 **Read** 根规则 + **`required_reads`** 清单 |
| 开场复述一整篇 | **默认**只报：文件列表 + **最多 3 条**硬约束 |
| 聊久了像忘了规矩 | 你说上下文被压缩 → **重新 Read** |
| 不知道规则有没有生效 | 可选 CLI 报告（事后核对） |
| 危险 `git push --force` | Skill 应拒绝；**硬拦**见 [Hook](docs/Hook是什么.md) |

---

## 安装

```bash
npx skills add syf2211/ruledoctor@ruledoctor -g -y
```

或手动复制 `skills/ruledoctor` → `~/.claude/skills/`、`~/.codex/skills/`、`~/.cursor/skills/`。

**装好后请新开一场对话**，在有规则文件的项目里试一个小任务。  
CC Switch：仓库 `syf2211/ruledoctor`，子目录 `skills` → [说明](docs/CC-Switch-安装.md)。

还没有规则文件？可选：`node dist/index.js setup -p .` 生成模板（需 clone 仓库并 build）。

---

## 真实效果（预留）

> 以下为占位，便于你后续贴上 Codex / Claude 实机截图。

| | |
|---|---|
| **Codex 测试（待补充）** | 用户提供 `docs/promo/codex-before.png` / `codex-after.png` 后展示于此 |
| **预期表现** | 新对话开场列出已读规则；要求 force push 时拒绝 |

宣传轮播图（小红书 7 张）：[`docs/promo/xhs/`](docs/promo/xhs/)

---

## Skill / CLI / Hook 分工

| 层 | 干什么 |
|----|--------|
| **Skill** | 先读规则、简短汇报、口头拒绝（**装这个就够大多数场景**） |
| **CLI** | 可选，用会话记录做事后核对 |
| **Hook** | 可选，危险 shell 硬拦截、结束出报告 |

详见 [Hook 是什么？](docs/Hook是什么.md) · [用户指南](docs/用户指南.md)

---

## 典型场景

| 场景 | 助手应表现 |
|------|------------|
| 项目有 `CLAUDE.md` | 先报读了哪些文件 + ≤3 条硬约束，再改代码 |
| 规范在 `docs/` 深处 | 配置 `required_reads` 后会 Read |
| 上下文被压缩 | 重新 Read 并简短汇报 |
| 要求 force push | 拒绝（硬拦需 Hook） |

---

## 仓库里其它目录（Skill 用户可忽略）

| 路径 | 用途 |
|------|------|
| **`skills/ruledoctor/`** | 你要安装的 Skill |
| `docs/promo/` | 宣传 PNG、文案、小红书自动化调研 |
| `docs/promos/` | 宣传图 HTML 源码 + `export-png.mjs` |
| `src/`、`test/` | 可选 CLI |
| `docs/internal/` | 维护者笔记 |

---

## License

MIT
