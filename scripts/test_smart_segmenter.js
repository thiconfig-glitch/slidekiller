const fs = require('fs');
const pdf = require('pdf-parse');

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
function normalizeBibleRefName(ref) {
  return (ref || '')
    .replace(/^I\s+/i, '1 ')
    .replace(/^II\s+/i, '2 ')
    .replace(/^III\s+/i, '3 ')
    .replace(/^1[ºª°]\s*/i, '1 ')
    .replace(/^2[ºª°]\s*/i, '2 ')
    .replace(/^3[ºª°]\s*/i, '3 ')
    .replace(/^Primeir[oa]\s+/i, '1 ')
    .replace(/^Segund[oa]\s+/i, '2 ')
    .replace(/^Terceir[oa]\s+/i, '3 ');
}

// Intelligent segmenter
function segmentSermonText(rawText) {
  const lines = rawText
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  // Reconstruct semantic items
  // An item can be:
  // - { type: 'topic', text: '...' }
  // - { type: 'question_short', text: '...' }
  // - { type: 'verse', text: '...', reference: '...' }
  // - { type: 'reflection', text: '...' }

  const items = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Is it the very first line and looks like a sermon title?
    if (i === 0 && line.length < 80 && !isBibleRef(line)) {
      items.push({ type: 'topic', text: line });
      i++;
      continue;
    }

    // 2. Is it a question?
    if (line.endsWith('?') && line.length < 90 && !isBibleRef(line)) {
      items.push({ type: 'question_short', text: line });
      i++;
      continue;
    }

    // 3. Is it a pure Bible reference at the TOP of a passage? (Pattern A)
    if (isPureBibleRefLine(line)) {
      const ref = normalizeBibleRefName(isBibleRef(line));
      i++;
      // Gather lines until next ref, heading, or question
      const verseLines = [];
      while (i < lines.length && !isPureBibleRefLine(lines[i]) && !(lines[i].endsWith('?') && lines[i].length < 80)) {
        verseLines.push(lines[i]);
        i++;
      }
      items.push({ type: 'verse', reference: ref, text: verseLines.join(' ') });
      continue;
    }

    // 4. Check forward: is there a trailing pure Bible reference? (Pattern B)
    // Gather lines for current thought/block
    // In Pattern B, we might have reflections, or we might have a verse followed by a reference.
    // How do we know which line is verse vs reflection?
    // Let's look ahead:
    let nextRefIdx = -1;
    for (let j = i; j < Math.min(i + 15, lines.length); j++) {
      if (isPureBibleRefLine(lines[j])) {
        nextRefIdx = j;
        break;
      }
      // If we hit a question, we stop looking ahead
      if (lines[j].endsWith('?') && lines[j].length < 90) {
        break;
      }
    }

    if (nextRefIdx !== -1) {
      // There is a pure Bible ref at lines[nextRefIdx]!
      // In Neemias case: lines[i] starts with "15 " and lines[i+1] with "16 ", and lines[nextRefIdx] is "Neemias 6:15,16"
      // In 1 João case: lines[i]..lines[nextRefIdx-2] were reflections, and lines[nextRefIdx-1] was "Não ameis..."
      // Let's determine which lines belong to the verse of lines[nextRefIdx]!
      const ref = normalizeBibleRefName(isBibleRef(lines[nextRefIdx]));
      
      // Check if lines immediately preceding nextRefIdx have verse numbers (e.g. 15, 16)
      const precedingLines = lines.slice(i, nextRefIdx);
      const hasNumberedVerses = precedingLines.some(l => /^\d{1,3}\s+[A-Za-zÀ-ÿ]/.test(l));

      if (hasNumberedVerses) {
        // Group each numbered verse
        let currentVerseNum = null;
        let currentVerseText = [];
        for (const pl of precedingLines) {
          const numMatch = pl.match(/^(\d{1,3})\s+(.*)$/);
          if (numMatch) {
            if (currentVerseNum !== null) {
              items.push({
                type: 'verse',
                reference: `${ref.split(/[:.,]/)[0]}:${currentVerseNum}`,
                text: currentVerseText.join(' ')
              });
            }
            currentVerseNum = numMatch[1];
            currentVerseText = [numMatch[2]];
          } else {
            currentVerseText.push(pl);
          }
        }
        if (currentVerseNum !== null) {
          items.push({
            type: 'verse',
            reference: `${ref.split(/[:.,]/)[0]}:${currentVerseNum}`,
            text: currentVerseText.join(' ')
          });
        }
        i = nextRefIdx + 1;
        continue;
      }

      // If it's not numbered verses:
      // Does precedingLines contain multiple distinct thoughts/paragraphs?
      // Notice: In the text, "Deus não é Pai somente..." ends with "."
      // "Nascer de mulher..." ends with "."
      // "Quem quiser ser filho..." ends with "."
      // "Não ameis o mundo..." is right before nextRefIdx!
      // ONLY the paragraph immediately before nextRefIdx is the verse!
      // How do we identify the paragraph immediately before nextRefIdx?
      // Work backwards from nextRefIdx - 1:
      // The verse text is the sentence(s) right above nextRefIdx!
      // If precedingLines has 1 line or 2 lines that form a single sentence:
      // Let's see: lines between i and nextRefIdx:
      // If there are prior paragraphs, they are reflections!
      // Let's split precedingLines into paragraphs:
      const paras = [];
      let curP = [];
      for (let k = 0; k < precedingLines.length; k++) {
        const pl = precedingLines[k];
        if (curP.length > 0) {
          const lastPl = curP[curP.length - 1];
          const lastEndsPunct = /[.!?…]$/.test(lastPl) || lastPl.endsWith('...');
          if (lastEndsPunct && /^[A-ZÀ-Ý“"']/.test(pl)) {
            paras.push(curP.join(' '));
            curP = [];
          }
        }
        curP.push(pl);
      }
      if (curP.length > 0) {
        paras.push(curP.join(' '));
      }

      // If paras.length > 1:
      // All paras except the LAST one are reflections!
      // The LAST para is the verse belonging to lines[nextRefIdx]!
      for (let pIdx = 0; pIdx < paras.length - 1; pIdx++) {
        items.push({ type: 'reflection', text: paras[pIdx] });
      }
      const versePara = paras[paras.length - 1];
      items.push({ type: 'verse', reference: ref, text: versePara });

      i = nextRefIdx + 1;
      continue;
    }

    // 5. Otherwise, this is a reflection line/paragraph
    // Accumulate lines until sentence ends and next begins with capital, or end of text
    let refLines = [line];
    i++;
    while (i < lines.length) {
      const nextL = lines[i];
      if (isPureBibleRefLine(nextL) || (nextL.endsWith('?') && nextL.length < 90)) {
        break;
      }
      const prevL = refLines[refLines.length - 1];
      const prevEnds = /[.!?…]$/.test(prevL) || prevL.endsWith('...');
      if (prevEnds && /^[A-ZÀ-Ý“"']/.test(nextL)) {
        // Can be a new reflection paragraph
        break;
      }
      refLines.push(nextL);
      i++;
    }
    items.push({ type: 'reflection', text: refLines.join(' ') });
  }

  return items;
}

const buf = fs.readFileSync('C:/Projetos/slidekiller_private_backup/novosexemplos/Só os nascidos de novo têm parte na herança.pdf');
pdf(buf).then(d => {
  const items = segmentSermonText(d.text);
  console.log(`Total items parsed: ${items.length}\n`);
  items.forEach((it, idx) => {
    console.log(`Item ${idx + 1} [${it.type}${it.reference ? ' | ' + it.reference : ''}]:`);
    console.log(`  "${it.text}"\n`);
  });
});
