document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // NAVEGAÇÃO DE MÓDULOS (CENTRAL MULTIMÍDIA)
  // ==========================================
  const navModuleBtns = document.querySelectorAll('.nav-module-btn');
  const moduleViews = {
    'slidekiller': document.getElementById('view-slidekiller'),
    'video-editor': document.getElementById('view-video-editor')
  };
  const moduleActions = {
    'slidekiller': document.getElementById('actions-slidekiller'),
    'video-editor': document.getElementById('actions-video-editor')
  };

  navModuleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetModule = btn.dataset.module;
      if (!targetModule || !moduleViews[targetModule]) return;

      // Atualiza botões
      navModuleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Alterna visualização dos módulos
      Object.keys(moduleViews).forEach(key => {
        if (moduleViews[key]) {
          moduleViews[key].classList.toggle('active', key === targetModule);
        }
        if (moduleActions[key]) {
          moduleActions[key].style.display = (key === targetModule) ? 'flex' : 'none';
        }
      });
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
