# Always Right Manager / 绿茵人生

单文件、零依赖的足球经理文字模拟器。

[![🎮 在线游玩](https://img.shields.io/badge/🎮_在线游玩-打开绿茵人生-2ea043?style=for-the-badge)](https://htmlpreview.github.io/?https://github.com/LiamCOYG/Always--Right--Manager/blob/main/index.html)

## 运行

点击上方按钮即可在浏览器运行最新版；也可以下载仓库后直接打开 `index.html`。

新开档时可选择“真实历史”（只从已有真实名单的赛季与球队组合中随机）或“梦幻世界”（1990–2026 全范围随机，缺失名单使用模拟球员补齐）。

随后可选择“完整执教”或“转会爽剧”。转会爽剧会自动模拟全部联赛与欧冠比赛，只在夏窗、冬窗和赛季总结停下；每个窗口把真实足坛名人置顶推荐，青年成长更快，普通球员30岁起衰退、巨星30–33岁缓降，所有球员34岁起断崖下滑。

2016/17 等带历史锚点的欧冠开局会尊重真实参赛资格，抽签始终回避同联赛球队。球员搜索支持“球王”“球玉”“武僧”“汉堡王”“魔笛”等中文绰号，其中“球王”可同时找到梅西与C罗。

## 测试

```bash
node smoke-test.js
node -e 'const fs=require("fs");const h=fs.readFileSync("index.html","utf8");eval(h.match(/<script>([\s\S]*)<\/script>/)[1])'
```

第一条验证历史名单、细分位置、手动首发、委托流程、欧冠分组、绰号搜索、转会爽剧、巨星成长、换队历史与再就业；第二条运行 25 局完整流程冒烟测试。

## 历史数据

1993–2007 赛季名单来自 FootballSquads，2004/05–2007/08 评分优先匹配 FIFA 05–08；更早赛季按 FIFA 05 回推，并使用传奇峰值和少量估算补齐。1990–1992 暂由内置传奇生涯轨迹与生成球员覆盖。逐赛季、联赛、球队的完整数据与缺口见 [历史阵容归档清单](HISTORICAL_ROSTER_ARCHIVE.md)，构建报告见 `data/historical-rosters-report.json`。

重新构建时准备 `fifa05.csv`–`fifa21.csv`。运行 `node scripts/build-historical-rosters.js --fifa-dir <目录> --cache-dir <缓存目录>` 可重建早期名单；随后运行 `node scripts/enrich-modern-roles.js --fifa-dir <目录>`，可用 FIFA 的首选位置校正2008–2026名单。原始第三方数据不纳入仓库。

阵容数据更新后运行 `node scripts/generate-roster-archive.js`，可同步重建归档清单。

名单数据非商业使用署名：Source of Material is http://www.footballsquads.com . Material: © FootballSquads.com, 1999 -, All Rights Reserved.

## 扩展球员数据建议

优先使用带明确授权说明的 FIFA/FC CSV 或 SQLite 数据集，并至少保留稳定球员 ID、完整姓名、出生日期、详细位置、能力和潜力字段；本项目现有管线已经接入 FIFA 05–21。FC 24/25 或 SoFIFA 风格 CSV 可按相同方式补 2022 年以后数据，但导入前需逐份核对许可证。PES option file 多为专有二进制，通常偏名单、球衣和外观，评分结构不稳定；FM 数据库受 EULA 限制，不应直接提取后随项目分发。
