"use strict";
// ================= Quests =================
const QUESTS = [
  { t: 'Open the washed-up crate on the beach', done: () => S.flags.crates >= 1 },
  { t: 'Gather sticks and stones', p: () => `${Math.min(cnt('wood'), 3)}/3 wood · ${Math.min(cnt('stone'), 2)}/2 stone`, done: () => (cnt('wood') >= 3 && cnt('stone') >= 2) || has('axe') },
  { t: 'Pull fiber from tall grass', p: () => `${Math.min(cnt('fiber'), 2)}/2 fiber`, done: () => cnt('fiber') >= 2 || has('axe') },
  { t: 'Craft a Stone Axe', p: () => isTouch ? 'Tap Craft to open crafting' : 'Press C to open crafting', done: () => has('axe') },
  { t: 'Chop down a tree', done: () => S.flags.chopped >= 1 },
  { t: 'Build a campfire before dark', p: () => `Needs 5 wood, 4 stone · ${Math.min(cnt('wood'), 5)}/5 · ${Math.min(cnt('stone'), 4)}/4`, done: () => S.flags.fires >= 1 },
  { t: 'Drink from the freshwater pond', p: () => 'The note said: north-west woods', done: () => S.flags.drank >= 1 },
  { t: 'Craft a fishing rod', done: () => has('rod') },
  { t: 'Catch a fish from the sea shore', p: () => 'Face the sea, cast, and press again when it bites', done: () => S.flags.fish >= 1 },
  { t: 'Cook food at your campfire', done: () => S.flags.cooked >= 1 },
  { t: 'Build a lean-to and sleep', p: () => 'Rope is crafted from fiber', done: () => S.flags.slept >= 1 },
  { t: 'Search the beaches for sailcloth', p: () => `${Math.min(cnt('cloth') + (has('sail') || S.flags.raft ? 2 : 0), 2)}/2 cloth · crates show on your map`, done: () => cnt('cloth') >= 2 || has('sail') || S.flags.raft },
  { t: 'Craft a sail', done: () => has('sail') || S.flags.raft },
  { t: 'Build a raft in the shallows', p: () => `${Math.min(cnt('wood'), 16)}/16 wood · ${Math.min(cnt('rope'), 4)}/4 rope`, done: () => S.flags.raft },
  { t: 'Pack 3 cooked meals and set sail', p: () => `${Math.min(cnt('cookedFish') + cnt('cookedCrab'), 3)}/3 meals`, done: () => false }
];
let questTimer = 0;
function checkQuests() {
  let advanced = false;
  while (S.q < QUESTS.length - 1 && QUESTS[S.q].done()) { S.q++; advanced = true; }
  if (advanced) { SFX.quest(); showBanner('Objective complete', 'Next: ' + QUESTS[S.q].t); saveGame(); }
}
