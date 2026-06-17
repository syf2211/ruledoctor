<p align="center">
  <img src="github-banner.png" alt="RuleDoctor" width="880" />
</p>

<h3 align="center">让 Claude / Codex / Cursor 先读项目规则，再改代码</h3>

<p align="center">
  一个可安装的 <strong>Agent Skill</strong>：提醒助手读 <code>CLAUDE.md</code>、<code>.cursorrules</code> 等，并在危险操作前说不。<br/>
  可选 CLI：用本地会话记录自查「规则有没有出现在对话里」。
</p>

<p align="center">
  <a href="docs/用户指南.md"><strong>用户指南（推荐从这里读）</strong></a>
  ·
  <a href="docs/分数是什么意思.md">分数是什么意思？</a>
  ·
  <a href="https://github.com/syf2211/ruledoctor">GitHub</a>
</p>

<p align="center">
  <strong>安装状态：</strong> npm 上尚无 <code>ruledoctor</code> 包（<code>npm i -g ruledoctor</code> 会 404）。<br/>
  请用下方 <strong>GitHub / skills 目录</strong> 安装 Skill；CLI 用 <code>npm i -g github:syf2211/ruledoctor</code> 或 clone 后 <code>npm link</code>。
</p>

---

## 三层：Skill / CLI / Hook

| 层 | 干什么 | 用户感受 |
|----|--------|----------|
| **Skill**（`skills/ruledoctor`） | 提醒 Agent 读规则 + `required_reads`，默认只报「读了哪些文件 + 3 条硬约束」 | 对话里先读再改、拒绝 force push |
| **CLI**（可选） | 用本地会话 jsonl **事后**核对规则文字有没有出现 | 终端/HTML 报告 |
| **Hook**（`ruledoctor setup`） | shell 层 **硬拦截** 部分命令 | 工具直接 deny，不依赖模型自觉 |

**读规则 ≠ 一定遵守**；真要挡危险命令，请装 Hook。

---

## 标准 Skill 仓库结构

```
skills/
  ruledoctor/SKILL.md    ← 安装这个文件夹
  README.md
AGENTS.md                  ← OpenSkills / Cursor sync 用
scripts/                   ← CLI + 可选 Hook（不是 Skill 包内容）
```

---

## 30 秒看懂

| 你遇到的烦事 | 这个 Skill 帮你做什么 |
|--------------|------------------------|
| 写了 `CLAUDE.md`，Agent 还是乱 push、乱改 | 开场先 **Read 规则文件**，用几句话告诉你「本场硬规矩」 |
| 聊久了像忘了规则 | 你说上下文变短了 → 助手 **重新读规则** 再继续 |
| 你想知道「它到底有没有按规则来」 | 可选：运行 `ruledoctor --last-session` 看报告（**不是**装 Skill 的必做步骤） |

**Skill 改的是 Agent 当场怎么做；CLI 是给你自己看的核对工具。**

---

## 适用谁、适用哪些工具

| 工具 | Skill 装在哪 |
|------|----------------|
| **Claude Code** | `~/.claude/skills/ruledoctor/` |
| **Codex** | `~/.codex/skills/ruledoctor/` |
| **Cursor** | `~/.cursor/skills/ruledoctor/` 或项目 `.cursor/skills/` |

需要图形界面一键装：用 [CC Switch](https://github.com/farion1231/cc-switch) 添加仓库 `syf2211/ruledoctor`，子目录填 **`skills`**，安装 **ruledoctor**。详见 [CC Switch 安装说明](docs/CC-Switch-安装.md)。

---

## 安装（复制即用）

### 方式 A：手动（所有工具通用）

```bash
git clone https://github.com/syf2211/ruledoctor.git
cp -R ruledoctor/skills/ruledoctor ~/.claude/skills/
cp -R ruledoctor/skills/ruledoctor ~/.codex/skills/
# Cursor 用户再复制到 ~/.cursor/skills/ 或项目 .cursor/skills/
```

### 方式 B：npx skills（若你已用 [skills.sh](https://skills.sh) 生态）

```bash
npx skills add syf2211/ruledoctor --skill ruledoctor -g -y
```

（具体 Agent 参数以 skills CLI 当前文档为准。）

### 装好之后，第一步做什么？

1. **关掉当前对话，新开一场**（Skill 在新会话里加载）。
2. 打开**有规则文件的项目**（例如已有 `CLAUDE.md` 或 `.cursorrules` 的目录）。
3. 随便提一个小需求，看助手是否 **先说明读到的规则** 再动手。

若项目里还没有规则文件：

```bash
git clone https://github.com/syf2211/ruledoctor.git
cd ruledoctor && npm install && npm run build
node dist/index.js setup -p /path/to/your-project
```

在 `.ruledoctor.json` 里配置 **`required_reads`**（必读深层文档，不扫全库），例如 `docs/agent_workflow_protocol.md`。

---

## 可选：CLI 自查

```bash
npm i -g github:syf2211/ruledoctor
# 或：cd ruledoctor && npm link
ruledoctor --cwd your-project --last-session
```

报告含义：[docs/分数是什么意思.md](docs/分数是什么意思.md) · 测试数据：`examples/demo-project`（非真实会话）

---

## 怎么算「已经生效」？

- 助手默认只说：**读了哪些文件** + **最多 3 条硬约束**（不是长篇念经）。
- 你让它 `git push --force` → 应**拒绝**（Skill 提醒；要硬拦请 `setup` Hook）。
- 你说「上下文被压缩了」→ 应**重新 Read** 规则与 `required_reads`。

没看到这些？看 [用户指南 · 没生效怎么办](docs/用户指南.md#没生效怎么办)。

---

## 仓库里还有什么

| 路径 | 给谁看 |
|------|--------|
| `skills/ruledoctor/SKILL.md` | Agent 读的执行说明（你不用背） |
| `docs/用户指南.md` | **普通用户主文档** |
| `scripts/` + `ruledoctor setup` | 可选 Hook（命令拦截、结束出 HTML 报告） |
| `docs/internal/` | 开发者/维护者案例与扫描记录 |

---

## License

MIT
