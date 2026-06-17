<p align="center">
  <img src="github-banner.png" alt="RuleDoctor" width="880" />
</p>

<h3 align="center">你的 AI 编程规则，到底读没读、守没守？</h3>
<p align="center">
  <b>Cursor · Claude Code · Codex</b> 同一条链路：<strong>强制遵守（Hook）</strong> + <strong>事后体检（报告）</strong>
</p>

<p align="center">
  <a href="docs/demo-showcase.html">打开网页演示（报告 + 录屏）</a>
  ·
  <a href="docs/使用说明.md">中文使用说明</a>
  ·
  <a href="https://github.com/syf2211/ruledoctor">GitHub</a>
</p>

<p align="center">
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-5E5CE6" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-24%20pass-30D158" />
</p>

---

## 一句话

你在 `CLAUDE.md` 里写的规矩，模型**可能根本没进上下文**、**compaction 后被挤掉**、或**看见了仍违反**。RuleDoctor 用会话日志算 **读到率**，用配置检查算 **遵守率**，并用 Hook **在 compaction 后重新注入规则、在跑命令前拦住违禁操作**。

---

## 真实效果对比（装之前 vs 装之后）

### 对比 1：人的直觉 vs 体检结果

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

静态 rules linter 只检查「规则写得好不好」；RuleDoctor 检查 **这一场会话里** 规则有没有出现、有没有踩线。

---

## 安装（按顺序做，才算「真有用」）

### 1. 技能（CC Switch / 手动）

仓库子目录 **`skills/ruledoctor/`**（含 `scripts/` + `rules-anchor.md`）。

CC Switch：添加 `syf2211/ruledoctor`，**Subdirectory = `skills`**，安装 **ruledoctor**。

### 2. 用户级 Hook（一次）

```bash
node ~/.claude/skills/ruledoctor/scripts/bootstrap.mjs
# 或：npm i -g ruledoctor && ruledoctor bootstrap-skill
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
