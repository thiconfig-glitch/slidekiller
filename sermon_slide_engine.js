const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

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

    // 1. Background image (16:9 full slide cover)
    if (bgImagePath && fs.existsSync(bgImagePath)) {
      slide.background = { path: bgImagePath };
    } else {
      slide.background = { color: 'FFFFFF' };
    }

    const type = item.type || 'verse';

    if (type === 'verse') {
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

  await pptx.writeFile({ fileName: outputFilePath });
  return {
    slideCount: slidesData.length,
    outputFilePath
  };
}

module.exports = { buildSermonPptx };
