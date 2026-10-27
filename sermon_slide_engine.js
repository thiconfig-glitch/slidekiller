const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');

/**
 * Builds a 16:9 presentation adhering strictly to the church's sermon style.
 * 
 * @param {Array} slidesData - Array of slide definitions:
 *   [
 *     {
 *       type: 'verse' | 'impact' | 'question_short' | 'reflection',
 *       reference: 'Mateus 6:19',
 *       runs: [
 *         { text: '“Não ajunteis tesouros na terra... ', highlight: false },
 *         { text: 'onde os ladrões minam e roubam;”', highlight: true }
 *       ]
 *     }
 *   ]
 * @param {string} bgImagePath - Path to the church background image.
 * @param {string} outputFilePath - Output path for the .pptx file.
 */
async function buildSermonPptx(slidesData, bgImagePath, outputFilePath) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  for (const item of slidesData) {
    const slide = pptx.addSlide();

    // 1. Background image (16:9 full slide cover, suportando fundo específico por slide)
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
          slide.background = { color: 'FFFFFF' };
        }
      } else if (itemBg.startsWith('/assets/')) {
        const potentialPath = path.join(__dirname, 'public', itemBg);
        if (fs.existsSync(potentialPath)) {
          slide.background = { path: potentialPath };
        } else if (bgImagePath && fs.existsSync(bgImagePath)) {
          slide.background = { path: bgImagePath };
        } else {
          slide.background = { color: 'FFFFFF' };
        }
      } else if (bgImagePath && fs.existsSync(bgImagePath)) {
        slide.background = { path: bgImagePath };
      } else {
        slide.background = { color: 'FFFFFF' };
      }
    } else if (bgImagePath && fs.existsSync(bgImagePath)) {
      slide.background = { path: bgImagePath };
    } else {
      slide.background = { color: 'FFFFFF' };
    }

    const type = item.type || 'verse';

    if (type === 'verse' || type === 'versículo') {
      // Verse formatting
      const textLength = item.runs.reduce((acc, r) => acc + (r.text || '').length, 0);
      let fontSize = 54;
      if (textLength < 70) fontSize = 66;
      else if (textLength > 160) fontSize = 46;
      else if (textLength > 120) fontSize = 50;

      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: 'Bahnschrift SemiBold Condensed',
          fontSize: fontSize,
          color: r.highlight ? 'E8B859' : '000000',
          shadow: { type: 'outer', angle: 90, blur: 3, offset: 2, opacity: 0.35, color: '000000' }
        }
      }));

      // Text box for verse
      slide.addText(runs, {
        x: 0.8,
        y: 1.4,
        w: 11.7,
        h: 3.8,
        valign: 'middle',
        align: 'left',
        paraSpaceAfter: 10
      });

      // Reference line (Bebas Neue, gold highlight color)
      if (item.reference) {
        slide.addText(item.reference, {
          x: 0.8,
          y: 5.4,
          w: 11.7,
          h: 0.8,
          fontFace: 'Bebas Neue',
          fontSize: 42,
          color: 'E8B859',
          align: 'left',
          shadow: { type: 'outer', angle: 90, blur: 3, offset: 2, opacity: 0.35, color: '000000' }
        });
      }

    } else if (type === 'question_short') {
      // Ultra-large dramatic short question (e.g. "E Jairo?")
      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: 'Bebas Neue',
          fontSize: 160,
          color: r.highlight ? 'E8B859' : '000000',
          shadow: { type: 'outer', angle: 90, blur: 4, offset: 3, opacity: 0.35, color: '000000' }
        }
      }));

      slide.addText(runs, {
        x: 0.8,
        y: 1.8,
        w: 11.7,
        h: 3.8,
        valign: 'middle',
        align: 'center'
      });

    } else {
      // Topic / Impact / Reflection
      const textLength = item.runs.reduce((acc, r) => acc + (r.text || '').length, 0);
      let fontSize = 72;
      if (textLength < 40) fontSize = 84;
      else if (textLength > 90) fontSize = 56;

      const runs = item.runs.map(r => ({
        text: r.text,
        options: {
          fontFace: 'Bebas Neue',
          fontSize: fontSize,
          color: r.highlight ? 'E8B859' : '000000',
          shadow: { type: 'outer', angle: 90, blur: 4, offset: 3, opacity: 0.35, color: '000000' }
        }
      }));

      slide.addText(runs, {
        x: 0.8,
        y: 1.8,
        w: 11.7,
        h: 3.8,
        valign: 'middle',
        align: 'center'
      });
    }
  }

  const rawBuffer = await pptx.write({ outputType: 'nodebuffer' });
  try {
    const zip = await JSZip.loadAsync(rawBuffer);
    if (zip.file('ppt/theme/theme1.xml')) {
      let themeXml = await zip.file('ppt/theme/theme1.xml').async('text');
      themeXml = themeXml.replace(/<a:latin typeface="[^"]*"/g, '<a:latin typeface="Bahnschrift SemiBold Condensed"');
      zip.file('ppt/theme/theme1.xml', themeXml);
    }
    const fontPath = 'C:/Windows/Fonts/bahnschrift.ttf';
    if (fs.existsSync(fontPath)) {
      const fontBuf = fs.readFileSync(fontPath);
      zip.file('ppt/fonts/font1.fntdata', fontBuf);
      if (zip.file('[Content_Types].xml')) {
        let ct = await zip.file('[Content_Types].xml').async('text');
        if (!ct.includes('Extension="fntdata"')) {
          ct = ct.replace('</Types>', '<Default Extension="fntdata" ContentType="application/x-fontdata"/></Types>');
          zip.file('[Content_Types].xml', ct);
        }
      }
      if (zip.file('ppt/_rels/presentation.xml.rels')) {
        let rels = await zip.file('ppt/_rels/presentation.xml.rels').async('text');
        if (!rels.includes('rIdFontBahnschrift')) {
          const rel = '<Relationship Id="rIdFontBahnschrift" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/font1.fntdata"/>';
          rels = rels.replace('</Relationships>', rel + '</Relationships>');
          zip.file('ppt/_rels/presentation.xml.rels', rels);
        }
      }
      if (zip.file('ppt/presentation.xml')) {
        let pres = await zip.file('ppt/presentation.xml').async('text');
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
