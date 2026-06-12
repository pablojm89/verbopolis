'use strict';
/* ============================================================
   VERBÓPOLIS v5 · La ciudad de los verbos
   App educativa gamificada · Tercer ciclo de Primaria
   GitHub Pages + Google Apps Script + Google Sheets
   ============================================================ */

const DEFAULT_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwXO7MK9U_59iEQ702-2JVKO348tDq6TCPsyDxw0nJnry6GDaKAxYy98ApHTBzmp3OJ/exec';
const TEACHER_PIN = '45612378';
const APP_VERSION = 'v5.0';

/* ------------------------------------------------------------
   1 · DATOS LINGÜÍSTICOS
   ------------------------------------------------------------ */
const PRONOUNS = ['yo', 'tú', 'él/ella', 'nosotros/as', 'vosotros/as', 'ellos/as'];
const PRONOUNS_IMP = [null, 'tú', 'usted', 'nosotros/as', 'vosotros/as', 'ustedes'];
const PERSON_LABELS = ['1.ª persona singular', '2.ª persona singular', '3.ª persona singular', '1.ª persona plural', '2.ª persona plural', '3.ª persona plural'];

const MOODS = [
  { id: 'ind', name: 'Indicativo' },
  { id: 'subj', name: 'Subjuntivo' },
  { id: 'imp', name: 'Imperativo' }
];

const TENSES = [
  { id: 'presente',         name: 'Presente',                          mood: 'ind' },
  { id: 'imperfecto',       name: 'Pretérito imperfecto',              mood: 'ind' },
  { id: 'preterito',        name: 'Pretérito perfecto simple',         mood: 'ind' },
  { id: 'futuro',           name: 'Futuro simple',                     mood: 'ind' },
  { id: 'condicional',      name: 'Condicional simple',                mood: 'ind' },
  { id: 'perfecto',         name: 'Pretérito perfecto compuesto',      mood: 'ind', compound: true },
  { id: 'pluscuamperfecto', name: 'Pretérito pluscuamperfecto',        mood: 'ind', compound: true },
  { id: 'subjPresente',     name: 'Presente de subjuntivo',            mood: 'subj' },
  { id: 'subjImperfecto',   name: 'Pret. imperfecto de subjuntivo',    mood: 'subj' },
  { id: 'imperativo',       name: 'Imperativo afirmativo',             mood: 'imp' }
];

const END = {
  presente:     { ar: ['o', 'as', 'a', 'amos', 'áis', 'an'], er: ['o', 'es', 'e', 'emos', 'éis', 'en'], ir: ['o', 'es', 'e', 'imos', 'ís', 'en'] },
  imperfecto:   { ar: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'], er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'], ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
  preterito:    { ar: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'], er: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'], ir: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
  subjPresente: { ar: ['e', 'es', 'e', 'emos', 'éis', 'en'], er: ['a', 'as', 'a', 'amos', 'áis', 'an'], ir: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
  futuro:       ['é', 'ás', 'á', 'emos', 'éis', 'án'],
  condicional:  ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
  pretFuerte:   ['e', 'iste', 'o', 'imos', 'isteis', 'ieron'],
  pretVocal:    ['í', 'íste', 'yó', 'ímos', 'ísteis', 'yeron']
};
const HABER = {
  presente:   ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
  imperfecto: ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían']
};

const GROUP_LABELS = {
  'reg-ar': 'Regular -ar', 'reg-er': 'Regular -er', 'reg-ir': 'Regular -ir',
  'orto': 'Cambio ortográfico', 'irr': 'Irregular', 'stem': 'Cambio vocálico'
};

const V = (inf, group, o = {}) => ({ inf, group, ...o });
const VERBS = [
  // ---- Regulares -ar
  V('cantar', 'reg-ar'), V('hablar', 'reg-ar'), V('estudiar', 'reg-ar'), V('bailar', 'reg-ar'),
  V('caminar', 'reg-ar'), V('dibujar', 'reg-ar'), V('escuchar', 'reg-ar'), V('saltar', 'reg-ar'),
  V('cocinar', 'reg-ar'), V('viajar', 'reg-ar'), V('ayudar', 'reg-ar'), V('mirar', 'reg-ar'),
  // ---- Regulares -er
  V('comer', 'reg-er'), V('beber', 'reg-er'), V('aprender', 'reg-er'),
  V('correr', 'reg-er'), V('vender', 'reg-er'), V('comprender', 'reg-er'),
  // ---- Regulares -ir
  V('vivir', 'reg-ir'), V('subir', 'reg-ir'), V('recibir', 'reg-ir'), V('compartir', 'reg-ir'),
  V('escribir', 'reg-ir', { part: 'escrito', tip: 'Participio irregular: escrito.' }),
  V('abrir', 'reg-ir', { part: 'abierto', tip: 'Participio irregular: abierto.' }),
  // ---- Cambios ortográficos
  V('leer', 'orto', { tip: 'En el pretérito aparece la y: leyó, leyeron.' }),
  V('buscar', 'orto', { tip: 'Para conservar el sonido /k/: yo busqué, que yo busque.' }),
  V('llegar', 'orto', { tip: 'Para conservar el sonido /g/: yo llegué, que yo llegue.' }),
  // ---- Irregulares esenciales
  V('ser', 'irr', {
    pres: ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
    pret: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
    impf: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'],
    subjPres: ['sea', 'seas', 'sea', 'seamos', 'seáis', 'sean'],
    part: 'sido', impTu: 'sé',
    tip: 'Ser es el rey de los irregulares. En pretérito comparte formas con ir: fui, fuiste…'
  }),
  V('estar', 'irr', {
    pres: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
    pretStrong: 'estuv',
    subjPres: ['esté', 'estés', 'esté', 'estemos', 'estéis', 'estén'],
    tip: 'Estar lleva tilde en muchas formas: estás, está, estés…'
  }),
  V('ir', 'irr', {
    pres: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
    pret: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
    impf: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'],
    subjPres: ['vaya', 'vayas', 'vaya', 'vayamos', 'vayáis', 'vayan'],
    ger: 'yendo', imp: [null, 've', 'vaya', 'vamos', 'id', 'vayan'],
    tip: 'Ir es muy irregular: voy, fui, iba, vaya… ¡todo cambia!'
  }),
  V('tener', 'irr', {
    presYo: 'tengo', presStem: 'tien', pretStrong: 'tuv', futStem: 'tendr',
    subjStemNos: 'teng', impTu: 'ten',
    tip: 'Tengo, tienes… Pretérito fuerte: tuve. Futuro: tendré.'
  }),
  V('hacer', 'irr', {
    presYo: 'hago', pretStrong: 'hic', futStem: 'har', part: 'hecho', impTu: 'haz',
    tip: 'Hago, hice, hizo (con z), haré, hecho.'
  }),
  V('decir', 'irr', {
    presYo: 'digo', presStem: 'dic', pretStrong: 'dij', futStem: 'dir',
    part: 'dicho', ger: 'diciendo', subjStemNos: 'dig', impTu: 'di',
    tip: 'Digo, dije, diré, dicho. En pretérito: dijeron (sin i).'
  }),
  V('poner', 'irr', {
    presYo: 'pongo', pretStrong: 'pus', futStem: 'pondr', part: 'puesto', impTu: 'pon',
    tip: 'Pongo, puse, pondré, puesto.'
  }),
  V('salir', 'irr', {
    presYo: 'salgo', futStem: 'saldr', impTu: 'sal',
    tip: 'Salgo, saldré. Imperativo: ¡sal!'
  }),
  V('venir', 'irr', {
    presYo: 'vengo', presStem: 'vien', pretStrong: 'vin', futStem: 'vendr',
    ger: 'viniendo', subjStemNos: 'veng', impTu: 'ven',
    tip: 'Vengo, vienes, vine, vendré. Imperativo: ¡ven!'
  }),
  V('traer', 'irr', {
    presYo: 'traigo', pretStrong: 'traj',
    tip: 'Traigo, traje, trajeron (sin i).'
  }),
  V('ver', 'irr', {
    presYo: 'veo',
    pret: ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron'],
    impf: ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'],
    part: 'visto',
    tip: 'Veo, vi (sin tilde), veía, visto.'
  }),
  V('dar', 'irr', {
    presYo: 'doy',
    pret: ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'],
    subjPres: ['dé', 'des', 'dé', 'demos', 'deis', 'den'],
    tip: 'Doy, di, dio (sin tilde). Subjuntivo: dé (con tilde).'
  }),
  V('saber', 'irr', {
    presYo: 'sé', pretStrong: 'sup', futStem: 'sabr',
    subjPres: ['sepa', 'sepas', 'sepa', 'sepamos', 'sepáis', 'sepan'],
    tip: 'Sé (con tilde), supe, sabré, sepa.'
  }),
  V('querer', 'irr', {
    presYo: 'quiero', presStem: 'quier', pretStrong: 'quis', futStem: 'querr',
    subjStemNos: 'quer',
    tip: 'Quiero, quise, querré (con doble r).'
  }),
  V('poder', 'irr', {
    presYo: 'puedo', presStem: 'pued', pretStrong: 'pud', futStem: 'podr',
    ger: 'pudiendo', subjStemNos: 'pod',
    tip: 'Puedo, pude, podré, pudiendo.'
  }),
  V('oír', 'irr', {
    pres: ['oigo', 'oyes', 'oye', 'oímos', 'oís', 'oyen'],
    futStem: 'oir', subjStem: 'oig', subjStemNos: 'oig',
    tip: 'Oigo, oyes. Pretérito con y: oyó, oyeron.'
  }),
  // ---- Cambio vocálico
  V('pensar', 'stem', { presYo: 'pienso', presStem: 'piens', tip: 'e→ie: pienso, piensas… pero nosotros pensamos.' }),
  V('cerrar', 'stem', { presYo: 'cierro', presStem: 'cierr', tip: 'e→ie: cierro, cierras… pero nosotros cerramos.' }),
  V('perder', 'stem', { presYo: 'pierdo', presStem: 'pierd', tip: 'e→ie: pierdo… pero nosotros perdemos.' }),
  V('empezar', 'stem', { presYo: 'empiezo', presStem: 'empiez', tip: 'e→ie y cambio de z a c: yo empecé, que yo empiece.' }),
  V('contar', 'stem', { presYo: 'cuento', presStem: 'cuent', tip: 'o→ue: cuento… pero nosotros contamos.' }),
  V('encontrar', 'stem', { presYo: 'encuentro', presStem: 'encuentr', tip: 'o→ue: encuentro… pero nosotros encontramos.' }),
  V('volver', 'stem', { presYo: 'vuelvo', presStem: 'vuelv', part: 'vuelto', tip: 'o→ue: vuelvo. Participio irregular: vuelto.' }),
  V('jugar', 'stem', { presYo: 'juego', presStem: 'jueg', tip: 'u→ue: juego… pero nosotros jugamos. Pretérito: jugué.' }),
  V('pedir', 'stem', { presYo: 'pido', presStem: 'pid', pretRaise: 'pid', subjStemNos: 'pid', ger: 'pidiendo', tip: 'e→i: pido, pidió, pidiendo.' }),
  V('servir', 'stem', { presYo: 'sirvo', presStem: 'sirv', pretRaise: 'sirv', subjStemNos: 'sirv', ger: 'sirviendo', tip: 'e→i: sirvo, sirvió, sirviendo.' }),
  V('seguir', 'stem', { presYo: 'sigo', presStem: 'sigu', pretRaise: 'sigu', subjStemNos: 'sig', ger: 'siguiendo', tip: 'e→i: sigo (sin u), sigues, siguió.' }),
  V('repetir', 'stem', { presYo: 'repito', presStem: 'repit', pretRaise: 'repit', subjStemNos: 'repit', ger: 'repitiendo', tip: 'e→i: repito, repitió, repitiendo.' }),
  V('sentir', 'stem', { presYo: 'siento', presStem: 'sient', pretRaise: 'sint', subjStemNos: 'sint', ger: 'sintiendo', tip: 'e→ie: siento. Pero: sintió, sintamos.' }),
  V('dormir', 'stem', { presYo: 'duermo', presStem: 'duerm', pretRaise: 'durm', subjStemNos: 'durm', ger: 'durmiendo', tip: 'o→ue: duermo. Pero: durmió, durmamos.' })
];
const VERB_INDEX = Object.fromEntries(VERBS.map(v => [v.inf, v]));

/* ------------------------------------------------------------
   2 · MOTOR DE CONJUGACIÓN
   ------------------------------------------------------------ */
function verbClass(inf) {
  if (inf.endsWith('ar')) return 'ar';
  if (inf.endsWith('er')) return 'er';
  return 'ir'; // incluye -ir y -ír (oír)
}
function verbStem(inf) { return inf.slice(0, -2); }

function accentLastVowel(s) {
  const map = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
  for (let i = s.length - 1; i >= 0; i--) {
    if (map[s[i]]) return s.slice(0, i) + map[s[i]] + s.slice(i + 1);
  }
  return s;
}
// Conserva el sonido de la raíz delante de e/é: c→qu, g→gu, z→c
function fixOrthoE(stem) {
  if (stem.endsWith('c')) return stem.slice(0, -1) + 'qu';
  if (stem.endsWith('g')) return stem + 'u';
  if (stem.endsWith('z')) return stem.slice(0, -1) + 'c';
  return stem;
}
function endsInVowel(s) { return /[aeo]$/.test(s); }

function participle(v) {
  if (v.part) return v.part;
  const cls = verbClass(v.inf), stem = verbStem(v.inf);
  if (cls === 'ar') return stem + 'ado';
  return stem + (endsInVowel(stem) ? 'ído' : 'ido');
}
function gerund(v) {
  if (v.ger) return v.ger;
  const cls = verbClass(v.inf), stem = verbStem(v.inf);
  if (cls === 'ar') return stem + 'ando';
  return stem + (endsInVowel(stem) ? 'yendo' : 'iendo');
}

const conjCache = {};
function conjugate(v, tenseId) {
  if (typeof v === 'string') v = VERB_INDEX[v];
  const key = v.inf + '|' + tenseId;
  if (conjCache[key]) return conjCache[key];
  const cls = verbClass(v.inf), stem = verbStem(v.inf);
  let f;

  if (tenseId === 'presente') {
    if (v.pres) f = [...v.pres];
    else {
      f = END.presente[cls].map(e => stem + e);
      if (v.presYo) f[0] = v.presYo;
      if (v.presStem) [1, 2, 5].forEach(i => { f[i] = v.presStem + END.presente[cls][i]; });
    }
  } else if (tenseId === 'imperfecto') {
    f = v.impf ? [...v.impf] : END.imperfecto[cls].map(e => stem + e);
  } else if (tenseId === 'preterito') {
    if (v.pret) f = [...v.pret];
    else if (v.pretStrong) {
      const s = v.pretStrong;
      f = END.pretFuerte.map(e => s + e);
      if (s.endsWith('c')) f[2] = s.slice(0, -1) + 'z' + 'o';            // hizo
      if (s.endsWith('j')) f[5] = s + 'eron';                            // dijeron, trajeron
    } else {
      const ends = (cls !== 'ar' && endsInVowel(stem)) ? END.pretVocal : END.preterito[cls];
      f = ends.map(e => stem + e);
      if (cls === 'ar') f[0] = fixOrthoE(stem) + 'é';                    // jugué, busqué, empecé
      if (v.pretRaise) { f[2] = v.pretRaise + 'ió'; f[5] = v.pretRaise + 'ieron'; } // pidió, durmió
    }
  } else if (tenseId === 'futuro') {
    f = END.futuro.map(e => (v.futStem || v.inf) + e);
  } else if (tenseId === 'condicional') {
    f = END.condicional.map(e => (v.futStem || v.inf) + e);
  } else if (tenseId === 'perfecto') {
    const p = participle(v); f = HABER.presente.map(h => h + ' ' + p);
  } else if (tenseId === 'pluscuamperfecto') {
    const p = participle(v); f = HABER.imperfecto.map(h => h + ' ' + p);
  } else if (tenseId === 'subjPresente') {
    if (v.subjPres) f = [...v.subjPres];
    else {
      let s1 = v.subjStem || (v.presYo && v.presYo.endsWith('o') ? v.presYo.slice(0, -1) : stem);
      let sNos = v.subjStemNos || (v.presStem ? stem : s1);
      if (cls === 'ar') { s1 = fixOrthoE(s1); sNos = fixOrthoE(sNos); }   // juegue, busque, empiece
      const ends = END.subjPresente[cls];
      f = ends.map((e, i) => ((i === 3 || i === 4) ? sNos : s1) + e);
    }
  } else if (tenseId === 'subjImperfecto') {
    const base = conjugate(v, 'preterito')[5].slice(0, -3);              // cantaron → canta
    f = [base + 'ra', base + 'ras', base + 'ra', accentLastVowel(base) + 'ramos', base + 'rais', base + 'ran'];
  } else if (tenseId === 'imperativo') {
    if (v.imp) f = [...v.imp];
    else {
      const sp = conjugate(v, 'subjPresente'), pr = conjugate(v, 'presente');
      f = [null, v.impTu || pr[2], sp[2], sp[3], v.inf.slice(0, -1) + 'd', sp[5]];
    }
  }
  conjCache[key] = f;
  return f;
}

// Personas válidas para preguntar en un tiempo dado
function validPersons(tenseId) {
  return tenseId === 'imperativo' ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5];
}
function pronounFor(tenseId, person) {
  return tenseId === 'imperativo' ? PRONOUNS_IMP[person] : PRONOUNS[person];
}
function tenseById(id) { return TENSES.find(t => t.id === id); }
function tenseName(id) { return tenseById(id)?.name || id; }
function moodName(id) { return MOODS.find(m => m.id === id)?.name || id; }

