# 2026-06-17 Skill 强制遵守 · 完成

## 交付
- `skills/ruledoctor/scripts/*` + `rules-anchor.md`（CC Switch 整包复制）
- `bootstrap.mjs` → `~/.claude/settings.json` + `~/.cursor/hooks.json`
- `reinject-rules.mjs` / `rule-guard.mjs` / `session-end.mjs` 增强
- `ruledoctor bootstrap-skill`、npm global postinstall bootstrap
- test/skill-hooks.test.ts 24 tests pass
- pushed: https://github.com/syf2211/ruledoctor main @ 6bf50e4

## 用户路径
1. CC Switch 装 skill → `node ~/.claude/skills/ruledoctor/scripts/bootstrap.mjs`
2. 项目 `ruledoctor setup -p .`
3. force push 被 hook deny；compaction 前 reinject
