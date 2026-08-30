const fs = require('fs');
const path = require('path');
const { extractTextFromPdf, parseSermonTextOffline } = require('./local_sermon_parser');
const { buildSermonPptx } = require('./sermon_slide_engine');

async function main() {
  const args = process.argv.slice(2);
  let pdfPath = args[0];

  // If no file passed as argument, search in 'exemplos_pastor' or prompt
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    const defaultFolder = path.join(__dirname, 'exemplos_pastor');
    if (fs.existsSync(defaultFolder)) {
      const files = fs.readdirSync(defaultFolder).filter(f => f.toLowerCase().endsWith('.pdf'));
      if (files.length > 0) {
        pdfPath = path.join(defaultFolder, files[0]);
      }
    }
  }

  if (!pdfPath || !fs.existsSync(pdfPath)) {
    console.log('================================================================');
    console.log('📖 GERADOR INSTANTÂNEO DE SLIDES DE SERMÃO (100% OFFLINE)');
    console.log('================================================================');
    console.log('Como usar:');
    console.log('1. Arraste qualquer arquivo .pdf do pastor por cima deste script.');
    console.log('2. Ou coloque o arquivo .pdf na pasta "exemplos_pastor".');
    console.log('================================================================');
    process.exit(1);
  }

  console.log('================================================================');
  console.log('⚡ GERADOR LOCAL DE SLIDES DE SERMÃO (100% OFFLINE / INSTANTÂNEO)');
  console.log('================================================================');
  console.log(`📄 Arquivo de entrada: ${pdfPath}`);

  const start = Date.now();
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log('⏳ Extraindo texto do PDF...');
  const text = await extractTextFromPdf(pdfBuffer);

  console.log('🔍 Analisando versículos e aplicando regras da igreja...');
  const slides = parseSermonTextOffline(text);
  console.log(`✅ ${slides.length} slides estruturados com sucesso!`);

  const bgPath = path.join(__dirname, 'public/assets/church_sermon_bg.png');
  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const outName = `SLIDES_${baseName}_${Date.now()}.pptx`;
  const downloadsDir = path.join(__dirname, 'downloads');

  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
  const outPath = path.join(downloadsDir, outName);

  console.log('🎨 Montando arquivo PowerPoint (.pptx) em 16:9 Full HD...');
  await buildSermonPptx(slides, bgPath, outPath);

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log('================================================================');
  console.log(`🎉 CONCLUÍDO EM ${duration} SEGUNDOS!`);
  console.log(`📂 Arquivo pronto salvo em:\n${outPath}`);
  console.log('================================================================');
}

main().catch(err => {
  console.error('❌ Erro durante a geração:', err.message);
  process.exit(1);
});
