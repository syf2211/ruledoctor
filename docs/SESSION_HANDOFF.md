# Claude 会话交接文档：AI coding tools pain points

> 会话标题：**AI coding tools pain points**  
> 转录路径：`/Users/syf/.claude/projects/-Users-syf-Downloads/f9df071c-de89-492b-9479-f3285f1567d7.jsonl`  
> CLI Session ID：`f9df071c-de89-492b-9479-f3285f1567d7`  
> 最后活动：2026-06-16（`/goal` 完成后 RuleDoctor MVP 收尾）  
> 项目落地目录：`/Users/syf/Downloads/rule-doctor/`

---

## 一、背景与最初目标

用户要跑一条「挖痛点 → 选题 → 开源获 star」流水线，对 **Claude Code、Codex、Gemini CLI、OpenCode、Cursor、Cline** 等主流 AI 编程工具做系统调研。

**核心筛选标准（不是罗列所有问题）：**

1. 问题仍未被很好解决（issue 长期 open、反复抱怨）
2. 网上没有成熟、公认的开源方案
3. 有足够关注度（跨社区、跨工具复现）
4. **排除**已被辅助工具吃掉的赛道（例如 CCSwitch 类模型切换、splitrail 类成本红海、no-amnesia 类 compaction 快照、7 个静态 rules linter 红海）

**用户确认的范围：**

- 信息源：中英文社区并重
- 工具：全部主流 AI 编程工具
- 交付：先广撒网候选池，再分别做「小工具」与「研究型」shortlist

**后期追加约束（2026-06-15）：**

选题需同时满足：（1）社区有人要 （2）问题真实存在 （3）做出来方便宣传获 star。

用户选定方向 **「规则运行时校验 / RuleDoctor」**，并要求：讲清问题、准备小红书宣传图、把项目做到「产品 + 宣传」都有竞争力（2026-06-16 `/goal`）。

---

## 二、已完成工作摘要

### 阶段 A：深度调研（deep-research workflow）

- Run ID：`wf_a5842f2d-8c8`，约 109 agents，产出 11 条高置信发现
- **强项**：Claude Code compaction/resume 痛点链、Cline 可靠性集群
- **弱项**：Gemini/OpenCode/Cursor/Windsurf 等一手 issue 覆盖不足；部分 verify 因限流 429；Reddit MCP ECONNRESET；智谱 WebSearch 月配额 1310 耗尽

### 阶段 B：`mine-painpoints` 补缺口

- GitHub MCP 补搜 Gemini CLI、OpenCode、Cursor 等
- 输出 **11 个候选问题** 完整清单（见会话 line ~80 附近 assistant 长文），含来源链接、抱怨摘要、竞品判断、方案与价值
- 附 **小工具 / 研究型** 双 shortlist（同一段交付物内）

### 阶段 C：三标准重筛 + 选题收敛（2026-06-15）

用 GitHub MCP + MiniMax `web-search` skill 做竞品核实后收敛：

| 裁决 | 方向 |
|------|------|
| ✅ 首选 | **规则运行时校验**（静态 linter 检查「文件写得好不好」；RuleDoctor 查「有没有被读到并遵守」） |
| ✅ 次选 | 会话救援 / resume 死锁（4 个先例均 ≤3★，但受众更窄） |
| ❌ 放弃 | compaction 快照（no-amnesia）、成本（splitrail 197★）、静态 rules lint（7 个红海）、diff 库 |

### 阶段 D：宣传物料（2026-06-16 上午）

- HTML 模板：`docs/promos/`（01–04 + github-banner + styles.css）
- PNG 成品：`docs/01-cover.png` … `docs/04-solution.png`，根目录 `github-banner.png`
- 报告样例图：`docs/report-sample.png`
- 问题讲解 + 小红书文案骨架（会话中写过；仓库内 **`POST.md` 曾遗漏，已由 Cursor 接手补全**）

### 阶段 E：RuleDoctor MVP（2026-06-16 `/goal` 后）

路径：`/Users/syf/Downloads/rule-doctor/`

