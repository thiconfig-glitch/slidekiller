const fs = require('fs');
const path = require('path');
const { buildSermonPptx } = require('./sermon_slide_engine');

async function testEngine() {
  console.log('🧪 Iniciando teste do motor de slides de sermão...');

  const sampleSlides = [
    {
      type: 'verse',
      reference: 'Mateus 6:19',
      runs: [
        { text: '“Não ajunteis tesouros na terra, onde a traça e a ferrugem tudo consomem, e onde ', highlight: false },
        { text: 'os ladrões minam e roubam;”', highlight: true }
      ]
    },
    {
      type: 'question_short',
      runs: [
        { text: 'E Jairo?', highlight: false }
      ]
    },
    {
      type: 'topic',
      runs: [
        { text: 'NÃO DEIXE A ANSIEDADE ROUBAR A CONFIANÇA:', highlight: false }
      ]
    }
  ];

  const bgPath = path.join(__dirname, 'public/assets/church_sermon_bg.png');
  const outPath = path.join(__dirname, 'downloads/teste_sermao.pptx');

  if (!fs.existsSync(path.dirname(outPath))) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
  }

  const res = await buildSermonPptx(sampleSlides, bgPath, outPath);
  console.log('✅ buildSermonPptx executado com sucesso:', res);
  
  if (fs.existsSync(outPath)) {
    const stats = fs.statSync(outPath);
    console.log(`📦 Arquivo PPTX gerado: ${outPath} (${stats.size} bytes)`);
  } else {
    throw new Error('Arquivo não foi criado!');
  }
}

testEngine().catch(err => {
  console.error('❌ Erro no teste:', err);
  process.exit(1);
});