/* ------------------------------------------------------------
   3 · CAMPAÑA: MUNDOS Y NIVELES
   ------------------------------------------------------------ */
const WORLDS = [
  { id: 1, name: 'Villa Presente', emoji: '🏡', theme: 'w1', desc: 'Aquí todo ocurre ahora: el presente de indicativo.' },
  { id: 2, name: 'Bosque del Ayer', emoji: '🌳', theme: 'w2', desc: 'Recuerdos que duran: el pretérito imperfecto.' },
  { id: 3, name: 'Castillo del Pretérito', emoji: '🏰', theme: 'w3', desc: 'Acciones terminadas: el pretérito perfecto simple.' },
  { id: 4, name: 'Puerto del Mañana', emoji: '⛵', theme: 'w4', desc: 'Rumbo al futuro y al condicional.' },
  { id: 5, name: 'Templo Compuesto', emoji: '⛩️', theme: 'w5', desc: 'El poder del verbo haber: tiempos compuestos.' },
  { id: 6, name: 'Cumbre Subjuntiva', emoji: '🌋', theme: 'w6', desc: 'La cima: subjuntivo e imperativo.' }
];

const byGroup = (...gs) => VERBS.filter(v => gs.includes(v.group)).map(v => v.inf);
const REG = byGroup('reg-ar', 'reg-er', 'reg-ir');
const ALL_VERBS = VERBS.map(v => v.inf);
const STEM_VERBS = byGroup('stem');
const IRR_VERBS = byGroup('irr');

const LEVELS = [
  // ---- Mundo 1 · Villa Presente
  { id: 1, world: 1, emoji: '🎶', name: 'Los cantores de la villa', tenses: ['presente'], verbs: byGroup('reg-ar'), types: ['elige', 'parejas', 'escribe'], n: 8 },
  { id: 2, world: 1, emoji: '🥖', name: 'El mercado de -er e -ir', tenses: ['presente'], verbs: byGroup('reg-er', 'reg-ir'), types: ['elige', 'parejas', 'escribe'], n: 8 },
  { id: 3, world: 1, emoji: '🛡️', name: 'Los cuatro guardianes', tenses: ['presente'], verbs: ['ser', 'estar', 'ir', 'tener'], types: ['elige', 'escribe', 'parejas'], n: 10 },
  { id: 4, world: 1, emoji: '🕵️', name: 'La pandilla del YO', tenses: ['presente'], verbs: ['hacer', 'decir', 'poner', 'salir', 'venir', 'ver', 'dar', 'saber', 'oír', 'traer'], types: ['elige', 'escribe', 'cazafallos'], n: 10 },
  { id: 5, world: 1, emoji: '💃', name: 'El baile de las vocales', tenses: ['presente'], verbs: STEM_VERBS, types: ['elige', 'escribe', 'cazafallos', 'construye'], n: 10 },
  { id: 6, world: 1, emoji: '🐲', name: 'JEFE: Dragón del Presente', tenses: ['presente'], verbs: ALL_VERBS, types: ['elige', 'escribe', 'detective', 'cazafallos', 'construye', 'frase'], n: 12, boss: true },
  // ---- Mundo 2 · Bosque del Ayer
  { id: 7, world: 2, emoji: '🍄', name: 'Cuando era pequeño…', tenses: ['imperfecto'], verbs: byGroup('reg-ar'), types: ['elige', 'parejas', 'escribe'], n: 8 },
  { id: 8, world: 2, emoji: '🦌', name: 'Historias del bosque', tenses: ['imperfecto'], verbs: byGroup('reg-er', 'reg-ir', 'orto'), types: ['elige', 'escribe', 'construye'], n: 8 },
  { id: 9, world: 2, emoji: '🧙', name: 'Los tres ancianos: ser, ir y ver', tenses: ['imperfecto'], verbs: ['ser', 'ir', 'ver', 'tener', 'hacer', 'jugar', 'querer'], types: ['elige', 'escribe', 'cazafallos'], n: 10 },
  { id: 10, world: 2, emoji: '🦉', name: 'JEFE: Búho de los Recuerdos', tenses: ['imperfecto', 'presente'], verbs: ALL_VERBS, types: ['elige', 'escribe', 'detective', 'frase', 'cazafallos'], n: 12, boss: true },
  // ---- Mundo 3 · Castillo del Pretérito
  { id: 11, world: 3, emoji: '🚪', name: 'La puerta de -ar', tenses: ['preterito'], verbs: [...byGroup('reg-ar'), 'buscar', 'llegar', 'empezar', 'jugar'], types: ['elige', 'escribe', 'parejas'], n: 10 },
  { id: 12, world: 3, emoji: '🏹', name: 'Las almenas de -er e -ir', tenses: ['preterito'], verbs: [...byGroup('reg-er', 'reg-ir'), 'leer'], types: ['elige', 'escribe', 'construye'], n: 10 },
  { id: 13, world: 3, emoji: '⚔️', name: 'Caballeros fuertes I', tenses: ['preterito'], verbs: ['ser', 'ir', 'estar', 'tener', 'hacer', 'dar', 'ver'], types: ['elige', 'escribe', 'cazafallos'], n: 10 },
  { id: 14, world: 3, emoji: '🐴', name: 'Caballeros fuertes II', tenses: ['preterito'], verbs: ['poder', 'poner', 'decir', 'querer', 'venir', 'traer', 'saber', 'pedir', 'dormir', 'seguir', 'sentir'], types: ['elige', 'escribe', 'cazafallos', 'construye'], n: 10 },
  { id: 15, world: 3, emoji: '🛡️', name: 'JEFE: ¿Pretérito o imperfecto?', tenses: ['preterito', 'imperfecto'], verbs: ALL_VERBS, types: ['elige', 'escribe', 'detective', 'frase'], n: 12, boss: true },
  // ---- Mundo 4 · Puerto del Mañana
  { id: 16, world: 4, emoji: '⛵', name: 'Zarpamos hacia el futuro', tenses: ['futuro'], verbs: REG, types: ['elige', 'escribe', 'parejas'], n: 8 },
  { id: 17, world: 4, emoji: '🌩️', name: 'Tormenta irregular', tenses: ['futuro'], verbs: ['tener', 'poner', 'hacer', 'decir', 'poder', 'salir', 'venir', 'querer', 'saber'], types: ['elige', 'escribe', 'cazafallos'], n: 10 },
  { id: 18, world: 4, emoji: '🏝️', name: 'La isla de los deseos', tenses: ['condicional'], verbs: [...REG, 'tener', 'hacer', 'poder', 'salir', 'decir'], types: ['elige', 'escribe', 'frase'], n: 10 },
  { id: 19, world: 4, emoji: '🐙', name: 'JEFE: Kraken del Mañana', tenses: ['futuro', 'condicional'], verbs: ALL_VERBS, types: ['elige', 'escribe', 'detective', 'cazafallos', 'frase'], n: 12, boss: true },
  // ---- Mundo 5 · Templo Compuesto
  { id: 20, world: 5, emoji: '🗝️', name: 'Las reliquias del HABER', tenses: ['perfecto'], verbs: REG, types: ['elige', 'escribe', 'parejas'], n: 8 },
  { id: 21, world: 5, emoji: '🎭', name: 'Participios rebeldes', tenses: ['perfecto'], verbs: ['hacer', 'decir', 'escribir', 'ver', 'poner', 'volver', 'abrir'], types: ['elige', 'escribe', 'cazafallos'], n: 10 },
  { id: 22, world: 5, emoji: '⏳', name: 'La cámara del pluscuamperfecto', tenses: ['pluscuamperfecto'], verbs: [...REG, 'hacer', 'decir', 'ver', 'escribir'], types: ['elige', 'escribe', 'frase'], n: 10 },
  { id: 23, world: 5, emoji: '🗿', name: 'JEFE: Guardián Compuesto', tenses: ['perfecto', 'pluscuamperfecto'], verbs: ALL_VERBS, types: ['elige', 'escribe', 'detective', 'frase'], n: 12, boss: true },
  // ---- Mundo 6 · Cumbre Subjuntiva
  { id: 24, world: 6, emoji: '📣', name: '¡Órdenes del capitán!', tenses: ['imperativo'], verbs: ['cantar', 'comer', 'vivir', 'tener', 'hacer', 'decir', 'poner', 'salir', 'venir', 'ir', 'ser', 'abrir', 'escuchar'], types: ['elige', 'escribe', 'frase'], n: 10 },
  { id: 25, world: 6, emoji: '🌀', name: 'El portal de los deseos', tenses: ['subjPresente'], verbs: REG, types: ['elige', 'escribe', 'parejas'], n: 10 },
  { id: 26, world: 6, emoji: '✨', name: 'Magia irregular', tenses: ['subjPresente'], verbs: [...IRR_VERBS, 'pensar', 'jugar', 'pedir', 'dormir', 'empezar'], types: ['elige', 'escribe', 'cazafallos'], n: 10 },
  { id: 27, world: 6, emoji: '🌫️', name: 'Las brumas del pasado', tenses: ['subjImperfecto'], verbs: [...REG, 'ser', 'estar', 'tener', 'hacer', 'ir', 'decir', 'poder'], types: ['elige', 'escribe', 'frase'], n: 10 },
  { id: 28, world: 6, emoji: '🧙‍♂️', name: 'JEFE: Archimago Subjuntivo', tenses: ['subjPresente', 'subjImperfecto', 'imperativo'], verbs: ALL_VERBS, types: ['elige', 'escribe', 'detective', 'cazafallos', 'frase'], n: 12, boss: true },
  { id: 29, world: 6, emoji: '👑', name: 'GRAN FINAL: La Torre de Verbópolis', tenses: TENSES.map(t => t.id), verbs: ALL_VERBS, types: ['elige', 'escribe', 'detective', 'cazafallos', 'construye', 'frase', 'parejas'], n: 16, boss: true }
];
const MAX_LEVEL = LEVELS.length;

/* ------------------------------------------------------------
   4 · GAMIFICACIÓN: RANGOS, INSIGNIAS, AVATARES, FRASES
   ------------------------------------------------------------ */
const RANKS = [
  { xp: 0, emoji: '🌱', name: 'Semilla Verbal' },
  { xp: 150, emoji: '📖', name: 'Aprendiz' },
  { xp: 400, emoji: '🧭', name: 'Explorador/a' },
  { xp: 800, emoji: '🗺️', name: 'Aventurero/a' },
  { xp: 1400, emoji: '⚔️', name: 'Caballero/Dama Verbal' },
  { xp: 2200, emoji: '🪄', name: 'Mago/a de los Tiempos' },
  { xp: 3200, emoji: '🏆', name: 'Gran Maestre' },
  { xp: 4500, emoji: '🐲', name: 'Leyenda de Verbópolis' }
];
function rankFor(xp) {
  let r = RANKS[0];
  for (const k of RANKS) if (xp >= k.xp) r = k;
  return r;
}
function nextRank(xp) { return RANKS.find(k => k.xp > xp) || null; }

const BADGES = [
  { id: 'first', icon: '🌟', name: 'Primer reto', desc: 'Responde tu primera pregunta' },
  { id: 'streak5', icon: '🔥', name: 'Racha ×5', desc: '5 aciertos seguidos' },
  { id: 'streak10', icon: '⚡', name: 'Racha ×10', desc: '10 aciertos seguidos' },
  { id: 'streak20', icon: '🌪️', name: 'Racha ×20', desc: '20 aciertos seguidos' },
  { id: 'xp250', icon: '💎', name: '250 XP', desc: 'Consigue 250 XP' },
  { id: 'xp1000', icon: '👑', name: '1000 XP', desc: 'Consigue 1000 XP' },
  { id: 'boss1', icon: '🐲', name: 'Cazadragones', desc: 'Vence a tu primer jefe' },
  { id: 'world3', icon: '🏰', name: 'Conquistador/a', desc: 'Completa 3 mundos' },
  { id: 'stars15', icon: '✨', name: 'Coleccionista', desc: 'Consigue 15 estrellas' },
  { id: 'perfect', icon: '🎯', name: 'Nivel perfecto', desc: 'Un nivel sin ningún fallo' },
  { id: 'subj1', icon: '🪄', name: 'Subjuntivo desbloqueado', desc: 'Acierta 10 formas de subjuntivo' },
  { id: 'irregular20', icon: '🦾', name: 'Domador irregular', desc: 'Acierta 20 verbos irregulares' },
  { id: 'days5', icon: '📅', name: 'Constancia ×5', desc: 'Juega 5 días seguidos' },
  { id: 'exam9', icon: '📝', name: 'Matrícula de honor', desc: 'Saca un 9 o más en una evaluación' },
  { id: 'review10', icon: '🔁', name: 'Cazaerrores', desc: 'Corrige 10 errores en el repaso' }
];

