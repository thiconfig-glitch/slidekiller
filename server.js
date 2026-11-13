require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const multer = require('multer');
const { buildSermonPptx } = require('./sermon_slide_engine');
const { extractTextFromPdf, parseSermonTextOffline, parseTeamsDirectionText } = require('./local_sermon_parser');
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

function getDefaultBgPath() {
  const jpgPath = path.join(__dirname, 'public/assets/church_sermon_bg.jpg');
  if (fs.existsSync(jpgPath)) return jpgPath;
  return path.join(__dirname, 'public/assets/church_sermon_bg.png');
}

function getThemeBgPath(themeOrPath) {
  if (themeOrPath && typeof themeOrPath === 'string') {
    if (themeOrPath.includes('ts_theme_bg') || themeOrPath === 'theme_ts' || themeOrPath === 'ts') {
      const tsPath = path.join(__dirname, 'public/assets/ts_theme_bg.png');
      if (fs.existsSync(tsPath)) return tsPath;
    }
    const sanitized = path.basename(themeOrPath);
    const candidatePublic = path.join(__dirname, 'public/assets', sanitized);
    if (fs.existsSync(candidatePublic)) return candidatePublic;
  }
  return getDefaultBgPath();
}

function getSafeImageExt(originalname) {
  const ext = path.extname(String(originalname || '')).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(ext) ? ext : '.png';
}

// Limpeza automática periódica de arquivos temporários (> 24h)
function cleanupOldDownloads() {
  try {
    if (!fs.existsSync(downloadsDir)) return;
    const now = Date.now();
    const maxAgeMs = 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(downloadsDir);
    for (const f of files) {
      if (f === '.gitkeep' || f === 'active_tasks.json' || f === 'system_errors.log') continue;
      const full = path.join(downloadsDir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isFile() && (now - stat.mtimeMs > maxAgeMs)) {
          fs.unlinkSync(full);
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('⚠️ Falha na limpeza de downloads:', err.message);
  }
}
setInterval(cleanupOldDownloads, 60 * 60 * 1000);
cleanupOldDownloads();

// ==========================================
// RASTREAMENTO GLOBAL DE FALHAS E TELEMETRIA
// ==========================================
const errorLogPath = path.join(downloadsDir, 'system_errors.log');
const MAX_ERROR_LOG_BYTES = 1024 * 1024; // 1 MB

function logSystemError(type, err, extra = {}) {
  const timestamp = new Date().toISOString();
  const message = err && err.message ? err.message : String(err || 'Erro desconhecido');
  const stack = err && err.stack ? err.stack : 'Sem stack trace';
  const entry = `[${timestamp}] [${type.toUpperCase()}] ${message}\nContext: ${JSON.stringify(extra)}\nStack: ${stack}\n${'='.repeat(70)}\n`;
  
  console.error(`🚨 [TELEMETRIA] ${type}:`, message);
  try {
    if (fs.existsSync(errorLogPath)) {
      const stat = fs.statSync(errorLogPath);
      if (stat.size >= MAX_ERROR_LOG_BYTES) {
        const prev = fs.readFileSync(errorLogPath, 'utf8');
        fs.writeFileSync(errorLogPath, prev.slice(-Math.floor(MAX_ERROR_LOG_BYTES / 2)), 'utf8');
      }
    }
    fs.appendFileSync(errorLogPath, entry, 'utf8');
  } catch (logErr) {
    console.error('Falha ao gravar system_errors.log:', logErr.message);
  }
}

process.on('uncaughtException', (err) => {
  logSystemError('uncaughtException', err);
});

process.on('unhandledRejection', (reason) => {
  logSystemError('unhandledRejection', reason);
});

// Servir arquivos estáticos (Frontend e Downloads)
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res, filePath) => {
    if (filePath && filePath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));
app.use('/downloads', express.static(downloadsDir));

// Rota de download direto do APK Android
app.get('/slidekiller.apk', (req, res) => {
  const apkPath = path.join(__dirname, 'slidekiller.apk');
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, 'slidekiller.apk');
  } else {
    res.status(404).send('APK não encontrado.');
  }
});

