# RuleDoctor 发帖文案包（Skill 优先）

完整渠道与节奏：[宣发与分发.md](docs/宣发与分发.md)

**推荐安装（计入 skills.sh）：**

```bash
npx skills add syf2211/ruledoctor@ruledoctor -g -y
```

配图建议：新对话「读了哪些文件 + 3 条硬约束」截图 · skills.sh 页面 · （可选）拒绝 force push

---

## 小红书 / 短帖标题

1. Claude 又不看 .cursorrules？装这个 Skill 再**新开对话**
2. 写了 CLAUDE.md 还是乱改？一个 Skill 让它先读规则再动手
3. 上下文一压缩就忘规矩？RuleDoctor Skill + required_reads

---

## 掘金 / CSDN 标题

【开源 Skill】RuleDoctor：让 Claude/Codex/Cursor 先读 CLAUDE.md 与 required_reads

---

## 正文骨架（Skill 版）

你是不是也写过 `CLAUDE.md` / `.cursorrules`，结果 Agent 照样乱改、照样 `git push --force`？

**RuleDoctor** 是一个可安装的 **Agent Skill**（不是只能自己跑的脚本）：

- 开场先 **Read** 根规则 + 你在 `.ruledoctor.json` 里列的 **必读文档**（`required_reads`）
- **默认**只告诉你：读了哪些文件 + **最多 3 条**硬约束（避免长篇念经）
- 可选：同仓库 CLI 做事后体检、Hook 硬拦危险 shell

```bash
npx skills add syf2211/ruledoctor@ruledoctor -g -y
```

装好后务必 **新开一场对话**，在有规则文件的项目里试一个小需求。

⭐ https://github.com/syf2211/ruledoctor · https://skills.sh/syf2211/ruledoctor/ruledoctor

---

## 标签

`#ClaudeCode` `#Cursor` `#Codex` `#AgentSkills` `#AI编程` `#开源` `#VibeCoding`

---

## 备注

- 旧版 CLI-only 叙事见 git 历史；对外统一 **Skill 为主、CLI 可选**。
- `docs/0x-*.png` 若不存在，发帖前请先截 2–3 张实机图放入 `docs/promo/`。
