# Always Right Manager / 绿茵人生

单文件、零依赖的足球经理文字模拟器。

[![🎮 在线游玩](https://img.shields.io/badge/🎮_在线游玩-打开绿茵人生-2ea043?style=for-the-badge)](https://htmlpreview.github.io/?https://github.com/LiamCOYG/Always--Right--Manager/blob/main/index.html)

## 运行

点击上方按钮即可在浏览器运行最新版；也可以下载仓库后直接打开 `index.html`。

新开档时可选择“真实历史”（只从已有真实名单的赛季与球队组合中随机）或“梦幻世界”（1990–2026 全范围随机，缺失名单使用模拟球员补齐）。

## 测试

```bash
node smoke-test.js
node -e 'const fs=require("fs");const h=fs.readFileSync("index.html","utf8");eval(h.match(/<script>([\s\S]*)<\/script>/)[1])'
```

第一条验证历史名单、细分位置、手动首发、委托流程、巨星成长、换队历史与再就业；第二条运行 25 局完整流程冒烟测试。

## 历史数据

1993–2007 赛季名单来自 FootballSquads，2004/05–2007/08 评分优先匹配 FIFA 05–08；更早赛季按 FIFA 05 回推，并使用传奇峰值和少量估算补齐。1990–1992 暂由内置传奇生涯轨迹与生成球员覆盖。逐赛季、联赛、球队的完整数据与缺口见 [历史阵容归档清单](HISTORICAL_ROSTER_ARCHIVE.md)，构建报告见 `data/historical-rosters-report.json`。

重新构建时准备 `fifa05.csv`–`fifa08.csv`，然后运行 `node scripts/build-historical-rosters.js --fifa-dir <目录> --cache-dir <缓存目录>`。脚本会抓取并缓存名单页，再更新 `index.html` 和构建报告；原始第三方数据不纳入仓库。

阵容数据更新后运行 `node scripts/generate-roster-archive.js`，可同步重建归档清单。

名单数据非商业使用署名：Source of Material is http://www.footballsquads.com . Material: © FootballSquads.com, 1999 -, All Rights Reserved.
