"use strict";
// ================= Quests =================
const QUESTS = [
  { k: 'q1', done: () => S.flags.crates >= 1 },
  { k: 'q2', p: () => t('q2.p', { w: Math.min(cnt('wood'), 3), s: Math.min(cnt('stone'), 2) }), done: () => (cnt('wood') >= 3 && cnt('stone') >= 2) || has('axe') },
  { k: 'q3', p: () => t('q3.p', { f: Math.min(cnt('fiber'), 2) }), done: () => cnt('fiber') >= 2 || has('axe') },
  { k: 'q4', p: () => t(isTouch ? 'q4.pTouch' : 'q4.p'), done: () => has('axe') },
  { k: 'q5', done: () => S.flags.chopped >= 1 },
  { k: 'q6', p: () => t('q6.p', { w: Math.min(cnt('wood'), 5), s: Math.min(cnt('stone'), 4) }), done: () => S.flags.fires >= 1 },
  { k: 'q7', p: () => t('q7.p'), done: () => S.flags.drank >= 1 },
  { k: 'q8', done: () => has('rod') },
  { k: 'q9', p: () => t('q9.p'), done: () => S.flags.fish >= 1 },
  { k: 'q10', done: () => S.flags.cooked >= 1 },
  { k: 'q11', p: () => t('q11.p'), done: () => S.flags.slept >= 1 },
  { k: 'q12', p: () => t('q12.p', { c: Math.min(cnt('cloth') + (has('sail') || S.flags.raft ? 2 : 0), 2) }), done: () => cnt('cloth') >= 2 || has('sail') || S.flags.raft },
  { k: 'q13', done: () => has('sail') || S.flags.raft },
  { k: 'q14', p: () => t('q14.p', { w: Math.min(cnt('wood'), 16), r: Math.min(cnt('rope'), 4) }), done: () => S.flags.raft },
  { k: 'q15', p: () => t('q15.p', { m: Math.min(cnt('cookedFish') + cnt('cookedCrab'), 3) }), done: () => false }
];
let questTimer = 0;
function checkQuests() {
  let advanced = false;
  while (S.q < QUESTS.length - 1 && QUESTS[S.q].done()) { S.q++; advanced = true; }
  if (advanced) { SFX.quest(); showBanner(t('banner.quest'), t('banner.next', { q: t(QUESTS[S.q].k) })); saveGame(); }
}
