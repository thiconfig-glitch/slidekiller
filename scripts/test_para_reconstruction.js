const pdf = require('pdf-parse');
const fs = require('fs');

const PREFIXES = "(?:1[ºª°\\.]?|2[ºª°\\.]?|3[ºª°\\.]?|I{1,3}|Primeir[oa]|Segund[oa]|Terceir[oa])";
const BOOK_NAMES = [
  `${PREFIXES}\\s*(?:Samuel|Sam\\.?|Sm\\.?)`,
  `${PREFIXES}\\s*(?:Reis|Rs\\.?)`,
  `${PREFIXES}\\s*(?:Cr[oôó]nicas|Cr\\.?)`,
  `${PREFIXES}\\s*(?:Cor[ií]ntios|Co\\.?|Cor\\.?)`,
  `${PREFIXES}\\s*(?:Tessalonicenses|Ts\\.?)`,
  `${PREFIXES}\\s*(?:Tim[oó]teo|Tm\\.?)`,
  `${PREFIXES}\\s*(?:Pedro|Pe\\.?|Ped\\.?)`,
  `${PREFIXES}\\s*(?:Jo[aã]o|Jo\\.?)`,
  "G[eê]nesis|Gn\\.?", "[EÊ]xodo|Ex\\.?", "Lev[ií]tico|Lv\\.?", "N[uú]meros|Nm\\.?", "Deuteron[oô]mio|Dt\\.?", "Josu[eé]|Js\\.?", "Ju[ií]zes|Jz\\.?", "Rute|Rt\\.?", "Esdras|Ed\\.?", "Neemias|Ne\\.?", "Ester|Et\\.?", "J[oó]", "Salmos?|Sl\\.?|Sal\\.?", "Prov[eé]rbios?|Pv\\.?|Prov\\.?", "Eclesiastes|Ec\\.?|Ecl\\.?", "C[aâ]nticos|Cantares|Ct\\.?", "Isa[ií]as|Is\\.?", "Jeremias|Jr\\.?", "Lamenta[cç][oõ]es|Lm\\.?", "Ezequiel|Ez\\.?", "Daniel|Dn\\.?", "Os[eé]ias|Os\\.?", "Joel|Jl\\.?", "Am[oó]s|Am\\.?", "Obadias|Ob\\.?", "Jonas|Jn\\.?", "Miqu[eé]ias|Mq\\.?", "Naum|Na\\.?", "Habacuque|Hc\\.?", "Sofonias|Sf\\.?", "Ageu|Ag\\.?", "Zacarias|Zc\\.?", "Malaquias|Ml\\.?", "Mateus|Mt\\.?|Mat\\.?", "Marcos|Mc\\.?|Marc\\.?", "Lucas|Lc\\.?|Luc\\.?", "Jo[aã]o|Jo\\.?", "Atos|At\\.?", "Romanos|Rm\\.?|Rom\\.?", "G[aá]latas|Gl\\.?|Gal\\.?", "Ef[eé]sios|Ef\\.?", "Filipenses|Fp\\.?|Fil\\.?", "Colossenses|Cl\\.?|Col\\.?", "Tito|Tt\\.?", "Filemom|Filemon|Fm\\.?", "Hebreus|Hb\\.?|Heb\\.?", "Tiago|Tg\\.?", "Judas|Jd\\.?", "Apocalipse|Ap\\.?|Apoc\\.?"
].join("|");
const BIBLE_BOOKS_REGEX = new RegExp(`(?:${BOOK_NAMES})\\s+\\d+\\s*[:.,]\\s*\\d+(?:\\s*[-–—a]\\s*\\d+)?(?:,\\s*\\d+)*`, 'i');

function isBibleRef(line) {
  const m = (line || '').trim().match(BIBLE_BOOKS_REGEX);
  return m ? m[0] : null;
}
function isPureBibleRefLine(line) {
  const trimmed = (line || '').trim();
  const m = trimmed.match(BIBLE_BOOKS_REGEX);
  if (!m) return false;
  return trimmed.length <= m[0].length + 8;
}

const buf = fs.readFileSync('C:/Projetos/slidekiller_private_backup/novosexemplos/Só os nascidos de novo têm parte na herança.pdf');
pdf(buf).then(d => {
  const lines = d.text.split('\n').map(l => l.trim()).filter(Boolean);
  const paras = [];
  let cur = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isRef = isPureBibleRefLine(line);
    const isQ = line.endsWith('?') && line.length < 80;
    const isNumbered = /^\d{1,3}\s+[A-Za-zÀ-ÿ]/.test(line);

    if (isRef) {
      if (cur) { paras.push(cur); cur = ''; }
      paras.push(line);
      continue;
    }
    if (isQ) {
      if (cur) { paras.push(cur); cur = ''; }
      paras.push(line);
      continue;
    }
    if (isNumbered) {
      if (cur) { paras.push(cur); cur = ''; }
      cur = line;
      continue;
    }
    if (!cur) {
      cur = line;
    } else {
      const prevEndsPunct = /[.!?…]$/.test(cur) || cur.endsWith('...');
      if (prevEndsPunct && /^[A-ZÀ-Ý“"']/.test(line)) {
        paras.push(cur);
        cur = line;
      } else {
        cur += ' ' + line;
      }
    }
  }
  if (cur) paras.push(cur);

  paras.forEach((p, idx) => console.log(`[${idx}] ${p}\n`));
});