| 项 | 状态 |
|----|------|
| CLI：读率（Claude Code `.jsonl`）+ 遵守率（确定性 checker）+ terminal/json/html 报告 + CI gate | ✅ |
| Demo `examples/demo-project/` 稳定 **37/100**（与宣传「37% 没读到」一致） | ✅ |
| TypeScript strict、**20/20** 测试、GitHub Actions CI | ✅ |
| README（差异化、架构、局限、roadmap） | ✅ |
| Git 初始提交 / 远程仓库 / npm 发布 | ❌ 未做 |
| Cline/Cursor/Gemini session adapter | ❌ roadmap |
| `--probe` 真探针（测「理解」而非 token 到达） | ❌ roadmap |

会话**最后一条** assistant 消息（2026-06-16 13:53 UTC）：认为 MVP + 宣传已「够打」，询问是否继续做 adapter；**用户未再回复**。

---

## 三、当前问题与卡点

1. **调研覆盖面偏差**：一手证据仍偏 Claude Code + Cline；Reddit/中文社区在当轮环境取证不完整（需 MiniMax web-search / 代理 Reddit skill 补采）。
2. **仓库**：已发布至 https://github.com/syf2211/ruledoctor（`gh` 安装在 `~/.local/bin/gh`）。
3. **文档路径漂移**：早期交付写 `rule-doctor/01-cover.png`，实际竖版在 **`docs/`**；接手时需统一 README/发帖指引。
4. **产品边界需对外诚实**：读率 = 规则文本是否进入 transcript（强证据），≠ 模型是否理解；遵守率依赖 `.ruledoctor.json` 配置的 checker。
5. **环境**：当前机器无 `gh` CLI，自动建库需用户安装或网页创建。

---

## 四、后续任务清单

### P0（发布闭环）

- [ ] `git add` + 初始 commit（含 `src/`、`test/`、`docs/`、`examples/`，排除 `node_modules`）
- [ ] 创建 GitHub 仓库并 `git push`（或改名 README 中的 org/repo）
- [ ] 核对 npm 包名 `ruledoctor` 是否可用 → `npm publish` 或 scoped package

### P1（增长与一致性）

- [ ] 按 `POST.md` 发小红书/掘金（图：`docs/01`–`04` + `github-banner.png`）
- [ ] README 增加 `docs/` 宣传资源链接；可选把 painpoints 调研摘要存档为 `docs/PAINPOINTS_RESEARCH.md`

### P2（产品加深）

- [ ] Cursor/Cline session log adapter（扩大 TAM）
- [ ] `--probe` 模式（会话内注入探针问题）
- [ ] 与 7 个静态 linter 的对比表放进官网/README（已有文字，可做成图）

### P3（调研流水线续作）

- [ ] 用 `mine-painpoints` + web-search 补 Reddit/中文证据，更新候选清单
- [ ] 次选方向「会话救援」若要做，可单独开 repo（与 RuleDoctor 解耦）

---

## 五、Cursor 接手后如何推进（执行顺序）

1. **验证基线**（已完成）：`npm test && npm run typecheck && npm run build`；demo 跑 37/100。
2. **补文档缺口**：`POST.md`、`SESSION_HANDOFF.md`（本文档）。
3. **发布**：本地 commit → 用户创建 `ruledoctor/ruledoctor`（或指定 org）→ push → 打开 CI。
4. **传播**：用现成 PNG + POST 文案首发；README 顶部 banner 已就绪。
5. **迭代获客**：优先 **Cline adapter**（用户群与「规则不生效」叙事接近），再 Cursor。
6. **保持调研资产**：painpoints 长文留在 Claude jsonl；需要时导出为 `docs/PAINPOINTS_RESEARCH.md` 供下一轮 `painpoint-to-oss`。

---

## 六、关键路径速查

```bash
cd /Users/syf/Downloads/rule-doctor
npm install && npm run build
node dist/index.js --cwd examples/demo-project --session examples/demo-project/session.jsonl
node dist/index.js --cwd examples/demo-project --session examples/demo-project/session.jsonl --format html --out report.html
```

宣传图：`docs/01-cover.png` … `docs/04-solution.png`，`github-banner.png`，文案：`POST.md`。
