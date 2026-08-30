document.addEventListener('DOMContentLoaded', () => {
  // Elements
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

  // Tabs
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

  pdfFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  btnClearFile.addEventListener('click', (e) => {
    e.stopPropagation();
    currentFile = null;
    pdfFileInput.value = '';
    selectedFileInfo.style.display = 'none';
  });

  function handleFileSelected(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Por favor, selecione um arquivo .PDF válido.', 'error');
      return;
    }
    currentFile = file;
    fileNameDisplay.textContent = file.name;
    selectedFileInfo.style.display = 'inline-flex';
  }

  // Load Templates
  fetch('/api/slides/templates')
    .then(res => res.json())
    .then(data => {
      if (data && data.templates) {
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

  // Generate Action
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

  // Render results
  function renderResults() {
    inputSection.style.display = 'none';
    resultsSection.style.display = 'block';
    btnDownloadTop.style.display = 'inline-flex';

    slideCountBadge.textContent = `${currentSlides.length} slides`;
    slidesGrid.innerHTML = '';

    const bgUrl = templateSelect.value || '/assets/church_sermon_bg.png';

    currentSlides.forEach((slide, index) => {
      const card = document.createElement('div');
      card.className = 'slide-card';

      const fullText = (slide.runs || []).map(r => r.text).join('');
      const previewHtml = (slide.runs || []).map(r => {
        return r.highlight ? `<span class="highlight">${escapeHtml(r.text)}</span>` : escapeHtml(r.text);
      }).join('');

      card.innerHTML = `
        <div class="slide-preview" style="background-image: url('${bgUrl}');">
          <span class="slide-card-badge">Slide ${index + 1} • ${slide.type || 'versículo'}</span>
          <div class="slide-preview-text">${previewHtml}</div>
          ${slide.reference ? `<div class="slide-preview-ref">${escapeHtml(slide.reference)}</div>` : ''}
        </div>
        <div class="slide-editor">
          <textarea class="slide-text-edit" data-index="${index}" placeholder="Texto do slide...">${escapeHtml(fullText)}</textarea>
          <div class="slide-editor-row">
            <input type="text" class="slide-ref-edit" data-index="${index}" placeholder="Referência (ex: Mateus 6:19)" value="${escapeHtml(slide.reference || '')}">
            <button class="btn-delete-slide" data-index="${index}">🗑️ Excluir</button>
          </div>
        </div>
      `;

      // Event listeners for editor
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

  // Add new slide
  btnAddSlide.addEventListener('click', () => {
    currentSlides.push({
      type: 'verse',
      reference: 'Referência Bíblica',
      runs: [{ text: '“Insira o texto do versículo ou tópico aqui.”', highlight: false }]
    });
    renderResults();
  });

  // Rebuild & Save
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
          selectedBg: templateSelect.value
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

  // Download PPTX
  function triggerDownload() {
    if (currentDownloadUrl) {
      window.open(currentDownloadUrl, '_blank');
    } else {
      showToast('Nenhum arquivo para baixar.', 'error');
    }
  }

  btnDownloadTop.addEventListener('click', triggerDownload);
  btnDownloadMain.addEventListener('click', triggerDownload);

  // New Presentation
  btnNewPresentation.addEventListener('click', () => {
    inputSection.style.display = 'block';
    resultsSection.style.display = 'none';
    btnDownloadTop.style.display = 'none';
    currentFile = null;
    currentSlides = [];
    currentDownloadUrl = null;
    pdfFileInput.value = '';
    sermonTextInput.value = '';
    selectedFileInfo.style.display = 'none';
  });

  // Utility
  function showToast(msg, type = 'info') {
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
