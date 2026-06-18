# 宣传物料索引

## 重新导出 PNG

```bash
node docs/promos/export-png.mjs
```

依赖：项目内 `playwright`（`npx playwright install chromium` 若首次运行失败）。

## 源文件（HTML/CSS）

| 用途 | HTML |
|------|------|
| GitHub README 横幅 | `docs/promos/v2/github-banner.html` |
| 社交 OG / 产品介绍 | `docs/promos/v2/banner-install-cta.html` |
| 痛点对比横幅 | `docs/promos/v2/banner-pain-compare.html` |
| 小红书 7 页轮播 | `docs/promos/xhs/slide-01-cover.html` … `slide-07-cta.html` |
| 共享样式 | `docs/promos/v2/tokens.css` |

## 成品 PNG

| 文件 | 尺寸 |
|------|------|
| `/github-banner.png` | 1600×640 |
| `docs/promo/github-banner.png` | 同上副本 |
| `docs/promo/banner-install-cta.png` | 1200×630 |
| `docs/promo/banner-pain-compare.png` | 1600×640 |
| `docs/promo/xhs/slide-01.png` … `07.png` | 1080×1440 |

## 文案

- `docs/promo/copy/平台文案.md` — 小红书 / 知乎 / X / 社区帖  
- `docs/promo/小红书自动发布方案.md` — MCP 与自动化调研  
- `POST.md` — 短帖索引（指向上文）

## Codex 实机图（预留）

放入后更新 README 并可选改 `slide-07-cta.html` 占位区，再 export：

- `docs/promo/codex-before.png`
- `docs/promo/codex-after.png`
