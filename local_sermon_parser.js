// Polyfill para compatibilidade do pdf-parse no ambiente Node.js
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}

const pdf = require('pdf-parse');

/**
 * 100% Local, Instant & Offline Sermon Parser
 * Zero API credits, Zero Internet required. Runs in ~5ms.
 */
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
  return line.trim().length <= match.length + 8;
}

function isHeadingOrTopic(line) {
  const trimmed = line.replace(/^[⸻\-_\s*#]+|[⸻\-_\s*#]+$/g, '').trim();
  if (trimmed.length < 3) return false;
  if (isBibleRef(trimmed)) return false;

  // 1. Termina com dois pontos ":" (ex: "Obediência acima de tudo:", "A Oportunidade é para Todos:")
  if (trimmed.endsWith(':') && trimmed.length < 80) {
    return true;
  }

  // 2. É MAIÚSCULO (ex: "TUA CASA É MINHA CASA 122 DIAS")
  const letters = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (letters.length >= 4) {
    const uppercaseLetters = (trimmed.match(/[A-ZÀ-Ý]/g) || []).length;
    if (uppercaseLetters / letters.length >= 0.75) return true;
  }

  return false;
}

function normalizeBibleRefName(ref) {
  return ref
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

function parseSermonTextOffline(rawText) {
  // Normalizar espaços não separáveis comuns em PDFs (\u00A0)
  const normalized = (rawText || '').replace(/\u00A0/g, ' ');

  const rawLines = normalized
    .split(/\r?\n/)
    .map(l => l.replace(/^[⸻\-_\s]+|[⸻\-_\s]+$/g, '').trim())
    .filter(l => l.length > 0);

  const slides = [];
  let i = 0;

  while (i < rawLines.length) {
    let line = rawLines[i];

    // 1. Tópico / Cabeçalho
    if (isHeadingOrTopic(line)) {
      const cleanTitle = line.replace(/^[⸻\-_\s*#]+|[⸻\-_\s*#]+$/g, '').trim();
      slides.push({
        type: 'topic',
        runs: [{ text: cleanTitle, highlight: false }]
      });
      i++;
      continue;
    }

    // 2. Pergunta retórica curta
    if (line.endsWith('?') && line.length <= 25 && !isBibleRef(line)) {
      slides.push({
        type: 'question_short',
        runs: [{ text: line, highlight: false }]
      });
      i++;
      continue;
    }

    // 3. Linha com referência bíblica pura
    if (isPureBibleRefLine(line)) {
      const rawRef = isBibleRef(line);
      const baseRef = normalizeBibleRefName(rawRef);
      i++;

      const verseLines = [];
      while (
        i < rawLines.length &&
        !isPureBibleRefLine(rawLines[i]) &&
        !isHeadingOrTopic(rawLines[i]) &&
        !(rawLines[i].endsWith('?') && rawLines[i].length <= 25)
      ) {
        const emb = isBibleRef(rawLines[i]);
        if (emb && rawLines[i].length > emb.length + 12) break;
        verseLines.push(rawLines[i]);
        i++;
      }

      const combinedText = verseLines.join('\n');
      const numberedRegex = /(?:^|\n)\s*(\d{1,3})\s+([A-ZÀ-Ý“"a-z])/;
      const hasNumberedVerses = numberedRegex.test(combinedText);

      if (hasNumberedVerses) {
        const chunks = combinedText.split(/(?=(?:^|\n)\s*\d{1,3}\s+[A-ZÀ-Ý“"])/).filter(s => s.trim().length > 0);
        const bookAndChap = baseRef.split(/[:.,]/)[0];

        chunks.forEach(chunk => {
          const m = chunk.trim().match(/^(\d{1,3})\s+(.*)$/s);
          if (m) {
            const vNum = m[1];
            let vText = m[2].replace(/\n+/g, ' ').trim();
            vText = formatQuotes(vText);
            slides.push({
              type: 'verse',
              reference: `${bookAndChap}:${vNum}`,
              runs: highlightKeywords(vText)
            });
          } else {
            let vText = formatQuotes(chunk.replace(/\n+/g, ' ').trim());
            slides.push({
              type: 'verse',
              reference: baseRef,
              runs: highlightKeywords(vText)
            });
          }
        });
      } else {
        if (verseLines.length > 0) {
          verseLines.forEach(vL => {
            let vText = formatQuotes(vL.trim());
            if (vText.length > 3) {
              slides.push({
                type: 'verse',
                reference: baseRef,
                runs: highlightKeywords(vText)
              });
            }
          });
        }
      }
      continue;
    }

    // 4. Linha com referência embutida no final
    const trailingRef = isBibleRef(line);
    if (trailingRef && line.length > trailingRef.length + 8) {
      const vText = formatQuotes(line.replace(trailingRef, '').replace(/[()]/g, '').trim());
      slides.push({
        type: 'verse',
        reference: normalizeBibleRefName(trailingRef),
        runs: highlightKeywords(vText)
      });
      i++;
      continue;
    }

    // 5. Linha de reflexão / texto livre
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
  const highlightRegex = /(não temas,?\s*crê somente|quem me tocou\??|não o faria\??|não o confirmaria\??|angústia de espírito|tendo-os feito sair|teu coração|não se apóie|os teus bens|os teus celeiros|transbordarão|talitá cumi|prostrou-se|um dos principais da sinagoga|despendido tudo quanto tinha|não ajunteis tesouros|ajuntai tesouros|honra ao senhor|confia no senhor|obedecer é melhor|obedeça à palavra|palavra do senhor|casa do senhor|voluntariamente|transgressões|amor de mim|não me lembro|prosperarão|buscarei o teu bem|morar na casa do senhor|contemplar a formosura|inquirir no seu templo|senhor|jesus|deus)/gi;

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
