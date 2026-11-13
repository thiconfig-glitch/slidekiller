const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');

function ensureCurlyQuotes(runs) {
  if (!runs || !Array.isArray(runs) || runs.length === 0) return runs;
  const firstText = runs[0].text || '';
  if (!/^[“"']/.test(firstText.trim())) {
    runs[0].text = '“' + runs[0].text;
  } else if (firstText.startsWith('"')) {
    runs[0].text = '“' + runs[0].text.slice(1);
  }
  const lastIdx = runs.length - 1;
  const lastText = runs[lastIdx].text || '';
  if (!/[”"']$/.test(lastText.trim())) {
    runs[lastIdx].text = runs[lastIdx].text + '”';
  } else if (lastText.endsWith('"')) {
    runs[lastIdx].text = runs[lastIdx].text.slice(0, -1) + '”';
  }
  return runs;
}

/**
 * Builds a 16:9 Full HD presentation adhering strictly to the church's sermon style.
 * Supports multiple official themes:
 * - Tema Bíblia (Padrão Oficial Igreja): Bahnschrift SemiBold Condensed, Branco & Dourado (#E8B859), Alinhado à Esquerda
 * - Tema TS: Fundo TS Malha Fina 4K, Bahnschrift SemiBold Condensed, Branco & Dourado
 * - Tema Nobre Cinzel: Fundo Nobre 4K, Tipografia Cinzel (Bold/Black), Marfim (#E1D3C1) & Ouro Nobre (#E6C486), Alinhamento Centralizado
 * 
 * @param {Array} slidesData - Array of slide definitions
 * @param {string} bgImagePath - Path to the background image.
 * @param {string} outputFilePath - Output path for the .pptx file.
 */
async function buildSermonPptx(slidesData, bgImagePath, outputFilePath) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'CHURCH_FULL_HD', width: 13.333, height: 7.5 });
  pptx.layout = 'CHURCH_FULL_HD';

  const isCinzelPresentation = (bgImagePath && (bgImagePath.includes('cinzel') || bgImagePath.includes('nobre'))) ||
    slidesData.some(s => s && (
      (s.bgImage && (s.bgImage.includes('cinzel') || s.bgImage.includes('nobre'))) ||
      s.theme === 'cinzel' || s.theme === 'theme_cinzel' || s.theme === 'nobre' ||
      s.fontFace === 'Cinzel'
    ));

  for (const item of slidesData) {
    if (!item) continue;

    // Normalizar e blindar runs para evitar TypeError
    if (!item.runs || !Array.isArray(item.runs)) {
      item.runs = [{ text: item.text || '', highlight: false }];
    } else {
      item.runs = item.runs.map(r => (typeof r === 'string' ? { text: r, highlight: false } : { text: r?.text || '', highlight: !!r?.highlight }));
    }

    const slide = pptx.addSlide();

    // 1. Imagem de fundo (16:9 Full HD)
    const itemBg = item.bgImage || item.backgroundImage;
    if (itemBg) {
      if (itemBg.startsWith('data:')) {
        slide.background = { data: itemBg };
      } else if (fs.existsSync(itemBg)) {
        slide.background = { path: itemBg };
      } else if (itemBg.startsWith('/downloads/')) {
        const potentialPath = path.join(__dirname, 'downloads', path.basename(itemBg));
        if (fs.existsSync(potentialPath)) {
          slide.background = { path: potentialPath };
        } else if (bgImagePath && fs.existsSync(bgImagePath)) {
          slide.background = { path: bgImagePath };
        } else {
          slide.background = { color: '000000' };
        }
      } else if (itemBg.startsWith('/assets/') || itemBg.startsWith('assets/')) {
        const rel = itemBg.startsWith('/') ? itemBg.slice(1) : itemBg;
        const potentialPath = path.join(__dirname, 'public', rel);
        if (fs.existsSync(potentialPath)) {
          slide.background = { path: potentialPath };
        } else if (bgImagePath && fs.existsSync(bgImagePath)) {
          slide.background = { path: bgImagePath };
        } else {
          slide.background = { color: '000000' };
        }
      } else if (bgImagePath && fs.existsSync(bgImagePath)) {
        slide.background = { path: bgImagePath };
      } else {
        slide.background = { color: '000000' };
      }
    } else if (bgImagePath && fs.existsSync(bgImagePath)) {
      slide.background = { path: bgImagePath };
    } else {
      slide.background = { color: '000000' };
    }

    const type = item.type || 'verse';
    const isCinzel = isCinzelPresentation ||
      (itemBg && (itemBg.includes('cinzel') || itemBg.includes('nobre'))) ||
      item.theme === 'cinzel' || item.theme === 'theme_cinzel' || item.theme === 'nobre' ||
      item.fontFace === 'Cinzel';

    const defaultAlign = isCinzel ? 'center' : 'left';
    const isLeftAlign = item.align ? item.align === 'left' : defaultAlign === 'left';
    const startX = 0.9;
    const textWidth = 11.533; // Margens simétricas de 0.9" em ambos os lados

    const defaultFontFace = isCinzel ? 'Cinzel Bold' : 'Bahnschrift SemiBold Condensed';
    const pptxFontFace = item.fontFace || defaultFontFace;

    const baseTextColor = isCinzel ? 'E1D3C1' : 'FFFFFF';
    const highlightColor = isCinzel ? 'E6C486' : 'E8B859';
    const refColor = isCinzel ? 'E1D3C1' : 'E8B859';
    const shadowConfig = isCinzel
      ? { type: 'outer', angle: 90, blur: 4, offset: 2, opacity: 0.65, color: '000000' }
      : { type: 'outer', angle: 90, blur: 5, offset: 3, opacity: 0.75, color: '000000' };

    if (type === 'verse' || type === 'versículo') {
      if (isCinzel) {
        ensureCurlyQuotes(item.runs);
      }
      const textLength = item.runs.reduce((acc, r) => acc + (r.text || '').length, 0);
      let fontSize = 54;
      if (isCinzel) {
        if (textLength <= 90) fontSize = 54;
        else if (textLength <= 140) fontSize = 48;
        else if (textLength <= 200) fontSize = 44;
        else fontSize = 40;
      } else {
        if (textLength <= 80) fontSize = 68;
        else if (textLength <= 140) fontSize = 60;
        else if (textLength <= 200) fontSize = 54;
        else fontSize = 48;
      }

      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: isCinzel ? (r.highlight ? 'Cinzel Black' : (item.fontFace || 'Cinzel Bold')) : pptxFontFace,
          fontSize: fontSize,
          color: r.highlight ? highlightColor : baseTextColor,
          bold: true,
          shadow: shadowConfig
        }
      }));

      // Caixa 1: Texto do Versículo (amplo, centralizado verticalmente)
      slide.addText(runs, {
        x: startX,
        y: 1.1,
        w: textWidth,
        h: 4.6,
        valign: 'middle',
        align: isLeftAlign ? 'left' : 'center',
        margin: 0,
        wrap: true
      });

      // Caixa 2: Referência Bíblica SEPARADA no rodapé
      if (item.reference) {
        slide.addText(item.reference.toUpperCase(), {
          x: startX,
          y: isCinzel ? 5.65 : 5.85,
          w: textWidth,
          h: 0.8,
          valign: 'middle',
          align: isLeftAlign ? 'left' : 'center',
          fontFace: isCinzel ? 'Cinzel' : pptxFontFace,
          fontSize: isCinzel ? 28 : 34,
          color: refColor,
          bold: true,
          margin: 0,
          wrap: false,
          shadow: shadowConfig
        });
      }

    } else if (type === 'question_short') {
      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: isCinzel ? (r.highlight ? 'Cinzel Black' : (item.fontFace || 'Cinzel Bold')) : pptxFontFace,
          fontSize: isCinzel ? 72 : 100,
          color: r.highlight ? highlightColor : baseTextColor,
          bold: true,
          shadow: shadowConfig
        }
      }));

      slide.addText(runs, {
        x: startX,
        y: 1.6,
        w: textWidth,
        h: 4.2,
        valign: 'middle',
        align: 'center',
        margin: 0,
        wrap: true
      });

      if (item.reference) {
        slide.addText(item.reference.toUpperCase(), {
          x: startX,
          y: isCinzel ? 5.65 : 5.85,
          w: textWidth,
          h: 0.8,
          valign: 'middle',
          align: 'center',
          fontFace: isCinzel ? 'Cinzel' : pptxFontFace,
          fontSize: isCinzel ? 28 : 34,
          color: refColor,
          bold: true,
          margin: 0,
          wrap: false,
          shadow: shadowConfig
        });
      }

    } else if (type === 'reflection') {
      const textLength = item.runs.reduce((acc, r) => acc + (r.text || '').length, 0);
      let fontSize = 48;
      if (isCinzel) {
        if (textLength <= 90) fontSize = 50;
        else if (textLength <= 160) fontSize = 46;
        else fontSize = 42;
      } else {
        if (textLength <= 80) fontSize = 58;
        else if (textLength <= 150) fontSize = 50;
        else fontSize = 44;
      }

      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: isCinzel ? (r.highlight ? 'Cinzel Black' : (item.fontFace || 'Cinzel Bold')) : pptxFontFace,
          fontSize: fontSize,
          color: r.highlight ? highlightColor : baseTextColor,
          bold: true,
          shadow: shadowConfig
        }
      }));

      slide.addText(runs, {
        x: startX,
        y: 1.1,
        w: textWidth,
        h: 4.6,
        valign: 'middle',
        align: isLeftAlign ? 'left' : 'center',
        margin: 0,
        wrap: true
      });

      if (item.reference) {
        slide.addText(item.reference.toUpperCase(), {
          x: startX,
          y: isCinzel ? 5.65 : 5.85,
          w: textWidth,
          h: 0.8,
          valign: 'middle',
          align: isLeftAlign ? 'left' : 'center',
          fontFace: isCinzel ? 'Cinzel' : pptxFontFace,
          fontSize: isCinzel ? 28 : 34,
          color: refColor,
          bold: true,
          margin: 0,
          wrap: false,
          shadow: shadowConfig
        });
      }

    } else {
      // topic / títulos de seção
      const textLength = item.runs.reduce((acc, r) => acc + (r.text || '').length, 0);
      let fontSize = 66;
      if (isCinzel) {
        if (textLength < 45) fontSize = 64;
        else if (textLength > 90) fontSize = 48;
        else fontSize = 54;
      } else {
        if (textLength < 40) fontSize = 78;
        else if (textLength > 90) fontSize = 54;
      }

      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: isCinzel ? (r.highlight ? 'Cinzel Black' : (item.fontFace || 'Cinzel Bold')) : pptxFontFace,
          fontSize: fontSize,
          color: r.highlight ? highlightColor : baseTextColor,
          bold: true,
          shadow: shadowConfig
        }
      }));

      slide.addText(runs, {
        x: startX,
        y: 1.6,
        w: textWidth,
        h: 4.2,
        valign: 'middle',
        align: isLeftAlign ? 'left' : 'center',
        margin: 0,
        wrap: true
      });

      if (item.reference) {
        slide.addText(item.reference.toUpperCase(), {
          x: startX,
          y: isCinzel ? 5.65 : 5.85,
          w: textWidth,
          h: 0.8,
          valign: 'middle',
          align: isLeftAlign ? 'left' : 'center',
          fontFace: isCinzel ? 'Cinzel' : pptxFontFace,
          fontSize: isCinzel ? 28 : 34,
          color: refColor,
          bold: true,
          margin: 0,
          wrap: false,
          shadow: shadowConfig
        });
      }
    }
  }

  const rawBuffer = await pptx.write({ outputType: 'nodebuffer' });
  try {
    const zip = await JSZip.loadAsync(rawBuffer);
    const themeFile = zip.file('ppt/theme/theme1.xml');
    if (themeFile && typeof themeFile.async === 'function') {
      let themeXml = await themeFile.async('text');
      const targetTypeface = isCinzelPresentation ? 'Cinzel' : 'Bahnschrift SemiBold Condensed';
      themeXml = themeXml.replace(/<a:latin typeface="[^"]*"/g, `<a:latin typeface="${targetTypeface}"`);
      zip.file('ppt/theme/theme1.xml', themeXml);
    }

    let fontToUse = null;
    let fontName = 'Bahnschrift';
    let relId = 'rIdFontBahnschrift';

    if (isCinzelPresentation) {
      const cinzelBold = path.join(__dirname, 'public', 'assets', 'fonts', 'Cinzel-Bold.otf');
      const rootCinzel = path.join(__dirname, 'assets', 'fonts', 'Cinzel-Bold.otf');
      fontToUse = fs.existsSync(cinzelBold) ? cinzelBold : (fs.existsSync(rootCinzel) ? rootCinzel : null);
      fontName = 'Cinzel';
      relId = 'rIdFontCinzel';
    } else {
      const localFontPath = path.join(__dirname, 'public', 'assets', 'bahnschrift.ttf');
      const winFontPath = 'C:/Windows/Fonts/bahnschrift.ttf';
      fontToUse = fs.existsSync(localFontPath) ? localFontPath : (fs.existsSync(winFontPath) ? winFontPath : null);
      fontName = 'Bahnschrift SemiBold Condensed';
      relId = 'rIdFontBahnschrift';
    }

    if (fontToUse) {
      const fontBuf = fs.readFileSync(fontToUse);
      zip.file('ppt/fonts/font1.fntdata', fontBuf);
      const ctFile = zip.file('[Content_Types].xml');
      if (ctFile && typeof ctFile.async === 'function') {
        let ct = await ctFile.async('text');
        if (!ct.includes('Extension="fntdata"')) {
          ct = ct.replace('</Types>', '<Default Extension="fntdata" ContentType="application/x-fontdata"/></Types>');
          zip.file('[Content_Types].xml', ct);
        }
      }
      const relsFile = zip.file('ppt/_rels/presentation.xml.rels');
      if (relsFile && typeof relsFile.async === 'function') {
        let rels = await relsFile.async('text');
        if (!rels.includes(relId)) {
          const rel = `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/font1.fntdata"/>`;
          rels = rels.replace('</Relationships>', rel + '</Relationships>');
          zip.file('ppt/_rels/presentation.xml.rels', rels);
        }
      }
      const presFile = zip.file('ppt/presentation.xml');
      if (presFile && typeof presFile.async === 'function') {
        let pres = await presFile.async('text');
        if (!pres.includes('embeddedFontLst')) {
          const embedded = '<p:embeddedFontLst>' +
            '<p:embeddedFont>' +
              `<p:font typeface="${fontName}"/>` +
              `<p:regular r:id="${relId}"/>` +
              `<p:bold r:id="${relId}"/>` +
            '</p:embeddedFont>' +
          '</p:embeddedFontLst>';
          pres = pres.replace('</p:presentation>', embedded + '</p:presentation>');
          zip.file('ppt/presentation.xml', pres);
        }
      }
    }
    // Deduplicação inteligente de mídias repetidas (otimiza PPTX 4K de ~40MB para ~2.8MB mantendo resolução máxima)
    try {
      const mediaHashes = {};
      const targetMap = {};
      const mediaFiles = Object.keys(zip.files).filter(k => k.startsWith('ppt/media/') && !k.endsWith('/'));
      for (const mName of mediaFiles) {
        const data = await zip.file(mName).async('nodebuffer');
        const hashKey = crypto.createHash('md5').update(data).digest('hex');
        if (mediaHashes[hashKey]) {
          targetMap[mName] = mediaHashes[hashKey];
          zip.remove(mName);
        } else {
          mediaHashes[hashKey] = mName;
        }
      }

      if (Object.keys(targetMap).length > 0) {
        const relsFiles = Object.keys(zip.files).filter(k => k.startsWith('ppt/slides/_rels/slide') && k.endsWith('.xml.rels'));
        for (const rName of relsFiles) {
          let relText = await zip.file(rName).async('text');
          for (const [dup, master] of Object.entries(targetMap)) {
            const dupTarget = '../media/' + path.basename(dup);
            const masterTarget = '../media/' + path.basename(master);
            relText = relText.split(dupTarget).join(masterTarget);
          }
          zip.file(rName, relText);
        }
      }
    } catch (dedupErr) {
      console.warn('Aviso: falha na deduplicação de mídia do PPTX:', dedupErr.message);
    }

    const finalBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(outputFilePath, finalBuffer);
  } catch(e) {
    fs.writeFileSync(outputFilePath, rawBuffer);
  }
  return {
    slideCount: slidesData.length,
    outputFilePath
  };
}

module.exports = { buildSermonPptx };
