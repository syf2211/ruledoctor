# RuleDoctor 增长诊断与执行计划（2026-06-23）

## 当前诊断

GitHub traffic 近 14 天：

| 指标 | 数值 | 解释 |
|------|------|------|
| Stars | 20 | 对 25 个独立访客来说并不低，说明仓库转化不差 |
| Views | 51 / 25 uniques | 顶部曝光太小，不是 README 说服力的主问题 |
| Clones | 202 / 98 uniques | 安装器、机器人或试用流量高于页面访问 |
| Referrers | `github.com` 15 / 1 unique | 外部渠道几乎没把人带进仓库 |

结论：优先修 **分发入口**，不是继续堆 README。小红书浏览低也符合这个判断：开发者工具类内容不适合单条“工具发布”打法，需要做连续的痛点/教程/案例内容。

## 为什么 Star 和访问低

1. **目标人群窄**：需要同时知道 Claude Code / Codex / Cursor、规则文件、Agent Skills 的人本来就少。
2. **单条发布没有信任证据**：开发者更吃真实截图、失败案例、复现命令、CI badge，而不是“我做了个工具”。
3. **小红书人群与 GitHub 转化链长**：小红书里外链弱，用户看到后还要记住仓库名再去 GitHub 搜。
4. **内容关键词太泛**：`AI编程`、`Claude` 太大；更应打长尾痛点：`CLAUDE.md 不生效`、`.cursorrules 不生效`、`Cursor rules 不读`、`Codex AGENTS.md`。
5. **缺少连续触达**：冷启动需要同一问题的 7-10 个角度，而不是一篇首发稿。

## 立即动作（已做）

- GitHub homepage 改为 `https://skills.sh/syf2211/ruledoctor/ruledoctor`。
- GitHub topics 增加 `ai-agents`、`llm`、`openai-codex`、`claude-code-hooks`。
- 推荐安装命令改为 agent-specific，避免 `npx skills add ... -g -y` 的部分失败提示。
- CI 加入真实 `npx skills@1.5.11` 安装 smoke。
- GitHub Issues 新增三个公开入口：[#1 截图/GIF](https://github.com/syf2211/ruledoctor/issues/1)、[#2 npm/CLI](https://github.com/syf2211/ruledoctor/issues/2)、[#3 真实规则失效案例](https://github.com/syf2211/ruledoctor/issues/3)。

## 接下来 7 天

| 天 | 动作 | 目标 |
|----|------|------|
| D1 | 发小红书教程 1：`CLAUDE.md 写了为什么不生效` | 抢痛点关键词 |
| D2 | 发 GitHub Discussions/Issue：收集“规则不生效”案例 | 增加互动入口 |
| D3 | V2EX/掘金发技术帖：Skill + Hook 边界 | 精准开发者流量 |
| D4 | 小红书教程 2：Cursor `.cursorrules` 不读怎么办 | 打 Cursor 长尾 |
| D5 | Reddit / X 英文短帖 | 英文生态入口 |
| D6 | 小红书教程 3：Codex `AGENTS.md`/RuleDoctor 用法 | 打 Codex 长尾 |
| D7 | 复查 GitHub traffic/referrers/stars/clones | 判断渠道有效性 |

## 小红书打法

每条笔记都用这个结构：

1. 标题必须是问题句：`CLAUDE.md 写了，Claude Code 为什么还是乱改？`
2. 首图不要像广告：用“错误对话截图/规则没读的反例/前后对比”。
3. 正文先讲具体失败场景，再给 RuleDoctor。
4. 安装命令放正文中段和置顶评论各一次。
5. 结尾不要只说 Star，要问一个问题：`你现在用 CLAUDE.md 还是 .cursorrules？`
6. 评论区用 `github 搜 syf2211/ruledoctor`，因为外链转化弱。

## GitHub 打法

- README 保持首屏短；不要继续加长。
- 每周维护 1 个 Release note 或 Discussion，显示项目活跃。
- 开 2-3 个有价值的公开 issue：真实案例收集、npm 发布、真实截图征集。
- 每个外部帖子都链接到 skills.sh 和 GitHub，GitHub traffic referrer 一周后复查。

## 指标复查命令

```bash
gh repo view syf2211/ruledoctor --json stargazerCount,forkCount,watchers,repositoryTopics,homepageUrl
gh api repos/syf2211/ruledoctor/traffic/views
gh api repos/syf2211/ruledoctor/traffic/clones
gh api repos/syf2211/ruledoctor/traffic/popular/referrers
```

## 参考资料

- GitHub Docs: [Classifying your repository with topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics)
- GitHub Docs: [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- Xiaohongshu / RedNote overview: [Xiaohongshu](https://en.wikipedia.org/wiki/Xiaohongshu)
- Xiaohongshu hashtag/audience research: [Hashtag Re-Appropriation for Audience Control on Recommendation-Driven Social Media Xiaohongshu](https://arxiv.org/abs/2501.18210)
- Platform search/UGC context: [Vogue Business on Xiaohongshu wellness searches and user-generated content](https://www.voguebusiness.com/story/consumers/lazy-sleeping-beauty-and-adult-milk-tea-the-wellness-trends-driving-engagement-in-china)
