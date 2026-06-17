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
cd your-project
npx ruledoctor setup -p .    # 生成 CLAUDE.md 模板 + 可选 Hook（需先 npm i -g ruledoctor）
```

---

## 怎么算「已经生效」？

你应该**在对话里**看到类似行为（而不是只看终端分数）：

- 助手第一句话附近会提到：规则来自哪个文件、本场禁止什么。
- 你让它 `git push --force` → 它**拒绝**并说明原因。
- 你说「上下文被压缩了」→ 它**重新打开**规则文件。

没看到这些？看 [用户指南 · 没生效怎么办](docs/用户指南.md#没生效怎么办)。

---

## 可选：CLI 自查（给想核对的人）

```bash
npm i -g ruledoctor
cd your-project
ruledoctor --cwd . --last-session
```

报告含义用人话说明：[docs/分数是什么意思.md](docs/分数是什么意思.md)

仓库里还有一个**固定演示数据** `examples/demo-project`（用于测试，不代表你的电脑上的某次聊天）。

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
