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
  const trimmed = (line || '').replace(/\[\/?HL\]/g, '').replace(/^[⸻\-_\s*#]+|[⸻\-_\s*#]+$/g, '').trim();
  if (trimmed.length < 3) return false;
  if (isBibleRef(trimmed)) return false;

  if (trimmed.endsWith(':') && trimmed.length < 80) return true;
  if (/^\d{1,2}[\.\)]\s+[A-ZÀ-Ý]/.test(trimmed) && trimmed.length < 85) return true;
  if (!trimmed.endsWith('.') && trimmed.length <= 45 && !/[;:,]/.test(trimmed)) {
    return true;
  }

  const letters = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (letters.length >= 4) {
    const uppercaseLetters = (trimmed.match(/[A-ZÀ-Ý]/g) || []).length;
    if (uppercaseLetters / letters.length >= 0.70) return true;
  }

  return false;
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

function splitTextByPunctuation(text, maxChars = 220) {
  const stripped = text.replace(/\[\/?HL\]/g, '').replace(/^[“"']|[”"']$/g, '').trim();
  if (stripped.length <= maxChars) {
    return [text.trim()];
  }

  const primaryParts = text
    .split(/(?<=[.!?](?:\[\/HL\]|["”'’\)])*)\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const subChunks = [];
  for (const part of primaryParts) {
    const partLen = part.replace(/\[\/?HL\]/g, '').length;
    if (partLen <= maxChars) {
      subChunks.push(part);
    } else {
      const secondaryParts = part
        .split(/(?<=[;:](?:\[\/HL\]|["”'’\)])*)\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      let cur = '';
      for (const sp of secondaryParts) {
        const candidate = (cur ? cur + ' ' : '') + sp;
        const candidateLen = candidate.replace(/\[\/?HL\]/g, '').length;
        if (candidateLen > maxChars && cur.length > 0) {
          subChunks.push(cur.trim());
          cur = sp;
        } else {
          cur = candidate;
        }
      }
      if (cur.trim().length > 0) {
        const curLen = cur.replace(/\[\/?HL\]/g, '').length;
        if (curLen > maxChars) {
          const commaParts = cur
            .split(/(?<=[,](?:\[\/HL\]|["”'’\)])*)\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
          let cCur = '';
          for (const cp of commaParts) {
            const cCand = (cCur ? cCur + ' ' : '') + cp;
            if (cCand.replace(/\[\/?HL\]/g, '').length > maxChars && cCur.length > 0) {
              subChunks.push(cCur.trim());
              cCur = cp;
            } else {
              cCur = cCand;
            }
          }
          if (cCur.trim().length > 0) subChunks.push(cCur.trim());
        } else {
          subChunks.push(cur.trim());
        }
      }
    }
  }

  const slides = [];
  let curSlide = '';
  let insideHl = false;

  for (const chunk of subChunks) {
    const candidate = (curSlide ? curSlide + ' ' : '') + chunk;
    const candidateLen = candidate.replace(/\[\/?HL\]/g, '').length;

    if (candidateLen > maxChars && curSlide.length > 0) {
      let chunkStr = curSlide.trim();
      const opens = (chunkStr.match(/\[HL\]/g) || []).length;
      const closes = (chunkStr.match(/\[\/HL\]/g) || []).length;
      if (opens > closes) {
        chunkStr += '[/HL]';
        insideHl = true;
      } else {
        insideHl = false;
      }
      slides.push(chunkStr);
      curSlide = insideHl ? '[HL]' + chunk.trim() : chunk.trim();
    } else {
      curSlide = candidate;
    }
  }

  if (curSlide.trim().length > 0) {
    slides.push(curSlide.trim());
  }

  return slides;
}

function buildRunsFromText(text) {
  if (!text) return [{ text: '', highlight: false }];
  if (text.includes('[HL]')) {
    const regex = /\[HL\](.*?)\[\/HL\]/gis;
    const runs = [];
    let lastIdx = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > lastIdx) {
        runs.push({ text: text.substring(lastIdx, m.index), highlight: false });
      }
      if (m[1].length > 0) {
        runs.push({ text: m[1], highlight: true });
      }
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) {
      runs.push({ text: text.substring(lastIdx), highlight: false });
    }
    return runs.filter(r => r.text.length > 0);
  }
  return highlightKeywords(text);
}

function parseSermonTextOffline(rawText) {
  const normalized = (rawText || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n');

  // 1. Divide em linhas eliminando linhas decorativas
  const allLines = normalized
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !/^[⸻\-_\s]{3,}$/.test(l));

  // 2. Agrupa em blocos lógicos preservando seções, tópicos e passagens bíblicas completas
  const blocks = [];
  let curBlock = [];

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    const isHeading = isHeadingOrTopic(line);
    const isPureRef = isPureBibleRefLine(line);

    if (isHeading) {
      if (curBlock.length > 0) {
        blocks.push(curBlock);
        curBlock = [];
      }
      blocks.push([line]);
      continue;
    }

    if (isPureRef) {
      // Se curBlock já tinha texto e a primeira linha não era apenas outra referência bíblica
      if (curBlock.length > 0 && !isPureBibleRefLine(curBlock[0])) {
        curBlock.push(line);
        blocks.push(curBlock);
        curBlock = [];
      } else {
        // Referência no topo de um novo versículo
        if (curBlock.length > 0) {
          blocks.push(curBlock);
          curBlock = [];
        }
        curBlock.push(line);
      }
      continue;
    }

    curBlock.push(line);
  }
  if (curBlock.length > 0) {
    blocks.push(curBlock);
  }

  const slides = [];

  for (const lines of blocks) {
    if (lines.length === 1 && isHeadingOrTopic(lines[0])) {
      const cleanTitle = lines[0].replace(/\[\/?HL\]/g, '').replace(/^[⸻\-_\s*#]+|[⸻\-_\s*#]+$/g, '').trim();
      slides.push({
        type: 'topic',
        runs: buildRunsFromText(cleanTitle)
      });
      continue;
    }

    if (lines.length === 1) {
      const strippedQ = lines[0].replace(/\[\/?HL\]/g, '').trim();
      if (strippedQ.endsWith('?') && strippedQ.length <= 35 && !isBibleRef(lines[0])) {
        slides.push({
          type: 'question_short',
          runs: buildRunsFromText(strippedQ)
        });
        continue;
      }
    }

    if (lines.length > 1 && isPureBibleRefLine(lines[lines.length - 1])) {
      const ref = normalizeBibleRefName(isBibleRef(lines[lines.length - 1]));
      const verseText = lines.slice(0, lines.length - 1).join(' ').replace(/\s+/g, ' ');
      const verseChunks = splitTextByPunctuation(verseText, 220);
      verseChunks.forEach(chunk => {
        slides.push({
          type: 'verse',
          reference: ref,
          runs: buildRunsFromText(formatQuotes(chunk))
        });
      });
      continue;
    }

    if (isPureBibleRefLine(lines[0])) {
      const ref = normalizeBibleRefName(isBibleRef(lines[0]));
      const restLines = lines.slice(1);
      const combined = restLines.join('\n');
      const numberedRegex = /(?:^|\n)\s*(\d{1,3})\s+([A-ZÀ-Ý“"a-z\[])/;

      if (numberedRegex.test(combined)) {
        const chunks = combined.split(/(?=(?:^|\n)\s*\d{1,3}\s+[A-ZÀ-Ý“"\[])/).filter(s => s.trim().length > 0);
        const bookAndChap = ref.split(/[:.,]/)[0];
        chunks.forEach(chunk => {
          const m = chunk.trim().match(/^(\d{1,3})\s+(.*)$/s);
          if (m) {
            const vNum = m[1];
            let vText = m[2].replace(/\n+/g, ' ').trim();
            const vChunks = splitTextByPunctuation(vText, 220);
            vChunks.forEach(vc => {
              slides.push({
                type: 'verse',
                reference: `${bookAndChap}:${vNum}`,
                runs: buildRunsFromText(formatQuotes(vc))
              });
            });
          } else {
            const vChunks = splitTextByPunctuation(chunk.replace(/\n+/g, ' ').trim(), 220);
            vChunks.forEach(vc => {
              slides.push({
                type: 'verse',
                reference: ref,
                runs: buildRunsFromText(formatQuotes(vc))
              });
            });
          }
        });
      } else {
        const joined = restLines.join(' ').replace(/\s+/g, ' ');
        const vChunks = splitTextByPunctuation(joined, 220);
        vChunks.forEach(vc => {
          slides.push({
            type: 'verse',
            reference: ref,
            runs: buildRunsFromText(formatQuotes(vc))
          });
        });
      }
      continue;
    }

    const trailingRef = isBibleRef(lines[lines.length - 1]);
    if (trailingRef && lines[lines.length - 1].length > trailingRef.length + 8) {
      const fullP = lines.join(' ').replace(/\s+/g, ' ');
      const vText = fullP.replace(trailingRef, '').replace(/[()]/g, '').trim();
      const vChunks = splitTextByPunctuation(vText, 220);
      vChunks.forEach(vc => {
        slides.push({
          type: 'verse',
          reference: normalizeBibleRefName(trailingRef),
          runs: buildRunsFromText(formatQuotes(vc))
        });
      });
      continue;
    }

    const fullText = lines.join(' ').replace(/\s+/g, ' ');
    const chunks = splitTextByPunctuation(fullText, 220);
    chunks.forEach(chunk => {
      slides.push({
        type: 'reflection',
        runs: buildRunsFromText(chunk)
      });
    });
  }

  return slides.length > 0 ? slides : [{
    type: 'verse',
    reference: 'Sermão',
    runs: [{ text: rawText.substring(0, 200), highlight: false }]
  }];
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