// Rota de Saúde / Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Central Multimídia Church',
    version: '2.12.13',
    modules: ['slidekiller', 'pdf-to-pptx', 'images-to-pptx'],
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// API DE TAREFAS SINCRONIZADAS (CELULAR ⇄ PC)
// ==========================================
const tasksFilePath = path.join(downloadsDir, 'active_tasks.json');

function getStoredTasks() {
  try {
    if (fs.existsSync(tasksFilePath)) {
      const data = fs.readFileSync(tasksFilePath, 'utf8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('⚠️ Erro ao ler tarefas salvas:', err.message);
  }
  return [];
}

function saveStoredTasks(tasks) {
  try {
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks.slice(0, 3), null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('❌ Erro ao persistir tarefas:', err.message);
    return false;
  }
}

app.get('/api/tasks', (req, res) => {
  res.json({
    status: 'success',
    tasks: getStoredTasks()
  });
});

app.post('/api/tasks', (req, res) => {
  try {
    const newTask = req.body;
    if (!newTask || !newTask.id) {
      return res.status(400).json({ error: 'Dados da tarefa inválidos ou id ausente.' });
    }
    let tasks = getStoredTasks();
    const existingIndex = tasks.findIndex(t => t.id === newTask.id);
    if (existingIndex >= 0) {
      tasks[existingIndex] = { ...tasks[existingIndex], ...newTask, updatedAt: new Date().toISOString() };
    } else {
      tasks.unshift(newTask);
    }
    tasks = tasks.slice(0, 3);
    saveStoredTasks(tasks);
    res.json({ status: 'success', tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    let tasks = getStoredTasks();
    tasks = tasks.filter(t => t.id !== id);
    saveStoredTasks(tasks);
    res.json({ status: 'success', tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

    // Plano de fundo customizado ou padrão (Bíblia ou TS)
    let bgPath = getThemeBgPath(req.body.selectedBg);
    if (req.files && req.files.bgImage && req.files.bgImage[0]) {
      const ext = getSafeImageExt(req.files.bgImage[0].originalname);
      const customBgName = `custom_bg_${Date.now()}${ext}`;
      const customBgPath = path.join(downloadsDir, customBgName);
      fs.writeFileSync(customBgPath, req.files.bgImage[0].buffer);
      bgPath = customBgPath;
    }

    const textMode = req.body.textMode || 'standard';
    const teamsOption = req.body.teamsOption || 'only-verses';

    let slides = [];

    if (textMode === 'teams') {
      console.log(`💬 Processando Formato Direção formatada previamente (${teamsOption})... (${sermonText.length} caracteres)`);
      slides = parseTeamsDirectionText(sermonText, { onlyVerses: teamsOption !== 'with-explanations' });
    } else if (useAi && apiKey) {
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

    const fileToken = crypto.randomBytes(6).toString('hex');
    const fileName = `SLIDES_SERMAO_${Date.now()}_${fileToken}.pptx`;
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

    let bgPath = getDefaultBgPath();
    if (selectedBg && typeof selectedBg === 'string') {
      const sanitizedName = path.basename(selectedBg);
      if (selectedBg.startsWith('/downloads/')) {
        const potentialPath = path.join(downloadsDir, sanitizedName);
        if (fs.existsSync(potentialPath)) bgPath = potentialPath;
      } else {
        bgPath = getThemeBgPath(selectedBg);
      }
    }

    const fileToken = crypto.randomBytes(6).toString('hex');
    const fileName = `SLIDES_EDITADOS_${Date.now()}_${fileToken}.pptx`;
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
  const defaultUrl = fs.existsSync(path.join(assetsDir, 'church_sermon_bg.jpg'))
    ? '/assets/church_sermon_bg.jpg'
    : '/assets/church_sermon_bg.png';
  const templates = [
    { id: 'church_default', name: '📖 Fundo Bíblia (Padrão)', url: defaultUrl }
  ];

  const tsPath = path.join(assetsDir, 'ts_theme_bg.png');
  if (fs.existsSync(tsPath)) {
    templates.push({ id: 'theme_ts', name: '✨ Fundo TS (Oficial 4K)', url: '/assets/ts_theme_bg.png' });
  }

  const ignoredAssets = new Set(['church_sermon_bg.jpg', 'church_sermon_bg.png', 'ts_theme_bg.png', 'logo_app_icon.png']);
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    files.forEach(file => {
      if (!ignoredAssets.has(file) && (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.webp'))) {
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

/**
 * 4. Upload de imagem de fundo customizada
 */
app.post('/api/slides/upload-bg', upload.single('bgImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem de fundo enviada.' });
    }
    const ext = getSafeImageExt(req.file.originalname);
    const customBgName = `custom_bg_${Date.now()}${ext}`;
    const customBgPath = path.join(downloadsDir, customBgName);
    fs.writeFileSync(customBgPath, req.file.buffer);
    res.json({
      status: 'success',
      url: `/downloads/${customBgName}`,
      path: customBgPath,
      fileName: customBgName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ROTAS DE TELEMETRIA E RASTREAMENTO DE ERROS
// ==========================================
app.post('/api/telemetry/error', (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { errors, sessionId, timestamp } = body;
    if (Array.isArray(errors)) {
      errors.slice(0, 20).forEach(errItem => {
        if (!errItem || typeof errItem !== 'object') return;
        const rawType = String(errItem.type || 'error').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'error';
        logSystemError(`frontend_${rawType}`, new Error(String(errItem.message || 'Erro de interface').slice(0, 500)), {
          sessionId: String(sessionId || '').slice(0, 80),
          clientTime: String(timestamp || '').slice(0, 40),
          source: String(errItem.source || '').slice(0, 300),
          lineno: Number(errItem.lineno) || 0,
          colno: Number(errItem.colno) || 0,
          url: String(errItem.url || '').slice(0, 300),
          userAgent: String(errItem.userAgent || '').slice(0, 200),
          stack: errItem.stack ? String(errItem.stack).slice(0, 1500) : null,
          context: errItem.context && typeof errItem.context === 'object' ? errItem.context : undefined
        });
      });
    } else if (body && body.message) {
      logSystemError('frontend_single_error', new Error(String(body.message).slice(0, 500)), {
        sessionId: String(sessionId || '').slice(0, 80)
      });
    }
    res.json({ status: 'ok', received: true });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao processar telemetria' });
  }
});

app.get('/api/telemetry/logs', (req, res) => {
  try {
    if (!fs.existsSync(errorLogPath)) {
      return res.json({ logs: 'Nenhum erro registrado até o momento.', entries: [] });
    }
    const content = fs.readFileSync(errorLogPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const lastLines = lines.slice(-100).join('\n');
    res.json({
      status: 'success',
      totalBytes: fs.statSync(errorLogPath).size,
      recentLogs: lastLines
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware Central de Erros do Express
app.use((err, req, res, next) => {
  logSystemError('express_unhandled', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    status: 'error',
    error: err.message || 'Erro interno no servidor.',
    timestamp: new Date().toISOString()
  });
});

function getLocalNetworkIp() {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (e) {}
  return null;
}

app.listen(PORT, () => {
  const localIp = getLocalNetworkIp();
  console.log('================================================================');
  console.log(`🏛️  CENTRAL MULTIMÍDIA CHURCH ONLINE NA PORTA ${PORT}`);
  console.log(`🌐 No Computador: http://localhost:${PORT}`);
  if (localIp) {
    console.log(`📱 No Celular (mesmo Wi-Fi): http://${localIp}:${PORT}`);
  }
  console.log('   • ⚡ Módulo 1: Slide Killer (PPTX 16:9 Full HD)');
  console.log('   • 📄 Módulo 2: PDF ⇄ PPTX / ZIP / Novo PDF');
  console.log('   • 🖼️ Módulo 3: Imagens / ZIP ➔ PPTX');
  console.log('   • ✨ Editor Interativo & Melhoria com IA integrado');
  console.log('   • 📌 Tarefas Sincronizadas (Celular ⇄ PC ativado)');
  console.log('================================================================');
});
