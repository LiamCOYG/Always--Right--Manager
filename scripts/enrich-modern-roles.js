#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  args.set(key, process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true);
}
const fifaDir = path.resolve(String(args.get('--fifa-dir') || '/private/tmp/arm-history-data'));

function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += ch; i++; }
      else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ';') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift() || [];
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] || ''])));
}
function norm(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\b(jr|junior|senior|ii|iii)\b/g, '').replace(/[^a-z0-9]/g, '');
}
function birthYear(value) {
  const m = String(value || '').match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (!m) return 0; let year = Number(m[3]); if (year < 100) year += 1900; return year;
}
function detailedRole(value) {
  const aliases = {GK:'GK',CB:'CB',LCB:'CB',RCB:'CB',SW:'CB',LB:'LB',RB:'RB',LWB:'LWB',RWB:'RWB',CDM:'DM',LCDM:'DM',RCDM:'DM',LDM:'DM',RDM:'DM',DM:'DM',CM:'CM',LCM:'CM',RCM:'CM',CAM:'AM',LCAM:'AM',RCAM:'AM',LAM:'AM',RAM:'AM',AM:'AM',LM:'LM',LWM:'LM',RM:'RM',RWM:'RM',LW:'LW',LF:'LW',RW:'RW',RF:'RW',CF:'SS',SS:'SS',ST:'ST',LS:'ST',RS:'ST'};
  for (const token of String(value || '').toUpperCase().split(/[^A-Z]+/)) if (aliases[token]) return aliases[token];
  return '';
}
function broad(role) {
  if (role === 'GK') return 'GK';
  if (['CB','LB','RB','LWB','RWB'].includes(role)) return 'DF';
  if (['DM','CM','AM','LM','RM'].includes(role)) return 'MF';
  return 'FW';
}

const databases = {};
for (let edition = 9; edition <= 21; edition++) {
  const sourceFile = path.join(fifaDir, 'fifa' + String(edition).padStart(2, '0') + '.csv');
  if (!fs.existsSync(sourceFile)) throw new Error('Missing ' + sourceFile);
  const byName = new Map();
  for (const row of parseCsv(fs.readFileSync(sourceFile, 'utf8'))) {
    const role = detailedRole(row.preferred_positions); if (!role) continue;
    const key = norm(row.Fullname); if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push({role:role,birthYear:birthYear(row.birth_date),rating:Number(row.current_rating) || 0});
  }
  databases[edition] = byName;
}

const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const match = html.match(/^const ROSTERS=(\{.*\});$/m);
if (!match) throw new Error('ROSTERS constant not found');
const rosters = JSON.parse(match[1]);
let total = 0, matched = 0, changedBroad = 0;
for (const yearText of Object.keys(rosters)) {
  const year = Number(yearText); if (year < 2008) continue;
  const edition = Math.min(21, Math.max(9, year - 1999)), db = databases[edition];
  for (const cid of Object.keys(rosters[year])) for (const player of rosters[year][cid]) {
    total++; const candidates = db.get(norm(player[0])) || [];
    const expectedBirth = year - Number(player[3]);
    const plausible = candidates.filter(p => !p.birthYear || Math.abs(p.birthYear - expectedBirth) <= 2);
    const pool = plausible.length ? plausible : candidates;
    if (!pool.length) continue;
    pool.sort((a, b) => Math.abs(a.birthYear - expectedBirth) - Math.abs(b.birthYear - expectedBirth) || Math.abs(a.rating - Number(player[2])) - Math.abs(b.rating - Number(player[2])));
    const role = pool[0].role, nextBroad = broad(role); matched++;
    if (player[1] !== nextBroad) { player[1] = nextBroad; changedBroad++; }
    player[5] = role;
  }
}
html = html.replace(match[0], 'const ROSTERS=' + JSON.stringify(rosters) + ';');
fs.writeFileSync(file, html);
console.log('Modern roles enriched: ' + matched + '/' + total + ' matched; ' + changedBroad + ' broad positions corrected');
