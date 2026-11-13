const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { parseSermonTextOffline } = require('./local_sermon_parser.js');
const { buildSermonPptx } = require('./sermon_slide_engine.js');

async function runCinzelTest() {
  console.log('🏛️ Iniciando Teste de Validação do Novo Tema Nobre Cinzel 4K...');
  
  const sermonPdfPath = 'C:/Projetos/slidekiller_private_backup/novosexemplos/Só os nascidos de novo têm parte na herança.pdf';
  if (!fs.existsSync(sermonPdfPath)) {
    throw new Error('PDF de sermão exemplo não encontrado: ' + sermonPdfPath);
  }
  
  const pdfBuffer = fs.readFileSync(sermonPdfPath);
  const pdfData = await pdf(pdfBuffer);
  console.log(`📄 PDF carregado com sucesso (${pdfData.text.length} caracteres, ${pdfData.numpages} páginas).`);
  
  const slides = parseSermonTextOffline(pdfData.text);
  console.log(`📊 Total de slides gerados pelo parser: ${slides.length}`);
  
  const bgPath = path.join(__dirname, 'assets', 'cinzel_theme_bg.png');
  const outPptxPath = path.join(__dirname, 'downloads', 'Sermon_Nobre_Cinzel_Oficial.pptx');
  
  const result = await buildSermonPptx(slides, bgPath, outPptxPath);
  console.log('✅ Apresentação gerada com sucesso:', result);
  
  const stat = fs.statSync(outPptxPath);
  console.log(`📦 Tamanho do PPTX gerado: ${(stat.size / (1024 * 1024)).toFixed(2)} MB (${stat.size} bytes)`);
  console.log('🎉 Teste do Tema Nobre Cinzel concluído com 100% de sucesso!');
}

runCinzelTest().catch(err => {
  console.error('❌ Falha no teste do tema Cinzel:', err);
  process.exit(1);
});
