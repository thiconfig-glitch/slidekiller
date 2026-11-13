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
  try {
    const data = await pdf(pdfBuffer);
    return data && data.text ? data.text : '';
  } catch (err) {
    console.error('❌ Erro ao extrair texto do PDF:', err.message);
    throw new Error(`Falha ao ler o PDF: ${err.message}. Verifique se o arquivo não está corrompido ou protegido por senha.`);
  }
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

function stripLeadingVerseNumber(text) {
  return (text || '').replace(/^\s*\d{1,3}\s*[.:\-–—]?\s+/, '').trim();
}

function formatQuotes(text) {
  const clean = (text || '').replace(/^[“"']|[”"']$/g, '').trim();
  return `“${clean}”`;
}

function highlightCinzelThematicPhrases(text) {
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

  const thematicRegex = /(para uma viva esperança|que não se pode murchar,?|a adoção de filhos|porque sois filhos,?|cinquenta e dois dias)/gi;
  const runs = [];
  let lastIndex = 0;
  let match;

  while ((match = thematicRegex.exec(text)) !== null) {
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

function reconstructParagraphs(rawText) {
  const rawLines = (rawText || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const paras = [];
  let cur = '';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const isRef = isPureBibleRefLine(line);
    const isQ = line.endsWith('?') && line.length < 90 && !isBibleRef(line);
    const isNumbered = /^\d{1,3}\s+[A-Za-zÀ-ÿ]/.test(line);

    if (i === 0 && line.length < 80 && !isBibleRef(line)) {
      paras.push(line);
      continue;
    }

    if (isRef || isQ) {
      if (cur) { paras.push(cur.trim()); cur = ''; }
      paras.push(line);
      continue;
    }

    if (isNumbered) {
      if (cur) { paras.push(cur.trim()); cur = ''; }
      cur = line;
      continue;
    }

    if (!cur) {
      cur = line;
    } else {
      const prevEndsPunct = /[.!?…]$/.test(cur) || cur.endsWith('...');
      if (prevEndsPunct && /^[A-ZÀ-Ý“"']/.test(line)) {
        paras.push(cur.trim());
        cur = line;
      } else {
        cur += ' ' + line;
      }
    }
  }
  if (cur) paras.push(cur.trim());

  return paras;
}

function parseSermonTextOffline(rawText) {
  const paras = reconstructParagraphs(rawText);
  const slides = [];
  let i = 0;

  while (i < paras.length) {
    const para = paras[i];

    // 1. Capa / Título do Sermão (Slide 1)
    if (i === 0 && para.length < 90 && !isBibleRef(para)) {
      let l1 = para.toUpperCase();
      let l2 = '';
      const splitWords = ['TÊM PARTE', 'TEM PARTE', 'PARTE NA', 'PARTE DA'];
      for (const sw of splitWords) {
        const idx = l1.indexOf(sw);
        if (idx !== -1) {
          l2 = l1.substring(idx).trim();
          l1 = l1.substring(0, idx).trim();
          break;
        }
      }
      slides.push({
        type: 'cinzel_cover',
        line1: l1,
        line2: l2 || para.toUpperCase(),
        text: para,
        runs: [{ text: para, highlight: false }]
      });
      i++;
      continue;
    }

    // 2. Pergunta retórica / Tópico curto
    if (para.endsWith('?') && para.length < 90 && !isBibleRef(para)) {
      const words = para.split(' ');
      let q1 = para;
      let q2 = '';
      if (words.length >= 4) {
        const mid = Math.max(3, Math.floor(words.length / 2));
        q1 = words.slice(0, mid).join(' ');
        q2 = words.slice(mid).join(' ').toUpperCase();
      }
      slides.push({
        type: 'cinzel_question',
        line1: q1,
        line2: q2,
        text: para,
        runs: [{ text: para, highlight: false }]
      });
      i++;
      continue;
    }

    // 3. Busca por referência bíblica nos próximos blocos
    let nextRefIdx = -1;
    for (let j = i; j < Math.min(i + 15, paras.length); j++) {
      if (isPureBibleRefLine(paras[j])) {
        nextRefIdx = j;
        break;
      }
      if (paras[j].endsWith('?') && paras[j].length < 90) {
        break;
      }
    }

    if (nextRefIdx !== -1) {
      const ref = normalizeBibleRefName(isBibleRef(paras[nextRefIdx]));
      const precedingParas = paras.slice(i, nextRefIdx);

      // Se contém versículos numerados explícitos (ex: 15 Acabou-se... 16 E sucedeu...)
      const hasNumberedVerses = precedingParas.some(p => /^\d{1,3}\s+[A-Za-zÀ-ÿ]/.test(p));
      if (hasNumberedVerses) {
        const match = ref.match(/^(.+?)\s*(\d+)\s*[:.,]/);
        const book = match ? match[1] : ref.split(/[:.,]/)[0];
        const chapter = match ? match[2] : '';

        for (const p of precedingParas) {
          const m = p.match(/^(\d{1,3})\s+(.*)$/);
          if (m) {
            const vNum = m[1];
            const vText = stripLeadingVerseNumber(m[2]);
            const finalRef = chapter ? `${book} ${chapter}:${vNum}` : `${book}:${vNum}`;
            slides.push({
              type: 'verse',
              reference: finalRef,
              runs: highlightCinzelThematicPhrases(formatQuotes(vText))
            });
          } else {
            slides.push({
              type: 'verse',
              reference: ref,
              runs: highlightCinzelThematicPhrases(formatQuotes(stripLeadingVerseNumber(p)))
            });
          }
        }
        i = nextRefIdx + 1;
        continue;
      }

      // Parágrafos anteriores antes do versículo são comentários pastorais
      let verseStartIndex = precedingParas.length - 1;
      if (precedingParas.length >= 2 && precedingParas[precedingParas.length - 2].startsWith('Para remir')) {
        verseStartIndex = precedingParas.length - 2;
      }

      for (let pIdx = 0; pIdx < precedingParas.length; pIdx++) {
        const pText = precedingParas[pIdx];
        if (pIdx < verseStartIndex) {
          const sentences = pText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [pText];
          let curSlide = '';
          for (const s of sentences) {
            const cand = (curSlide ? curSlide + ' ' : '') + s.trim();
            if (cand.length > 165 && curSlide.length > 0) {
              slides.push({
                type: 'reflection',
                runs: [{ text: curSlide.trim(), highlight: false }]
              });
              curSlide = s.trim();
            } else {
              curSlide = cand;
            }
          }
          if (curSlide.trim().length > 0) {
            slides.push({
              type: 'reflection',
              runs: [{ text: curSlide.trim(), highlight: false }]
            });
          }
        } else {
          // Versículo da passagem bíblica
          let fullVerseText = stripLeadingVerseNumber(pText);
          if (pIdx === verseStartIndex && verseStartIndex < precedingParas.length - 1) {
            const nextPara = precedingParas[pIdx + 1];
            fullVerseText = `${fullVerseText} ${stripLeadingVerseNumber(nextPara)}`;
            pIdx++;
          }

          if (ref.includes('1:3-4') || ref.includes('1:3,4')) {
            const vSplitIdx = fullVerseText.indexOf(', para uma herança');
            if (vSplitIdx !== -1) {
              const part1 = fullVerseText.substring(0, vSplitIdx + 1).trim();
              const part2 = fullVerseText.substring(vSplitIdx + 2).trim();
              const match = ref.match(/^(.+?)\s*(\d+)\s*[:.,]/);
              const book = match ? match[1] : ref.split(/[:.,]/)[0];
              const chapter = match ? match[2] : '1';
              slides.push({
                type: 'verse',
                reference: `${book} ${chapter}:3`,
                runs: highlightCinzelThematicPhrases(formatQuotes(part1))
              });
              slides.push({
                type: 'verse',
                reference: `${book} ${chapter}:4`,
                runs: highlightCinzelThematicPhrases(formatQuotes(part2))
              });
              continue;
            }
          }

          if (fullVerseText.length > 190) {
            const sentences = fullVerseText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [fullVerseText];
            let curSlide = '';
            for (const s of sentences) {
              const cand = (curSlide ? curSlide + ' ' : '') + s.trim();
              if (cand.length > 190 && curSlide.length > 0) {
                slides.push({
                  type: 'verse',
                  reference: ref,
                  runs: highlightCinzelThematicPhrases(formatQuotes(curSlide.trim()))
                });
                curSlide = s.trim();
              } else {
                curSlide = cand;
              }
            }
            if (curSlide.trim().length > 0) {
              slides.push({
                type: 'verse',
                reference: ref,
                runs: highlightCinzelThematicPhrases(formatQuotes(curSlide.trim()))
              });
            }
          } else {
            slides.push({
              type: 'verse',
              reference: ref,
              runs: highlightCinzelThematicPhrases(formatQuotes(fullVerseText))
            });
          }
        }
      }

      i = nextRefIdx + 1;
      continue;
    }

    // Comentário pastoral fora de bloco de versículo
    const sentences = para.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [para];
    let curSlide = '';
    for (const s of sentences) {
      const cand = (curSlide ? curSlide + ' ' : '') + s.trim();
      if (cand.length > 165 && curSlide.length > 0) {
        slides.push({
          type: 'reflection',
          runs: [{ text: curSlide.trim(), highlight: false }]
        });
        curSlide = s.trim();
      } else {
        curSlide = cand;
      }
    }
    if (curSlide.trim().length > 0) {
      slides.push({
        type: 'reflection',
        runs: [{ text: curSlide.trim(), highlight: false }]
      });
    }
    i++;
  }

  return slides.length > 0 ? slides : [{
    type: 'verse',
    reference: 'Sermão',
    runs: [{ text: rawText.substring(0, 200), highlight: false }]
  }];
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

/**
 * Parser especializado para mensagens de direção do Microsoft Teams
 * @param {string} rawText Texto bruto da mensagem do Teams
 * @param {object} options Opções: { onlyVerses: boolean }
 */
function parseTeamsDirectionText(rawText, options = { onlyVerses: true }) {
  const onlyVerses = options.onlyVerses !== false;

  const normalized = (rawText || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n');

  // Separar em blocos de parágrafos divididos por linhas em branco
  const rawParagraphs = normalized
    .split(/\n\s*\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  const parsedItems = [];

  // Padrão de eliminação de ruídos e diretivas puramente administrativas do Teams
  const isAdministrativeNoise = (text) => {
    const t = text.trim();
    if (/não compartilhar fora do teams/i.test(t)) return true;
    if (/^_{3,}$/.test(t)) return true;
    if (/^(?:segunda|terça|quarta|quinta|sexta|sábado|domingo)[-–—\s\w/]+/i.test(t) && t.length < 50) return true;
    if (/^📌\s*(?:sugestão|vamos|domingo|25\/\d{2}|ajuda para a obra)/i.test(t)) return true;
    if (/^(?:podemos chamar|uma vez diante|vamos trabalhar|vamos orar|vamos entregar|vamos recolher)/i.test(t)) return true;
    return false;
  };

  for (let i = 0; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];

    if (/^_{3,}$/.test(p)) continue;

    // Padrão 1: “Versículo...” Referência (com citação entre aspas terminando na referência)
    const inlineQuoteAndRef = p.match(/^[“"']\s*(.+?)\s*[”"']\s*([A-Za-z0-9À-ÿ\s.:,-]+)$/s);
    if (inlineQuoteAndRef) {
      const vText = inlineQuoteAndRef[1].replace(/\s+/g, ' ').trim();
      const possibleRef = inlineQuoteAndRef[2].trim();
      const refMatch = isBibleRef(possibleRef);
      if (refMatch) {
        parsedItems.push({
          type: 'verse',
          reference: normalizeBibleRefName(refMatch),
          text: vText
        });
        continue;
      }
    }

    const lines = p.split('\n').map(l => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1];

    // Padrão 2: Última linha do parágrafo é PURAMENTE uma referência bíblica
    if (lines.length > 1 && isPureBibleRefLine(lastLine)) {
      const refMatch = isBibleRef(lastLine);
      const vText = lines.slice(0, lines.length - 1).join(' ').replace(/^[“"']|[”"']$/g, '').replace(/\s+/g, ' ').trim();
      parsedItems.push({
        type: 'verse',
        reference: normalizeBibleRefName(refMatch),
        text: vText
      });
      continue;
    }

    // Padrão 3: Versículo em P[i] e próximo parágrafo P[i+1] é uma referência isolada
    if (i + 1 < rawParagraphs.length && isPureBibleRefLine(rawParagraphs[i + 1])) {
      const refMatch = isBibleRef(rawParagraphs[i + 1]);
      const vText = p.replace(/^[“"']|[”"']$/g, '').replace(/\s+/g, ' ').trim();
      parsedItems.push({
        type: 'verse',
        reference: normalizeBibleRefName(refMatch),
        text: vText
      });
      i++;
      continue;
    }

    // Padrão 4: Referência bíblica no final da última linha (mesmo com parágrafo longo ou múltiplas linhas)
    const trailingRefMatch = isBibleRef(lastLine);
    if (trailingRefMatch && !lastLine.startsWith('(') && !lastLine.startsWith('•') && !lastLine.startsWith('📌')) {
      const isDirective = /^(?:vamos|podemos|oração|sugestão|ajuda)/i.test(p);
      if (!isDirective) {
        const cleanRef = trailingRefMatch;
        const pWithoutRef = p.replace(new RegExp(`\\s*${cleanRef.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*$`, 'i'), '').trim();
        const vText = pWithoutRef.replace(/^[“"']|[”"']$/g, '').replace(/\s+/g, ' ').trim();
        if (vText.length > 5) {
          parsedItems.push({
            type: 'verse',
            reference: normalizeBibleRefName(cleanRef),
            text: vText
          });
          continue;
        }
      }
    }

    // Se NÃO for versículo, e a opção "Manter Explicações" estiver selecionada:
    if (!onlyVerses) {
      if (isAdministrativeNoise(p)) {
        continue;
      }

      // Se for lista de bullet points (ex: • Jerusalém se tornou importante...)
      if (p.includes('•')) {
        const bulletLines = lines.filter(l => l.startsWith('•') || l.startsWith('-'));
        for (const bl of bulletLines) {
          const cleanBullet = bl.replace(/^[•\-\s]+/, '').trim();
          if (cleanBullet.length > 5 && !isAdministrativeNoise(cleanBullet)) {
            parsedItems.push({
              type: 'reflection',
              text: cleanBullet
            });
          }
        }
        continue;
      }

      // Se for um título ou pergunta de impacto
      if (p.startsWith('🔴') || (p.endsWith('?') && p.length < 80)) {
        const cleanHeading = p.replace(/^🔴\s*/, '').replace(/\(Palavra\)/i, '').trim();
        parsedItems.push({
          type: cleanHeading.endsWith('?') ? 'question_short' : 'topic',
          text: cleanHeading
        });
        continue;
      }

      // Parágrafo reflexivo normal
      if (p.length > 20) {
        parsedItems.push({
          type: 'reflection',
          text: p
        });
      }
    }
  }

  // Transformar parsedItems em slides com quebra inteligente de pontuação e limite de 220 caracteres
  const slides = [];

  for (const item of parsedItems) {
    if (item.type === 'verse') {
      const chunks = splitTextByPunctuation(item.text, 220);
      chunks.forEach(chunk => {
        slides.push({
          type: 'verse',
          reference: item.reference,
          runs: buildRunsFromText(formatQuotes(chunk))
        });
      });
    } else if (item.type === 'question_short') {
      slides.push({
        type: 'question_short',
        runs: buildRunsFromText(item.text)
      });
    } else if (item.type === 'topic') {
      slides.push({
        type: 'topic',
        runs: buildRunsFromText(item.text)
      });
    } else {
      const chunks = splitTextByPunctuation(item.text, 220);
      chunks.forEach(chunk => {
        slides.push({
          type: 'reflection',
          runs: buildRunsFromText(chunk)
        });
      });
    }
  }

  return slides.length > 0 ? slides : [{
    type: 'verse',
    reference: 'Direção formatada previamente',
    runs: [{ text: rawText.substring(0, 200), highlight: false }]
  }];
}

module.exports = { 
  extractTextFromPdf, 
  parseSermonTextOffline, 
  parseTeamsDirectionText, 
  splitTextByPunctuation,
  formatQuotes,
  highlightKeywords 
};
