# 🏛️ Central Multimídia Church

Plataforma unificada e modular de produção de mídia, projeção e apresentações para cultos e igrejas.

Reúne em uma única interface inteligente os principais módulos de apoio à equipe de multimídia:
1. ⚡ **Slide Killer**: Gerador automatizado de slides em PowerPoint (.pptx 16:9 Full HD) a partir de PDFs ou anotações de sermões com quebra inteligente de versículos e destaque tipográfico.
2. 📄 **PDF ➔ PPTX Direto (1 Página = 1 Slide)**: Conversor direto e fiel de qualquer arquivo PDF para PowerPoint (.pptx 16:9 Full HD) onde cada página do PDF vira exatamente uma página de slide em alta definição, sem alterar ou reformatar o conteúdo original (ideal para apresentações prontas do Canva, avisos e telões).
3. 🖼️ **Imagens / ZIP ➔ PPTX (Organizador Visual)**: Anexe fotos avulsas ou um arquivo .ZIP com dezenas de imagens, reorganize visualmente a ordem de cada slide (arrastando com o mouse ou usando botões de posição ⬅ / ➡) e exporte para PowerPoint (.pptx 16:9 Full HD) com ajuste de proporção e fundo personalizável.
4. 🎬 **Editor de Vídeo (OpenCut)**: Estúdio de edição de vídeo open-source completo estilo CapCut, com timeline multi-pistas, cortes instantâneos e exportação Full HD direto no navegador.

---

## ⚡ Módulos da Central

### 1. Slide Killer (Sermões & Telões)
- **100% Offline & Instantâneo**: Processa PDFs de sermões em milissegundos sem depender de internet ou créditos de API.
- **Divisão Inteligente de Versículos**: Quebra automática de passagens com múltiplos versículos (ex: *Mateus 6:19-21* se torna 3 slides individuais formatados).
- **Destaque de Palavras-Chave**: Identificação e destaque de termos fortes de fé em cor dourada (`#E8B859`).
- **Tipografia e Estilo Oficial**:
  - Versículos: `Bahnschrift SemiBold Condensed` com aspas tipográficas (`“ ... ”`).
  - Referências e Títulos: `Bebas Neue` em destaque dourado.
  - Formato: **16:9 Widescreen Full HD**.
- **Suporte Opcional a IA**: Copilot com Gemini AI para validação semântica profunda.

### 2. PDF ➔ PPTX Direto (1 Página = 1 Slide)
- **Conversão Fiel & Sem Alterações**: Transforma cada página de qualquer PDF em um slide independente no PowerPoint.
- **Renderização em Alta Resolução (Full HD)**: Preserva 100% do layout, gráficos, vetores, imagens e fontes originais do documento.
- **Pronto para Telões & Projeção**: Gere arquivos compatíveis com PowerPoint, Holyrics, ProPresenter, EasyWorship e sistemas de multimídia com 1 clique.
- **Opções Flexíveis de Formato**: Escolha entre Proporção Widescreen 16:9 (com fundo escuro elegante) ou Proporção Original do PDF.

### 3. Imagens / ZIP ➔ PPTX (Organizador Visual de Slides)
- **Upload Flexível**: Anexe imagens avulsas (`PNG`, `JPG`, `WEBP`, etc.) ou envie um arquivo `.ZIP` completo com dezenas de fotos.
- **Extração Automática de ZIPs**: Descompacta o arquivo ZIP instantaneamente no navegador preservando a ordem natural dos nomes.
- **Organização Visual da Ordem dos Slides**:
  - Arraste e solte (*Drag & Drop*) os cards para posicionar os slides na sequência exata que preferir.
  - Botões de ajuste fino `⬅` (Mover para trás) e `➡` (Mover para frente) em cada slide.
  - Ferramentas em lote: Ordenação alfabética natural (`A-Z`), inversão de ordem (`🔀 Inverter`) e exclusão individual de slides (`🗑️`).
- **Exportação para Telão**:
  - Formato Widescreen 16:9 Full HD ou 4:3.
  - Ajuste de imagem (*Contain* sem cortes com fundo escuro ou *Cover* 100% da tela).
  - Fundo customizável (Preto, Escuro Church ou Branco).
  - Download imediato do arquivo `.pptx`.

### 4. Editor de Vídeo (OpenCut Studio)
- **Alternativa Open-Source ao CapCut**: Interface profissional com timeline para edição ágil de reels, pregações, avisos e clipes de louvor.
- **Processamento no Cliente**: Roda direto no navegador com WebCodecs e WASM, sem marca d'água e sem filas de renderização.
- **Modo Tela Cheia & Foco**: Permite maximizar o editor para trabalhar com precisão milimétrica nos cortes.

---

## 📁 Estrutura do Projeto

```text
├── downloads/                     # Apresentações .pptx geradas
├── exemplos_pastor/               # Exemplos de PDFs e modelos de slides
├── public/                        # Interface Web do Hub Central Multimídia
│   ├── assets/
│   │   └── church_sermon_bg.png   # Imagem de fundo oficial 16:9
│   ├── app.js                     # Gerenciador de módulos e frontend
│   ├── index.html                 # Página principal do Hub
│   └── style.css                  # Estilos modernos Dark Neon Church
├── gerar_slides_direto.bat        # Atalho de 2 cliques para o gerador CLI
├── gerar_slides_direto.js         # Script CLI offline
├── iniciar_gerador.bat            # Atalho de 2 cliques para iniciar a Central
├── local_sermon_parser.js         # Parser local offline de versículos e textos
├── package.json                   # Metadados e dependências
├── README.md                      # Documentação oficial
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

### 3. Executando a Central Multimídia Church
Dê 2 cliques no arquivo **`iniciar_gerador.bat`** ou execute no terminal:
```bash
npm start
```
Acesse no navegador: **[http://localhost:3000](http://localhost:3000)**

### 4. Executando no Terminal (CLI - Slides Rápidos)
Para gerar a apresentação a partir de um PDF diretamente no terminal sem abrir o navegador:
```bash
node gerar_slides_direto.js "caminho/do/arquivo.pdf"
```

---

## 🌐 API REST

### `GET /api/health`
Retorna o status da Central e lista de módulos ativos.

### `POST /api/slides/upload-pdf`
Recebe um arquivo PDF (`multipart/form-data`) ou texto puro (`sermonText`) e retorna a lista de slides com link para download do `.pptx`.

### `POST /api/slides/rebuild`
Reconstrói o arquivo PowerPoint a partir do array de slides editado pelo usuário no app.
