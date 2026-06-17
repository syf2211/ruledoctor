# 实战示例：用你 Mac 上真实的 Claude 会话

## 用的是哪次会话？

| 项 | 值 |
|----|-----|
| 标题 | **AI coding tools pain points** |
| 日志文件 | `~/.claude/projects/-Users-syf-Downloads/f9df071c-de89-492b-9479-f3285f1567d7.jsonl` |
| 行数 | **682 行**（Claude Desktop / Claude Code 写的 JSONL） |
| 当时工作目录 | `/Users/syf/Downloads` |

这就是你截图里第三个会话对应的那份转录。

## 「规则」在这次例子里是什么？

那次会话在 `Downloads` 下**没有** `CLAUDE.md`。  
RuleDoctor **只认明文规则文件**，所以我把你在该会话**第一条消息里口述的调研约束**，整理成了：

`docs/examples/pain-points-research-rules.md`（5 条 bullet）

这不是 Claude 自动注入的 system prompt，而是**人为写进规则文件、用来演示**的——真实项目里你应该把这类约束写在 `CLAUDE.md` / `AGENTS.md` 里。

## 一条命令怎么跑（你可复制）

```bash
cd "/Users/syf/Desktop/RuleDoctor工作区/rule-doctor"

SESSION="$HOME/.claude/projects/-Users-syf-Downloads/f9df071c-de89-492b-9479-f3285f1567d7.jsonl"
RULES="docs/examples/pain-points-research-rules.md"

node dist/index.js \
  --cwd /Users/syf/Downloads \
  --rules "$RULES" \
  --session "$SESSION"
```

HTML 报告：

`docs/examples/你的Claude会话-pain-points-报告.html`

## 输出在说什么？（逐步翻译）

### 1. `read-rate: scanned 682 lines across 1 session log(s)`

工具把你这次会话的 JSONL **逐行 JSON 解析**，把 user/assistant/tool 里的文字拼成一大段文本，**不调模型**。

### 2. 每条规则的「读到 xx%」

以 **R1** 为例：

> 排除已被 **CCSwitch** 等辅助工具解决的「模型切换」类问题……

你的会话 **第 5 行** 用户消息里就写了「例如类似 **CCSwitch**……」——所以关键词在 transcript 里能匹配到，读到率 **91%**。

**R3**「中英文社区」→ 会话里 assistant 多次提到「中英文」「中文社区」，读到约 **64%**（刚过「算读过」的阈值）。

**含义：** 这些约束在对话过程中**确实以文字形式出现过**（多半是你说的或模型复述的），**不是**证明 Claude「内心遵守了」。

### 3. 遵守率全是 `—`

因为 `Downloads` 下没有 `.ruledoctor.json`，**没有配置**「怎么从代码/命令里验违规」。  
所以 **100/100 分在这里没有「遵守」含义**——只是「没配 checker 时遵守项中性满分」。这是 v0.1 容易误导人的地方。

要验「有没有违反」，需要像 demo 那样配 checker，例如禁止某命令、禁止某正则。

### 4. 对比实验：用错的规则文件

若用你家目录的 `~/.cursorrules`（写的是 `macmini`、SSH 别名）去扫**同一份**痛点调研会话：

- 那些机器别名在会话里几乎不出现 → **读到率接近 0**
- 说明：**规则文件必须和任务相关**；工具不会自动知道「该用哪份 rules」

## 和「demo 37 分」的差别

| | 痛点会话示例 | `examples/demo-project` |
|--|----------------|-------------------------|
| 规则 | 你口述的调研约束 | 假想的 `.cursorrules` 订单规范 |
| 会话 | 你真实的 682 行 jsonl | 合成的 4 行 jsonl |
| 遵守检查 | 未配置 | 5 个 regex/命令 checker |
| 分数 | 100（仅因未配 checker） | 37（读到+违反都有） |

**更有教学意义的是 demo 37 分**；**更有真实感的是这次痛点会话**（证明能读你本机日志）。

## 这次会话里工具**不会**自动包含的

- Claude **Skills** 列表（`mine-painpoints` 等）在 jsonl 的 attachment 里，**不会**自动变成「规则条目」
- `/goal`、Ultracode、智谱限流等——除非写进 `CLAUDE.md`，否则不算规则
- Cursor 里当前对话的 transcript **不在**这份 jsonl 里（那是另一条产品线）

## 你接下来可以试

1. 在 `~/Downloads/CLAUDE.md` 写 3 条你真想守的规矩  
2. 在同目录再开一次 Claude Code 任务  
3. 跑：`node dist/index.js --cwd ~/Downloads --session <新 jsonl>`（或省略 session 让它自动找 `~/.claude/projects/-Users-syf-Downloads/*.jsonl`）
