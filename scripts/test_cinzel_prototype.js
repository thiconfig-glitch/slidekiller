const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');

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
  const rawLines = rawText
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

function parseSermonForCinzel(rawText) {
  const paras = reconstructParagraphs(rawText);
  const slides = [];
  let i = 0;

  while (i < paras.length) {
    const para = paras[i];

    // 1. Title / Capa (Slide 1)
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
        text: para
      });
      i++;
      continue;
    }

    // 2. Question / Topic
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
        text: para
      });
      i++;
      continue;
    }

    // 3. Look ahead for pure Bible reference
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

      // Check for numbered verses
      const hasNumberedVerses = precedingParas.some(p => /^\d{1,3}\s+[A-Za-zÀ-ÿ]/.test(p));
      if (hasNumberedVerses) {
        for (const p of precedingParas) {
          const m = p.match(/^(\d{1,3})\s+(.*)$/);
          if (m) {
            const vNum = m[1];
            const vText = stripLeadingVerseNumber(m[2]);
            slides.push({
              type: 'verse',
              reference: `${ref.split(/[:.,]/)[0]}:${vNum}`,
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
          // If there are multiple verse paragraphs (like Gálatas 4:4-7), join them first
          let fullVerseText = vClean = stripLeadingVerseNumber(pText);
          if (pIdx === verseStartIndex && verseStartIndex < precedingParas.length - 1) {
            const nextPara = precedingParas[pIdx + 1];
            fullVerseText = `${vClean} ${stripLeadingVerseNumber(nextPara)}`;
            pIdx++; // skip next
          }

          if (ref.includes('1:3-4') || ref.includes('1:3,4')) {
            const vSplitIdx = fullVerseText.indexOf(', para uma herança');
            if (vSplitIdx !== -1) {
              const part1 = fullVerseText.substring(0, vSplitIdx + 1).trim();
              const part2 = fullVerseText.substring(vSplitIdx + 2).trim();
              const bookName = ref.split(/[:.,]/)[0];
              slides.push({
                type: 'verse',
                reference: `${bookName} 1:3`,
                runs: highlightCinzelThematicPhrases(formatQuotes(part1))
              });
              slides.push({
                type: 'verse',
                reference: `${bookName} 1:4`,
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

    // Reflection outside of a verse block
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

  return slides;
}

async function buildCinzelPptx(slidesData, bgImagePath, outputFilePath) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'CHURCH_FULL_HD', width: 13.333, height: 7.5 });
  pptx.layout = 'CHURCH_FULL_HD';

  for (const item of slidesData) {
    if (!item) continue;
    const slide = pptx.addSlide();
    slide.background = { path: bgImagePath };

    const type = item.type || 'verse';
    const shadowConfig = { type: 'outer', angle: 90, blur: 4, offset: 2, opacity: 0.65, color: '000000' };

    if (type === 'cinzel_cover') {
      // Slide 1: Capa (Title) exactly like EXEMPLO EDITÁVEL.pptx
      slide.addText([
        { text: item.line1, options: { fontFace: 'Cinzel Bold', fontSize: 60, color: 'E1D3C1', bold: true, shadow: shadowConfig } }
      ], {
        x: 0.57,
        y: 2.69,
        w: 12.19,
        h: 1.11,
        align: 'left',
        valign: 'middle',
        margin: 0,
        wrap: true
      });

      slide.addText([
        { text: item.line2, options: { fontFace: 'Cinzel Black', fontSize: 66, color: 'E1D3C1', bold: true, shadow: shadowConfig } }
      ], {
        x: 0.29,
        y: 3.50,
        w: 12.76,
        h: 1.21,
        align: 'left',
        valign: 'middle',
        margin: 0,
        wrap: true
      });

    } else if (type === 'cinzel_question') {
      // Question Slide: 2 distinct boxes matching EXEMPLO EDITÁVEL.pptx
      slide.addText([
        { text: item.line1, options: { fontFace: 'Cinzel Bold', fontSize: 54, color: 'E1D3C1', bold: true, shadow: shadowConfig } }
      ], {
        x: 1.33,
        y: 2.93,
        w: 10.33,
        h: 1.01,
        align: 'left',
        valign: 'middle',
        margin: 0,
        wrap: true
      });

      slide.addText([
        { text: item.line2, options: { fontFace: 'Cinzel Black', fontSize: 54, color: 'E1D3C1', bold: true, shadow: shadowConfig } }
      ], {
        x: 0.13,
        y: 3.56,
        w: 13.07,
        h: 1.21,
        align: 'center',
        valign: 'middle',
        margin: 0,
        wrap: true
      });

    } else if (type === 'verse') {
      const textLength = item.runs.reduce((acc, r) => acc + (r.text || '').length, 0);
      let fontSize = 48;
      if (textLength <= 90) fontSize = 54;
      else if (textLength <= 140) fontSize = 48;
      else if (textLength <= 200) fontSize = 44;
      else fontSize = 40;

      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: r.highlight ? 'Cinzel Black' : 'Cinzel Bold',
          fontSize: fontSize,
          color: r.highlight ? 'E6C486' : 'E1D3C1',
          bold: true,
          shadow: shadowConfig
        }
      }));

      slide.addText(runs, {
        x: 0.41,
        y: 1.2,
        w: 12.52,
        h: 4.6,
        valign: 'middle',
        align: 'center',
        margin: 0,
        wrap: true
      });

      if (item.reference) {
        slide.addText(item.reference.toUpperCase(), {
          x: 0.41,
          y: 5.75,
          w: 12.52,
          h: 0.6,
          valign: 'middle',
          align: 'center',
          fontFace: 'Cinzel',
          fontSize: 28,
          color: 'E1D3C1',
          bold: true,
          margin: 0,
          wrap: false,
          shadow: shadowConfig
        });
      }

    } else if (type === 'reflection') {
      const textLength = item.runs.reduce((acc, r) => acc + (r.text || '').length, 0);
      let fontSize = 48;
      if (textLength <= 90) fontSize = 50;
      else if (textLength <= 160) fontSize = 48;
      else fontSize = 42;

      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: 'Cinzel Bold',
          fontSize: fontSize,
          color: 'E1D3C1',
          bold: true,
          shadow: shadowConfig
        }
      }));

      slide.addText(runs, {
        x: 0.41,
        y: 1.5,
        w: 12.52,
        h: 4.5,
        valign: 'middle',
        align: 'center',
        margin: 0,
        wrap: true
      });
    }
  }

  // Deduplicate 4K background images via ZIP
  const rawBuffer = await pptx.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(rawBuffer);

  const mediaFiles = Object.keys(zip.files).filter(k => k.startsWith('ppt/media/'));
  if (mediaFiles.length > 1) {
    const hashes = {};
    const dedupeMap = {};
    for (const mf of mediaFiles) {
      const fileData = await zip.files[mf].async('nodebuffer');
      const hash = require('crypto').createHash('md5').update(fileData).digest('hex');
      if (hashes[hash]) {
        dedupeMap[mf] = hashes[hash];
        zip.remove(mf);
      } else {
        hashes[hash] = mf;
      }
    }
    const relFiles = Object.keys(zip.files).filter(k => k.endsWith('.rels'));
    for (const rf of relFiles) {
      let relXml = await zip.files[rf].async('text');
      let changed = false;
      for (const [removedPath, canonicalPath] of Object.entries(dedupeMap)) {
        const removedFilename = path.basename(removedPath);
        const canonicalFilename = path.basename(canonicalPath);
        if (relXml.includes(removedFilename)) {
          relXml = relXml.replace(new RegExp(`media/${removedFilename}`, 'g'), `media/${canonicalFilename}`);
          changed = true;
        }
      }
      if (changed) zip.file(rf, relXml);
    }
  }

  const finalBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  fs.writeFileSync(outputFilePath, finalBuffer);
  return { success: true, path: outputFilePath, slidesCount: slidesData.length };
}

async function runTest() {
  const sermonPdfPath = 'C:/Projetos/slidekiller_private_backup/novosexemplos/Só os nascidos de novo têm parte na herança.pdf';
  const pdfBuffer = fs.readFileSync(sermonPdfPath);
  const pdfData = await pdf(pdfBuffer);
  const slides = parseSermonForCinzel(pdfData.text);
  console.log(`Slides parsed: ${slides.length}`);

  const bgPath = path.join(__dirname, '..', 'assets', 'cinzel_theme_bg.png');
  const outPath = path.join(__dirname, '..', 'downloads', 'Sermon_Nobre_Cinzel_Oficial.pptx');
  const res = await buildCinzelPptx(slides, bgPath, outPath);
  console.log('PPTX built:', res);
}

runTest().catch(console.error);
