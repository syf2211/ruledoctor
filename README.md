<p align="center">
  <img src="github-banner.png" alt="RuleDoctor" width="880" />
</p>

<h3 align="center">让 Agent 在真实项目里遵守规则 — Skill 改行为，CLI 证事实</h3>
<p align="center">
  <b>Skill</b>（<code>~/.claude/skills/ruledoctor</code> / <code>~/.codex/skills/ruledoctor</code>）定义<strong>何时触发、触发后做什么</strong><br/>
  <b>CLI</b>（<code>ruledoctor</code>）可选：用<strong>你本机已有</strong>的 Claude/Codex jsonl 做读到率审计
</p>

<p align="center">
  <a href="docs/demo/REAL-CODEX-code4Mac.md"><strong>真实 Demo（code4Mac + 你的 Codex 会话）</strong></a>
  ·
  <a href="docs/research/real-sessions-scan.md">本机会话扫描</a>
  ·
  <a href="skills/ruledoctor/SKILL.md">Skill 正文</a>
</p>

<p align="center">
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-5E5CE6" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-24%20pass-30D158" />
</p>

---

## 一句话

**Skill** 让 Claude/Codex 在真实仓库里：先读 `.cursorrules` / `CLAUDE.md`、违禁命令当场拒绝、compaction 后重读规则。  
**CLI** 用你电脑上已有的会话日志回答：「那场对话里，规则文本到底有没有出现？」——例如本机 **code4Mac** 真实 Codex 会话里，要求先读的 `ai-operating-context` README **读到率 0%**（见下）。

---

## 真实 Demo（不是 examples/demo-project）

本机已扫描：**21 场 Claude 在 Downloads（无规则文件）**、**13 场 Codex 在 code4Mac（有 `.cursorrules`）**。见 [`docs/research/real-sessions-scan.md`](docs/research/real-sessions-scan.md)。

### 你的 code4Mac + 真实 Codex rollout

```bash
npm run build
node dist/index.js --cwd /Users/syf/Desktop/code4Mac \
  --session "$HOME/.codex/sessions/2026/06/15/rollout-2026-06-15T21-32-03-019ecb7b-692b-7750-9810-5f8cc5daa06d.jsonl" \
  --rules /Users/syf/Desktop/code4Mac/.cursorrules
```

| 直觉 | 这场真实会话的审计 |
|------|-------------------|
| 「别名规则应该都记住了」 | macmini / NetBird 等条目 **读到 ~100%** |
| 「该看的文档也看了吧」 | 要求先读的 `README.md` / `three-machine-ssh-access.md` **读到 0%** |

**Skill 应改的行为**：开场 **Read** 那两份文件；而不是只给你看「90/100」。完整说明：[`docs/demo/REAL-CODEX-code4Mac.md`](docs/demo/REAL-CODEX-code4Mac.md)

### 安装 Skill（本机）

```bash
cp -R skills/ruledoctor ~/.claude/skills/
cp -R skills/ruledoctor ~/.codex/skills/
```

然后在 **code4Mac** 开新 Codex/Claude 会话，观察 Agent 是否按 [`skills/ruledoctor/SKILL.md`](skills/ruledoctor/SKILL.md) **§2** 执行（先报硬约束、拒绝 force push、compaction 后重读）。

---

## 合成演示（仅用于 CI / 固定分数）

`examples/demo-project` 是**故意编造**的 37/100 故事板，用于回归测试，**不代表你本机任何一场会话**：

```bash
node dist/index.js --cwd examples/demo-project --session examples/demo-project/session.jsonl
```

---

## 旧版 README 片段（Hook + 假会话对比）

<details>
<summary>展开：Hook 与 demo-project 对比（次要）</summary>

### 对比 1：人的直觉 vs 体检结果（demo-project 合成数据）

