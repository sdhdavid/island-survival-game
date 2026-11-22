"use strict";
// ================= Language =================
// All player-facing text lives here. t('key', { var: value }) returns the text in the current language,
// falling back to English. Static HTML uses data-i18n / data-i18n-html / data-i18n-title / data-i18n-aria.
// Hebrew text is written for a young reader: short sentences, everyday words.

const LANGS = ['en', 'he'];
const LRI = '⁦', PDI = '⁩'; // keeps "+3" reading left-to-right inside Hebrew text

const STR = {
  en: {
    'game.title': "Yoni's Island",
    'lang.other': 'עברית',
    'title.eyebrow': 'SURVIVE',
    'title.tag': 'Wash ashore, gather what the tide left, keep a fire burning through the night, and build a raft to sail home.',
    'title.loading': 'Washing ashore…',
    'title.begin': 'Begin',
    'title.new': 'New game',
    'title.continue': 'Continue',
    'keys.walk': 'walk', 'keys.use': 'use', 'keys.craft': 'craft', 'keys.eat': 'eat',

    'hud.objective': 'Objective',
    'hud.day': 'Day {n}',
    'hud.rain': 'rain',
    'hud.craftTitle': 'Crafting (C)', 'hud.craftAria': 'Open crafting',
    'hud.soundTitle': 'Sound (M)', 'hud.soundAria': 'Toggle sound',
    'hud.helpTitle': 'How to play (H)', 'hud.helpAria': 'How to play',
    'hud.eatTitle': '{item}: click to eat',
    'touch.use': 'Use', 'touch.eat': 'Eat', 'touch.craft': 'Craft',

    'craft.title': 'Crafting',
    'craft.hint': 'Time pauses while this is open. Campfires, the lean-to and the raft are placed in front of you after crafting.',
    'craft.make': 'Craft', 'craft.makePlace': 'Craft and place', 'craft.owned': 'Owned', 'craft.built': 'Built',
    'ui.close': 'Close',

    'help.title': 'How to survive',
    'help.k1': '<kbd>WASD</kbd> or arrows: walk',
    'help.k2': '<kbd>E</kbd> or <kbd>Space</kbd>: use / gather',
    'help.k3': '<kbd>C</kbd>: crafting',
    'help.k4': '<kbd>F</kbd>: eat the best food',
    'help.k5': '<kbd>Esc</kbd>: cancel placing',
    'help.k6': '<kbd>M</kbd>: sound on/off',
    'help.p1': 'Keep your four needs up. Hunger and thirst fall all day. Warmth falls after dark and in the rain, so stay close to a lit campfire at night. If any need hits zero you start losing health.',
    'help.p2': 'Drink at the freshwater pond. Click a food in your bag to eat it. Cooked fish and crab fill you up far better than raw.',
    'help.p3': 'Your goal: build a raft in the shallows, pack three cooked meals and sail home. Your progress saves automatically in this browser.',
    'help.lang': 'Language',

    'end.title': 'Home at last, Yoni!',
    'end.text': 'You sailed away from the island on day {d}. The smoke from your last campfire curled up behind you as the island shrank to a green dot on the horizon.',
    'end.days': 'days survived', 'end.fish': 'fish caught', 'end.shells': 'shells found', 'end.trees': 'trees felled',
    'end.again': 'Play again',

    'item.axe': 'Stone Axe', 'item.pickaxe': 'Stone Pickaxe', 'item.rod': 'Fishing Rod',
    'item.wood': 'Wood', 'item.stone': 'Stone', 'item.fiber': 'Fiber', 'item.rope': 'Rope', 'item.cloth': 'Sailcloth', 'item.sail': 'Sail',
    'item.berries': 'Berries', 'item.coconut': 'Coconut', 'item.fish': 'Raw Fish', 'item.crab': 'Crab Meat',
    'item.cookedFish': 'Grilled Fish', 'item.cookedCrab': 'Roast Crab', 'item.shell': 'Seashell',

    'recipe.axe': 'Stone Axe', 'recipe.axe.d': 'Chop trees for logs.',
    'recipe.campfire': 'Campfire', 'recipe.campfire.d': 'Warmth, light and a place to cook.',
    'recipe.rod': 'Fishing Rod', 'recipe.rod.d': 'Cast from any sea shore.',
    'recipe.pickaxe': 'Stone Pickaxe', 'recipe.pickaxe.d': 'Break boulders for stone.',
    'recipe.rope': 'Rope', 'recipe.rope.d': 'Twisted fiber. Holds things together.',
    'recipe.leanto': 'Lean-to', 'recipe.leanto.d': 'A dry bed. Sleep through the night.',
    'recipe.sail': 'Sail', 'recipe.sail.d': 'Stitched from salvaged sailcloth.',
    'recipe.raft': 'Raft', 'recipe.raft.d': 'Your way home. Build it in the shallows.',

    'act.crab': 'Catch the crab',
    'act.drink': 'Drink fresh water',
    'act.cast': 'Cast fishing line',
    'act.salty': 'Too salty to drink. Fresh water is inland',
    'act.chop': 'Chop tree', 'act.needAxe': 'You need a Stone Axe to chop',
    'act.shake': 'Shake palm for coconuts', 'act.noCoco': 'No coconuts left. They grow back',
    'act.mine': 'Break boulder', 'act.needPick': 'You need a Stone Pickaxe',
    'act.berries': 'Pick berries', 'act.noBerries': 'Berries are regrowing',
    'act.fiber': 'Pull fiber',
    'act.drift': 'Pick up driftwood', 'act.stick': 'Pick up stick',
    'act.pebble': 'Pick up stone', 'act.shell': 'Pick up seashell',
    'act.crate': 'Open crate',
    'act.relight': 'Relight fire with wood', 'act.fireOut': 'The fire is out. Bring wood',
    'act.cook': 'Cook {item}', 'act.addWood': 'Add wood to the fire',
    'act.fireSoon': 'Fire needs wood soon', 'act.fireGood': 'The fire is burning well',
    'act.sleep': 'Sleep until morning', 'act.sleepLater': 'Sleep here after dusk',
    'act.sail': 'Set sail for home', 'act.needMeals': 'Pack 3 cooked meals first ({n}/3)',

    'place.do': 'Place {name}',
    'place.raftHint': 'Face the shallow sea near a beach',
    'place.spotHint': 'Find an open, flat spot',
    'place.cancel': 'Cancel',
    'fish.bite': 'Reel it in!',
    'fish.wait': 'Waiting for a bite… {key} to reel in',

    'float.gain': '+{n} {item}',
    'float.drink': '+30 Thirst',
    'float.reeled': 'Reeled in',
    'float.raw': 'Raw… tummy ache',
    'float.ate': 'Ate {item}',
    'float.nothing': 'Nothing to eat',
    'float.raftFace': 'Face the shallow sea',
    'float.noRoom': 'Not enough room here',
    'float.gotAway': 'It got away…',
    'fade.sleep': 'Zzz…',
    'fade.faint': 'You collapse from exhaustion…',

    'msg.shells.t': 'Shell collector', 'msg.shells.b': 'You found every seashell on the island. A lovely souvenir to take home.',
    'msg.surprise.t': 'A surprise', 'msg.surprise.b': 'You hooked a shell instead of a fish.',
    'msg.intro.t': 'Washed ashore, Yoni', 'msg.intro.b': 'Your ship is gone, but the sea left a few things on the sand. Open the crate nearby, then gather what you can before night falls. It gets cold here.',
    'msg.back.t': 'Welcome back, Yoni', 'msg.back.b': 'Your camp is just as you left it.',
    'msg.wake.t': 'You wake up on the beach', 'msg.wake.b': 'Someone, or the tide, carried you back. Keep eating, drinking and stay near a fire at night.',
    'note1.t': 'A note, tucked in the crate', 'note1.b': 'Whoever finds this: there is a freshwater pond in the north-west woods. Rope is just grass fibre, twisted. Keep a fire going at night. — M.',
    'note2.t': 'Salvaged sailcloth', 'note2.b': 'Still dry! A raft needs a sail, plenty of rope and a lot of logs.',
    'note3.t': 'Another crate', 'note3.b': 'More sailcloth and some supplies from the ship.',

    'banner.quest': 'Well done, Yoni!', 'banner.next': 'Next: {q}',
    'banner.rain': 'Rain rolls in', 'banner.rainSub': 'Stay warm by the fire',
    'banner.day0': 'The tide brought new driftwood', 'banner.day1': 'Birds are singing in the palms',
    'banner.day2': 'Another morning on the island', 'banner.day3': 'The sea looks calm today',
    'banner.sail': 'Set sail!', 'banner.sailSub': 'Goodbye, island!',

    'q1': 'Open the washed-up crate on the beach',
    'q2': 'Gather sticks and stones', 'q2.p': '{w}/3 wood · {s}/2 stone',
    'q3': 'Pull fiber from tall grass', 'q3.p': '{f}/2 fiber',
    'q4': 'Craft a Stone Axe', 'q4.p': 'Press C to open crafting', 'q4.pTouch': 'Tap Craft to open crafting',
    'q5': 'Chop down a tree',
    'q6': 'Build a campfire before dark', 'q6.p': 'Needs 5 wood, 4 stone · {w}/5 · {s}/4',
    'q7': 'Drink from the freshwater pond', 'q7.p': 'The note said: north-west woods',
    'q8': 'Craft a fishing rod',
    'q9': 'Catch a fish from the sea shore', 'q9.p': 'Face the sea, cast, and press again when it bites',
    'q10': 'Cook food at your campfire',
    'q11': 'Build a lean-to and sleep', 'q11.p': 'Rope is crafted from fiber',
    'q12': 'Search the beaches for sailcloth', 'q12.p': '{c}/2 cloth · crates show on your map',
    'q13': 'Craft a sail',
    'q14': 'Build a raft in the shallows', 'q14.p': '{w}/16 wood · {r}/4 rope',
    'q15': 'Pack 3 cooked meals and set sail', 'q15.p': '{m}/3 meals'
  },

  he: {
    'game.title': 'האי של יוני',
    'lang.other': 'English',
    'title.eyebrow': 'הישרדות',
    'title.tag': 'נסחפת לאי בודד. אסוף מה שהים השאיר, שמור על מדורה דולקת בלילה, ובנה רפסודה כדי להפליג הביתה.',
    'title.loading': 'נסחפים לחוף…',
    'title.begin': 'מתחילים!',
    'title.new': 'משחק חדש',
    'title.continue': 'להמשיך',
    'keys.walk': 'הליכה', 'keys.use': 'פעולה', 'keys.craft': 'בנייה', 'keys.eat': 'אוכל',

    'hud.objective': 'משימה',
    'hud.day': 'יום {n}',
    'hud.rain': 'גשם',
    'hud.craftTitle': 'בנייה (C)', 'hud.craftAria': 'פתיחת חלון הבנייה',
    'hud.soundTitle': 'קול (M)', 'hud.soundAria': 'הפעלה וכיבוי של הקול',
    'hud.helpTitle': 'איך משחקים (H)', 'hud.helpAria': 'איך משחקים',
    'hud.eatTitle': '{item}: לחץ כדי לאכול',
    'touch.use': 'פעולה', 'touch.eat': 'אוכל', 'touch.craft': 'בנייה',

    'craft.title': 'בנייה',
    'craft.hint': 'הזמן עוצר כשהחלון הזה פתוח. מדורה, סוכה ורפסודה מופיעות לפניך, ואז בוחרים איפה לשים אותן.',
    'craft.make': 'לבנות', 'craft.makePlace': 'לבנות ולשים', 'craft.owned': 'כבר יש לך', 'craft.built': 'נבנתה',
    'ui.close': 'סגור',

    'help.title': 'איך שורדים באי',
    'help.k1': '<kbd>WASD</kbd> או החיצים: הליכה',
    'help.k2': '<kbd>E</kbd> או <kbd>רווח</kbd>: פעולה ואיסוף',
    'help.k3': '<kbd>C</kbd>: בנייה',
    'help.k4': '<kbd>F</kbd>: לאכול את האוכל הכי טוב',
    'help.k5': '<kbd>Esc</kbd>: ביטול הצבה',
    'help.k6': '<kbd>M</kbd>: להפעיל או לכבות את הקול',
    'help.p1': 'יש לך ארבעה מדדים: בריאות, רעב, צמא וחום. הרעב והצמא יורדים כל הזמן. בלילה ובגשם קר, אז כדאי להישאר ליד מדורה דולקת. אם מדד מגיע לאפס, הבריאות מתחילה לרדת.',
    'help.p2': 'שותים מים בבריכה שבתוך האי. כדי לאכול, לוחצים על אוכל בתיק. דג או סרטן מבושלים משביעים הרבה יותר מאוכל לא מבושל.',
    'help.p3': 'המטרה: לבנות רפסודה במים הרדודים, לארוז שלוש ארוחות מבושלות ולהפליג הביתה. המשחק נשמר לבד בדפדפן הזה.',
    'help.lang': 'שפה',

    'end.title': 'סוף סוף בבית, יוני!',
    'end.text': 'הפלגת מהאי ביום {d}. העשן מהמדורה האחרונה שלך עלה מאחוריך, והאי נהיה נקודה ירוקה קטנה באופק.',
    'end.days': 'ימים על האי', 'end.fish': 'דגים שתפסת', 'end.shells': 'צדפים שמצאת', 'end.trees': 'עצים שכרתת',
    'end.again': 'לשחק שוב',

    'item.axe': 'גרזן אבן', 'item.pickaxe': 'מכוש אבן', 'item.rod': 'חכה',
    'item.wood': 'עצים', 'item.stone': 'אבנים', 'item.fiber': 'סיבים', 'item.rope': 'חבל', 'item.cloth': 'בד מפרש', 'item.sail': 'מפרש',
    'item.berries': 'פירות יער', 'item.coconut': 'קוקוס', 'item.fish': 'דג טרי', 'item.crab': 'בשר סרטן',
    'item.cookedFish': 'דג צלוי', 'item.cookedCrab': 'סרטן צלוי', 'item.shell': 'צדף',

    'recipe.axe': 'גרזן אבן', 'recipe.axe.d': 'כורתים איתו עצים.',
    'recipe.campfire': 'מדורה', 'recipe.campfire.d': 'חום, אור ומקום לבשל.',
    'recipe.rod': 'חכה', 'recipe.rod.d': 'דגים איתה מכל חוף של הים.',
    'recipe.pickaxe': 'מכוש אבן', 'recipe.pickaxe.d': 'שוברים איתו סלעים גדולים.',
    'recipe.rope': 'חבל', 'recipe.rope.d': 'סיבים שזורים. מחזיק דברים ביחד.',
    'recipe.leanto': 'סוכה', 'recipe.leanto.d': 'מיטה יבשה. ישנים בה עד הבוקר.',
    'recipe.sail': 'מפרש', 'recipe.sail.d': 'תפור מבד המפרש שמצאת.',
    'recipe.raft': 'רפסודה', 'recipe.raft.d': 'הדרך הביתה. בונים אותה במים הרדודים.',

    'act.crab': 'לתפוס את הסרטן',
    'act.drink': 'לשתות מים',
    'act.cast': 'לזרוק את החכה',
    'act.salty': 'המים מלוחים מדי. יש מים מתוקים בתוך האי',
    'act.chop': 'לכרות את העץ', 'act.needAxe': 'צריך גרזן אבן כדי לכרות',
    'act.shake': 'לנער את הדקל', 'act.noCoco': 'אין קוקוסים. הם יגדלו שוב',
    'act.mine': 'לשבור את הסלע', 'act.needPick': 'צריך מכוש אבן',
    'act.berries': 'לקטוף פירות', 'act.noBerries': 'הפירות עוד גדלים',
    'act.fiber': 'לתלוש סיבים',
    'act.drift': 'להרים עץ מהים', 'act.stick': 'להרים מקל',
    'act.pebble': 'להרים אבן', 'act.shell': 'להרים צדף',
    'act.crate': 'לפתוח את הארגז',
    'act.relight': 'להדליק שוב עם עצים', 'act.fireOut': 'המדורה כבתה. צריך עצים',
    'act.cook': 'לבשל {item}', 'act.addWood': 'להוסיף עצים למדורה',
    'act.fireSoon': 'המדורה תצטרך עוד עצים בקרוב', 'act.fireGood': 'המדורה בוערת יפה',
    'act.sleep': 'לישון עד הבוקר', 'act.sleepLater': 'אפשר לישון כאן כשמחשיך',
    'act.sail': 'להפליג הביתה!', 'act.needMeals': 'צריך קודם 3 ארוחות מבושלות ({n}/3)',

    'place.do': 'לשים {name} כאן',
    'place.raftHint': 'פנה לים הרדוד ליד החוף',
    'place.spotHint': 'חפש מקום פנוי ושטוח',
    'place.cancel': 'ביטול',
    'fish.bite': 'משוך עכשיו!',
    'fish.wait': 'מחכים שדג ינשך… {key} כדי למשוך',

    'float.gain': LRI + '+{n}' + PDI + ' {item}',
    'float.drink': 'שתית מים',
    'float.reeled': 'משכת את החכה',
    'float.raw': 'לא מבושל… כואבת הבטן',
    'float.ate': 'אכלת {item}',
    'float.nothing': 'אין מה לאכול',
    'float.raftFace': 'פנה לים הרדוד',
    'float.noRoom': 'אין פה מספיק מקום',
    'float.gotAway': 'הדג ברח…',
    'fade.sleep': 'זזז…',
    'fade.faint': 'התעלפת מעייפות…',

    'msg.shells.t': 'אספן צדפים', 'msg.shells.b': 'מצאת את כל הצדפים באי! מזכרת יפה לקחת הביתה.',
    'msg.surprise.t': 'הפתעה!', 'msg.surprise.b': 'במקום דג, תפסת צדף.',
    'msg.intro.t': 'יוני, נסחפת לחוף!', 'msg.intro.b': 'הספינה שלך נעלמה, אבל הים השאיר כמה דברים על החול. פתח את הארגז שליד, ואסוף מה שאפשר לפני שמחשיך. בלילה קר כאן.',
    'msg.back.t': 'ברוך שובך, יוני!', 'msg.back.b': 'המחנה שלך מחכה בדיוק כמו שהשארת אותו.',
    'msg.wake.t': 'התעוררת על החוף', 'msg.wake.b': 'הגלים החזירו אותך לחוף. זכור לאכול, לשתות ולהישאר ליד מדורה בלילה.',
    'note1.t': 'פתק בתוך הארגז', 'note1.b': 'מי שמוצא את זה: יש בריכה של מים מתוקים ביער בצפון-מערב. חבל עושים מסיבים של עשב. תשמור על מדורה דולקת בלילה. — מ.',
    'note2.t': 'בד מפרש!', 'note2.b': 'עדיין יבש! לרפסודה צריך מפרש, הרבה חבלים והמון עצים.',
    'note3.t': 'עוד ארגז', 'note3.b': 'עוד בד מפרש וקצת ציוד מהספינה.',

    'banner.quest': 'כל הכבוד, יוני!', 'banner.next': 'המשימה הבאה: {q}',
    'banner.rain': 'מתחיל לרדת גשם', 'banner.rainSub': 'כדאי להתחמם ליד המדורה',
    'banner.day0': 'הגלים הביאו עוד עצים לחוף', 'banner.day1': 'הציפורים שרות בדקלים',
    'banner.day2': 'עוד בוקר על האי', 'banner.day3': 'הים שקט היום',
    'banner.sail': 'מפליגים!', 'banner.sailSub': 'להתראות, אי!',

    'q1': 'פתח את הארגז שעל החוף',
    'q2': 'אסוף מקלות ואבנים', 'q2.p': '{w}/3 עצים · {s}/2 אבנים',
    'q3': 'תלוש סיבים מהעשב הגבוה', 'q3.p': '{f}/2 סיבים',
    'q4': 'בנה גרזן אבן', 'q4.p': 'לחץ על C כדי לפתוח את חלון הבנייה', 'q4.pTouch': 'לחץ על "בנייה" כדי לפתוח את חלון הבנייה',
    'q5': 'כרות עץ',
    'q6': 'בנה מדורה לפני שמחשיך', 'q6.p': 'צריך 5 עצים ו-4 אבנים · {w}/5 · {s}/4',
    'q7': 'שתה מים מהבריכה', 'q7.p': 'בפתק היה כתוב: ביער בצפון-מערב',
    'q8': 'בנה חכה',
    'q9': 'תפוס דג מהחוף', 'q9.p': 'עמוד מול הים, זרוק את החכה, ולחץ שוב כשדג נושך',
    'q10': 'בשל אוכל במדורה',
    'q11': 'בנה סוכה ולך לישון בה', 'q11.p': 'חבל בונים מסיבים',
    'q12': 'חפש בד מפרש בחופים', 'q12.p': '{c}/2 בד · הארגזים מסומנים במפה',
    'q13': 'בנה מפרש',
    'q14': 'בנה רפסודה במים הרדודים', 'q14.p': '{w}/16 עצים · {r}/4 חבלים',
    'q15': 'ארוז 3 ארוחות מבושלות וצא להפלגה', 'q15.p': '{m}/3 ארוחות'
  }
};

function detectLang() {
  const saved = store.get('driftwood-lang');
  if (LANGS.includes(saved)) return saved;
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || '';
  return /^(he|iw)\b/i.test(nav) ? 'he' : 'en';
}
let LANG = detectLang();

function t(key, vars) {
  let s = STR[LANG][key];
  if (s == null) s = STR.en[key];
  if (s == null) return key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  return s;
}
const itemName = id => t('item.' + id);
// Font for text drawn on the canvas (floating "+3 Wood" etc.)
const canvasFont = px => LANG === 'he' ? `700 ${px}px Fredoka, Rubik, sans-serif` : `800 ${px}px Grandstander, "Trebuchet MS", sans-serif`;

function applyLang() {
  const root = document.documentElement;
  root.lang = LANG; root.dir = LANG === 'he' ? 'rtl' : 'ltr';
  document.title = t('game.title');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const el of document.querySelectorAll('.langBtn')) el.textContent = t('lang.other');
}
function setLang(l) {
  if (!LANGS.includes(l) || l === LANG) return;
  LANG = l; store.set('driftwood-lang', l);
  applyLang();
  // refresh text that was built from code
  if (typeof refreshLangDynamic === 'function') refreshLangDynamic();
}
