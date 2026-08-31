const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const rosterArchive = fs.readFileSync('HISTORICAL_ROSTER_ARCHIVE.md', 'utf8');
let source = html.match(/<script>([\s\S]*)<\/script>/)[1];
source = source.replace(
  "if(typeof window==='undefined'){runSmoke()}else{boot()}",
  'runFeatureChecks()'
);
source += `
function assertFeature(value, message) {
  if (!value) throw new Error(message);
}
function runFeatureChecks() {
  assertFeature(rosterArchive.includes('## 1996–97 赛季') && rosterArchive.includes('#### ✅ 阿贾克斯（aja）') && rosterArchive.includes('| Edwin van der Sar |'), 'season-league-club roster archive');
  assertFeature(rosterArchive.includes('— 暂无真实数据'), 'roster archive marks missing data');
  let historicalTeams = 0, historicalPlayers = 0;
  for (let year = 1993; year <= 2007; year++) {
    const clubs = ROSTERS[year] || {};
    for (const cid in clubs) {
      const squad = clubs[cid];
      historicalTeams++;
      historicalPlayers += squad.length;
      assertFeature(squad.length >= 16 && squad.length <= 24, year + ':' + cid + ' squad size ' + squad.length);
      for (const p of squad) {
        assertFeature(typeof p[0] === 'string' && p[0] && !p[0].includes('�'), year + ':' + cid + ' invalid name');
        assertFeature(['GK','DF','MF','FW'].includes(p[1]), year + ':' + cid + ' invalid position');
        assertFeature(Number.isFinite(p[2]) && p[2] >= 45 && p[2] <= 99, year + ':' + cid + ' invalid ability');
        assertFeature(Number.isFinite(p[3]) && p[3] >= 15 && p[3] <= 50, year + ':' + cid + ' invalid age');
        assertFeature(Number.isFinite(p[4]) && p[4] >= p[2] && p[4] <= 99, year + ':' + cid + ' invalid potential');
        assertFeature(p[5] == null || Object.prototype.hasOwnProperty.call(ROLE_CN, p[5]), year + ':' + cid + ' invalid detailed role');
      }
    }
  }
  assertFeature(historicalTeams >= 1200 && historicalPlayers >= 30000, 'historical coverage');
  const anchor = (year, cid, name) => (ROSTERS[year][cid] || []).find(p => p[0] === name);
  assertFeature(anchor(1993, 'mun', 'Peter Schmeichel')[4] >= 92, 'Schmeichel anchor');
  assertFeature(anchor(1995, 'mil', 'Franco Baresi')[4] >= 94, 'Baresi anchor');
  assertFeature(anchor(1995, 'flo', 'Gabriel Batistuta')[4] >= 92, 'Batistuta anchor');
  assertFeature(anchor(2003, 'ars', 'Patrick Vieira')[5] === 'DM', 'Vieira detailed position');
  assertFeature(cnOf('Ray Parlour') === '雷·帕洛尔' && cnOf('Gary Neville') === '加里·内维尔', 'manual name translations');
  assertFeature(cnOf('Unmapped Testname') === 'Unmapped Testname', 'safe untranslated-name fallback');
  assertFeature(ROSTERS[1996].aja.length >= 20 && ['Edwin van der Sar','Jari Litmanen','Patrick Kluivert'].every(n => ROSTERS[1996].aja.some(p => p[0] === n)), '1996 Ajax real roster');
  assertFeature(!ROSTERS[1996].aja.some(p => p[0].includes('伊万诺夫')), '1996 Ajax excludes generated Ivanov');

  g = { uid: 1, year: 2011 };
  const salah = mkPlayer({name:'Mohamed Salah',nat:'EGY',pos:'FW',age:20,abi:78,pot:80});
  prepareSigning(salah);
  assertFeature(salah.pot >= 93, 'Salah potential: ' + salah.pot);

  const messi = mkPlayer({name:'Lionel Messi',pos:'FW',age:22,abi:90,pot:92});
  assertFeature(messi.ballonTier && messi.pot >= 98, 'Messi pedigree');

  const oldRandom = Math.random;
  Math.random = () => 0.5;
  const normal = {age:30,abi:90,pot:90};
  developPlayer(normal, 30);
  assertFeature(normal.age === 31 && normal.abi === 89, 'normal slow decline');
  normal.age = 33; normal.abi = 90;
  developPlayer(normal, 30);
  assertFeature(normal.abi === 88, 'normal major decline');

  const gold = {age:32,abi:96,pot:98,ballonTier:true};
  developPlayer(gold, 30);
  assertFeature(gold.abi === 96, 'Ballon peak');
  gold.age = 33;
  developPlayer(gold, 30);
  assertFeature(gold.abi === 95, 'Ballon slow decline');
  gold.age = 35; gold.abi = 95;
  developPlayer(gold, 30);
  assertFeature(gold.abi === 92, 'Ballon major decline');
  Math.random = oldRandom;

  newGame('top');
  g.deal = false;
  const capped = genPlayer('FW', 92, g.year, {club:C[g.clubId],age:18,abi:92});
  assertFeature(capped.abi <= 74 && capped.pot >= 90 && capped.generated, 'generated 18-year-old ability cap');
  const realStart = newGame('rand', 'real');
  assertFeature(realStart.worldStyle === 'real' && ROSTERS[realStart.year] && ROSTERS[realStart.year][realStart.clubId], 'real-history start always has roster data');
  assertFeature(Object.values(realStart.lgMembers).flat().every(cid => realStart.cs[cid] && realStart.cs[cid].sq.length), 'real-history start keeps complete simulated world');
  g.deal = false;
  const southAmerican = {name:'Appeal Test',nat:'ARG',dreamClub:null};
  assertFeature(clubAppeal('rma',southAmerican,'aja') >= CLUB_APPEAL.rma + 18, 'Real Madrid South American appeal bonus');
  const german = {name:'Bundesliga Test',nat:'GER',dreamClub:null};
  assertFeature(clubAppeal('bay',german,'dor') >= CLUB_APPEAL.bay + 18, 'Bayern Bundesliga appeal bonus');
  const loyal = mkPlayer({name:'Francesco Totti',nat:'ITA',pos:'FW',age:24,abi:90,pot:94});
  assertFeature(loyal.loyalty >= 92 && loyal.dreamClub === 'rom', 'loyal-player anchor');
  loyal.loyalty=20;loyal.ambition=95;loyal.moneyDrive=90;loyal.blockedMoves=0;
  applyBlockedMove(loyal,{appealGap:20});applyBlockedMove(loyal,{appealGap:20});
  assertFeature(loyal.unsettled > 0 && loyal.noRenew, 'repeated blocked move causes unrest and no-renewal');
  ui.startStyle=null;
  assertFeature(startHtml().includes('真实历史') && startHtml().includes('梦幻世界'), 'two-stage world-style selection');
  const topBar = renderTop();
  assertFeature(topBar.indexOf('⚡实力') < topBar.indexOf('ⓘ 状态影响'), 'strength chip kept in visible leading group');
  const lowCid=appealRanking(null).slice(-1)[0].cid;g.clubId=lowCid;relink();g.round=10;
  const prospect=mkPlayer({name:'Opportunity Test',nat:'ARG',pos:'FW',age:20,abi:73,pot:94});
  prospect.loyalty=25;prospect.ambition=95;prospect.dreamClub='rma';prospect.seasonApps=0;g.cs[lowCid].sq=[prospect];
  const pressure=transferPressureCase();
  assertFeature(pressure && pressure.p.id===prospect.id && pressure.missed, 'high-potential low-minutes transfer demand');
  newGame('top');g.deal=false;
  coachReport();
  const transferReport = g.coachReport;
  assertFeature(coachNeeds(transferReport).length === 2 && new Set(coachNeeds(transferReport).map(n => n.pos)).size === 2, 'two independent coach needs');
  const legacyReport = {need:coachNeeds(transferReport)[0].pos,reason:'legacy',minAbi:70,targets:[],stats:transferReport.stats,baseIds:SQ().map(p => p.id)};
  migrateCoachReport(legacyReport);
  assertFeature(coachNeeds(legacyReport).length === 2, 'legacy coach report gains second need');
  const recommended = coachNeeds(transferReport).flatMap(n => n.targets);
  assertFeature(recommended.filter(t => t.age > 23).every(t => t.abi >= 80), 'elite club mature recommendation floor');
  assertFeature(recommended.filter(t => t.age <= 23).every(t => t.abi >= 68 && t.pot >= 86), 'elite club prospect recommendation floor');
  assertFeature(coachNeeds(transferReport).every(n => n.targets.every(t => t.abi >= n.minAbi || (t.age <= 23 && t.abi >= n.minAbi - 8 && t.pot >= n.minPot))), 'every recommendation can satisfy its need');
  if (!transferReport.sells.length) transferReport.sells = [SQ()[SQ().length - 1]];
  const firstNeed = coachNeeds(transferReport)[0], secondNeed = coachNeeds(transferReport)[1];
  const needSigning = mkPlayer({name:'Coach Need Test',pos:firstNeed.pos,age:27,abi:Math.max(80,firstNeed.minAbi),pot:Math.max(80,firstNeed.minAbi)});
  SQ().push(needSigning); registerSigning(needSigning);
  assertFeature(firstNeed.fulfilled && !secondNeed.fulfilled, 'one signing completes only its matching need');
  const reportAfterSigning = coachCard();
  assertFeature(reportAfterSigning.includes('清洗建议') && reportAfterSigning.includes(POS_CN[secondNeed.pos]), 'remaining need and sales survive signing');

  const savedMoney = g.money;
  g.money = 0; g.phase = 'window'; g.marketType = 'winter'; g.mq = '';
  if (g.market[0]) g.market[0].price = Math.max(1, g.market[0].price || 1);
  assertFeature(marketListHtml().includes('data-src="market"'), 'listed-market petition entry');
  if (!secondNeed.targets.length) secondNeed.targets.push({name:'Coach Petition Test',pos:secondNeed.pos,age:21,abi:72,pot:90,price:100});
  secondNeed.targets[0].price = Math.max(1, secondNeed.targets[0].price);
  assertFeature(coachCard().includes('data-src="coach"'), 'coach-target petition entry');
  const opponent = Object.keys(g.cs).find(cid => cid !== g.clubId && g.cs[cid].sq.length);
  g.mq = g.cs[opponent].sq[0].name;
  assertFeature(marketListHtml().includes('data-src="search"'), 'search petition entry');
  g.mq = '';
  assertFeature(transferHtml().includes('冬窗作战摘要') && transferHtml().includes('当前弱点'), 'winter rank and weakness summary');
  ui.modal = {type:'petition',target:{name:'Board Test',pos:firstNeed.pos,age:21,abi:82,pot:92,price:100}};
  assertFeature(modalHtml().includes('petition-reason') && modalHtml().includes('预计'), 'petition reason modal');
  g.money = savedMoney; g.marketType = 'summer'; ui.modal = null;

  assertFeature(preMatchBrief(1).includes('data-act="accept-brief"'), 'actionable pre-match brief');
  const selectable = SQ().filter(p => !p.inj && !p.ban).slice(0, 11);
  g.manualXI = selectable.map(p => p.id);
  const selectedTeam = teamStrength(g.clubId, g.tactic.fc, g.tactic.ment, false);
  assertFeature(selectedTeam.xi.length === 11 && selectedTeam.xi.every(p => g.manualXI.includes(p.id)), 'manual starting XI');
  g.phase = 'match'; g.round = 1;
  const lineupUi = matchCard();
  assertFeature(lineupUi.includes('data-act="lineup-toggle"') && lineupUi.includes('手动首发'), 'manual lineup UI');
  g.manualXI = null;

  assertFeature(g.ucl.format === 'groups' && g.ucl.groups.length === 8 && g.ucl.groups.every(group => group.length === 4), 'UCL group draw');
  assertFeature(g.ucl.userIn && g.feed.some(card => card.title === '欧冠小组赛抽签完成'), 'UCL group announcement');
  g.phase = 'idle';
  g.round = UCL_GROUP_ROUNDS[0] - 1;
  const gamesBeforeDelegate = g.stats.games;
  autoRound();
  assertFeature(g.stats.games === gamesBeforeDelegate + 1 && g.ucl.groupRound === 1 && g.phase !== 'cupmatch' && !g.ucl.pendingTie, 'delegated UCL group match');
  for (let md = 1; md < UCL_GROUP_ROUNDS.length; md++) {
    g.phase = 'idle'; g.round = UCL_GROUP_ROUNDS[md] - 1; autoRound();
  }
  assertFeature(g.ucl.phase === 'knockout' && g.ucl.stage === 0 && g.ucl.ties.length === 8, 'UCL round-of-16 draw');
  const groupGames = Object.values(g.ucl.groupTables[g.ucl.userGroup]).map(r => r.w + r.d + r.l);
  assertFeature(groupGames.every(n => n === 6), 'six UCL group matches');
  for (const lg in g.lgs) {
    for (const cid in g.lgs[lg].table) g.lgs[lg].table[cid].w = 10;
  }
  for (const p of SQ()) p.seasonApps = 30;
  const ace = SQ()[0];
  ace.abi = 99; ace.goals = 30;
  g.ucl.winner = g.clubId;
  const award = awardBallon();
  assertFeature(award && g.ballons.length === 1 && ace.ballonTier, 'Ballon award');

  render = function() {};
  save = function() {};
  toast = function() {};
  g.phase = 'window'; g.petitioned = false; g.money = 0;
  ui.modal = {type:'petition',target:{name:'One Click Verdict',pos:'MF',age:20,abi:82,pot:92,price:100}};
  const petitionRandom = Math.random; Math.random = () => 0;
  act('petition-reason', {dataset:{reason:'future'}});
  Math.random = petitionRandom;
  assertFeature(g.petitioned && ui.modal === null && g.money > 0, 'petition reason immediately resolves once');
  const oldId = g.clubId;
  SQ().push(
    mkPlayer({name:'Mats Hummels',pos:'DF',age:25,abi:88,pot:90}),
    mkPlayer({name:'Robert Lewandowski',pos:'FW',age:25,abi:90,pot:95})
  );
  const target = Object.keys(g.cs).find(id =>
    id !== oldId && g.lgMembers[C[id].lg] && g.lgMembers[C[id].lg].includes(id)
  );
  g.feed.push({type:'text',title:'OLD CLUB EVENT',body:'must be cleared'});
  switchClub(target);
  assertFeature(g.managedClubs[oldId], 'managed history marker');
  assertFeature(!g.feed.some(card => card.title === 'OLD CLUB EVENT'), 'old-club feed cleared');
  for (const name of ['Mats Hummels', 'Robert Lewandowski']) {
    const owners = Object.keys(g.cs).filter(id => g.cs[id].sq.some(p => p.name === name));
    assertFeature(owners.length === 1 && owners[0] === oldId, name + ' duplicated');
  }

  const active = new Set(Object.values(g.lgMembers).flat());
  const dropped = CLUBS.find(c => !active.has(c.id) && c.id !== g.clubId);
  assertFeature(dropped, 'no dropped club');
  switchClub(dropped.id);
  assertFeature(g.lgMembers[dropped.lg].includes(dropped.id), 'dropped-club switch');

  gameOver('sacked');
  assertFeature(jobOffers(0).length > 0, 'sacked re-employment');
  console.log('FEATURE OK | historical rosters, manual XI, UCL groups, delegation, development, history');
}
`;

eval(source);
