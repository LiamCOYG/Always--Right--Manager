const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
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
      }
    }
  }
  assertFeature(historicalTeams >= 1200 && historicalPlayers >= 30000, 'historical coverage');
  const anchor = (year, cid, name) => (ROSTERS[year][cid] || []).find(p => p[0] === name);
  assertFeature(anchor(1993, 'mun', 'Peter Schmeichel')[4] >= 92, 'Schmeichel anchor');
  assertFeature(anchor(1995, 'mil', 'Franco Baresi')[4] >= 94, 'Baresi anchor');
  assertFeature(anchor(1995, 'flo', 'Gabriel Batistuta')[4] >= 92, 'Batistuta anchor');

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
  const oldId = g.clubId;
  SQ().push(
    mkPlayer({name:'Mats Hummels',pos:'DF',age:25,abi:88,pot:90}),
    mkPlayer({name:'Robert Lewandowski',pos:'FW',age:25,abi:90,pot:95})
  );
  const target = Object.keys(g.cs).find(id =>
    id !== oldId && g.lgMembers[C[id].lg] && g.lgMembers[C[id].lg].includes(id)
  );
  switchClub(target);
  assertFeature(g.managedClubs[oldId], 'managed history marker');
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
  console.log('FEATURE OK | historical rosters, potential, aging, Ballon dOr, history, dropped-club switch, re-employment');
}
`;

eval(source);
