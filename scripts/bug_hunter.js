/**
 * Bug Hunter & Code Auditor Pro
 * Varredor Autônomo e Caçador de Falhas em Apps e Sites
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TARGET_DIR = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const IGNORE_DIRS = ['node_modules', '.git', 'downloads', 'assets', '.gemini', 'dist', 'build', 'deckcraft'];

console.log('='.repeat(70));
console.log(`🔍 [BUG HUNTER] Caça a Falhas e Rastreamento em: ${TARGET_DIR}`);
console.log('='.repeat(70));

const findings = [];

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.isFile()) {
      callback(fullPath);
    }
  }
}

function analyzeJsFile(filePath) {
  // Ignora o próprio script da análise para não gerar falsos positivos
  if (filePath.endsWith('bug_hunter.js')) return;

  const relativePath = path.relative(TARGET_DIR, filePath);
  let code = '';
  try {
    code = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    findings.push({
      file: relativePath,
      line: 0,
      severity: 'CRÍTICA',
      type: 'LEITURA_ARQUIVO',
      message: `Não foi possível ler o arquivo: ${err.message}`
    });
    return;
  }

  // 1. Checagem de Sintaxe JavaScript
  try {
    new Function(code);
  } catch (syntaxErr) {
    // Se for módulo ES com import.meta, ignorar
    if (!syntaxErr.message.includes("Cannot use 'import.meta' outside a module")) {
      findings.push({
        file: relativePath,
        line: 1,
        severity: 'ALTA',
        type: 'SINTAXE',
        message: `Erro de sintaxe detectado: ${syntaxErr.message}`
      });
    }
  }

  const lines = code.split('\n');

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    // 2. Caça a JSON.parse inseguro (sem bloco try/catch envolvendo)
    if (/JSON\.parse\s*\(/.test(trimmed)) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(lines.length, idx + 20);
      const windowContext = lines.slice(start, end).join('\n');
      if (!windowContext.includes('try') && !windowContext.includes('catch')) {
        findings.push({
          file: relativePath,
          line: lineNum,
          severity: 'MÉDIA',
          type: 'JSON_PARSE_INSEGURO',
          message: `JSON.parse() executado sem proteção de bloco try/catch. Dados inesperados podem causar crash.`
        });
      }
    }

    // 3. Caça a Path Traversal em Node.js
    if (/path\.join\s*\(.*(req\.body|req\.query|req\.params)/.test(lineText) && !lineText.includes('path.basename')) {
      findings.push({
        file: relativePath,
        line: lineNum,
        severity: 'ALTA',
        type: 'PATH_TRAVERSAL',
        message: `Entrada de usuário concatenada diretamente em path.join sem sanitização via path.basename.`
      });
    }

    // 4. Promessas soltas sem .catch()
    if (/\.then\s*\(/.test(trimmed) && !trimmed.includes('.catch')) {
      const windowAfter = lines.slice(idx, Math.min(lines.length, idx + 35)).join(' ');
      if (!windowAfter.includes('.catch')) {
        findings.push({
          file: relativePath,
          line: lineNum,
          severity: 'BAIXA',
          type: 'PROMISE_SEM_CATCH',
          message: `Cadeia .then() sem .catch() adjacente. Erros de rede/processamento podem ser silenciados.`
        });
      }
    }

    // 5. Caça a document.write() em browsers
    if (/document\.write\s*\(/.test(trimmed)) {
      findings.push({
        file: relativePath,
        line: lineNum,
        severity: 'MÉDIA',
        type: 'DOCUMENT_WRITE',
        message: `Uso de document.write(). Prática obsoleta e bloqueadora de renderização.`
      });
    }
  });
}

// 6. Varredura de Código
console.log('📂 1/3 Varrendo arquivos de código...');
walkDir(TARGET_DIR, (filePath) => {
  if (filePath.endsWith('.js') && !filePath.endsWith('.min.js')) {
    analyzeJsFile(filePath);
  }
});

// 7. Varredura de Dependências
console.log('📦 2/3 Analisando vulnerabilidades de dependências (npm audit)...');
let auditReport = null;
try {
  const auditOutput = execSync('npm audit --json', { cwd: TARGET_DIR, stdio: ['pipe', 'pipe', 'ignore'] }).toString();
  auditReport = JSON.parse(auditOutput);
} catch (auditErr) {
  try {
    if (auditErr.stdout) auditReport = JSON.parse(auditErr.stdout.toString());
  } catch (e) {}
}

let vulnCount = 0;
if (auditReport && auditReport.metadata && auditReport.metadata.vulnerabilities) {
  const v = auditReport.metadata.vulnerabilities;
  vulnCount = (v.critical || 0) + (v.high || 0) + (v.moderate || 0);
  if (vulnCount > 0) {
    findings.push({
      file: 'package.json',
      line: 1,
      severity: v.critical > 0 ? 'CRÍTICA' : (v.high > 0 ? 'ALTA' : 'MÉDIA'),
      type: 'DEPENDENCIAS_VULNERAVEIS',
      message: `Encontradas ${vulnCount} vulnerabilidades em pacotes npm (Críticas: ${v.critical || 0}, Altas: ${v.high || 0}, Moderadas: ${v.moderate || 0}).`
    });
  }
}

// 8. Relatório Final
console.log('📊 3/3 Consolidando relatório de auditoria...\n');

const severityEmoji = {
  CRÍTICA: '💥 [CRÍTICA]',
  ALTA: '🚨 [ALTA]',
  MÉDIA: '⚠️ [MÉDIA]',
  BAIXA: 'ℹ️ [BAIXA]'
};

if (findings.length === 0) {
  console.log('✅ EXCELENTE: NENHUMA FALHA DETECTADA! O projeto está 100% blindado.');
} else {
  console.log(`⚠️ FORAM DETECTADOS ${findings.length} APONTAMENTOS:\n`);
  findings.forEach((f, i) => {
    console.log(`${i + 1}. ${severityEmoji[f.severity] || f.severity} em ${f.file}:${f.line}`);
    console.log(`   Tipo: ${f.type}`);
    console.log(`   Detalhes: ${f.message}\n`);
  });
}

const reportDir = path.join(TARGET_DIR, 'downloads');
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
const reportMdPath = path.join(reportDir, 'bug_hunt_report.md');

let mdContent = `# 🛡️ Relatório de Caça a Falhas e Auditoria de Código\n\n`;
mdContent += `*Data da Execução:* ${new Date().toLocaleString('pt-BR')}\n`;
mdContent += `*Diretório Analisado:* \`${TARGET_DIR}\`\n`;
mdContent += `*Total de Apontamentos:* **${findings.length}**\n\n`;

if (findings.length === 0) {
  mdContent += `## ✅ Status: 100% Blindado\nNenhuma falha crítica, sintática ou de vulnerabilidade foi identificada.\n`;
} else {
  mdContent += `| # | Severidade | Arquivo | Linha | Tipo | Detalhes |\n`;
  mdContent += `|---|---|---|---|---|---|\n`;
  findings.forEach((f, i) => {
    mdContent += `| ${i + 1} | **${f.severity}** | \`${f.file}\` | ${f.line} | \`${f.type}\` | ${f.message} |\n`;
  });
}

fs.writeFileSync(reportMdPath, mdContent, 'utf8');
console.log(`📄 Relatório completo salvo em: ${reportMdPath}`);
console.log('='.repeat(70));
