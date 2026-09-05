document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // NAVEGAÇÃO DE MÓDULOS (CENTRAL MULTIMÍDIA)
  // ==========================================
  const navModuleBtns = document.querySelectorAll('.nav-module-btn');
  const moduleViews = {
    'slidekiller': document.getElementById('view-slidekiller'),
    'pdf-to-pptx': document.getElementById('view-pdf-to-pptx'),
    'video-editor': document.getElementById('view-video-editor')
  };
  const moduleActions = {
    'slidekiller': document.getElementById('actions-slidekiller'),
    'pdf-to-pptx': document.getElementById('actions-pdf-to-pptx'),
    'video-editor': document.getElementById('actions-video-editor')
  };

  function switchModule(targetModule) {
    if (!targetModule || !moduleViews[targetModule]) return;

    // Atualiza botões da navegação
    navModuleBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.module === targetModule);
    });

    // Alterna visualização dos módulos
    Object.keys(moduleViews).forEach(key => {
      if (moduleViews[key]) {
        moduleViews[key].classList.toggle('active', key === targetModule);
      }
      if (moduleActions[key]) {
        moduleActions[key].style.display = (key === targetModule) ? 'flex' : 'none';
      }
    });
  }

  navModuleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetModule = btn.dataset.module;
      switchModule(targetModule);
    });
  });

  // ==========================================
  // MÓDULO 2: EDITOR DE VÍDEO (OPENCUT)
  // ==========================================
  const opencutIframe = document.getElementById('opencut-iframe');
  const iframeLoading = document.getElementById('iframe-loading');
  const btnReloadVideo = document.getElementById('btn-reload-video');
  const btnVideoFullscreen = document.getElementById('btn-video-fullscreen');
  const btnExpandCanvas = document.getElementById('btn-expand-canvas');
  const videoContainer = document.getElementById('video-container');

  if (opencutIframe) {
    opencutIframe.addEventListener('load', () => {
      if (iframeLoading) iframeLoading.classList.add('hidden');
    });

    // Fallback de segurança para esconder o loading após 4s
    setTimeout(() => {
      if (iframeLoading) iframeLoading.classList.add('hidden');
    }, 4000);
  }

  if (btnReloadVideo && opencutIframe) {
    btnReloadVideo.addEventListener('click', () => {
      if (iframeLoading) iframeLoading.classList.remove('hidden');
      opencutIframe.src = opencutIframe.src;
    });
  }

  function toggleVideoFullscreen() {
    if (!videoContainer) return;
    videoContainer.classList.toggle('fullscreen-focus');
    const isFull = videoContainer.classList.contains('fullscreen-focus');
    if (btnVideoFullscreen) {
      btnVideoFullscreen.innerHTML = isFull ? '<span>✕</span> Fechar Foco' : '<span>⛶</span> Tela Cheia';
    }
    if (btnExpandCanvas) {
      btnExpandCanvas.innerHTML = isFull ? '✕ Fechar' : '⛶ Maximizar';
    }
  }

  if (btnVideoFullscreen) btnVideoFullscreen.addEventListener('click', toggleVideoFullscreen);
  if (btnExpandCanvas) btnExpandCanvas.addEventListener('click', toggleVideoFullscreen);

  // Alternância entre tela de boas-vindas da igreja e editor ativo
  const videoWelcomeScreen = document.getElementById('video-welcome-screen');
  const btnBackToVideoWelcome = document.getElementById('btn-back-to-video-welcome');

  window.openPublicVideoEditor = function(preset) {
    if (videoWelcomeScreen) videoWelcomeScreen.style.display = 'none';
    if (videoContainer) videoContainer.style.display = 'flex';
  };

  window.closePublicVideoEditor = function() {
    if (videoContainer) videoContainer.style.display = 'none';
    if (videoWelcomeScreen) videoWelcomeScreen.style.display = 'flex';
  };

  if (btnBackToVideoWelcome) {
    btnBackToVideoWelcome.addEventListener('click', window.closePublicVideoEditor);
  }

  // Tecla ESC para sair do modo foco no vídeo
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoContainer && videoContainer.classList.contains('fullscreen-focus')) {
      toggleVideoFullscreen();
    }
  });

  // ==========================================
  // MÓDULO 1: SLIDE KILLER
  // ==========================================
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const dropzone = document.getElementById('dropzone');
  const pdfFileInput = document.getElementById('pdf-file-input');
  const selectedFileInfo = document.getElementById('selected-file-info');
  const fileNameDisplay = document.getElementById('file-name-display');
  const btnClearFile = document.getElementById('btn-clear-file');
  const sermonTextInput = document.getElementById('sermon-text-input');
  const templateSelect = document.getElementById('template-select');
  const checkUseAi = document.getElementById('check-use-ai');
  const btnGenerate = document.getElementById('btn-generate');
  
  const inputSection = document.getElementById('input-section');
  const resultsSection = document.getElementById('results-section');
  const slidesGrid = document.getElementById('slides-grid');
  const slideCountBadge = document.getElementById('slide-count-badge');
  const btnNewPresentation = document.getElementById('btn-new-presentation');
  const btnDownloadTop = document.getElementById('btn-download-top');
  const btnDownloadMain = document.getElementById('btn-download-main');
  const btnRebuild = document.getElementById('btn-rebuild');
  const btnAddSlide = document.getElementById('btn-add-slide');
  const toast = document.getElementById('toast');

  let currentFile = null;
  let currentSlides = [];
  let currentDownloadUrl = null;

  // Tabs internas do Slide Killer
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // Dropzone events
  if (dropzone) {
    dropzone.addEventListener('click', () => pdfFileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });
  }

  if (pdfFileInput) {
    pdfFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelected(e.target.files[0]);
      }
    });
  }

  if (btnClearFile) {
    btnClearFile.addEventListener('click', (e) => {
      e.stopPropagation();
      currentFile = null;
      pdfFileInput.value = '';
      selectedFileInfo.style.display = 'none';
    });
  }

  function handleFileSelected(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Por favor, selecione um arquivo .PDF válido.', 'error');
      return;
    }
    currentFile = file;
    fileNameDisplay.textContent = file.name;
    selectedFileInfo.style.display = 'inline-flex';
  }

  // Carregar templates oficiais de fundo
  fetch('/api/slides/templates')
    .then(res => res.json())
    .then(data => {
      if (data && data.templates && templateSelect) {
        templateSelect.innerHTML = '';
        data.templates.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t.url;
          opt.textContent = t.name;
          templateSelect.appendChild(opt);
        });
      }
    })
    .catch(() => {});

  // Ação de Geração de Slides
  if (btnGenerate) {
    btnGenerate.addEventListener('click', async () => {
      const text = sermonTextInput.value.trim();
      if (!currentFile && !text) {
        showToast('Envie um arquivo PDF ou cole o texto do sermão.', 'error');
        return;
      }

      const formData = new FormData();
      if (currentFile) formData.append('pdfFile', currentFile);
      if (text) formData.append('sermonText', text);
      formData.append('useAi', checkUseAi.checked);

      btnGenerate.disabled = true;
      btnGenerate.innerHTML = '<span>⏳</span> Processando e montando slides...';

      try {
        const res = await fetch('/api/slides/upload-pdf', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Falha ao processar arquivo.');
        }

        currentSlides = data.slides || [];
        currentDownloadUrl = data.downloadUrl;

        showToast(data.message || 'Slides gerados com sucesso!', 'success');
        renderResults();

      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = '<span class="btn-icon">⚡</span> Gerar Slides Instantaneamente';
      }
    });
  }

  // Renderizar resultados dos slides
  function renderResults() {
    inputSection.style.display = 'none';
    resultsSection.style.display = 'block';
    if (btnDownloadTop) btnDownloadTop.style.display = 'inline-flex';

    slideCountBadge.textContent = `${currentSlides.length} slides`;
    slidesGrid.innerHTML = '';

    const bgUrl = (templateSelect && templateSelect.value) ? templateSelect.value : '/assets/church_sermon_bg.png';

    currentSlides.forEach((slide, index) => {
      const card = document.createElement('div');
      card.className = 'slide-card';

      const fullText = (slide.runs || []).map(r => r.text).join('');
      const previewHtml = (slide.runs || []).map(r => {
        return r.highlight ? `<span class="highlight">${escapeHtml(r.text)}</span>` : escapeHtml(r.text);
      }).join('');

      card.innerHTML = `
        <div class="slide-card-header">
          <span>SLIDE ${index + 1}</span>
          <span class="slide-type-tag">${slide.type || 'versículo'}</span>
        </div>
        <div class="slide-preview-container" style="background-image: url('${bgUrl}');">
          <div class="slide-preview-content">
            <div class="slide-preview-text">${previewHtml}</div>
            ${slide.reference ? `<div class="slide-preview-ref">${escapeHtml(slide.reference)}</div>` : ''}
          </div>
        </div>
        <div class="slide-editor">
          <textarea class="slide-text-edit" data-index="${index}" placeholder="Texto do slide...">${escapeHtml(fullText)}</textarea>
          <div class="slide-editor-row">
            <input type="text" class="slide-ref-edit" data-index="${index}" placeholder="Referência (ex: Mateus 6:19)" value="${escapeHtml(slide.reference || '')}">
            <button class="btn-delete-slide" data-index="${index}">🗑️ Excluir</button>
          </div>
        </div>
      `;

      // Listeners do editor do card
      const textEdit = card.querySelector('.slide-text-edit');
      const refEdit = card.querySelector('.slide-ref-edit');
      const btnDelete = card.querySelector('.btn-delete-slide');

      textEdit.addEventListener('input', (e) => {
        const val = e.target.value;
        currentSlides[index].runs = [{ text: val, highlight: false }];
      });

      refEdit.addEventListener('input', (e) => {
        currentSlides[index].reference = e.target.value;
      });

      btnDelete.addEventListener('click', () => {
        currentSlides.splice(index, 1);
        renderResults();
      });

      slidesGrid.appendChild(card);
    });
  }

  // Adicionar novo slide manual
  if (btnAddSlide) {
    btnAddSlide.addEventListener('click', () => {
      currentSlides.push({
        type: 'verse',
        reference: 'Referência Bíblica',
        runs: [{ text: '“Insira o texto do versículo ou tópico aqui.”', highlight: false }]
      });
      renderResults();
    });
  }

  // Salvar e reconstruir PPTX
  if (btnRebuild) {
    btnRebuild.addEventListener('click', async () => {
      if (currentSlides.length === 0) {
        showToast('Nenhum slide para salvar.', 'error');
        return;
      }

      btnRebuild.disabled = true;
      btnRebuild.textContent = 'Salvando...';

      try {
        const res = await fetch('/api/slides/rebuild', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slides: currentSlides,
            selectedBg: templateSelect ? templateSelect.value : '/assets/church_sermon_bg.png'
          })
        });
        const data = await res.json();

        if (!res.ok || data.error) throw new Error(data.error || 'Erro ao reconstruir.');

        currentDownloadUrl = data.downloadUrl;
        showToast('Apresentação atualizada com sucesso!', 'success');
        renderResults();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btnRebuild.disabled = false;
        btnRebuild.textContent = '💾 Salvar Edições';
      }
    });
  }

  // Download PPTX
  function triggerDownload() {
    if (currentDownloadUrl) {
      window.open(currentDownloadUrl, '_blank');
    } else {
      showToast('Nenhum arquivo pronto para download.', 'error');
    }
  }

  if (btnDownloadTop) btnDownloadTop.addEventListener('click', triggerDownload);
  if (btnDownloadMain) btnDownloadMain.addEventListener('click', triggerDownload);

  // Novo Documento
  if (btnNewPresentation) {
    btnNewPresentation.addEventListener('click', () => {
      inputSection.style.display = 'block';
      resultsSection.style.display = 'none';
      if (btnDownloadTop) btnDownloadTop.style.display = 'none';
      currentFile = null;
      currentSlides = [];
      currentDownloadUrl = null;
      if (pdfFileInput) pdfFileInput.value = '';
      if (sermonTextInput) sermonTextInput.value = '';
      if (selectedFileInfo) selectedFileInfo.style.display = 'none';
    });
  }

  // ==========================================
  // MÓDULO 2: PDF ➔ PPTX DIRETO (1:1 PÁGINA)
  // ==========================================
  const dropzoneDirect = document.getElementById('dropzone-direct');
  const pdfDirectInput = document.getElementById('pdf-direct-input');
  const directFileInfo = document.getElementById('direct-file-info');
  const directFileName = document.getElementById('direct-file-name');
  const btnClearDirectFile = document.getElementById('btn-clear-direct-file');
  const directAspectSelect = document.getElementById('direct-aspect-select');
  const directFitSelect = document.getElementById('direct-fit-select');
  const btnConvertDirect = document.getElementById('btn-convert-direct');
  const directProgressContainer = document.getElementById('direct-progress-container');
  const directProgressBar = document.getElementById('direct-progress-bar');
  const directProgressStatus = document.getElementById('direct-progress-status');
  const directProgressPercent = document.getElementById('direct-progress-percent');

  const sectionDirectInput = document.getElementById('section-direct-input');
  const sectionDirectResults = document.getElementById('section-direct-results');
  const directSlidesGrid = document.getElementById('direct-slides-grid');
  const directSlideCountBadge = document.getElementById('direct-slide-count-badge');
  const btnDownloadDirectTop = document.getElementById('btn-download-direct-top');
  const btnDownloadDirectMain = document.getElementById('btn-download-direct-main');
  const btnNewDirectTop = document.getElementById('btn-new-direct-top');
  const btnNewDirectMain = document.getElementById('btn-new-direct-main');
  const btnSwitchToDirect = document.getElementById('btn-switch-to-direct');

  let currentDirectFile = null;
  let directGeneratedPptx = null;
  let directPptxFileName = 'Apresentacao.pptx';
  let directPagesData = [];

  if (btnSwitchToDirect) {
    btnSwitchToDirect.addEventListener('click', () => switchModule('pdf-to-pptx'));
  }

  if (dropzoneDirect && pdfDirectInput) {
    dropzoneDirect.addEventListener('click', () => pdfDirectInput.click());

    dropzoneDirect.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzoneDirect.classList.add('dragover');
    });

    dropzoneDirect.addEventListener('dragleave', () => {
      dropzoneDirect.classList.remove('dragover');
    });

    dropzoneDirect.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneDirect.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleDirectFileSelected(e.dataTransfer.files[0]);
      }
    });

    pdfDirectInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleDirectFileSelected(e.target.files[0]);
      }
    });
  }

  if (btnClearDirectFile) {
    btnClearDirectFile.addEventListener('click', (e) => {
      e.stopPropagation();
      resetDirectInput();
    });
  }

  function handleDirectFileSelected(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Por favor, selecione um arquivo .PDF válido.', 'error');
      return;
    }
    currentDirectFile = file;
    directFileName.textContent = file.name;
    directFileInfo.style.display = 'inline-flex';
  }

  function resetDirectInput() {
    currentDirectFile = null;
    if (pdfDirectInput) pdfDirectInput.value = '';
    if (directFileInfo) directFileInfo.style.display = 'none';
    if (directProgressContainer) directProgressContainer.style.display = 'none';
    if (directProgressBar) directProgressBar.style.width = '0%';
    if (sectionDirectResults) sectionDirectResults.style.display = 'none';
    if (sectionDirectInput) sectionDirectInput.style.display = 'block';
    if (btnDownloadDirectTop) btnDownloadDirectTop.style.display = 'none';
    directGeneratedPptx = null;
    directPagesData = [];
  }

  if (btnNewDirectTop) btnNewDirectTop.addEventListener('click', resetDirectInput);
  if (btnNewDirectMain) btnNewDirectMain.addEventListener('click', resetDirectInput);

  if (btnConvertDirect) {
    btnConvertDirect.addEventListener('click', async () => {
      if (!currentDirectFile) {
        showToast('Por favor, anexe um arquivo PDF para converter.', 'error');
        return;
      }

      if (typeof pdfjsLib === 'undefined' || typeof PptxGenJS === 'undefined') {
        showToast('Bibliotecas de conversão estão carregando. Tente novamente em instantes.', 'error');
        return;
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

      btnConvertDirect.disabled = true;
      btnConvertDirect.innerHTML = '<span>⏳</span> Convertendo páginas do PDF...';
      directProgressContainer.style.display = 'block';
      directProgressBar.style.width = '5%';
      directProgressPercent.textContent = '5%';
      directProgressStatus.textContent = 'Lendo arquivo PDF...';

      try {
        const arrayBuffer = await currentDirectFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        if (totalPages === 0) {
          throw new Error('O PDF não possui páginas legíveis.');
        }

        directPagesData = [];
        const aspectChoice = directAspectSelect ? directAspectSelect.value : '16x9';
        const fitChoice = directFitSelect ? directFitSelect.value : 'contain';

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const pct = Math.round((pageNum / totalPages) * 85);
          directProgressBar.style.width = `${pct}%`;
          directProgressPercent.textContent = `${pct}%`;
          directProgressStatus.textContent = `Processando página ${pageNum} de ${totalPages}...`;

          const page = await pdf.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1.0 });

          // Renderização Full HD (mínimo 1920px de largura para máxima nitidez no telão da igreja)
          const targetWidth = 1920;
          const scale = Math.max(targetWidth / unscaledViewport.width, 1.8);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport }).promise;

          const imgData = canvas.toDataURL('image/jpeg', 0.92);
          const pageRatio = viewport.width / viewport.height;

          directPagesData.push({
            pageNum,
            imgData,
            width: viewport.width,
            height: viewport.height,
            ratio: pageRatio
          });
        }

        directProgressStatus.textContent = 'Montando apresentação em PowerPoint (.pptx)...';
        directProgressBar.style.width = '92%';
        directProgressPercent.textContent = '92%';

        // Montar apresentação PPTX com PptxGenJS
        const pptx = new PptxGenJS();

        if (aspectChoice === 'original' && directPagesData.length > 0) {
          const firstRatio = directPagesData[0].ratio || (16 / 9);
          pptx.defineLayout({ name: 'CUSTOM_PDF', width: 10, height: 10 / firstRatio });
          pptx.layout = 'CUSTOM_PDF';
        } else {
          pptx.layout = 'LAYOUT_16x9';
        }

        for (const p of directPagesData) {
          const slide = pptx.addSlide();
          slide.background = { color: '000000' };

          if (fitChoice === 'cover') {
            slide.addImage({
              data: p.imgData,
              x: 0,
              y: 0,
              w: '100%',
              h: '100%'
            });
          } else {
            slide.addImage({
              data: p.imgData,
              x: 0,
              y: 0,
              w: '100%',
              h: '100%',
              sizing: { type: 'contain', w: '100%', h: '100%' }
            });
          }
        }

        directProgressStatus.textContent = 'Concluindo exportação...';
        directProgressBar.style.width = '100%';
        directProgressPercent.textContent = '100%';

        directPptxFileName = currentDirectFile.name.replace(/\.[^/.]+$/, '') + '_PAGINAS.pptx';
        directGeneratedPptx = pptx;

        // Dispara o download automático do PPTX gerado
        await pptx.writeFile({ fileName: directPptxFileName });

        // Renderiza visualização das páginas
        renderDirectResults();

        showToast(`Sucesso! ${totalPages} páginas convertidas em ${totalPages} slides no PPTX.`, 'success');

      } catch (err) {
        console.error('Erro na conversão direta de PDF para PPTX:', err);
        showToast(err.message || 'Erro ao converter PDF em slides.', 'error');
      } finally {
        btnConvertDirect.disabled = false;
        btnConvertDirect.innerHTML = '<span class="btn-icon">⚡</span> Converter para PPTX Instantaneamente';
      }
    });
  }

  function renderDirectResults() {
    if (!sectionDirectInput || !sectionDirectResults) return;

    sectionDirectInput.style.display = 'none';
    sectionDirectResults.style.display = 'block';

    if (btnDownloadDirectTop) btnDownloadDirectTop.style.display = 'inline-flex';
    if (directSlideCountBadge) directSlideCountBadge.textContent = `${directPagesData.length} slides`;

    if (directSlidesGrid) {
      directSlidesGrid.innerHTML = '';
      directPagesData.forEach((p) => {
        const card = document.createElement('div');
        card.className = 'direct-page-card';
        card.innerHTML = `
          <div class="direct-page-preview">
            <img src="${p.imgData}" alt="Página ${p.pageNum}" loading="lazy">
          </div>
          <div class="direct-page-meta">
            <span class="direct-page-badge">Slide ${p.pageNum}</span>
            <span style="color: var(--text-muted);">Página ${p.pageNum} do PDF</span>
          </div>
        `;
        directSlidesGrid.appendChild(card);
      });
    }
  }

  async function triggerDirectDownload() {
    if (!directGeneratedPptx) {
      showToast('Nenhuma apresentação gerada para baixar.', 'error');
      return;
    }
    try {
      await directGeneratedPptx.writeFile({ fileName: directPptxFileName });
      showToast('Download do PPTX iniciado!', 'success');
    } catch (err) {
      showToast('Erro ao baixar arquivo PPTX: ' + err.message, 'error');
    }
  }

  if (btnDownloadDirectTop) btnDownloadDirectTop.addEventListener('click', triggerDirectDownload);
  if (btnDownloadDirectMain) btnDownloadDirectMain.addEventListener('click', triggerDirectDownload);

  // ==========================================
  // INSERÇÃO RÁPIDA DE VERSÍCULOS BÍBLICOS
  // ==========================================
  const modalVerse = document.getElementById('modalVerse');
  const btnOpenVerseModal = document.getElementById('btn-open-verse-modal');
  const btnCloseVerseModal = document.getElementById('btn-close-verse-modal');
  const btnCancelVerseModal = document.getElementById('btn-cancel-verse-modal');
  const btnSearchVerse = document.getElementById('btnSearchVerse');
  const btnConfirmInsertVerse = document.getElementById('btn-confirm-insert-verse');
  const verseRefInput = document.getElementById('verseRefInput');
  const verseVersionSelect = document.getElementById('verseVersionSelect');
  const verseTextInput = document.getElementById('verseTextInput');
  const verseSearchStatus = document.getElementById('verseSearchStatus');
  const checkSplitMultiVersesPublic = document.getElementById('checkSplitMultiVersesPublic');
  const btnHighlightVerseModal = document.getElementById('btn-highlight-verse-modal');
  const btnQuotesVerseModal = document.getElementById('btn-quotes-verse-modal');

  function openVerseModalPublic() {
    if (modalVerse) {
      modalVerse.style.display = 'flex';
      setTimeout(() => { if (verseRefInput) verseRefInput.focus(); }, 50);
    }
  }

  function closeVerseModalPublic() {
    if (modalVerse) modalVerse.style.display = 'none';
  }

  window.quickFillVersePublic = function(ref) {
    if (verseRefInput) {
      verseRefInput.value = ref;
      searchVersePublic();
    }
  };

  if (btnOpenVerseModal) btnOpenVerseModal.addEventListener('click', openVerseModalPublic);
  if (btnCloseVerseModal) btnCloseVerseModal.addEventListener('click', closeVerseModalPublic);
  if (btnCancelVerseModal) btnCancelVerseModal.addEventListener('click', closeVerseModalPublic);

  if (btnHighlightVerseModal) {
    btnHighlightVerseModal.addEventListener('click', () => {
      if (!verseTextInput) return;
      const start = verseTextInput.selectionStart;
      const end = verseTextInput.selectionEnd;
      const val = verseTextInput.value;
      if (start !== end) {
        const selected = val.substring(start, end).replace(/\[\/?HL\]/gi, '');
        const replacement = `[HL]${selected}[/HL]`;
        verseTextInput.value = val.substring(0, start) + replacement + val.substring(end);
        verseTextInput.selectionStart = start;
        verseTextInput.selectionEnd = start + replacement.length;
      } else {
        showToast('Selecione uma palavra ou trecho para destacar em dourado.', 'info');
      }
      verseTextInput.focus();
    });
  }

  if (btnQuotesVerseModal) {
    btnQuotesVerseModal.addEventListener('click', () => {
      if (!verseTextInput) return;
      let val = verseTextInput.value.trim();
      if ((val.startsWith('“') && val.endsWith('”')) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.replace(/^[“”"]|[“”"]$/g, '').trim();
      } else {
        val = `“${val}”`;
      }
      verseTextInput.value = val;
    });
  }

  async function searchVersePublic() {
    if (!verseRefInput || !verseVersionSelect) return;
    const ref = verseRefInput.value.trim();
    const version = verseVersionSelect.value;
    if (!ref) {
      showToast('Digite a referência bíblica (ex: João 3:16, Sl 23:1-3).', 'error');
      return;
    }

    if (btnSearchVerse) {
      btnSearchVerse.disabled = true;
      btnSearchVerse.innerHTML = '⏳ Buscando...';
    }
    if (verseSearchStatus) verseSearchStatus.innerText = `Consultando versão ${version}...`;

    try {
      let foundText = null;
      let finalRef = ref;

      try {
        const cleanQuery = ref.replace(/\s+/g, '+').replace(/salmo\b/i, 'salmos').replace(/cântico\b/i, 'cantares');
        const apiUrl = `https://bible-api.com/${encodeURIComponent(cleanQuery)}?translation=almeida`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const d = await res.json();
          if (d && d.text) {
            foundText = d.text.replace(/\s+/g, ' ').trim();
            if (d.reference) finalRef = d.reference;
          }
        }
      } catch(e) {}

      if (foundText) {
        if (!foundText.startsWith('“') && !foundText.startsWith('"')) foundText = `“${foundText}”`;
        verseTextInput.value = foundText;
        verseRefInput.value = `${finalRef} (${version})`;
        if (verseSearchStatus) verseSearchStatus.innerText = `✅ Versículo carregado na versão ${version}!`;
      } else {
        if (verseSearchStatus) verseSearchStatus.innerText = `Digite ou cole o texto do versículo diretamente na caixa de texto.`;
      }
    } catch(err) {
      if (verseSearchStatus) verseSearchStatus.innerText = `Digite o texto manualmente.`;
    } finally {
      if (btnSearchVerse) {
        btnSearchVerse.disabled = false;
        btnSearchVerse.innerHTML = '🔍 Buscar';
      }
    }
  }

  if (btnSearchVerse) btnSearchVerse.addEventListener('click', searchVersePublic);
  if (verseRefInput) {
    verseRefInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchVersePublic();
    });
  }

  if (btnConfirmInsertVerse) {
    btnConfirmInsertVerse.addEventListener('click', () => {
      const rawText = verseTextInput ? verseTextInput.value.trim() : '';
      const reference = verseRefInput ? verseRefInput.value.trim() : 'Referência Bíblica';

      if (!rawText) {
        showToast('Informe ou busque o texto do versículo antes de inserir.', 'error');
        return;
      }

      const doSplit = checkSplitMultiVersesPublic ? checkSplitMultiVersesPublic.checked : false;
      const verseSplit = doSplit ? rawText.split(/(?=\b\d{1,3}\s+[A-ZÀ-Ý“"])/g).filter(s => s.trim().length > 0) : [rawText];
      const baseBookAndChap = reference.includes(':') ? reference.split(':')[0] : reference;

      verseSplit.forEach(vChunk => {
        let cleanText = vChunk.trim();
        let currentRef = reference;

        const numMatch = cleanText.match(/^“?\s*(\d{1,3})\s+(.*)$/);
        if (numMatch && baseBookAndChap) {
          const vNum = numMatch[1];
          cleanText = numMatch[2].trim();
          const versionMatch = reference.match(/\((.*?)\)/);
          const verStr = versionMatch ? ` ${versionMatch[0]}` : '';
          currentRef = `${baseBookAndChap}:${vNum}${verStr}`;
        }

        if (!cleanText.startsWith('“') && !cleanText.startsWith('"')) cleanText = `“${cleanText}”`;

        // Parse runs with highlight
        const runs = [];
        const regex = /\[HL\](.*?)\[\/HL\]/gi;
        let lastIdx = 0;
        let m;
        while ((m = regex.exec(cleanText)) !== null) {
          if (m.index > lastIdx) runs.push({ text: cleanText.substring(lastIdx, m.index), highlight: false });
          runs.push({ text: m[1], highlight: true });
          lastIdx = m.index + m[0].length;
        }
        if (lastIdx < cleanText.length) runs.push({ text: cleanText.substring(lastIdx), highlight: false });
        if (runs.length === 0) runs.push({ text: cleanText, highlight: false });

        currentSlides.push({
          type: 'verse',
          reference: currentRef,
          runs: runs
        });
      });

      closeVerseModalPublic();
      renderResults();
      showToast(`Slide de ${reference} inserido com sucesso!`, 'success');
    });
  }

  // Toast utilitário
  function showToast(msg, type = 'info') {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
