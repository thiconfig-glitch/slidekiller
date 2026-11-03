const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');

/**
 * Builds a 16:9 Full HD presentation adhering strictly to the church's sermon style.
 * 
 * @param {Array} slidesData - Array of slide definitions
 * @param {string} bgImagePath - Path to the background image.
 * @param {string} outputFilePath - Output path for the .pptx file.
 */
async function buildSermonPptx(slidesData, bgImagePath, outputFilePath) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'CHURCH_FULL_HD', width: 13.333, height: 7.5 });
  pptx.layout = 'CHURCH_FULL_HD';

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
      } else if (itemBg.startsWith('/assets/')) {
        const potentialPath = path.join(__dirname, 'public', itemBg);
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
    const isLeftAlign = item.align ? item.align === 'left' : true;
    const startX = 0.9;
    const textWidth = 11.533; // Margens simétricas de 0.9" em ambos os lados
    const pptxFontFace = item.fontFace || 'Bahnschrift SemiBold Condensed';

    if (type === 'verse' || type === 'versículo') {
      const textLength = item.runs.reduce((acc, r) => acc + (r.text || '').length, 0);
      let fontSize = 54;
      if (textLength <= 80) fontSize = 68;
      else if (textLength <= 140) fontSize = 60;
      else if (textLength <= 200) fontSize = 54;
      else fontSize = 48;

      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: pptxFontFace,
          fontSize: fontSize,
          color: r.highlight ? 'E8B859' : 'FFFFFF',
          bold: true,
          shadow: { type: 'outer', angle: 90, blur: 5, offset: 3, opacity: 0.75, color: '000000' }
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
          y: 5.85,
          w: textWidth,
          h: 0.8,
          valign: 'middle',
          align: isLeftAlign ? 'left' : 'center',
          fontFace: pptxFontFace,
          fontSize: 34,
          color: 'E8B859',
          bold: true,
          margin: 0,
          wrap: false,
          shadow: { type: 'outer', angle: 90, blur: 4, offset: 2, opacity: 0.75, color: '000000' }
        });
      }

    } else if (type === 'question_short') {
      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: pptxFontFace,
          fontSize: 100,
          color: r.highlight ? 'E8B859' : 'FFFFFF',
          bold: true,
          shadow: { type: 'outer', angle: 90, blur: 5, offset: 3, opacity: 0.75, color: '000000' }
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
          y: 5.85,
          w: textWidth,
          h: 0.8,
          valign: 'middle',
          align: 'center',
          fontFace: pptxFontFace,
          fontSize: 34,
          color: 'E8B859',
          bold: true,
          margin: 0,
          wrap: false,
          shadow: { type: 'outer', angle: 90, blur: 4, offset: 2, opacity: 0.75, color: '000000' }
        });
      }

    } else if (type === 'reflection') {
      const textLength = item.runs.reduce((acc, r) => acc + (r.text || '').length, 0);
      let fontSize = 48;
      if (textLength <= 80) fontSize = 58;
      else if (textLength <= 150) fontSize = 50;
      else fontSize = 44;

      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: pptxFontFace,
          fontSize: fontSize,
          color: r.highlight ? 'E8B859' : 'FFFFFF',
          bold: true,
          shadow: { type: 'outer', angle: 90, blur: 5, offset: 3, opacity: 0.75, color: '000000' }
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
          y: 5.85,
          w: textWidth,
          h: 0.8,
          valign: 'middle',
          align: isLeftAlign ? 'left' : 'center',
          fontFace: pptxFontFace,
          fontSize: 34,
          color: 'E8B859',
          bold: true,
          margin: 0,
          wrap: false,
          shadow: { type: 'outer', angle: 90, blur: 4, offset: 2, opacity: 0.75, color: '000000' }
        });
      }

    } else {
      // topic / títulos de seção
      const textLength = item.runs.reduce((acc, r) => acc + (r.text || '').length, 0);
      let fontSize = 66;
      if (textLength < 40) fontSize = 78;
      else if (textLength > 90) fontSize = 54;

      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: pptxFontFace,
          fontSize: fontSize,
          color: r.highlight ? 'E8B859' : 'FFFFFF',
          bold: true,
          shadow: { type: 'outer', angle: 90, blur: 5, offset: 3, opacity: 0.75, color: '000000' }
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
          y: 5.85,
          w: textWidth,
          h: 0.8,
          valign: 'middle',
          align: isLeftAlign ? 'left' : 'center',
          fontFace: pptxFontFace,
          fontSize: 34,
          color: 'E8B859',
          bold: true,
          margin: 0,
          wrap: false,
          shadow: { type: 'outer', angle: 90, blur: 4, offset: 2, opacity: 0.75, color: '000000' }
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
      themeXml = themeXml.replace(/<a:latin typeface="[^"]*"/g, '<a:latin typeface="Bahnschrift SemiBold Condensed"');
      zip.file('ppt/theme/theme1.xml', themeXml);
    }
    const localFontPath = path.join(__dirname, 'public', 'assets', 'bahnschrift.ttf');
    const winFontPath = 'C:/Windows/Fonts/bahnschrift.ttf';
    const fontToUse = fs.existsSync(localFontPath) ? localFontPath : (fs.existsSync(winFontPath) ? winFontPath : null);

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
        if (!rels.includes('rIdFontBahnschrift')) {
          const rel = '<Relationship Id="rIdFontBahnschrift" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/font1.fntdata"/>';
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
              '<p:font typeface="Bahnschrift SemiBold Condensed"/>' +
              '<p:regular r:id="rIdFontBahnschrift"/>' +
              '<p:bold r:id="rIdFontBahnschrift"/>' +
            '</p:embeddedFont>' +
            '<p:embeddedFont>' +
              '<p:font typeface="Bahnschrift"/>' +
              '<p:regular r:id="rIdFontBahnschrift"/>' +
              '<p:bold r:id="rIdFontBahnschrift"/>' +
            '</p:embeddedFont>' +
          '</p:embeddedFontLst>';
          pres = pres.replace('</p:presentation>', embedded + '</p:presentation>');
          zip.file('ppt/presentation.xml', pres);
        }
      }
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
