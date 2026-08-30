# 📖 Sermon Slide Generator (PDF → PPTX 16:9 Full HD)

Gerador automatizado de apresentações de slides em PowerPoint (.pptx) para sermões, cultos e projeções em telões de igreja a partir de arquivos PDF ou esboços de texto.

---

## ⚡ Principais Recursos

- **100% Offline & Instantâneo**: Processa PDFs de sermões em milissegundos sem depender de internet ou créditos de API.
- **Divisão Inteligente de Versículos**: Quebra automática de passagens com múltiplos versículos (ex: *Mateus 6:19-21* se torna 3 slides individuais formatados).
- **Destaque de Palavras-Chave**: Identificação e destaque de termos fortes de fé em cor dourada (`#E8B859`).
- **Tipografia e Estilo Oficial**:
  - Versículos: `Bahnschrift SemiBold Condensed` com aspas tipográficas (`“ ... ”`).
  - Referências e Títulos: `Bebas Neue` em destaque dourado.
  - Formato: **16:9 Widescreen Full HD**.
- **Interface Web Moderna**: Drag & drop de arquivos PDF, visualização de slides em cards e editor interativo para ajustes antes de baixar.
- **Suporte Opcional a IA**: Integração com Gemini API para estruturação semântica caso desejado.
- **Modo CLI Direto**: Arraste um arquivo PDF para cima de `gerar_slides_direto.bat` para gerar a apresentação imediatamente.

---

## 📁 Estrutura do Projeto

```text
├── downloads/                     # Apresentações .pptx geradas
├── exemplos_pastor/               # Exemplos de PDFs e modelos de slides
├── public/                        # Interface Web
│   ├── assets/
│   │   └── church_sermon_bg.png   # Imagem de fundo oficial 16:9
│   ├── app.js                     # Lógica do frontend
│   ├── index.html                 # Página principal
│   └── style.css                  # Estilos em tema escuro
├── gerar_slides_direto.bat        # Atalho de 2 cliques para o gerador CLI
├── gerar_slides_direto.js         # Script CLI offline
├── iniciar_gerador.bat            # Atalho de 2 cliques para iniciar o servidor web
├── local_sermon_parser.js         # Parser local offline de versículos e textos
├── package.json                   # Dependências do projeto
├── README.md                      # Documentação
├── sermon_ai_parser.js            # Parser opcional via Gemini AI
├── sermon_slide_engine.js         # Motor de montagem PPTX (PptxGenJS)
└── server.js                      # Servidor Express API REST
```

---

## 🚀 Como Executar

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)

### 2. Instalação
```bash
npm install
```

### 3. Executando a Interface Web
Dê 2 cliques no arquivo **`iniciar_gerador.bat`** ou execute no terminal:
```bash
npm start
```
Acesse no navegador: **[http://localhost:3000](http://localhost:3000)**

### 4. Executando no Terminal (CLI)
Para gerar a apresentação a partir de um PDF diretamente no terminal:
```bash
node gerar_slides_direto.js "caminho/do/arquivo.pdf"
```

---

## 🔌 API REST (Para Integração Web / Android)

### `POST /api/slides/upload-pdf`
Recebe um arquivo PDF (`multipart/form-data`) ou texto puro (`sermonText`) e retorna a lista de slides com link para download do `.pptx`.

**Campos aceitos (FormData):**
- `pdfFile`: Arquivo PDF (binário).
- `sermonText`: Texto do sermão (opcional se enviar PDF).
- `useAi`: `true` ou `false` (padrão: `false` para processamento 100% offline).

**Exemplo de Resposta:**
```json
{
  "status": "success",
  "message": "Apresentação de culto gerada com sucesso! 22 slides prontos.",
  "fileName": "SLIDES_SERMAO_1788105329582.pptx",
  "downloadUrl": "/downloads/SLIDES_SERMAO_1788105329582.pptx",
  "slideCount": 22,
  "slides": [
    {
      "type": "verse",
      "reference": "Mateus 6:19",
      "runs": [
        { "text": "“Não ajunteis tesouros na terra, onde a traça e a ferrugem tudo consomem, e onde ", "highlight": false },
        { "text": "os ladrões minam e roubam;”", "highlight": true }
      ]
    }
  ]
}
```

### `POST /api/slides/rebuild`
Reconstrói o arquivo PowerPoint a partir do array de slides editado pelo usuário no app.

---

## 📦 Como Subir em um Novo Repositório no GitHub

1. Inicialize o repositório local e faça o primeiro commit:
```bash
git init
git add .
git commit -m "feat: Gerador de slides de sermão a partir de PDFs (16:9 Full HD)"
```

2. Crie um **novo repositório vazio** na sua conta do GitHub (ex: `sermon-slide-generator`).

3. Vincule a branch principal e envie:
```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_NOVO_REPOSITORIO.git
git push -u origin main
```
