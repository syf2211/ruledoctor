# RuleDoctor 发帖文案包（小红书 / 掘金）

配图顺序：`docs/01-cover.png` → `docs/02-problem.png` → `docs/03-dashboard.png` → `docs/04-solution.png`

---

## 标题（三选一）

1. 🆘 救命，你给 AI 写的规则，它可能根本没在听
2. 实测 37% 的 .cursorrules 规则，AI 压根没读到 😱
3. 别再跟空气签合同了！你的 Claude Code 规则可能全失效

---

## 正文骨架

你是不是也写过一长串 `.cursorrules` / `CLAUDE.md`，结果 AI 照样乱改、照样 `git push --force`、照样不用你规定的格式？

更气人的是：**它不报错**。你只能怀疑「模型是不是变蠢了」——其实可能是规则根本没进上下文，或者被 compaction 挤掉了，或者它看到了但选择性无视。

（配图 02：三种死法）

我做了个开源 CLI **RuleDoctor**：像给代码做覆盖率一样，给 **AI 规则做覆盖率**。

- **读到率**：扫 Claude Code 会话日志，看规则关键词有没有真的出现在发给模型的上下文里
- **遵守率**：用你配置的 checker 查仓库和命令历史（例如禁止 `git push --force`）

（配图 03：仪表盘 demo，37/100 那张最有冲击力）

用法就三步：（配图 04）

1. 指向你的规则文件（`.cursorrules` / `CLAUDE.md` / `AGENTS.md`）
2. 指向一次真实会话的 `.jsonl`
3. 出报告，还能 `--gate` 卡 CI

```bash
git clone https://github.com/ruledoctor/ruledoctor.git
cd ruledoctor && npm install && npm run build
./dist/index.js --cwd examples/demo-project --session examples/demo-project/session.jsonl
```

和市面上那些「静态 rules linter」不一样：它们只检查你**写得对不对**；RuleDoctor 查这次任务里**到底有没有被读到、有没有被遵守**。

⭐ 觉得有用的话 GitHub 点个 star，/issue 欢迎提你想要的 checker！

---

## 标签建议

`#Cursor` `#ClaudeCode` `#AI编程` `#程序员日常` `#开源` `#前端开发` `#提效工具` `#VibeCoding`

---

## 备注

- 读率目前以 **Claude Code** 会话格式为主；Cursor/Cline 适配在 roadmap。
- 读到率证明「规则文本到达了上下文」，不是 100% 证明「模型理解了」；探针模式 `--probe` 规划中。