const AVATARS = [
  { e: '🦉', rank: 0 }, { e: '🦊', rank: 0 }, { e: '🐢', rank: 0 }, { e: '🐧', rank: 0 }, { e: '🐸', rank: 0 },
  { e: '🐼', rank: 0 }, { e: '🐱', rank: 0 }, { e: '🐶', rank: 0 }, { e: '🐨', rank: 0 }, { e: '🐯', rank: 0 },
  { e: '🦄', rank: 2 }, { e: '🐙', rank: 2 }, { e: '🦋', rank: 2 }, { e: '🐳', rank: 2 },
  { e: '🦁', rank: 3 }, { e: '🦅', rank: 3 }, { e: '🐺', rank: 3 },
  { e: '🔥', rank: 4 }, { e: '⚡', rank: 4 }, { e: '🌟', rank: 5 }, { e: '🧿', rank: 5 },
  { e: '🐉', rank: 6 }, { e: '👑', rank: 7 }
];

// Marcos de oración para el tipo de pregunta «frase»
const FRAMES = {
  presente: ['Todos los días {p} {gap} ({v}).', 'Ahora mismo {p} {gap} ({v}) en clase.'],
  imperfecto: ['Cuando era pequeño/a, {p} {gap} ({v}) mucho.', 'Antes {p} {gap} ({v}) cada tarde.'],
  preterito: ['Ayer {p} {gap} ({v}).', 'El sábado pasado {p} {gap} ({v}).'],
  futuro: ['Mañana {p} {gap} ({v}).', 'El año que viene {p} {gap} ({v}).'],
  condicional: ['Con más tiempo, {p} {gap} ({v}) más.', 'Si fuera posible, {p} {gap} ({v}) hoy.'],
  perfecto: ['Esta semana {p} ya {gap} ({v}).', 'Hoy {p} {gap} ({v}) por fin.'],
  pluscuamperfecto: ['Cuando llegamos, {p} ya {gap} ({v}).', 'Antes de la cena, {p} ya {gap} ({v}).'],
  subjPresente: ['El maestro quiere que {p} {gap} ({v}).', 'Es importante que {p} {gap} ({v}).'],
  subjImperfecto: ['Ojalá {p} {gap} ({v}).', 'Me gustaría que {p} {gap} ({v}).'],
  imperativo: ['¡{gap} ({v}) ahora, {p}!', 'Por favor, {p}: ¡{gap} ({v})!']
};

const DEFAULT_GROUPS = ['5.ºA', '5.ºB', '6.ºA', '6.ºB'];

/* ------------------------------------------------------------
   5 · UTILIDADES Y PERSISTENCIA
   ------------------------------------------------------------ */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const sample = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uid = () => 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
