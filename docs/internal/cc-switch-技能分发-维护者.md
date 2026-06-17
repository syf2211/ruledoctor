# CC Switch / Claude / Codex 技能分发指南

## CC Switch 怎么「搜」技能？会扫整个 GitHub 吗？

**不会。** CC Switch 只扫描你配置的 **GitHub 仓库列表**（加上内置的几个源），以及 **skills.sh** 公共索引里的条目。流程是：

1. 每个「技能仓库」记录：`owner`、`name`、`branch`、可选 `subdirectory`
2. 客户端拉取该目录，找子文件夹里的 **SKILL.md**（及配套文件）
3. 你在 UI 里点「安装」→ 复制/同步到 `~/.claude/skills/`、`~/.codex/skills/` 等

官方说明：[CC Switch Skills 文档](https://github.com/farion1231/cc-switch/blob/main/docs/user-manual/zh/3-extensions/3.3-skills.md)

### 让 RuleDoctor 出现在 CC Switch 列表里

**方式 1：手动添加仓库（立刻可用）**

| 字段 | 值 |
|------|-----|
| Owner | `syf2211` |
| Name | `ruledoctor` |
| Branch | `main` |
| Subdirectory | `skills` |

刷新后应看到技能 **`ruledoctor`**，安装即可。

**方式 2：深链接一键添加仓库**

在已安装 CC Switch 的机器上打开（Claude）：

```
ccswitch://v1/import?resource=skill&app=claude&name=ruledoctor&repo=syf2211/ruledoctor&directory=skills&branch=main
```

Codex 把 `app=codex` 再导入一次。生成器：[deplink.html](https://farion1231.github.io/cc-switch/deplink.html)

**方式 3：skills.sh（需你自行提交登记）**

CC Switch v3.13+ 在「仓库管理」里可搜 skills.sh。要把 RuleDoctor 列进公共索引，需按 skills.sh 的收录流程提交（与 CC Switch 是两套系统，CC Switch 只是接入了搜索 API）。

**方式 4：成为 CC Switch 默认预置仓库**

需联系 CC Switch 维护者（farion1231/cc-switch）把 `syf2211/ruledoctor` 加进应用内置列表——这是产品运营，不是自动爬 GitHub。

---

## Claude Code 插件（带 Hooks，不经过 CC Switch）

仓库内 `plugin/` 为官方插件布局（SessionStart、**PreCompact**、PreToolUse、SessionEnd）。

```bash
# 添加本仓库为 marketplace（marketplace 清单见 .claude-plugin/marketplace.json）
/plugin marketplace add syf2211/ruledoctor
/plugin install ruledoctor@syf2211-ruledoctor
```

或在项目里只用 CLI：

```bash
ruledoctor setup -p .
```

会把 Hook 写入项目 `.claude/settings.json` 与 `.cursor/hooks.json`。

---

## Codex

- **Skill 文件**：CC Switch 安装 → `~/.codex/skills/ruledoctor/SKILL.md`
- **项目 Hook**：`ruledoctor setup -p .`（若 Codex 支持项目级 hook，与 Claude 类似；否则会话结束手动 `ruledoctor --cwd . --last-session`）

---

## Cursor

- 项目技能：`.cursor/skills/ruledoctor/`（可从本仓库 `skills/ruledoctor` 复制）
- Hook：`setup` 写入 `sessionStart` / `preCompact` / `beforeShellExecution` / `sessionEnd`

---

## 目录结构（给维护者）

```
skills/ruledoctor/SKILL.md     ← CC Switch subdirectory=skills 扫描
plugin/                        ← Claude /plugin install
scripts/*.mjs                  ← setup 与 plugin 共用
```

---

## 卖点与真实边界（对外话术）

| 承诺 | 机制 |
|------|------|
| compaction 后仍记得规则 | `reinject-rules.mjs` 在 **PreCompact / sessionStart** 注入 `additionalContext` |
| 强制遵守（可执行部分） | `rule-guard.mjs` 拦截 `.ruledoctor.json` 的 **forbid-command** |
| 可审计 | 会话 jsonl **读到率** + 配置的 **遵守率** → HTML 报告 |

不能诚实承诺的：仅靠 Skill 文字、没有 Hook/没有规则文件时，无法保证模型 100% 遵守；RuleDoctor 的设计是 **注入 + 拦截 + 事后证明** 组合。