| 你聊完一场 Agent 会话后的直觉 | RuleDoctor 同一场会话的报告 |
|------------------------------|----------------------------|
| 「它应该看过 CLAUDE.md 吧」 | **R4 读到 25%** → 这条规则大概率**没进上下文**（不是「故意不听话」） |
| 「规则都说了禁止 force push」 | **R6 读到 100% 但遵守 ✗** → **读到了仍执行了** `git push --force`（最要命的一类） |
| 「整体还行，打个 80 分」 | 演示会话固定 **37/100 不及格**，并列出 4 条违规 + 未进上下文的规则 |

下面这段输出是仓库里 **`examples/demo-project`** 的假会话跑出来的，**你 clone 后一条命令就能复现**（不是 PPT 数字）：

```bash
npm install && npm run build
node dist/index.js --cwd examples/demo-project --session examples/demo-project/session.jsonl
```

```
  RuleDoctor · 规则体检
  37/100  不及格 ⚠    读到率 63%  ·  遵守率 20%  ·  检查 5/8
  ────────────────────────────────────────────────────────────────
  ● R6  仓库禁止执行 git push --force。                     读到 100%   ✗
  ● R4  严禁使用 any 类型。                                 读到  25%   ✗
  ...
  违规详情:
    ✗ R6  会话中出现了被禁止的 force push
```

演示会话里实际发生了什么（`examples/demo-project/session.jsonl`）：

1. 系统里注入了 5 条规则（含禁止 force push）。
2. 助手说「帮你推到远端」，会话里出现 **`git push --force`**。
3. 助手回复「完成！」——**人看聊天很容易觉得没问题**；RuleDoctor 标 **R6 读到但违反**。

HTML 报告样例：[`docs/demo-report.html`](docs/demo-report.html) · 总览页：[`docs/demo-showcase.html`](docs/demo-showcase.html)

---

### 对比 2：只写规则文件 vs 装上 Skill + Hook（强制遵守）

| 场景 | 只有 `CLAUDE.md` | + `bootstrap` + `setup`（见下） |
|------|------------------|--------------------------------|
| 聊很久 / **context compaction** | 规则可能被摘要挤掉，模型「忘了」 | **PreCompact / SessionStart** 自动把规则再写进上下文 |
| 模型要跑 `git push --force` | 可能直接执行 | **PreToolUse / beforeShellExecution** 返回 **deny**（默认就拦 force push） |
| 会话结束 | 你自己猜有没有违规 | 自动写 **`.ruledoctor/last-report.html`**（macOS 可自动打开） |

Hook 拦截示例（`scripts/rule-guard.mjs`，stdin 模拟一次 Bash）：

```json
{"permission":"deny","user_message":"RuleDoctor: 禁止执行 git push --force","agent_message":"RuleDoctor: 禁止执行 git push --force"}
```

**没有跑 bootstrap，只有 SKILL 文字 → 不会 magically 拦命令**；CC Switch 只拷贝文件夹，**必须执行一次 bootstrap**（下面「安装」）。

---

### 对比 3：两种「规则文件」扫同一条真实会话

同一条 Claude 日志，换不同规则 md，分数完全不同（说明工具在看**你声明的规则**，不是瞎编）：

| 规则来源 | 典型结果 | 含义 |
|----------|----------|------|
| 机器上的 `.cursorrules`（别名、工具偏好） | 与调研任务无关，分数不能当「调研守规」依据 | 规则文件要和任务一致 |
| `docs/examples/pain-points-research-rules.md`（调研约束 5 条） | 按该文件算读到率；无 checker 时**不会**假装遵守率 100% | 见 [`docs/examples/实战-你的Claude会话-pain-points.md`](docs/examples/实战-你的Claude会话-pain-points.md) |

---

## 三种死法（demo 里各占一种）

| 类型 | demo 里的例子 | 报告里长什么样 |
|------|---------------|----------------|
| 从没进上下文 | R4 / R5 读到很低 | 「未进入上下文的规则」 |
| 进过上下文后被挤掉 | 长会话 + compaction（靠 **reinject** 缓解） | 后续会话读到率掉下去 |
| 读到了仍违反 | **R6 force push** | 读到 100% + 遵守 ✗ |

静态 rules linter 只检查「规则写得好不好」；CLI 检查 **这一场会话里** 规则有没有出现在 transcript 里。

