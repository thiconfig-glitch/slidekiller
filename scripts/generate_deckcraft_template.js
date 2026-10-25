const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const JSZip = require('jszip');

async function createDeckcraftTemplate() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  // Slide 1 - Capa / Título Oficial
  const slide = pptx.addSlide();
  slide.background = { color: '18181B' };

  slide.addText('TÍTULO DA MENSAGEM', {
    x: 1.0,
    y: 1.8,
    w: 11.333,
    h: 1.8,
    fontFace: 'Bahnschrift SemiBold Condensed',
    fontSize: 56,
    color: 'E8B859',
    bold: true,
    align: 'center',
    valign: 'middle'
  });

  slide.addText('Clique duas vezes para editar o subtítulo', {
    x: 1.0,
    y: 3.8,
    w: 11.333,
    h: 1.0,
    fontFace: 'Bahnschrift SemiBold Condensed',
    fontSize: 28,
    color: 'A1A1AA',
    align: 'center',
    valign: 'top'
  });

  const rawBuffer = await pptx.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(rawBuffer);

  // 1. Atualizar ppt/theme/theme1.xml para definir Bahnschrift SemiBold Condensed como fonte padrão
  if (zip.file('ppt/theme/theme1.xml')) {
    let themeXml = await zip.file('ppt/theme/theme1.xml').async('text');
    themeXml = themeXml.replace(/<a:latin typeface="[^"]*"/g, '<a:latin typeface="Bahnschrift SemiBold Condensed"');
    zip.file('ppt/theme/theme1.xml', themeXml);
  }

  // 2. Embutir bahnschrift.ttf
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

  const finalBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync('deckcraft/template.pptx', finalBuf);
  fs.writeFileSync('public/deckcraft/template.pptx', finalBuf);
  console.log('Template criado com sucesso em deckcraft/template.pptx e public/deckcraft/template.pptx:', finalBuf.length, 'bytes');
}

createDeckcraftTemplate().catch(console.error);
