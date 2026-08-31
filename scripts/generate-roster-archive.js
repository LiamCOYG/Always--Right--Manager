#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let source = html.match(/<script>([\s\S]*)<\/script>/)[1];
source = source.replace(
  "if(typeof window==='undefined'){runSmoke()}else{boot()}",
  "globalThis.__archive={ROSTERS,CLUBS,LG,ROLE_CN,inSpan}"
);
const sandbox = {console};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const {ROSTERS, CLUBS, LG, ROLE_CN, inSpan} = sandbox.__archive;

const esc = value => String(value == null ? '' : value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const sourceFor = (year, cid) => {
  if (cid === 'aja' && (year === 1996 || year === 1997)) return 'AFC-Ajax.info 名单 + 人工时代能力锚点';
  if (year <= 2007) return 'FootballSquads 名单 + FIFA 05–08 评分/回推 + 少量人工锚点';
  if (year <= 2015) return 'FIFA 数据库名单与能力值';
  return 'Transfermarkt 赛季名单/身价回归能力值';
};

const lines = [
  '# 历史阵容归档清单（1990–2026）',
  '',
  '> 自动生成文件，请勿手工修改。运行 `node scripts/generate-roster-archive.js` 可依据当前 `index.html` 重建。',
  '>',
  '> 层级：赛季 → 联赛 → 当季可用俱乐部。✅ 表示内置真实名单；⚠️ 表示当前无真实名单、游戏中将使用模拟阵容兜底。',
  ''
];
let covered = 0, missing = 0, players = 0;
for (let year = 1990; year <= 2026; year++) {
  lines.push(`## ${year}–${String((year + 1) % 100).padStart(2, '0')} 赛季`, '');
  for (const leagueId of Object.keys(LG)) {
    const clubs = CLUBS.filter(c => c.lg === leagueId && inSpan(c, year));
    lines.push(`### ${LG[leagueId]}`, '');
    for (const club of clubs) {
      const roster = ROSTERS[year] && ROSTERS[year][club.id];
      if (!roster) {
        missing++;
        lines.push(`#### ⚠️ ${club.name}（${club.id}）— 暂无真实数据`, '', '游戏状态：使用带年龄/能力上限的模拟阵容兜底。', '');
        continue;
      }
      covered++; players += roster.length;
      lines.push(`#### ✅ ${club.name}（${club.id}）— ${roster.length}人`, '', '<details><summary>展开球员数据</summary>', '', `数据口径：${sourceFor(year, club.id)}`, '', '| 球员 | 大位置 | 细分位置 | 年龄 | 能力 | 潜力 |', '|---|---:|---:|---:|---:|---:|');
      for (const row of roster) {
        const isArray = Array.isArray(row);
        const name = isArray ? row[0] : row.n;
        const pos = isArray ? row[1] : row.pos;
        const abi = isArray ? row[2] : row.abi;
        const age = isArray ? row[3] : row.age;
        const pot = isArray ? (row[4] == null ? abi : row[4]) : (row.pot == null ? abi : row.pot);
        const role = isArray ? row[5] : row.role;
        lines.push(`| ${esc(name)} | ${esc(pos)} | ${esc(ROLE_CN[role] || role || '未细分')} | ${age} | ${abi} | ${pot} |`);
      }
      lines.push('', '</details>', '');
    }
  }
}
lines.splice(6, 0, `> 当前统计：${covered} 个球队-赛季已有真实数据，${missing} 个球队-赛季暂无真实数据；归档球员记录 ${players} 条。`, '');
fs.writeFileSync(path.join(root, 'HISTORICAL_ROSTER_ARCHIVE.md'), lines.join('\n') + '\n');
console.log(`Archive generated: ${covered} covered, ${missing} missing, ${players} player rows`);