</details>

---

## 安装

### Skill（产品核心 — 只含 SKILL.md + REFERENCE.md）

```bash
cp -R skills/ruledoctor ~/.claude/skills/
cp -R skills/ruledoctor ~/.codex/skills/
```

CC Switch：`syf2211/ruledoctor`，子目录 `skills`，安装 **ruledoctor**。

### 可选：Hook + CLI（仓库 `scripts/`，不是 Skill 包的一部分）

```bash
npm i -g ruledoctor   # 或在本仓库 npm run build
ruledoctor bootstrap-skill   # 用户级 Hook → scripts/bootstrap.mjs
ruledoctor setup -p /path/to/project
```

---

## 安装（旧：Hook 顺序）

### 1. 技能（CC Switch / 手动）

仓库子目录 **`skills/ruledoctor/`**（仅 `SKILL.md` + `REFERENCE.md`）。

CC Switch：添加 `syf2211/ruledoctor`，**Subdirectory = `skills`**，安装 **ruledoctor**。

### 2. 用户级 Hook（可选）

```bash
ruledoctor bootstrap-skill
# 或：node /path/to/ruledoctor/scripts/bootstrap.mjs
```

### 3. 项目级（每个仓库一次）

```bash
cd your-project
ruledoctor setup -p .
# 或开发本仓库：npm run setup:here
```

### 4. 平时 / 会话结束

```bash
ruledoctor --cwd . --last-session    # 自动找 Claude / Codex / Cursor 最近会话
ruledoctor doctor -p .               # 看能找到哪些会话文件
```

更多分发方式：[`docs/CC-Switch-技能分发.md`](docs/CC-Switch-技能分发.md)

---

## 自己项目试跑

```bash
ruledoctor --cwd /path/to/project --last-session
```

自动发现 `CLAUDE.md` / `AGENTS.md` / `.cursorrules` 和本地会话 jsonl。

遵守检查在 **`.ruledoctor.json`**（`ruledoctor init` 生成模板）。没配置 checker 时，总分**只算读到率**，不会显示假的「遵守 100%」。

---

## CLI 常用参数

```
ruledoctor [options]
  --cwd <dir>           项目根
  --last-session        最近一次会话（Claude / Codex / Cursor）
  --session <path>      指定 jsonl
  --format terminal|json|html
  --out <file>          写出报告
  --min-score <n>       CI：低于 n 分 exit 1

ruledoctor setup -p .       规则模板 + 项目/用户 Hook
ruledoctor bootstrap-skill  用户级 Hook（同 bootstrap.mjs）
ruledoctor doctor -p .      会话发现
ruledoctor init             生成 .ruledoctor.json
```

---

## 架构（给开发者）

```
规则文件 ──► 解析 ──► R1…Rn ──┐
                              ├──► 报告（分数 + 逐条灯色）
会话 jsonl ──► 读到率 ─────────┘
工作区 + jsonl ──► 遵守检查（regex / forbid-command）
Hook ──► compaction 再注入 / 命令 deny / 结束出 HTML
```

---

## 局限（实话）

- **读到率** = 规则关键词是否在 transcript 里出现，不是读心。
- **遵守率** 只对 `.ruledoctor.json` 里配置了的项成立。
- **Skill 不会自动装 Hook**；必须 `bootstrap` + 项目 `setup`。
- 更全边界：[`docs/产品定义-现状与路线图.md`](docs/产品定义-现状与路线图.md)

---

## English (short)

RuleDoctor measures **read-rate** (rule text in session logs) and **compliance** (configured checkers), and ships **hooks** to **re-inject rules after compaction** and **block forbidden shell commands**. Run the demo: `node dist/index.js --cwd examples/demo-project --session examples/demo-project/session.jsonl` → **37/100** with **R6: read but violated force push**. Install: skill → `bootstrap.mjs` → `ruledoctor setup -p .`.

---

## License

MIT · [syf2211/ruledoctor](https://github.com/syf2211/ruledoctor)
