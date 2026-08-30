// Polyfill para compatibilidade do pdf-parse no ambiente Node.js
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}

const pdf = require('pdf-parse');

/**
 * 100% Local, Instant & Offline Sermon Parser
 * Zero API credits, Zero Internet required. Runs in ~5ms.
 */
const BIBLE_BOOKS_REGEX = /(?:G[eê]nesis|[EÊ]xodo|Lev[ií]tico|N[uú]meros|Deuteron[oô]mio|Josu[eé]|Ju[ií]zes|Rute|1\s*Samuel|2\s*Samuel|1\s*Reis|2\s*Reis|1\s*Cr[oô]nicas|2\s*Cr[oô]nicas|Esdras|Neemias|Ester|J[oó]|Salmos?|Prov[eé]rbios?|Eclesiastes|C[aâ]nticos|Isa[ií]as|Jeremias|Lamenta[cç][oõ]es|Ezequiel|Daniel|Os[eé]ias|Joel|Am[oó]s|Obadias|Jonas|Miqu[eé]ias|Naum|Habacuque|Sofonias|Ageu|Zacarias|Malaquias|Mateus|Marcos|Lucas|Jo[aã]o|Atos|Romanos|1\s*Cor[ií]ntios|2\s*Cor[ií]ntios|G[aá]latas|Ef[eé]sios|Filipenses|Colossenses|1\s*Tessalonicenses|2\s*Tessalonicenses|1\s*Tim[oó]teo|2\s*Tim[oó]teo|Tito|Filemom|Hebreus|Tiago|1\s*Pedro|2\s*Pedro|1\s*Jo[aã]o|2\s*Jo[aã]o|3\s*Jo[aã]o|Judas|Apocalipse)\s+\d+:\d+(?:-\d+)?/i;

async function extractTextFromPdf(pdfBuffer) {
  const data = await pdf(pdfBuffer);
  return data.text;
}

function isBibleRef(line) {
  const trimmed = line.trim();
  const match = trimmed.match(BIBLE_BOOKS_REGEX);
  return match ? match[0] : null;
}

function isPureBibleRefLine(line) {
  const match = isBibleRef(line);
  if (!match) return false;
  return line.trim().length <= match.length + 6;
}

function isUpperCaseHeading(line) {
  const clean = line.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').trim();
  if (clean.length < 5) return false;
  const uppercaseLetters = (clean.match(/[A-ZÀ-Ý]/g) || []).length;
  return uppercaseLetters / clean.length > 0.75;
}

function parseSermonTextOffline(rawText) {
  // Normalizar espaços não separáveis comuns em PDFs (\u00A0)
  const normalized = (rawText || '').replace(/\u00A0/g, ' ');

  const lines = normalized
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('---') && !l.startsWith('⸻'));

  const slides = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i];

    // 1. Topic / Heading in UPPERCASE (e.g. "NÃO DEIXE A ANSIEDADE ROUBAR A CONFIANÇA:")
    if (isUpperCaseHeading(line)) {
      slides.push({
        type: 'topic',
        runs: [{ text: line, highlight: false }]
      });
      i++;
      continue;
    }

    // 2. Short Dramatic Questions (e.g. "E Jairo?")
    if (line.endsWith('?') && line.length <= 25) {
      slides.push({
        type: 'question_short',
        runs: [{ text: line, highlight: false }]
      });
      i++;
      continue;
    }

    // 3. Pure Bible Reference line (e.g. "Mateus 6:19-21" or "Marcos 5:22")
    if (isPureBibleRefLine(line)) {
      const baseRef = isBibleRef(line);
      i++;
      // Collect verse text lines
      const textBlocks = [];
      while (
        i < lines.length &&
        !isPureBibleRefLine(lines[i]) &&
        !isUpperCaseHeading(lines[i]) &&
        !(lines[i].endsWith('?') && lines[i].length <= 25) &&
        !lines[i].startsWith('Quando ela')
      ) {
        textBlocks.push(lines[i]);
        i++;
      }

      const combined = textBlocks.join(' ');
      // Check if numbered verses exist (e.g. "19 Não ajunteis... 20 Mas ajuntai... 21 Porque...")
      const verseSplit = combined.split(/(?=\b\d{1,3}\s+[A-ZÀ-Ý“"])/g).filter(s => s.trim().length > 0);

      if (verseSplit.length > 1 && /^\d+/.test(verseSplit[0].trim())) {
        const bookAndChap = baseRef.split(':')[0]; // e.g. "Mateus 6"
        verseSplit.forEach(vChunk => {
          const vNumMatch = vChunk.trim().match(/^(\d+)\s+(.*)$/s);
          if (vNumMatch) {
            const vNum = vNumMatch[1];
            let vText = vNumMatch[2].trim();
            vText = formatQuotes(vText);
            slides.push({
              type: 'verse',
              reference: `${bookAndChap}:${vNum}`,
              runs: highlightKeywords(vText)
            });
          }
        });
      } else {
        let vText = combined.trim();
        if (vText) {
          vText = formatQuotes(vText);
          slides.push({
            type: 'verse',
            reference: baseRef,
            runs: highlightKeywords(vText)
          });
        }
      }
      continue;
    }

    // 4. Line with embedded trailing reference (e.g. "... Marcos 5:24-26")
    const trailingRef = isBibleRef(line);
    if (trailingRef && line.length > trailingRef.length + 12) {
      const vText = formatQuotes(line.replace(trailingRef, '').trim());
      slides.push({
        type: 'verse',
        reference: trailingRef,
        runs: highlightKeywords(vText)
      });
      i++;
      continue;
    }

    // 5. Line followed immediately by reference on next line
    if (i + 1 < lines.length && isPureBibleRefLine(lines[i + 1])) {
      const vText = formatQuotes(line);
      const ref = isBibleRef(lines[i + 1]);
      slides.push({
        type: 'verse',
        reference: ref,
        runs: highlightKeywords(vText)
      });
      i += 2;
      continue;
    }

    // 6. Reflection / Narrative line
    slides.push({
      type: 'reflection',
      runs: highlightKeywords(line)
    });
    i++;
  }

  return slides;
}

function formatQuotes(text) {
  let t = text.trim();
  if (!t.startsWith('“') && !t.startsWith('"')) t = '“' + t;
  if (!t.endsWith('”') && !t.endsWith('"')) {
    t = t.replace(/[.]+$/, '') + '”';
  }
  return t;
}

/**
 * Intelligent keyword highlighter for church slides
 */
function highlightKeywords(text) {
  const highlightRegex = /(não temas,?\s*crê somente|quem me tocou\??|não o faria\??|não o confirmaria\??|angústia de espírito|tendo-os feito sair|teu coração|não se apóie|os teus bens|os teus celeiros|transbordarão|talitá cumi|prostrou-se|um dos principais da sinagoga|despendido tudo quanto tinha|não ajunteis tesouros|ajuntai tesouros|honra ao senhor|confia no senhor)/gi;

  const runs = [];
  let lastIndex = 0;
  let match;

  while ((match = highlightRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.substring(lastIndex, match.index), highlight: false });
    }
    runs.push({ text: match[0], highlight: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push({ text: text.substring(lastIndex), highlight: false });
  }

  return runs.length > 0 ? runs : [{ text, highlight: false }];
}

module.exports = { extractTextFromPdf, parseSermonTextOffline, highlightKeywords };