const escapeHtml = str => String(str ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const stripAccents = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const normalize = s => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
// Codificación ligera de contraseñas: evita el cotilleo casual, no es cifrado fuerte.
const encPw = p => { try { return p ? btoa(unescape(encodeURIComponent(p))).split('').reverse().join('') : ''; } catch { return ''; } };
const decPw = e => { try { return e ? decodeURIComponent(escape(atob(e.split('').reverse().join('')))) : ''; } catch { return ''; } };
const todayKey = () => new Date().toISOString().slice(0, 10);
function weekKey() {
  const d = new Date(); const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-S${week}`;
}
function loadJSON(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* almacenamiento lleno o bloqueado */ } }

let settings = loadJSON('verbopolis-settings', {});
settings = Object.assign({ backendUrl: DEFAULT_BACKEND_URL, classCode: '', accessible: false, quiet: false, sound: true, strictAccents: false }, settings);
let groups = loadJSON('verbopolis-groups', DEFAULT_GROUPS);
let students = loadJSON('verbopolis-students', []);
let missions = loadJSON('verbopolis-missions', {});
let exams = loadJSON('verbopolis-exams', []);
let groupLimits = loadJSON('verbopolis-group-limits', {});   // {grupo: nivelMáximo}
let queue = loadJSON('verbopolis-sync-queue', []);
let state = null, game = null, currentQuestion = null;
let teacherUnlocked = sessionStorage.getItem('verbopolis-teacher-unlocked') === '1';

function getStudentState(sid) {
  const s = students.find(x => x.id === sid) || students[0];
  const st = loadJSON('verbopolis-state-' + sid, {});
  return Object.assign({
    id: s.id, name: s.name, group: s.group, avatar: s.avatar,
    xp: 0, total: 0, correct: 0, streak: 0, bestStreak: 0,
    levels: {},                 // {levelId: {stars, best}}
    mastery: {},                // {tenseId: {ok, n}}
    verbStats: {},              // {inf: {ok, n}}
    mistakes: [], badges: [], log: [], examsDone: [],
    weekly: { key: weekKey(), xp: 0 },
    daily: { last: '', count: 0 },
    subjOk: 0, irregularOk: 0, reviewFixed: 0,
    cloudSaves: 0, lastSync: '', updatedAt: ''
  }, st);
}
function saveState() {
  if (!state) return;
  const s = students.find(x => x.id === state.id);
  if (s) { state.name = s.name; state.group = s.group; state.avatar = s.avatar; }
  checkBadges();
  state.updatedAt = new Date().toISOString();
  saveJSON('verbopolis-state-' + state.id, state);
}
// Versión recortada del estado para la nube (la hoja tiene límite por celda)
function slimState(st) {
  const copy = JSON.parse(JSON.stringify(st));
  copy.log = (copy.log || []).slice(0, 10);
  copy.mistakes = (copy.mistakes || []).slice(0, 40);
  copy.examsDone = (copy.examsDone || []).map((e, i, arr) => i >= arr.length - 2 ? e : { ...e, details: undefined });
  return copy;
}
// Sube una «foto» del progreso a la hoja. Usa la cola: si no hay internet, irá después.
function pushStateSnapshot() {
  if (!state || !settings.backendUrl) return;
  queue = queue.filter(e => !(e.type === 'state_snapshot' && e.studentId === state.id));
  queueEvent('state_snapshot', { studentId: state.id, studentName: state.name, group: state.group, avatar: state.avatar, state: slimState(state) });
  syncQueue(false);
}
// Recupera el progreso guardado en la hoja y lo adopta si va por delante del local.
function fetchRemoteState(sid, localStamp) {
  if (!settings.backendUrl) return;
  jsonp('state', { studentId: sid }, res => {
    if (!state || state.id !== sid) return;
    const remote = res && res.ok && res.state;
    if (remote && remote.updatedAt && remote.updatedAt > (localStamp || '') && (!game || !localStamp)) {
      remote.id = sid;
      saveJSON('verbopolis-state-' + sid, remote);
      state = getStudentState(sid);
      touchDaily();
      saveState();
      renderAll();
      if (remote.xp) toast(`Tu progreso ha viajado contigo: ${state.xp} XP`, '🎒');
    } else if (!remote || (remote.updatedAt || '') < (state.updatedAt || '')) {
      pushStateSnapshot(); // la nube va por detrás: la ponemos al día
    }
  });
}
function maxLevelForGroup(group) {
  const lim = Number(groupLimits[group]);
  return lim >= 1 && lim <= MAX_LEVEL ? lim : MAX_LEVEL;
}
function highestUnlocked(st) {
  let unlocked = 1;
  for (const l of LEVELS) { if ((st.levels[l.id]?.stars || 0) >= 1 && l.id + 1 > unlocked) unlocked = l.id + 1; }
  return Math.min(unlocked, maxLevelForGroup(st.group));
}
function unlockedTenses(st) {
  const top = highestUnlocked(st);
  const set = new Set();
  LEVELS.filter(l => l.id <= top).forEach(l => l.tenses.forEach(t => set.add(t)));
  return TENSES.filter(t => set.has(t.id)).map(t => t.id);
}
function touchDaily() {
  const today = todayKey();
  if (state.daily.last === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  state.daily.count = state.daily.last === yesterday ? state.daily.count + 1 : 1;
  state.daily.last = today;
}
function addXp(amount) {
  state.xp += amount;
  if (state.weekly.key !== weekKey()) state.weekly = { key: weekKey(), xp: 0 };
  state.weekly.xp += amount;
}

/* ------------------------------------------------------------
   6 · SONIDO, VOZ Y EFECTOS
   ------------------------------------------------------------ */
let audioCtx = null;
function beep(freqs, dur = 0.12, type = 'sine', gain = 0.12) {
  if (!settings.sound || settings.quiet) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(gain, audioCtx.currentTime + i * dur);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * dur + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + i * dur); o.stop(audioCtx.currentTime + i * dur + dur);
    });
  } catch { /* sin audio */ }
}
const sndOk = () => beep([523, 659, 784], 0.1, 'triangle');
const sndBad = () => beep([196, 165], 0.16, 'sawtooth', 0.06);
const sndLevelUp = () => beep([523, 659, 784, 1047, 1319], 0.12, 'triangle');
const sndStar = () => beep([880, 1175], 0.1, 'sine');

function speak(text, rate = 0.95) {
  if (!('speechSynthesis' in window)) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-ES'; u.rate = rate;
  speechSynthesis.speak(u);
  return true;
}
function confetti(n = 14) {
  if (settings.quiet) return;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.textContent = sample(['⭐', '✨', '🎉', '🟡', '🟣', '🟢', '💜']);
    c.style.left = Math.random() * 100 + 'vw';
    c.style.animationDelay = Math.random() * 0.3 + 's';
    c.style.fontSize = (14 + Math.random() * 14) + 'px';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2400);
  }
}
function toast(msg, emoji = '✅') {
  const t = $('#toast');
  t.innerHTML = `<span>${emoji}</span> ${msg}`;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ------------------------------------------------------------
   7 · ARRANQUE Y PANTALLA DE ENTRADA
   ------------------------------------------------------------ */
function boot() {
  applySettings();
  bindGlobalEvents();
  renderLogin();
  fetchRemoteConfig();
  fetchRemoteRoster();
}
function applySettings() {
  document.body.classList.toggle('accessible', !!settings.accessible);
  document.body.classList.toggle('quiet', !!settings.quiet);
}
function bindGlobalEvents() {
  $('#addStudentBtn').onclick = addStudent;
  $('#newStudentName').addEventListener('keydown', e => { if (e.key === 'Enter') addStudent(); });
  $('#newStudentPw').addEventListener('keydown', e => { if (e.key === 'Enter') addStudent(); });
  $('#refreshRosterBtn').onclick = () => {
    $('#refreshRosterBtn').textContent = '⏳ Buscando…';
    fetchRemoteRoster(() => { $('#refreshRosterBtn').textContent = '🔄 Actualizar lista'; });
  };
  $('#loginGroupFilter').onchange = renderLogin;
  $('#teacherLoginBtn').onclick = () => { if (requestTeacherAccess()) enterTeacherDirect(); };
  $('#switchStudentBtn').onclick = switchStudent;
  $$('.tab').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  $$('[data-view]').forEach(b => { if (!b.classList.contains('tab')) b.addEventListener('click', () => showView(b.dataset.view)); });
  $('#quitGameBtn').onclick = quitGame;
  bindStudyEvents(); bindArenaEvents(); bindTeacherEvents();
  $('#practiceMistakes').onclick = startReviewGame;
  $('#forceSyncBtn').onclick = () => syncQueue(true);
  // Último salvavidas: al cerrar la pestaña, manda la foto del progreso
  window.addEventListener('beforeunload', () => {
    if (!state || !settings.backendUrl) return;
    try {
      const ev = {
        eventId: uid(), type: 'state_snapshot', createdAt: new Date().toISOString(),
        classCode: settings.classCode || '', studentId: state.id, studentName: state.name,
        group: state.group, avatar: state.avatar, data: { state: slimState(state) }
      };
      navigator.sendBeacon(settings.backendUrl, new Blob(
        [JSON.stringify({ action: 'logBatch', classCode: settings.classCode || '', events: [ev] })],
        { type: 'text/plain;charset=utf-8' }
      ));
    } catch { /* sin beacon: ya irá por la cola */ }
  });
}
function renderLogin() {
  $('#loginGroupFilter').innerHTML = '<option value="all">Todos los grupos</option>' + groups.map(g => `<option>${escapeHtml(g)}</option>`).join('');
  if (renderLogin._filter) $('#loginGroupFilter').value = renderLogin._filter;
  const filter = $('#loginGroupFilter').value || 'all';
  renderLogin._filter = filter;
  const list = students.filter(s => filter === 'all' || s.group === filter);
  $('#studentGrid').innerHTML = list.map(s => {
    const st = getStudentState(s.id);
    const rank = rankFor(st.xp);
    return `<button class="student-card" data-student="${s.id}">
      <span class="sc-avatar">${s.avatar}</span>
      <strong>${s.pw ? '🔒 ' : ''}${escapeHtml(s.name)}</strong>
      <small>${escapeHtml(s.group || 'Sin grupo')}</small>
      <span class="sc-rank">${rank.emoji} ${rank.name}</span>
    </button>`;
  }).join('') || '<div class="callout">No hay nadie en este grupo todavía. ¡Añade tu nombre abajo!</div>';
  $$('.student-card').forEach(b => b.onclick = () => loginStudent(b.dataset.student));
  $('#newStudentGroup').innerHTML = groups.map(g => `<option>${escapeHtml(g)}</option>`).join('');
  $('#loginSyncState').textContent = settings.backendUrl ? '☁️ Conectado con la hoja del maestro' : '💾 Modo local (sin nube)';
}
function addStudent() {
  const name = $('#newStudentName').value.trim();
  if (!name) return;
  const pwRaw = $('#newStudentPw').value.trim();
  if (!pwRaw && !confirm('¿Seguro que quieres crear tu personaje SIN contraseña? Cualquiera podría entrar en él.')) {
    $('#newStudentPw').focus();
    return;
  }
  const s = { id: uid(), name, group: $('#newStudentGroup').value || groups[0], avatar: AVATARS[students.length % 10].e, pw: encPw(pwRaw) };
  students.push(s);
  saveJSON('verbopolis-students', students);
  $('#newStudentName').value = '';
  $('#newStudentPw').value = '';
  renderLogin();
  queueEvent('student_created', { studentId: s.id, studentName: s.name, group: s.group, avatar: s.avatar, clave: pwRaw });
  syncQueue(true); // que llegue ya a la hoja, para que aparezca en los demás dispositivos
}
function loginStudent(sid) {
  const s = students.find(x => x.id === sid);
  if (!s) return;
  if (s.pw && !teacherUnlocked) return openPwModal(s);
  doLogin(s);
}
function openPwModal(s) {
  $('#pwModal').classList.remove('hidden');
  $('#pwModalCard').innerHTML = `
    <button class="modal-close" id="closePwModal">✕</button>
    <span class="pw-avatar">${s.avatar}</span>
    <h3>¡Hola, ${escapeHtml(s.name)}!</h3>
    <p class="pw-ask">Escribe tu contraseña secreta:</p>
    <input id="pwInput" type="password" autocomplete="off" placeholder="•••••" />
    <p class="pw-msg" id="pwMsg"></p>
    <button class="primary big" id="pwSubmit">Entrar</button>
    <p class="tiny">¿La has olvidado? Pídesela a tu maestro/a. 😉</p>`;
  const tryLogin = () => {
    if ($('#pwInput').value.trim() === decPw(s.pw)) {
      closePwModal();
      doLogin(s);
    } else {
      $('#pwMsg').textContent = 'Mmm… esa no es. ¡Inténtalo otra vez!';
      $('#pwModalCard').classList.remove('shake');
      void $('#pwModalCard').offsetWidth; // reinicia la animación
      $('#pwModalCard').classList.add('shake');
      $('#pwInput').value = '';
      $('#pwInput').focus();
      sndBad();
    }
  };
  $('#pwSubmit').onclick = tryLogin;
  $('#pwInput').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  $('#closePwModal').onclick = closePwModal;
  setTimeout(() => $('#pwInput').focus(), 60);
}
function closePwModal() { $('#pwModal').classList.add('hidden'); }
function doLogin(s) {
  state = getStudentState(s.id);
  const localStamp = state.updatedAt || ''; // antes de tocar nada, para comparar con la nube
  touchDaily();
  saveState();
  $('#loginScreen').classList.add('hidden');
  $('#appShell').classList.remove('hidden');
  showView('adventure');
  renderAll();
  queueEvent('login', { group: state.group });
  syncQueue(false);
  fetchRemoteState(s.id, localStamp);
}
function switchStudent() {
  pushStateSnapshot();
  state = null; game = null;
  $('#appShell').classList.add('hidden');
  $('#loginScreen').classList.remove('hidden');
  renderLogin();
}
function enterTeacherDirect() {
  if (!students.length) { addDemoStudent(); }
  state = getStudentState(students[0].id);
  $('#loginScreen').classList.add('hidden');
  $('#appShell').classList.remove('hidden');
  renderAll();
  showView('teacher');
}
function addDemoStudent() {
  students = [{ id: uid(), name: 'Personaje de prueba', group: groups[0], avatar: '🦉' }];
  saveJSON('verbopolis-students', students);
}

/* ------------------------------------------------------------
   8 · NAVEGACIÓN Y CABECERA
   ------------------------------------------------------------ */
function showView(idv) {
  if (idv === 'teacher' && !teacherUnlocked) { if (!requestTeacherAccess()) return; }
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + idv));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === idv));
  if (idv === 'adventure') renderAdventure();
  if (idv === 'arena') renderArena();
  if (idv === 'study') renderStudy();
  if (idv === 'review') renderReview();
  if (idv === 'progress') renderProgress();
  if (idv === 'exam') renderExamList();
  if (idv === 'teacher') renderTeacher();
}
function requestTeacherAccess() {
  const code = prompt('Código de maestro/a');
  if (code && code.trim() === TEACHER_PIN) {
    teacherUnlocked = true;
    sessionStorage.setItem('verbopolis-teacher-unlocked', '1');
    return true;
  }
  if (code !== null) alert('Código incorrecto.');
  return false;
}
function lockTeacherArea() {
  teacherUnlocked = false;
  sessionStorage.removeItem('verbopolis-teacher-unlocked');
  showView('adventure');
}
function renderAll() {
  if (!state) return;
  renderTopbar();
  renderAdventure();
  renderExamBadge();
}
function renderTopbar() {
  const rank = rankFor(state.xp), next = nextRank(state.xp);
  $('#playerAvatar').textContent = state.avatar;
  $('#playerName').textContent = state.name;
  $('#rankBadge').innerHTML = `${rank.emoji} <span>${rank.name}</span>`;
  const base = rank.xp, top = next ? next.xp : rank.xp + 1;
  const pct = next ? Math.min(100, Math.round((state.xp - base) / (top - base) * 100)) : 100;
  $('#xpBar').style.width = pct + '%';
  $('#xpText').textContent = `${state.xp} XP` + (next ? ` · ${next.xp - state.xp} para ${next.emoji}` : ' · ¡Rango máximo!');
  $('#streakFlame').textContent = state.daily.count > 1 ? `🔥 ${state.daily.count} días` : '🔥 1 día';
  $('#groupLabel').textContent = state.group || '';
}
function renderExamBadge() {
  const pending = pendingExams();
  const tab = $('#examTab');
  tab.classList.toggle('hidden', !pending.length);
  if (pending.length) tab.innerHTML = `📝 Examen <span class="bubble">${pending.length}</span>`;
}
function pendingExams() {
  if (!state) return [];
  return exams.filter(e => e.group === state.group && !state.examsDone.some(d => d.examId === e.id));
}

/* ------------------------------------------------------------
   9 · MAPA DE AVENTURA
   ------------------------------------------------------------ */
function renderAdventure() {
  if (!state) return;
  renderMissionBanner();
  const unlockedUpTo = highestUnlocked(state);
  const groupCap = maxLevelForGroup(state.group);
  const totalStars = LEVELS.reduce((acc, l) => acc + (state.levels[l.id]?.stars || 0), 0);
  $('#starCount').textContent = `⭐ ${totalStars}/${MAX_LEVEL * 3}`;
  $('#worldMap').innerHTML = WORLDS.map(w => {
    const lvls = LEVELS.filter(l => l.world === w.id);
    const wStars = lvls.reduce((a, l) => a + (state.levels[l.id]?.stars || 0), 0);
    const anyUnlocked = lvls.some(l => l.id <= unlockedUpTo);
    return `<section class="world ${w.theme} ${anyUnlocked ? '' : 'world-locked'}">
      <header class="world-head">
        <span class="world-emoji">${w.emoji}</span>
        <div><h3>Mundo ${w.id} · ${w.name}</h3><p>${w.desc}</p></div>
        <span class="world-stars">⭐ ${wStars}/${lvls.length * 3}</span>
      </header>
      <div class="level-path">
        ${lvls.map(l => {
          const rec = state.levels[l.id] || {};
          const capped = l.id > groupCap;
          const locked = l.id > unlockedUpTo || capped;
          const current = l.id === unlockedUpTo && !locked && !(rec.stars >= 1);
          const stars = rec.stars || 0;
          return `<button class="level-node ${l.boss ? 'boss' : ''} ${locked ? 'locked' : ''} ${current ? 'current' : ''}" data-level="${l.id}" ${locked ? 'disabled' : ''} title="${escapeHtml(l.name)}">
            <span class="ln-emoji">${locked ? (capped ? '🚧' : '🔒') : l.emoji}</span>
            <span class="ln-num">${l.id}</span>
            <span class="ln-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
          </button>`;
        }).join('<span class="path-link"></span>')}
      </div>
    </section>`;
  }).join('');
  $$('.level-node:not(.locked)').forEach(b => b.onclick = () => openLevelModal(Number(b.dataset.level)));
}
function renderMissionBanner() {
  const m = missions[state.group];
  const el = $('#missionBanner');
  if (m) {
    el.classList.remove('hidden');
    el.innerHTML = `<span class="mb-icon">🎯</span>
      <div><strong>${escapeHtml(m.title || 'Misión del día')}</strong>
      <small>${m.tense === 'all' ? 'Varios tiempos' : tenseName(m.tense)} · ${m.rounds || 10} preguntas · ¡XP doble!</small></div>
      <button class="primary small" id="startMissionBtn">¡A por ella!</button>`;
    $('#startMissionBtn').onclick = startMissionGame;
  } else el.classList.add('hidden');
}
function openLevelModal(levelId) {
  const l = LEVELS.find(x => x.id === levelId);
  const rec = state.levels[l.id] || {};
  const w = WORLDS.find(x => x.id === l.world);
  $('#levelModal').classList.remove('hidden');
  $('#levelModalCard').className = 'level-modal-card ' + w.theme;
  $('#levelModalCard').innerHTML = `
    <button class="modal-close" id="closeLevelModal">✕</button>
    <span class="lm-emoji">${l.emoji}</span>
    <p class="lm-world">${w.emoji} ${w.name} · Nivel ${l.id}</p>
    <h3>${escapeHtml(l.name)}</h3>
    <p class="lm-detail">${l.tenses.map(tenseName).join(' + ')}</p>
    <p class="lm-stars">${'★'.repeat(rec.stars || 0)}${'☆'.repeat(3 - (rec.stars || 0))} ${rec.best ? `· Mejor: ${rec.best}%` : ''}</p>
    <p class="lm-info">${l.n} preguntas · ${l.boss ? '👹 ¡Nivel JEFE! Necesitas un 60 % para vencerlo.' : 'Consigue un 60 % o más para pasar.'}</p>
    <button class="primary big" id="playLevelBtn">${rec.stars ? '¡Jugar otra vez!' : '¡A jugar!'}</button>`;
  $('#closeLevelModal').onclick = closeLevelModal;
  $('#playLevelBtn').onclick = () => { closeLevelModal(); startLevelGame(l); };
}
function closeLevelModal() { $('#levelModal').classList.add('hidden'); }

/* ------------------------------------------------------------
   10 · ARENA DE PRÁCTICA LIBRE
   ------------------------------------------------------------ */
const ARENA_MODES = [
  { id: 'mixto', emoji: '🎲', name: 'Reto mixto', desc: 'De todo un poco' },
  { id: 'escribe', emoji: '✍️', name: 'Escribe', desc: 'Teclea la forma' },
  { id: 'elige', emoji: '🧠', name: 'Elige', desc: 'Opción correcta' },
  { id: 'detective', emoji: '🔎', name: 'Detective', desc: 'Analiza la forma' },
  { id: 'cazafallos', emoji: '🪲', name: 'Caza-gazapos', desc: 'Encuentra el error' },
  { id: 'parejas', emoji: '🃏', name: 'Parejas', desc: 'Une pronombre y forma' },
  { id: 'construye', emoji: '🧩', name: 'Construye', desc: 'Ordena las piezas' },
  { id: 'oido', emoji: '🎧', name: 'Dictado', desc: 'Escucha y escribe' },
  { id: 'frase', emoji: '💬', name: 'Frases', desc: 'Completa la oración' }
];
function bindArenaEvents() {
  $('#arenaModes').innerHTML = ARENA_MODES.map(m => `<button class="mode" data-mode="${m.id}">${m.emoji}<strong>${m.name}</strong><span>${m.desc}</span></button>`).join('');
  $$('#arenaModes .mode').forEach(b => b.onclick = () => startArenaGame(b.dataset.mode));
}
function renderArena() {
  if (!state) return;
  const avail = unlockedTenses(state);
  $('#arenaTense').innerHTML = '<option value="all">🔓 Todos mis tiempos desbloqueados</option>' +
    TENSES.filter(t => avail.includes(t.id)).map(t => `<option value="${t.id}">${tenseName(t.id)} (${moodName(t.mood)})</option>`).join('');
  $('#arenaInfo').textContent = `Tienes ${avail.length} de ${TENSES.length} tiempos desbloqueados. ¡Avanza en la aventura para conseguir más!`;
}
function startArenaGame(mode) {
  const tSel = $('#arenaTense').value;
  const avail = unlockedTenses(state);
  const tensesPlay = tSel === 'all' ? avail : [tSel];
  const diff = $('#difficultySelect').value;
  const n = { easy: 8, normal: 10, hard: 14 }[diff];
  const types = mode === 'mixto' ? ['elige', 'escribe', 'detective', 'cazafallos', 'construye', 'frase'] : [mode];
  startGame({
    kind: 'arena', label: ARENA_MODES.find(m => m.id === mode).name,
    tenses: tensesPlay, verbs: ALL_VERBS, types, n,
    hearts: { easy: 4, normal: 3, hard: 2 }[diff], xpPer: 10
  });
}
function startLevelGame(l) {
  startGame({
    kind: 'level', level: l, label: `Nivel ${l.id} · ${l.name}`,
    tenses: l.tenses, verbs: l.verbs, types: l.types, n: l.n,
    hearts: l.boss ? 3 : 3, xpPer: l.boss ? 12 : 10
  });
}
function startMissionGame() {
  const m = missions[state.group];
  if (!m) return;
  startGame({
    kind: 'mission', label: `🎯 ${m.title || 'Misión del día'}`,
    tenses: m.tense === 'all' ? unlockedTenses(state) : [m.tense],
    verbs: m.verbs?.length ? m.verbs : ALL_VERBS,
    types: ['elige', 'escribe', 'detective', 'frase'],
    n: m.rounds || 10, hearts: 3, xpPer: 20
  });
}
function startReviewGame() {
  if (!state.mistakes.length) { toast('¡No tienes errores pendientes!', '🎉'); return; }
  startGame({
    kind: 'review', label: '🔁 Repaso de errores',
    tenses: null, verbs: null, types: ['escribe', 'elige'],
    n: Math.min(10, Math.max(5, state.mistakes.length)), hearts: 99, xpPer: 8
  });
}

/* ------------------------------------------------------------
   11 · MOTOR DE JUEGO
   ------------------------------------------------------------ */
function startGame(cfg) {
  game = { ...cfg, round: 0, correct: 0, score: 0, streakIn: 0, results: [], over: false };
  $('#gameOverlay').classList.remove('hidden');
  $('#gameTitle').textContent = cfg.label;
  $('#feedback').textContent = '';
  $('#feedback').className = 'feedback';
  document.body.classList.add('playing');
  nextQuestion();
}
function quitGame() {
  $('#gameOverlay').classList.add('hidden');
  document.body.classList.remove('playing');
  game = null;
  pushStateSnapshot();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  renderAll();
}
function updateHud() {
  $('#hearts').textContent = game.hearts > 10 ? '💛 sin límite' : '❤️'.repeat(Math.max(0, game.hearts)) + '🤍'.repeat(Math.max(0, 3 - game.hearts));
  $('#gameProgressBar').style.width = Math.round(game.round / game.n * 100) + '%';
  $('#gameRound').textContent = `${Math.min(game.round, game.n)}/${game.n}`;
  $('#gameStreak').textContent = game.streakIn >= 3 ? `🔥×${game.streakIn}` : '';
  $('#gameScore').textContent = `${game.score} pts`;
}
function nextQuestion() {
  if (!game) return;
  if (game.round >= game.n || game.hearts <= 0) return endGame();
  game.round++;
  currentQuestion = game.kind === 'review' ? makeReviewQuestion() : makeQuestion(game);
  renderQuestion(currentQuestion);
  updateHud();
}
function makeQuestion(g) {
  const tenseId = sample(g.tenses);
  const tense = tenseById(tenseId);
  let pool = g.verbs.map(i => VERB_INDEX[i]).filter(Boolean);
  // En tiempos sin imperativo de «yo», filtramos persona
  const verb = sample(pool);
  const person = sample(validPersons(tenseId));
  let type = sample(g.types);
  if (type === 'oido' && !('speechSynthesis' in window)) type = 'escribe';
  if (type === 'parejas' && tenseId === 'imperativo') type = 'elige';
  return buildQuestion(verb, tense, person, type);
}
function makeReviewQuestion() {
  const m = sample(state.mistakes.slice(0, 15));
  const verb = VERB_INDEX[m.inf] || sample(VERBS);
  const tense = tenseById(m.tense) || tenseById('presente');
  return buildQuestion(verb, tense, m.person, sample(['escribe', 'elige']), m);
}
function distractors(verb, tense, person, answer, count = 3) {
  const opts = new Set();
  const forms = conjugate(verb, tense.id);
  // Otras personas del mismo verbo y tiempo (los errores más típicos)
  shuffle(validPersons(tense.id)).forEach(p => { if (forms[p] && forms[p] !== answer) opts.add(forms[p]); });
  // Mismo verbo en otros tiempos
  shuffle(TENSES).forEach(t => {
    if (opts.size >= count + 3) return;
    const f = conjugate(verb, t.id)[person];
    if (f && f !== answer) opts.add(f);
  });
  // Otros verbos, mismo tiempo y persona
  while (opts.size < count + 3) {
    const f = conjugate(sample(VERBS), tense.id)[person];
    if (f && f !== answer) opts.add(f);
  }
  return shuffle([...opts]).slice(0, count);
}
function buildQuestion(verb, tense, person, type, reviewItem = null) {
  const forms = conjugate(verb, tense.id);
  const answer = forms[person];
  const pron = pronounFor(tense.id, person);
  const base = { type, verb, tense, person, answer, pron, reviewItem };

  if (type === 'elige') {
    return { ...base, prompt: `<span class="q-pron">${pron}</span> · <strong>${verb.inf}</strong>`, context: tenseName(tense.id), options: shuffle([answer, ...distractors(verb, tense, person, answer)]) };
  }
  if (type === 'detective') {
    const correct = `${verb.inf} · ${tenseName(tense.id)} · ${PERSON_LABELS[person]}`;
    const opts = new Set([correct]);
    while (opts.size < 4) {
      const v2 = sample(VERBS), t2 = sample(TENSES.filter(t => !t.compound)), p2 = sample(validPersons(t2.id));
      const o = `${v2.inf} · ${tenseName(t2.id)} · ${PERSON_LABELS[p2]}`;
      if (o !== correct) opts.add(o);
    }
    return { ...base, answer: correct, prompt: `Analiza la forma verbal: <strong>«${answer}»</strong>`, context: 'Detective verbal: infinitivo, tiempo y persona', options: shuffle([...opts]) };
  }
  if (type === 'cazafallos') {
    const persons = shuffle(validPersons(tense.id)).slice(0, 4);
    const wrongIdx = Math.floor(Math.random() * 4);
    const rows = persons.map((p, i) => {
      if (i !== wrongIdx) return { pron: pronounFor(tense.id, p), form: forms[p], ok: true };
      // forma corrupta: la de otra persona u otro tiempo
      let bad = forms[sample(persons.filter(x => x !== p))];
      if (!bad || bad === forms[p]) bad = conjugate(verb, sample(TENSES.filter(t => t.id !== tense.id && !t.compound)).id)[p] || bad;
      return { pron: pronounFor(tense.id, p), form: bad, ok: false };
    });
    return { ...base, rows, answer: rows.find(r => !r.ok).form, prompt: `¡Hay un gazapo! Toca la forma INCORRECTA de <strong>${verb.inf}</strong>`, context: tenseName(tense.id) };
  }
  if (type === 'parejas') {
    const persons = shuffle(validPersons(tense.id)).slice(0, 4);
    return { ...base, pairs: persons.map(p => ({ pron: PRONOUNS[p], form: forms[p] })), prompt: `Une cada pronombre con su forma de <strong>${verb.inf}</strong>`, context: tenseName(tense.id) };
  }
  if (type === 'construye') {
    const chunks = chunkify(answer);
    const other = conjugate(sample(VERBS.filter(v => v.inf !== verb.inf)), tense.id)[person] || 'verbo';
    const distract = chunkify(other).slice(0, 2);
    return { ...base, chunks: shuffle([...chunks, ...distract]), prompt: `Construye la forma: <span class="q-pron">${pron}</span> · <strong>${verb.inf}</strong>`, context: tenseName(tense.id) };
  }
  if (type === 'oido') {
    return { ...base, prompt: `🎧 Escucha y escribe la forma verbal`, context: `${verb.inf} · ${tenseName(tense.id)}`, speak: answer };
  }
  if (type === 'frase') {
    const frame = sample(FRAMES[tense.id] || FRAMES.presente);
    const sentence = frame.replace('{p}', `<strong>${pron}</strong>`).replace('{v}', verb.inf).replace('{gap}', '<span class="gap">______</span>');
    return { ...base, prompt: sentence, context: `Completa con ${tenseName(tense.id).toLowerCase()}` };
  }
  // escribe (por defecto)
  return { ...base, prompt: `Conjuga <strong>«${verb.inf}»</strong> para <span class="q-pron">${pron}</span>`, context: tenseName(tense.id) };
}
function chunkify(word) {
  // Trocea en pseudo-sílabas de 2-3 letras (los espacios van con el trozo anterior)
  const parts = [];
  let rest = word;
  while (rest.length) {
    let size = rest.length <= 4 ? Math.ceil(rest.length / 2) : (Math.random() < 0.5 ? 2 : 3);
    if (rest.length <= 3) size = rest.length;
    let chunk = rest.slice(0, size);
    rest = rest.slice(size);
    if (rest.startsWith(' ')) { chunk += ' '; rest = rest.slice(1); }
    parts.push(chunk);
  }
  return parts;
}

const ACCENT_CHARS = ['á', 'é', 'í', 'ó', 'ú', 'ñ'];
function accentBarHtml() {
  return `<div class="accent-bar">${ACCENT_CHARS.map(c => `<button type="button" class="accent-key" data-char="${c}">${c}</button>`).join('')}</div>`;
}
function renderQuestion(q) {
  const area = $('#questionArea');
  let html = `<p class="mini-context">${q.context}</p><p class="prompt">${q.prompt}</p>`;

  if (['escribe', 'oido', 'frase'].includes(q.type)) {
    html += `<div class="answer-row">
      <input id="textAnswer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe aquí" />
      <button class="primary" id="submitAnswer">✓</button>
    </div>${accentBarHtml()}`;
    if (q.type === 'oido') html += `<button class="ghost small" id="speakAgain">🔊 Escuchar otra vez</button>`;
    if (game.kind !== 'exam' && q.type !== 'oido') html += `<button class="ghost small" id="hintBtn">💡 Pista</button><div id="hintBox"></div>`;
  } else if (q.type === 'cazafallos') {
    html += `<div class="options-grid">${q.rows.map((r, i) => `<button class="option caza" data-i="${i}"><small>${r.pron}</small> ${escapeHtml(r.form)}</button>`).join('')}</div>`;
  } else if (q.type === 'parejas') {
    const left = shuffle(q.pairs.map((p, i) => ({ ...p, i })));
    const right = shuffle(q.pairs.map((p, i) => ({ ...p, i })));
    html += `<div class="pairs-wrap">
      <div class="pairs-col" id="pairsLeft">${left.map(p => `<button class="pair-item" data-side="l" data-i="${p.i}">${p.pron}</button>`).join('')}</div>
      <div class="pairs-col" id="pairsRight">${right.map(p => `<button class="pair-item" data-side="r" data-i="${p.i}">${escapeHtml(p.form)}</button>`).join('')}</div>
    </div><p class="tiny center" id="pairsMsg">Toca un pronombre y después su forma.</p>`;
  } else if (q.type === 'construye') {
    html += `<div class="build-out" id="buildOut"><span class="build-placeholder">Toca las piezas en orden…</span></div>
      <div class="chips" id="chipTray">${q.chunks.map((c, i) => `<button class="chip" data-i="${i}">${escapeHtml(c)}</button>`).join('')}</div>
      <div class="row-center"><button class="ghost small" id="undoChip">↩️ Quitar última</button><button class="primary" id="submitBuild">Comprobar</button></div>`;
  } else {
    html += `<div class="options-grid">${q.options.map(o => `<button class="option" data-answer="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join('')}</div>`;
  }
  area.innerHTML = html;
  area.className = 'question-area pop-in';

  // listeners
  $('#submitAnswer')?.addEventListener('click', checkText);
  $('#textAnswer')?.addEventListener('keydown', e => { if (e.key === 'Enter') checkText(); });
  $$('.accent-key').forEach(b => b.onclick = () => {
    const inp = $('#textAnswer'); if (!inp) return;
    inp.value += b.dataset.char; inp.focus();
  });
  $('#hintBtn')?.addEventListener('click', () => showHint(q));
  $('#speakAgain')?.addEventListener('click', () => speak(q.speak, 0.8));
  $$('.option:not(.caza)').forEach(b => b.onclick = () => checkOption(b));
  $$('.option.caza').forEach(b => b.onclick = () => checkCaza(b, q));
  if (q.type === 'parejas') setupPairs(q);
  if (q.type === 'construye') setupBuild(q);
  if (q.type === 'oido') setTimeout(() => speak(q.speak, 0.85), 350);
  setTimeout(() => $('#textAnswer')?.focus(), 60);
}
function showHint(q) {
  const tip = q.verb.tip || `Es un verbo ${GROUP_LABELS[q.verb.group].toLowerCase()}.`;
  $('#hintBox').innerHTML = `<span class="tip">Empieza por «${q.answer.slice(0, 2)}…». ${escapeHtml(tip)}</span>`;
}
function checkText() {
  const given = $('#textAnswer')?.value || '';
  const correct = currentQuestion.answer;
  const exact = normalize(given) === normalize(correct);
  const lenient = normalize(stripAccents(given)) === normalize(stripAccents(correct));
  const strict = game.kind === 'exam' ? game.strict : settings.strictAccents;
  if (!exact && lenient && !strict) {
    applyResult(true, given, '¡Bien! Pero cuidado con la tilde: ' + correct);
  } else {
    applyResult(exact || (lenient && !strict), given);
  }
}
function checkOption(btn) {
  $$('.option').forEach(b => b.disabled = true);
  const ok = btn.dataset.answer === currentQuestion.answer;
  btn.classList.add(ok ? 'correct' : 'wrong');
  if (!ok) $$('.option').find(b => b.dataset.answer === currentQuestion.answer)?.classList.add('correct');
  applyResult(ok, btn.dataset.answer);
}
function checkCaza(btn, q) {
  $$('.option').forEach(b => b.disabled = true);
  const row = q.rows[Number(btn.dataset.i)];
  const ok = !row.ok; // la respuesta correcta es tocar la forma incorrecta
  btn.classList.add(ok ? 'correct' : 'wrong');
  if (!ok) $$('.option.caza').forEach(b => { if (!q.rows[Number(b.dataset.i)].ok) b.classList.add('correct'); });
  applyResult(ok, row.form);
}
function setupPairs(q) {
  let selected = null, matched = 0, errors = 0;
  $$('.pair-item').forEach(b => b.onclick = () => {
    if (b.classList.contains('done')) return;
    if (!selected) { selected = b; b.classList.add('sel'); return; }
    if (selected === b) { b.classList.remove('sel'); selected = null; return; }
    if (selected.dataset.side === b.dataset.side) { selected.classList.remove('sel'); selected = b; b.classList.add('sel'); return; }
    if (selected.dataset.i === b.dataset.i) {
      selected.classList.remove('sel');
      [selected, b].forEach(x => x.classList.add('done'));
      matched++;
      sndStar();
      if (matched === q.pairs.length) applyResult(errors <= 1, errors ? `${errors} fallos` : 'perfecto');
    } else {
      errors++;
      [selected, b].forEach(x => x.classList.add('shake'));
      const a = selected;
      setTimeout(() => { a.classList.remove('shake', 'sel'); b.classList.remove('shake'); }, 400);
      sndBad();
    }
    selected = null;
  });
}
function setupBuild(q) {
  const out = [], used = new Set();
  const render = () => {
    $('#buildOut').innerHTML = out.length ? out.map(i => `<span class="build-piece">${escapeHtml(q.chunks[i])}</span>`).join('') : '<span class="build-placeholder">Toca las piezas en orden…</span>';
    $$('#chipTray .chip').forEach(c => c.classList.toggle('used', used.has(Number(c.dataset.i))));
  };
  $$('#chipTray .chip').forEach(c => c.onclick = () => {
    const i = Number(c.dataset.i);
    if (used.has(i)) return;
    used.add(i); out.push(i); render();
  });
  $('#undoChip').onclick = () => { const i = out.pop(); if (i !== undefined) used.delete(i); render(); };
  $('#submitBuild').onclick = () => {
    const word = out.map(i => q.chunks[i]).join('');
    applyResult(normalize(word) === normalize(q.answer), word);
  };
}
function applyResult(ok, given = '', customMsg = null) {
  if (!game) return;
  state.total++;
  const isExam = game.kind === 'exam';
  if (ok) {
    state.correct++; state.streak++; game.correct++; game.streakIn++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    let gained = isExam ? 0 : game.xpPer + (game.streakIn >= 5 ? 5 : 0);
    if (!isExam) { addXp(gained); game.score += gained; }
    if (currentQuestion.tense) {
      const mt = state.mastery[currentQuestion.tense.id] = state.mastery[currentQuestion.tense.id] || { ok: 0, n: 0 };
      mt.ok++; mt.n++;
      const vs = state.verbStats[currentQuestion.verb.inf] = state.verbStats[currentQuestion.verb.inf] || { ok: 0, n: 0 };
      vs.ok++; vs.n++;
      if (currentQuestion.tense.mood === 'subj') state.subjOk++;
      if (['irr', 'stem'].includes(currentQuestion.verb.group)) state.irregularOk++;
    }
    if (currentQuestion.reviewItem) {
      state.mistakes = state.mistakes.filter(m => !(m.inf === currentQuestion.reviewItem.inf && m.tense === currentQuestion.reviewItem.tense && m.person === currentQuestion.reviewItem.person));
      state.reviewFixed++;
    }
    feedback(customMsg || (isExam ? 'Respuesta registrada ✓' : sample(['¡Genial!', '¡Eso es!', '¡Correcto!', '¡Sigue así!', '¡Toma ya!']) + ` +${game.xpPer} XP`), true);
    if (!isExam) { sndOk(); if (game.streakIn % 5 === 0) confetti(10); }
  } else {
    state.streak = 0; game.streakIn = 0;
    if (game.hearts <= 10) game.hearts--;
    if (currentQuestion.tense) {
      const mt = state.mastery[currentQuestion.tense.id] = state.mastery[currentQuestion.tense.id] || { ok: 0, n: 0 };
      mt.n++;
      const vs = state.verbStats[currentQuestion.verb.inf] = state.verbStats[currentQuestion.verb.inf] || { ok: 0, n: 0 };
      vs.n++;
      state.mistakes.unshift({ inf: currentQuestion.verb.inf, tense: currentQuestion.tense.id, person: currentQuestion.person, correct: currentQuestion.answer, given, at: new Date().toISOString() });
      state.mistakes = state.mistakes.slice(0, 50);
    }
    feedback(isExam ? 'Respuesta registrada ✓' : `Casi… La respuesta era: ${currentQuestion.answer}`, false);
    if (!isExam) sndBad();
  }
  game.results.push({ ok, verb: currentQuestion.verb.inf, tense: currentQuestion.tense?.id, person: currentQuestion.person, given, correct: currentQuestion.answer });
  queueEvent(isExam ? 'exam_answer' : 'answer', {
    group: state.group, mode: game.kind, level: game.level?.id || '', examId: game.exam?.id || '',
    round: game.round, verb: currentQuestion.verb.inf, tense: currentQuestion.tense?.id,
    person: pronounFor(currentQuestion.tense?.id || 'presente', currentQuestion.person) || '',
    questionType: currentQuestion.type, correctAnswer: currentQuestion.answer, givenAnswer: given,
    isCorrect: ok, xp: state.xp, total: state.total, correctTotal: state.correct, streak: state.streak
  });
  saveState();
  renderTopbar();
  syncQueue(false);
  updateHud();
  setTimeout(nextQuestion, isExam ? 600 : (ok ? 900 : 1800));
}
function feedback(text, good) {
  const f = $('#feedback');
  f.textContent = text;
  f.className = `feedback show ${good ? 'good' : 'bad'}`;
}
function starsFor(pct) { return pct >= 90 ? 3 : pct >= 75 ? 2 : pct >= 60 ? 1 : 0; }
function endGame() {
  if (!game) return;
  const pct = game.n ? Math.round(game.correct / game.n * 100) : 0;
  const isExam = game.kind === 'exam';

  if (isExam) return endExam(pct);

  let title, sub, bigEmoji, stars = 0;
  if (game.kind === 'level') {
    stars = starsFor(pct);
    const rec = state.levels[game.level.id] || { stars: 0, best: 0 };
    const improved = stars > (rec.stars || 0);
    state.levels[game.level.id] = { stars: Math.max(stars, rec.stars || 0), best: Math.max(pct, rec.best || 0) };
    if (stars >= 1) {
      const bonus = stars * 20 + (game.level.boss ? 30 : 0);
      addXp(bonus); game.score += bonus;
      title = game.level.boss ? '¡JEFE derrotado!' : '¡Nivel superado!';
      bigEmoji = game.level.boss ? '🏆' : '🎉';
      sub = `${pct}% de aciertos · +${bonus} XP de premio${improved ? ' · ¡Nuevo récord!' : ''}`;
      sndLevelUp(); confetti(24);
    } else {
      title = game.hearts <= 0 ? '¡Te quedaste sin corazones!' : '¡Casi lo tienes!';
      bigEmoji = '💪';
      sub = `${pct}% de aciertos. Necesitas un 60 %. Repasa en el Laboratorio y vuelve a intentarlo.`;
    }
    queueEvent('level_finished', { group: state.group, level: game.level.id, levelName: game.level.name, percentage: pct, stars, xp: state.xp });
  } else {
    title = pct >= 80 ? '¡Entrenamiento brillante!' : pct >= 60 ? '¡Buen entrenamiento!' : '¡Seguimos practicando!';
    bigEmoji = pct >= 80 ? '🌟' : pct >= 60 ? '👏' : '💪';
    sub = `${game.correct}/${game.n} aciertos (${pct}%) · +${game.score} XP`;
    if (pct >= 60) confetti(14);
    queueEvent('game_finished', { group: state.group, mode: game.kind, percentage: pct, score: game.score, correctInGame: game.correct, roundsPlayed: game.n, xp: state.xp, accuracy: state.total ? Math.round(state.correct / state.total * 100) : 0 });
  }
  logActivity(`${game.label}: ${pct}%${stars ? ' · ' + '★'.repeat(stars) : ''}`);
  saveState(); pushStateSnapshot(); syncQueue(false);

  $('#questionArea').innerHTML = `<div class="end-screen">
    <span class="end-emoji">${bigEmoji}</span>
    ${game.kind === 'level' ? `<div class="end-stars">${[1, 2, 3].map(i => `<span class="star ${i <= stars ? 'on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</div>` : ''}
    <h3>${title}</h3><p>${sub}</p>
    <div class="row-center">
      <button class="primary" id="againBtn">🔁 Otra vez</button>
      <button class="secondary" id="endCloseBtn">${game.kind === 'level' && stars >= 1 ? '🗺️ Seguir la aventura' : 'Volver'}</button>
    </div></div>`;
  $('#feedback').className = 'feedback';
  const cfg = { ...game };
  $('#againBtn').onclick = () => { if (cfg.kind === 'level') startLevelGame(cfg.level); else startGame(cfg); };
  $('#endCloseBtn').onclick = quitGame;
  renderAll();
}
function logActivity(text) {
  state.log.unshift({ text, at: new Date().toLocaleString('es-ES') });
  state.log = state.log.slice(0, 15);
}
function checkBadges() {
  if (!state) return;
  const add = b => { if (!state.badges.includes(b)) { state.badges.push(b); const def = BADGES.find(x => x.id === b); if (def) toast(`¡Insignia conseguida: ${def.name}!`, def.icon); } };
  if (state.total > 0) add('first');
  if (state.bestStreak >= 5) add('streak5');
  if (state.bestStreak >= 10) add('streak10');
  if (state.bestStreak >= 20) add('streak20');
  if (state.xp >= 250) add('xp250');
  if (state.xp >= 1000) add('xp1000');
  if (LEVELS.filter(l => l.boss).some(l => (state.levels[l.id]?.stars || 0) >= 1)) add('boss1');
  const worldsDone = WORLDS.filter(w => LEVELS.filter(l => l.world === w.id).every(l => (state.levels[l.id]?.stars || 0) >= 1)).length;
  if (worldsDone >= 3) add('world3');
  const totalStars = LEVELS.reduce((a, l) => a + (state.levels[l.id]?.stars || 0), 0);
  if (totalStars >= 15) add('stars15');
  if (Object.values(state.levels).some(l => l.best === 100)) add('perfect');
  if (state.subjOk >= 10) add('subj1');
  if (state.irregularOk >= 20) add('irregular20');
  if (state.daily.count >= 5) add('days5');
  if (state.examsDone.some(e => e.note >= 9)) add('exam9');
  if (state.reviewFixed >= 10) add('review10');
}

/* ------------------------------------------------------------
   12 · LABORATORIO DE ESTUDIO
   ------------------------------------------------------------ */
function bindStudyEvents() {
  $('#studyMood').innerHTML = MOODS.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  $('#studyMood').onchange = () => { fillStudyTenses(); renderStudy(); };
  $('#studyTense').onchange = renderStudy;
  $('#verbSelect').onchange = renderStudy;
  $('#memoryMode').onchange = renderStudy;
  $('#verbSearch').oninput = () => { fillVerbSelect(); renderStudy(); };
  $('#speakTable').onclick = speakCurrentTable;
  $('#toggleTip').onclick = () => $('#verbTip').classList.toggle('hidden');
  fillStudyTenses();
  fillVerbSelect();
}
function fillStudyTenses() {
  const mood = $('#studyMood').value || 'ind';
  $('#studyTense').innerHTML = TENSES.filter(t => t.mood === mood).map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}
function fillVerbSelect() {
  const q = normalize(stripAccents($('#verbSearch').value || ''));
  const list = VERBS.filter(v => !q || stripAccents(v.inf).includes(q));
  $('#verbSelect').innerHTML = list.map(v => `<option value="${v.inf}">${v.inf} · ${GROUP_LABELS[v.group]}</option>`).join('') || '<option value="">(sin resultados)</option>';
}
function renderStudy() {
  if (!state) return;
  const v = VERB_INDEX[$('#verbSelect').value] || VERBS[0];
  const tenseId = $('#studyTense').value || 'presente';
  const mode = $('#memoryMode').value;
  const forms = conjugate(v, tenseId);
  const prons = tenseId === 'imperativo' ? PRONOUNS_IMP : PRONOUNS;
  $('#studyTitle').textContent = v.inf;
  $('#studyMeta').textContent = `${GROUP_LABELS[v.group]} · ${moodName(tenseById(tenseId).mood)} · ${tenseName(tenseId)}`;
  $('#conjTable').innerHTML = prons.map((p, i) => {
    if (p === null) return '';
    let form = formatForm(forms[i], v, mode);
    if (mode === 'cloze' && (i === 1 || i === 4)) form = `<span class="cloze">${escapeHtml(forms[i])}</span>`;
    return `<div class="conj-row"><span class="pronoun">${p}</span><span class="form">${form}</span></div>`;
  }).join('');
  $('#nonPersonal').innerHTML = `<span><strong>Infinitivo:</strong> ${v.inf}</span><span><strong>Gerundio:</strong> ${gerund(v)}</span><span><strong>Participio:</strong> ${participle(v)}</span>`;
  $('#verbTip').innerHTML = `<strong>💡 Truco:</strong> ${escapeHtml(v.tip || 'Este verbo es ' + GROUP_LABELS[v.group].toLowerCase() + ': sigue el modelo de su conjugación.')}`;
}
function formatForm(form, v, mode) {
  if (mode !== 'colour') return escapeHtml(form);
  const root = verbStem(v.inf);
  const idx = stripAccents(form).indexOf(stripAccents(root));
  if (idx >= 0) {
    return `${escapeHtml(form.slice(0, idx))}<span class="root">${escapeHtml(form.slice(idx, idx + root.length))}</span><span class="ending">${escapeHtml(form.slice(idx + root.length))}</span>`;
  }
  return `<span class="ending">${escapeHtml(form)}</span>`;
}
function speakCurrentTable() {
  const v = VERB_INDEX[$('#verbSelect').value] || VERBS[0];
  const tenseId = $('#studyTense').value || 'presente';
  const forms = conjugate(v, tenseId);
  const prons = tenseId === 'imperativo' ? PRONOUNS_IMP : PRONOUNS;
  const text = `${v.inf}, ${tenseName(tenseId)}. ` + prons.map((p, i) => p ? `${p}: ${forms[i]}` : '').filter(Boolean).join('. ');
  speak(text);
}

/* ------------------------------------------------------------
   13 · REPASO DE ERRORES
   ------------------------------------------------------------ */
function renderReview() {
  if (!state) return;
  $('#mistakeList').innerHTML = state.mistakes.length
    ? state.mistakes.slice(0, 12).map(m => `<div class="mistake">
        <strong>${m.inf}</strong> · ${tenseName(m.tense)} · ${pronounFor(m.tense, m.person) || ''}
        <br><small>✓ ${escapeHtml(m.correct)}${m.given ? ` · escribiste: «${escapeHtml(m.given)}»` : ''}</small>
      </div>`).join('')
    : '<div class="callout">🎉 ¡No tienes errores pendientes! Sigue jugando para mantenerte en forma.';
  $('#reviewCount').textContent = state.mistakes.length;
  $('#reviewFixed').textContent = state.reviewFixed || 0;
}

/* ------------------------------------------------------------
   14 · MI PROGRESO
   ------------------------------------------------------------ */
function renderProgress() {
  if (!state) return;
  const acc = state.total ? Math.round(state.correct / state.total * 100) : 0;
  const rank = rankFor(state.xp);
  $('#progressRank').innerHTML = `<span class="pr-emoji">${rank.emoji}</span><div><strong>${rank.name}</strong><small>${state.xp} XP en total</small></div>`;
  $('#statXp').textContent = state.xp;
  $('#statAccuracy').textContent = acc + '%';
  $('#statStreak').textContent = state.bestStreak;
  $('#statDays').textContent = state.daily.count || 0;
  // Dominio por tiempo verbal
  $('#masteryBars').innerHTML = TENSES.map(t => {
    const m = state.mastery[t.id];
    const pct = m && m.n ? Math.round(m.ok / m.n * 100) : null;
    return `<div class="mastery-row">
      <span class="mr-name">${tenseName(t.id)}</span>
      <div class="mr-bar"><span style="width:${pct ?? 0}%" class="${pct === null ? '' : pct >= 75 ? 'good' : pct >= 50 ? 'mid' : 'low'}"></span></div>
      <span class="mr-pct">${pct === null ? '—' : pct + '%'}</span>
    </div>`;
  }).join('');
  // Insignias
  $('#badges').innerHTML = BADGES.map(b => `<div class="badge-card ${state.badges.includes(b.id) ? 'won' : ''}" title="${escapeHtml(b.desc)}">
    <span>${b.icon}</span><strong>${b.name}</strong><small>${state.badges.includes(b.id) ? '¡Conseguida!' : b.desc}</small>
  </div>`).join('');
  // Liga semanal del grupo (en este ordenador)
  const peers = students.filter(s => s.group === state.group).map(s => getStudentState(s.id))
    .map(st => ({ ...st, wxp: st.weekly?.key === weekKey() ? st.weekly.xp : 0 }))
    .sort((a, b) => b.wxp - a.wxp).slice(0, 5);
  const medals = ['🥇', '🥈', '🥉', '4.º', '5.º'];
  $('#podium').innerHTML = peers.map((p, i) => `<div class="podium-row ${p.id === state.id ? 'me' : ''}">
    <span class="pd-pos">${medals[i]}</span><span class="pd-avatar">${p.avatar}</span>
    <strong>${escapeHtml(p.name)}</strong><span class="pd-xp">${p.wxp} XP</span>
  </div>`).join('') || '<div class="callout">Aún no hay datos esta semana.</div>';
  // Notas de evaluaciones
  $('#myExams').innerHTML = state.examsDone.length
    ? state.examsDone.slice().reverse().map(e => `<div class="exam-result"><strong>${escapeHtml(e.title)}</strong><span class="nota ${e.note >= 5 ? 'aprobado' : 'suspenso'}">${e.note}</span><small>${e.correct}/${e.n} · ${e.date}</small></div>`).join('')
    : '<div class="callout">Todavía no has hecho ninguna evaluación.</div>';
  $('#activityLog').innerHTML = state.log.length
    ? state.log.map(l => `<div class="log-item"><strong>${escapeHtml(l.text)}</strong><br><small>${l.at}</small></div>`).join('')
    : '<div class="log-item">Aún no hay actividad.</div>';
  renderSyncPanel();
}
function renderSyncPanel() {
  const el = $('#syncPanel');
  if (!el) return;
  el.innerHTML = `<strong>${settings.backendUrl ? '☁️ Conectado a la hoja del maestro' : '💾 Solo en este ordenador'}</strong><br>
    <small>${queue.length} evento(s) en cola · Último envío: ${state?.lastSync || '—'}</small>`;
}

/* ------------------------------------------------------------
   15 · EVALUACIONES (alumno)
   ------------------------------------------------------------ */
function renderExamList() {
  const pending = pendingExams();
  $('#examList').innerHTML = pending.length
    ? pending.map(e => `<article class="exam-card">
        <span class="ec-icon">📝</span>
        <div><h3>${escapeHtml(e.title)}</h3>
        <p>${e.tenses.map(tenseName).join(', ')}</p>
        <small>${e.n} preguntas · ${e.types.map(t => ARENA_MODES.find(m => m.id === t)?.name || t).join(', ')}${e.strict ? ' · las tildes cuentan' : ''}</small></div>
        <button class="primary" data-exam="${e.id}">Empezar</button>
      </article>`).join('')
    : '<div class="callout">No tienes ninguna evaluación pendiente. 🎉</div>';
  $$('[data-exam]').forEach(b => b.onclick = () => startExam(b.dataset.exam));
}
function startExam(examId) {
  const e = exams.find(x => x.id === examId);
  if (!e) return;
  if (!confirm(`Vas a empezar la evaluación «${e.title}» (${e.n} preguntas).\nNo hay pistas ni corazones. ¿Preparado/a?`)) return;
  startGame({
    kind: 'exam', exam: e, label: `📝 ${e.title}`, strict: !!e.strict,
    tenses: e.tenses, verbs: e.verbs?.length ? e.verbs : ALL_VERBS,
    types: e.types?.length ? e.types : ['escribe', 'elige'],
    n: e.n, hearts: 99, xpPer: 0
  });
}
function endExam(pct) {
  const note = Math.round(game.correct / game.n * 100) / 10; // nota sobre 10, 1 decimal
  const result = {
    examId: game.exam.id, title: game.exam.title, note, correct: game.correct, n: game.n,
    date: new Date().toLocaleDateString('es-ES'),
    details: game.results.map(r => ({ verb: r.verb, tense: r.tense, ok: r.ok, given: r.given, correct: r.correct }))
  };
  state.examsDone.push(result);
  addXp(Math.round(note * 5)); // pequeña recompensa por esforzarse
  logActivity(`Evaluación «${game.exam.title}»: nota ${note}`);
  queueEvent('exam_finished', {
    group: state.group, examId: game.exam.id, examTitle: game.exam.title,
    note, correctInExam: game.correct, roundsPlayed: game.n, percentage: pct,
    tenses: game.exam.tenses.join('|'), xp: state.xp
  });
  saveState(); pushStateSnapshot(); syncQueue(true);
  const failed = game.results.filter(r => !r.ok);
  $('#questionArea').innerHTML = `<div class="end-screen">
    <span class="end-emoji">${note >= 9 ? '🏅' : note >= 5 ? '😊' : '💪'}</span>
    <div class="nota-final ${note >= 5 ? 'aprobado' : 'suspenso'}">${note}</div>
    <h3>${note >= 9 ? '¡Impresionante!' : note >= 7 ? '¡Muy buen trabajo!' : note >= 5 ? '¡Aprobado!' : 'No pasa nada, ¡a repasar!'}</h3>
    <p>${game.correct} de ${game.n} respuestas correctas.</p>
    ${failed.length ? `<details class="exam-review"><summary>Ver mis fallos (${failed.length})</summary>${failed.map(f => `<p><strong>${f.verb}</strong> · ${tenseName(f.tense)}: escribiste «${escapeHtml(f.given || '—')}», era «${f.correct}»</p>`).join('')}</details>` : '<p>🎯 ¡Sin ningún fallo!</p>'}
    <button class="primary" id="endCloseBtn">Terminar</button></div>`;
  $('#feedback').className = 'feedback';
  $('#endCloseBtn').onclick = () => { quitGame(); renderExamBadge(); showView('progress'); };
  if (note >= 5) confetti(note >= 9 ? 30 : 16);
}

/* ------------------------------------------------------------
   16 · PANEL DEL MAESTRO/A
   ------------------------------------------------------------ */
function bindTeacherEvents() {
  $$('.teacher-nav').forEach(b => b.onclick = () => showTeacherPanel(b.dataset.teacherPanel));
  $('#lockTeacherBtn').onclick = lockTeacherArea;
  $('#saveMissionBtn').onclick = saveMission;
  $('#clearMissionBtn').onclick = clearMission;
  $('#addGroupBtn').onclick = addGroup;
  $('#createExamBtn').onclick = createExam;
  $('#saveLimitsBtn').onclick = saveLimits;
  $('#saveBackendBtn').onclick = saveBackend;
  $('#testBackendBtn').onclick = testBackend;
  $('#publishConfigBtn').onclick = publishConfig;
  $('#exportAllCsv').onclick = exportAllCsv;
  $('#exportGradesCsv').onclick = exportGradesCsv;
  $('#syncAllBtn').onclick = () => syncQueue(true);
  $('#pullCloudBtn').onclick = pullCloudProgress;
  $('#accessibleToggle').onchange = saveToggles;
  $('#quietToggle').onchange = saveToggles;
  $('#soundToggle').onchange = saveToggles;
  $('#strictToggle').onchange = saveToggles;
  $('#makeWorksheet').onclick = createWorksheet;
  $('#printBtn').onclick = () => window.print();
}
function showTeacherPanel(name) {
  $$('.teacher-nav').forEach(b => b.classList.toggle('active', b.dataset.teacherPanel === name));
  $$('.teacher-panel').forEach(p => p.classList.toggle('active', p.id === 'teacher-' + name));
  if (name === 'overview') renderClassSummary();
  if (name === 'progressmap') renderTeacherProgress();
  if (name === 'exams') renderTeacherExams();
  if (name === 'missions') renderMissions();
  if (name === 'groups') renderGroupStudentList();
  if (name === 'settings') renderTeacherSettings();
}
function renderTeacher() {
  fillTeacherSelectors();
  renderClassSummary();
  renderTeacherProgress();
  renderTeacherExams();
  renderMissions();
  renderGroupStudentList();
  renderTeacherSettings();
}
function fillTeacherSelectors() {
  const gOpts = groups.map(g => `<option>${escapeHtml(g)}</option>`).join('');
  ['#missionGroup', '#examGroup', '#progressGroup'].forEach(s => { const el = $(s); const v = el.value; el.innerHTML = gOpts; if (v) el.value = v; });
  $('#missionTense').innerHTML = '<option value="all">Todos los desbloqueados</option>' + TENSES.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  $('#examTenses').innerHTML = TENSES.map(t => `<option value="${t.id}">${t.name} (${moodName(t.mood)})</option>`).join('');
  const vOpts = VERBS.map(v => `<option value="${v.inf}">${v.inf}</option>`).join('');
  $('#missionVerbs').innerHTML = vOpts;
  $('#examVerbs').innerHTML = vOpts;
  $('#examTypes').innerHTML = ['escribe', 'elige', 'detective', 'cazafallos', 'construye', 'frase'].map(t => `<option value="${t}">${ARENA_MODES.find(m => m.id === t).name}</option>`).join('');
  $('#progressGroup').onchange = renderTeacherProgress;
  $('#limitsList').innerHTML = groups.map(g => `<label class="limit-row">${escapeHtml(g)}
    <select data-limit="${escapeHtml(g)}">${LEVELS.map(l => `<option value="${l.id}" ${maxLevelForGroup(g) === l.id ? 'selected' : ''}>Hasta nivel ${l.id} · ${escapeHtml(l.name)}</option>`).join('')}</select>
  </label>`).join('');
}
function allStates() { return students.map(s => getStudentState(s.id)); }
// Descarga el progreso de TODA la clase desde la hoja, para que tu panel
// refleje lo que han hecho en cualquier dispositivo.
function pullCloudProgress() {
  if (!settings.backendUrl) return alert('Configura primero la URL de Apps Script.');
  const btn = $('#pullCloudBtn');
  btn.textContent = '⏳ Descargando…'; btn.disabled = true;
  const restore = () => { btn.textContent = '☁️ Traer progreso de la nube'; btn.disabled = false; };
  fetchRemoteRoster(() => {
    jsonp('states', { classCode: settings.classCode || '' }, res => {
      let n = 0;
      if (res && res.ok && Array.isArray(res.states)) {
        res.states.forEach(r => {
          if (!r.studentId || !r.state) return;
          const local = loadJSON('verbopolis-state-' + r.studentId, null);
          if (!local || (local.updatedAt || '') < (r.state.updatedAt || '')) {
            r.state.id = r.studentId;
            saveJSON('verbopolis-state-' + r.studentId, r.state);
            n++;
          }
        });
      }
      restore();
      renderClassSummary(); renderTeacherProgress(); renderTeacherExams();
      toast(n ? `Progreso actualizado de ${n} alumno/a(s).` : 'Todo estaba ya al día.', '☁️');
    }, () => { restore(); alert('No se pudo conectar con la hoja.'); });
  });
}
function renderClassSummary() {
  const rows = allStates().sort((a, b) => b.xp - a.xp);
  $('#classSummary').innerHTML = rows.map((s, i) => {
    const acc = s.total ? Math.round(s.correct / s.total * 100) : 0;
    const rank = rankFor(s.xp);
    return `<div class="summary-row"><strong>${i + 1}. ${s.avatar} ${escapeHtml(s.name)}</strong> <span class="chip-rank">${rank.emoji} ${rank.name}</span><br>
      <small>${escapeHtml(s.group || '')} · ${s.xp} XP · ${acc}% acierto · nivel ${highestUnlocked(s)} · racha ${s.bestStreak}</small></div>`;
  }).join('') || '<div class="callout">Sin alumnado todavía.</div>';
  // Radar docente
  const tenseErr = {}, verbErr = {};
  rows.forEach(s => s.mistakes.forEach(m => { tenseErr[m.tense] = (tenseErr[m.tense] || 0) + 1; verbErr[m.inf] = (verbErr[m.inf] || 0) + 1; }));
  const low = rows.filter(s => s.total >= 8 && s.correct / s.total < 0.6);
  const topT = Object.entries(tenseErr).sort((a, b) => b[1] - a[1])[0];
  const topV = Object.entries(verbErr).sort((a, b) => b[1] - a[1])[0];
  $('#teacherRadar').innerHTML = `
    <div class="radar-item"><strong>⏰ Tiempo más fallado</strong><p>${topT ? `${tenseName(topT[0])} (${topT[1]} errores)` : 'Sin datos'}</p></div>
    <div class="radar-item"><strong>📚 Verbo más fallado</strong><p>${topV ? `${topV[0]} (${topV[1]} errores)` : 'Sin datos'}</p></div>
    <div class="radar-item"><strong>🆘 Necesitan repaso</strong><p>${low.length ? low.map(s => escapeHtml(s.name)).join(', ') : 'Nadie con datos suficientes'}</p></div>
    <div class="radar-item"><strong>🏆 Liga semanal</strong><p>${rows.map(s => ({ s, w: s.weekly?.key === weekKey() ? s.weekly.xp : 0 })).sort((a, b) => b.w - a.w).slice(0, 5).map(x => `${x.s.avatar} ${x.w}XP`).join(' · ') || 'Sin datos'}</p></div>`;
}
function renderTeacherProgress() {
  const g = $('#progressGroup').value || groups[0];
  const rows = allStates().filter(s => s.group === g);
  if (!rows.length) { $('#progressTable').innerHTML = '<div class="callout">Sin alumnado en este grupo.</div>'; $('#masteryHeatmap').innerHTML = ''; return; }
  $('#progressTable').innerHTML = `<table class="t-table"><thead><tr><th>Alumno/a</th><th>Nivel</th><th>⭐</th><th>XP</th><th>Acierto</th></tr></thead><tbody>
    ${rows.map(s => {
      const stars = LEVELS.reduce((a, l) => a + (s.levels[l.id]?.stars || 0), 0);
      const acc = s.total ? Math.round(s.correct / s.total * 100) : 0;
      return `<tr><td>${s.avatar} ${escapeHtml(s.name)}</td><td>${highestUnlocked(s)}/${MAX_LEVEL}</td><td>${stars}</td><td>${s.xp}</td><td>${acc}%</td></tr>`;
    }).join('')}</tbody></table>`;
  // Mapa de calor: alumno × tiempo verbal
  $('#masteryHeatmap').innerHTML = `<table class="t-table heat"><thead><tr><th></th>${TENSES.map(t => `<th title="${tenseName(t.id)}">${tenseName(t.id).split(' ').map(w => w[0]).join('').toUpperCase()}</th>`).join('')}</tr></thead><tbody>
    ${rows.map(s => `<tr><td>${s.avatar} ${escapeHtml(s.name.split(' ')[0])}</td>${TENSES.map(t => {
      const m = s.mastery[t.id];
      if (!m || !m.n) return '<td class="h-none">·</td>';
      const pct = Math.round(m.ok / m.n * 100);
      const cls = pct >= 75 ? 'h-good' : pct >= 50 ? 'h-mid' : 'h-low';
      return `<td class="${cls}" title="${tenseName(t.id)}: ${pct}% (${m.n} intentos)">${pct}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table>
  <p class="tiny">Verde ≥75 % · Amarillo 50-74 % · Rojo &lt;50 % · «·» sin datos. Pasa el ratón para ver detalles.</p>`;
}
function createExam() {
  const title = $('#examTitle').value.trim() || 'Evaluación de verbos';
  const tensesSel = $$('#examTenses option:checked').map(o => o.value);
  if (!tensesSel.length) return alert('Elige al menos un tiempo verbal.');
  const e = {
    id: uid(), title, group: $('#examGroup').value,
    tenses: tensesSel,
    verbs: $$('#examVerbs option:checked').map(o => o.value),
    types: $$('#examTypes option:checked').map(o => o.value),
    n: Math.max(5, Math.min(25, Number($('#examN').value) || 10)),
    strict: $('#examStrict').checked,
    createdAt: new Date().toISOString()
  };
  if (!e.types.length) e.types = ['escribe', 'elige'];
  exams.push(e);
  saveJSON('verbopolis-exams', exams);
  $('#examTitle').value = '';
  renderTeacherExams();
  toast(`Evaluación creada para ${e.group}. Recuerda publicarla si usáis varios ordenadores.`, '📝');
}
function deleteExam(examId) {
  if (!confirm('¿Eliminar esta evaluación? Las notas ya guardadas no se borran.')) return;
  exams = exams.filter(e => e.id !== examId);
  saveJSON('verbopolis-exams', exams);
  renderTeacherExams();
}
function renderTeacherExams() {
  const sts = allStates();
  $('#examManageList').innerHTML = exams.length ? exams.slice().reverse().map(e => {
    const group = sts.filter(s => s.group === e.group);
    const done = group.map(s => ({ s, r: s.examsDone.find(d => d.examId === e.id) })).filter(x => x.r);
    const avg = done.length ? (done.reduce((a, x) => a + x.r.note, 0) / done.length).toFixed(1) : '—';
    return `<article class="exam-manage">
      <header><strong>📝 ${escapeHtml(e.title)}</strong> <span class="chip-rank">${escapeHtml(e.group)}</span>
        <button class="ghost small danger" data-delexam="${e.id}">Eliminar</button></header>
      <small>${e.tenses.map(tenseName).join(', ')} · ${e.n} preguntas · ${done.length}/${group.length} entregadas · media: <strong>${avg}</strong></small>
      ${done.length ? `<table class="t-table"><thead><tr><th>Alumno/a</th><th>Nota</th><th>Aciertos</th><th>Fecha</th></tr></thead><tbody>
        ${done.sort((a, b) => b.r.note - a.r.note).map(x => `<tr><td>${x.s.avatar} ${escapeHtml(x.s.name)}</td><td class="nota-cell ${x.r.note >= 5 ? 'aprobado' : 'suspenso'}">${x.r.note}</td><td>${x.r.correct}/${x.r.n}</td><td>${x.r.date}</td></tr>`).join('')}</tbody></table>` : ''}
    </article>`;
  }).join('') : '<div class="callout">Aún no has creado ninguna evaluación. Configúrala arriba: elige solo los tiempos que ya habéis estudiado en clase.</div>';
  $$('[data-delexam]').forEach(b => b.onclick = () => deleteExam(b.dataset.delexam));
}
function exportGradesCsv() {
  const rows = [['grupo', 'alumno', 'evaluacion', 'nota', 'aciertos', 'preguntas', 'fecha']];
  allStates().forEach(s => s.examsDone.forEach(e => rows.push([s.group, s.name, e.title, String(e.note).replace('.', ','), e.correct, e.n, e.date])));
  if (rows.length === 1) return alert('Todavía no hay notas registradas.');
  downloadCsv('verbopolis-notas.csv', rows);
}
function saveLimits() {
  $$('[data-limit]').forEach(sel => { groupLimits[sel.dataset.limit] = Number(sel.value); });
  saveJSON('verbopolis-group-limits', groupLimits);
  toast('Límites de nivel guardados. El alumnado solo podrá avanzar hasta ahí.', '🚧');
  if (state) renderAdventure();
}
function saveMission() {
  const g = $('#missionGroup').value;
  missions[g] = {
    title: $('#missionTitle').value.trim() || 'Misión del día',
    tense: $('#missionTense').value,
    rounds: Math.max(5, Math.min(20, Number($('#missionRounds').value) || 10)),
    verbs: $$('#missionVerbs option:checked').map(o => o.value),
    updatedAt: new Date().toISOString()
  };
  saveJSON('verbopolis-missions', missions);
  renderMissions();
  if (state) renderMissionBanner();
  toast('Misión guardada para ' + g, '🎯');
}
function clearMission() {
  const g = $('#missionGroup').value;
  delete missions[g];
  saveJSON('verbopolis-missions', missions);
  renderMissions();
  if (state) renderMissionBanner();
}
function renderMissions() {
  const entries = Object.entries(missions);
  $('#missionList').innerHTML = entries.length ? entries.map(([g, m]) => `<div class="summary-row">
    <strong>🎯 ${escapeHtml(g)} · ${escapeHtml(m.title)}</strong><br>
    <small>${m.tense === 'all' ? 'Tiempos desbloqueados' : tenseName(m.tense)} · ${m.rounds} preguntas · XP doble · ${m.verbs?.length ? m.verbs.join(', ') : 'todos los verbos'}</small>
  </div>`).join('') : '<div class="callout">Sin misiones configuradas. El alumnado puede entrenar libremente.</div>';
}
function addGroup() {
  const g = $('#newGroupName').value.trim();
  if (!g) return;
  if (!groups.includes(g)) groups.push(g);
  saveJSON('verbopolis-groups', groups);
  $('#newGroupName').value = '';
  fillTeacherSelectors();
  renderGroupStudentList();
  renderLogin();
}
function renderGroupStudentList() {
  $('#groupStudentList').innerHTML = `<div class="radar-grid">${groups.map(g => {
    const list = students.filter(s => s.group === g);
    return `<div class="radar-item"><h3>${escapeHtml(g)} · ${list.length}</h3>
      ${list.map(s => `<p><strong>${s.avatar} ${escapeHtml(s.name)}</strong>
        <span class="pw-chip" title="Contraseña del alumno/a">🔑 ${s.pw ? escapeHtml(decPw(s.pw)) : '<em>sin clave</em>'}</span>
        <button class="ghost small" data-pw="${s.id}" title="Cambiar contraseña">🔑</button>
        <button class="ghost small" data-edit="${s.id}" title="Editar nombre/grupo">✏️</button>
        <button class="ghost small danger" data-del="${s.id}" title="Borrar">🗑️</button></p>`).join('') || '<small>Sin alumnado.</small>'}
    </div>`;
  }).join('')}</div>`;
  $$('[data-edit]').forEach(b => b.onclick = () => editStudent(b.dataset.edit));
  $$('[data-del]').forEach(b => b.onclick = () => deleteStudent(b.dataset.del));
  $$('[data-pw]').forEach(b => b.onclick = () => setStudentPw(b.dataset.pw));
}
function setStudentPw(sid) {
  const s = students.find(x => x.id === sid);
  if (!s) return;
  const p = prompt(`Nueva contraseña para ${s.name} (deja vacío para quitarla)`, decPw(s.pw));
  if (p === null) return;
  s.pw = encPw(p.trim());
  saveJSON('verbopolis-students', students);
  queueEvent('student_updated', { studentId: s.id, studentName: s.name, group: s.group, avatar: s.avatar, clave: p.trim() });
  syncQueue(true);
  renderGroupStudentList();
  toast(p.trim() ? `Contraseña de ${s.name} actualizada.` : `${s.name} se queda sin contraseña.`, '🔑');
}
function editStudent(sid) {
  const s = students.find(x => x.id === sid);
  if (!s) return;
  const name = prompt('Nombre o alias', s.name);
  if (name === null) return;
  const group = prompt('Grupo', s.group) || s.group;
  s.name = name.trim() || s.name;
  if (group.trim()) { if (!groups.includes(group.trim())) groups.push(group.trim()); s.group = group.trim(); }
  saveJSON('verbopolis-students', students);
  saveJSON('verbopolis-groups', groups);
  queueEvent('student_updated', { studentId: s.id, studentName: s.name, group: s.group, avatar: s.avatar, clave: decPw(s.pw) });
  syncQueue(true);
  fillTeacherSelectors(); renderGroupStudentList(); renderLogin();
}
function deleteStudent(sid) {
  const s = students.find(x => x.id === sid);
  if (!s) return;
  if (!confirm(`¿Borrar a «${s.name}» y todo su progreso? Desaparecerá también de la lista de los demás dispositivos.`)) return;
  students = students.filter(x => x.id !== sid);
  saveJSON('verbopolis-students', students);
  localStorage.removeItem('verbopolis-state-' + sid);
  queueEvent('student_deleted', { studentId: sid, studentName: s.name, group: s.group });
  syncQueue(true);
  renderGroupStudentList(); renderLogin();
}
function renderTeacherSettings() {
  $('#backendUrlInput').value = settings.backendUrl || '';
  $('#classCodeInput').value = settings.classCode || '';
  $('#accessibleToggle').checked = !!settings.accessible;
  $('#quietToggle').checked = !!settings.quiet;
  $('#soundToggle').checked = settings.sound !== false;
  $('#strictToggle').checked = !!settings.strictAccents;
}
function saveToggles() {
  settings.accessible = $('#accessibleToggle').checked;
  settings.quiet = $('#quietToggle').checked;
  settings.sound = $('#soundToggle').checked;
  settings.strictAccents = $('#strictToggle').checked;
  saveJSON('verbopolis-settings', settings);
  applySettings();
}
function saveBackend() {
  settings.backendUrl = $('#backendUrlInput').value.trim();
  settings.classCode = $('#classCodeInput').value.trim();
  saveJSON('verbopolis-settings', settings);
  renderSyncPanel();
  toast('Conexión guardada.', '☁️');
}
function testBackend() {
  if (!settings.backendUrl) return alert('No hay URL configurada.');
  jsonp('ping', {}, res => alert('✅ Conexión correcta: ' + (res.message || res.status || 'ok')), () => alert('❌ No se pudo conectar. Revisa la URL /exec.'));
}
function exportAllCsv() {
  const rows = [['grupo', 'alumno', 'xp', 'rango', 'nivel_aventura', 'estrellas', 'aciertos', 'intentos', 'porcentaje', 'mejor_racha', 'errores_pendientes']];
  allStates().forEach(st => {
    const stars = LEVELS.reduce((a, l) => a + (st.levels[l.id]?.stars || 0), 0);
    rows.push([st.group, st.name, st.xp, rankFor(st.xp).name, highestUnlocked(st), stars, st.correct, st.total, st.total ? Math.round(st.correct / st.total * 100) : 0, st.bestStreak, st.mistakes.length]);
  });
  downloadCsv('verbopolis-aula.csv', rows);
}
function downloadCsv(name, rows) {
  const csv = '﻿' + rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
function createWorksheet() {
  const tensesSel = $$('#examTenses option:checked').map(o => o.value);
  const tensePool = tensesSel.length ? tensesSel : ['presente'];
  const verbsSel = $$('#examVerbs option:checked').map(o => o.value);
  const pool = (verbsSel.length ? verbsSel : ALL_VERBS).map(i => VERB_INDEX[i]);
  const qs = [];
  for (let i = 0; i < 12; i++) {
    const t = sample(tensePool), v = sample(pool), p = sample(validPersons(t));
    qs.push({ v, t, p });
  }
  $('#worksheet').innerHTML = `<h4>Verbópolis · Ficha de conjugación</h4>
    <p>Nombre: ____________________________ Grupo: ________ Fecha: ____________</p>
    <ol>${qs.map(q => `<li>Conjuga <strong>${q.v.inf}</strong> en <strong>${tenseName(q.t)}</strong> (${pronounFor(q.t, q.p)}): _____________________</li>`).join('')}</ol>
    <p><strong>Reto extra:</strong> escribe una oración con un verbo en subjuntivo y subráyalo.</p>
    <details><summary>Solucionario (no imprimir para el alumnado)</summary><ol>${qs.map(q => `<li>${conjugate(q.v, q.t)[q.p]}</li>`).join('')}</ol></details>`;
  toast('Ficha generada con los tiempos/verbos marcados en el panel de evaluaciones.', '🖨️');
}

/* ------------------------------------------------------------
   17 · SINCRONIZACIÓN CON GOOGLE SHEETS
   ------------------------------------------------------------ */
function queueEvent(type, data = {}) {
  const payload = {
    eventId: (crypto.randomUUID ? crypto.randomUUID() : uid()), type,
    createdAt: new Date().toISOString(), classCode: settings.classCode || '',
    studentId: data.studentId || state?.id || '', studentName: data.studentName || state?.name || '',
    group: data.group || state?.group || '', avatar: data.avatar || state?.avatar || '', data
  };
  queue.push(payload);
  queue = queue.slice(-800);
  saveJSON('verbopolis-sync-queue', queue);
}
function syncQueue(force) {
  if (!settings.backendUrl || !queue.length) { renderSyncPanel(); return; }
  const batch = queue.slice(0, 25);
  const body = { action: 'logBatch', classCode: settings.classCode || '', events: batch };
  fetch(settings.backendUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
    .then(() => {
      queue = queue.slice(batch.length);
      saveJSON('verbopolis-sync-queue', queue);
      if (state) { state.cloudSaves = (state.cloudSaves || 0) + batch.length; state.lastSync = new Date().toLocaleString('es-ES'); saveState(); }
      renderSyncPanel();
      if (force && queue.length) setTimeout(() => syncQueue(true), 600);
    })
    .catch(() => { if (force) toast('Sin conexión: los datos quedan guardados en la cola local.', '📡'); });
}
function jsonp(action, params, onOk, onErr) {
  if (!settings.backendUrl) return onErr && onErr();
  const cb = 'verbopolis_cb_' + Date.now() + '_' + Math.floor(Math.random() * 999);
  const script = document.createElement('script');
  let url;
  try { url = new URL(settings.backendUrl); } catch { return onErr && onErr(); }
  url.searchParams.set('action', action);
  url.searchParams.set('callback', cb);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const timer = setTimeout(() => { cleanup(); onErr && onErr(); }, 8000);
  function cleanup() { clearTimeout(timer); delete window[cb]; script.remove(); }
  window[cb] = res => { cleanup(); onOk && onOk(res); };
  script.onerror = () => { cleanup(); onErr && onErr(); };
  script.src = url.toString();
  document.body.appendChild(script);
}
// Publica misiones, evaluaciones y límites para que TODOS los ordenadores del aula los reciban
function publishConfig() {
  if (!settings.backendUrl) return alert('Configura primero la URL de Apps Script.');
  const config = { missions, exams, groupLimits, groups, updatedAt: new Date().toISOString() };
  fetch(settings.backendUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'saveConfig', classCode: settings.classCode || '', config }) })
    .then(() => toast('Configuración publicada: misiones, evaluaciones y límites llegarán a todos los ordenadores.', '📡'))
    .catch(() => alert('No se pudo publicar. Inténtalo de nuevo.'));
}
// Descarga la lista de alumnado desde la hoja del maestro y la fusiona con la local.
// Así los perfiles creados en un ordenador aparecen también en el móvil o la tablet.
function fetchRemoteRoster(done) {
  if (!settings.backendUrl) { done && done(); return; }
  jsonp('students', { classCode: settings.classCode || '' }, res => {
    if (res && res.ok && Array.isArray(res.students) && res.students.length) {
      let changed = false;
      const deletedPending = new Set(queue.filter(e => e.type === 'student_deleted').map(e => e.studentId));
      res.students.forEach(r => {
        if (!r.studentId || deletedPending.has(r.studentId)) return;
        if (r.group && !groups.includes(r.group)) { groups.push(r.group); changed = true; }
        const local = students.find(s => s.id === r.studentId);
        const remotePw = r.pw ? encPw(r.pw) : '';
        if (!local) {
          students.push({ id: r.studentId, name: r.name || 'Alumno/a', group: r.group || groups[0], avatar: r.avatar || '🦉', pw: remotePw });
          changed = true;
        } else if (local.name !== r.name || local.group !== (r.group || local.group) || (r.pw !== undefined && local.pw !== remotePw)) {
          local.name = r.name || local.name;
          if (r.group) local.group = r.group;
          if (r.avatar) local.avatar = r.avatar;
          if (r.pw !== undefined) local.pw = remotePw;
          changed = true;
        }
      });
      // Elimina en local los borrados en la hoja, salvo los recién creados aún sin enviar
      const remoteIds = new Set(res.students.map(r => r.studentId));
      const pendingIds = new Set(queue.filter(e => e.type === 'student_created').map(e => e.studentId));
      const before = students.length;
      students = students.filter(s => remoteIds.has(s.id) || pendingIds.has(s.id));
      if (students.length !== before) changed = true;
      if (changed) {
        saveJSON('verbopolis-students', students);
        saveJSON('verbopolis-groups', groups);
        renderLogin();
      }
    }
    done && done();
  }, () => { done && done(); });
}
function fetchRemoteConfig() {
  if (!settings.backendUrl) return;
  jsonp('config', { classCode: settings.classCode || '' }, res => {
    if (!res || !res.ok || !res.config) return;
    const c = res.config;
    const localStamp = loadJSON('verbopolis-config-stamp', '');
    if (c.updatedAt && c.updatedAt !== localStamp) {
      if (c.missions) { missions = c.missions; saveJSON('verbopolis-missions', missions); }
      if (c.exams) { exams = c.exams; saveJSON('verbopolis-exams', exams); }
      if (c.groupLimits) { groupLimits = c.groupLimits; saveJSON('verbopolis-group-limits', groupLimits); }
      if (Array.isArray(c.groups) && c.groups.length) { groups = [...new Set([...groups, ...c.groups])]; saveJSON('verbopolis-groups', groups); }
      saveJSON('verbopolis-config-stamp', c.updatedAt);
      renderLogin();
      if (state) { renderAll(); renderExamBadge(); }
    }
  }, () => { /* sin conexión: seguimos en local */ });
}

/* ------------------------------------------------------------
   18 · ARRANQUE
   ------------------------------------------------------------ */
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}
