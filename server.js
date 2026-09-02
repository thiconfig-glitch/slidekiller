require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { buildSermonPptx } = require('./sermon_slide_engine');
const { extractTextFromPdf, parseSermonTextOffline } = require('./local_sermon_parser');
const { parseSermonWithGemini } = require('./sermon_ai_parser');

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 50 * 1024 * 1024 } 
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Garantir diretório de downloads
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Servir arquivos estáticos (Frontend e Downloads)
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));
app.use('/downloads', express.static(downloadsDir));

// Rota de Saúde / Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Central Multimídia Church',
    version: '2.0.0',
    modules: ['slidekiller', 'video-editor'],
    timestamp: new Date().toISOString()
  });
});

/**
 * 1. Upload de PDF ou envio de texto direto para gerar slides
 */
app.post('/api/slides/upload-pdf', upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'bgImage', maxCount: 1 }
]), async (req, res) => {
  try {
    let sermonText = req.body.sermonText || '';
    const useAi = req.body.useAi === 'true' || req.body.useAi === true;
    const apiKey = req.body.apiKey || process.env.GEMINI_API_KEY;

    // Se arquivo PDF foi enviado, extrai o texto dele
    if (req.files && req.files.pdfFile && req.files.pdfFile[0]) {
      const pdfBuffer = req.files.pdfFile[0].buffer;
      const extracted = await extractTextFromPdf(pdfBuffer);
      sermonText = extracted || sermonText;
    }

    if (!sermonText || sermonText.trim().length === 0) {
      return res.status(400).json({ error: 'Nenhum texto ou arquivo PDF foi fornecido.' });
    }

    // Plano de fundo customizado ou padrão
    let bgPath = path.join(__dirname, 'public/assets/church_sermon_bg.png');
    if (req.files && req.files.bgImage && req.files.bgImage[0]) {
      const customBgName = `custom_bg_${Date.now()}.png`;
      const customBgPath = path.join(downloadsDir, customBgName);
      fs.writeFileSync(customBgPath, req.files.bgImage[0].buffer);
      bgPath = customBgPath;
    }

    let slides = [];

    if (useAi && apiKey) {
      console.log(`🤖 Processando via Inteligência Artificial Gemini... (${sermonText.length} caracteres)`);
      try {
        slides = await parseSermonWithGemini(sermonText, apiKey);
      } catch (aiErr) {
        console.warn('⚠️ Falha no parser de IA, utilizando fallback local offline:', aiErr.message);
        slides = parseSermonTextOffline(sermonText);
      }
    } else {
      console.log(`⚡ Processamento Instantâneo Local 100% Offline... (${sermonText.length} caracteres)`);
      slides = parseSermonTextOffline(sermonText);
    }

    const fileName = `SLIDES_SERMAO_${Date.now()}.pptx`;
    const filePath = path.join(downloadsDir, fileName);

    await buildSermonPptx(slides, bgPath, filePath);

    res.json({
      status: 'success',
      message: `Apresentação de culto gerada com sucesso! ${slides.length} slides prontos.`,
      fileName,
      downloadUrl: `/downloads/${fileName}`,
      slideCount: slides.length,
      slides
    });

  } catch (err) {
    console.error('❌ Erro na rota /api/slides/upload-pdf:', err);
    res.status(500).json({ error: err.message || 'Erro ao processar PDF do sermão.' });
  }
});

/**
 * 2. Reconstruir PPTX com alterações manuais feitas no editor visual
 */
app.post('/api/slides/rebuild', async (req, res) => {
  try {
    const { slides, selectedBg } = req.body;
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ error: 'Nenhum slide fornecido para reconstrução.' });
    }

    let bgPath = path.join(__dirname, 'public/assets/church_sermon_bg.png');
    if (selectedBg && fs.existsSync(path.join(__dirname, 'public', selectedBg))) {
      bgPath = path.join(__dirname, 'public', selectedBg);
    }

    const fileName = `SLIDES_EDITADOS_${Date.now()}.pptx`;
    const filePath = path.join(downloadsDir, fileName);

    await buildSermonPptx(slides, bgPath, filePath);

    res.json({
      status: 'success',
      message: 'Apresentação reconstruída com sucesso!',
      fileName,
      downloadUrl: `/downloads/${fileName}`,
      slideCount: slides.length
    });

  } catch (err) {
    console.error('❌ Erro ao reconstruir slides:', err);
    res.status(500).json({ error: err.message || 'Erro ao reconstruir slides.' });
  }
});

/**
 * 3. Listar templates/fundos disponíveis
 */
app.get('/api/slides/templates', (req, res) => {
  const assetsDir = path.join(__dirname, 'public/assets');
  const templates = [
    { id: 'church_default', name: 'Fundo Oficial da Igreja (Full HD)', url: '/assets/church_sermon_bg.png' }
  ];

  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    files.forEach(file => {
      if (file !== 'church_sermon_bg.png' && (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))) {
        templates.push({
          id: path.parse(file).name,
          name: path.parse(file).name.replace(/_/g, ' ').toUpperCase(),
          url: `/assets/${file}`
        });
      }
    });
  }

  res.json({ templates });
});

app.listen(PORT, () => {
  console.log('================================================================');
  console.log(`🏛️  CENTRAL MULTIMÍDIA CHURCH ONLINE NA PORTA ${PORT}`);
  console.log(`🌐 Acesse no navegador: http://localhost:${PORT}`);
  console.log('   • ⚡ Módulo 1: Slide Killer (PPTX 16:9 Full HD)');
  console.log('   • 🎬 Módulo 2: Editor de Vídeo (OpenCut Studio OSS)');
  console.log('================================================================');
});
