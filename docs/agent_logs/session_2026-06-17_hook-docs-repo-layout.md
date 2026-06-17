# Session 2026-06-17 — Hook 文档与仓库定位

## 目标
- 用人话写清 Hook 机制、与 Skill 边界、抽象规则不能靠 Hook 硬拦
- README / skills/ruledoctor 以可发布 Skill 为中心

## 产出
- `docs/Hook是什么.md` — 六问 + RuleDoctor 实际触发点
- `docs/仓库结构说明.md` — 目录保留理由
- `skills/ruledoctor/README.md` — Skill 入口
- 根 `README.md` 重写为 Skill-first

## 关键结论（写进文档）
- Hook 仅：SessionStart/PreCompact 注入、PreToolUse Bash deny、SessionEnd 报告
- 无「用户消息前 / 模型回复前」Hook；抽象行为规范 → Skill + 项目规则
