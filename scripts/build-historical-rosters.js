#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://www.footballsquads.co.uk/';
const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  args.set(key, process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true);
}
const cacheDir = path.resolve(String(args.get('--cache-dir') || '/tmp/arm-footballsquads'));
const fifaDir = path.resolve(String(args.get('--fifa-dir') || '/tmp/arm-history-data'));
fs.mkdirSync(cacheDir, {recursive:true});

const LEAGUES = [
  {lg:'eng',from:1993,to:2007,url:y=>'eng/'+y+'-'+(y+1)+'/faprem.htm'},
  {lg:'esp',from:1995,to:2007,url:y=>'spain/'+y+'-'+(y+1)+'/spalali.htm'},
  {lg:'ita',from:1995,to:2007,url:y=>'italy/'+y+'-'+(y+1)+'/seriea.htm'},
  {lg:'ger',from:1995,to:2007,url:y=>'ger/'+y+'-'+(y+1)+'/gerbun.htm'},
  {lg:'fra',from:1998,to:2007,url:y=>'france/'+y+'-'+(y+1)+'/'+(y<=2001?'fradiv1':'fralig1')+'.htm'},
  {lg:'ned',from:2001,to:2007,url:y=>'holland/'+y+'-'+(y+1)+'/holere.htm'}
];

// FootballSquads page slugs -> in-game club ids. Teams outside the 195-club
// game world are intentionally omitted and reported instead of silently mixed.
const CLUB_BY_SLUG = {
  arsenal:'ars',avilla:'avl',birmin:'bir',blackbrn:'blk',bolton:'bln',charlton:'cha',chelsea:'che',
  coventry:'cov',cpalace:'cry',derby:'der',everton:'eve',fulham:'ful',ipswich:'ips',leeds:'lee',
  leicester:'lei',liverpool:'liv',mancity:'mci',manutd:'mun',middles:'mid',newcas:'new',norwich:'nwc',
  nottmf:'nor',oldham:'old',portsm:'por',qpr:'qpr',reading:'rea',sheffu:'shu',sheffwed:'she3',
  southam:'south',sunder:'sun',tottenha:'tot',watford:'wat',wba:'wba',westham:'whu',wigan:'wigan',
  wimbled:'wim',wolves:'wol2',
  abilbao:'ath',alaves:'ala',albacete:'alb',amadrid:'atm',barce:'bar',betis:'bet',cadiz:'cad',celta:'cel',
  espanyol:'esp2',getafe:'get',lacoruna:'dep',levante:'lvn',logrones:'log',malaga:'mal',mallorca:'mall',
  numancia:'num',osasuna:'osa',oviedo:'ovi',racing:'rac',rmadrid:'rma',sevilla:'sev',sociedad:'rso',
  spogijon:'spo',tenerife:'ttr',valencia:'val',vallad:'vall',villar:'vil',zaragoza:'zar',
  atalanta:'ata',bari:'bar2',bologna:'bol',brescia:'bre2',cagliari:'cag',catania:'cat',como:'com',
  cverona:'chi',empoli:'emp',fiorenti:'flo',genoa:'gen',inter:'int',juventus:'juv',lazio:'laz',
  livorno:'liv2',milan:'mil',napoli:'nap',palermo:'pal',parma:'par',perugia:'per',piacenza:'pia',
  reggina:'reg',roma:'rom',salern:'sal',sampdor:'sam',siena:'sie',torino:'tor',udinese:'udi',
  venezia:'ven',vicenza:'vic',
  abielefeld:'bie',bayerlev:'lev',bayern:'bay',bochum:'boc',dortmund:'dor',einfrank:'fra',freiburg:'fri',
  hamburg:'hsv',hannover:'han',hberlin:'her',kaisersl:'kai',karlsruhe:'kar',koln:'kol',mainz:'main',
  monchen:'mon2',nurnberg:'nur',schalke:'sch',stpauli:'stp',stuttg:'stu',wbremen:'wer',wolfsburg:'wol',
  dussel:'dus',uerding:'udk',
  ajaccio:'aja2',auxerre:'aux',bastia:'bas',bordeaux:'bor',caen:'cae',guinga:'gui',lehavre:'hav',lens:'len',
  lille:'lil',lorient:'lor',lyon:'lyn',marseille:'mar',metz:'met',monaco:'mon',montpel:'mph',nantes:'nan',
  nice:'nic',psg:'psg',rennes:'ren',sochaux:'soc',stetienne:'ste',stras:'str',toulouse:'tou',troyes:'tro',
  valenc:'val2',
  ajax:'aja',azalk:'azp',degraaf:'deg',denhaag:'aha',excels:'exc',feyen:'fey',fortuna:'for',groning:'gro',
  heeren:'hel',heracles:'hrc',nacbreda:'nac',necnijm:'nem',psv:'psv',rkcwaal:'rkc',rodajc:'rod',
  sparta:'spa',twente:'twt',utrecht:'utr',vitesse:'vit',volendam:'vol',vvv:'vvv',willem:'wil',zwolle:'zwl'
};

function decodeHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(x?[0-9a-f]+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : parseInt(n, 10)))
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ').trim();
}
function cachePath(url) { return path.join(cacheDir, crypto.createHash('sha1').update(url).digest('hex') + '.html'); }
async function get(url) {
  const file = cachePath(url);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(url, {headers:{'user-agent':'Always-Right-Manager historical roster builder (non-commercial; GitHub LiamCOYG)'}});
      if (!response.ok) throw new Error(response.status + ' ' + url);
      const bytes = await response.arrayBuffer();
      const charset = response.headers.get('content-type') || '';
      const body = new TextDecoder(/utf-?8/i.test(charset) ? 'utf-8' : 'windows-1252').decode(bytes);
      fs.writeFileSync(file, body);
      return body;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}
function leagueTeams(html, indexUrl) {
  const out = [];
  const re = /<a[^>]+href=["']([^"']+\.htm)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[1].startsWith('../') || !m[1].includes('/')) continue;
    const url = new URL(m[1], indexUrl).href;
    out.push({url:url,slug:path.basename(new URL(url).pathname, '.htm'),name:decodeHtml(m[2])});
  }
  return out;
}
async function mapLimit(items, limit, fn) {
  const result = new Array(items.length); let next = 0;
  async function worker() { while (next < items.length) { const i = next++; result[i] = await fn(items[i], i); } }
  await Promise.all(Array.from({length:Math.min(limit, items.length)}, worker));
  return result;
}
function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ';') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift() || [];
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] || ''])));
}
function dateKey(value) {
  const iso = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
  const m = String(value || '').match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (!m) return '';
  let year = Number(m[3]); if (year < 100) year += 1900;
  return year + '-' + String(Number(m[2])).padStart(2, '0') + '-' + String(Number(m[1])).padStart(2, '0');
}
function birthYear(value) { const key = dateKey(value); return key ? Number(key.slice(0, 4)) : 0; }
function norm(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\b(jr|junior|senior|ii|iii)\b/g, '').replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
}
function nameScore(a, b) {
  const x = norm(a), y = norm(b); if (!x || !y) return 0; if (x === y) return 100;
  if (x.includes(y) || y.includes(x)) return 78;
  const aa = String(a).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const bb = String(b).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (aa.length && bb.length && aa[aa.length - 1] === bb[bb.length - 1]) return aa[0][0] === bb[0][0] ? 72 : 55;
  return 0;
}
const NAME_FIXES = {
  'Aljo�a Asanović':'Aljoša Asanović','Bjarne Goldb�k':'Bjarne Goldbæk','Bj�rn Tore Kvarme':'Bjørn Tore Kvarme',
  'Frode Grod � s':'Frode Grodås','Igor �timac':'Igor Štimac','Jan M�lby':'Jan Mølby',
  'Jan �ge Fj�rtoft':'Jan Åge Fjørtoft','Jan-�ge Fj�rtoft':'Jan-Åge Fjørtoft','Jos� Dominguez':'José Dominguez',
  'J�rgen Klinsmann':'Jürgen Klinsmann','Karel Poborsk�':'Karel Poborský','K�re Ingebrigtsen':'Kåre Ingebrigtsen',
  'Luděk Miklo�ko':'Luděk Mikloško','Ole Gunnar Solskj�r':'Ole Gunnar Solskjær','Pavel Srn�ček':'Pavel Srníček',
  'Pontus K�mark':'Pontus Kåmark','P�l Lydersen':'Pål Lydersen','Savo Milo�ević':'Savo Milošević',
  'Sa�a Ćurčić':'Saša Ćurčić','Stig Inge Bj�rnebye':'Stig Inge Bjørnebye','Uwe R�sler':'Uwe Rösler',
  '�yvind Leonhardsen':'Øyvind Leonhardsen'
};
function parseSquad(html) {
  const players = [];
  for (const match of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => decodeHtml(m[1]));
    if (cells.length < 3) continue;
    const name = NAME_FIXES[cells[1]] || cells[1], rawPos = cells[2].toUpperCase();
    const pos = rawPos.startsWith('G') ? 'GK' : rawPos.startsWith('D') ? 'DF' : rawPos.startsWith('M') ? 'MF' : rawPos.startsWith('F') || rawPos.startsWith('A') ? 'FW' : '';
    if (!name || !pos) continue;
    players.push({name:name,pos:pos,dob:cells.find((v, i) => i >= 3 && /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(v)) || ''});
  }
  const seen = new Set();
  return players.filter(p => { const key = norm(p.name) + '|' + p.pos; if (seen.has(key)) return false; seen.add(key); return true; });
}
function loadRatings() {
  const out = {};
  for (let n = 5; n <= 8; n++) {
    const file = path.join(fifaDir, 'fifa' + String(n).padStart(2, '0') + '.csv');
    if (!fs.existsSync(file)) throw new Error('Missing ' + file);
    const rows = parseCsv(fs.readFileSync(file, 'utf8')).map(r => ({
      name:r.Fullname,dob:dateKey(r.birth_date),abi:Number(r.current_rating),pot:Number(r.potential_rating),positions:r.preferred_positions
    })).filter(p => p.name && p.abi);
    const byDob = new Map(), byName = new Map();
    for (const p of rows) {
      if (p.dob) { if (!byDob.has(p.dob)) byDob.set(p.dob, []); byDob.get(p.dob).push(p); }
      byName.set(norm(p.name), p);
    }
    out[n] = {rows:rows,byDob:byDob,byName:byName};
  }
  return out;
}
function findRating(player, db) {
  const exact = db.byName.get(norm(player.name));
  if (exact && (!player.dob || exact.dob === dateKey(player.dob))) return exact;
  const candidates = db.byDob.get(dateKey(player.dob)) || [];
  let best = null, score = 0;
  for (const p of candidates) { const s = nameScore(player.name, p.name); if (s > score) { best = p; score = s; } }
  return score >= 55 ? best : null;
}
function hash(value) { let h = 2166136261; for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function loadGameData() {
  const vm = require('vm');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  let source = html.match(/<script>([\s\S]*)<\/script>/)[1];
  source = source.replace("if(typeof window==='undefined'){runSmoke()}else{boot()}", '');
  const context = {console:{log:function(){},error:console.error},setTimeout:function(){}};
  vm.createContext(context);
  vm.runInContext(source + '\nthis.__game={CLUBS:CLUBS,ROSTERS:ROSTERS,LEGENDS:LEGENDS,cnOf:cnOf};', context);
  return context.__game;
}
function playerArray(player, year, club, ratings, game, stats) {
  const edition = year >= 2004 ? ratings[Math.min(8, year - 1999)] : ratings[5];
  const sourceBirthYear = birthYear(player.dob);
  const plausibleDob = sourceBirthYear && year - sourceBirthYear >= 15 && year - sourceBirthYear <= 50;
  const rated = findRating(plausibleDob ? player : Object.assign({}, player, {dob:''}), edition);
  const resolvedBirthYear = plausibleDob ? sourceBirthYear : birthYear(rated && rated.dob);
  const age = Math.max(15, year - (resolvedBirthYear || year - 24));
  const cn = game.cnOf(player.name);
  const legend = game.LEGENDS.find(x => norm(x.n) === norm(cn) || norm(x.n) === norm(player.name));
  let abi, pot, ratingSource;
  if (rated) {
    const editionNumber = year >= 2004 ? Math.min(8, year - 1999) : 5, scale = {5:.87,6:.90,7:.96,8:1}[editionNumber];
    const scaleRating = value => Math.max(48, Math.min(99, Math.round(50 + (Number(value) - 50) * scale)));
    abi = scaleRating(rated.abi); pot = Math.max(abi, scaleRating(rated.pot || rated.abi));
    ratingSource = year >= 2004 ? 'fifaExact' : 'fifaBackcast';
    if (year < 2004) {
      const refAge = 2004 - (birthYear(player.dob) || 1980);
      const ageCurve = value => value < 24 ? -(24 - value) * 2 : value <= 30 ? 0 : value <= 33 ? -(value - 30) : -3 - (value - 33) * 1.5;
      abi += Math.round(ageCurve(age) - ageCurve(refAge));
      abi = Math.max(48, Math.min(96, abi));
    }
  } else if (legend) {
    const peakAge = 27, distance = Math.abs(age - peakAge);
    abi = Math.max(62, Math.round(legend.abi - distance * (age < peakAge ? 1.15 : 0.9)));
    pot = legend.abi; ratingSource = 'legendRated';
  } else {
    const youthPenalty = age <= 18 ? 8 : age <= 20 ? 5 : age <= 22 ? 2 : 0;
    abi = Math.max(48, Math.min(86, club.str - 14 + hash(player.name + '|' + year) % 10 - youthPenalty));
    pot = age <= 23 ? Math.min(92, abi + 3 + hash(player.name + '|pot') % 7) : abi;
    ratingSource = 'estimated';
  }
  if (legend) pot = Math.max(pot || abi, legend.abi);
  const result = [player.name,player.pos,abi,age,Math.max(abi,pot || abi)];
  result.ratingSource = ratingSource;
  return result;
}
function trimSquad(players) {
  const quota = {GK:2,DF:7,MF:8,FW:5}, picked = [], used = new Set();
  for (const pos of ['GK','DF','MF','FW']) {
    players.filter(p => p[1] === pos).sort((a,b) => b[2] - a[2]).slice(0, quota[pos]).forEach(p => { picked.push(p); used.add(p[0]); });
  }
  players.slice().sort((a,b) => b[2] - a[2]).forEach(p => { if (picked.length < 24 && !used.has(p[0])) { picked.push(p); used.add(p[0]); } });
  return picked;
}
function injectRosters(history) {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const match = html.match(/^const ROSTERS=(\{.*\});$/m);
  if (!match) throw new Error('ROSTERS block not found');
  const existing = JSON.parse(match[1]);
  for (const year of Object.keys(history)) existing[year] = history[year];
  const sorted = Object.fromEntries(Object.keys(existing).sort((a,b) => Number(a) - Number(b)).map(y => [y, existing[y]]));
  html = html.replace(match[0], 'const ROSTERS=' + JSON.stringify(sorted) + ';');
  fs.writeFileSync(file, html);
}
async function discover() {
  const jobs = [];
  for (const cfg of LEAGUES) for (let year = cfg.from; year <= cfg.to; year++) jobs.push({cfg,year,url:new URL(cfg.url(year), BASE).href});
  const pages = await mapLimit(jobs, 4, async job => Object.assign({}, job, {html:await get(job.url)}));
  const byLeague = {};
  for (const page of pages) {
    if (!byLeague[page.cfg.lg]) byLeague[page.cfg.lg] = new Set();
    for (const team of leagueTeams(page.html, page.url)) byLeague[page.cfg.lg].add(team.slug + '=' + team.name);
  }
  for (const cfg of LEAGUES) console.log(cfg.lg + ': ' + [...byLeague[cfg.lg]].sort().join(' | '));
}

async function build() {
  const game = loadGameData(), clubById = Object.fromEntries(game.CLUBS.map(c => [c.id, c]));
  const ratings = loadRatings(), history = {}, omitted = new Set();
  const stats = {teams:0,players:0,fifaExact:0,fifaBackcast:0,legendRated:0,estimated:0,shortSquads:[]};
  const leagueJobs = [];
  for (const cfg of LEAGUES) for (let year = cfg.from; year <= cfg.to; year++) leagueJobs.push({cfg:cfg,year:year,url:new URL(cfg.url(year), BASE).href});
  const leaguePages = await mapLimit(leagueJobs, 4, async job => Object.assign({}, job, {html:await get(job.url)}));
  const teamJobs = [];
  for (const page of leaguePages) for (const team of leagueTeams(page.html, page.url)) {
    const clubId = CLUB_BY_SLUG[team.slug];
    if (!clubId || !clubById[clubId]) { omitted.add(page.cfg.lg + ':' + team.name); continue; }
    teamJobs.push({year:page.year,lg:page.cfg.lg,team:team,clubId:clubId});
  }
  const teamPages = await mapLimit(teamJobs, 2, async job => Object.assign({}, job, {html:await get(job.team.url)}));
  for (const page of teamPages) {
    const parsed = parseSquad(page.html);
    const roster = trimSquad(parsed.map(p => playerArray(p, page.year, clubById[page.clubId], ratings, game, stats)));
    if (roster.length < 16) { stats.shortSquads.push(page.year + ':' + page.clubId + ':' + roster.length); continue; }
    if (!history[page.year]) history[page.year] = {};
    history[page.year][page.clubId] = roster; stats.teams++; stats.players += roster.length;
    for (const p of roster) stats[p.ratingSource]++;
  }
  const years = Object.keys(history).sort();
  const report = {
    generatedAt:new Date().toISOString(),source:'FootballSquads.com + Kaggle daguizer/fifa-2021-to-2005-complete-player-attributes',
    years:years,teamSeasons:stats.teams,players:stats.players,fifaExact:stats.fifaExact,fifaBackcast:stats.fifaBackcast,legendRated:stats.legendRated,
    estimated:stats.estimated,exactFifaRate:Number((stats.fifaExact / Math.max(1, Object.values(history).slice(-4).flatMap(Object.values).flat().length) * 100).toFixed(1)),
    omittedTeams:[...omitted].sort(),shortSquads:stats.shortSquads
  };
  fs.mkdirSync(path.join(ROOT, 'data'), {recursive:true});
  fs.writeFileSync(path.join(ROOT, 'data', 'historical-rosters-report.json'), JSON.stringify(report, null, 2) + '\n');
  if (!args.has('--no-inject')) injectRosters(history);
  console.log(JSON.stringify(report, null, 2));
}

if (args.has('--discover')) discover().catch(error => { console.error(error); process.exitCode = 1; });
else build().catch(error => { console.error(error); process.exitCode = 1; });
