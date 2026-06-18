<p align="center">
  <a href="https://skills.sh/syf2211/ruledoctor"><img src="https://skills.sh/b/syf2211/ruledoctor" alt="skills.sh" /></a>
</p>

<p align="center">
  <img src="github-banner.png" alt="RuleDoctor" width="880" />
</p>

<h3 align="center">Agent Skill：让助手先读项目规则，再改代码</h3>

<p align="center">
  <strong>一句话：</strong>装了 Skill、新开对话后，助手会先 Read <code>CLAUDE.md</code> / <code>.cursorrules</code> / 你配置的必读清单，再改仓库。
</p>

<p align="center">
  <strong>核心产物：</strong> <code>skills/ruledoctor/SKILL.md</code> — 复制一个文件夹即可安装。<br/>
  同仓库还提供<strong>可选</strong> CLI（事后体检）与 Hook（危险 shell 硬拦），不必为了用 Skill 而装它们。
</p>

<p align="center">
  <a href="skills/ruledoctor/README.md"><strong>Skill 安装说明</strong></a>
  ·
  <a href="docs/用户指南.md">用户指南</a>
  ·
  <a href="docs/Hook是什么.md">Hook 是什么？</a>
  ·
  <a href="https://skills.sh/syf2211/ruledoctor/ruledoctor">skills.sh 页面</a>
</p>

<p align="center">
  npm 上尚无 <code>ruledoctor</code> 包（<code>npm i -g ruledoctor</code> 会 404）。<br/>
  Skill 用 GitHub / <code>npx skills add</code>；CLI 用 <code>npm i -g github:syf2211/ruledoctor</code> 或 clone 后 <code>npm link</code>。
</p>

---

## 这个 Skill 解决什么问题？

| 烦事 | Skill 帮你 |
|------|------------|
| 有 `CLAUDE.md` 但助手不读 | 开场 **Read** 根规则 + `.ruledoctor.json` 里的 **`required_reads`** |
| 开场复述一整篇规则 | **默认**只报：读了哪些文件 + **最多 3 条**硬约束（你说「展开」才长篇） |
| 聊久了像忘了规矩 | 你说上下文被压缩 → **重新 Read** |
| 危险 `git push --force` | Skill 应口头拒绝；要 **宿主硬拦** 见下方 Hook |

---

## 安装（30 秒）

```bash
npx skills add syf2211/ruledoctor@ruledoctor -g -y
```

```bash
git clone https://github.com/syf2211/ruledoctor.git
cp -R ruledoctor/skills/ruledoctor ~/.claude/skills/
cp -R ruledoctor/skills/ruledoctor ~/.codex/skills/
# Cursor → ~/.cursor/skills/ 或项目 .cursor/skills/
```

**新开对话**，在有规则文件的项目里试一个小任务。  
CC Switch：仓库 `syf2211/ruledoctor`，子目录 **`skills`** → [说明](docs/CC-Switch-安装.md)。

项目还没有规则？可用 CLI 生成模板（可选）：

```bash
cd ruledoctor && npm install && npm run build
node dist/index.js setup -p /path/to/your-project
```

在 `.ruledoctor.json` 里配置 `required_reads`，例如 `docs/agent_workflow_protocol.md`。

---

## Skill / CLI / Hook 怎么分工？

| 层 | 干什么 | 抽象规则（中文、汇报、验证说明） | 命令式规则（force push） |
|----|--------|----------------------------------|---------------------------|
| **Skill** | 提醒读规则、口头拒绝 | **主要靠这个** | 软拒绝 |
| **Hook** | 会话节点跑脚本 | **不能**拦「回复没写验证」 | **可硬拦** Bash |
| **CLI** | 扫 jsonl 出报告 | 仅启发式/读到率 | 事后核对 |

「必须用中文、做完要汇报」**不能**靠当前 Hook 在发消息/出回复时自动发现或补全。机制说明见 **[Hook 是什么？](docs/Hook是什么.md)**。

---

## 可选：CLI 与 Hook

**只装 Skill 就够用** 的情况最多。需要时再装：

```bash
npm i -g github:syf2211/ruledoctor
ruledoctor --cwd your-project --last-session   # 事后报告
```

Hook（注入规则锚点、拦 shell、结束出报告）：

```bash
node dist/index.js setup -p /path/to/your-project
```

详见 [Hook 是什么？](docs/Hook是什么.md) · [用户指南](docs/用户指南.md)。

---

## 典型场景

| 场景 | 助手应表现 |
|------|------------|
| 项目有 `CLAUDE.md` | 先报读了哪些文件 + ≤3 条硬约束，再改代码 |
| 规范在 `docs/` 深处 | 配置 `required_reads` 后会 Read，不扫全库 |
| 上下文被压缩 | 重新 Read 并简短汇报 |
| 要求 force push | 拒绝（硬拦需可选 Hook） |

截图与宣发清单：[docs/宣发与分发.md](docs/宣发与分发.md)

---

## 怎么算生效？

- 默认开场：**文件列表 + ≤3 条硬约束**。
- `required_reads` 里的路径会被 Read（若存在）。
- 要求 force push → 应拒绝（硬拦需 Hook）。

[没生效怎么办 →](docs/用户指南.md#没生效怎么办)

---

## 仓库里其它东西（Skill 用户可忽略）

| 路径 | 用途 |
|------|------|
| **`skills/ruledoctor/`** | **你要安装的 Skill** |
| `docs/` | 用户文档 + [仓库结构说明](docs/仓库结构说明.md) |
| `src/`、`test/` | CLI 开发与测试（CI） |
| `scripts/`、`plugin/` | Hook / Claude 插件 |
| `docs/internal/` | 维护者笔记 |

---

## License

MIT
