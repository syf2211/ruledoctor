export const CLAUDE_MD_TEMPLATE = `# 项目规则（RuleDoctor 自动生成，请按需修改）

## 硬性规则

- 禁止执行 \`git push --force\` 或 \`git push -f\`。
- 修改代码前先阅读相关文件，不要猜测未读过的 API。
- 提交前运行项目约定的测试或 lint（若有）。
- 不要提交密钥、token、.env 到仓库。
- 用中文向用户解释重要变更（若项目要求中文协作）。
`;

export const RULEDOCTOR_JSON_STARTER = `{
  "checks": [
    {
      "rule": "push --force",
      "type": "forbid-command",
      "command": "push --force",
      "message": "会话中出现了被禁止的 force push"
    },
    {
      "rule": "push -f",
      "type": "forbid-command",
      "command": "push -f",
      "message": "会话中出现了被禁止的 force push (-f)"
    }
  ]
}
`;
