document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // NAVEGAÇÃO DE MÓDULOS (CENTRAL MULTIMÍDIA)
  // ==========================================
  const navModuleBtns = document.querySelectorAll('.nav-module-btn');
  const moduleViews = {
    'slidekiller': document.getElementById('view-slidekiller'),
    'pdf-to-pptx': document.getElementById('view-pdf-to-pptx'),
    'images-to-pptx': document.getElementById('view-images-to-pptx'),
    'video-editor': document.getElementById('view-video-editor')
  };
  const moduleActions = {
    'slidekiller': document.getElementById('actions-slidekiller'),
    'pdf-to-pptx': document.getElementById('actions-pdf-to-pptx'),
    'images-to-pptx': document.getElementById('actions-images-to-pptx'),
    'video-editor': document.getElementById('actions-video-editor')
  };

  let currentActiveModule = 'slidekiller';

  function switchModule(targetModule) {
    if (!targetModule || !moduleViews[targetModule]) return;
    currentActiveModule = targetModule;

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

    const bgUrl = (templateSelect && templateSelect.value) ? templateSelect.value : 'assets/church_sermon_bg.png';

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
            selectedBg: templateSelect ? templateSelect.value : 'assets/church_sermon_bg.png'
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
  const directBgSelect = document.getElementById('direct-bg-select');
  const btnConvertDirect = document.getElementById('btn-convert-direct');
  const directProgressContainer = document.getElementById('direct-progress-container');
  const directProgressBar = document.getElementById('direct-progress-bar');
  const directProgressStatus = document.getElementById('direct-progress-status');
  const directProgressPercent = document.getElementById('direct-progress-percent');
  const directFormatSelect = document.getElementById('direct-format-select');
  const btnExportDirectPdf = document.getElementById('btn-export-direct-pdf');
  const btnExportDirectPptx = document.getElementById('btn-export-direct-pptx');
  const directMainBtnIcon = document.getElementById('direct-main-btn-icon');
  const directMainBtnLabel = document.getElementById('direct-main-btn-label');

  const sectionDirectInput = document.getElementById('section-direct-input');
  const sectionDirectResults = document.getElementById('section-direct-results');
  const directSlidesGrid = document.getElementById('direct-slides-grid');
  const directSlideCountBadge = document.getElementById('direct-slide-count-badge');
  const btnDownloadDirectTop = document.getElementById('btn-download-direct-top');
  const btnDownloadDirectMain = document.getElementById('btn-download-direct-main');
  const btnNewDirectTop = document.getElementById('btn-new-direct-top');
  const btnNewDirectMain = document.getElementById('btn-new-direct-main');
  const btnSwitchToDirect = document.getElementById('btn-switch-to-direct');

  const pdfExtraImagesInput = document.getElementById('pdf-extra-images-input');
  const pdfAppendInput = document.getElementById('pdf-append-input');
  const btnReverseDirect = document.getElementById('btn-reverse-direct');
  const btnClearAllDirect = document.getElementById('btn-clear-all-direct');
  const directExportProgressContainer = document.getElementById('direct-export-progress-container');
  const directExportProgressBar = document.getElementById('direct-export-progress-bar');
  const directExportProgressStatus = document.getElementById('direct-export-progress-status');
  const directExportProgressPercent = document.getElementById('direct-export-progress-percent');

  let currentDirectFile = null;
  let directGeneratedPptx = null;
  let directPptxFileName = 'Apresentacao.pptx';
  let directSlides = [];
  let draggedDirectSlideIndex = null;

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
    if (pdfExtraImagesInput) pdfExtraImagesInput.value = '';
    if (pdfAppendInput) pdfAppendInput.value = '';
    if (directFileInfo) directFileInfo.style.display = 'none';
    if (directProgressContainer) directProgressContainer.style.display = 'none';
    if (directProgressBar) directProgressBar.style.width = '0%';
    if (directExportProgressContainer) directExportProgressContainer.style.display = 'none';
    if (sectionDirectResults) sectionDirectResults.style.display = 'none';
    if (sectionDirectInput) sectionDirectInput.style.display = 'block';
    if (btnDownloadDirectTop) btnDownloadDirectTop.style.display = 'none';
    directGeneratedPptx = null;
    directSlides = [];
  }

  if (btnNewDirectTop) btnNewDirectTop.addEventListener('click', () => {
    if (directSlides.length > 0 && !confirm('Deseja iniciar um novo PDF? Os slides atuais serão limpos.')) return;
    resetDirectInput();
  });
  if (btnNewDirectMain) btnNewDirectMain.addEventListener('click', () => {
    if (directSlides.length > 0 && !confirm('Deseja iniciar um novo PDF? Os slides atuais serão limpos.')) return;
    resetDirectInput();
  });

  // Processar PDF inicial e abrir no organizador
  if (btnConvertDirect) {
    btnConvertDirect.addEventListener('click', async () => {
      if (!currentDirectFile) {
        showToast('Por favor, anexe um arquivo PDF para converter.', 'error');
        return;
      }
      await processPdfIntoSlides(currentDirectFile, false);
    });
  }

  // Adicionar outro PDF ao mesmo projeto
  if (pdfAppendInput) {
    pdfAppendInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await processPdfIntoSlides(e.target.files[0], true);
        pdfAppendInput.value = '';
      }
    });
  }

  // Função central para renderizar páginas do PDF em Full HD
  async function processPdfIntoSlides(file, isAppend = false) {
    if (typeof pdfjsLib === 'undefined' || typeof PptxGenJS === 'undefined') {
      showToast('Bibliotecas de conversão estão carregando. Tente novamente em instantes.', 'error');
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    if (btnConvertDirect) {
      btnConvertDirect.disabled = true;
      btnConvertDirect.innerHTML = '<span>⏳</span> Processando páginas do PDF...';
    }
    if (directProgressContainer) {
      directProgressContainer.style.display = 'block';
      directProgressBar.style.width = '5%';
      directProgressPercent.textContent = '5%';
      directProgressStatus.textContent = 'Lendo arquivo PDF...';
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      if (totalPages === 0) {
        throw new Error('O PDF não possui páginas legíveis.');
      }

      if (!isAppend) {
        directSlides = [];
        directPptxFileName = file.name.replace(/\.[^/.]+$/, '') + '_PAGINAS.pptx';
      }

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pct = Math.round((pageNum / totalPages) * 90);
        if (directProgressBar) directProgressBar.style.width = `${pct}%`;
        if (directProgressPercent) directProgressPercent.textContent = `${pct}%`;
        if (directProgressStatus) directProgressStatus.textContent = `Processando página ${pageNum} de ${totalPages}...`;

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

        directSlides.push({
          id: 'pdf_' + Date.now() + '_' + pageNum + '_' + Math.random().toString(36).substr(2, 5),
          title: `${file.name.replace(/\.[^/.]+$/, '')} - Pág ${pageNum}`,
          type: 'pdf',
          source: file.name,
          pageNum: pageNum,
          imgData: imgData,
          ratio: pageRatio,
          width: viewport.width,
          height: viewport.height
        });
      }

      if (directProgressStatus) directProgressStatus.textContent = 'Páginas prontas!';
      if (directProgressBar) directProgressBar.style.width = '100%';
      if (directProgressPercent) directProgressPercent.textContent = '100%';

      renderDirectOrganizer();
      showToast(`${totalPages} página(s) extraída(s) com sucesso para o organizador!`, 'success');

    } catch (err) {
      console.error('Erro na conversão de PDF para slides:', err);
      showToast(err.message || 'Erro ao processar PDF.', 'error');
    } finally {
      if (btnConvertDirect) {
        btnConvertDirect.disabled = false;
        btnConvertDirect.innerHTML = '<span class="btn-icon">⚡</span> Processar PDF e Abrir no Organizador';
      }
      if (directProgressContainer) {
        setTimeout(() => {
          directProgressContainer.style.display = 'none';
        }, 1200);
      }
    }
  }

  // Upload de Imagens Externas / Fotos / Avisos adicionais no PDF
  if (pdfExtraImagesInput) {
    pdfExtraImagesInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      let addedCount = 0;
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        try {
          const dataUrl = await readFileAsDataUrl(file);
          directSlides.push({
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            title: file.name,
            type: 'image',
            source: 'Imagem Externa',
            imgData: dataUrl,
            ratio: 16 / 9
          });
          addedCount++;
        } catch (err) {
          console.error('Erro ao ler imagem externa:', err);
        }
      }

      pdfExtraImagesInput.value = '';
      if (addedCount > 0) {
        renderDirectOrganizer();
        showToast(`✅ ${addedCount} foto(s)/imagem(ns) adicionada(s) à apresentação!`, 'success');
      } else {
        showToast('Nenhuma imagem válida foi selecionada.', 'error');
      }
    });
  }

  // Renderiza a grade de cards do organizador de slides do PDF
  function renderDirectOrganizer() {
    if (!sectionDirectInput || !sectionDirectResults) return;

    if (directSlides.length === 0) {
      sectionDirectInput.style.display = 'block';
      sectionDirectResults.style.display = 'none';
      if (btnDownloadDirectTop) btnDownloadDirectTop.style.display = 'none';
      return;
    }

    sectionDirectInput.style.display = 'none';
    sectionDirectResults.style.display = 'block';

    if (directSlideCountBadge) {
      directSlideCountBadge.textContent = `${directSlides.length} ${directSlides.length === 1 ? 'slide' : 'slides'}`;
    }
    if (btnDownloadDirectTop) {
      btnDownloadDirectTop.style.display = 'inline-flex';
    }

    if (!directSlidesGrid) return;
    directSlidesGrid.innerHTML = '';

    directSlides.forEach((slide, index) => {
      const card = document.createElement('div');
      card.className = 'image-slide-card';
      card.draggable = true;
      card.dataset.index = index;

      const isPdf = slide.type === 'pdf';
      const typeBadgeHtml = isPdf
        ? `<span style="position: absolute; top: 8px; right: 8px; background: rgba(232, 184, 89, 0.9); color: #0b0f19; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">📄 PDF</span>`
        : `<span style="position: absolute; top: 8px; right: 8px; background: rgba(168, 85, 247, 0.9); color: #fff; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">🖼️ FOTO</span>`;

      card.innerHTML = `
        <div class="image-slide-preview">
          <span class="image-order-badge">#${index + 1}</span>
          ${typeBadgeHtml}
          <img src="${slide.imgData}" alt="Slide ${index + 1}" loading="lazy">
        </div>
        <div class="image-slide-info">
          <div class="image-slide-name" title="${slide.title}">${slide.title}</div>
          <div class="image-slide-actions">
            <div class="image-reorder-buttons">
              <button type="button" class="btn-card-reorder" data-action="prev" title="Mover para trás" ${index === 0 ? 'disabled' : ''}>
                ⬅
              </button>
              <button type="button" class="btn-card-reorder" data-action="next" title="Mover para frente" ${index === directSlides.length - 1 ? 'disabled' : ''}>
                ➡
              </button>
            </div>
            <button type="button" class="btn-card-delete" data-action="delete" title="Excluir este slide">
              🗑️
            </button>
          </div>
        </div>
      `;

      // Botões de ação do card
      const btnPrev = card.querySelector('[data-action="prev"]');
      const btnNext = card.querySelector('[data-action="next"]');
      const btnDel  = card.querySelector('[data-action="delete"]');

      if (btnPrev && index > 0) {
        btnPrev.addEventListener('click', (e) => {
          e.stopPropagation();
          moveDirectSlide(index, index - 1);
        });
      }

      if (btnNext && index < directSlides.length - 1) {
        btnNext.addEventListener('click', (e) => {
          e.stopPropagation();
          moveDirectSlide(index, index + 1);
        });
      }

      if (btnDel) {
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteDirectSlide(index);
        });
      }

      // Drag and Drop nativo nos cards
      card.addEventListener('dragstart', (e) => {
        draggedDirectSlideIndex = index;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('#direct-slides-grid .image-slide-card').forEach(c => c.classList.remove('drag-over'));
        draggedDirectSlideIndex = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const fromIdx = draggedDirectSlideIndex;
        const toIdx = index;

        if (fromIdx !== null && fromIdx !== toIdx) {
          moveDirectSlide(fromIdx, toIdx);
        }
      });

      directSlidesGrid.appendChild(card);
    });
  }

  // Mover slide de uma posição para outra
  function moveDirectSlide(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= directSlides.length || toIndex < 0 || toIndex >= directSlides.length) return;
    const item = directSlides.splice(fromIndex, 1)[0];
    directSlides.splice(toIndex, 0, item);
    renderDirectOrganizer();
  }

  // Deletar um slide específico
  function deleteDirectSlide(index) {
    if (index < 0 || index >= directSlides.length) return;
    directSlides.splice(index, 1);
    renderDirectOrganizer();
    showToast('Slide removido.', 'info');
  }

  // Inverter ordem dos slides do PDF
  if (btnReverseDirect) {
    btnReverseDirect.addEventListener('click', () => {
      if (directSlides.length === 0) return;
      directSlides.reverse();
      renderDirectOrganizer();
      showToast('Ordem dos slides invertida!', 'info');
    });
  }

  // Limpar todos os slides
  if (btnClearAllDirect) {
    btnClearAllDirect.addEventListener('click', () => {
      if (directSlides.length === 0) return;
      if (confirm('Deseja remover todos os slides do organizador?')) {
        directSlides = [];
        renderDirectOrganizer();
        showToast('Todos os slides foram removidos.', 'info');
      }
    });
  }

  // Função utilitária central para gerar PDF dos slides no navegador via jsPDF
  async function generateSlidesPdfDoc({
    slides,
    aspectChoice,
    fitChoice,
    bgChoice,
    fileName,
    progressCallback
  }) {
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
      throw new Error('Biblioteca jsPDF não carregada. Verifique sua conexão com a internet.');
    }
    const { jsPDF } = window.jspdf;

    const baseWidth = 1920;
    let baseHeight = 1080;
    if (aspectChoice === '4x3') {
      baseHeight = 1440;
    } else if (aspectChoice === 'original' && slides[0] && slides[0].ratio) {
      baseHeight = Math.round(baseWidth / slides[0].ratio);
    }

    const isLandscape = baseWidth >= baseHeight;
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'px',
      format: [baseWidth, baseHeight],
      hotfixes: ['px_scaling']
    });

    // Converter hex color para RGB
    const hex = (bgChoice || '000000').replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;

    const total = slides.length;
    for (let i = 0; i < total; i++) {
      const slide = slides[i];
      if (progressCallback) progressCallback(i + 1, total);

      if (i > 0) {
        doc.addPage([baseWidth, baseHeight], isLandscape ? 'landscape' : 'portrait');
      }

      // Preencher cor de fundo
      doc.setFillColor(r, g, b);
      doc.rect(0, 0, baseWidth, baseHeight, 'F');

      const rawImg = slide.imgData || slide.dataUrl;
      if (!rawImg) continue;

      const imgRatio = slide.ratio || (slide.width && slide.height ? (slide.width / slide.height) : (16 / 9));
      let drawW = baseWidth;
      let drawH = baseWidth / imgRatio;

      if (fitChoice === 'cover') {
        if (drawH < baseHeight) {
          drawH = baseHeight;
          drawW = baseHeight * imgRatio;
        }
      } else { // contain
        if (drawH > baseHeight) {
          drawH = baseHeight;
          drawW = baseHeight * imgRatio;
        }
      }

      const x = (baseWidth - drawW) / 2;
      const y = (baseHeight - drawH) / 2;

      const imgFormat = rawImg.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(rawImg, imgFormat, x, y, drawW, drawH, undefined, 'FAST');
    }

    doc.save(fileName);
  }

  function updateDirectExportBtnLabel() {
    const fmt = directFormatSelect ? directFormatSelect.value : 'pptx';
    if (directMainBtnIcon && directMainBtnLabel) {
      if (fmt === 'pdf') {
        directMainBtnIcon.textContent = '📄';
        directMainBtnLabel.textContent = 'Gerar e Baixar Documento PDF (.pdf)';
      } else if (fmt === 'both') {
        directMainBtnIcon.textContent = '✨';
        directMainBtnLabel.textContent = 'Gerar e Baixar Ambos (.pptx + .pdf)';
      } else {
        directMainBtnIcon.textContent = '⚡';
        directMainBtnLabel.textContent = 'Gerar e Baixar PowerPoint (.pptx)';
      }
    }
    if (btnDownloadDirectTop) {
      if (fmt === 'pdf') {
        btnDownloadDirectTop.innerHTML = '<span>📄</span> Baixar PDF (.pdf)';
      } else if (fmt === 'both') {
        btnDownloadDirectTop.innerHTML = '<span>✨</span> Baixar Ambos (.pptx + .pdf)';
      } else {
        btnDownloadDirectTop.innerHTML = '<span>📥</span> Baixar PowerPoint (.pptx)';
      }
    }
  }

  if (directFormatSelect) {
    directFormatSelect.addEventListener('change', updateDirectExportBtnLabel);
  }

  // Geração e Exportação customizada (PPTX, PDF ou Ambos) para Módulo 2
  async function generateDirectExport(requestedFormat) {
    if (directSlides.length === 0) {
      showToast('Adicione pelo menos uma página ou imagem para gerar a apresentação.', 'error');
      return;
    }

    const formatChoice = requestedFormat || (directFormatSelect ? directFormatSelect.value : 'pptx');
    const aspectChoice = directAspectSelect ? directAspectSelect.value : '16x9';
    const fitChoice = directFitSelect ? directFitSelect.value : 'contain';
    const bgChoice = directBgSelect ? directBgSelect.value : '000000';

    const baseName = (currentDirectFile ? currentDirectFile.name.replace(/\.[^/.]+$/, '') : 'Apresentacao') + '_PAGINAS';
    const pptxFileName = baseName + '.pptx';
    const pdfFileName = baseName + '.pdf';

    if (btnDownloadDirectMain) {
      btnDownloadDirectMain.disabled = true;
    }
    if (directExportProgressContainer) {
      directExportProgressContainer.style.display = 'block';
      directExportProgressBar.style.width = '10%';
      directExportProgressPercent.textContent = '10%';
      directExportProgressStatus.textContent = 'Iniciando preparação dos arquivos...';
    }

    try {
      const total = directSlides.length;

      // 1. Exportar PPTX se solicitado
      if (formatChoice === 'pptx' || formatChoice === 'both') {
        if (typeof PptxGenJS === 'undefined') {
          throw new Error('Biblioteca PptxGenJS não carregada.');
        }
        if (directExportProgressStatus) directExportProgressStatus.textContent = 'Montando apresentação em PowerPoint (.pptx)...';

        const pptx = new PptxGenJS();
        if (aspectChoice === 'original' && directSlides[0] && directSlides[0].ratio) {
          const firstRatio = directSlides[0].ratio || (16 / 9);
          pptx.defineLayout({ name: 'CUSTOM_PDF', width: 10, height: 10 / firstRatio });
          pptx.layout = 'CUSTOM_PDF';
        } else if (aspectChoice === '4x3') {
          pptx.layout = 'LAYOUT_4x3';
        } else {
          pptx.layout = 'LAYOUT_16x9';
        }

        for (let i = 0; i < total; i++) {
          const slideItem = directSlides[i];
          const pct = Math.round(10 + ((i + 1) / total) * (formatChoice === 'both' ? 40 : 80));
          if (directExportProgressBar) directExportProgressBar.style.width = `${pct}%`;
          if (directExportProgressPercent) directExportProgressPercent.textContent = `${pct}%`;
          if (directExportProgressStatus) directExportProgressStatus.textContent = `PowerPoint: slide ${i + 1} de ${total}...`;

          const slide = pptx.addSlide();
          slide.background = { color: bgChoice };

          if (fitChoice === 'cover') {
            slide.addImage({ data: slideItem.imgData, x: 0, y: 0, w: '100%', h: '100%' });
          } else {
            slide.addImage({ data: slideItem.imgData, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'contain', w: '100%', h: '100%' } });
          }
        }

        directGeneratedPptx = pptx;
        directPptxFileName = pptxFileName;
        await pptx.writeFile({ fileName: pptxFileName });
      }

      // 2. Exportar PDF se solicitado
      if (formatChoice === 'pdf' || formatChoice === 'both') {
        if (directExportProgressStatus) directExportProgressStatus.textContent = 'Gerando documento em PDF (.pdf)...';

        await generateSlidesPdfDoc({
          slides: directSlides,
          aspectChoice,
          fitChoice,
          bgChoice,
          fileName: pdfFileName,
          progressCallback: (cur, tot) => {
            const startPct = formatChoice === 'both' ? 55 : 10;
            const range = formatChoice === 'both' ? 40 : 85;
            const pct = Math.round(startPct + (cur / tot) * range);
            if (directExportProgressBar) directExportProgressBar.style.width = `${pct}%`;
            if (directExportProgressPercent) directExportProgressPercent.textContent = `${pct}%`;
            if (directExportProgressStatus) directExportProgressStatus.textContent = `PDF: página ${cur} de ${tot}...`;
          }
        });
      }

      if (directExportProgressBar) directExportProgressBar.style.width = '100%';
      if (directExportProgressPercent) directExportProgressPercent.textContent = '100%';
      if (directExportProgressStatus) directExportProgressStatus.textContent = 'Concluído!';

      if (formatChoice === 'both') {
        showToast(`🎉 Apresentação baixada em PPTX e PDF (${total} slides cada)!`, 'success');
      } else if (formatChoice === 'pdf') {
        showToast(`🎉 Documento PDF baixado com sucesso (${total} páginas)!`, 'success');
      } else {
        showToast(`🎉 Apresentação PPTX baixada com sucesso (${total} slides)!`, 'success');
      }

    } catch (err) {
      console.error('Erro na exportação:', err);
      showToast('Erro ao exportar: ' + err.message, 'error');
    } finally {
      if (btnDownloadDirectMain) {
        btnDownloadDirectMain.disabled = false;
        updateDirectExportBtnLabel();
      }
      if (directExportProgressContainer) {
        setTimeout(() => {
          directExportProgressContainer.style.display = 'none';
        }, 1500);
      }
    }
  }

  if (btnDownloadDirectTop) btnDownloadDirectTop.addEventListener('click', () => generateDirectExport());
  if (btnDownloadDirectMain) btnDownloadDirectMain.addEventListener('click', () => generateDirectExport());
  if (btnExportDirectPdf) btnExportDirectPdf.addEventListener('click', () => generateDirectExport('pdf'));
  if (btnExportDirectPptx) btnExportDirectPptx.addEventListener('click', () => generateDirectExport('pptx'));

  // ==========================================
  // MÓDULO 3: IMAGENS & ZIP ➔ PPTX (ORGANIZADOR)
  // ==========================================
  let imageSlides = [];
  let imagesGeneratedPptx = null;
  let imagesPptxFileName = 'Apresentacao_Imagens.pptx';
  let draggedSlideIndex = null;

  const dropzoneImages = document.getElementById('dropzone-images');
  const imagesFilesInput = document.getElementById('images-files-input');
  const zipFilesInput = document.getElementById('zip-files-input');
  const sectionImagesInput = document.getElementById('section-images-input');
  const sectionImagesOrganizer = document.getElementById('section-images-organizer');
  const imagesSlideCountBadge = document.getElementById('images-slide-count-badge');
  const imagesReorderGrid = document.getElementById('images-reorder-grid');
  const btnGenerateImagesPptx = document.getElementById('btn-generate-images-pptx');
  const btnDownloadImagesTop = document.getElementById('btn-download-images-top');
  const btnNewImagesTop = document.getElementById('btn-new-images-top');
  const btnSortImagesAz = document.getElementById('btn-sort-images-az');
  const btnReverseImages = document.getElementById('btn-reverse-images');
  const btnClearAllImages = document.getElementById('btn-clear-all-images');
  const imagesAspectSelect = document.getElementById('images-aspect-select');
  const imagesFitSelect = document.getElementById('images-fit-select');
  const imagesBgSelect = document.getElementById('images-bg-select');
  const imagesProgressContainer = document.getElementById('images-progress-container');
  const imagesProgressBar = document.getElementById('images-progress-bar');
  const imagesProgressPercent = document.getElementById('images-progress-percent');
  const imagesProgressStatus = document.getElementById('images-progress-status');
  const imagesFormatSelect = document.getElementById('images-format-select');
  const btnExportImagesPdf = document.getElementById('btn-export-images-pdf');
  const btnExportImagesPptx = document.getElementById('btn-export-images-pptx');
  const imagesMainBtnIcon = document.getElementById('images-main-btn-icon');
  const imagesMainBtnLabel = document.getElementById('images-main-btn-label');

  // Drag & Drop na Dropzone de Imagens
  if (dropzoneImages) {
    dropzoneImages.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        if (imagesFilesInput) imagesFilesInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzoneImages.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneImages.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzoneImages.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneImages.classList.remove('dragover');
      });
    });

    dropzoneImages.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processIncomingFiles(Array.from(files));
      }
    });
  }

  // Inputs de arquivos
  if (imagesFilesInput) {
    imagesFilesInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processIncomingFiles(Array.from(e.target.files));
        e.target.value = '';
      }
    });
  }

  if (zipFilesInput) {
    zipFilesInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processIncomingFiles(Array.from(e.target.files));
        e.target.value = '';
      }
    });
  }

  // Função centralizada para processar arquivos de imagens e ZIP
  async function processIncomingFiles(files) {
    const validImageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg', '.gif'];
    let addedCount = 0;

    showToast('Lendo arquivos selecionados...', 'info');

    for (const file of files) {
      const fileNameLower = file.name.toLowerCase();

      // Caso 1: Arquivo ZIP
      if (fileNameLower.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        if (typeof JSZip === 'undefined') {
          showToast('Biblioteca JSZip não carregada.', 'error');
          continue;
        }

        try {
          const zip = await JSZip.loadAsync(file);
          const entries = [];

          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && !relativePath.includes('__MACOSX') && !relativePath.startsWith('.')) {
              const ext = '.' + relativePath.split('.').pop().toLowerCase();
              if (validImageExtensions.includes(ext)) {
                entries.push(zipEntry);
              }
            }
          });

          // Ordenação natural de nomes dentro do zip (ex: 1.jpg, 2.jpg, 10.jpg)
          entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

          for (const entry of entries) {
            const ext = entry.name.split('.').pop().toLowerCase();
            const mime = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
            const base64Data = await entry.async('base64');
            const dataUrl = `data:${mime};base64,${base64Data}`;

            imageSlides.push({
              id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              name: entry.name.split('/').pop(),
              dataUrl: dataUrl
            });
            addedCount++;
          }
        } catch (err) {
          console.error('Erro ao descompactar ZIP:', err);
          showToast(`Erro ao abrir ${file.name}: ${err.message}`, 'error');
        }
      }
      // Caso 2: Imagem avulsa
      else if (validImageExtensions.some(ext => fileNameLower.endsWith(ext)) || file.type.startsWith('image/')) {
        try {
          const dataUrl = await readFileAsDataUrl(file);
          imageSlides.push({
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: file.name,
            dataUrl: dataUrl
          });
          addedCount++;
        } catch (err) {
          console.error('Erro ao ler imagem:', err);
        }
      }
    }

    if (addedCount > 0) {
      showToast(`${addedCount} imagem(ns) adicionada(s) com sucesso!`, 'success');
      renderImagesOrganizer();
    } else {
      showToast('Nenhuma imagem válida encontrada nos arquivos.', 'error');
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Renderiza a grade de cards do organizador de slides
  function renderImagesOrganizer() {
    if (!sectionImagesInput || !sectionImagesOrganizer) return;

    if (imageSlides.length === 0) {
      sectionImagesInput.style.display = 'block';
      sectionImagesOrganizer.style.display = 'none';
      if (btnDownloadImagesTop) btnDownloadImagesTop.style.display = 'none';
      return;
    }

    sectionImagesInput.style.display = 'none';
    sectionImagesOrganizer.style.display = 'block';

    if (imagesSlideCountBadge) {
      imagesSlideCountBadge.textContent = `${imageSlides.length} ${imageSlides.length === 1 ? 'slide' : 'slides'}`;
    }

    if (btnDownloadImagesTop) {
      btnDownloadImagesTop.style.display = 'inline-flex';
    }

    if (!imagesReorderGrid) return;
    imagesReorderGrid.innerHTML = '';

    imageSlides.forEach((slide, index) => {
      const card = document.createElement('div');
      card.className = 'image-slide-card';
      card.draggable = true;
      card.dataset.index = index;

      card.innerHTML = `
        <div class="image-slide-preview">
          <span class="image-order-badge">#${index + 1}</span>
          <img src="${slide.dataUrl}" alt="Slide ${index + 1}" loading="lazy">
        </div>
        <div class="image-slide-info">
          <div class="image-slide-name" title="${slide.name}">${slide.name}</div>
          <div class="image-slide-actions">
            <div class="image-reorder-buttons">
              <button type="button" class="btn-card-reorder" data-action="prev" title="Mover para trás" ${index === 0 ? 'disabled' : ''}>
                ⬅
              </button>
              <button type="button" class="btn-card-reorder" data-action="next" title="Mover para frente" ${index === imageSlides.length - 1 ? 'disabled' : ''}>
                ➡
              </button>
            </div>
            <button type="button" class="btn-card-delete" data-action="delete" title="Excluir este slide">
              🗑️
            </button>
          </div>
        </div>
      `;

      // Botões de ação do card
      const btnPrev = card.querySelector('[data-action="prev"]');
      const btnNext = card.querySelector('[data-action="next"]');
      const btnDel  = card.querySelector('[data-action="delete"]');

      if (btnPrev && index > 0) {
        btnPrev.addEventListener('click', (e) => {
          e.stopPropagation();
          moveImageSlide(index, index - 1);
        });
      }

      if (btnNext && index < imageSlides.length - 1) {
        btnNext.addEventListener('click', (e) => {
          e.stopPropagation();
          moveImageSlide(index, index + 1);
        });
      }

      if (btnDel) {
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteImageSlide(index);
        });
      }

      // Drag and Drop nativo nos cards
      card.addEventListener('dragstart', (e) => {
        draggedSlideIndex = index;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.image-slide-card').forEach(c => c.classList.remove('drag-over'));
        draggedSlideIndex = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const fromIdx = draggedSlideIndex;
        const toIdx = index;

        if (fromIdx !== null && fromIdx !== toIdx) {
          moveImageSlide(fromIdx, toIdx);
        }
      });

      imagesReorderGrid.appendChild(card);
    });
  }

  // Mover slide de uma posição para outra
  function moveImageSlide(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= imageSlides.length || toIndex < 0 || toIndex >= imageSlides.length) return;
    const item = imageSlides.splice(fromIndex, 1)[0];
    imageSlides.splice(toIndex, 0, item);
    renderImagesOrganizer();
  }

  // Deletar um slide específico
  function deleteImageSlide(index) {
    if (index < 0 || index >= imageSlides.length) return;
    imageSlides.splice(index, 1);
    renderImagesOrganizer();
    showToast('Slide removido.', 'info');
  }

  // Ordenação alfabética natural (A-Z)
  if (btnSortImagesAz) {
    btnSortImagesAz.addEventListener('click', () => {
      if (imageSlides.length === 0) return;
      imageSlides.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      renderImagesOrganizer();
      showToast('Slides ordenados de A a Z por nome de arquivo.', 'success');
    });
  }

  // Inverter ordem dos slides
  if (btnReverseImages) {
    btnReverseImages.addEventListener('click', () => {
      if (imageSlides.length === 0) return;
      imageSlides.reverse();
      renderImagesOrganizer();
      showToast('Ordem dos slides invertida!', 'info');
    });
  }

  // Limpar todas as imagens
  if (btnClearAllImages) {
    btnClearAllImages.addEventListener('click', () => {
      if (imageSlides.length === 0) return;
      if (confirm('Deseja remover todas as imagens do organizador?')) {
        imageSlides = [];
        renderImagesOrganizer();
        showToast('Todas as imagens foram removidas.', 'info');
      }
    });
  }

  // Botão "Novo Lote" no topo
  if (btnNewImagesTop) {
    btnNewImagesTop.addEventListener('click', () => {
      if (imageSlides.length > 0 && !confirm('Iniciar um novo lote? As imagens atuais serão limpas.')) {
        return;
      }
      imageSlides = [];
      renderImagesOrganizer();
    });
  }

  function updateImagesExportBtnLabel() {
    const fmt = imagesFormatSelect ? imagesFormatSelect.value : 'pptx';
    if (imagesMainBtnIcon && imagesMainBtnLabel) {
      if (fmt === 'pdf') {
        imagesMainBtnIcon.textContent = '📄';
        imagesMainBtnLabel.textContent = 'Gerar e Baixar Documento PDF (.pdf)';
      } else if (fmt === 'both') {
        imagesMainBtnIcon.textContent = '✨';
        imagesMainBtnLabel.textContent = 'Gerar e Baixar Ambos (.pptx + .pdf)';
      } else {
        imagesMainBtnIcon.textContent = '⚡';
        imagesMainBtnLabel.textContent = 'Gerar e Baixar PowerPoint (.pptx)';
      }
    }
    if (btnDownloadImagesTop) {
      if (fmt === 'pdf') {
        btnDownloadImagesTop.innerHTML = '<span>📄</span> Baixar PDF (.pdf)';
      } else if (fmt === 'both') {
        btnDownloadImagesTop.innerHTML = '<span>✨</span> Baixar Ambos (.pptx + .pdf)';
      } else {
        btnDownloadImagesTop.innerHTML = '<span>📥</span> Baixar PowerPoint (.pptx)';
      }
    }
  }

  if (imagesFormatSelect) {
    imagesFormatSelect.addEventListener('change', updateImagesExportBtnLabel);
  }

  // Geração e Exportação customizada (PPTX, PDF ou Ambos) para Módulo 3
  async function generateImagesExport(requestedFormat) {
    if (imageSlides.length === 0) {
      showToast('Adicione pelo menos uma imagem para gerar a apresentação.', 'error');
      return;
    }

    const formatChoice = requestedFormat || (imagesFormatSelect ? imagesFormatSelect.value : 'pptx');
    const aspectChoice = imagesAspectSelect ? imagesAspectSelect.value : '16x9';
    const fitChoice = imagesFitSelect ? imagesFitSelect.value : 'contain';
    const bgColor = imagesBgSelect ? imagesBgSelect.value : '000000';

    const timestamp = new Date().toISOString().slice(0, 10);
    const pptxFileName = `Apresentacao_Imagens_${timestamp}.pptx`;
    const pdfFileName = `Apresentacao_Imagens_${timestamp}.pdf`;

    if (btnGenerateImagesPptx) {
      btnGenerateImagesPptx.disabled = true;
      btnGenerateImagesPptx.innerHTML = '<span>⏳</span> Exportando Slides...';
    }
    if (imagesProgressContainer) {
      imagesProgressContainer.style.display = 'block';
      imagesProgressBar.style.width = '10%';
      imagesProgressPercent.textContent = '10%';
      imagesProgressStatus.textContent = 'Preparando exportação...';
    }

    try {
      const total = imageSlides.length;

      // 1. Exportar PPTX se solicitado
      if (formatChoice === 'pptx' || formatChoice === 'both') {
        if (typeof PptxGenJS === 'undefined') {
          throw new Error('Biblioteca PptxGenJS não carregada.');
        }

        const pptx = new PptxGenJS();
        if (aspectChoice === '4x3') {
          pptx.layout = 'LAYOUT_4x3';
        } else {
          pptx.layout = 'LAYOUT_16x9';
        }

        for (let i = 0; i < total; i++) {
          const slideData = imageSlides[i];
          const pct = Math.round(10 + ((i + 1) / total) * (formatChoice === 'both' ? 40 : 80));
          imagesProgressBar.style.width = `${pct}%`;
          imagesProgressPercent.textContent = `${pct}%`;
          imagesProgressStatus.textContent = `PowerPoint: slide ${i + 1} de ${total}...`;

          const slide = pptx.addSlide();
          slide.background = { color: bgColor };

          if (fitChoice === 'cover') {
            slide.addImage({ data: slideData.dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
          } else {
            slide.addImage({ data: slideData.dataUrl, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'contain', w: '100%', h: '100%' } });
          }
        }

        imagesGeneratedPptx = pptx;
        imagesPptxFileName = pptxFileName;
        await pptx.writeFile({ fileName: pptxFileName });
      }

      // 2. Exportar PDF se solicitado
      if (formatChoice === 'pdf' || formatChoice === 'both') {
        imagesProgressStatus.textContent = 'Gerando documento em PDF (.pdf)...';

        await generateSlidesPdfDoc({
          slides: imageSlides,
          aspectChoice,
          fitChoice,
          bgChoice: bgColor,
          fileName: pdfFileName,
          progressCallback: (cur, tot) => {
            const startPct = formatChoice === 'both' ? 55 : 10;
            const range = formatChoice === 'both' ? 40 : 85;
            const pct = Math.round(startPct + (cur / tot) * range);
            imagesProgressBar.style.width = `${pct}%`;
            imagesProgressPercent.textContent = `${pct}%`;
            imagesProgressStatus.textContent = `PDF: página ${cur} de ${tot}...`;
          }
        });
      }

      imagesProgressStatus.textContent = 'Concluído!';
      imagesProgressBar.style.width = '100%';
      imagesProgressPercent.textContent = '100%';

      if (formatChoice === 'both') {
        showToast(`🎉 Apresentação baixada em PPTX e PDF (${total} slides cada)!`, 'success');
      } else if (formatChoice === 'pdf') {
        showToast(`🎉 Documento PDF baixado com sucesso (${total} páginas)!`, 'success');
      } else {
        showToast(`🎉 Apresentação PPTX baixada com sucesso (${total} slides)!`, 'success');
      }

    } catch (err) {
      console.error('Erro na exportação de imagens:', err);
      showToast('Erro ao exportar: ' + err.message, 'error');
    } finally {
      if (btnGenerateImagesPptx) {
        btnGenerateImagesPptx.disabled = false;
        updateImagesExportBtnLabel();
      }
      if (imagesProgressContainer) {
        setTimeout(() => {
          imagesProgressContainer.style.display = 'none';
        }, 1500);
      }
    }
  }

  if (btnGenerateImagesPptx) {
    btnGenerateImagesPptx.addEventListener('click', () => generateImagesExport());
  }

  if (btnDownloadImagesTop) {
    btnDownloadImagesTop.addEventListener('click', () => generateImagesExport());
  }

  if (btnExportImagesPdf) {
    btnExportImagesPdf.addEventListener('click', () => generateImagesExport('pdf'));
  }

  if (btnExportImagesPptx) {
    btnExportImagesPptx.addEventListener('click', () => generateImagesExport('pptx'));
  }

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

  // ==========================================
  // GERENCIADOR DE TAREFAS EM ANDAMENTO (MÁX 3)
  // Sincronização em Nuvem: Celular ➔ Computador
  // ==========================================
  const MAX_ACTIVE_TASKS = 3;
  const btnOpenTasksPanel = document.getElementById('btn-open-tasks-panel');
  const tasksCounterBadge = document.getElementById('tasks-counter-badge');
  const drawerTasksCounterBadge = document.getElementById('drawer-tasks-counter-badge');
  const btnSaveCurrentTask = document.getElementById('btn-save-current-task');
  const tasksListContainer = document.getElementById('tasks-list-container');
  const tasksDrawerOverlay = document.getElementById('tasks-drawer-overlay');

  let cachedTasks = [];
  let firestoreDb = null;

  // Inicialização do Firebase Firestore (compat v10)
  const firebaseConfig = {
    apiKey: (typeof atob === 'function' ? atob("QUl6YVN5QnJjV1djRkppaUdETndtdEhmQzA2b24wN3lqVjAxWHZv") : ""),
    authDomain: "cifraceros.firebaseapp.com",
    projectId: "cifraceros",
    storageBucket: "cifraceros.firebasestorage.app",
    messagingSenderId: "64746643957",
    appId: "1:64746643957:web:fff80c22e795e1410180bc"
  };

  if (typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      firestoreDb = firebase.firestore();
    } catch(e) {
      console.warn('Firebase init fallback:', e);
    }
  }

  function getDeviceType() {
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile ? '📱 Celular' : '💻 PC';
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return '';
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return 'agora';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `há ${diffMin}m`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `há ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `há ${diffDays}d`;
    } catch(e) {
      return '';
    }
  }

  // Redimensionamento/compressão para respeitar limite do documento Firestore (1MB)
  function compressDataUrlForCloud(dataUrl, maxDim = 640, quality = 0.55) {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith('data:image')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // Sincronização em tempo real (onSnapshot) com fallback em localStorage
  function initTasksSync() {
    if (firestoreDb) {
      try {
        firestoreDb.collection('obnotion_active_tasks')
          .orderBy('updatedAt', 'desc')
          .limit(10)
          .onSnapshot((snapshot) => {
            const tasks = [];
            snapshot.forEach(doc => {
              tasks.push({ id: doc.id, ...doc.data() });
            });
            cachedTasks = tasks;
            try {
              localStorage.setItem('obnotion_cached_tasks', JSON.stringify(tasks));
            } catch(e) {}
            renderTasksList();
          }, (err) => {
            console.warn('Firestore onSnapshot fallback to local:', err);
            loadLocalTasks();
          });
        return;
      } catch(e) {
        console.warn('Firestore subscription error:', e);
      }
    }
    loadLocalTasks();
  }

  function loadLocalTasks() {
    try {
      const raw = localStorage.getItem('obnotion_cached_tasks');
      cachedTasks = raw ? JSON.parse(raw) : [];
    } catch(e) {
      cachedTasks = [];
    }
    renderTasksList();
  }

  function renderTasksList() {
    const count = cachedTasks.length;
    const countText = `${count}/${MAX_ACTIVE_TASKS}`;
    if (tasksCounterBadge) tasksCounterBadge.textContent = countText;
    if (drawerTasksCounterBadge) drawerTasksCounterBadge.textContent = countText;

    if (!tasksListContainer) return;

    if (count === 0) {
      tasksListContainer.innerHTML = `
        <div class="empty-tasks-msg">
          Nenhuma tarefa salva no momento.<br>
          Clique em <strong>Salvar Trabalho Atual</strong> para sincronizar com o PC ou Celular.
        </div>
      `;
      return;
    }

    tasksListContainer.innerHTML = '';
    cachedTasks.forEach(task => {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.innerHTML = `
        <div class="task-card-header">
          <div style="display:flex; align-items:center; gap:6px; min-width:0;">
            <span style="font-size:16px;">${task.moduleIcon || '📌'}</span>
            <strong class="task-card-title">${escapeHtml(task.title || 'Sem título')}</strong>
          </div>
          <button type="button" class="btn-clear" title="Excluir tarefa" onclick="window.obnotionDeleteTask('${task.id}', event)" style="color:var(--danger); font-size:14px; padding:2px 6px;">
            🗑️
          </button>
        </div>
        <div class="task-card-meta">
          <span class="task-module-pill">${escapeHtml(task.moduleName || 'Slides')} • ${task.slideCount || 0} slides</span>
          <span style="font-size:11px; color:var(--text-muted);">${escapeHtml(task.device || 'Nuvem')} • ${formatTimeAgo(task.updatedAt)}</span>
        </div>
        <div class="task-card-actions">
          <button type="button" class="btn btn-secondary btn-sm" style="width:100%; justify-content:center; font-size:12px; font-weight:600;" onclick="window.obnotionLoadTask('${task.id}')">
            <span>📂</span> Continuar Editando Aqui
          </button>
        </div>
      `;
      tasksListContainer.appendChild(card);
    });
  }

  // Salva o trabalho em andamento (com validação estrita de no máx 3)
  async function handleSaveCurrentTask() {
    // 1. Validação estrita do limite de 3 tarefas
    if (cachedTasks.length >= MAX_ACTIVE_TASKS) {
      showToast('⚠️ Limite de 3 tarefas atingido! Exclua uma tarefa para salvar nova.', 'error');
      alert(`⚠️ LIMITE DE 3 TAREFAS ATINGIDO!\n\nPara não sobrecarregar o Firebase e manter a Central sempre leve e rápida, é permitido ter no máximo 3 tarefas em andamento simultaneamente.\n\nPor favor, exclua ou conclua uma das 3 tarefas salvas na lista antes de guardar uma nova.`);
      return;
    }

    // 2. Extrai dados do módulo ativo
    let taskData = null;
    let defaultTitle = '';
    let slideCount = 0;
    let modName = '';
    let modIcon = '📌';

    if (currentActiveModule === 'images-to-pptx') {
      if (imageSlides.length === 0) {
        showToast('Nenhuma imagem adicionada para salvar.', 'error');
        return;
      }
      modName = 'Imagens / ZIP';
      modIcon = '🖼️';
      slideCount = imageSlides.length;
      defaultTitle = `Lote de Imagens (${slideCount} slides)`;

      // Otimiza imagens para caber no documento Firestore (<1MB)
      showToast('Compactando slides para sincronização em nuvem...', 'info');
      const optimizedSlides = [];
      for (const s of imageSlides) {
        const compUrl = await compressDataUrlForCloud(s.dataUrl, 640, 0.55);
        optimizedSlides.push({
          id: s.id,
          name: s.name,
          dataUrl: compUrl
        });
      }
      taskData = { slides: optimizedSlides };

    } else if (currentActiveModule === 'slidekiller') {
      const textVal = sermonTextInput ? sermonTextInput.value.trim() : '';
      if (currentSlides.length === 0 && !textVal) {
        showToast('Nenhum sermão ou slide montado para salvar.', 'error');
        return;
      }
      modName = 'Slide Killer';
      modIcon = '⚡';
      slideCount = currentSlides.length || 1;
      const fileName = (fileNameDisplay && fileNameDisplay.textContent) ? fileNameDisplay.textContent : 'Sermão';
      defaultTitle = `${fileName} (${slideCount} slides)`;
      taskData = {
        slides: currentSlides,
        inputText: textVal,
        fileName: fileName
      };

    } else if (currentActiveModule === 'pdf-to-pptx') {
      if (!directSlides || directSlides.length === 0) {
        showToast('Nenhum slide do PDF ou foto para salvar.', 'error');
        return;
      }
      modName = 'PDF ➔ PPTX';
      modIcon = '📄';
      slideCount = directSlides.length;
      defaultTitle = (currentDirectFile ? currentDirectFile.name.replace(/\.[^/.]+$/, '') : 'PDF Direto') + ` (${slideCount} slides)`;
      
      showToast('Compactando slides para sincronização em nuvem...', 'info');
      const optimizedSlides = [];
      for (const s of directSlides) {
        const compUrl = await compressDataUrlForCloud(s.imgData, 640, 0.55);
        optimizedSlides.push({
          id: s.id,
          title: s.title,
          type: s.type,
          imgData: compUrl,
          ratio: s.ratio
        });
      }
      taskData = { slides: optimizedSlides };
    } else {
      showToast('Nenhum conteúdo elegível para salvar neste módulo.', 'error');
      return;
    }

    // 3. Nome da tarefa (com valor padrão inteligente)
    const taskTitle = prompt('Nome para identificar esta tarefa no Celular ou PC:', defaultTitle);
    if (taskTitle === null) return; // Usuário cancelou

    const taskId = 'task_' + Date.now();
    const newTask = {
      id: taskId,
      title: taskTitle.trim() || defaultTitle,
      module: currentActiveModule,
      moduleName: modName,
      moduleIcon: modIcon,
      slideCount: slideCount,
      device: getDeviceType(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: taskData
    };

    try {
      if (btnSaveCurrentTask) {
        btnSaveCurrentTask.disabled = true;
        btnSaveCurrentTask.innerHTML = '<span>⏳</span> Salvando na Nuvem...';
      }

      if (firestoreDb) {
        await firestoreDb.collection('obnotion_active_tasks').doc(taskId).set(newTask);
      } else {
        cachedTasks.unshift(newTask);
        if (cachedTasks.length > MAX_ACTIVE_TASKS) cachedTasks = cachedTasks.slice(0, MAX_ACTIVE_TASKS);
        localStorage.setItem('obnotion_cached_tasks', JSON.stringify(cachedTasks));
        renderTasksList();
      }

      showToast('✅ Tarefa salva na nuvem! Você pode abrir no PC ou Celular a qualquer momento.', 'success');
    } catch(err) {
      console.warn('Erro ao salvar no Firestore (possível payload grande), salvando em cache local:', err);
      cachedTasks.unshift(newTask);
      if (cachedTasks.length > MAX_ACTIVE_TASKS) cachedTasks = cachedTasks.slice(0, MAX_ACTIVE_TASKS);
      try {
        localStorage.setItem('obnotion_cached_tasks', JSON.stringify(cachedTasks));
      } catch(e) {}
      renderTasksList();
      showToast('✅ Tarefa salva localmente neste dispositivo!', 'success');
    } finally {
      if (btnSaveCurrentTask) {
        btnSaveCurrentTask.disabled = false;
        btnSaveCurrentTask.innerHTML = '<span>💾</span> Salvar Trabalho Atual na Nuvem';
      }
    }
  }

  // Carrega a tarefa selecionada
  async function loadTask(taskId) {
    const task = cachedTasks.find(t => t.id === taskId);
    if (!task) {
      showToast('Tarefa não encontrada.', 'error');
      return;
    }

    switchModule(task.module);

    if (task.module === 'images-to-pptx') {
      if (task.data && task.data.slides) {
        imageSlides = task.data.slides;
        renderImagesOrganizer();
        showToast(`Tarefa "${task.title}" carregada com ${imageSlides.length} slides!`, 'success');
      }
    } else if (task.module === 'slidekiller') {
      if (task.data) {
        if (task.data.slides && task.data.slides.length > 0) {
          currentSlides = task.data.slides;
          if (inputSection) inputSection.style.display = 'none';
          if (resultsSection) resultsSection.style.display = 'block';
          if (btnDownloadTop) btnDownloadTop.style.display = 'inline-flex';
          renderResults();
        } else if (task.data.inputText && sermonTextInput) {
          sermonTextInput.value = task.data.inputText;
          if (inputSection) inputSection.style.display = 'block';
          if (resultsSection) resultsSection.style.display = 'none';
        }
        showToast(`Tarefa "${task.title}" carregada com sucesso!`, 'success');
      }
    } else if (task.module === 'pdf-to-pptx') {
      if (task.data && (task.data.slides || task.data.pages)) {
        const items = task.data.slides || task.data.pages;
        directSlides = items.map((item, idx) => ({
          id: item.id || ('slide_' + Date.now() + '_' + idx),
          title: item.title || `Página ${item.pageNum || idx + 1}`,
          type: item.type || 'pdf',
          imgData: item.imgData,
          ratio: item.ratio || (16 / 9)
        }));
        renderDirectOrganizer();
        showToast(`Tarefa "${task.title}" carregada com ${directSlides.length} slides!`, 'success');
      }
    }

    window.toggleTasksDrawer(false);
  }

  // Exclui a tarefa liberando espaço no limite de 3
  async function deleteTask(taskId, evt) {
    if (evt) evt.stopPropagation();
    if (!confirm('Deseja excluir esta tarefa e liberar 1 vaga na nuvem?')) return;

    try {
      if (firestoreDb) {
        await firestoreDb.collection('obnotion_active_tasks').doc(taskId).delete();
      }
      cachedTasks = cachedTasks.filter(t => t.id !== taskId);
      try {
        localStorage.setItem('obnotion_cached_tasks', JSON.stringify(cachedTasks));
      } catch(e) {}
      renderTasksList();
      showToast('🗑️ Tarefa excluída. Vaga liberada na nuvem!', 'info');
    } catch(err) {
      console.error('Erro ao excluir tarefa:', err);
      showToast('Erro ao excluir: ' + err.message, 'error');
    }
  }

  // Drawer toggle
  window.toggleTasksDrawer = function(show) {
    const overlay = document.getElementById('tasks-drawer-overlay');
    if (overlay) {
      if (show) {
        overlay.classList.add('open');
      } else {
        overlay.classList.remove('open');
      }
    }
  };

  window.obnotionLoadTask = loadTask;
  window.obnotionDeleteTask = deleteTask;

  if (btnOpenTasksPanel) {
    btnOpenTasksPanel.addEventListener('click', () => window.toggleTasksDrawer(true));
  }

  if (btnSaveCurrentTask) {
    btnSaveCurrentTask.addEventListener('click', handleSaveCurrentTask);
  }

  // Inicia sincronização
  initTasksSync();

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
