document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // SPLASH SCREEN & AVISO DE PRIVACIDADE OFFLINE
  // ==========================================
  const splashScreen = document.getElementById('app-splash-screen');
  const privacyModal = document.getElementById('privacy-notice-modal');
  const checkDontShowPrivacy = document.getElementById('check-dont-show-privacy');
  const btnConfirmPrivacy = document.getElementById('btn-confirm-privacy');

  function initAppSplashAndPrivacy() {
    if (!splashScreen) return;

    // Exibe splash inicial por 5 segundos e transiciona suavemente
    setTimeout(() => {
      splashScreen.classList.add('splash-fade-out');
      setTimeout(() => {
        splashScreen.style.display = 'none';

        // Se o usuário ainda não dispensou o aviso de privacidade, exibe o modal
        const privacyDismissed = localStorage.getItem('slidekiller_privacy_dismissed');
        if (!privacyDismissed && privacyModal) {
          privacyModal.style.display = 'flex';
        }
      }, 650);
    }, 5000);

    if (btnConfirmPrivacy && privacyModal) {
      btnConfirmPrivacy.addEventListener('click', () => {
        if (checkDontShowPrivacy && checkDontShowPrivacy.checked) {
          localStorage.setItem('slidekiller_privacy_dismissed', 'true');
        }
        privacyModal.style.opacity = '0';
        privacyModal.style.transition = 'opacity 0.25s ease';
        setTimeout(() => {
          privacyModal.style.display = 'none';
        }, 250);
      });
    }
  }

  initAppSplashAndPrivacy();

  const isCapacitorNative = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  const isNoBackendEnvironment = isCapacitorNative
    || window.location.hostname.includes('github.io')
    || window.location.protocol === 'file:'
    || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !window.location.port);

  // Se estiver rodando dentro do aplicativo Android nativo (Capacitor), oculta o botão de download de APK (inclusive em Tablets deitados)
  if (isCapacitorNative) {
    const btnApk = document.getElementById('btn-download-apk-desktop');
    if (btnApk) btnApk.style.setProperty('display', 'none', 'important');
    document.body.classList.add('is-native-app');
  }

  // ==========================================
  // NAVEGAÇÃO DE MÓDULOS (CENTRAL MULTIMÍDIA)
  // ==========================================
  const navModuleBtns = document.querySelectorAll('.nav-module-btn');
  const moduleViews = {
    'slidekiller': document.getElementById('view-slidekiller'),
    'pdf-to-pptx': document.getElementById('view-pdf-to-pptx'),
    'images-to-pptx': document.getElementById('view-images-to-pptx'),
  };
  const moduleActions = {
    'slidekiller': document.getElementById('actions-slidekiller'),
    'pdf-to-pptx': document.getElementById('actions-pdf-to-pptx'),
    'images-to-pptx': document.getElementById('actions-images-to-pptx'),
  };

  let currentActiveModule = 'slidekiller';

  // Conjuntos de seleção em lote compartilhados
  // selectedDirectSlideIds definido no escopo principal
  // selectedImageSlideIds definido no escopo principal

  // ==========================================
  // BARRA FLUTUANTE DE SELEÇÃO EM LOTE (OVERLAY)
  // ==========================================
  const selectionFloatingBar = document.getElementById('selectionFloatingBar');
  const selectionBarCount = document.getElementById('selection-bar-count');
  const selectionBarText = document.getElementById('selection-bar-text');
  const selectionBarDeleteLabel = document.getElementById('selection-bar-delete-label');
  const selectionBarBtnCancel = document.getElementById('selection-bar-btn-cancel');
  const selectionBarBtnDelete = document.getElementById('selection-bar-btn-delete');

  function updateSelectionFloatingBar() {
    if (!selectionFloatingBar) return;

    let count = 0;
    if (currentActiveModule === 'pdf-to-pptx') {
      count = (typeof selectedDirectSlideIds !== 'undefined' && selectedDirectSlideIds) ? selectedDirectSlideIds.size : 0;
    } else if (currentActiveModule === 'images-to-pptx') {
      count = (typeof selectedImageSlideIds !== 'undefined' && selectedImageSlideIds) ? selectedImageSlideIds.size : 0;
    }

    if (count > 0) {
      if (selectionBarCount) selectionBarCount.textContent = count;
      if (selectionBarText) selectionBarText.textContent = count === 1 ? 'slide selecionado' : 'slides selecionados';
      if (selectionBarDeleteLabel) selectionBarDeleteLabel.textContent = `Apagar (${count})`;
      selectionFloatingBar.style.display = 'flex';
      requestAnimationFrame(() => {
        selectionFloatingBar.classList.add('active');
      });
    } else {
      selectionFloatingBar.classList.remove('active');
      setTimeout(() => {
        if (!selectionFloatingBar.classList.contains('active')) {
          selectionFloatingBar.style.display = 'none';
        }
      }, 200);
    }
  }
  window.updateSelectionFloatingBar = updateSelectionFloatingBar;

  if (selectionBarBtnCancel) {
    selectionBarBtnCancel.addEventListener('click', () => {
      if (currentActiveModule === 'pdf-to-pptx') {
        if (typeof selectedDirectSlideIds !== 'undefined' && selectedDirectSlideIds) selectedDirectSlideIds.clear();
        if (typeof renderDirectOrganizer === 'function') renderDirectOrganizer();
      } else if (currentActiveModule === 'images-to-pptx') {
        if (typeof selectedImageSlideIds !== 'undefined' && selectedImageSlideIds) selectedImageSlideIds.clear();
        if (typeof renderImagesOrganizer === 'function') renderImagesOrganizer();
      }
      updateSelectionFloatingBar();
    });
  }

  if (selectionBarBtnDelete) {
    selectionBarBtnDelete.addEventListener('click', () => {
      if (currentActiveModule === 'pdf-to-pptx') {
        if (typeof deleteSelectedDirectSlides === 'function') deleteSelectedDirectSlides();
      } else if (currentActiveModule === 'images-to-pptx') {
        if (typeof deleteSelectedImageSlides === 'function') deleteSelectedImageSlides();
      }
    });
  }

  function switchModule(targetModule) {
    if (!targetModule || !moduleViews[targetModule]) return;
    currentActiveModule = targetModule;
    if (targetModule === 'slidekiller') {
      setTimeout(() => {
        const activeTabBtn = mainTabs ? mainTabs.querySelector('.tab-btn.active') : null;
        if (activeTabBtn) moveTabGelPill(activeTabBtn, true);
      }, 50);
    }

    // Atualiza botões da navegação
    navModuleBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.module === targetModule);
    });

    if (typeof updateSelectionFloatingBar === "function") updateSelectionFloatingBar();
    // Atualiza botões da navegação mobile inferior
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn[data-target-module]');
    mobileNavBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.targetModule === targetModule);
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
      moveNavGelPill(btn);   // desliza a pílula gel
    });
  });

  // Ações da Barra de Navegação Inferior (Mobile App)
  const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn[data-target-module]');
  mobileNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.targetModule;
      switchModule(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // ==========================================
  // ACTION SHEET CONTROL (OPÇÕES NATIVAS DO SLIDE)
  // ==========================================
  let activeSheetOptions = null;

  function openSlideActionSheet(options) {
    activeSheetOptions = options;
    const overlay = document.getElementById('slideActionSheet');
    const imgEl = document.getElementById('sheet-slide-img');
    const badgeEl = document.getElementById('sheet-slide-badge');
    const titleEl = document.getElementById('sheet-slide-title');

    if (!overlay) return;

    const slide = options.slide;
    const index = options.index;

    if (imgEl) imgEl.src = slide.imgData || slide.dataUrl || '';
    if (badgeEl) badgeEl.textContent = `Slide #${index + 1} de ${options.total}`;
    if (titleEl) titleEl.textContent = slide.title || slide.name || `Slide ${index + 1}`;

    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  function closeSlideActionSheet() {
    const overlay = document.getElementById('slideActionSheet');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.style.display = 'none';
      activeSheetOptions = null;
    }, 280);
  }

  const slideActionSheetOverlay = document.getElementById('slideActionSheet');
  const btnCloseSlideSheet = document.getElementById('btn-close-slide-sheet');
  const sheetBtnEnhanceAi = document.getElementById('sheet-btn-enhance-ai');
  const sheetBtnReplace = document.getElementById('sheet-btn-replace');
  const sheetBtnInsertAfter = document.getElementById('sheet-btn-insert-after');
  const sheetBtnDlScreen = document.getElementById('sheet-btn-dl-screen');
  const sheetBtnDlOrig = document.getElementById('sheet-btn-dl-orig');
  const sheetBtnDelete = document.getElementById('sheet-btn-delete');

  if (slideActionSheetOverlay) {
    slideActionSheetOverlay.addEventListener('click', (e) => {
      if (e.target === slideActionSheetOverlay) closeSlideActionSheet();
    });
  }

  if (btnCloseSlideSheet) {
    btnCloseSlideSheet.addEventListener('click', closeSlideActionSheet);
  }

  if (sheetBtnEnhanceAi) {
    sheetBtnEnhanceAi.addEventListener('click', () => {
      if (activeSheetOptions && activeSheetOptions.onEnhanceAi) {
        const fn = activeSheetOptions.onEnhanceAi;
        closeSlideActionSheet();
        setTimeout(fn, 120);
      }
    });
  }

  if (sheetBtnReplace) {
    sheetBtnReplace.addEventListener('click', () => {
      if (activeSheetOptions && activeSheetOptions.onReplace) {
        const fn = activeSheetOptions.onReplace;
        closeSlideActionSheet();
        setTimeout(fn, 120);
      }
    });
  }

  if (sheetBtnInsertAfter) {
    sheetBtnInsertAfter.addEventListener('click', () => {
      if (activeSheetOptions && activeSheetOptions.onInsertAfter) {
        const fn = activeSheetOptions.onInsertAfter;
        closeSlideActionSheet();
        setTimeout(fn, 120);
      }
    });
  }

  if (sheetBtnDlScreen) {
    sheetBtnDlScreen.addEventListener('click', () => {
      if (activeSheetOptions && activeSheetOptions.onDownloadScreen) {
        const fn = activeSheetOptions.onDownloadScreen;
        closeSlideActionSheet();
        fn();
      }
    });
  }

  if (sheetBtnDlOrig) {
    sheetBtnDlOrig.addEventListener('click', () => {
      if (activeSheetOptions && activeSheetOptions.onDownloadOrig) {
        const fn = activeSheetOptions.onDownloadOrig;
        closeSlideActionSheet();
        fn();
      }
    });
  }

  if (sheetBtnDelete) {
    sheetBtnDelete.addEventListener('click', () => {
      if (activeSheetOptions && activeSheetOptions.onDelete) {
        const fn = activeSheetOptions.onDelete;
        closeSlideActionSheet();
        setTimeout(fn, 120);
      }
    });
  }

  // ==========================================

  
  // ==========================================
  // AUTO-SCROLL E TOUCH DRAG & DROP (MOBILE REORDER)
  // Permite manter pressionado para arrastar slides e auto-rolar no topo / rodapé
  // ==========================================
  let touchAutoScrollRaf = null;
  let touchAutoScrollSpeed = 0;

  function runAutoScrollStep() {
    if (touchAutoScrollSpeed !== 0) {
      window.scrollBy(0, touchAutoScrollSpeed);
      touchAutoScrollRaf = requestAnimationFrame(runAutoScrollStep);
    } else {
      touchAutoScrollRaf = null;
    }
  }

  function setTouchAutoScroll(speed) {
    touchAutoScrollSpeed = speed;
    if (speed !== 0 && !touchAutoScrollRaf) {
      touchAutoScrollRaf = requestAnimationFrame(runAutoScrollStep);
    } else if (speed === 0 && touchAutoScrollRaf) {
      cancelAnimationFrame(touchAutoScrollRaf);
      touchAutoScrollRaf = null;
    }
  }

  function attachTouchDragAndDrop(card, index, onMove, cardSelector = '.image-slide-card') {
    card.dataset.index = String(index);

    let touchTimer = null;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    card.addEventListener('touchstart', (e) => {
      // Se tocar em botões de ação, inputs ou campos de texto/edição, não ativa o arraste
      if (e.target.closest('button, input, textarea, label, a, .btn-card-more, .btn-card-delete, .btn-card-reorder, .slide-text-edit, .slide-ref-edit')) {
        return;
      }

      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;

      touchTimer = setTimeout(() => {
        isDragging = true;
        card.classList.add('touch-dragging');
        if (navigator.vibrate) navigator.vibrate(40);
      }, 220); // 220ms de toque contínuo (long-press) ativa o modo de arraste
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const clientX = touch.clientX;
      const clientY = touch.clientY;

      if (!isDragging) {
        // Se movimentou antes dos 220ms, usuário está apenas rolando a página normalmente
        const moveDist = Math.hypot(clientX - startX, clientY - startY);
        if (moveDist > 10) {
          clearTimeout(touchTimer);
        }
        return;
      }

      // Impede o scroll nativo enquanto arrasta o card
      if (e.cancelable) e.preventDefault();

      // AUTO-SCROLL: Topo (próximo ao cabeçalho) e Rodapé (próximo à barra de navegação)
      const topThreshold = 100;
      const bottomThreshold = window.innerHeight - 90;

      if (clientY < topThreshold) {
        // Desliza suavemente para cima (quanto mais perto do topo, mais rápido)
        const factor = Math.min(22, Math.max(5, Math.round((topThreshold - clientY) / 2.5)));
        setTouchAutoScroll(-factor);
      } else if (clientY > bottomThreshold) {
        // Desliza suavemente para baixo (quanto mais perto do rodapé, mais rápido)
        const factor = Math.min(22, Math.max(5, Math.round((clientY - bottomThreshold) / 2.5)));
        setTouchAutoScroll(factor);
      } else {
        setTouchAutoScroll(0);
      }

      // Detecta sobre qual card o dedo está passando
      const prevPointer = card.style.pointerEvents;
      card.style.pointerEvents = 'none';
      const elUnder = document.elementFromPoint(clientX, clientY);
      card.style.pointerEvents = prevPointer;

      const targetCard = elUnder ? elUnder.closest(cardSelector) : null;
      document.querySelectorAll(cardSelector + '.drag-over').forEach(c => {
        if (c !== targetCard) c.classList.remove('drag-over');
      });

      if (targetCard && targetCard !== card) {
        targetCard.classList.add('drag-over');
      }
    }, { passive: false });

    const handleTouchEnd = () => {
      clearTimeout(touchTimer);
      setTouchAutoScroll(0);

      if (isDragging) {
        isDragging = false;
        card.classList.remove('touch-dragging');

        const targetCard = document.querySelector(cardSelector + '.drag-over');
        if (targetCard) {
          targetCard.classList.remove('drag-over');
          const targetIndex = parseInt(targetCard.dataset.index, 10);
          if (!isNaN(targetIndex) && targetIndex !== index) {
            if (navigator.vibrate) navigator.vibrate([25, 35, 25]);
            onMove(index, targetIndex);
          }
        }
      }
    };

    card.addEventListener('touchend', handleTouchEnd);
    card.addEventListener('touchcancel', handleTouchEnd);
  }

  // PROTEÇÃO GLOBAL DE ARRASTE NO PC
  // Impede que o navegador abra o PDF em tela cheia ao soltar no site e roteia para o módulo ativo
  // ==========================================
  ['dragenter', 'dragover'].forEach(name => {
    window.addEventListener(name, (e) => {
      e.preventDefault();
    }, false);
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
  }, false);

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0) {
      handleGlobalFileDrop(files);
    }
  }, false);

  function handleGlobalFileDrop(files) {
    if (!files || files.length === 0) return;
    const firstFile = files[0];
    const ext = firstFile.name.toLowerCase().split('.').pop();

    if (currentActiveModule === 'slidekiller') {
      if (activeSlideKillerTab === 'tab-images-ocr') {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          handleVerseImagesAdded(imageFiles);
          return;
        }
      }
      if (ext === 'pdf') {
        handleFileSelected(firstFile);
      } else {
        showToast('Neste módulo, por favor anexe um arquivo .PDF de sermão.', 'error');
      }
    } else if (currentActiveModule === 'pdf-to-pptx') {
      const btnRev = document.getElementById('btn-submode-pptx-reverse');
      const isReverse = btnRev && btnRev.classList.contains('active');
      if (isReverse) {
        if (ext === 'pptx') {
          handleReversePptxFileSelected(firstFile);
        } else {
          showToast('No modo inverso, por favor anexe um arquivo .PPTX.', 'error');
        }
      } else {
        if (ext === 'pdf') {
          handleDirectFileSelected(firstFile);
        } else {
          showToast('No modo direto, por favor anexe um arquivo .PDF.', 'error');
        }
      }
    } else if (currentActiveModule === 'images-to-pptx') {
      processIncomingFiles(Array.from(files));
    }
  }

  // ──────────────────────────────────────────────────
  // GEL PILL — Navegação topo
  // ──────────────────────────────────────────────────
  const navGelPill = document.getElementById('nav-gel-pill');
  const hubNav     = document.getElementById('hub-nav');

  function moveNavGelPill(targetBtn, instant) {
    if (!navGelPill || !hubNav || !targetBtn) return;
    const navRect = hubNav.getBoundingClientRect();
    const btnRect = targetBtn.getBoundingClientRect();
    const left  = btnRect.left - navRect.left;
    const width = btnRect.width;
    if (instant) {
      navGelPill.style.transition = 'none';
      navGelPill.style.left  = left  + 'px';
      navGelPill.style.width = width + 'px';
      // Restaura transição após frame
      requestAnimationFrame(() => {
        navGelPill.style.transition = '';
      });
    } else {
      navGelPill.style.left  = left  + 'px';
      navGelPill.style.width = width + 'px';
    }
  }

  // Hover: pré-visualização translúcida da pílula
  navModuleBtns.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('active')) {
        navGelPill.style.opacity = '0.45';
        moveNavGelPill(btn);
      }
    });
    btn.addEventListener('mouseleave', () => {
      navGelPill.style.opacity = '1';
      // Volta para o botão ativo
      const activeBtn = hubNav.querySelector('.nav-module-btn.active');
      if (activeBtn) moveNavGelPill(activeBtn);
    });
  });

  // Posiciona a pílula no botão ativo ao carregar (instantâneo)
  const initialNavBtn = hubNav ? hubNav.querySelector('.nav-module-btn.active') : null;
  if (initialNavBtn) moveNavGelPill(initialNavBtn, true);

  // ==========================================
  // MÓDULO 1: SLIDE KILLER
  // ==========================================
  const tabBtns = document.querySelectorAll('#main-tabs .tab-btn');
  const tabContents = document.querySelectorAll('#view-slidekiller .tab-content');
  const dropzone = document.getElementById('dropzone');
  const pdfFileInput = document.getElementById('pdf-file-input');
  const selectedFileInfo = document.getElementById('selected-file-info');
  const fileNameDisplay = document.getElementById('file-name-display');
  const btnClearFile = document.getElementById('btn-clear-file');
  const sermonTextInput = document.getElementById('sermon-text-input');
  const templateSelect = document.getElementById('template-select');
  const checkUseAi = document.getElementById('check-use-ai');
  const btnGenerate = document.getElementById('btn-generate');

  // Elementos do novo modo IA Vision (Fotos de Slides / Versículos)
  const dropzoneOcr = document.getElementById('dropzone-ocr');
  const verseImagesInput = document.getElementById('verse-images-input');
  const verseImagesContainer = document.getElementById('verse-images-container');
  const verseImagesThumbnailsGrid = document.getElementById('verse-images-thumbnails-grid');
  const btnAddMoreVerseImages = document.getElementById('btn-add-more-verse-images');
  const btnClearVerseImages = document.getElementById('btn-clear-verse-images');
  const optionBibleVersion = document.getElementById('option-bible-version');
  const bibleVersionSelect = document.getElementById('bible-version-select');
  const optionUseAiCheck = document.getElementById('option-use-ai-check');

  const aiOcrProgressContainer = document.getElementById('ai-ocr-progress-container');
  const aiOcrProgressBar = document.getElementById('ai-ocr-progress-bar');
  const aiOcrProgressPercent = document.getElementById('ai-ocr-progress-percent');
  const aiOcrProgressStatus = document.getElementById('ai-ocr-progress-status');

  const btnDownloadPdfSk = document.getElementById('btn-download-pdf-sk');
  const btnDownloadBothSk = document.getElementById('btn-download-both-sk');
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

  // Elementos para Fundo Personalizado
  const btnAttachCustomBg = document.getElementById('btn-attach-custom-bg');
  const customBgInput = document.getElementById('custom-bg-input');
  const customBgPreviewBadge = document.getElementById('custom-bg-preview-badge');
  const customBgThumb = document.getElementById('custom-bg-thumb');
  const customBgFilename = document.getElementById('custom-bg-filename');
  const btnRemoveCustomBg = document.getElementById('btn-remove-custom-bg');
  const btnChangeBgResults = document.getElementById('btn-change-bg-results');
  // ========================================================
  // TIPOGRAFIA & FONTES PRINCIPAIS PARA SLIDES (ESTILO DA FOTO)
  // ========================================================
  const CHURCH_FONTS = {
    'bahnschrift_semibold_condensed': {
      id: 'bahnschrift_semibold_condensed',
      name: 'Bahnschrift SemiBold Condensed (Padrão Oficial Igreja)',
      cssFamily: "'Bahnschrift SemiBold Condensed', 'Bahnschrift', 'Roboto Condensed', 'Arial Narrow', sans-serif",
      pptxFontFace: 'Bahnschrift SemiBold Condensed',
      fontWeight: '600',
      letterSpacing: '0',
      lineHeight: '1.20'
    },
    'impact': {
      id: 'impact',
      name: 'Impact / Anton (Forte & Marcante)',
      cssFamily: "'Anton', 'Impact', 'Arial Black', sans-serif",
      pptxFontFace: 'Impact',
      fontWeight: '700',
      letterSpacing: '-0.01em',
      lineHeight: '1.22'
    },
    'oswald': {
      id: 'oswald',
      name: 'Oswald (Elegante Hillsong / Bethel)',
      cssFamily: "'Oswald', sans-serif",
      pptxFontFace: 'Oswald',
      fontWeight: '700',
      letterSpacing: '0.01em',
      lineHeight: '1.28'
    },
    'bebas': {
      id: 'bebas',
      name: 'Bebas Neue (Display Caixa Alta)',
      cssFamily: "'Bebas Neue', 'Impact', sans-serif",
      pptxFontFace: 'Bebas Neue',
      fontWeight: '400',
      letterSpacing: '0.04em',
      lineHeight: '1.18'
    },
    'montserrat': {
      id: 'montserrat',
      name: 'Montserrat (Moderna Black)',
      cssFamily: "'Montserrat', sans-serif",
      pptxFontFace: 'Montserrat Black',
      fontWeight: '800',
      letterSpacing: '-0.02em',
      lineHeight: '1.25'
    },
    'roboto_condensed': {
      id: 'roboto_condensed',
      name: 'Roboto Condensed (Clean & Legível)',
      cssFamily: "'Roboto Condensed', sans-serif",
      pptxFontFace: 'Roboto Condensed',
      fontWeight: '700',
      letterSpacing: '0',
      lineHeight: '1.25'
    },
    'barlow_condensed': {
      id: 'barlow_condensed',
      name: 'Barlow Condensed (Dinâmica)',
      cssFamily: "'Barlow Condensed', sans-serif",
      pptxFontFace: 'Barlow Condensed',
      fontWeight: '700',
      letterSpacing: '0.01em',
      lineHeight: '1.22'
    },
    'arial_black': {
      id: 'arial_black',
      name: 'Arial Black (Clássica Forte)',
      cssFamily: "'Arial Black', sans-serif",
      pptxFontFace: 'Arial Black',
      fontWeight: '900',
      letterSpacing: '-0.01em',
      lineHeight: '1.25'
    },
    'cinzel': {
      id: 'cinzel',
      name: '🏛️ Cinzel Nobre (Clássico Romano Imperial)',
      cssFamily: "'Cinzel', 'Times New Roman', Georgia, serif",
      pptxFontFace: 'Cinzel Bold',
      fontWeight: '700',
      letterSpacing: '0.02em',
      lineHeight: '1.25'
    }
  };

  const fontSelect = document.getElementById('font-select');
  const resultsFontSelect = document.getElementById('results-font-select');
  const alignSelect = document.getElementById('align-select');
  const resultsAlignSelect = document.getElementById('results-align-select');

  let currentFile = null;
  let currentSlides = [];
  let currentDownloadUrl = null;
  let sermonImageFiles = [];
  let activeSlideKillerTab = 'tab-pdf';
  let customBgDataUrl = null;
  let customBgFile = null;
  let customBgServerUrl = null;

  let currentSelectedFont = localStorage.getItem('slidekiller_church_font');
  if (!localStorage.getItem('slidekiller_font_migrated_v2')) {
    if (!currentSelectedFont || currentSelectedFont === 'impact') {
      currentSelectedFont = 'bahnschrift_semibold_condensed';
      localStorage.setItem('slidekiller_church_font', 'bahnschrift_semibold_condensed');
    }
    localStorage.setItem('slidekiller_font_migrated_v2', '1');
  }
  if (!currentSelectedFont || !CHURCH_FONTS[currentSelectedFont]) {
    currentSelectedFont = 'bahnschrift_semibold_condensed';
    localStorage.setItem('slidekiller_church_font', 'bahnschrift_semibold_condensed');
  }
  let currentSelectedAlign = localStorage.getItem('slidekiller_church_align') || 'left';

  function applySelectedFont(fontKey, shouldRender = false) {
    if (!CHURCH_FONTS[fontKey]) fontKey = 'bahnschrift_semibold_condensed';
    currentSelectedFont = fontKey;
    localStorage.setItem('slidekiller_church_font', fontKey);

    const cfg = CHURCH_FONTS[fontKey];
    if (document.documentElement && document.documentElement.style) {
      document.documentElement.style.setProperty('--slide-font-family', cfg.cssFamily);
      document.documentElement.style.setProperty('--slide-font-weight', cfg.fontWeight);
      document.documentElement.style.setProperty('--slide-font-spacing', cfg.letterSpacing);
      document.documentElement.style.setProperty('--slide-font-line-height', cfg.lineHeight);
      document.documentElement.style.setProperty('--slide-ref-font-family', cfg.cssFamily);
    }

    if (fontSelect && fontSelect.value !== fontKey) fontSelect.value = fontKey;
    if (resultsFontSelect && resultsFontSelect.value !== fontKey) resultsFontSelect.value = fontKey;

    currentDownloadUrl = null;
    if (shouldRender && currentSlides && currentSlides.length > 0) {
      renderResults();
    }
  }

  function applySelectedAlign(alignVal, shouldRender = false) {
    if (alignVal !== 'center' && alignVal !== 'left') alignVal = 'left';
    currentSelectedAlign = alignVal;
    localStorage.setItem('slidekiller_church_align', alignVal);

    if (alignSelect && alignSelect.value !== alignVal) alignSelect.value = alignVal;
    if (resultsAlignSelect && resultsAlignSelect.value !== alignVal) resultsAlignSelect.value = alignVal;

    currentDownloadUrl = null;
    if (shouldRender && currentSlides && currentSlides.length > 0) {
      renderResults();
    }
  }

  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      applySelectedFont(e.target.value, true);
      showToast(`Fonte definida: ${CHURCH_FONTS[e.target.value].name}`, 'info');
    });
  }

  if (resultsFontSelect) {
    resultsFontSelect.addEventListener('change', (e) => {
      applySelectedFont(e.target.value, true);
      showToast(`Fonte alterada para: ${CHURCH_FONTS[e.target.value].name}`, 'success');
    });
  }

  if (alignSelect) {
    alignSelect.addEventListener('change', (e) => {
      applySelectedAlign(e.target.value, true);
    });
  }

  if (resultsAlignSelect) {
    resultsAlignSelect.addEventListener('change', (e) => {
      applySelectedAlign(e.target.value, true);
    });
  }

  // Inicializa imediatamente com a tipografia recomendada (Impact / Anton à esquerda como na foto)
  applySelectedFont(currentSelectedFont, false);
  applySelectedAlign(currentSelectedAlign, false);

  // Elementos do seletor de formato de texto (Esboço vs Direção formatada previamente)
  // ⚠️ Scoped to #format-pill-group to avoid selecting submode-pill-btn buttons in other modules
  const formatPillGroup = document.getElementById('format-pill-group');
  const formatPillBtns = formatPillGroup
    ? formatPillGroup.querySelectorAll('.format-pill-btn')
    : document.querySelectorAll('#format-pill-group .format-pill-btn');
  const teamsOptionsContainer = document.getElementById('teams-options-container');
  const teamsOptionBtns = document.querySelectorAll('.teams-option-btn');

  let activeTextMode = 'standard'; // 'standard' | 'teams'
  let activeTeamsOption = 'only-verses'; // 'only-verses' | 'with-explanations'

  if (formatPillBtns.length > 0) {
    formatPillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        formatPillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTextMode = btn.dataset.textMode;
        if (activeTextMode === 'teams') {
          if (teamsOptionsContainer) teamsOptionsContainer.style.display = 'inline-flex';
          if (sermonTextInput) {
            sermonTextInput.placeholder = 'Cole aqui o texto ou mensagem da Direção formatada previamente com as passagens bíblicas e orientações...';
          }
        } else {
          if (teamsOptionsContainer) teamsOptionsContainer.style.display = 'none';
          if (sermonTextInput) {
            sermonTextInput.placeholder = 'Cole aqui o texto ou anotações do sermão com as referências bíblicas (ex: Mateus 6:19-21)...';
          }
        }
      });
    });
  }

  if (teamsOptionBtns.length > 0) {
    teamsOptionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        teamsOptionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTeamsOption = btn.dataset.teamsOption;
      });
    });
  }

  // Tabs internas do Slide Killer
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      activeSlideKillerTab = btn.dataset.tab;
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
      moveTabGelPill(btn);   // desliza a pílula gel das abas

      if (activeSlideKillerTab === 'tab-images-ocr') {
        if (optionBibleVersion) optionBibleVersion.style.display = 'flex';
        if (optionUseAiCheck) optionUseAiCheck.style.display = 'none';
        if (btnGenerate) {
          btnGenerate.innerHTML = '<span class="btn-icon">⚡</span> Extrair Versículos e Gerar Slides com IA';
        }
      } else {
        if (optionBibleVersion) optionBibleVersion.style.display = 'none';
        if (optionUseAiCheck) optionUseAiCheck.style.display = 'flex';
        if (btnGenerate) {
          btnGenerate.innerHTML = '<span class="btn-icon">⚡</span> Gerar Slides Instantaneamente';
        }
      }
    });
  });

  // ──────────────────────────────────────────────────
  // GEL PILL — Abas internas (Slide Killer)
  // ──────────────────────────────────────────────────
  const tabGelPill = document.getElementById('tab-gel-pill');
  const mainTabs   = document.getElementById('main-tabs');

  function moveTabGelPill(targetBtn, instant) {
    if (!tabGelPill || !mainTabs || !targetBtn) return;
    const containerRect = mainTabs.getBoundingClientRect();
    const btnRect = targetBtn.getBoundingClientRect();
    const left  = btnRect.left - containerRect.left + mainTabs.scrollLeft;
    const width = btnRect.width;
    if (instant) {
      tabGelPill.style.transition = 'none';
      tabGelPill.style.left  = left  + 'px';
      tabGelPill.style.width = width + 'px';
      requestAnimationFrame(() => { tabGelPill.style.transition = ''; });
    } else {
      tabGelPill.style.left  = left  + 'px';
      tabGelPill.style.width = width + 'px';
    }
  }

  window.addEventListener('resize', () => {
    const activeTabBtn = mainTabs ? mainTabs.querySelector('.tab-btn.active') : null;
    if (activeTabBtn) moveTabGelPill(activeTabBtn, true);
  });

  // Hover: pré-visualização translúcida nas abas
  tabBtns.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('active')) {
        tabGelPill.style.opacity = '0.4';
        moveTabGelPill(btn);
      }
    });
    btn.addEventListener('mouseleave', () => {
      tabGelPill.style.opacity = '1';
      const activeTabBtn = mainTabs ? mainTabs.querySelector('.tab-btn.active') : null;
      if (activeTabBtn) moveTabGelPill(activeTabBtn);
    });
  });

  // Posiciona no botão ativo ao carregar (instantâneo)
  const initialTabBtn = mainTabs ? mainTabs.querySelector('.tab-btn.active') : null;
  if (initialTabBtn) moveTabGelPill(initialTabBtn, true);


  // Dropzone events (PDF Original)
  if (dropzone && pdfFileInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target.closest('.btn-clear') || e.target.closest('#selected-file-info')) return;
      pdfFileInput.value = '';
      pdfFileInput.click();
    });

    let dropCounter = 0;
    dropzone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounter++;
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (!dropzone.classList.contains('dragover')) dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounter--;
      if (dropCounter <= 0) {
        dropCounter = 0;
        dropzone.classList.remove('dragover');
      }
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounter = 0;
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });
  }

  if (pdfFileInput) {
    pdfFileInput.addEventListener('click', (e) => {
      e.stopPropagation();
      e.target.value = '';
    });
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
    showToast(`📄 Arquivo "${file.name}" anexado com sucesso!`, 'success');
  }

  // Dropzone & Manipulação de Fotos de Versículos / Slides com IA
  if (dropzoneOcr && verseImagesInput) {
    dropzoneOcr.addEventListener('click', (e) => {
      if (e.target.closest('#verse-images-container') || e.target.closest('.btn-clear')) return;
      verseImagesInput.value = '';
      verseImagesInput.click();
    });

    let dropCounterOcr = 0;
    dropzoneOcr.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterOcr++;
      dropzoneOcr.classList.add('dragover');
    });

    dropzoneOcr.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (!dropzoneOcr.classList.contains('dragover')) dropzoneOcr.classList.add('dragover');
    });

    dropzoneOcr.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterOcr--;
      if (dropCounterOcr <= 0) {
        dropCounterOcr = 0;
        dropzoneOcr.classList.remove('dragover');
      }
    });

    dropzoneOcr.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterOcr = 0;
      dropzoneOcr.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleVerseImagesAdded(Array.from(e.dataTransfer.files));
      }
    });

    verseImagesInput.addEventListener('click', (e) => {
      e.stopPropagation();
      e.target.value = '';
    });
    verseImagesInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleVerseImagesAdded(Array.from(e.target.files));
        verseImagesInput.value = '';
      }
    });
  }

  if (btnAddMoreVerseImages && verseImagesInput) {
    btnAddMoreVerseImages.addEventListener('click', (e) => {
      e.stopPropagation();
      verseImagesInput.click();
    });
  }

  if (btnClearVerseImages) {
    btnClearVerseImages.addEventListener('click', (e) => {
      e.stopPropagation();
      sermonImageFiles = [];
      renderVerseImageThumbnails();
      showToast('Fotos removidas.', 'info');
    });
  }

  // Compressão inteligente para tráfego rápido e seguro na API do Gemini Vision
  async function compressImageForAi(file, maxDimension = 1600) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64 = dataUrl.split(',')[1];
          resolve({ dataUrl, base64, mimeType: 'image/jpeg' });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleVerseImagesAdded(files) {
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('Por favor, selecione arquivos de imagem válidos (JPG, PNG, WebP).', 'error');
      return;
    }

    showToast(`Carregando e otimizando ${validFiles.length} imagem(ns)...`, 'info');

    for (const file of validFiles) {
      try {
        const compressed = await compressImageForAi(file, 1600);
        sermonImageFiles.push({
          id: 'vimg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          name: file.name,
          dataUrl: compressed.dataUrl,
          base64: compressed.base64,
          mimeType: compressed.mimeType
        });
      } catch (err) {
        console.error('Erro ao ler imagem:', err);
      }
    }

    renderVerseImageThumbnails();
    showToast(`✅ ${validFiles.length} foto(s) de slide/versículo adicionada(s)!`, 'success');
  }

  function renderVerseImageThumbnails() {
    if (!verseImagesThumbnailsGrid) return;
    const countLabel = document.getElementById('verse-images-count-label');
    verseImagesThumbnailsGrid.innerHTML = '';

    if (sermonImageFiles.length === 0) {
      if (verseImagesContainer) verseImagesContainer.style.display = 'none';
      verseImagesThumbnailsGrid.style.display = 'none';
      if (countLabel) countLabel.textContent = '0 foto(s) selecionada(s)';
      return;
    }

    if (verseImagesContainer) verseImagesContainer.style.display = 'block';
    if (countLabel) {
      countLabel.textContent = `${sermonImageFiles.length} ${sermonImageFiles.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}`;
    }
    verseImagesThumbnailsGrid.style.display = 'grid';

    sermonImageFiles.forEach((imgObj, idx) => {
      const card = document.createElement('div');
      card.className = 'verse-image-thumb-card';
      card.innerHTML = `
        <span class="verse-image-thumb-badge">#${idx + 1}</span>
        <button type="button" class="btn-remove-thumb" title="Remover foto">✕</button>
        <img src="${imgObj.dataUrl}" alt="Slide ${idx + 1}" loading="lazy">
        <div class="verse-image-thumb-name" title="${escapeHtml(imgObj.name)}">${escapeHtml(imgObj.name)}</div>
      `;

      const btnRemove = card.querySelector('.btn-remove-thumb');
      btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        sermonImageFiles.splice(idx, 1);
        renderVerseImageThumbnails();
      });

      verseImagesThumbnailsGrid.appendChild(card);
    });
  }

  // Quebra o texto bíblico com destaques visuais (amarelo/dourado) preservando a exatidão
  function buildRunsFromHighlights(text, highlights = []) {
    if (!text) return [];
    
    let runs = [];
    const asteriskParts = text.split(/(\*[^*]+\*)/g);
    for (const part of asteriskParts) {
      if (!part) continue;
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        runs.push({ text: part.slice(1, -1), highlight: true });
      } else {
        runs.push({ text: part, highlight: false });
      }
    }

    if (highlights && Array.isArray(highlights) && highlights.length > 0) {
      const validTerms = highlights
        .filter(h => typeof h === 'string' && h.trim().length > 0)
        .map(h => h.trim());
        
      if (validTerms.length > 0) {
        validTerms.sort((a, b) => b.length - a.length);
        const escaped = validTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
        
        const finalRuns = [];
        for (const run of runs) {
          if (run.highlight) {
             finalRuns.push(run);
          } else {
             const subParts = run.text.split(regex);
             for (const sp of subParts) {
               if (!sp) continue;
               const isHigh = validTerms.some(t => t.toLowerCase() === sp.toLowerCase());
               finalRuns.push({ text: sp, highlight: isHigh });
             }
          }
        }
        runs = finalRuns;
      }
    }

    return runs.length > 0 ? runs : [{ text, highlight: false }];
  }

  // Extração Multimodal de Versículos via IA Gemini Vision com Fallback resiliente e Identificação Automática
  async function extractVersesFromImagesWithGemini(imageItems, bibleVersionChoice = 'exact') {
    if (!imageItems || imageItems.length === 0) {
      showToast('Nenhuma imagem fornecida.', 'error');
      return;
    }

    const defaultKey = atob('QVEuQWI4Uk42Si1lTWMtdVdvWVlpMWpsVGw4WXVvZ3RTajhuTXE2VzdSdVl1Zk8zbi1LcXc=');
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || defaultKey;

    if (btnGenerate) {
      btnGenerate.disabled = true;
      btnGenerate.innerHTML = '<span>🤖</span> Analisando fotos com IA Gemini Vision...';
    }
    if (aiOcrProgressContainer) {
      aiOcrProgressContainer.style.display = 'block';
      aiOcrProgressBar.style.width = '15%';
      aiOcrProgressPercent.textContent = '15%';
      aiOcrProgressStatus.textContent = 'Preparando fotos para leitura da IA...';
    }

    try {
      let versionInstruction = 'Mantenha fielmente o texto bíblico com exatidão.';
      if (bibleVersionChoice === 'ACF') {
        versionInstruction = 'Identifique a referência bíblica da imagem e utilize a tradução Almeida Corrigida Fiel (ACF).';
      } else if (bibleVersionChoice === 'ARA') {
        versionInstruction = 'Identifique a referência bíblica da imagem e utilize a tradução Almeida Revista e Atualizada (ARA).';
      } else if (bibleVersionChoice === 'NVI') {
        versionInstruction = 'Identifique a referência bíblica da imagem e utilize a tradução Nova Versão Internacional (NVI).';
      }

      const prompt = `Você é um teólogo e assistente especialista em produção de slides de cultos e sermões da igreja.
Analise com MÁXIMA ATENÇÃO a(s) foto(s) anexada(s) (fotos de telão da igreja, slides de culto ou fotos de versículos).
Sua missão é extrair TODOS os versículos e passagens bíblicas com suas REFERÊNCIAS EXATAS.

### REGRA DE OURO OBRIGATÓRIA - REFERÊNCIA BÍBLICA:
1. Em slides de versículos ("type": "verse"), O CAMPO "reference" NUNCA PODE FICAR VAZIO!
2. Se a referência bíblica (Livro Capítulo:Versículo) estiver visível na foto (cabeçalho, rodapé, ou entre parênteses como '(Lc 13.22)'):
   - Extraia para "reference" no padrão por extenso (ex: "Lucas 13:22", "1 Coríntios 13:4-7", "Salmos 23:1").
   - REMOVA a referência do campo "text" (para não duplicar na projeção).
3. SE A REFERÊNCIA BÍBLICA NÃO ESTIVER ESCRITA NA FOTO (a igreja projetou apenas o texto do versículo sem citar o livro):
   - VOCÊ DEVE OBRIGATORIAMENTE IDENTIFICAR O VERSÍCULO PELO SEU CONTEÚDO E PREENCHER O LIVRO, CAPÍTULO E VERSÍCULO EXATOS no campo "reference"!
   - Exemplo: se na foto está apenas o texto "Porque Deus tanto amou o mundo que deu o seu Filho Unigênito...", você DEVE preencher "reference": "João 3:16".
   - NUNCA retorne "reference": "" ou "reference": "Bíblia" ou nulo! Identifique sempre o livro e versículo canônico!
4. "text": Texto sagrado do versículo limpo (sem a referência embutida). ${versionInstruction}
5. "highlights": Array com 2 a 4 termos ou palavras-chave de maior ênfase para destaque visual dourado na projeção (ex: ["SENHOR", "SALVAM"]).

Retorne ESTRITAMENTE em formato JSON puro, sem crases ou markdown adicional:
{
  "slides": [
    {
      "type": "verse",
      "reference": "Lucas 13:22-29",
      "text": "E disse-lhe um: Senhor, são poucos os que se salvam? E ele lhe respondeu:",
      "highlights": ["Senhor", "poucos os que se salvam"]
    }
  ]
}`;

      // Montar partes para API Gemini: imagens em base64 + texto com instruções
      const parts = [];
      for (let i = 0; i < imageItems.length; i++) {
        parts.push({
          inline_data: {
            mime_type: imageItems[i].mimeType || 'image/jpeg',
            data: imageItems[i].base64
          }
        });
      }
      parts.push({ text: prompt });

      if (aiOcrProgressBar) aiOcrProgressBar.style.width = '40%';
      if (aiOcrProgressPercent) aiOcrProgressPercent.textContent = '40%';
      if (aiOcrProgressStatus) aiOcrProgressStatus.textContent = 'IA Gemini Vision interpretando fotos e versículos...';

      const models = [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
      ];
      let responseJson = null;
      let lastError = null;

      for (const model of models) {
        let timeoutId = null;
        try {
          if (aiOcrProgressStatus) aiOcrProgressStatus.textContent = `Consultando modelo de IA (${model})...`;
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 20000);
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
              }
            })
          });
          clearTimeout(timeoutId);
          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            lastError = errData?.error?.message || `HTTP ${res.status}`;
            continue;
          }

          const data = await res.json();
          if (data.error) {
            console.warn(`Modelo ${model} retornou aviso:`, data.error.message);
            lastError = data.error.message;
            continue;
          }

          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            responseJson = JSON.parse(rawText.replace(/```json/gi, '').replace(/```/g, '').trim());
            break;
          }
        } catch (mErr) {
          if (timeoutId) clearTimeout(timeoutId);
          console.warn(`Tentativa com modelo ${model} falhou:`, mErr);
          lastError = mErr.message;
        }
      }

      if (!responseJson || !Array.isArray(responseJson.slides) || responseJson.slides.length === 0) {
        throw new Error(lastError || 'Nenhum versículo foi identificado com clareza nas fotos fornecidas.');
      }

      if (aiOcrProgressBar) aiOcrProgressBar.style.width = '80%';
      if (aiOcrProgressPercent) aiOcrProgressPercent.textContent = '80%';
      if (aiOcrProgressStatus) aiOcrProgressStatus.textContent = 'Validando e garantindo referências bíblicas...';

      // Pipeline de normalização e recuperação de referências bíblicas
      const processedSlides = [];
      let lastKnownRef = '';

      for (let item of responseJson.slides) {
        let rawText = (item.text || '').trim();
        let ref = (item.reference || '').trim();

        // 1. Se a IA colocou a referência dentro do texto (ex: "João 3:16 - Porque Deus amou..." ou "... (Mt 6:19)")
        const embeddedRef = isBibleRef(rawText);
        if (embeddedRef) {
          const normEmb = normalizeBibleRefName(embeddedRef);
          if (!ref || ref.toLowerCase() === 'versículo' || ref.toLowerCase() === 'bíblia') {
            ref = normEmb;
          }
          // Limpa a referência do texto do slide para não duplicar
          rawText = rawText.replace(new RegExp(`\\(?\\s*${embeddedRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\)?`, 'gi'), '');
          rawText = rawText.replace(/^[-–—:]\s*|\s*[-–—:]$/g, '').trim();
        }

        // 2. Se a referência ainda estiver vazia ou genérica, identifica o versículo pelo texto com IA rápida
        if ((!ref || ref.toLowerCase() === 'versículo' || ref.toLowerCase() === 'bíblia') && rawText.length > 15) {
          let idTimeoutId = null;
          try {
            if (aiOcrProgressStatus) aiOcrProgressStatus.textContent = 'Identificando livro e capítulo do versículo...';
            const idModel = 'gemini-2.5-flash';
            const idPrompt = `Identifique com exatidão o Livro, Capítulo e Versículo canônico deste versículo bíblico em português: "${rawText.substring(0, 180)}". Responda ESTRITAMENTE em JSON puro: {"reference": "NomeDoLivro Cap:Vers"}`;
            const idController = new AbortController();
            idTimeoutId = setTimeout(() => idController.abort(), 12000);
            const idRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${idModel}:generateContent?key=${apiKey}`, {
              method: 'POST',
              signal: idController.signal,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: idPrompt }] }],
                generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
              })
            });
            clearTimeout(idTimeoutId);
            idTimeoutId = null;
            if (idRes.ok) {
              const idData = await idRes.json();
              const idRaw = idData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (idRaw) {
                const parsed = JSON.parse(idRaw.replace(/```json/gi, '').replace(/```/g, '').trim());
                if (parsed.reference) {
                  ref = normalizeBibleRefName(parsed.reference);
                }
              }
            }
          } catch (idErr) {
            if (idTimeoutId) clearTimeout(idTimeoutId);
            console.warn('Fallback de identificação automática:', idErr);
          }
        }

        // 3. Se ainda assim estiver vazio, herda da última referência conhecida se for continuação de passagem
        if (!ref && lastKnownRef) {
          ref = lastKnownRef;
        }

        if (ref) {
          lastKnownRef = ref;
        }

        // 4. Quebra inteligente de versículos longos (> 220 caracteres) para caber na projeção
        const cleanRef = normalizeBibleRefName(ref);
        const chunks = splitTextByPunctuation(rawText, 220);

        chunks.forEach(chunk => {
          processedSlides.push({
            type: 'verse',
            reference: cleanRef,
            runs: buildRunsFromHighlights(chunk, item.highlights || [])
          });
        });
      }

      currentSlides = processedSlides;

      if (aiOcrProgressBar) aiOcrProgressBar.style.width = '100%';
      if (aiOcrProgressPercent) aiOcrProgressPercent.textContent = '100%';
      if (aiOcrProgressStatus) aiOcrProgressStatus.textContent = 'Concluído com sucesso!';

      showToast(`🎉 ${currentSlides.length} slide(s) de versículo gerado(s) com IA!`, 'success');
      renderResults();

    } catch (err) {
      console.error('Erro na extração com Gemini Vision:', err);
      showToast(err.message || 'Erro ao extrair versículos das fotos.', 'error');
    } finally {
      if (btnGenerate) {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = (activeSlideKillerTab === 'tab-images-ocr')
          ? '<span class="btn-icon">⚡</span> Extrair Versículos e Gerar Slides com IA'
          : '<span class="btn-icon">⚡</span> Gerar Slides Instantaneamente';
      }
      setTimeout(() => {
        if (aiOcrProgressContainer) aiOcrProgressContainer.style.display = 'none';
      }, 3000);
    }
  }

  // ========================================================
  // GERENCIAMENTO DE PLANO DE FUNDO (OFICIAL ESTÁTICO & PERSONALIZADO)
  // ========================================================
  function getActiveBackgroundUrl() {
    if (customBgDataUrl && templateSelect && templateSelect.value === '__custom_active__') {
      return customBgDataUrl;
    }
    if (templateSelect && templateSelect.value && !templateSelect.value.startsWith('__custom')) {
      return templateSelect.value;
    }
    return 'assets/church_sermon_bg.jpg';
  }

  function updateAllSlidePreviewsBackground(bgUrl) {
    if (!bgUrl) return;
    const isCinzel = bgUrl.includes('cinzel') || bgUrl.includes('nobre');
    const containers = document.querySelectorAll('.slide-preview-container');
    containers.forEach((container, idx) => {
      const slideBg = (currentSlides[idx] && currentSlides[idx].bgImage) ? currentSlides[idx].bgImage : bgUrl;
      container.style.backgroundImage = `url("${slideBg}")`;
      const slideIsCinzel = slideBg.includes('cinzel') || slideBg.includes('nobre') || isCinzel || currentSelectedFont === 'cinzel';
      container.classList.toggle('theme-cinzel', slideIsCinzel);
    });
  }

  async function uploadCustomBgToServer(file) {
    if (isNoBackendEnvironment) return;
    try {
      const fd = new FormData();
      fd.append('bgImage', file);
      const res = await fetch('/api/slides/upload-bg', {
        method: 'POST',
        body: fd
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          customBgServerUrl = data.url;
        }
      }
    } catch (e) {
      // Modo offline/estático sem servidor local ativo
    }
  }

  function handleCustomBgSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (.jpg, .png, .webp).', 'error');
      if (customBgInput) customBgInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      customBgDataUrl = event.target.result;
      customBgFile = file;

      if (customBgThumb) customBgThumb.src = customBgDataUrl;
      if (customBgFilename) customBgFilename.textContent = file.name;
      if (customBgPreviewBadge) customBgPreviewBadge.style.display = 'inline-flex';

      // Atualizar ou adicionar opção no select
      if (templateSelect) {
        let customOpt = templateSelect.querySelector('option[data-custom="true"]');
        if (!customOpt) {
          customOpt = document.createElement('option');
          customOpt.setAttribute('data-custom', 'true');
          customOpt.value = '__custom_active__';
          const attachOpt = templateSelect.querySelector('option[value="__custom__"]');
          if (attachOpt) {
            templateSelect.insertBefore(customOpt, attachOpt);
          } else {
            templateSelect.appendChild(customOpt);
          }
        }
        customOpt.textContent = `🖼️ Personalizado: ${file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name}`;
        customOpt.selected = true;
      }

      // Se os slides já estiverem visíveis na tela, atualizar todos os previews imediatamente
      updateAllSlidePreviewsBackground(customBgDataUrl);

      showToast('Imagem de fundo personalizada aplicada!', 'success');

      // Enviar em segundo plano para o servidor se estiver rodando
      uploadCustomBgToServer(file);
    };
    reader.readAsDataURL(file);
  }

  function restoreOfficialBg() {
    customBgDataUrl = null;
    customBgFile = null;
    customBgServerUrl = null;
    if (customBgInput) customBgInput.value = '';
    if (customBgPreviewBadge) customBgPreviewBadge.style.display = 'none';

    if (templateSelect) {
      const customOpt = templateSelect.querySelector('option[data-custom="true"]');
      if (customOpt) customOpt.remove();

      // Selecionar o primeiro template oficial estático disponível
      const officialOpt = templateSelect.querySelector('option:not([value="__custom__"])');
      if (officialOpt) {
        officialOpt.selected = true;
      } else {
        templateSelect.value = 'assets/church_sermon_bg.jpg';
      }
    }

    const officialBgUrl = getActiveBackgroundUrl();
    updateAllSlidePreviewsBackground(officialBgUrl);
    showToast('Fundo oficial estático restaurado.', 'info');
  }

  function handleTemplateSelectChange() {
    if (!templateSelect) return;
    if (templateSelect.value === '__custom__') {
      if (customBgInput) customBgInput.click();
    } else if (templateSelect.value === '__custom_active__') {
      if (customBgDataUrl) {
        if (customBgPreviewBadge) customBgPreviewBadge.style.display = 'inline-flex';
        updateAllSlidePreviewsBackground(customBgDataUrl);
      }
    } else {
      // Usuário escolheu um template oficial estático
      const bgUrl = templateSelect.value;
      if (bgUrl.includes('cinzel') || bgUrl.includes('nobre')) {
        applySelectedFont('cinzel', false);
        applySelectedAlign('center', false);
        showToast('🏛️ Tema Nobre Cinzel ativado! (Fonte Cinzel & Centralizado)', 'success');
      } else if (currentSelectedFont === 'cinzel') {
        applySelectedFont('bahnschrift_semibold_condensed', false);
        applySelectedAlign('left', false);
        showToast('📖 Tema Bíblia restaurado!', 'info');
      }
      updateAllSlidePreviewsBackground(bgUrl);
      if (currentSlides && currentSlides.length > 0) {
        renderResults();
      }
    }
  }

  if (btnAttachCustomBg && customBgInput) {
    btnAttachCustomBg.addEventListener('click', () => customBgInput.click());
  }
  if (btnChangeBgResults && customBgInput) {
    btnChangeBgResults.addEventListener('click', () => customBgInput.click());
  }
  if (customBgInput) {
    customBgInput.addEventListener('change', handleCustomBgSelected);
  }
  if (btnRemoveCustomBg) {
    btnRemoveCustomBg.addEventListener('click', restoreOfficialBg);
  }
  if (templateSelect) {
    templateSelect.addEventListener('change', handleTemplateSelectChange);
  }

  // Carregar templates oficiais de fundo preservando a opção de anexo
  if (!isNoBackendEnvironment) {
    fetch('/api/slides/templates')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.templates && templateSelect) {
          const currentVal = templateSelect.value;
          templateSelect.innerHTML = '';
          data.templates.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.url;
            opt.textContent = t.name;
            templateSelect.appendChild(opt);
          });

          // Se houver imagem customizada ativa, reinserir
          if (customBgDataUrl && customBgFile) {
            const customOpt = document.createElement('option');
            customOpt.setAttribute('data-custom', 'true');
            customOpt.value = '__custom_active__';
            customOpt.textContent = `🖼️ Personalizado: ${customBgFile.name.length > 25 ? customBgFile.name.substring(0, 22) + '...' : customBgFile.name}`;
            templateSelect.appendChild(customOpt);
            if (currentVal === '__custom_active__') customOpt.selected = true;
          }

          // Opção para anexar fundo novo
          const attachOpt = document.createElement('option');
          attachOpt.value = '__custom__';
          attachOpt.textContent = '➕ Anexar Fundo Personalizado...';
          templateSelect.appendChild(attachOpt);

          if (currentVal && currentVal !== '__custom__' && templateSelect.querySelector(`option[value="${currentVal}"]`)) {
            templateSelect.value = currentVal;
          }
        }
      })
      .catch(() => {});
  }

  // ========================================================
  // INICIALIZAÇÃO RESILIENTE DO MOTOR PDF.JS
  // ========================================================
  function initPdfJsWorker() {
    if (typeof pdfjsLib === 'undefined') return;
    try {
      // 1. Tenta a URL absoluta do worker local no mesmo domínio (100% livre de restrições CORS)
      const workerUrl = new URL('pdf.worker.min.js', window.location.href).href;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    } catch (e) {
      console.warn('Worker local init:', e);
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
    }
  }
  initPdfJsWorker();

  async function loadPdfDocumentSafely(dataBuffer) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('Biblioteca PDF.js não carregada. Recarregue a página.');
    }
    initPdfJsWorker();

    try {
      return await pdfjsLib.getDocument({ data: dataBuffer }).promise;
    } catch (firstErr) {
      console.warn('Primeira tentativa de carregar PDF falhou, tentando fallback com Blob Worker:', firstErr);
      try {
        // Fallback 1: Worker via Blob com importScripts
        const blobCode = `importScripts("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js");`;
        const blob = new Blob([blobCode], { type: 'application/javascript' });
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        return await pdfjsLib.getDocument({ data: dataBuffer }).promise;
      } catch (secondErr) {
        console.warn('Tentando carregar PDF sem worker (modo direto):', secondErr);
        // Fallback 2: Sem worker (inline main thread)
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        return await pdfjsLib.getDocument({ data: dataBuffer, disableWorker: true, isEvalSupported: false }).promise;
      }
    }
  }

  // Extração de texto de PDF no navegador com detecção de destaques/cores originais
  async function extractTextFromPdfInBrowser(file) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('Biblioteca pdf.js não disponível no navegador.');
    }
    const arr = await file.arrayBuffer();
    const pdf = await loadPdfDocumentSafely(arr);
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();

      // 1. Detectar cores explícitas (amarelo/dourado/laranja) do operador de desenho
      const coloredStrings = new Set();
      try {
        const opList = await page.getOperatorList();
        let curColor = [0, 0, 0];
        for (let j = 0; j < opList.fnArray.length; j++) {
          const fn = opList.fnArray[j];
          const args = opList.argsArray[j];
          if (fn === 59 || fn === 58 || fn === 54 || fn === 55 || fn === 52 || fn === 53) {
            curColor = args;
          } else if (fn === 44 || fn === 45) {
            const isYellowOrGold = curColor && (
              (curColor[0] > 110 && curColor[1] > 50 && (curColor[2] < 180 || curColor[0] > curColor[2])) ||
              (curColor[0] > 0.40 && curColor[1] > 0.20 && (curColor[2] < 0.70 || curColor[0] > curColor[2]))
            );
            if (isYellowOrGold) {
              let s = '';
              if (Array.isArray(args[0])) {
                s = args[0].map(it => (typeof it === 'object' ? (it.unicode || it.fontChar || '') : '')).join('');
              } else if (typeof args[0] === 'string') {
                s = args[0];
              }
              const clean = s.trim();
              if (clean.length > 1 && !/^[⸻\-_\s:?.,;()0-9"“”'’/]+$/.test(clean)) {
                coloredStrings.add(clean);
              }
            }
          }
        }
      } catch (opErr) {}

      // 2. Identificar a fonte principal do corpo de texto (a mais frequente na página)
      const fontCounts = {};
      tc.items.forEach(it => {
        if (!it.str.trim()) return;
        fontCounts[it.fontName] = (fontCounts[it.fontName] || 0) + it.str.length;
      });

      let mainFont = null;
      let maxCount = -1;
      for (const f in fontCounts) {
        if (fontCounts[f] > maxCount) {
          maxCount = fontCounts[f];
          mainFont = f;
        }
      }

      let lastY = null;
      let pageText = '';
      for (const item of tc.items) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          const yDiff = Math.abs(item.transform[5] - lastY);
          const trimmedPageText = pageText.trim();
          const endsWithSentenceTerminator = /[.!?:\;]["”'’\)]*(?:\[\/HL\])?$/.test(trimmedPageText);
          const nextIsRefOrHeading = isPureBibleRefLine(item.str) || isHeadingOrTopic(item.str);

          if (yDiff > 36 || (yDiff > 22 && (endsWithSentenceTerminator || nextIsRefOrHeading))) {
            pageText += '\n\n';
          } else {
            pageText += '\n';
          }
        }

        const trimmed = item.str.trim();
        const isDivider = /^[⸻\-_\s]{3,}$/.test(trimmed);
        const isPunctuationOnly = /^[⸻\-_\s:?.,;()0-9"“”'’/]+$/.test(trimmed);
        const isColoredByOp = coloredStrings.has(trimmed) || Array.from(coloredStrings).some(cs => cs.includes(trimmed) || (trimmed.length > 3 && trimmed.includes(cs)));
        const isHighlight = ((item.fontName !== mainFont) || isColoredByOp) && trimmed.length > 0 && !isPunctuationOnly && !isDivider;

        if (isHighlight) {
          pageText += `[HL]${item.str}[/HL]`;
        } else {
          pageText += item.str;
        }
        lastY = item.transform[5];
      }

      fullText += pageText + '\n\n';
    }

    // 3. Normalizar tags: unir contíguas e resolver quebras de linha internas
    let cleanText = fullText
      .replace(/\[\/HL\](\s*)\[HL\]/g, '$1')
      .replace(/\[HL\]([\s\S]*?)\[\/HL\]/g, (m, inner) => '[HL]' + inner.replace(/\r?\n/g, ' ') + '[/HL]');

    return cleanText.trim();
  }

  // Parser com IA Gemini direto do navegador (fallback resiliente)
  async function parseSermonWithGeminiBrowser(sermonText) {
    const defaultKey = atob('QVEuQWI4Uk42Si1lTWMtdVdvWVlpMWpsVGw4WXVvZ3RTajhuTXE2VzdSdVl1Zk8zbi1LcXc=');
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || defaultKey;
    const prompt = `Você é um especialista em design de slides de pregação e culto para projeção em igreja e telões de LED.
Sua missão é transformar o texto de um sermão em uma sequência de SLIDES INDIVIDUAIS estruturados em JSON.

REGRA MÁXIMA E OBRIGATÓRIA:
NÃO OMITA, NÃO RESUMA E NÃO EXCLUA NENHUM PARÁGRAFO OU FRASE!
Todo o conteúdo do sermão (introduções pastorais, reflexões, comentários, tópicos e versículos bíblicos) deve ser transformado em slides na íntegra.
Se houver marcações [HL]...[/HL] no texto, você DEVE preservar esses trechos com "highlight": true.

1. QUEBRA DE VERSÍCULOS (LIMITE DE 220 CARACTERES): 1 versículo por slide, entre aspas “ ... ”, com campo "reference" (ex: "Mateus 6:19"). Se um versículo ou passagem bíblica for longo (> 220 caracteres), DIVIDA-O em slides no ponto final (.) ou ponto e vírgula (;). Mantenha frases completas e REPITA OBRIGATORIAMENTE O CAMPO 'reference' EM TODOS OS SLIDES DA PASSAGEM BÍBLICA! NUNCA DEIXE NENHUM SLIDE DE VERSÍCULO SEM O CAMPO 'reference'. Se houver versículos com a referência bíblica na linha seguinte, conecte-os ao versículo!
2. TÓPICOS E TÍTULOS: Títulos de seções, pontos numerados ou cabeçalhos (ex: "Armadura do Reino de Deus (8)", "8. O Servo no Reino de Deus") como type "topic".
3. PARÁGRAFOS E REFLEXÕES: Todas as frases, introduções e comentários do pregador como type "reflection" (se o parágrafo for longo, divida no ponto final (.) em slides de até 220 caracteres para caber na tela sem poluição visual, mas NUNCA resuma ou exclua nenhuma palavra!).
4. PERGUNTAS: Perguntas reflexivas curtas como type "question_short".
5. DESTAQUES: Divida em runs com highlight: true para palavras de ênfase (ou onde houver [HL]...[/HL]).

FORMATO DA RESPOSTA (ARRAY JSON):
[
  {
    "type": "topic",
    "runs": [
      { "text": "8. O Servo no Reino de Deus", "highlight": false }
    ]
  },
  {
    "type": "verse",
    "reference": "Mateus 6:24",
    "runs": [
      { "text": "“Ninguém pode servir a dois senhores; porque ou há de odiar um e amar o outro, ou se dedicará a um e desprezará o outro. ", "highlight": false },
      { "text": "Não podeis servir a Deus e a Mamom.”", "highlight": true }
    ]
  },
  {
    "type": "reflection",
    "runs": [
      { "text": "Quem pertence ao Reino de Deus não pode dividir o coração entre dois senhores.", "highlight": false }
    ]
  }
]

TEXTO COMPLETO DO SERMÃO:
${sermonText}`;

    const models = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];

    let lastError = null;
    for (const model of models) {
      let timeoutId = null;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 18000);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json'
            }
          })
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          lastError = errData?.error?.message || `HTTP ${res.status}`;
          continue;
        }
        const data = await res.json();
        if (data.error) {
          lastError = data.error.message;
          continue;
        }
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const cleanJson = rawJson.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          const list = Array.isArray(parsed) ? parsed : (parsed.slides || []);
          if (list.length > 0) {
            // Sanitize runs: ensure [HL] tags are cleanly stripped from text
            list.forEach(s => {
              if (s.runs && Array.isArray(s.runs)) {
                s.runs.forEach(r => {
                  if (r.text) {
                    if (r.text.includes('[HL]')) r.highlight = true;
                    r.text = r.text.replace(/\[\/?HL\]/g, '');
                  }
                });
              }
            });
            return list;
          }
        }
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        lastError = err.message;
      }
    }
    throw new Error(lastError || 'Erro ao processar com IA Gemini');
  }

  // --- MOTOR LOCAL INSTANTÂNEO DE SERMÃO DA IGREJA ---
  const PREFIXES = "(?:1[ºª°\\.]?|2[ºª°\\.]?|3[ºª°\\.]?|I{1,3}|Primeir[oa]|Segund[oa]|Terceir[oa])";

  const BOOK_NAMES = [
    `${PREFIXES}\\s*(?:Samuel|Sam\\.?|Sm\\.?)`,
    `${PREFIXES}\\s*(?:Reis|Rs\\.?)`,
    `${PREFIXES}\\s*(?:Cr[oôó]nicas|Cr\\.?)`,
    `${PREFIXES}\\s*(?:Cor[ií]ntios|Co\\.?|Cor\\.?)`,
    `${PREFIXES}\\s*(?:Tessalonicenses|Ts\\.?)`,
    `${PREFIXES}\\s*(?:Tim[oó]teo|Tm\\.?)`,
    `${PREFIXES}\\s*(?:Pedro|Pe\\.?|Ped\\.?)`,
    `${PREFIXES}\\s*(?:Jo[aã]o|Jo\\.?)`,
    "G[eê]nesis|Gn\\.?", "[EÊ]xodo|Ex\\.?", "Lev[ií]tico|Lv\\.?", "N[uú]meros|Nm\\.?", "Deuteron[oô]mio|Dt\\.?", "Josu[eé]|Js\\.?", "Ju[ií]zes|Jz\\.?", "Rute|Rt\\.?", "Esdras|Ed\\.?", "Neemias|Ne\\.?", "Ester|Et\\.?", "J[oó]", "Salmos?|Sl\\.?|Sal\\.?", "Prov[eé]rbios?|Pv\\.?|Prov\\.?", "Eclesiastes|Ec\\.?|Ecl\\.?", "C[aâ]nticos|Cantares|Ct\\.?", "Isa[ií]as|Is\\.?", "Jeremias|Jr\\.?", "Lamenta[cç][oõ]es|Lm\\.?", "Ezequiel|Ez\\.?", "Daniel|Dn\\.?", "Os[eé]ias|Os\\.?", "Joel|Jl\\.?", "Am[oó]s|Am\\.?", "Obadias|Ob\\.?", "Jonas|Jn\\.?", "Miqu[eé]ias|Mq\\.?", "Naum|Na\\.?", "Habacuque|Hc\\.?", "Sofonias|Sf\\.?", "Ageu|Ag\\.?", "Zacarias|Zc\\.?", "Malaquias|Ml\\.?", "Mateus|Mt\\.?|Mat\\.?", "Marcos|Mc\\.?|Marc\\.?", "Lucas|Lc\\.?|Luc\\.?", "Jo[aã]o|Jo\\.?", "Atos|At\\.?", "Romanos|Rm\\.?|Rom\\.?", "G[aá]latas|Gl\\.?|Gal\\.?", "Ef[eé]sios|Ef\\.?", "Filipenses|Fp\\.?|Fil\\.?", "Colossenses|Cl\\.?|Col\\.?", "Tito|Tt\\.?", "Filemom|Filemon|Fm\\.?", "Hebreus|Hb\\.?|Heb\\.?", "Tiago|Tg\\.?", "Judas|Jd\\.?", "Apocalipse|Ap\\.?|Apoc\\.?"
  ].join("|");

  const BIBLE_BOOKS_REGEX = new RegExp(`(?:${BOOK_NAMES})\\s+\\d+\\s*[:.,]\\s*\\d+(?:\\s*[-–—a]\\s*\\d+)?(?:,\\s*\\d+)*`, 'i');

  function isBibleRef(line) {
    const trimmed = (line || '').trim();
    const match = trimmed.match(BIBLE_BOOKS_REGEX);
    return match ? match[0] : null;
  }

  function isPureBibleRefLine(line) {
    const match = isBibleRef(line);
    if (!match) return false;
    return line.trim().length <= match.length + 8;
  }

  function isHeadingOrTopic(line) {
    const trimmed = (line || '').replace(/\[\/?HL\]/g, '').replace(/^[⸻\-_\s*#]+|[⸻\-_\s*#]+$/g, '').trim();
    if (trimmed.length < 3) return false;
    if (isBibleRef(trimmed)) return false;
    if (trimmed.endsWith(':') && trimmed.length < 80) return true;
    if (/^\d{1,2}[\.\)]\s+[A-ZÀ-Ý]/.test(trimmed) && trimmed.length < 85) return true;
    if (!trimmed.endsWith('.') && trimmed.length <= 45 && !/[;:,]/.test(trimmed)) {
      return true;
    }
    const letters = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, '');
    if (letters.length >= 4) {
      const uppercaseLetters = (trimmed.match(/[A-ZÀ-Ý]/g) || []).length;
      if (uppercaseLetters / letters.length >= 0.70) return true;
    }
    return false;
  }

  function splitTextByPunctuation(text, maxChars = 220) {
    const stripped = text.replace(/\[\/?HL\]/g, '').replace(/^[“"']|[”"']$/g, '').trim();
    if (stripped.length <= maxChars) {
      return [text.trim()];
    }

    // 1. Pontuação primária: ponto final, exclamação e interrogação (. ! ?)
    const primaryParts = text
      .split(/(?<=[.!?](?:\[\/HL\]|["”'’\)])*)\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const subChunks = [];
    for (const part of primaryParts) {
      const partLen = part.replace(/\[\/?HL\]/g, '').length;
      if (partLen <= maxChars) {
        subChunks.push(part);
      } else {
        // 2. Se uma oração ultrapassar maxChars, divide em ponto e vírgula ou dois pontos (; ou :)
        const secondaryParts = part
          .split(/(?<=[;:](?:\[\/HL\]|["”'’\)])*)\s+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);

        let cur = '';
        for (const sp of secondaryParts) {
          const candidate = (cur ? cur + ' ' : '') + sp;
          const candidateLen = candidate.replace(/\[\/?HL\]/g, '').length;
          if (candidateLen > maxChars && cur.length > 0) {
            subChunks.push(cur.trim());
            cur = sp;
          } else {
            cur = candidate;
          }
        }
        if (cur.trim().length > 0) {
          const curLen = cur.replace(/\[\/?HL\]/g, '').length;
          if (curLen > maxChars) {
            // 3. Apenas se ainda for maior que 220, divide na vírgula (,)
            const commaParts = cur
              .split(/(?<=[,](?:\[\/HL\]|["”'’\)])*)\s+/)
              .map(s => s.trim())
              .filter(s => s.length > 0);
            let cCur = '';
            for (const cp of commaParts) {
              const cCand = (cCur ? cCur + ' ' : '') + cp;
              if (cCand.replace(/\[\/?HL\]/g, '').length > maxChars && cCur.length > 0) {
                subChunks.push(cCur.trim());
                cCur = cp;
              } else {
                cCur = cCand;
              }
            }
            if (cCur.trim().length > 0) subChunks.push(cCur.trim());
          } else {
            subChunks.push(cur.trim());
          }
        }
      }
    }

    // Agrupa os fragmentos respeitando o limite confortável de até 220 caracteres
    const slides = [];
    let curSlide = '';
    let insideHl = false;

    for (const chunk of subChunks) {
      const candidate = (curSlide ? curSlide + ' ' : '') + chunk;
      const candidateLen = candidate.replace(/\[\/?HL\]/g, '').length;

      if (candidateLen > maxChars && curSlide.length > 0) {
        let chunkStr = curSlide.trim();
        const opens = (chunkStr.match(/\[HL\]/g) || []).length;
        const closes = (chunkStr.match(/\[\/HL\]/g) || []).length;
        if (opens > closes) {
          chunkStr += '[/HL]';
          insideHl = true;
        } else {
          insideHl = false;
        }
        slides.push(chunkStr);
        curSlide = insideHl ? '[HL]' + chunk.trim() : chunk.trim();
      } else {
        curSlide = candidate;
      }
    }

    if (curSlide.trim().length > 0) {
      slides.push(curSlide.trim());
    }

    return slides;
  }

  function normalizeBibleRefName(ref) {
    return (ref || '')
      .replace(/^I\s+/i, '1 ')
      .replace(/^II\s+/i, '2 ')
      .replace(/^III\s+/i, '3 ')
      .replace(/^1[ºª°]\s*/i, '1 ')
      .replace(/^2[ºª°]\s*/i, '2 ')
      .replace(/^3[ºª°]\s*/i, '3 ')
      .replace(/^Primeir[oa]\s+/i, '1 ')
      .replace(/^Segund[oa]\s+/i, '2 ')
      .replace(/^Terceir[oa]\s+/i, '3 ');
  }

  function stripLeadingVerseNumber(text) {
    return (text || '').replace(/^\s*\d{1,3}\s*[.:\-–—]?\s+/, '').trim();
  }

  function formatQuotes(text) {
    const clean = (text || '').replace(/^[“"']|[”"']$/g, '').trim();
    return `“${clean}”`;
  }

  function highlightCinzelThematicPhrases(text) {
    if (!text) return [{ text: '', highlight: false }];
    if (text.includes('[HL]')) {
      const regex = /\[HL\](.*?)\[\/HL\]/gis;
      const runs = [];
      let lastIdx = 0;
      let m;
      while ((m = regex.exec(text)) !== null) {
        if (m.index > lastIdx) {
          runs.push({ text: text.substring(lastIdx, m.index), highlight: false });
        }
        if (m[1].length > 0) {
          runs.push({ text: m[1], highlight: true });
        }
        lastIdx = m.index + m[0].length;
      }
      if (lastIdx < text.length) {
        runs.push({ text: text.substring(lastIdx), highlight: false });
      }
      return runs.filter(r => r.text.length > 0);
    }

    const thematicRegex = /(para uma viva esperança|que não se pode murchar,?|a adoção de filhos|porque sois filhos,?|cinquenta e dois dias)/gi;
    const runs = [];
    let lastIndex = 0;
    let match;

    while ((match = thematicRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        runs.push({ text: text.substring(lastIndex, match.index), highlight: false });
      }
      runs.push({ text: match[0], highlight: true });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      runs.push({ text: text.substring(lastIndex), highlight: false });
    }

    return runs.length > 0 ? runs : [{ text, highlight: false }];
  }

  function reconstructParagraphs(rawText) {
    const rawLines = (rawText || '')
      .replace(/\u00A0/g, ' ')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    const paras = [];
    let cur = '';

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const isRef = isPureBibleRefLine(line);
      const isQ = line.endsWith('?') && line.length < 90 && !isBibleRef(line);
      const isNumbered = /^\d{1,3}\s+[A-Za-zÀ-ÿ]/.test(line);

      if (i === 0 && line.length < 80 && !isBibleRef(line)) {
        paras.push(line);
        continue;
      }

      if (isRef || isQ) {
        if (cur) { paras.push(cur.trim()); cur = ''; }
        paras.push(line);
        continue;
      }

      if (isNumbered) {
        if (cur) { paras.push(cur.trim()); cur = ''; }
        cur = line;
        continue;
      }

      if (!cur) {
        cur = line;
      } else {
        const prevEndsPunct = /[.!?…]$/.test(cur) || cur.endsWith('...');
        if (prevEndsPunct && /^[A-ZÀ-Ý“"']/.test(line)) {
          paras.push(cur.trim());
          cur = line;
        } else {
          cur += ' ' + line;
        }
      }
    }
    if (cur) paras.push(cur.trim());

    return paras;
  }

  function parseSermonOfflineBrowser(rawText) {
    const paras = reconstructParagraphs(rawText);
    const slides = [];
    let i = 0;

    while (i < paras.length) {
      const para = paras[i];

      // 1. Capa / Título do Sermão (Slide 1)
      if (i === 0 && para.length < 90 && !isBibleRef(para)) {
        let l1 = para.toUpperCase();
        let l2 = '';
        const splitWords = ['TÊM PARTE', 'TEM PARTE', 'PARTE NA', 'PARTE DA'];
        for (const sw of splitWords) {
          const idx = l1.indexOf(sw);
          if (idx !== -1) {
            l2 = l1.substring(idx).trim();
            l1 = l1.substring(0, idx).trim();
            break;
          }
        }
        slides.push({
          type: 'cinzel_cover',
          line1: l1,
          line2: l2 || para.toUpperCase(),
          text: para,
          runs: [{ text: para, highlight: false }]
        });
        i++;
        continue;
      }

      // 2. Pergunta retórica / Tópico curto
      if (para.endsWith('?') && para.length < 90 && !isBibleRef(para)) {
        const words = para.split(' ');
        let q1 = para;
        let q2 = '';
        if (words.length >= 4) {
          const mid = Math.max(3, Math.floor(words.length / 2));
          q1 = words.slice(0, mid).join(' ');
          q2 = words.slice(mid).join(' ').toUpperCase();
        }
        slides.push({
          type: 'cinzel_question',
          line1: q1,
          line2: q2,
          text: para,
          runs: [{ text: para, highlight: false }]
        });
        i++;
        continue;
      }

      // 3. Busca por referência bíblica nos próximos blocos
      let nextRefIdx = -1;
      for (let j = i; j < Math.min(i + 15, paras.length); j++) {
        if (isPureBibleRefLine(paras[j])) {
          nextRefIdx = j;
          break;
        }
        if (paras[j].endsWith('?') && paras[j].length < 90) {
          break;
        }
      }

      if (nextRefIdx !== -1) {
        const ref = normalizeBibleRefName(isBibleRef(paras[nextRefIdx]));
        const precedingParas = paras.slice(i, nextRefIdx);

        const hasNumberedVerses = precedingParas.some(p => /^\d{1,3}\s+[A-Za-zÀ-ÿ]/.test(p));
        if (hasNumberedVerses) {
          const match = ref.match(/^(.+?)\s*(\d+)\s*[:.,]/);
          const book = match ? match[1] : ref.split(/[:.,]/)[0];
          const chapter = match ? match[2] : '';

          for (const p of precedingParas) {
            const m = p.match(/^(\d{1,3})\s+(.*)$/);
            if (m) {
              const vNum = m[1];
              const vText = stripLeadingVerseNumber(m[2]);
              const finalRef = chapter ? `${book} ${chapter}:${vNum}` : `${book}:${vNum}`;
              slides.push({
                type: 'verse',
                reference: finalRef,
                runs: highlightCinzelThematicPhrases(formatQuotes(vText))
              });
            } else {
              slides.push({
                type: 'verse',
                reference: ref,
                runs: highlightCinzelThematicPhrases(formatQuotes(stripLeadingVerseNumber(p)))
              });
            }
          }
          i = nextRefIdx + 1;
          continue;
        }

        let verseStartIndex = precedingParas.length - 1;
        if (precedingParas.length >= 2 && precedingParas[precedingParas.length - 2].startsWith('Para remir')) {
          verseStartIndex = precedingParas.length - 2;
        }

        for (let pIdx = 0; pIdx < precedingParas.length; pIdx++) {
          const pText = precedingParas[pIdx];
          if (pIdx < verseStartIndex) {
            const sentences = pText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [pText];
            let curSlide = '';
            for (const s of sentences) {
              const cand = (curSlide ? curSlide + ' ' : '') + s.trim();
              if (cand.length > 165 && curSlide.length > 0) {
                slides.push({
                  type: 'reflection',
                  runs: [{ text: curSlide.trim(), highlight: false }]
                });
                curSlide = s.trim();
              } else {
                curSlide = cand;
              }
            }
            if (curSlide.trim().length > 0) {
              slides.push({
                type: 'reflection',
                runs: [{ text: curSlide.trim(), highlight: false }]
              });
            }
          } else {
            let fullVerseText = stripLeadingVerseNumber(pText);
            if (pIdx === verseStartIndex && verseStartIndex < precedingParas.length - 1) {
              const nextPara = precedingParas[pIdx + 1];
              fullVerseText = `${fullVerseText} ${stripLeadingVerseNumber(nextPara)}`;
              pIdx++;
            }

            if (ref.includes('1:3-4') || ref.includes('1:3,4')) {
              const vSplitIdx = fullVerseText.indexOf(', para uma herança');
              if (vSplitIdx !== -1) {
                const part1 = fullVerseText.substring(0, vSplitIdx + 1).trim();
                const part2 = fullVerseText.substring(vSplitIdx + 2).trim();
                const match = ref.match(/^(.+?)\s*(\d+)\s*[:.,]/);
                const book = match ? match[1] : ref.split(/[:.,]/)[0];
                const chapter = match ? match[2] : '1';
                slides.push({
                  type: 'verse',
                  reference: `${book} ${chapter}:3`,
                  runs: highlightCinzelThematicPhrases(formatQuotes(part1))
                });
                slides.push({
                  type: 'verse',
                  reference: `${book} ${chapter}:4`,
                  runs: highlightCinzelThematicPhrases(formatQuotes(part2))
                });
                continue;
              }
            }

            if (fullVerseText.length > 190) {
              const sentences = fullVerseText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [fullVerseText];
              let curSlide = '';
              for (const s of sentences) {
                const cand = (curSlide ? curSlide + ' ' : '') + s.trim();
                if (cand.length > 190 && curSlide.length > 0) {
                  slides.push({
                    type: 'verse',
                    reference: ref,
                    runs: highlightCinzelThematicPhrases(formatQuotes(curSlide.trim()))
                  });
                  curSlide = s.trim();
                } else {
                  curSlide = cand;
                }
              }
              if (curSlide.trim().length > 0) {
                slides.push({
                  type: 'verse',
                  reference: ref,
                  runs: highlightCinzelThematicPhrases(formatQuotes(curSlide.trim()))
                });
              }
            } else {
              slides.push({
                type: 'verse',
                reference: ref,
                runs: highlightCinzelThematicPhrases(formatQuotes(fullVerseText))
              });
            }
          }
        }

        i = nextRefIdx + 1;
        continue;
      }

      const sentences = para.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [para];
      let curSlide = '';
      for (const s of sentences) {
        const cand = (curSlide ? curSlide + ' ' : '') + s.trim();
        if (cand.length > 165 && curSlide.length > 0) {
          slides.push({
            type: 'reflection',
            runs: [{ text: curSlide.trim(), highlight: false }]
          });
          curSlide = s.trim();
        } else {
          curSlide = cand;
        }
      }
      if (curSlide.trim().length > 0) {
        slides.push({
          type: 'reflection',
          runs: [{ text: curSlide.trim(), highlight: false }]
        });
      }
      i++;
    }

    return slides.length > 0 ? slides : [{
      type: 'verse',
      reference: 'Sermão',
      runs: [{ text: rawText.substring(0, 200), highlight: false }]
    }];
  }

  // --- MOTOR ESPECIALIZADO DE SERMÃO / ROTEIRO DO TEAMS ---
  function parseTeamsDirectionTextBrowser(rawText, options = { onlyVerses: true }) {
    const onlyVerses = options.onlyVerses !== false;

    const normalized = (rawText || '')
      .replace(/\u00A0/g, ' ')
      .replace(/\r\n/g, '\n');

    const rawParagraphs = normalized
      .split(/\n\s*\n+/)
      .map(p => p.trim())
      .filter(Boolean);

    const parsedItems = [];

    const isAdministrativeNoise = (text) => {
      const t = text.trim();
      if (/não compartilhar fora do teams/i.test(t)) return true;
      if (/^_{3,}$/.test(t)) return true;
      if (/^(?:segunda|terça|quarta|quinta|sexta|sábado|domingo)[-–—\s\w/]+/i.test(t) && t.length < 50) return true;
      if (/^📌\s*(?:sugestão|vamos|domingo|25\/\d{2}|ajuda para a obra)/i.test(t)) return true;
      if (/^(?:podemos chamar|uma vez diante|vamos trabalhar|vamos orar|vamos entregar|vamos recolher)/i.test(t)) return true;
      return false;
    };

    for (let i = 0; i < rawParagraphs.length; i++) {
      const p = rawParagraphs[i];

      if (/^_{3,}$/.test(p)) continue;

      // Padrão 1: “Versículo...” Referência (com citação entre aspas terminando na referência)
      const inlineQuoteAndRef = p.match(/^[“"']\s*(.+?)\s*[”"']\s*([A-Za-z0-9À-ÿ\s.:,-]+)$/s);
      if (inlineQuoteAndRef) {
        const vText = inlineQuoteAndRef[1].replace(/\s+/g, ' ').trim();
        const possibleRef = inlineQuoteAndRef[2].trim();
        const refMatch = isBibleRef(possibleRef);
        if (refMatch) {
          parsedItems.push({
            type: 'verse',
            reference: normalizeBibleRefName(refMatch),
            text: vText
          });
          continue;
        }
      }

      const lines = p.split('\n').map(l => l.trim()).filter(Boolean);
      const lastLine = lines[lines.length - 1];

      // Padrão 2: Última linha do parágrafo é PURAMENTE uma referência bíblica
      if (lines.length > 1 && isPureBibleRefLine(lastLine)) {
        const refMatch = isBibleRef(lastLine);
        const vText = lines.slice(0, lines.length - 1).join(' ').replace(/^[“"']|[”"']$/g, '').replace(/\s+/g, ' ').trim();
        parsedItems.push({
          type: 'verse',
          reference: normalizeBibleRefName(refMatch),
          text: vText
        });
        continue;
      }

      // Padrão 3: Versículo em P[i] e próximo parágrafo P[i+1] é uma referência isolada
      if (i + 1 < rawParagraphs.length && isPureBibleRefLine(rawParagraphs[i + 1])) {
        const refMatch = isBibleRef(rawParagraphs[i + 1]);
        const vText = p.replace(/^[“"']|[”"']$/g, '').replace(/\s+/g, ' ').trim();
        parsedItems.push({
          type: 'verse',
          reference: normalizeBibleRefName(refMatch),
          text: vText
        });
        i++;
        continue;
      }

      // Padrão 4: Referência bíblica no final da última linha
      const trailingRefMatch = isBibleRef(lastLine);
      if (trailingRefMatch && !lastLine.startsWith('(') && !lastLine.startsWith('•') && !lastLine.startsWith('📌')) {
        const isDirective = /^(?:vamos|podemos|oração|sugestão|ajuda)/i.test(p);
        if (!isDirective) {
          const cleanRef = trailingRefMatch;
          const pWithoutRef = p.replace(new RegExp(`\\s*${cleanRef.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*$`, 'i'), '').trim();
          const vText = pWithoutRef.replace(/^[“"']|[”"']$/g, '').replace(/\s+/g, ' ').trim();
          if (vText.length > 5) {
            parsedItems.push({
              type: 'verse',
              reference: normalizeBibleRefName(cleanRef),
              text: vText
            });
            continue;
          }
        }
      }

      // Se NÃO for versículo, e a opção "Manter Explicações" estiver selecionada:
      if (!onlyVerses) {
        if (isAdministrativeNoise(p)) {
          continue;
        }

        if (p.includes('•')) {
          const bulletLines = lines.filter(l => l.startsWith('•') || l.startsWith('-'));
          for (const bl of bulletLines) {
            const cleanBullet = bl.replace(/^[•\-\s]+/, '').trim();
            if (cleanBullet.length > 5 && !isAdministrativeNoise(cleanBullet)) {
              parsedItems.push({
                type: 'reflection',
                text: cleanBullet
              });
            }
          }
          continue;
        }

        if (p.startsWith('🔴') || (p.endsWith('?') && p.length < 80)) {
          const cleanHeading = p.replace(/^🔴\s*/, '').replace(/\(Palavra\)/i, '').trim();
          parsedItems.push({
            type: cleanHeading.endsWith('?') ? 'question_short' : 'topic',
            text: cleanHeading
          });
          continue;
        }

        if (p.length > 20) {
          parsedItems.push({
            type: 'reflection',
            text: p
          });
        }
      }
    }

    const slides = [];

    for (const item of parsedItems) {
      if (item.type === 'verse') {
        const chunks = splitTextByPunctuation(item.text, 220);
        chunks.forEach(chunk => {
          slides.push({
            type: 'verse',
            reference: item.reference,
            runs: buildRunsFromText(formatQuotes(chunk))
          });
        });
      } else if (item.type === 'question_short') {
        slides.push({
          type: 'question_short',
          runs: buildRunsFromText(item.text)
        });
      } else if (item.type === 'topic') {
        slides.push({
          type: 'topic',
          runs: buildRunsFromText(item.text)
        });
      } else {
        const chunks = splitTextByPunctuation(item.text, 220);
        chunks.forEach(chunk => {
          slides.push({
            type: 'reflection',
            runs: buildRunsFromText(chunk)
          });
        });
      }
    }

    return slides.length > 0 ? slides : [{
      type: 'verse',
      reference: 'Direção formatada previamente',
      runs: [{ text: rawText.substring(0, 200), highlight: false }]
    }];
  }

  // Ação de Geração de Slides
  if (btnGenerate) {
    btnGenerate.addEventListener('click', async () => {
      // 1. Caso o usuário esteja na aba de fotos/imagens com IA
      if (activeSlideKillerTab === 'tab-images-ocr') {
        if (sermonImageFiles.length === 0) {
          showToast('Por favor, anexe pelo menos uma foto de slide ou tela com versículo.', 'error');
          return;
        }
        const bVersion = bibleVersionSelect ? bibleVersionSelect.value : 'exact';
        await extractVersesFromImagesWithGemini(sermonImageFiles, bVersion);
        return;
      }

      // 2. Caso PDF ou Texto manual
      const text = sermonTextInput.value.trim();
      if (!currentFile && !text) {
        showToast('Envie um arquivo PDF ou cole o texto do sermão.', 'error');
        return;
      }

      const isClientEnvironment = isNoBackendEnvironment;

      btnGenerate.disabled = true;
      btnGenerate.innerHTML = '<span>⚡</span> Extraindo slides instantaneamente...';

      async function runClientProcessing() {
        let extractedText = text;
        if (currentFile) {
          extractedText = await extractTextFromPdfInBrowser(currentFile);
        }

        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error('Nenhum texto pôde ser lido do arquivo.');
        }

        if (activeSlideKillerTab === 'tab-text' && activeTextMode === 'teams') {
          currentSlides = parseTeamsDirectionTextBrowser(extractedText, { onlyVerses: activeTeamsOption === 'only-verses' });
          const desc = activeTeamsOption === 'only-verses' ? 'apenas versículos' : 'com explicações';
          showToast(`💬 ${currentSlides.length} slides da Direção formatada previamente (${desc}) gerados!`, 'success');
        } else if (checkUseAi && checkUseAi.checked) {
          btnGenerate.innerHTML = '<span>🤖</span> IA Gemini refinando estrutura...';
          try {
            currentSlides = await parseSermonWithGeminiBrowser(extractedText);
            showToast(`🎉 ${currentSlides.length} slides validados com IA Gemini!`, 'success');
          } catch (aiErr) {
            console.warn('IA demorou ou falhou, ativando motor instantâneo da igreja:', aiErr.message);
            currentSlides = parseSermonOfflineBrowser(extractedText);
            showToast(`⚡ ${currentSlides.length} slides estruturados instantaneamente!`, 'success');
          }
        } else {
          // MOTOR INSTANTÂNEO DA IGREJA (5ms)
          currentSlides = parseSermonOfflineBrowser(extractedText);
          showToast(`⚡ ${currentSlides.length} slides gerados instantaneamente!`, 'success');
        }

        currentDownloadUrl = null;
        renderResults();
      }

      if (isClientEnvironment) {
        try {
          await runClientProcessing();
        } catch (cErr) {
          console.error(cErr);
          showToast(cErr.message || 'Erro ao processar PDF.', 'error');
        } finally {
          btnGenerate.disabled = false;
          btnGenerate.innerHTML = (activeSlideKillerTab === 'tab-images-ocr')
            ? '<span class="btn-icon">⚡</span> Extrair Versículos e Gerar Slides com IA'
            : '<span class="btn-icon">⚡</span> Gerar Slides Instantaneamente';
        }
        return;
      }

      // Ambiente com servidor local ativo
      const formData = new FormData();
      if (currentFile) formData.append('pdfFile', currentFile);
      if (text) formData.append('sermonText', text);
      formData.append('useAi', checkUseAi.checked);
      formData.append('textMode', activeTextMode);
      formData.append('teamsOption', activeTeamsOption);
      if (templateSelect && templateSelect.value) {
        formData.append('selectedBg', templateSelect.value);
      }
      if (customBgFile && templateSelect && templateSelect.value === '__custom_active__') {
        formData.append('bgImage', customBgFile);
      }

      try {
        const res = await fetch('/api/slides/upload-pdf', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Falha ao processar arquivo no servidor.');
        }

        currentSlides = data.slides || [];
        currentDownloadUrl = data.downloadUrl;

        showToast(data.message || 'Slides gerados com sucesso!', 'success');
        renderResults();

      } catch (err) {
        console.warn('Backend local indisponível, ativando processador instantâneo:', err.message);
        try {
          await runClientProcessing();
        } catch (localErr) {
          console.error('Erro no processamento local:', localErr);
          showToast(localErr.message || 'Erro ao processar PDF.', 'error');
        }
      } finally {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = (activeSlideKillerTab === 'tab-images-ocr')
          ? '<span class="btn-icon">⚡</span> Extrair Versículos e Gerar Slides com IA'
          : '<span class="btn-icon">⚡</span> Gerar Slides Instantaneamente';
      }
    });
  }

  let draggedSlideKillerIndex = null;

  function moveSlideKillerSlide(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= currentSlides.length || toIndex < 0 || toIndex >= currentSlides.length) return;
    if (fromIndex === toIndex) return;
    const [moved] = currentSlides.splice(fromIndex, 1);
    currentSlides.splice(toIndex, 0, moved);
    currentDownloadUrl = null;
    renderResults();
  }

  // Renderizar resultados dos slides (Módulo 1: Slide Killer)
  function renderResults() {
    inputSection.style.display = 'none';
    resultsSection.style.display = 'block';
    if (btnDownloadTop) btnDownloadTop.style.display = 'inline-flex';

    slideCountBadge.textContent = `${currentSlides.length} ${currentSlides.length === 1 ? 'slide' : 'slides'}`;
    slidesGrid.innerHTML = '';

    const globalBgUrl = getActiveBackgroundUrl();

    currentSlides.forEach((slide, index) => {
      const card = document.createElement('div');
      card.className = 'slide-card';
      card.draggable = true;
      card.dataset.index = String(index);

      const slideBgUrl = slide.bgImage || globalBgUrl;
      const fullText = (slide.runs || []).map(r => r.text).join('');
      const previewHtml = (slide.runs || []).map(r => {
        return r.highlight ? `<span class="highlight">${escapeHtml(r.text)}</span>` : escapeHtml(r.text);
      }).join('');

      // Ajuste proporcional do tamanho de fonte para a miniatura 16:9 refletir fielmente o telão
      let previewFontSize = '16.5px';
      if (fullText.length <= 80) previewFontSize = '20px';
      else if (fullText.length <= 140) previewFontSize = '17.5px';
      else if (fullText.length <= 220) previewFontSize = '15px';
      else previewFontSize = '13px';

      const isCinzel = slideBgUrl.includes('cinzel') || slideBgUrl.includes('nobre') || currentSelectedFont === 'cinzel';

      card.innerHTML = `
        <div class="slide-card-header">
          <div class="slide-card-header-left">
            <span class="slide-card-badge">SLIDE #${index + 1}</span>
            <div class="slide-card-reorder-group">
              <button type="button" class="btn-card-reorder btn-sk-prev" data-action="prev" title="Mover slide para trás" ${index === 0 ? 'disabled' : ''}>⬅</button>
              <button type="button" class="btn-card-reorder btn-sk-next" data-action="next" title="Mover slide para frente" ${index === currentSlides.length - 1 ? 'disabled' : ''}>➡</button>
            </div>
          </div>
          <div class="slide-card-header-right">
            ${slide.bgImage ? '<span class="slide-custom-bg-tag" title="Este slide possui um fundo personalizado individual">🖼️ Fundo Próprio</span>' : ''}
            <span class="slide-type-tag">${slide.type || 'versículo'}</span>
          </div>
        </div>
        <div class="slide-preview-container ${currentSelectedAlign === 'center' || isCinzel ? 'align-center' : ''} ${isCinzel ? 'theme-cinzel' : ''}" style="background-image: url('${slideBgUrl}');" title="Arraste para reordenar ou use as setas acima">
          <div class="slide-preview-content">
            <div class="slide-preview-verse-box">
              <div class="slide-preview-text" style="font-size: ${previewFontSize};">${previewHtml}</div>
            </div>
            <div class="slide-preview-ref-box" style="${slide.reference ? '' : 'display: none;'}">
              <span class="slide-preview-ref">${escapeHtml((slide.reference || '').toUpperCase())}</span>
            </div>
          </div>
        </div>
        <div class="slide-editor">
          <textarea class="slide-text-edit" data-index="${index}" placeholder="Texto do slide...">${escapeHtml(fullText)}</textarea>
          <div class="slide-editor-row">
            <input type="text" class="slide-ref-edit" data-index="${index}" placeholder="Referência (ex: Mateus 6:19)" value="${escapeHtml(slide.reference || '')}">
            <div class="slide-editor-actions">
              <input type="file" class="slide-bg-input" accept="image/*" style="display: none;">
              <button type="button" class="btn-slide-bg" title="Trocar imagem de fundo deste slide específico">
                🖼️ Fundo
              </button>
              ${slide.bgImage ? `
                <button type="button" class="btn-reset-slide-bg" title="Restaurar fundo padrão da apresentação">
                  ↩️ Padrão
                </button>
              ` : ''}
              <button type="button" class="btn-delete-slide" data-index="${index}" title="Excluir este slide">🗑️</button>
            </div>
          </div>
        </div>
      `;

      // Botões de reordenação direta (⬅ / ➡)
      const btnPrev = card.querySelector('.btn-sk-prev');
      const btnNext = card.querySelector('.btn-sk-next');

      if (btnPrev && index > 0) {
        btnPrev.addEventListener('click', (e) => {
          e.stopPropagation();
          moveSlideKillerSlide(index, index - 1);
        });
      }

      if (btnNext && index < currentSlides.length - 1) {
        btnNext.addEventListener('click', (e) => {
          e.stopPropagation();
          moveSlideKillerSlide(index, index + 1);
        });
      }

      // Drag and Drop nativo no PC
      card.addEventListener('dragstart', (e) => {
        if (e.target.closest('textarea, input, button, select, a, label')) {
          e.preventDefault();
          return;
        }
        draggedSlideKillerIndex = index;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('#slides-grid .slide-card').forEach(c => c.classList.remove('drag-over'));
        draggedSlideKillerIndex = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedSlideKillerIndex !== null && draggedSlideKillerIndex !== index) {
          card.classList.add('drag-over');
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (draggedSlideKillerIndex !== null && draggedSlideKillerIndex !== index) {
          moveSlideKillerSlide(draggedSlideKillerIndex, index);
        }
      });

      // Touch Drag & Drop para celulares (toque longo de 220ms com haptic feedback e auto-scroll)
      attachTouchDragAndDrop(card, index, moveSlideKillerSlide, '.slide-card');

      // Listeners do editor do card
      const textEdit = card.querySelector('.slide-text-edit');
      const refEdit = card.querySelector('.slide-ref-edit');
      const btnDelete = card.querySelector('.btn-delete-slide');
      const previewText = card.querySelector('.slide-preview-text');
      const previewRefBox = card.querySelector('.slide-preview-ref-box');
      const previewRef = card.querySelector('.slide-preview-ref');
      const bgInput = card.querySelector('.slide-bg-input');
      const btnBg = card.querySelector('.btn-slide-bg');
      const btnResetBg = card.querySelector('.btn-reset-slide-bg');

      if (textEdit) {
        textEdit.addEventListener('input', (e) => {
          const val = e.target.value;
          const prevHighlights = (currentSlides[index].runs || [])
            .filter(r => r.highlight && r.text)
            .map(r => r.text.trim())
            .filter(Boolean);

          let newRuns;
          if (val.includes('[HL]')) {
            newRuns = buildRunsFromText(val);
          } else if (/\*[^*]+\*/.test(val) || prevHighlights.length > 0) {
            newRuns = buildRunsFromHighlights(val, prevHighlights);
          } else {
            newRuns = [{ text: val, highlight: false }];
          }

          currentSlides[index].runs = newRuns;
          if (previewText) {
            previewText.innerHTML = newRuns.map(r => (
              r.highlight ? `<span class="highlight">${escapeHtml(r.text)}</span>` : escapeHtml(r.text)
            )).join('');
            let newFs = '16.5px';
            if (val.length <= 80) newFs = '20px';
            else if (val.length <= 140) newFs = '17.5px';
            else if (val.length <= 220) newFs = '15px';
            else newFs = '13px';
            previewText.style.fontSize = newFs;
          }
          currentDownloadUrl = null;
        });
      }

      if (refEdit) {
        refEdit.addEventListener('input', (e) => {
          const val = e.target.value.trim();
          currentSlides[index].reference = val;
          if (previewRef && previewRefBox) {
            if (val) {
              previewRef.textContent = val.toUpperCase();
              previewRefBox.style.display = 'block';
            } else {
              previewRef.textContent = '';
              previewRefBox.style.display = 'none';
            }
          }
          currentDownloadUrl = null;
        });
      }

      if (btnDelete) {
        btnDelete.addEventListener('click', () => {
          currentSlides.splice(index, 1);
          currentDownloadUrl = null;
          renderResults();
        });
      }

      if (btnBg && bgInput) {
        btnBg.addEventListener('click', () => bgInput.click());
        bgInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione uma imagem válida (.jpg, .png, .webp).', 'error');
            return;
          }
          const reader = new FileReader();
          reader.onload = (ev) => {
            currentSlides[index].bgImage = ev.target.result;
            currentDownloadUrl = null;
            renderResults();
            showToast(`Fundo do Slide ${index + 1} alterado com sucesso!`, 'success');
          };
          reader.readAsDataURL(file);
        });
      }

      if (btnResetBg) {
        btnResetBg.addEventListener('click', () => {
          delete currentSlides[index].bgImage;
          currentDownloadUrl = null;
          renderResults();
          showToast(`Fundo do Slide ${index + 1} voltou para o padrão!`, 'info');
        });
      }

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

      if (isNoBackendEnvironment) {
        currentDownloadUrl = null;
        renderResults();
        showToast('✅ Edições salvas nos slides! Use Baixar .pptx ou Baixar PDF para exportar.', 'success');
        return;
      }

      btnRebuild.disabled = true;
      btnRebuild.textContent = 'Salvando...';

      try {
        const activeBgUrl = getActiveBackgroundUrl();
        const selectedBgVal = (customBgServerUrl && templateSelect && templateSelect.value === '__custom_active__')
          ? customBgServerUrl
          : activeBgUrl;

        const res = await fetch('/api/slides/rebuild', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slides: currentSlides,
            selectedBg: selectedBgVal
          })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error || 'Erro ao reconstruir.');

        currentDownloadUrl = data.downloadUrl;
        showToast('Apresentação atualizada com sucesso!', 'success');
        renderResults();
      } catch (err) {
        console.warn('Backend local indisponível para rebuild, mantendo edições em memória:', err.message);
        currentDownloadUrl = null;
        renderResults();
        showToast('✅ Edições salvas localmente! Use Baixar .pptx ou Baixar PDF para exportar.', 'success');
      } finally {
        btnRebuild.disabled = false;
        btnRebuild.textContent = '💾 Salvar Edições';
      }
    });
  }

  // Construir instância configurada do PptxGenJS com todos os slides e estilos oficiais
  async function buildSlideKillerPptxInstance() {
    if (typeof PptxGenJS === 'undefined') {
      throw new Error('Biblioteca PptxGenJS não carregada. Tente novamente em instantes.');
    }
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'CHURCH_FULL_HD', width: 13.333, height: 7.5 });
    pptx.layout = 'CHURCH_FULL_HD';

    const bgUrl = getActiveBackgroundUrl();

    // Pré-carregar imagem de fundo para garantir embutimento perfeito e leve em qualquer dispositivo
    let bgBase64 = null;
    if (customBgDataUrl && templateSelect && templateSelect.value === '__custom_active__') {
      bgBase64 = customBgDataUrl;
    } else {
      try {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          bgImg.onload = () => {
            try {
              const cv = document.createElement('canvas');
              cv.width = 1920;
              cv.height = 1080;
              const cx = cv.getContext('2d');
              cx.drawImage(bgImg, 0, 0, 1920, 1080);
              bgBase64 = cv.toDataURL('image/jpeg', 0.88);
              cv.width = 0;
              cv.height = 0;
            } catch(e) {}
            resolve();
          };
          bgImg.onerror = () => resolve();
          bgImg.src = bgUrl;
        });
      } catch (e) {}
    }

    const isCinzelGlobal = (bgUrl && (bgUrl.includes('cinzel') || bgUrl.includes('nobre'))) || currentSelectedFont === 'cinzel';
    const fontConfig = CHURCH_FONTS[currentSelectedFont] || (isCinzelGlobal ? CHURCH_FONTS['cinzel'] : CHURCH_FONTS['bahnschrift_semibold_condensed']);
    const pptxFontFace = fontConfig.pptxFontFace;
    const defaultAlign = isCinzelGlobal ? 'center' : 'left';
    const isLeftAlign = currentSelectedAlign ? currentSelectedAlign === 'left' : defaultAlign === 'left';

    for (let slideIndex = 0; slideIndex < currentSlides.length; slideIndex++) {
      const item = currentSlides[slideIndex];
      const slide = pptx.addSlide();
      if (item.bgImage) {
        if (item.bgImage.startsWith('data:')) {
          slide.background = { data: item.bgImage };
        } else {
          slide.background = { path: item.bgImage };
        }
      } else if (bgBase64) {
        slide.background = { data: bgBase64 };
      } else {
        slide.background = { path: bgUrl };
      }

      const type = item.type || 'verse';
      const isCinzel = isCinzelGlobal || (item.bgImage && (item.bgImage.includes('cinzel') || item.bgImage.includes('nobre'))) || currentSelectedFont === 'cinzel';
      const baseTextColor = isCinzel ? 'E1D3C1' : 'FFFFFF';
      const highlightColor = isCinzel ? 'E6C486' : 'E8B859';
      const refColor = isCinzel ? 'E1D3C1' : 'E8B859';
      const shadowConfig = isCinzel
        ? { type: 'outer', angle: 90, blur: 4, offset: 2, opacity: 0.65, color: '000000' }
        : { type: 'outer', angle: 90, blur: 5, offset: 3, opacity: 0.75, color: '000000' };
      const startX = isCinzel ? 0.41 : 0.9;
      const textWidth = isCinzel ? 12.52 : 11.533;
      const slideAlign = isCinzel ? 'center' : (isLeftAlign ? 'left' : 'center');

      // --- SLIDE DE CAPA / TÍTULO NO CINZEL (SLIDE 1) ---
      if (type === 'cinzel_cover' || (isCinzel && slideIndex === 0 && (type === 'topic' || type === 'cover' || type === 'title'))) {
        let l1 = item.line1;
        let l2 = item.line2;
        if (!l1 || !l2) {
          const fullTitle = item.runs ? item.runs.map(r => r.text).join('') : (item.text || '');
          const upper = fullTitle.toUpperCase();
          const splitWords = ['TÊM PARTE', 'TEM PARTE', 'PARTE NA', 'PARTE DA'];
          let found = false;
          for (const sw of splitWords) {
            const idx = upper.indexOf(sw);
            if (idx !== -1) {
              l1 = upper.substring(0, idx).trim();
              l2 = upper.substring(idx).trim();
              found = true;
              break;
            }
          }
          if (!found) {
            const words = upper.split(' ');
            if (words.length >= 3) {
              const mid = Math.ceil(words.length / 2);
              l1 = words.slice(0, mid).join(' ');
              l2 = words.slice(mid).join(' ');
            } else {
              l1 = upper;
              l2 = '';
            }
          }
        }

        const l1Words = (l1 || '').split(' ');
        let r1 = [];
        if (l1Words.length >= 3) {
          const prefix = l1Words.slice(0, 2).join(' ') + ' ';
          const suffix = l1Words.slice(2).join(' ');
          r1 = [
            { text: prefix, options: { fontFace: 'Cinzel Bold', fontSize: 60, color: 'E1D3C1', bold: true, shadow: shadowConfig } },
            { text: suffix, options: { fontFace: 'Cinzel Black', fontSize: 60, color: 'E1D3C1', bold: true, shadow: shadowConfig } }
          ];
        } else {
          r1 = [{ text: l1, options: { fontFace: 'Cinzel Bold', fontSize: 60, color: 'E1D3C1', bold: true, shadow: shadowConfig } }];
        }

        slide.addText(r1, {
          x: 0.57,
          y: 2.69,
          w: 12.19,
          h: 1.11,
          align: 'left',
          valign: 'middle',
          margin: 0,
          wrap: true
        });

        if (l2) {
          slide.addText([
            { text: l2, options: { fontFace: 'Cinzel Black', fontSize: 66, color: 'E1D3C1', bold: true, shadow: shadowConfig } }
          ], {
            x: 0.29,
            y: 3.50,
            w: 12.76,
            h: 1.21,
            align: 'left',
            valign: 'middle',
            margin: 0,
            wrap: true
          });
        }

      // --- SLIDE DE PERGUNTA / TÓPICO NO CINZEL ---
      } else if (type === 'cinzel_question' || (isCinzel && (type === 'question_short' || type === 'question'))) {
        let q1 = item.line1;
        let q2 = item.line2;
        if (!q1 || !q2) {
          const fullQ = item.runs ? item.runs.map(r => r.text).join('') : (item.text || '');
          const words = fullQ.split(' ');
          if (words.length >= 4) {
            const mid = Math.max(3, Math.floor(words.length / 2));
            q1 = words.slice(0, mid).join(' ');
            q2 = words.slice(mid).join(' ').toUpperCase();
          } else {
            q1 = fullQ;
            q2 = '';
          }
        }

        slide.addText([
          { text: q1, options: { fontFace: 'Cinzel Bold', fontSize: 54, color: 'E1D3C1', bold: true, shadow: shadowConfig } }
        ], {
          x: 1.33,
          y: 2.93,
          w: 10.33,
          h: 1.01,
          align: 'left',
          valign: 'middle',
          margin: 0,
          wrap: true
        });

        if (q2) {
          slide.addText([
            { text: q2, options: { fontFace: 'Cinzel Black', fontSize: 54, color: 'E1D3C1', bold: true, shadow: shadowConfig } }
          ], {
            x: 0.13,
            y: 3.56,
            w: 13.07,
            h: 1.21,
            align: 'center',
            valign: 'middle',
            margin: 0,
            wrap: true
          });
        }

      // --- VERSÍCULOS BÍBLICOS ---
      } else if (type === 'verse' || type === 'versículo') {
        const textLength = (item.runs || []).reduce((acc, r) => acc + (r.text || '').length, 0);
        let fontSize = 54;
        if (isCinzel) {
          if (textLength <= 90) fontSize = 54;
          else if (textLength <= 140) fontSize = 48;
          else if (textLength <= 200) fontSize = 44;
          else fontSize = 40;
        } else {
          if (textLength <= 80) fontSize = 68;
          else if (textLength <= 140) fontSize = 60;
          else if (textLength <= 200) fontSize = 54;
          else fontSize = 48;
        }

        const runs = (item.runs || []).map(r => ({
          text: r.text,
          options: {
            fontFace: isCinzel ? (r.highlight ? 'Cinzel Black' : 'Cinzel Bold') : pptxFontFace,
            fontSize: fontSize,
            color: r.highlight ? highlightColor : baseTextColor,
            bold: true,
            shadow: shadowConfig
          }
        }));

        slide.addText(runs, {
          x: startX,
          y: isCinzel ? 1.2 : 1.1,
          w: textWidth,
          h: 4.6,
          valign: 'middle',
          align: slideAlign,
          margin: 0,
          wrap: true
        });

        if (item.reference) {
          slide.addText(item.reference.toUpperCase(), {
            x: startX,
            y: isCinzel ? 5.75 : 5.85,
            w: textWidth,
            h: isCinzel ? 0.6 : 0.8,
            valign: 'middle',
            align: slideAlign,
            fontFace: isCinzel ? 'Cinzel' : pptxFontFace,
            fontSize: isCinzel ? 28 : 34,
            color: refColor,
            bold: true,
            margin: 0,
            wrap: false,
            shadow: shadowConfig
          });
        }

      } else if (type === 'reflection') {
        const textLength = (item.runs || []).reduce((acc, r) => acc + (r.text || '').length, 0);
        let fontSize = 48;
        if (isCinzel) {
          if (textLength <= 90) fontSize = 50;
          else if (textLength <= 160) fontSize = 48;
          else fontSize = 42;
        } else {
          if (textLength <= 80) fontSize = 58;
          else if (textLength <= 150) fontSize = 50;
          else fontSize = 44;
        }

        const runs = (item.runs || []).map(r => ({
          text: r.text,
          options: {
            fontFace: isCinzel ? 'Cinzel Bold' : pptxFontFace,
            fontSize: fontSize,
            color: baseTextColor,
            bold: true,
            shadow: shadowConfig
          }
        }));

        slide.addText(runs, {
          x: startX,
          y: isCinzel ? 1.5 : 1.1,
          w: textWidth,
          h: 4.5,
          valign: 'middle',
          align: slideAlign,
          margin: 0,
          wrap: true
        });

        if (item.reference && !isCinzel) {
          slide.addText(item.reference.toUpperCase(), {
            x: startX,
            y: 5.85,
            w: textWidth,
            h: 0.8,
            valign: 'middle',
            align: slideAlign,
            fontFace: pptxFontFace,
            fontSize: 34,
            color: refColor,
            bold: true,
            margin: 0,
            wrap: false,
            shadow: shadowConfig
          });
        }

      } else {
        // topic / outros
        const textLength = (item.runs || []).reduce((acc, r) => acc + (r.text || '').length, 0);
        let fontSize = 66;
        if (isCinzel) {
          if (textLength < 45) fontSize = 64;
          else if (textLength > 90) fontSize = 48;
          else fontSize = 54;
        } else {
          if (textLength < 40) fontSize = 78;
          else if (textLength > 90) fontSize = 54;
        }

        const runs = (item.runs || []).map(r => ({
          text: r.text,
          options: {
            fontFace: isCinzel ? (r.highlight ? 'Cinzel Black' : 'Cinzel Bold') : pptxFontFace,
            fontSize: fontSize,
            color: r.highlight ? highlightColor : baseTextColor,
            bold: true,
            shadow: shadowConfig
          }
        }));

        slide.addText(runs, {
          x: startX,
          y: 1.6,
          w: textWidth,
          h: 4.2,
          valign: 'middle',
          align: slideAlign,
          margin: 0,
          wrap: true
        });

        if (item.reference) {
          slide.addText(item.reference.toUpperCase(), {
            x: startX,
            y: isCinzel ? 5.75 : 5.85,
            w: textWidth,
            h: isCinzel ? 0.6 : 0.8,
            valign: 'middle',
            align: slideAlign,
            fontFace: isCinzel ? 'Cinzel' : pptxFontFace,
            fontSize: isCinzel ? 28 : 34,
            color: refColor,
            bold: true,
            margin: 0,
            wrap: false,
            shadow: shadowConfig
          });
        }
      }
    }
            fontFace: isCinzel ? 'Cinzel' : pptxFontFace,
            fontSize: isCinzel ? 28 : 34,
            color: refColor,
            bold: true,
            margin: 0,
            wrap: false,
            shadow: shadowConfig
          });
        }
      }
    }

    return pptx;
  }

  // Enriquecer o arquivo PPTX definindo a fonte padrão no tema (theme1.xml) e embutindo a fonte oficial se acessível
  async function enrichPptxWithChurchTheme(blob, fontFaceName = 'Bahnschrift SemiBold Condensed') {
    if (typeof JSZip === 'undefined') return blob;
    try {
      const zip = await JSZip.loadAsync(blob);
      let modified = false;

      // 1. Atualizar ppt/theme/theme1.xml para que o PowerPoint usem a fonte como tema Major e Minor
      const themeFile = zip.file('ppt/theme/theme1.xml');
      if (themeFile && typeof themeFile.async === 'function') {
        let themeXml = await themeFile.async('text');
        themeXml = themeXml.replace(/<a:latin typeface="[^"]*"/g, `<a:latin typeface="${fontFaceName}"`);
        zip.file('ppt/theme/theme1.xml', themeXml);
        modified = true;
      }

      // 2. Se a fonte for Bahnschrift, embutir bahnschrift.ttf caso acessível
      if (fontFaceName.includes('Bahnschrift')) {
        try {
          let fontBuf = null;
          try {
            const fontResp = await fetch('assets/bahnschrift.ttf');
            if (fontResp && fontResp.ok) fontBuf = await fontResp.arrayBuffer();
          } catch(e) {}
          if (!fontBuf) {
            try {
              const fontResp = await fetch('assets/bahnschrift.ttf');
              if (fontResp && fontResp.ok) fontBuf = await fontResp.arrayBuffer();
            } catch(e) {}
          }
          if (fontBuf) {
            zip.file('ppt/fonts/font1.fntdata', fontBuf);

            const ctFile = zip.file('[Content_Types].xml');
            if (ctFile && typeof ctFile.async === 'function') {
              let ct = await ctFile.async('text');
              if (!ct.includes('Extension="fntdata"')) {
                ct = ct.replace('</Types>', '<Default Extension="fntdata" ContentType="application/x-fontdata"/></Types>');
                zip.file('[Content_Types].xml', ct);
              }
            }

            const relsFile = zip.file('ppt/_rels/presentation.xml.rels');
            if (relsFile && typeof relsFile.async === 'function') {
              let rels = await relsFile.async('text');
              if (!rels.includes('rIdFontBahnschrift')) {
                const rel = '<Relationship Id="rIdFontBahnschrift" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/font1.fntdata"/>';
                rels = rels.replace('</Relationships>', rel + '</Relationships>');
                zip.file('ppt/_rels/presentation.xml.rels', rels);
              }
            }

            const presFile = zip.file('ppt/presentation.xml');
            if (presFile && typeof presFile.async === 'function') {
              let pres = await presFile.async('text');
              if (!pres.includes('embeddedFontLst')) {
                const embedded = '<p:embeddedFontLst>' +
                  '<p:embeddedFont>' +
                    '<p:font typeface="Bahnschrift SemiBold Condensed"/>' +
                    '<p:regular r:id="rIdFontBahnschrift"/>' +
                    '<p:bold r:id="rIdFontBahnschrift"/>' +
                  '</p:embeddedFont>' +
                  '<p:embeddedFont>' +
                    '<p:font typeface="Bahnschrift"/>' +
                    '<p:regular r:id="rIdFontBahnschrift"/>' +
                    '<p:bold r:id="rIdFontBahnschrift"/>' +
                  '</p:embeddedFont>' +
                '</p:embeddedFontLst>';
                pres = pres.replace('</p:presentation>', embedded + '</p:presentation>');
                zip.file('ppt/presentation.xml', pres);
              }
            }
            modified = true;
          }
        } catch(fontErr) {
          console.warn('[SlideKiller] Aviso ao carregar arquivo de fonte para embutimento:', fontErr);
        }
      }

      if (modified) {
        return await zip.generateAsync({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          compression: 'DEFLATE'
        });
      }
    } catch (e) {
      console.warn('[SlideKiller] Aviso ao enriquecer tema do PPTX:', e);
    }
    return blob;
  }

  function sanitizeFileName(name, fallback = 'Slide') {
    const cleaned = String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[._]+|[._]+$/g, '');
    return cleaned || fallback;
  }

  function sanitizeFileNamePreservingExt(fileName, defaultBase = 'Arquivo') {
    const raw = String(fileName || '').trim();
    const extMatch = raw.match(/\.([A-Za-z0-9]{1,8})$/);
    const ext = extMatch ? '.' + extMatch[1].toLowerCase() : '';
    const stem = ext ? raw.slice(0, -ext.length) : raw;
    const safeStem = sanitizeFileName(stem, defaultBase).slice(0, 64);
    return `${safeStem}${ext}`;
  }

  function getMimeTypeForFileName(fileName) {
    const ext = String(fileName || '').split('.').pop().toLowerCase();
    const map = {
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      pdf: 'application/pdf',
      zip: 'application/zip',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      bmp: 'image/bmp',
      svg: 'image/svg+xml'
    };
    return map[ext] || 'application/octet-stream';
  }

  let isNativeShareActive = false;

  // Converter Blob para Base64 puro
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const res = reader.result;
        const base64 = typeof res === 'string' ? res.split(',')[1] : '';
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  // Salvar ou Compartilhar Arquivo de forma 100% Nativa (Capacitor Android + Fallback Web)
  async function saveOrShareFileNative(blob, fileName, mode = 'share') {
    const safeFileName = sanitizeFileNamePreservingExt(fileName, 'Arquivo');
    const isCapacitor = window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
      if (isNativeShareActive) {
        showToast('Aguarde o compartilhamento anterior terminar.', 'info');
        return false;
      }

      let savedToDocuments = false;
      try {
        const Plugins = window.Capacitor.Plugins || {};
        const Filesystem = Plugins.Filesystem;
        const Share = Plugins.Share;

        if (!Filesystem) {
          throw new Error('Plugin Filesystem indisponível neste dispositivo.');
        }

        showToast('Preparando arquivo para ' + (mode === 'share' ? 'compartilhar' : 'salvar') + '...', 'info');
        let base64Data = await blobToBase64(blob);
        if (!base64Data) {
          throw new Error('Falha ao codificar arquivo gerado.');
        }

        // 1. Grava uma única vez no CACHE interno com nome ASCII seguro (obrigatório para FileProvider & MimeTypeMap)
        const cacheRes = await Filesystem.writeFile({
          path: safeFileName,
          data: base64Data,
          directory: 'CACHE',
          recursive: true
        });
        base64Data = null;
        const fileUri = cacheRes && cacheRes.uri ? cacheRes.uri : null;

        // 2. Se for download, copia nativamente no Android (zero tráfego extra na ponte JS/Java)
        if (mode === 'download' && fileUri) {
          try {
            await Filesystem.mkdir({ path: 'SlideKiller', directory: 'DOCUMENTS', recursive: true }).catch(() => {});
            await Filesystem.deleteFile({ path: 'SlideKiller/' + safeFileName, directory: 'DOCUMENTS' }).catch(() => {});
            await Filesystem.copy({
              from: safeFileName,
              directory: 'CACHE',
              to: 'SlideKiller/' + safeFileName,
              toDirectory: 'DOCUMENTS'
            });
            savedToDocuments = true;
          } catch (docErr) {
            try {
              const uniqueName = safeFileName.replace(/(\.[a-z0-9]+)$/i, `_${Date.now()}$1`);
              await Filesystem.copy({
                from: safeFileName,
                directory: 'CACHE',
                to: 'SlideKiller/' + uniqueName,
                toDirectory: 'DOCUMENTS'
              });
              savedToDocuments = true;
            } catch (docErr2) {
              console.warn('[Capacitor] Aviso ao copiar para Documentos:', docErr, docErr2);
            }
          }
        }

        // 3. Aciona a folha nativa do Android (apenas files + title, sem duplicar url/text)
        if (Share && fileUri) {
          isNativeShareActive = true;
          try {
            await Share.share({
              title: safeFileName,
              files: [fileUri],
              dialogTitle: (mode === 'share') ? 'Compartilhar Arquivo' : 'Salvar ou Enviar Arquivo'
            });
            showToast(savedToDocuments ? `🎉 Salvo em Documentos/SlideKiller/${safeFileName}` : '🎉 Pronto!', 'success');
            return true;
          } catch (shareErr) {
            const msg = (shareErr && shareErr.message) ? shareErr.message : String(shareErr || '');
            if (/cancel|abort/i.test(msg)) {
              if (savedToDocuments) {
                showToast(`📁 Salvo em Documentos/SlideKiller/${safeFileName}`, 'success');
                return true;
              }
              showToast('Compartilhamento cancelado.', 'info');
              return false;
            }
            if (savedToDocuments) {
              showToast(`📁 Salvo em Documentos/SlideKiller/${safeFileName}`, 'success');
              return true;
            }
            throw shareErr;
          } finally {
            isNativeShareActive = false;
          }
        } else if (fileUri) {
          showToast(savedToDocuments ? `🎉 Salvo em Documentos/SlideKiller/${safeFileName}` : '🎉 Arquivo salvo no dispositivo!', 'success');
          return true;
        }
        return false;
      } catch (capErr) {
        isNativeShareActive = false;
        console.error('[Capacitor] Erro no compartilhamento/download nativo:', capErr);
        showToast('Erro nativo ao exportar: ' + (capErr.message || String(capErr)), 'error');
        return false;
      }
    }

    // Fallback Web Browser padrão (Desktop / Web)
    if (mode === 'share' && navigator.share && navigator.canShare) {
      try {
        const mimeType = getMimeTypeForFileName(safeFileName);
        const file = new File([blob], safeFileName, { type: mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: safeFileName,
            text: 'Arquivo gerado pela Central Multimídia Church'
          });
          showToast('🎉 Compartilhado com sucesso!', 'success');
          return true;
        }
      } catch(e) {
        if (e && e.name === 'AbortError') {
          showToast('Compartilhamento cancelado.', 'info');
          return false;
        }
      }
    }

    // Fallback padrão: link <a download> do navegador
    try {
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = safeFileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
      showToast('🎉 Download iniciado!', 'success');
      return true;
    } catch(err) {
      console.error('Erro no fallback de download:', err);
      showToast('Erro ao baixar arquivo: ' + err.message, 'error');
      return false;
    }
  }

  async function getSlideKillerPptxData() {
    if (currentSlides.length === 0) return null;
    const pptx = await buildSlideKillerPptxInstance();
    const fileName = 'SLIDES_CULTO_' + Date.now() + '.pptx';
    const rawBlob = await pptx.write({ outputType: 'blob' });
    const fontName = (CHURCH_FONTS[currentSelectedFont] || CHURCH_FONTS['bahnschrift_semibold_condensed']).pptxFontFace;
    const blob = await enrichPptxWithChurchTheme(rawBlob, fontName);
    return { blob, fileName };
  }

  // Download PPTX no cliente com PptxGenJS (100% fiel ao estilo da igreja)
  async function exportSlideKillerPptx() {
    if (currentSlides.length === 0) {
      showToast('Nenhum slide para exportar.', 'error');
      return false;
    }

    showToast('Gerando apresentação em PowerPoint (.pptx)...', 'info');

    try {
      const data = await getSlideKillerPptxData();
      if (!data) return false;
      return await saveOrShareFileNative(data.blob, data.fileName, 'download');
    } catch (err) {
      console.error('Erro ao exportar PPTX:', err);
      showToast('Erro ao exportar PPTX: ' + err.message, 'error');
      return false;
    }
  }

  // Download PDF no cliente com jsPDF - Proporções e tipografia oficiais 16:9 Full HD
  async function exportSlideKillerPdf() {
    if (currentSlides.length === 0) {
      showToast('Nenhum slide para exportar.', 'error');
      return false;
    }

    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
      showToast('Biblioteca jsPDF não carregada. Tente novamente em instantes.', 'error');
      return false;
    }

    showToast('Gerando documento em PDF (.pdf)...', 'info');

    let canvas = null;
    try {
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch(e) {}
      }

      const { jsPDF } = window.jspdf;
      const baseW = 1920;
      const baseH = 1080;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [baseW, baseH],
        hotfixes: ['px_scaling']
      });

      const bgUrl = getActiveBackgroundUrl();
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';

      await new Promise((resolve) => {
        bgImg.onload = resolve;
        bgImg.onerror = resolve;
        bgImg.src = bgUrl;
      });

      canvas = document.createElement('canvas');
      canvas.width = baseW;
      canvas.height = baseH;
      const ctx = canvas.getContext('2d');

      const fontConfig = CHURCH_FONTS[currentSelectedFont] || CHURCH_FONTS['bahnschrift_semibold_condensed'];
      const isLeftAlign = currentSelectedAlign === 'left';
      const fontCss = fontConfig.cssFamily;

      const startX = 130;
      const maxWidth = 1660; // Margens simétricas de 130px em ambos os lados (idêntico ao PPTX)
      const topLimit = 150;
      const availableHeight = 670; // Área útil entre topo e rodapé

      // Função auxiliar interna para quebrar runs em linhas preservando destaques
      const wrapRuns = (runs, c, maxW) => {
        const tokens = [];
        for (const r of runs) {
          const parts = (r.text || '').split(/(\s+)/);
          for (const p of parts) {
            if (p.length === 0) continue;
            tokens.push({
              text: p,
              highlight: !!r.highlight,
              isSpace: /^\s+$/.test(p)
            });
          }
        }

        const lines = [];
        let curLine = [];
        let curLineWidth = 0;

        for (const token of tokens) {
          const w = c.measureText(token.text).width;
          if (token.isSpace) {
            if (curLine.length > 0) {
              curLine.push({ ...token, width: w });
              curLineWidth += w;
            }
          } else {
            if (curLineWidth + w > maxW && curLine.length > 0) {
              while (curLine.length > 0 && curLine[curLine.length - 1].isSpace) {
                curLineWidth -= curLine.pop().width;
              }
              lines.push(curLine);
              curLine = [{ ...token, width: w }];
              curLineWidth = w;
            } else {
              curLine.push({ ...token, width: w });
              curLineWidth += w;
            }
          }
        }

        if (curLine.length > 0) {
          while (curLine.length > 0 && curLine[curLine.length - 1].isSpace) {
            curLine.pop();
          }
          lines.push(curLine);
        }

        return lines;
      };

      for (let i = 0; i < currentSlides.length; i++) {
        if (i > 0) doc.addPage([baseW, baseH], 'landscape');

        const item = currentSlides[i];

        // 1. Fundo (suporta fundo específico por slide ou padrão global)
        let slideBgDrawable = bgImg;
        if (item.bgImage) {
          const itemImg = new Image();
          itemImg.crossOrigin = 'anonymous';
          await new Promise((resolve) => {
            itemImg.onload = resolve;
            itemImg.onerror = resolve;
            itemImg.src = item.bgImage;
          });
          if (itemImg.complete && itemImg.naturalWidth > 0) {
            slideBgDrawable = itemImg;
          }
        }

        if (slideBgDrawable && slideBgDrawable.complete && slideBgDrawable.naturalWidth > 0) {
          ctx.drawImage(slideBgDrawable, 0, 0, baseW, baseH);
        } else {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, baseW, baseH);
        }

        const type = item.type || 'verse';
        const textLength = (item.runs || []).reduce((acc, r) => acc + (r.text || '').length, 0);
        const isCinzel = (bgUrl && (bgUrl.includes('cinzel') || bgUrl.includes('nobre'))) ||
                         (item.bgImage && (item.bgImage.includes('cinzel') || item.bgImage.includes('nobre'))) ||
                         currentSelectedFont === 'cinzel';
        const slideFontCss = isCinzel ? CHURCH_FONTS['cinzel'].cssFamily : fontCss;
        const baseTextColor = isCinzel ? '#E1D3C1' : '#FFFFFF';
        const highlightColor = isCinzel ? '#E6C486' : '#E8B859';
        const refColor = isCinzel ? '#E1D3C1' : '#E8B859';
        const slideAlignLeft = isCinzel ? false : isLeftAlign;

        // 2. Cálculo do tamanho de fonte cinematográfico Full HD (escala 2x para 1080p, idêntico aos pt do PowerPoint)
        let fontSize = 108;
        if (isCinzel) {
          if (type === 'question_short') {
            fontSize = 144;
          } else if (type === 'reflection') {
            if (textLength <= 90) fontSize = 100;
            else if (textLength <= 160) fontSize = 92;
            else fontSize = 84;
          } else if (type === 'topic') {
            if (textLength < 45) fontSize = 128;
            else if (textLength > 90) fontSize = 96;
            else fontSize = 108;
          } else {
            if (textLength <= 90) fontSize = 108;
            else if (textLength <= 140) fontSize = 96;
            else if (textLength <= 200) fontSize = 88;
            else fontSize = 80;
          }
        } else {
          if (type === 'question_short') {
            fontSize = 180;
          } else if (type === 'reflection') {
            if (textLength <= 80) fontSize = 116;
            else if (textLength <= 150) fontSize = 100;
            else fontSize = 88;
          } else if (type === 'topic') {
            if (textLength < 40) fontSize = 156;
            else if (textLength > 90) fontSize = 108;
            else fontSize = 132;
          } else {
            // Versículo bíblico
            if (textLength <= 80) fontSize = 136;
            else if (textLength <= 140) fontSize = 120;
            else if (textLength <= 200) fontSize = 108;
            else fontSize = 96;
          }
        }

        ctx.font = `bold ${fontSize}px ${slideFontCss}`;
        let lineHeight = fontSize * (isCinzel ? 1.28 : 1.22);
        let lines = wrapRuns(item.runs || [], ctx, maxWidth);
        let totalTextHeight = lines.length * lineHeight;

        // Auto-fit inteligente: reduz gradualmente caso versículos muito longos passem do limite vertical
        while (totalTextHeight > availableHeight && fontSize > 68) {
          fontSize -= 4;
          ctx.font = `bold ${fontSize}px ${slideFontCss}`;
          lineHeight = fontSize * (isCinzel ? 1.28 : 1.22);
          lines = wrapRuns(item.runs || [], ctx, maxWidth);
          totalTextHeight = lines.length * lineHeight;
        }

        // 3. Centralização vertical harmoniosa (valign: middle)
        const startY = topLimit + Math.max(0, (availableHeight - totalTextHeight) / 2);

        // Configuração de sombras idêntica ao PowerPoint
        ctx.shadowColor = isCinzel ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = isCinzel ? 6 : 8;
        ctx.shadowOffsetX = isCinzel ? 2 : 3;
        ctx.shadowOffsetY = isCinzel ? 2 : 3;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // 4. Desenha as linhas do versículo / texto principal
        for (let lIdx = 0; lIdx < lines.length; lIdx++) {
          const line = lines[lIdx];
          const y = startY + lIdx * lineHeight;
          const lineWidth = line.reduce((sum, seg) => sum + seg.width, 0);
          let curX = slideAlignLeft ? startX : Math.round((baseW - lineWidth) / 2);

          for (const seg of line) {
            ctx.fillStyle = seg.highlight ? highlightColor : baseTextColor;
            ctx.fillText(seg.text, curX, y);
            curX += seg.width;
          }
        }

        // 5. Caixa 2: Referência Bíblica SEPARADA no rodapé (y = 880px, fontSize: 68px)
        if (item.reference) {
          const refFontSize = isCinzel ? 56 : 68; // Proporção idêntica aos 28pt / 34pt do PowerPoint
          ctx.font = `bold ${refFontSize}px ${slideFontCss}`;
          ctx.fillStyle = refColor;
          ctx.shadowColor = isCinzel ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = isCinzel ? 5 : 6;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          const refText = item.reference.toUpperCase();
          const refY = isCinzel ? 860 : 880;

          if (slideAlignLeft) {
            ctx.textAlign = 'left';
            ctx.fillText(refText, startX, refY);
          } else {
            ctx.textAlign = 'center';
            ctx.fillText(refText, baseW / 2, refY);
          }
        }

        const slideImgData = canvas.toDataURL('image/jpeg', 0.92);
        doc.addImage(slideImgData, 'JPEG', 0, 0, baseW, baseH, undefined, 'FAST');
      }

      canvas.width = 0;
      canvas.height = 0;
      canvas = null;

      const fileName = 'SLIDES_CULTO_' + Date.now() + '.pdf';
      const pdfBlob = doc.output('blob');
      return await saveOrShareFileNative(pdfBlob, fileName, 'download');
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      showToast('Erro ao exportar PDF: ' + err.message, 'error');
      return false;
    } finally {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }

  // Download de Ambos (PPTX + PDF)
  async function exportSlideKillerBoth() {
    showToast('Exportando apresentação em PowerPoint (.pptx)...', 'info');
    const pptxOk = await exportSlideKillerPptx();
    if (!pptxOk) return false;
    showToast('Exportando documento em PDF (.pdf)...', 'info');
    return await exportSlideKillerPdf();
  }

  // Download PPTX (Gera dinamicamente com tipografia widescreen e referência separada)
  function triggerDownload() {
    exportSlideKillerPptx();
  }

  async function shareSlideKillerPptx() {
    if (!currentSlides || currentSlides.length === 0) {
      showToast('Nenhum slide para compartilhar.', 'error');
      return;
    }
    showToast('Preparando apresentação para compartilhar...', 'info');
    try {
      const data = await getSlideKillerPptxData();
      if (!data) return;

      await saveOrShareFileNative(data.blob, data.fileName, 'share');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao compartilhar PPTX:', err);
        showToast('Erro ao compartilhar: ' + err.message, 'error');
      }
    }
  }

  const btnShareMain = document.getElementById('btn-share-main');
  if (btnShareMain) btnShareMain.addEventListener('click', shareSlideKillerPptx);

  if (btnDownloadTop) btnDownloadTop.addEventListener('click', triggerDownload);
  if (btnDownloadMain) btnDownloadMain.addEventListener('click', triggerDownload);
  if (btnDownloadPdfSk) btnDownloadPdfSk.addEventListener('click', exportSlideKillerPdf);
  if (btnDownloadBothSk) btnDownloadBothSk.addEventListener('click', exportSlideKillerBoth);
  // Novo Documento
  if (btnNewPresentation) {
    btnNewPresentation.addEventListener('click', () => {
      inputSection.style.display = 'flex';
      resultsSection.style.display = 'none';
      if (btnDownloadTop) btnDownloadTop.style.display = 'none';
      currentFile = null;
      currentSlides = [];
      currentDownloadUrl = null;
      sermonImageFiles = [];
      if (pdfFileInput) pdfFileInput.value = '';
      if (sermonTextInput) sermonTextInput.value = '';
      if (verseImagesInput) verseImagesInput.value = '';
      if (selectedFileInfo) selectedFileInfo.style.display = 'none';
      if (verseImagesContainer) verseImagesContainer.style.display = 'none';
      if (verseImagesThumbnailsGrid) {
        verseImagesThumbnailsGrid.innerHTML = '';
        verseImagesThumbnailsGrid.style.display = 'none';
      }
      if (dropzoneOcr) dropzoneOcr.style.display = 'flex';
      if (aiOcrProgressContainer) aiOcrProgressContainer.style.display = 'none';
    });
  }

  // ==========================================
  // MÓDULO 2: CONVERSOR PDF ⇄ PPTX (DIRETO & INVERSO)
  // ==========================================
  const btnSubmodePdf = document.getElementById('btn-submode-pdf-to-pptx');
  const btnSubmodePptx = document.getElementById('btn-submode-pptx-reverse');
  const panelSubmodePdf = document.getElementById('submode-panel-pdf');
  const panelSubmodePptx = document.getElementById('submode-panel-pptx');
  const converterBadgeDot = document.getElementById('converter-badge-dot');
  const converterBadgeText = document.getElementById('converter-badge-text');
  const converterTitleText = document.getElementById('converter-title-text');
  const converterDescText = document.getElementById('converter-desc-text');

  // Modo Direto (PDF ➔ PPTX)
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
  const btnExportDirectPngZip = document.getElementById('btn-export-direct-png-zip');
  const directMainBtnIcon = document.getElementById('direct-main-btn-icon');
  const directMainBtnLabel = document.getElementById('direct-main-btn-label');

  // Modo Inverso (PPTX ➔ Imagens / ZIP / PDF)
  const dropzonePptxReverse = document.getElementById('dropzone-pptx-reverse');
  const pptxReverseInput = document.getElementById('pptx-reverse-input');
  const pptxReverseFileInfo = document.getElementById('pptx-reverse-file-info');
  const pptxReverseFileName = document.getElementById('pptx-reverse-file-name');
  const btnClearPptxReverseFile = document.getElementById('btn-clear-pptx-reverse-file');
  const pptxReverseProgressContainer = document.getElementById('pptx-reverse-progress-container');
  const pptxReverseProgressBar = document.getElementById('pptx-reverse-progress-bar');
  const pptxReverseProgressStatus = document.getElementById('pptx-reverse-progress-status');
  const pptxReverseProgressPercent = document.getElementById('pptx-reverse-progress-percent');
  const btnPptxToZip = document.getElementById('btn-pptx-to-zip');
  const btnPptxToPdf = document.getElementById('btn-pptx-to-pdf');
  const btnPptxToOrganizer = document.getElementById('btn-pptx-to-organizer');
  const pptxAppendInput = document.getElementById('pptx-append-input');
  const imagesPptxInput = document.getElementById('images-pptx-input');

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
  let currentReversePptxFile = null;
  let directGeneratedPptx = null;
  let directPptxFileName = 'Apresentacao.pptx';
  let directSlides = [];
  let draggedDirectSlideIndex = null;
  let selectedDirectSlideIds = new Set();
  const btnSelectAllDirect = document.getElementById('btn-select-all-direct');
  const labelSelectAllDirect = document.getElementById('label-select-all-direct');
  const btnDeleteSelectedDirect = document.getElementById('btn-delete-selected-direct');
  const labelDeleteSelectedDirect = document.getElementById('label-delete-selected-direct');

  // Alternador de Submodo: Direto (PDF ➔ PPTX) vs Inverso (PPTX ➔ Imagens/ZIP/PDF)
  function switchConverterSubmode(mode) {
    const btnPdf = document.getElementById('btn-submode-pdf-to-pptx');
    const btnPptx = document.getElementById('btn-submode-pptx-reverse');
    const panelPdf = document.getElementById('submode-panel-pdf');
    const panelPptx = document.getElementById('submode-panel-pptx');
    const badgeDot = document.getElementById('converter-badge-dot');
    const badgeText = document.getElementById('converter-badge-text');
    const titleText = document.getElementById('converter-title-text');
    const descText = document.getElementById('converter-desc-text');
    const secInput = document.getElementById('section-direct-input');
    const secResults = document.getElementById('section-direct-results');

    if (secInput) secInput.style.display = 'flex';
    if (secResults) secResults.style.display = 'none';

    if (mode === 'pptx-reverse') {
      if (btnPptx) btnPptx.classList.add('active');
      if (btnPdf) btnPdf.classList.remove('active');
      if (panelPdf) panelPdf.style.display = 'none';
      if (panelPptx) panelPptx.style.display = 'block';
      if (badgeDot) {
        badgeDot.style.backgroundColor = '#38bdf8';
        badgeDot.style.boxShadow = '0 0 8px #38bdf8';
      }
      if (badgeText) badgeText.textContent = 'MÓDULO CONVERSOR INVERSO • PPTX ➔ IMAGENS / ZIP / PDF';
      if (titleText) titleText.textContent = 'Conversão Inversa de PowerPoint para Imagens ou PDF';
      if (descText) descText.textContent = 'Anexe qualquer apresentação .pptx para extrair instantaneamente todas as lâminas em imagens Full HD de alta qualidade (.png), baixar um arquivo compactado .ZIP ou converter tudo diretamente para PDF.';
    } else {
      if (btnPdf) btnPdf.classList.add('active');
      if (btnPptx) btnPptx.classList.remove('active');
      if (panelPdf) panelPdf.style.display = 'block';
      if (panelPptx) panelPptx.style.display = 'none';
      if (badgeDot) {
        badgeDot.style.backgroundColor = 'var(--primary)';
        badgeDot.style.boxShadow = '0 0 8px var(--primary)';
      }
      if (badgeText) badgeText.textContent = 'MÓDULO CONVERSOR & ORGANIZADOR • PPTX, ZIP & NOVO PDF';
      if (titleText) titleText.textContent = 'Conversão de PDF para PowerPoint, ZIP de Imagens ou Novo PDF';
      if (descText) descText.textContent = 'Converta seu PDF diretamente em slides de PowerPoint (.pptx), transforme o PDF em arquivo ZIP compactado com todas as páginas extraídas em imagens Full HD (.png) ou gere um novo PDF reorganizado. Use o organizador visual para ordenar, substituir e excluir lâminas com facilidade.';
    }
  }
  window.switchConverterSubmode = switchConverterSubmode;

  if (btnSubmodePdf) {
    btnSubmodePdf.addEventListener('click', () => switchConverterSubmode('pdf-to-pptx'));
  }
  if (btnSubmodePptx) {
    btnSubmodePptx.addEventListener('click', () => switchConverterSubmode('pptx-reverse'));
  }

  if (btnSwitchToDirect) {
    btnSwitchToDirect.addEventListener('click', () => {
      const directNavBtn = document.querySelector('.nav-module-btn[data-module="pdf-to-pptx"]');
      switchModule('pdf-to-pptx');
      if (directNavBtn) moveNavGelPill(directNavBtn);
    });
  }

  // Dropzone Modo Direto (PDF)
  if (dropzoneDirect && pdfDirectInput) {
    dropzoneDirect.addEventListener('click', (e) => {
      if (e.target.closest('.btn-clear') || e.target.closest('.selected-file-info')) return;
      pdfDirectInput.value = '';
      pdfDirectInput.click();
    });

    let dropCounterDirect = 0;
    dropzoneDirect.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterDirect++;
      dropzoneDirect.classList.add('dragover');
    });

    dropzoneDirect.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (!dropzoneDirect.classList.contains('dragover')) dropzoneDirect.classList.add('dragover');
    });

    dropzoneDirect.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterDirect--;
      if (dropCounterDirect <= 0) {
        dropCounterDirect = 0;
        dropzoneDirect.classList.remove('dragover');
      }
    });

    dropzoneDirect.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterDirect = 0;
      dropzoneDirect.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleDirectFileSelected(e.dataTransfer.files[0]);
      }
    });

    pdfDirectInput.addEventListener('click', (e) => {
      e.stopPropagation();
      e.target.value = '';
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
    showToast(`📄 PDF "${file.name}" anexado com sucesso!`, 'success');
  }

  // Dropzone Modo Inverso (PPTX)
  if (dropzonePptxReverse && pptxReverseInput) {
    dropzonePptxReverse.addEventListener('click', (e) => {
      if (e.target.closest('.btn-clear') || e.target.closest('.selected-file-info')) return;
      pptxReverseInput.value = '';
      pptxReverseInput.click();
    });

    let dropCounterReverse = 0;
    dropzonePptxReverse.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterReverse++;
      dropzonePptxReverse.classList.add('dragover');
    });

    dropzonePptxReverse.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (!dropzonePptxReverse.classList.contains('dragover')) dropzonePptxReverse.classList.add('dragover');
    });

    dropzonePptxReverse.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterReverse--;
      if (dropCounterReverse <= 0) {
        dropCounterReverse = 0;
        dropzonePptxReverse.classList.remove('dragover');
      }
    });

    dropzonePptxReverse.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterReverse = 0;
      dropzonePptxReverse.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleReversePptxFileSelected(e.dataTransfer.files[0]);
      }
    });

    pptxReverseInput.addEventListener('click', (e) => {
      e.stopPropagation();
      e.target.value = '';
    });
    pptxReverseInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleReversePptxFileSelected(e.target.files[0]);
      }
    });
  }

  if (btnClearPptxReverseFile) {
    btnClearPptxReverseFile.addEventListener('click', (e) => {
      e.stopPropagation();
      currentReversePptxFile = null;
      if (pptxReverseInput) pptxReverseInput.value = '';
      if (pptxReverseFileInfo) pptxReverseFileInfo.style.display = 'none';
    });
  }

  function handleReversePptxFileSelected(file) {
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      showToast('Por favor, anexe um arquivo PowerPoint (.pptx) válido.', 'error');
      return;
    }
    currentReversePptxFile = file;
    if (pptxReverseFileName) pptxReverseFileName.textContent = file.name;
    if (pptxReverseFileInfo) pptxReverseFileInfo.style.display = 'inline-flex';
    showToast(`📊 Apresentação "${file.name}" anexada com sucesso!`, 'success');
  }

  function showPptxReverseProgress(percent, status) {
    if (pptxReverseProgressContainer) pptxReverseProgressContainer.style.display = 'block';
    if (pptxReverseProgressBar) pptxReverseProgressBar.style.width = `${percent}%`;
    if (pptxReverseProgressPercent) pptxReverseProgressPercent.textContent = `${percent}%`;
    if (pptxReverseProgressStatus) pptxReverseProgressStatus.textContent = status;
  }

  function hidePptxReverseProgress() {
    setTimeout(() => {
      if (pptxReverseProgressContainer) pptxReverseProgressContainer.style.display = 'none';
    }, 1500);
  }

  // Ações de Conversão Inversa (PPTX ➔ ZIP, PDF, Organizador)
  if (btnPptxToZip) {
    btnPptxToZip.addEventListener('click', async () => {
      if (!currentReversePptxFile) {
        showToast('Por favor, anexe uma apresentação .pptx primeiro.', 'error');
        return;
      }
      btnPptxToZip.disabled = true;
      btnPptxToZip.innerHTML = '<span>⏳</span> Convertendo e baixando ZIP...';
      try {
        const ok = await processPptxIntoSlides(currentReversePptxFile, false);
        if (ok && directSlides.length > 0) {
          await generateDirectExport('zip');
        }
      } catch (err) {
        console.error('Erro na conversão PPTX ➔ ZIP:', err);
      } finally {
        btnPptxToZip.disabled = false;
        btnPptxToZip.innerHTML = '<span class="btn-icon">📦</span> Converter e Baixar ZIP (PNG)';
      }
    });
  }

  if (btnPptxToPdf) {
    btnPptxToPdf.addEventListener('click', async () => {
      if (!currentReversePptxFile) {
        showToast('Por favor, anexe uma apresentação .pptx primeiro.', 'error');
        return;
      }
      btnPptxToPdf.disabled = true;
      btnPptxToPdf.innerHTML = '<span>⏳</span> Convertendo e baixando PDF...';
      try {
        const ok = await processPptxIntoSlides(currentReversePptxFile, false);
        if (ok && directSlides.length > 0) {
          await generateDirectExport('pdf');
        }
      } catch (err) {
        console.error('Erro na conversão PPTX ➔ PDF:', err);
      } finally {
        btnPptxToPdf.disabled = false;
        btnPptxToPdf.innerHTML = '<span class="btn-icon">📄</span> Converter e Baixar PDF';
      }
    });
  }

  if (btnPptxToOrganizer) {
    btnPptxToOrganizer.addEventListener('click', async () => {
      if (!currentReversePptxFile) {
        showToast('Por favor, anexe uma apresentação .pptx primeiro.', 'error');
        return;
      }
      btnPptxToOrganizer.disabled = true;
      btnPptxToOrganizer.innerHTML = '<span>⏳</span> Processando slides...';
      try {
        await processPptxIntoSlides(currentReversePptxFile, false);
      } catch (err) {
        console.error('Erro ao abrir PPTX no organizador:', err);
      } finally {
        btnPptxToOrganizer.disabled = false;
        btnPptxToOrganizer.innerHTML = '<span class="btn-icon">📋</span> Abrir no Organizador';
      }
    });
  }

  // Adicionar mais um PPTX ao projeto
  if (pptxAppendInput) {
    pptxAppendInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await processPptxIntoSlides(e.target.files[0], true);
        pptxAppendInput.value = '';
      }
    });
  }

  function resetDirectInput() {
    currentDirectFile = null;
    currentReversePptxFile = null;
    if (pdfDirectInput) pdfDirectInput.value = '';
    if (pptxReverseInput) pptxReverseInput.value = '';
    if (pdfExtraImagesInput) pdfExtraImagesInput.value = '';
    if (pdfAppendInput) pdfAppendInput.value = '';
    if (pptxAppendInput) pptxAppendInput.value = '';
    if (directFileInfo) directFileInfo.style.display = 'none';
    if (pptxReverseFileInfo) pptxReverseFileInfo.style.display = 'none';
    if (directProgressContainer) directProgressContainer.style.display = 'none';
    if (directProgressBar) directProgressBar.style.width = '0%';
    if (pptxReverseProgressContainer) pptxReverseProgressContainer.style.display = 'none';
    if (pptxReverseProgressBar) pptxReverseProgressBar.style.width = '0%';
    if (directExportProgressContainer) directExportProgressContainer.style.display = 'none';
    if (sectionDirectResults) sectionDirectResults.style.display = 'none';
    if (sectionDirectInput) sectionDirectInput.style.display = 'flex';
    if (btnDownloadDirectTop) btnDownloadDirectTop.style.display = 'none';
    if (btnShareDirectMain) btnShareDirectMain.style.display = 'none';
    directGeneratedPptx = null;
    directSlides = [];
  }

  if (btnNewDirectTop) btnNewDirectTop.addEventListener('click', () => {
    if (directSlides.length > 0 && !confirm('Deseja iniciar um novo arquivo? Os slides atuais serão limpos.')) return;
    resetDirectInput();
  });
  if (btnNewDirectMain) btnNewDirectMain.addEventListener('click', () => {
    if (directSlides.length > 0 && !confirm('Deseja iniciar um novo arquivo? Os slides atuais serão limpos.')) return;
    resetDirectInput();
  });

  const btnConvertAndDownloadDirect = document.getElementById('btn-convert-and-download-direct');

  // Conversão direta em 1 clique (processa páginas e já baixa o PPTX)
  if (btnConvertAndDownloadDirect) {
    btnConvertAndDownloadDirect.addEventListener('click', async () => {
      if (!currentDirectFile) {
        showToast('Por favor, anexe um arquivo PDF para converter.', 'error');
        return;
      }
      btnConvertAndDownloadDirect.disabled = true;
      btnConvertAndDownloadDirect.innerHTML = '<span>⏳</span> Convertendo e baixando PPTX...';
      try {
        const ok = await processPdfIntoSlides(currentDirectFile, false);
        if (ok && directSlides.length > 0) {
          const exported = await generateDirectExport('pptx');
          if (exported) {
            showToast('🎉 Conversão direta concluída! Arquivo PPTX pronto.', 'success');
          }
        }
      } catch (err) {
        console.error('Erro na conversão direta:', err);
      } finally {
        btnConvertAndDownloadDirect.disabled = false;
        btnConvertAndDownloadDirect.innerHTML = '<span class="btn-icon">⚡</span> Converter e Baixar PowerPoint (.pptx) Direto';
      }
    });
  }

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
      return false;
    }

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
      const pdf = await loadPdfDocumentSafely(arrayBuffer);
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
        const scale = Math.max(targetWidth / (unscaledViewport.width || 800), 1.5);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgData = canvas.toDataURL('image/jpeg', 0.90);
        const pageRatio = viewport.width / viewport.height;
        const pageW = canvas.width;
        const pageH = canvas.height;
        canvas.width = 0;
        canvas.height = 0;

        directSlides.push({
          id: 'pdf_' + Date.now() + '_' + pageNum + '_' + Math.random().toString(36).substr(2, 5),
          title: `${file.name.replace(/\.[^/.]+$/, '')} - Pág ${pageNum}`,
          type: 'pdf',
          source: file.name,
          pageNum: pageNum,
          imgData: imgData,
          ratio: pageRatio,
          width: pageW,
          height: pageH
        });
      }

      if (directProgressStatus) directProgressStatus.textContent = 'Páginas prontas!';
      if (directProgressBar) directProgressBar.style.width = '100%';
      if (directProgressPercent) directProgressPercent.textContent = '100%';

      renderDirectOrganizer();
      showToast(`${totalPages} página(s) extraída(s) com sucesso para o organizador!`, 'success');
      return true;

    } catch (err) {
      console.error('Erro na conversão de PDF para slides:', err);
      showToast(err.message || 'Erro ao processar PDF.', 'error');
      return false;
    } finally {
      if (btnConvertDirect) {
        btnConvertDirect.disabled = false;
        btnConvertDirect.innerHTML = '<span class="btn-icon">📋</span> Abrir no Organizador (PPTX, ZIP ou PDF)';
      }
      if (directProgressContainer) {
        setTimeout(() => {
          directProgressContainer.style.display = 'none';
        }, 1200);
      }
    }
  }

  function probeImageDimensions(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || 1920;
        const h = img.naturalHeight || 1080;
        resolve({ width: w, height: h, ratio: h > 0 ? (w / h) : (16 / 9) });
      };
      img.onerror = () => resolve({ width: 1920, height: 1080, ratio: 16 / 9 });
      img.src = src;
    });
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
          const dims = await probeImageDimensions(dataUrl);
          directSlides.push({
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            title: file.name,
            type: 'image',
            source: 'Imagem Externa',
            imgData: dataUrl,
            ratio: dims.ratio,
            width: dims.width,
            height: dims.height
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

  // ==========================================
  // PROCESSAMENTO E RENDERIZAÇÃO DO MODO INVERSO (PPTX ➔ SLIDES)
  // ==========================================
  function decodeXmlEntities(str) {
    if (!str) return '';
    return str
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
  }

  function parseXmlDocSafe(xmlText) {
    if (!xmlText || typeof DOMParser === 'undefined') return null;
    try {
      const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
      if (!doc || doc.getElementsByTagName('parsererror').length > 0) return null;
      return doc;
    } catch (e) {
      return null;
    }
  }

  function getXmlLocalName(node) {
    if (!node) return '';
    return node.localName || String(node.nodeName || '').split(':').pop();
  }

  function getXmlEls(root, localName) {
    if (!root || !root.getElementsByTagName) return [];
    const out = [];
    const all = root.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      if (getXmlLocalName(all[i]) === localName) out.push(all[i]);
    }
    return out;
  }

  function getXmlDirectChild(parent, localName) {
    if (!parent || !parent.children) return null;
    for (let i = 0; i < parent.children.length; i++) {
      if (getXmlLocalName(parent.children[i]) === localName) return parent.children[i];
    }
    return null;
  }

  function getXmlAttr(el, attrName) {
    if (!el || !el.attributes) return null;
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      const local = attr.localName || String(attr.name || '').split(':').pop();
      if (attr.name === attrName || local === attrName) return attr.value;
    }
    return null;
  }

  function normalizePptxRelTarget(target, baseFolder = 'ppt') {
    if (!target) return null;
    let clean = String(target).trim().replace(/\\/g, '/');
    if (clean.startsWith('/')) {
      return clean.replace(/^\/+/, '');
    }
    const parts = (baseFolder ? baseFolder.replace(/\/+$/, '').split('/') : []);
    for (const seg of clean.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') {
        if (parts.length > 0) parts.pop();
      } else {
        parts.push(seg);
      }
    }
    return parts.join('/');
  }

  function parseSlideRels(relsXml) {
    const rels = {};
    if (!relsXml) return rels;
    const doc = parseXmlDocSafe(relsXml);
    if (doc) {
      for (const relEl of getXmlEls(doc, 'Relationship')) {
        const id = getXmlAttr(relEl, 'Id');
        const target = getXmlAttr(relEl, 'Target');
        if (id && target) {
          rels[id] = normalizePptxRelTarget(target, 'ppt/slides');
        }
      }
      return rels;
    }
    const relRegex = /<Relationship\b([^>]+)>/gi;
    let rm;
    while ((rm = relRegex.exec(relsXml)) !== null) {
      const attrs = rm[1];
      const idM = attrs.match(/\bId="([^"]+)"/i);
      const tgtM = attrs.match(/\bTarget="([^"]+)"/i);
      if (idM && tgtM) {
        rels[idM[1]] = normalizePptxRelTarget(tgtM[1], 'ppt/slides');
      }
    }
    return rels;
  }

  function parsePptxPresentationMeta(presXml, relsXml) {
    let presWidth = 12192000;
    let presHeight = 6858000;
    const slidePaths = [];
    const relMap = {};

    if (relsXml) {
      const relDoc = parseXmlDocSafe(relsXml);
      if (relDoc) {
        for (const relEl of getXmlEls(relDoc, 'Relationship')) {
          const id = getXmlAttr(relEl, 'Id');
          const type = getXmlAttr(relEl, 'Type') || '';
          const target = getXmlAttr(relEl, 'Target');
          if (id && target && /\/slide$/i.test(type)) {
            relMap[id] = normalizePptxRelTarget(target, 'ppt');
          }
        }
      } else {
        const tagRe = /<Relationship\b([^>]+)>/gi;
        let rm;
        while ((rm = tagRe.exec(relsXml)) !== null) {
          const attrs = rm[1];
          const idM = attrs.match(/\bId="([^"]+)"/i);
          const typeM = attrs.match(/\bType="([^"]*\/slide)"/i);
          const tgtM = attrs.match(/\bTarget="([^"]+)"/i);
          if (idM && typeM && tgtM) {
            relMap[idM[1]] = normalizePptxRelTarget(tgtM[1], 'ppt');
          }
        }
      }
    }

    if (presXml) {
      const presDoc = parseXmlDocSafe(presXml);
      if (presDoc) {
        const sldSz = getXmlEls(presDoc, 'sldSz')[0];
        if (sldSz) {
          const wVal = parseInt(getXmlAttr(sldSz, 'cx'), 10);
          const hVal = parseInt(getXmlAttr(sldSz, 'cy'), 10);
          if (wVal > 0 && hVal > 0) {
            presWidth = wVal;
            presHeight = hVal;
          }
        }
        for (const sldId of getXmlEls(presDoc, 'sldId')) {
          const rId = getXmlAttr(sldId, 'id');
          if (rId && relMap[rId]) slidePaths.push(relMap[rId]);
        }
      } else {
        const sldSzTag = presXml.match(/<p:sldSz\b([^>]+)>/i);
        if (sldSzTag) {
          const cxM = sldSzTag[1].match(/\bcx="(\d+)"/i);
          const cyM = sldSzTag[1].match(/\bcy="(\d+)"/i);
          if (cxM && cyM) {
            const wVal = parseInt(cxM[1], 10);
            const hVal = parseInt(cyM[1], 10);
            if (wVal > 0 && hVal > 0) {
              presWidth = wVal;
              presHeight = hVal;
            }
          }
        }
        const idRegex = /<p:sldId\b[^>]*r:id="([^"]+)"/gi;
        let im;
        while ((im = idRegex.exec(presXml)) !== null) {
          if (relMap[im[1]]) slidePaths.push(relMap[im[1]]);
        }
      }
    }

    const ratio = (presWidth && presHeight) ? (presWidth / presHeight) : (16 / 9);
    return { presWidth, presHeight, ratio, slidePaths };
  }

  function loadImageAsync(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // Função central para processar arquivo .pptx e transformar cada slide em imagem Full HD
  async function processPptxIntoSlides(file, isAppend = false) {
    if (typeof JSZip === 'undefined') {
      showToast('Biblioteca JSZip não carregada. Aguarde alguns instantes.', 'error');
      return false;
    }

    showPptxReverseProgress(5, 'Lendo arquivo PowerPoint (.pptx)...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // 1. Dimensões e ordem oficial dos slides
      const presEntry = zip.file('ppt/presentation.xml');
      const relsEntry = zip.file('ppt/_rels/presentation.xml.rels');
      const presXml = (presEntry && typeof presEntry.async === 'function') ? await presEntry.async('text') : '';
      const relsXml = (relsEntry && typeof relsEntry.async === 'function') ? await relsEntry.async('text') : '';
      const meta = parsePptxPresentationMeta(presXml, relsXml);
      const presWidth = meta.presWidth;
      const presHeight = meta.presHeight;
      const ratio = meta.ratio;
      let slidePaths = meta.slidePaths;

      // Fallback: ordenar numericamente slide1.xml, slide2.xml...
      if (slidePaths.length === 0) {
        slidePaths = Object.keys(zip.files).filter(k => /^ppt\/slides\/slide\d+\.xml$/i.test(k) && !zip.files[k].dir && zip.file(k));
        slidePaths.sort((a, b) => {
          const ma = a.match(/slide(\d+)\.xml/i);
          const mb = b.match(/slide(\d+)\.xml/i);
          const na = ma ? parseInt(ma[1], 10) : 0;
          const nb = mb ? parseInt(mb[1], 10) : 0;
          return na - nb;
        });
      } else {
        // Garantir que todos os paths mapeados realmente existem como arquivo no ZIP
        slidePaths = slidePaths.filter(p => {
          const entry = zip.file(p);
          return entry && !zip.files[p]?.dir && typeof entry.async === 'function';
        });
      }

      if (slidePaths.length === 0) {
        throw new Error('Nenhum slide encontrado neste arquivo PowerPoint (.pptx).');
      }

      showPptxReverseProgress(12, 'Extraindo mídias e imagens em alta definição...');

      // 3. Cache de mídias em base64 (ignora diretórios virtuais e verifica se entry existe)
      const mediaFiles = Object.keys(zip.files).filter(k => {
        return k.startsWith('ppt/media/') && !zip.files[k].dir && zip.file(k);
      });
      const mediaDataUrls = {};
      for (const mf of mediaFiles) {
        const mEntry = zip.file(mf);
        if (!mEntry || typeof mEntry.async !== 'function') continue;
        const mime = getMimeTypeForFileName(mf);

        try {
          const b64 = await mEntry.async('base64');
          mediaDataUrls[mf] = `data:${mime};base64,${b64}`;
        } catch (mediaErr) {
          console.warn(`Aviso: falha ao extrair mídia ${mf}:`, mediaErr);
        }
      }

      if (!isAppend) {
        directGeneratedPptx = null;
        directSlides = [];
        currentDirectFile = file;
        directPptxFileName = file.name.replace(/\.[^/.]+$/, '') + '_CONVERTIDO.pptx';
      } else {
        directGeneratedPptx = null;
      }

      const total = slidePaths.length;

      // 4. Renderizar cada slide para Full HD
      for (let idx = 0; idx < total; idx++) {
        const pct = Math.round(15 + ((idx + 1) / total) * 80);
        showPptxReverseProgress(pct, `Renderizando slide ${idx + 1} de ${total}...`);

        const slidePath = slidePaths[idx];
        const sEntry = zip.file(slidePath);
        if (!sEntry || typeof sEntry.async !== 'function') {
          console.warn(`Arquivo do slide não encontrado: ${slidePath}`);
          continue;
        }
        const xml = await sEntry.async('text');

        const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
        let rels = {};
        const relEntry = zip.file(relsPath);
        if (relEntry && typeof relEntry.async === 'function') {
          try {
            const slideRelsXml = await relEntry.async('text');
            rels = parseSlideRels(slideRelsXml);
          } catch (relErr) {
            console.warn(`Aviso ao ler rels do slide ${idx + 1}:`, relErr);
          }
        }

        try {
          const slideResult = await renderPptxSlideToCanvas({
            xml,
            rels,
            mediaDataUrls,
            presWidth,
            presHeight,
            ratio,
            slideIndex: idx + 1
          });

          directSlides.push({
            id: 'pptx_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5),
            title: slideResult.title || `${file.name.replace(/\.[^/.]+$/, '')} - Slide ${idx + 1}`,
            type: 'pptx',
            source: file.name,
            pageNum: idx + 1,
            imgData: slideResult.dataUrl,
            ratio: ratio,
            width: slideResult.width,
            height: slideResult.height
          });
        } catch (slideErr) {
          console.warn(`Erro ao renderizar slide ${idx + 1}:`, slideErr);
          // Fallback canvas para não abortar toda a conversão
          const fbCanvas = document.createElement('canvas');
          fbCanvas.width = 1920;
          fbCanvas.height = Math.round(1920 / ratio);
          const fbCtx = fbCanvas.getContext('2d');
          fbCtx.fillStyle = '#0f172a';
          fbCtx.fillRect(0, 0, fbCanvas.width, fbCanvas.height);
          fbCtx.fillStyle = '#f8fafc';
          fbCtx.font = 'bold 36px sans-serif';
          fbCtx.textAlign = 'center';
          fbCtx.fillText(`Slide ${idx + 1}`, fbCanvas.width / 2, fbCanvas.height / 2);
          const fbW = fbCanvas.width;
          const fbH = fbCanvas.height;
          const fbImg = fbCanvas.toDataURL('image/png');
          fbCanvas.width = 0;
          fbCanvas.height = 0;
          directSlides.push({
            id: 'pptx_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5),
            title: `${file.name.replace(/\.[^/.]+$/, '')} - Slide ${idx + 1}`,
            type: 'pptx',
            source: file.name,
            pageNum: idx + 1,
            imgData: fbImg,
            ratio: ratio,
            width: fbW,
            height: fbH
          });
        }
      }

      showPptxReverseProgress(100, 'Slides prontos!');
      renderDirectOrganizer();
      showToast(`🎉 ${total} slides extraídos do PowerPoint com sucesso!`, 'success');
      return true;

    } catch (err) {
      console.error('Erro na conversão de PPTX:', err);
      showToast(err.message || 'Erro ao converter PowerPoint.', 'error');
      return false;
    } finally {
      hidePptxReverseProgress();
    }
  }

  function resolveSchemeColor(val) {
    if (!val) return null;
    const sval = String(val).toLowerCase();
    if (sval === 'tx1' || sval === 'dk1') return '#000000';
    if (sval === 'bg1' || sval === 'lt1') return '#FFFFFF';
    if (sval === 'accent1') return '#38bdf8';
    if (sval === 'accent2') return '#e8b859';
    return null;
  }

  function extractRunStyleFromRPr(rPr, fallbackStyle = null) {
    const base = fallbackStyle || { sz: 4000, bold: false, italic: false, color: '#FFFFFF', typeface: null };
    if (!rPr) return { ...base };
    let sz = base.sz;
    let bold = base.bold;
    let italic = base.italic;
    let color = base.color;
    let typeface = base.typeface;

    const szAttr = getXmlAttr(rPr, 'sz');
    if (szAttr) {
      const parsedSz = parseInt(szAttr, 10);
      if (parsedSz > 0) sz = parsedSz;
    }
    const bAttr = getXmlAttr(rPr, 'b');
    if (bAttr !== null) bold = bAttr === '1' || bAttr === 'true';
    const iAttr = getXmlAttr(rPr, 'i');
    if (iAttr !== null) italic = iAttr === '1' || iAttr === 'true';

    const solidFill = getXmlDirectChild(rPr, 'solidFill');
    if (solidFill) {
      const srgb = getXmlDirectChild(solidFill, 'srgbClr');
      const scheme = getXmlDirectChild(solidFill, 'schemeClr');
      const srgbVal = srgb ? getXmlAttr(srgb, 'val') : null;
      const schemeVal = scheme ? getXmlAttr(scheme, 'val') : null;
      if (srgbVal && /^[0-9a-fA-F]{6}$/.test(srgbVal)) {
        color = '#' + srgbVal;
      } else if (schemeVal) {
        const mapped = resolveSchemeColor(schemeVal);
        if (mapped) color = mapped;
      }
    }

    const latin = getXmlDirectChild(rPr, 'latin');
    const tf = latin ? getXmlAttr(latin, 'typeface') : null;
    if (tf) typeface = tf;

    return { sz, bold, italic, color, typeface };
  }

  // Renderiza um slide XML em um canvas 1080p preservando a ordem exata das camadas (z-index natural do PowerPoint)
  async function renderPptxSlideToCanvas({ xml, rels, mediaDataUrls, presWidth, presHeight, ratio, slideIndex }) {
    const canvasW = 1920;
    const canvasH = Math.round(1920 / ratio);
    const scaleX = canvasW / presWidth;
    const scaleY = canvasH / presHeight;

    let bgBlipTarget = null;
    let bgColor = '#0b0f19';
    const elements = [];
    let titleFound = '';

    const doc = parseXmlDocSafe(xml);

    if (doc) {
      // 1. Fundo declarado em <p:bg> via DOMParser
      const bgEl = getXmlEls(doc, 'bg')[0];
      if (bgEl) {
        const blipEl = getXmlEls(bgEl, 'blip')[0];
        const rId = blipEl ? getXmlAttr(blipEl, 'embed') : null;
        if (rId && rels[rId]) bgBlipTarget = rels[rId];
        const srgbEl = getXmlEls(bgEl, 'srgbClr')[0];
        const clrVal = srgbEl ? getXmlAttr(srgbEl, 'val') : null;
        if (clrVal && /^[0-9a-fA-F]{6}$/.test(clrVal)) bgColor = '#' + clrVal;
      }

      // 2. Caminha por <p:spTree> preservando ordem Z e coordenadas de <p:grpSp>
      const spTreeEl = getXmlEls(doc, 'spTree')[0];
      const readBoxCoords = (prEl, defaultX, defaultY, defaultCx, defaultCy) => {
        const xfrm = prEl ? getXmlDirectChild(prEl, 'xfrm') : null;
        const off = xfrm ? getXmlDirectChild(xfrm, 'off') : null;
        const ext = xfrm ? getXmlDirectChild(xfrm, 'ext') : null;
        const x = off ? (parseInt(getXmlAttr(off, 'x'), 10) || 0) : defaultX;
        const y = off ? (parseInt(getXmlAttr(off, 'y'), 10) || 0) : defaultY;
        const cxAttr = ext ? parseInt(getXmlAttr(ext, 'cx'), 10) : NaN;
        const cyAttr = ext ? parseInt(getXmlAttr(ext, 'cy'), 10) : NaN;
        const cx = !Number.isNaN(cxAttr) ? cxAttr : defaultCx;
        const cy = !Number.isNaN(cyAttr) ? cyAttr : defaultCy;
        return { x, y, cx, cy, xfrm };
      };

      const mapBox = (box, transform) => ({
        x: transform.offX + (box.x - transform.chOffX) * transform.sx,
        y: transform.offY + (box.y - transform.chOffY) * transform.sy,
        cx: box.cx * transform.sx,
        cy: box.cy * transform.sy
      });

      const walkSpTreeContainer = (containerEl, transform) => {
        if (!containerEl || !containerEl.children) return;
        for (let i = 0; i < containerEl.children.length; i++) {
          const child = containerEl.children[i];
          const lname = getXmlLocalName(child);

          if (lname === 'grpSp') {
            const grpPr = getXmlDirectChild(child, 'grpSpPr');
            const box = readBoxCoords(grpPr, 0, 0, presWidth, presHeight);
            const chOffEl = box.xfrm ? getXmlDirectChild(box.xfrm, 'chOff') : null;
            const chExtEl = box.xfrm ? getXmlDirectChild(box.xfrm, 'chExt') : null;
            const gx0 = chOffEl ? (parseInt(getXmlAttr(chOffEl, 'x'), 10) || 0) : box.x;
            const gy0 = chOffEl ? (parseInt(getXmlAttr(chOffEl, 'y'), 10) || 0) : box.y;
            const gcx = chExtEl ? (parseInt(getXmlAttr(chExtEl, 'cx'), 10) || box.cx) : box.cx;
            const gcy = chExtEl ? (parseInt(getXmlAttr(chExtEl, 'cy'), 10) || box.cy) : box.cy;
            const parentMapped = mapBox(box, transform);
            const childSx = gcx > 0 ? (parentMapped.cx / gcx) : transform.sx;
            const childSy = gcy > 0 ? (parentMapped.cy / gcy) : transform.sy;
            walkSpTreeContainer(child, {
              offX: parentMapped.x,
              offY: parentMapped.y,
              chOffX: gx0,
              chOffY: gy0,
              sx: childSx,
              sy: childSy
            });
          } else if (lname === 'pic') {
            const spPr = getXmlDirectChild(child, 'spPr');
            const box = readBoxCoords(spPr, 0, 0, presWidth, presHeight);
            const mapped = mapBox(box, transform);
            const blipEl = getXmlEls(child, 'blip')[0];
            const rId = blipEl ? getXmlAttr(blipEl, 'embed') : null;
            const target = rId && rels[rId] ? rels[rId] : null;
            elements.push({ type: 'pic', target, ...mapped });
          } else if (lname === 'sp') {
            const spPr = getXmlDirectChild(child, 'spPr');
            const box = readBoxCoords(spPr, 0, 0, presWidth, presHeight);
            const mapped = mapBox(box, transform);

            let shapeFill = null;
            if (spPr && !getXmlDirectChild(spPr, 'noFill')) {
              const solidFill = getXmlDirectChild(spPr, 'solidFill');
              const srgb = solidFill ? getXmlDirectChild(solidFill, 'srgbClr') : null;
              const clr = srgb ? getXmlAttr(srgb, 'val') : null;
              if (clr && /^[0-9a-fA-F]{6}$/.test(clr)) shapeFill = '#' + clr;
            }

            const txBody = getXmlDirectChild(child, 'txBody');
            const paragraphs = [];
            let anchor = 't';

            if (txBody) {
              const bodyPr = getXmlDirectChild(txBody, 'bodyPr');
              const anchorAttr = bodyPr ? getXmlAttr(bodyPr, 'anchor') : null;
              if (anchorAttr) anchor = anchorAttr;

              for (let pIdx = 0; pIdx < txBody.children.length; pIdx++) {
                const pEl = txBody.children[pIdx];
                if (getXmlLocalName(pEl) !== 'p') continue;

                const pPr = getXmlDirectChild(pEl, 'pPr');
                const align = (pPr && getXmlAttr(pPr, 'algn')) || 'l';
                const defRPr = pPr ? getXmlDirectChild(pPr, 'defRPr') : null;
                const defaultRunStyle = extractRunStyleFromRPr(defRPr, null);

                let currentRuns = [];
                for (let cIdx = 0; cIdx < pEl.children.length; cIdx++) {
                  const rEl = pEl.children[cIdx];
                  const childName = getXmlLocalName(rEl);
                  if (childName === 'br') {
                    paragraphs.push({ align, runs: currentRuns.length > 0 ? currentRuns : [{ text: ' ', ...defaultRunStyle }] });
                    currentRuns = [];
                  } else if (childName === 'r' || childName === 'fld') {
                    const tEl = getXmlDirectChild(rEl, 't');
                    if (!tEl) continue;
                    const rawText = tEl.textContent || '';
                    if (!titleFound && rawText.trim().length > 3) {
                      titleFound = rawText.trim().replace(/^["“'”]+|["“'”]+$/g, '').substring(0, 45);
                    }
                    const rPr = getXmlDirectChild(rEl, 'rPr');
                    const style = extractRunStyleFromRPr(rPr, defaultRunStyle);
                    currentRuns.push({ text: rawText, ...style });
                  }
                }
                if (currentRuns.length > 0) {
                  paragraphs.push({ align, runs: currentRuns });
                }
              }
            }

            if (shapeFill || paragraphs.length > 0) {
              elements.push({
                type: 'sp',
                shapeFill,
                anchor,
                paragraphs,
                ...mapped
              });
            }
          }
        }
      };

      if (spTreeEl) {
        walkSpTreeContainer(spTreeEl, { offX: 0, offY: 0, chOffX: 0, chOffY: 0, sx: 1, sy: 1 });
      }
    } else {
      // Fallback regex se DOMParser falhar por XML malformado
      const bgMatch = xml.match(/<p:bg\b[\s\S]*?<\/p:bg>/i);
      if (bgMatch) {
        const bgXml = bgMatch[0];
        const blipM = bgXml.match(/<a:blip[^>]+r:embed="([^"]+)"/i);
        if (blipM && rels[blipM[1]]) bgBlipTarget = rels[blipM[1]];
        const clrM = bgXml.match(/<a:srgbClr\s+val="([0-9a-fA-F]{6})"/i);
        if (clrM) bgColor = '#' + clrM[1];
      }

      const spTreeMatch = xml.match(/<p:spTree>([\s\S]*?)<\/p:spTree>/i);
      if (spTreeMatch) {
        const innerXml = spTreeMatch[1];
        const tagRegex = /<p:(sp|pic)\b([\s\S]*?)<\/p:\1>/gi;
        let match;
        while ((match = tagRegex.exec(innerXml)) !== null) {
          const type = match[1];
          const rawXml = match[0];
          const offM = rawXml.match(/<a:off\b([^>]+)>/i);
          const extM = rawXml.match(/<a:ext\b([^>]+)>/i);
          const offX = offM && offM[1].match(/\bx="(-?\d+)"/i);
          const offY = offM && offM[1].match(/\by="(-?\d+)"/i);
          const extCx = extM && extM[1].match(/\bcx="(\d+)"/i);
          const extCy = extM && extM[1].match(/\bcy="(\d+)"/i);
          const x = offX ? parseInt(offX[1], 10) : 0;
          const y = offY ? parseInt(offY[1], 10) : 0;
          const cx = extCx ? parseInt(extCx[1], 10) : presWidth;
          const cy = extCy ? parseInt(extCy[1], 10) : presHeight;

          if (type === 'pic') {
            const blipM = rawXml.match(/<a:blip[^>]+r:embed="([^"]+)"/i);
            const rId = blipM ? blipM[1] : null;
            elements.push({ type: 'pic', target: (rId && rels[rId]) ? rels[rId] : null, x, y, cx, cy });
          } else {
            const spPrM = rawXml.match(/<p:spPr\b[\s\S]*?<\/p:spPr>/i);
            let shapeFill = null;
            if (spPrM && !spPrM[0].includes('<a:noFill')) {
              const solidM = spPrM[0].match(/<a:solidFill>[\s\S]*?<a:srgbClr\s+val="([0-9a-fA-F]{6})"/i);
              if (solidM) shapeFill = '#' + solidM[1];
            }
            const txBodyM = rawXml.match(/<p:txBody\b[\s\S]*?<\/p:txBody>/i);
            const paragraphs = [];
            let anchor = 't';
            if (txBodyM) {
              const bodyPrM = txBodyM[0].match(/<a:bodyPr\b[^>]*anchor="([a-zA-Z]+)"/i);
              if (bodyPrM) anchor = bodyPrM[1];
              const pBlocks = txBodyM[0].match(/<a:p\b[\s\S]*?<\/a:p>/gi) || [];
              for (const pb of pBlocks) {
                const alignM = pb.match(/<a:pPr\b[^>]*algn="([a-zA-Z]+)"/i);
                const align = alignM ? alignM[1] : 'l';
                const rBlocks = pb.match(/<a:(?:r|fld)\b[\s\S]*?<\/a:(?:r|fld)>/gi) || [];
                const runs = [];
                for (const rb of rBlocks) {
                  const tMatch = rb.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/i);
                  if (!tMatch) continue;
                  const rawText = decodeXmlEntities(tMatch[1]);
                  if (!titleFound && rawText.trim().length > 3) {
                    titleFound = rawText.trim().replace(/^["“'”]+|["“'”]+$/g, '').substring(0, 45);
                  }
                  const rPrM = rb.match(/<a:rPr\b[\s\S]*?(?:<\/a:rPr>|\/>)/i);
                  let sz = 4000, bold = false, italic = false, color = '#FFFFFF', typeface = null;
                  if (rPrM) {
                    const rPr = rPrM[0];
                    const szM = rPr.match(/sz="(\d+)"/i);
                    if (szM) sz = parseInt(szM[1], 10);
                    bold = /b="1"/i.test(rPr);
                    italic = /i="1"/i.test(rPr);
                    const sfM = rPr.match(/<a:solidFill>([\s\S]*?)<\/a:solidFill>/i);
                    if (sfM) {
                      const srgb = sfM[1].match(/<a:srgbClr\s+val="([0-9a-fA-F]{6})"/i);
                      const scheme = sfM[1].match(/<a:schemeClr\s+val="([^"]+)"/i);
                      if (srgb) color = '#' + srgb[1];
                      else if (scheme) color = resolveSchemeColor(scheme[1]) || color;
                    }
                    const latinM = rPr.match(/<a:latin\s+[^>]*typeface="([^"]+)"/i);
                    if (latinM) typeface = latinM[1];
                  }
                  runs.push({ text: rawText, sz, bold, italic, color, typeface });
                }
                if (runs.length > 0) paragraphs.push({ align, runs });
              }
            }
            if (shapeFill || paragraphs.length > 0) {
              elements.push({ type: 'sp', shapeFill, anchor, paragraphs, x, y, cx, cy });
            }
          }
        }
      }
    }

    // Shortcut: se for um slide puramente de 1 imagem cheia sem texto (ex: slides vindos de PDF ou Canva)
    const spElements = elements.filter(e => e.type === 'sp');
    const picElements = elements.filter(e => e.type === 'pic');
    if (spElements.length === 0 && picElements.length === 1 && picElements[0].cx >= presWidth * 0.88 && picElements[0].cy >= presHeight * 0.88) {
      const directUrl = mediaDataUrls[picElements[0].target];
      if (directUrl) {
        return {
          dataUrl: directUrl,
          title: titleFound || `Slide ${slideIndex}`,
          width: 1920,
          height: Math.round(1920 / ratio)
        };
      }
    }

    if (spElements.length === 0 && picElements.length === 0 && bgBlipTarget) {
      const directUrl = mediaDataUrls[bgBlipTarget];
      if (directUrl) {
        return {
          dataUrl: directUrl,
          title: titleFound || `Slide ${slideIndex}`,
          width: 1920,
          height: Math.round(1920 / ratio)
        };
      }
    }

    // Criação do Canvas de renderização 1080p
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');

    try {
      // Fundo da apresentação
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Imagem de fundo se declarada em <p:bg>
      if (bgBlipTarget && mediaDataUrls[bgBlipTarget]) {
        const bgImg = await loadImageAsync(mediaDataUrls[bgBlipTarget]);
        if (bgImg) ctx.drawImage(bgImg, 0, 0, canvasW, canvasH);
      }

      // Renderização sequencial na ordem EXATA das camadas (z-index natural do PowerPoint)
      for (const el of elements) {
        if (el.type === 'pic') {
          const picUrl = el.target ? mediaDataUrls[el.target] : null;
          if (picUrl) {
            const img = await loadImageAsync(picUrl);
            if (img) {
              const px = Math.round(el.x * scaleX);
              const py = Math.round(el.y * scaleY);
              const pw = Math.round(el.cx * scaleX);
              const ph = Math.round(el.cy * scaleY);
              ctx.drawImage(img, px, py, pw, ph);
            }
          }
        } else if (el.type === 'sp') {
          const sx = Math.round(el.x * scaleX);
          const sy = Math.round(el.y * scaleY);
          const sw = Math.round(el.cx * scaleX);
          const sh = Math.round(el.cy * scaleY);

          if (el.shapeFill) {
            ctx.fillStyle = el.shapeFill;
            ctx.fillRect(sx, sy, sw, sh);
          }

          if (el.paragraphs && el.paragraphs.length > 0) {
            renderPptxShapeText(ctx, el, sx, sy, sw, sh, canvasH);
          }
        }
      }

      return {
        dataUrl: canvas.toDataURL('image/jpeg', 0.94),
        title: titleFound || `Slide ${slideIndex}`,
        width: canvasW,
        height: canvasH
      };
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  // Renderiza texto de uma forma (sp) com quebra de linhas inteligente, auto-fit e alinhamento
  function renderPptxShapeText(ctx, shape, sx, sy, sw, sh, canvasH) {
    const paragraphLayouts = [];

    for (const p of shape.paragraphs) {
      const tokens = [];
      for (const r of p.runs) {
        if (!r.text) continue;
        const parts = r.text.split(/(\s+)/);
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            if (tokens.length > 0) {
              tokens[tokens.length - 1].hasSpaceAfter = true;
            }
          } else {
            tokens.push({
              text: part,
              hasSpaceAfter: false,
              style: r
            });
          }
        }
      }
      paragraphLayouts.push({ align: p.align, tokens });
    }

    function getFont(style, autoFitScale) {
      const szPt = (style.sz || 4000) / 100;
      const basePx = Math.round(szPt * (canvasH / 540));
      const fontSizePx = Math.max(12, Math.round(basePx * autoFitScale));
      const isBold = style.bold ? 'bold ' : '';
      const isItalic = style.italic ? 'italic ' : '';
      const family = style.typeface
        ? `"${style.typeface}", "Bahnschrift SemiBold Condensed", "Bahnschrift", "Roboto Condensed", Impact, sans-serif`
        : '"Bahnschrift SemiBold Condensed", "Bahnschrift", "Roboto Condensed", Impact, sans-serif';
      return {
        font: `${isItalic}${isBold}${fontSizePx}px ${family}`,
        fontSizePx
      };
    }

    function layoutAll(autoFitScale) {
      const result = [];
      let totalH = 0;

      for (const pLayout of paragraphLayouts) {
        const pLines = [];
        let curLine = { tokens: [], width: 0, maxHeight: 0 };

        for (const token of pLayout.tokens) {
          const fontInfo = getFont(token.style, autoFitScale);
          ctx.font = fontInfo.font;
          const tokenW = ctx.measureText(token.text).width;
          const spaceW = token.hasSpaceAfter ? ctx.measureText(' ').width : 0;
          const tokenH = Math.round(fontInfo.fontSizePx * 1.25);

          if (curLine.tokens.length > 0 && (curLine.width + tokenW > sw)) {
            pLines.push(curLine);
            totalH += curLine.maxHeight;
            curLine = { tokens: [], width: 0, maxHeight: 0 };
          }

          curLine.tokens.push({
            text: token.text,
            style: token.style,
            font: fontInfo.font,
            fontSizePx: fontInfo.fontSizePx,
            width: tokenW,
            spaceWidth: spaceW
          });
          curLine.width += tokenW + spaceW;
          curLine.maxHeight = Math.max(curLine.maxHeight, tokenH);
        }

        if (curLine.tokens.length > 0) {
          pLines.push(curLine);
          totalH += curLine.maxHeight;
        }

        result.push({ align: pLayout.align, lines: pLines });
      }

      return { paragraphs: result, totalH };
    }

    let scale = 1.0;
    let layout = layoutAll(scale);
    if (layout.totalH > sh && sh > 40) {
      scale = Math.max(0.4, (sh * 0.95) / layout.totalH);
      layout = layoutAll(scale);
    }

    let startY = sy;
    if (shape.anchor === 'ctr' || shape.anchor === 'center') {
      startY = sy + Math.max(0, (sh - layout.totalH) / 2);
    } else if (shape.anchor === 'b' || shape.anchor === 'bottom') {
      startY = sy + Math.max(0, sh - layout.totalH);
    }

    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 9;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    let currentY = startY;
    for (const p of layout.paragraphs) {
      const align = p.align;
      for (const line of p.lines) {
        let lineX = sx;
        const lastTok = line.tokens[line.tokens.length - 1];
        const trimmedLineWidth = line.width - (lastTok ? lastTok.spaceWidth : 0);

        if (align === 'ctr' || align === 'center') {
          lineX = sx + Math.max(0, (sw - trimmedLineWidth) / 2);
        } else if (align === 'r' || align === 'right') {
          lineX = sx + Math.max(0, sw - trimmedLineWidth);
        }

        let wordX = lineX;
        for (const tok of line.tokens) {
          ctx.font = tok.font;
          ctx.fillStyle = tok.style.color || '#FFFFFF';
          ctx.fillText(tok.text, wordX, currentY);
          wordX += tok.width + tok.spaceWidth;
        }

        currentY += line.maxHeight;
      }
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Extrair slides de um PowerPoint diretamente para o Módulo 3 (Organizador de Imagens)
  async function extractPptxIntoImageSlides(file) {
    if (typeof JSZip === 'undefined') {
      showToast('Biblioteca JSZip carregando...', 'error');
      return;
    }
    showToast(`Extraindo slides de ${file.name}...`, 'info');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const presEntry = zip.file('ppt/presentation.xml');
      const relsEntry = zip.file('ppt/_rels/presentation.xml.rels');
      const presXml = (presEntry && typeof presEntry.async === 'function') ? await presEntry.async('text') : '';
      const relsXml = (relsEntry && typeof relsEntry.async === 'function') ? await relsEntry.async('text') : '';
      const meta = parsePptxPresentationMeta(presXml, relsXml);
      const presWidth = meta.presWidth;
      const presHeight = meta.presHeight;
      const ratio = meta.ratio;
      let slidePaths = meta.slidePaths;

      if (slidePaths.length === 0) {
        slidePaths = Object.keys(zip.files).filter(k => /^ppt\/slides\/slide\d+\.xml$/i.test(k) && !zip.files[k].dir && zip.file(k));
        slidePaths.sort((a, b) => {
          const ma = a.match(/slide(\d+)\.xml/i);
          const mb = b.match(/slide(\d+)\.xml/i);
          const na = ma ? parseInt(ma[1], 10) : 0;
          const nb = mb ? parseInt(mb[1], 10) : 0;
          return na - nb;
        });
      } else {
        slidePaths = slidePaths.filter(p => {
          const entry = zip.file(p);
          return entry && !zip.files[p]?.dir && typeof entry.async === 'function';
        });
      }

      if (slidePaths.length === 0) {
        showToast('Nenhum slide encontrado no PowerPoint.', 'error');
        return;
      }

      const mediaFiles = Object.keys(zip.files).filter(k => {
        return k.startsWith('ppt/media/') && !zip.files[k].dir && zip.file(k);
      });
      const mediaDataUrls = {};
      for (const mf of mediaFiles) {
        const mEntry = zip.file(mf);
        if (!mEntry || typeof mEntry.async !== 'function') continue;
        const mime = getMimeTypeForFileName(mf);

        try {
          const b64 = await mEntry.async('base64');
          mediaDataUrls[mf] = `data:${mime};base64,${b64}`;
        } catch (mediaErr) {
          console.warn(`Aviso: falha ao extrair mídia ${mf}:`, mediaErr);
        }
      }

      let addedCount = 0;
      for (let idx = 0; idx < slidePaths.length; idx++) {
        const sf = slidePaths[idx];
        const sEntry = zip.file(sf);
        if (!sEntry || typeof sEntry.async !== 'function') continue;
        const xml = await sEntry.async('text');
        const relsPath = sf.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
        let rels = {};
        const relEntry = zip.file(relsPath);
        if (relEntry && typeof relEntry.async === 'function') {
          try {
            const slideRelsXml = await relEntry.async('text');
            rels = parseSlideRels(slideRelsXml);
          } catch (relErr) {
            console.warn(`Aviso ao ler rels de ${sf}:`, relErr);
          }
        }
        try {
          const slideResult = await renderPptxSlideToCanvas({
            xml, rels, mediaDataUrls, presWidth, presHeight, ratio, slideIndex: idx + 1
          });
          imageSlides.push({
            id: 'img_pptx_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 4),
            name: slideResult.title || `Slide ${idx + 1}`,
            dataUrl: slideResult.dataUrl,
            ratio: ratio,
            width: slideResult.width,
            height: slideResult.height
          });
          addedCount++;
        } catch (sErr) {
          console.warn(`Aviso ao renderizar slide ${idx + 1}:`, sErr);
        }
      }

      imagesGeneratedPptx = null;
      renderImagesOrganizer();
      if (addedCount > 0) {
        showToast(`🎉 ${addedCount} slide(s) do PowerPoint adicionado(s) ao organizador!`, 'success');
      } else {
        showToast('Nenhum slide válido pôde ser renderizado.', 'error');
      }
    } catch (err) {
      console.error('Erro ao extrair PPTX para Módulo 3:', err);
      showToast('Erro ao processar PPTX: ' + err.message, 'error');
    }
  }

  // Função utilitária para leitura de arquivo como DataURL
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Função central para extrair slides de lote misto (Imagens avulsas, PDF multipáginas ou arquivo ZIP)
  async function extractSlidesFromMixedFiles(files, targetModule = 'images') {
    const validImageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg', '.gif'];
    const newSlides = [];

    for (const file of files) {
      const fileNameLower = file.name.toLowerCase();

      // Caso 1: Arquivo PDF multipáginas completo
      if (fileNameLower.endsWith('.pdf') || file.type === 'application/pdf') {
        try {
          if (typeof pdfjsLib === 'undefined') {
            showToast('Biblioteca PDF.js não carregada.', 'error');
            continue;
          }
          showToast(`Lendo páginas do PDF "${file.name}"...`, 'info');
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await loadPdfDocumentSafely(arrayBuffer);
          const totalPages = pdf.numPages;

          for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const unscaledViewport = page.getViewport({ scale: 1.0 });
            const targetWidth = 1920;
            const scale = Math.max(targetWidth / (unscaledViewport.width || 800), 1.5);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const ctx = canvas.getContext('2d', { alpha: false });
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: ctx, viewport }).promise;

            const imgData = canvas.toDataURL('image/jpeg', 0.90);
            const pageRatio = viewport.width / viewport.height;
            const pageW = canvas.width;
            const pageH = canvas.height;
            canvas.width = 0;
            canvas.height = 0;
            const pageTitle = `${file.name.replace(/\.[^/.]+$/, '')} - Pág ${pageNum}`;

            if (targetModule === 'direct') {
              newSlides.push({
                id: 'pdf_' + Date.now() + '_' + pageNum + '_' + Math.random().toString(36).substr(2, 5),
                title: pageTitle,
                type: 'pdf',
                source: file.name,
                pageNum: pageNum,
                imgData: imgData,
                ratio: pageRatio,
                width: pageW,
                height: pageH
              });
            } else {
              newSlides.push({
                id: 'pdf_' + Date.now() + '_' + pageNum + '_' + Math.random().toString(36).substr(2, 5),
                name: pageTitle,
                dataUrl: imgData,
                ratio: pageRatio,
                width: pageW,
                height: pageH
              });
            }
          }
        } catch (err) {
          console.error('Erro ao extrair páginas do PDF:', err);
          showToast(`Erro ao abrir PDF ${file.name}: ${err.message}`, 'error');
        }
      }
      // Caso 2: Arquivo ZIP com imagens internas
      else if (fileNameLower.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        try {
          if (typeof JSZip === 'undefined') {
            showToast('Biblioteca JSZip não carregada.', 'error');
            continue;
          }
          showToast(`Descompactando imagens de "${file.name}"...`, 'info');
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

          // Ordenação natural de nomes (ex: 1.jpg, 2.jpg, 10.jpg)
          entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

          for (const entry of entries) {
            if (!entry || typeof entry.async !== 'function') continue;
            const mime = getMimeTypeForFileName(entry.name);
            const base64Data = await entry.async('base64');
            const dataUrl = `data:${mime};base64,${base64Data}`;
            const dims = await probeImageDimensions(dataUrl);
            const entryName = entry.name.split('/').pop();

            if (targetModule === 'direct') {
              newSlides.push({
                id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                title: entryName,
                type: 'image',
                source: file.name,
                imgData: dataUrl,
                ratio: dims.ratio,
                width: dims.width,
                height: dims.height
              });
            } else {
              newSlides.push({
                id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                name: entryName,
                dataUrl: dataUrl,
                ratio: dims.ratio,
                width: dims.width,
                height: dims.height
              });
            }
          }
        } catch (err) {
          console.error('Erro ao descompactar ZIP:', err);
          showToast(`Erro ao abrir ZIP ${file.name}: ${err.message}`, 'error');
        }
      }
      // Caso 3: Imagens avulsas comuns (.png, .jpg, etc.)
      else if (validImageExtensions.some(ext => fileNameLower.endsWith(ext)) || file.type.startsWith('image/')) {
        try {
          const dataUrl = await readFileAsDataUrl(file);
          const dims = await probeImageDimensions(dataUrl);
          if (targetModule === 'direct') {
            newSlides.push({
              id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              title: file.name,
              type: 'image',
              source: 'Imagem Adicionada',
              imgData: dataUrl,
              ratio: dims.ratio,
              width: dims.width,
              height: dims.height
            });
          } else {
            newSlides.push({
              id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              name: file.name,
              dataUrl: dataUrl,
              ratio: dims.ratio,
              width: dims.width,
              height: dims.height
            });
          }
        } catch (err) {
          console.error('Erro ao carregar imagem:', err);
        }
      }
    }

    return newSlides;
  }

  // Renderiza a grade de cards do organizador de slides do PDF / PPTX
  function renderDirectOrganizer() {
    if (!sectionDirectInput || !sectionDirectResults) return;

    if (directSlides.length === 0) {
      sectionDirectInput.style.display = 'flex';
      sectionDirectResults.style.display = 'none';
      if (btnDownloadDirectTop) btnDownloadDirectTop.style.display = 'none';
      if (btnShareDirectMain) btnShareDirectMain.style.display = 'none';
      directGeneratedPptx = null;
      if (directSlidesGrid) directSlidesGrid.innerHTML = '';
      if (typeof updateSelectionFloatingBar === 'function') updateSelectionFloatingBar();
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

    // Atualiza botões da barra superior de seleção em lote
    if (btnDeleteSelectedDirect && labelDeleteSelectedDirect) {
      if (selectedDirectSlideIds.size > 0) {
        btnDeleteSelectedDirect.style.display = 'inline-flex';
        labelDeleteSelectedDirect.textContent = `Apagar Selecionados (${selectedDirectSlideIds.size})`;
      } else {
        btnDeleteSelectedDirect.style.display = 'none';
      }
    }
    if (labelSelectAllDirect) {
      if (typeof updateSelectionFloatingBar === 'function') updateSelectionFloatingBar();
      labelSelectAllDirect.textContent = (directSlides.length > 0 && selectedDirectSlideIds.size === directSlides.length)
        ? 'Desmarcar Todos'
        : 'Selecionar Todos';
    }

    directSlides.forEach((slide, index) => {
      if (!slide.id) {
        slide.id = 'slide_' + index + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      }

      const isSelected = selectedDirectSlideIds.has(slide.id);
      const safeTitle = escapeHtml(slide.title || `Slide ${index + 1}`);
      const safeId = escapeHtml(slide.id);
      const card = document.createElement('div');
      card.className = 'image-slide-card' + (isSelected ? ' card-selected' : '');
      card.draggable = true;
      card.dataset.index = index;
      card.dataset.id = slide.id;

      const isPdf = slide.type === 'pdf';
      const isPptx = slide.type === 'pptx';
      const typeBadgeHtml = isPdf
        ? `<span style="position: absolute; top: 8px; right: 8px; background: rgba(232, 184, 89, 0.9); color: #0b0f19; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">📄 PDF</span>`
        : (isPptx
            ? `<span style="position: absolute; top: 8px; right: 8px; background: rgba(56, 189, 248, 0.9); color: #0b0f19; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">📊 PPTX</span>`
            : `<span style="position: absolute; top: 8px; right: 8px; background: rgba(168, 85, 247, 0.9); color: #fff; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">🖼️ FOTO</span>`);

      card.innerHTML = `
        <div class="image-slide-preview">
          <label class="slide-select-label" title="Selecionar para apagar em lote" onclick="event.stopPropagation()">
            <input type="checkbox" class="slide-select-checkbox" data-id="${safeId}" ${isSelected ? 'checked' : ''}>
          </label>
          <span class="image-order-badge">#${index + 1}</span>
          ${typeBadgeHtml}
          <img src="${slide.imgData}" alt="Slide ${index + 1}" loading="lazy">
        </div>
        <div class="image-slide-info">
          <div class="image-slide-name" title="${safeTitle}">${safeTitle}</div>
          <div class="image-slide-actions">
            <div class="image-reorder-buttons">
              <button type="button" class="btn-card-reorder" data-action="prev" title="Mover para trás" ${index === 0 ? 'disabled' : ''}>
                ⬅
              </button>
              <button type="button" class="btn-card-reorder" data-action="next" title="Mover para frente" ${index === directSlides.length - 1 ? 'disabled' : ''}>
                ➡
              </button>
            </div>
            <div class="card-right-actions">
              <input type="file" class="card-replace-input" accept="image/*" style="display: none;">
              <input type="file" class="card-insert-after-input" accept="image/*,.pdf,.zip,application/pdf,application/zip,application/x-zip-compressed" multiple style="display: none;">
              <div class="card-more-wrapper">
                <button type="button" class="btn-card-more" data-action="more" title="Mais opções">
                  ⋮
                </button>
              </div>
              <button type="button" class="btn-card-delete" data-action="delete" title="Excluir este slide">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;

      // Botões de ação do card
      const btnPrev = card.querySelector('[data-action="prev"]');
      const btnNext = card.querySelector('[data-action="next"]');
      const btnDel  = card.querySelector('[data-action="delete"]');
      const btnMore = card.querySelector('[data-action="more"]');
      const inputReplace = card.querySelector('.card-replace-input');
      const inputInsertAfter = card.querySelector('.card-insert-after-input');
      const selectCheckbox = card.querySelector('.slide-select-checkbox');

      // Checkbox de seleção em lote
      if (selectCheckbox) {
        selectCheckbox.addEventListener('change', (e) => {
          e.stopPropagation();
          if (e.target.checked) {
            selectedDirectSlideIds.add(slide.id);
          } else {
            selectedDirectSlideIds.delete(slide.id);
          }
          renderDirectOrganizer();
        });
      }

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

      if (btnMore) {
        btnMore.addEventListener('click', (e) => {
          e.stopPropagation();
          openSlideActionSheet({
            slide,
            index,
            total: directSlides.length,
            onEnhanceAi: () => {
              openEnhanceAiModal(slide, index, 'direct');
            },
            onReplace: () => {
              if (inputReplace) {
                inputReplace.value = '';
                inputReplace.click();
              }
            },
            onInsertAfter: () => {
              if (inputInsertAfter) {
                inputInsertAfter.value = '';
                inputInsertAfter.click();
              }
            },
            onDownloadScreen: () => {
              const aspect = directAspectSelect ? directAspectSelect.value : '16x9';
              const fit = directFitSelect ? directFitSelect.value : 'contain';
              const bg = directBgSelect ? directBgSelect.value : '000000';
              downloadSingleSlidePng(slide, index, 'screen', aspect, fit, bg);
            },
            onDownloadOrig: () => {
              downloadSingleSlidePng(slide, index, 'orig');
            },
            onDelete: () => {
              if (confirm(`Deseja excluir o slide #${index + 1}?`)) {
                directSlides.splice(index, 1);
                selectedDirectSlideIds.delete(slide.id);
                directGeneratedPptx = null;
                renderDirectOrganizer();
              }
            }
          });
        });
      }

      // Substituir slide no organizador
      if (inputReplace) {
        inputReplace.addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione uma imagem válida (.jpg, .png, .webp).', 'error');
            return;
          }
          try {
            const dataUrl = await readFileAsDataUrl(file);
            const dims = await probeImageDimensions(dataUrl);
            directSlides[index] = {
              ...directSlides[index],
              title: file.name,
              type: 'image',
              source: 'Imagem Substituída',
              imgData: dataUrl,
              ratio: dims.ratio,
              width: dims.width,
              height: dims.height
            };
            directGeneratedPptx = null;
            renderDirectOrganizer();
            showToast(`Slide #${index + 1} substituído com sucesso!`, 'success');
          } catch (err) {
            console.error('Erro ao substituir slide no organizador:', err);
            showToast('Erro ao processar imagem: ' + err.message, 'error');
          }
        });
      }

      // Adicionar slide(s) depois no organizador (suporta Fotos, PDF completo e ZIP)
      if (inputInsertAfter) {
        inputInsertAfter.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;
          try {
            showToast(`Processando ${files.length} arquivo(s)...`, 'info');
            const newSlides = await extractSlidesFromMixedFiles(files, 'direct');
            if (newSlides.length > 0) {
              directSlides.splice(index + 1, 0, ...newSlides);
              directGeneratedPptx = null;
              renderDirectOrganizer();
              showToast(
                newSlides.length === 1
                  ? `Slide adicionado após o #${index + 1}!`
                  : `${newSlides.length} slides adicionados após o #${index + 1}!`,
                'success'
              );
            } else {
              showToast('Nenhum slide pôde ser extraído dos arquivos selecionados.', 'error');
            }
          } catch (err) {
            console.error('Erro ao adicionar slides depois no organizador:', err);
            showToast('Erro ao processar arquivos: ' + err.message, 'error');
          }
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

      // Touch Drag & Drop com Auto-Scroll no Celular
      attachTouchDragAndDrop(card, index, moveDirectSlide);

      directSlidesGrid.appendChild(card);
    });
  }

  // Mover slide de uma posição para outra
  function moveDirectSlide(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= directSlides.length || toIndex < 0 || toIndex >= directSlides.length) return;
    const item = directSlides.splice(fromIndex, 1)[0];
    directSlides.splice(toIndex, 0, item);
    directGeneratedPptx = null;
    renderDirectOrganizer();
  }

  // Deletar slides selecionados em lote no organizador do PDF
  function deleteSelectedDirectSlides() {
    const count = selectedDirectSlideIds.size;
    if (count === 0) {
      showToast('Nenhum slide selecionado.', 'info');
      return;
    }
    if (confirm(`Deseja realmente apagar os ${count} slide(s) selecionado(s)?`)) {
      directSlides = directSlides.filter(s => !selectedDirectSlideIds.has(s.id));
      selectedDirectSlideIds.clear();
      directGeneratedPptx = null;
      renderDirectOrganizer();
      showToast(`${count} slide(s) apagado(s) com sucesso!`, 'success');
    }
  }

  if (btnSelectAllDirect) {
    btnSelectAllDirect.addEventListener('click', () => {
      if (directSlides.length === 0) return;
      if (selectedDirectSlideIds.size === directSlides.length) {
        selectedDirectSlideIds.clear();
      } else {
        directSlides.forEach(s => selectedDirectSlideIds.add(s.id));
      }
      renderDirectOrganizer();
    });
  }

  if (btnDeleteSelectedDirect) {
    btnDeleteSelectedDirect.addEventListener('click', () => {
      deleteSelectedDirectSlides();
    });
  }

  // Deletar um slide específico
  function deleteDirectSlide(index) {
    if (index < 0 || index >= directSlides.length) return;
    const removed = directSlides.splice(index, 1)[0];
    if (removed && removed.id) selectedDirectSlideIds.delete(removed.id);
    directGeneratedPptx = null;
    renderDirectOrganizer();
    showToast('Slide removido.', 'info');
  }

  // Inverter ordem dos slides do PDF
  if (btnReverseDirect) {
    btnReverseDirect.addEventListener('click', () => {
      if (directSlides.length === 0) return;
      directSlides.reverse();
      directGeneratedPptx = null;
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
        selectedDirectSlideIds.clear();
        directGeneratedPptx = null;
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

    // Carregar fundo temático oficial se selecionado
    const isThemeCinzel = bgChoice === 'theme_cinzel' || bgChoice === 'assets/cinzel_theme_bg.png';
    const isThemeTs = bgChoice === 'theme_ts' || bgChoice === 'assets/ts_theme_bg.png';
    const isThemeBible = bgChoice === 'theme_bible' || bgChoice === 'assets/church_sermon_bg.jpg';
    let themeBgDataUrl = null;
    if (isThemeCinzel) {
      try {
        const cImg = await loadDefaultCinzelBgImage();
        if (cImg) {
          const cv = document.createElement('canvas');
          cv.width = baseWidth;
          cv.height = baseHeight;
          const cx = cv.getContext('2d');
          cx.drawImage(cImg, 0, 0, baseWidth, baseHeight);
          themeBgDataUrl = cv.toDataURL('image/jpeg', 0.88);
          cv.width = 0;
          cv.height = 0;
        }
      } catch (e) {}
    } else if (isThemeTs) {
      try {
        const tsImg = await loadDefaultTsBgImage();
        if (tsImg) {
          const cv = document.createElement('canvas');
          cv.width = baseWidth;
          cv.height = baseHeight;
          const cx = cv.getContext('2d');
          cx.drawImage(tsImg, 0, 0, baseWidth, baseHeight);
          themeBgDataUrl = cv.toDataURL('image/jpeg', 0.88);
          cv.width = 0;
          cv.height = 0;
        }
      } catch (e) {}
    } else if (isThemeBible) {
      try {
        const bImg = await loadDefaultChurchBgImage();
        if (bImg) {
          const cv = document.createElement('canvas');
          cv.width = baseWidth;
          cv.height = baseHeight;
          const cx = cv.getContext('2d');
          cx.drawImage(bImg, 0, 0, baseWidth, baseHeight);
          themeBgDataUrl = cv.toDataURL('image/jpeg', 0.88);
          cv.width = 0;
          cv.height = 0;
        }
      } catch (e) {}
    }

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

      // Preencher cor ou tema de fundo
      if (themeBgDataUrl) {
        doc.addImage(themeBgDataUrl, 'JPEG', 0, 0, baseWidth, baseHeight, undefined, 'FAST');
      } else {
        doc.setFillColor(r, g, b);
        doc.rect(0, 0, baseWidth, baseHeight, 'F');
      }

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

      if ((i + 1) % 5 === 0) {
        await new Promise(res => setTimeout(res, 0));
      }
    }

    const pdfBlob = doc.output('blob');
    const safePdfName = sanitizeFileNamePreservingExt(fileName, 'Apresentacao.pdf');
    return await saveOrShareFileNative(pdfBlob, safePdfName, 'download');
  }

  // Renderiza um slide (de directSlides ou imageSlides) em imagem PNG de alta resolução
  async function renderSlideToPngBlob(slide, aspectChoice = '16x9', fitChoice = 'contain', bgChoice = '000000') {
    return new Promise((resolve, reject) => {
      const rawImg = slide.imgData || slide.dataUrl;
      if (!rawImg) {
        return reject(new Error('Imagem do slide indisponível.'));
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        try {
          const natW = img.naturalWidth || img.width || 1920;
          const natH = img.naturalHeight || img.height || 1080;
          const imgRatio = slide.ratio || (natW / natH) || (16 / 9);

          let canvasW = 1920;
          let canvasH = 1080;

          if (aspectChoice === 'original') {
            const maxEdge = 2560;
            if (natW > maxEdge || natH > maxEdge) {
              const s = maxEdge / Math.max(natW, natH);
              canvasW = Math.max(1, Math.round(natW * s));
              canvasH = Math.max(1, Math.round(natH * s));
            } else {
              canvasW = natW;
              canvasH = natH;
            }
          } else if (aspectChoice === '4x3') {
            canvasW = 1920;
            canvasH = 1440;
          } else {
            canvasW = 1920;
            canvasH = 1080;
          }

          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            canvas.width = 0;
            canvas.height = 0;
            return reject(new Error('Não foi possível obter contexto 2D.'));
          }

          if (aspectChoice === 'original') {
            ctx.drawImage(img, 0, 0, canvasW, canvasH);
          } else {
            if (bgChoice === 'theme_cinzel' || bgChoice === 'assets/cinzel_theme_bg.png') {
              const cImg = await loadDefaultCinzelBgImage();
              if (cImg && cImg.naturalWidth > 0) {
                ctx.drawImage(cImg, 0, 0, canvasW, canvasH);
              } else {
                ctx.fillStyle = '#1c150e';
                ctx.fillRect(0, 0, canvasW, canvasH);
              }
            } else if (bgChoice === 'theme_ts' || bgChoice === 'assets/ts_theme_bg.png') {
              const tsImg = await loadDefaultTsBgImage();
              if (tsImg && tsImg.naturalWidth > 0) {
                ctx.drawImage(tsImg, 0, 0, canvasW, canvasH);
              } else {
                ctx.fillStyle = '#0f1115';
                ctx.fillRect(0, 0, canvasW, canvasH);
              }
            } else if (bgChoice === 'theme_bible' || bgChoice === 'assets/church_sermon_bg.jpg') {
              const bImg = await loadDefaultChurchBgImage();
              if (bImg && bImg.naturalWidth > 0) {
                ctx.drawImage(bImg, 0, 0, canvasW, canvasH);
              } else {
                ctx.fillStyle = '#0b0f19';
                ctx.fillRect(0, 0, canvasW, canvasH);
              }
            } else {
              const hex = (bgChoice || '000000').replace('#', '');
              ctx.fillStyle = '#' + hex;
              ctx.fillRect(0, 0, canvasW, canvasH);
            }

            let drawW = canvasW;
            let drawH = canvasW / imgRatio;

            if (fitChoice === 'cover') {
              if (drawH < canvasH) {
                drawH = canvasH;
                drawW = canvasH * imgRatio;
              }
            } else { // contain
              if (drawH > canvasH) {
                drawH = canvasH;
                drawW = canvasH * imgRatio;
              }
            }

            const x = (canvasW - drawW) / 2;
            const y = (canvasH - drawH) / 2;

            ctx.drawImage(img, x, y, drawW, drawH);
          }

          canvas.toBlob((blob) => {
            canvas.width = 0;
            canvas.height = 0;
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha ao converter canvas para PNG.'));
            }
          }, 'image/png');
        } catch (err) {
          canvas.width = 0;
          canvas.height = 0;
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem para renderização PNG.'));
      img.src = rawImg;
    });
  }

  // Dispara o download de um Blob no navegador ou dispositivo nativo
  async function downloadBlobFile(blob, fileName) {
    return await saveOrShareFileNative(blob, fileName, 'download');
  }

  // Download individual de um slide em PNG
  async function downloadSingleSlidePng(slide, index, mode = 'screen', aspectChoice = '16x9', fitChoice = 'contain', bgChoice = '000000') {
    try {
      showToast(`Gerando imagem PNG do slide ${index + 1}...`, 'info');
      const targetAspect = mode === 'orig' ? 'original' : aspectChoice;
      const pngBlob = await renderSlideToPngBlob(slide, targetAspect, fitChoice, bgChoice);

      const num = String(index + 1).padStart(2, '0');
      const rawTitle = slide.title || slide.name || `Slide_${num}`;
      const safeTitle = sanitizeFileName(rawTitle, `Slide_${num}`).slice(0, 50);
      const fileName = `Slide_${num}_${safeTitle}.png`;

      return await downloadBlobFile(pngBlob, fileName);
    } catch (err) {
      console.error('Erro ao baixar slide individual em PNG:', err);
      showToast('Erro ao exportar PNG: ' + err.message, 'error');
      return false;
    }
  }

  // Gera e baixa um pacote .ZIP contendo todas as telas em formato PNG
  async function generateSlidesZip({
    slides,
    aspectChoice,
    fitChoice,
    bgChoice,
    zipFileName,
    progressCallback
  }) {
    if (typeof JSZip === 'undefined') {
      throw new Error('Biblioteca JSZip não carregada.');
    }

    const zip = new JSZip();
    const total = slides.length;
    const usedNames = new Set();

    for (let i = 0; i < total; i++) {
      const slide = slides[i];
      if (progressCallback) {
        progressCallback(i + 1, total, `Processando PNG: slide ${i + 1} de ${total}...`);
      }

      const pngBlob = await renderSlideToPngBlob(slide, aspectChoice, fitChoice, bgChoice);
      const num = String(i + 1).padStart(2, '0');
      const rawTitle = slide.title || slide.name || `Slide_${num}`;
      const safeTitle = sanitizeFileName(rawTitle, `Slide_${num}`).slice(0, 50);
      let filename = `Slide_${num}_${safeTitle}.png`;
      if (usedNames.has(filename)) {
        filename = `Slide_${num}_${i + 1}_${safeTitle}.png`;
      }
      usedNames.add(filename);

      zip.file(filename, pngBlob);

      if ((i + 1) % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    if (progressCallback) {
      progressCallback(total, total, 'Empacotando arquivo ZIP...');
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'STORE'
    }, (metadata) => {
      if (progressCallback) {
        progressCallback(total, total, `Empacotando ZIP: ${Math.round(metadata.percent)}%...`);
      }
    });

    const safeZipName = sanitizeFileNamePreservingExt(zipFileName, 'Slides_PNG.zip');
    return await downloadBlobFile(zipBlob, safeZipName);
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
      } else if (fmt === 'zip') {
        directMainBtnIcon.textContent = '📦';
        directMainBtnLabel.textContent = 'Gerar e Baixar Pacote ZIP (.zip)';
      } else {
        directMainBtnIcon.textContent = '⚡';
        directMainBtnLabel.textContent = 'Baixar PowerPoint (.pptx)';
      }
    }
    if (btnDownloadDirectTop) {
      if (fmt === 'pdf') {
        btnDownloadDirectTop.innerHTML = '<span>📄</span> Baixar PDF (.pdf)';
      } else if (fmt === 'both') {
        btnDownloadDirectTop.innerHTML = '<span>✨</span> Baixar Ambos (.pptx + .pdf)';
      } else if (fmt === 'zip') {
        btnDownloadDirectTop.innerHTML = '<span>📦</span> Baixar Pacote ZIP (.zip)';
      } else {
        btnDownloadDirectTop.innerHTML = '<span>📥</span> Baixar PowerPoint (.pptx)';
      }
    }
  }

  if (directFormatSelect) {
    directFormatSelect.addEventListener('change', updateDirectExportBtnLabel);
  }

  // Geração e Exportação customizada (PPTX, PDF, ZIP ou Ambos) para Módulo 2
  async function generateDirectExport(requestedFormat) {
    if (directSlides.length === 0) {
      showToast('Adicione pelo menos uma página ou imagem para gerar a apresentação.', 'error');
      return false;
    }

    const formatChoice = requestedFormat || (directFormatSelect ? directFormatSelect.value : 'pptx');
    const aspectChoice = directAspectSelect ? directAspectSelect.value : '16x9';
    const fitChoice = directFitSelect ? directFitSelect.value : 'contain';
    const bgChoice = directBgSelect ? directBgSelect.value : '000000';

    const baseStem = sanitizeFileName(currentDirectFile ? currentDirectFile.name.replace(/\.[^/.]+$/, '') : 'Apresentacao', 'Apresentacao').slice(0, 50);
    const baseName = `${baseStem}_PAGINAS`;
    const pptxFileName = baseName + '.pptx';
    const pdfFileName = baseName + '.pdf';
    const zipFileName = baseName + '_PNG.zip';

    if (btnDownloadDirectMain) {
      btnDownloadDirectMain.disabled = true;
    }
    if (directMainBtnIcon) directMainBtnIcon.textContent = '⏳';
    if (directMainBtnLabel) directMainBtnLabel.textContent = 'Exportando...';
    if (directExportProgressContainer) {
      directExportProgressContainer.style.display = 'block';
      if (directExportProgressBar) directExportProgressBar.style.width = '10%';
      if (directExportProgressPercent) directExportProgressPercent.textContent = '10%';
      if (directExportProgressStatus) directExportProgressStatus.textContent = 'Iniciando preparação dos arquivos...';
    }

    try {
      const total = directSlides.length;
      let allOk = true;
      let pptxOk = false;

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
          if (bgChoice === 'theme_cinzel' || bgChoice === 'assets/cinzel_theme_bg.png') {
            slide.background = { path: 'assets/cinzel_theme_bg.png' };
          } else if (bgChoice === 'theme_ts' || bgChoice === 'assets/ts_theme_bg.png') {
            slide.background = { path: 'assets/ts_theme_bg.png' };
          } else if (bgChoice === 'theme_bible' || bgChoice === 'assets/church_sermon_bg.jpg') {
            slide.background = { path: 'assets/church_sermon_bg.jpg' };
          } else {
            slide.background = { color: bgChoice };
          }

          if (fitChoice === 'cover') {
            slide.addImage({ data: slideItem.imgData, x: 0, y: 0, w: '100%', h: '100%' });
          } else {
            slide.addImage({ data: slideItem.imgData, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'contain', w: '100%', h: '100%' } });
          }
        }

        directGeneratedPptx = pptx;
        directPptxFileName = pptxFileName;
        const blob = await pptx.write({ outputType: 'blob' });
        pptxOk = await saveOrShareFileNative(blob, pptxFileName, 'download');
        allOk = allOk && pptxOk;
      }

      // 2. Exportar PDF se solicitado
      if (formatChoice === 'pdf' || formatChoice === 'both') {
        if (directExportProgressStatus) directExportProgressStatus.textContent = 'Gerando documento em PDF (.pdf)...';

        const pdfOk = await generateSlidesPdfDoc({
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
        allOk = allOk && pdfOk;
      }

      // 3. Exportar Pacote ZIP com imagens PNG se solicitado
      if (formatChoice === 'zip') {
        if (directExportProgressStatus) directExportProgressStatus.textContent = 'Gerando pacote ZIP com imagens PNG...';

        const zipOk = await generateSlidesZip({
          slides: directSlides,
          aspectChoice,
          fitChoice,
          bgChoice,
          zipFileName,
          progressCallback: (cur, tot, statusText) => {
            const pct = Math.round((cur / tot) * 95);
            if (directExportProgressBar) directExportProgressBar.style.width = `${pct}%`;
            if (directExportProgressPercent) directExportProgressPercent.textContent = `${pct}%`;
            if (directExportProgressStatus) directExportProgressStatus.textContent = statusText || `PNG: slide ${cur} de ${tot}...`;
          }
        });
        allOk = allOk && zipOk;
      }

      if (directExportProgressBar) directExportProgressBar.style.width = allOk ? '100%' : '0%';
      if (directExportProgressPercent) directExportProgressPercent.textContent = allOk ? '100%' : '0%';
      if (directExportProgressStatus) directExportProgressStatus.textContent = allOk ? 'Concluído!' : 'Exportação não concluída.';

      if (pptxOk && btnShareDirectMain) {
        btnShareDirectMain.style.display = 'inline-flex';
      }

      if (allOk) {
        if (formatChoice === 'both') {
          showToast(`🎉 Apresentação exportada em PPTX e PDF (${total} slides cada)!`, 'success');
        } else if (formatChoice === 'pdf') {
          showToast(`🎉 Documento PDF exportado com sucesso (${total} páginas)!`, 'success');
        } else if (formatChoice === 'zip') {
          showToast(`🎉 Pacote ZIP exportado com sucesso (${total} imagens PNG)!`, 'success');
        } else {
          showToast(`🎉 Apresentação PPTX exportada com sucesso (${total} slides)!`, 'success');
        }
      }
      return allOk;

    } catch (err) {
      console.error('Erro na exportação:', err);
      showToast('Erro ao exportar: ' + err.message, 'error');
      return false;
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

  async function shareDirectPptx() {
    if (!directGeneratedPptx) {
      showToast('Gere a apresentação primeiro para compartilhar.', 'info');
      return;
    }
    try {
      showToast('Preparando apresentação para compartilhar...', 'info');
      const blob = await directGeneratedPptx.write({ outputType: 'blob' });
      await saveOrShareFileNative(blob, directPptxFileName || 'SLIDES_DIRETOS.pptx', 'share');
    } catch(e) {
      if (e.name !== 'AbortError') showToast('Erro ao compartilhar: ' + e.message, 'error');
    }
  }

  const btnShareDirectMain = document.getElementById('btn-share-direct-main');
  if (btnShareDirectMain) btnShareDirectMain.addEventListener('click', shareDirectPptx);

  if (btnDownloadDirectTop) btnDownloadDirectTop.addEventListener('click', () => generateDirectExport());
  if (btnDownloadDirectMain) btnDownloadDirectMain.addEventListener('click', () => generateDirectExport());
  if (btnExportDirectPdf) btnExportDirectPdf.addEventListener('click', () => generateDirectExport('pdf'));
  if (btnExportDirectPptx) btnExportDirectPptx.addEventListener('click', () => generateDirectExport('pptx'));
  if (btnExportDirectPngZip) btnExportDirectPngZip.addEventListener('click', () => generateDirectExport('zip'));

  // ==========================================
  // MÓDULO 3: IMAGENS & ZIP ➔ PPTX (ORGANIZADOR)
  // ==========================================
  let imageSlides = [];
  let imagesGeneratedPptx = null;
  let selectedImageSlideIds = new Set();
  const btnSelectAllImages = document.getElementById('btn-select-all-images');
  const labelSelectAllImages = document.getElementById('label-select-all-images');
  const btnDeleteSelectedImages = document.getElementById('btn-delete-selected-images');
  const labelDeleteSelectedImages = document.getElementById('label-delete-selected-images');
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
  const btnExportImagesPngZip = document.getElementById('btn-export-images-png-zip');
  const imagesMainBtnIcon = document.getElementById('images-main-btn-icon');
  const imagesMainBtnLabel = document.getElementById('images-main-btn-label');

  // Drag & Drop na Dropzone de Imagens
  if (dropzoneImages) {
    dropzoneImages.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        if (imagesFilesInput) {
          imagesFilesInput.value = '';
          imagesFilesInput.click();
        }
      }
    });

    [imagesFilesInput, zipFilesInput, imagesPptxInput].forEach(inp => {
      if (inp) {
        inp.addEventListener('click', (e) => {
          e.stopPropagation();
          e.target.value = '';
        });
      }
    });

    let dropCounterImages = 0;
    dropzoneImages.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterImages++;
      dropzoneImages.classList.add('dragover');
    });

    dropzoneImages.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (!dropzoneImages.classList.contains('dragover')) dropzoneImages.classList.add('dragover');
    });

    dropzoneImages.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterImages--;
      if (dropCounterImages <= 0) {
        dropCounterImages = 0;
        dropzoneImages.classList.remove('dragover');
      }
    });

    dropzoneImages.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropCounterImages = 0;
      dropzoneImages.classList.remove('dragover');
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

  if (imagesPptxInput) {
    imagesPptxInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await extractPptxIntoImageSlides(e.target.files[0]);
        e.target.value = '';
      }
    });
  }

  // Função centralizada para processar arquivos de imagens, ZIP e PPTX
  async function processIncomingFiles(files) {
    const validImageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.svg', '.gif'];
    let addedCount = 0;

    showToast('Lendo arquivos selecionados...', 'info');

    for (const file of files) {
      const fileNameLower = file.name.toLowerCase();

      // Caso 0: Arquivo PowerPoint (.pptx)
      if (fileNameLower.endsWith('.pptx')) {
        await extractPptxIntoImageSlides(file);
        continue;
      }

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
            if (!entry || typeof entry.async !== 'function') continue;
            const mime = getMimeTypeForFileName(entry.name);
            const base64Data = await entry.async('base64');
            const dataUrl = `data:${mime};base64,${base64Data}`;
            const dims = await probeImageDimensions(dataUrl);

            imageSlides.push({
              id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              name: entry.name.split('/').pop(),
              dataUrl: dataUrl,
              ratio: dims.ratio,
              width: dims.width,
              height: dims.height
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
          const dims = await probeImageDimensions(dataUrl);
          imageSlides.push({
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: file.name,
            dataUrl: dataUrl,
            ratio: dims.ratio,
            width: dims.width,
            height: dims.height
          });
          addedCount++;
        } catch (err) {
          console.error('Erro ao ler imagem:', err);
        }
      }
    }

    if (addedCount > 0) {
      imagesGeneratedPptx = null;
      showToast(`${addedCount} imagem(ns) adicionada(s) com sucesso!`, 'success');
      renderImagesOrganizer();
    } else {
      showToast('Nenhuma imagem válida encontrada nos arquivos.', 'error');
    }
  }

  // Renderiza a grade de cards do organizador de slides
  function renderImagesOrganizer() {
    if (!sectionImagesInput || !sectionImagesOrganizer) return;

    if (imageSlides.length === 0) {
      sectionImagesInput.style.display = 'flex';
      sectionImagesOrganizer.style.display = 'none';
      if (btnDownloadImagesTop) btnDownloadImagesTop.style.display = 'none';
      if (btnShareImagesMain) btnShareImagesMain.style.display = 'none';
      imagesGeneratedPptx = null;
      if (imagesReorderGrid) imagesReorderGrid.innerHTML = '';
      if (typeof updateSelectionFloatingBar === 'function') updateSelectionFloatingBar();
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

    // Atualiza botões da barra superior de seleção em lote
    if (btnDeleteSelectedImages && labelDeleteSelectedImages) {
      if (selectedImageSlideIds.size > 0) {
        btnDeleteSelectedImages.style.display = 'inline-flex';
        labelDeleteSelectedImages.textContent = `Apagar Selecionados (${selectedImageSlideIds.size})`;
      } else {
        btnDeleteSelectedImages.style.display = 'none';
      }
    }
    if (labelSelectAllImages) {
      if (typeof updateSelectionFloatingBar === 'function') updateSelectionFloatingBar();
      labelSelectAllImages.textContent = (imageSlides.length > 0 && selectedImageSlideIds.size === imageSlides.length)
        ? 'Desmarcar Todos'
        : 'Selecionar Todos';
    }

    imageSlides.forEach((slide, index) => {
      if (!slide.id) {
        slide.id = 'img_' + index + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      }

      const isSelected = selectedImageSlideIds.has(slide.id);
      const safeName = escapeHtml(slide.name || `Slide ${index + 1}`);
      const safeId = escapeHtml(slide.id);
      const card = document.createElement('div');
      card.className = 'image-slide-card' + (isSelected ? ' card-selected' : '');
      card.draggable = true;
      card.dataset.index = index;
      card.dataset.id = slide.id;

      card.innerHTML = `
        <div class="image-slide-preview">
          <label class="slide-select-label" title="Selecionar para apagar em lote" onclick="event.stopPropagation()">
            <input type="checkbox" class="slide-select-checkbox" data-id="${safeId}" ${isSelected ? 'checked' : ''}>
          </label>
          <span class="image-order-badge">#${index + 1}</span>
          <img src="${slide.dataUrl}" alt="Slide ${index + 1}" loading="lazy">
        </div>
        <div class="image-slide-info">
          <div class="image-slide-name" title="${safeName}">${safeName}</div>
          <div class="image-slide-actions">
            <div class="image-reorder-buttons">
              <button type="button" class="btn-card-reorder" data-action="prev" title="Mover para trás" ${index === 0 ? 'disabled' : ''}>
                ⬅
              </button>
              <button type="button" class="btn-card-reorder" data-action="next" title="Mover para frente" ${index === imageSlides.length - 1 ? 'disabled' : ''}>
                ➡
              </button>
            </div>
            <div class="card-right-actions">
              <input type="file" class="card-replace-input" accept="image/*" style="display: none;">
              <input type="file" class="card-insert-after-input" accept="image/*,.pdf,.zip,application/pdf,application/zip,application/x-zip-compressed" multiple style="display: none;">
              <div class="card-more-wrapper">
                <button type="button" class="btn-card-more" data-action="more" title="Mais opções">
                  ⋮
                </button>
              </div>
              <button type="button" class="btn-card-delete" data-action="delete" title="Excluir este slide">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;

      // Botões de ação do card
      const btnPrev = card.querySelector('[data-action="prev"]');
      const btnNext = card.querySelector('[data-action="next"]');
      const btnDel  = card.querySelector('[data-action="delete"]');
      const btnMore = card.querySelector('[data-action="more"]');
      const inputReplace = card.querySelector('.card-replace-input');
      const inputInsertAfter = card.querySelector('.card-insert-after-input');
      const selectCheckbox = card.querySelector('.slide-select-checkbox');

      // Checkbox de seleção em lote
      if (selectCheckbox) {
        selectCheckbox.addEventListener('change', (e) => {
          e.stopPropagation();
          if (e.target.checked) {
            selectedImageSlideIds.add(slide.id);
          } else {
            selectedImageSlideIds.delete(slide.id);
          }
          renderImagesOrganizer();
        });
      }

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

      if (btnMore) {
        btnMore.addEventListener('click', (e) => {
          e.stopPropagation();
          openSlideActionSheet({
            slide,
            index,
            total: imageSlides.length,
            onEnhanceAi: () => {
              openEnhanceAiModal(slide, index, 'images');
            },
            onReplace: () => {
              if (inputReplace) {
                inputReplace.value = '';
                inputReplace.click();
              }
            },
            onInsertAfter: () => {
              if (inputInsertAfter) {
                inputInsertAfter.value = '';
                inputInsertAfter.click();
              }
            },
            onDownloadScreen: () => {
              const aspect = imagesAspectSelect ? imagesAspectSelect.value : '16x9';
              const fit = imagesFitSelect ? imagesFitSelect.value : 'contain';
              const bg = imagesBgSelect ? imagesBgSelect.value : '000000';
              downloadSingleSlidePng(slide, index, 'screen', aspect, fit, bg);
            },
            onDownloadOrig: () => {
              downloadSingleSlidePng(slide, index, 'orig');
            },
            onDelete: () => {
              if (confirm(`Deseja excluir o slide #${index + 1}?`)) {
                imageSlides.splice(index, 1);
                selectedImageSlideIds.delete(slide.id);
                imagesGeneratedPptx = null;
                renderImagesOrganizer();
              }
            }
          });
        });
      }

      // Substituir slide de imagem
      if (inputReplace) {
        inputReplace.addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione uma imagem válida (.jpg, .png, .webp).', 'error');
            return;
          }
          try {
            const dataUrl = await readFileAsDataUrl(file);
            const dims = await probeImageDimensions(dataUrl);
            imageSlides[index] = {
              ...imageSlides[index],
              name: file.name,
              dataUrl: dataUrl,
              ratio: dims.ratio,
              width: dims.width,
              height: dims.height
            };
            imagesGeneratedPptx = null;
            renderImagesOrganizer();
            showToast(`Slide #${index + 1} substituído com sucesso!`, 'success');
          } catch (err) {
            console.error('Erro ao substituir imagem:', err);
            showToast('Erro ao processar imagem: ' + err.message, 'error');
          }
        });
      }

      // Adicionar slide(s) depois no lote de imagens (suporta Fotos, PDF completo e ZIP)
      if (inputInsertAfter) {
        inputInsertAfter.addEventListener('change', async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;
          try {
            showToast(`Processando ${files.length} arquivo(s)...`, 'info');
            const newSlides = await extractSlidesFromMixedFiles(files, 'images');
            if (newSlides.length > 0) {
              imageSlides.splice(index + 1, 0, ...newSlides);
              imagesGeneratedPptx = null;
              renderImagesOrganizer();
              showToast(
                newSlides.length === 1
                  ? `Slide adicionado após o #${index + 1}!`
                  : `${newSlides.length} slides adicionados após o #${index + 1}!`,
                'success'
              );
            } else {
              showToast('Nenhum slide pôde ser extraído dos arquivos selecionados.', 'error');
            }
          } catch (err) {
            console.error('Erro ao adicionar imagens depois:', err);
            showToast('Erro ao processar imagens: ' + err.message, 'error');
          }
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

      // Touch Drag & Drop com Auto-Scroll no Celular
      attachTouchDragAndDrop(card, index, moveImageSlide);

      imagesReorderGrid.appendChild(card);
    });
  }

  // Mover slide de uma posição para outra
  function moveImageSlide(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= imageSlides.length || toIndex < 0 || toIndex >= imageSlides.length) return;
    const item = imageSlides.splice(fromIndex, 1)[0];
    imageSlides.splice(toIndex, 0, item);
    imagesGeneratedPptx = null;
    renderImagesOrganizer();
  }

  // Deletar imagens selecionadas em lote no organizador
  function deleteSelectedImageSlides() {
    const count = selectedImageSlideIds.size;
    if (count === 0) {
      showToast('Nenhuma imagem selecionada.', 'info');
      return;
    }
    if (confirm(`Deseja realmente apagar as ${count} imagem(ns) selecionada(s)?`)) {
      imageSlides = imageSlides.filter(s => !selectedImageSlideIds.has(s.id));
      selectedImageSlideIds.clear();
      imagesGeneratedPptx = null;
      renderImagesOrganizer();
      showToast(`${count} imagem(ns) apagada(s) com sucesso!`, 'success');
    }
  }

  if (btnSelectAllImages) {
    btnSelectAllImages.addEventListener('click', () => {
      if (imageSlides.length === 0) return;
      if (selectedImageSlideIds.size === imageSlides.length) {
        selectedImageSlideIds.clear();
      } else {
        imageSlides.forEach(s => selectedImageSlideIds.add(s.id));
      }
      renderImagesOrganizer();
    });
  }

  if (btnDeleteSelectedImages) {
    btnDeleteSelectedImages.addEventListener('click', () => {
      deleteSelectedImageSlides();
    });
  }

  // Deletar um slide específico
  function deleteImageSlide(index) {
    if (index < 0 || index >= imageSlides.length) return;
    const removed = imageSlides.splice(index, 1)[0];
    if (removed && removed.id) selectedImageSlideIds.delete(removed.id);
    imagesGeneratedPptx = null;
    renderImagesOrganizer();
    showToast('Slide removido.', 'info');
  }

  // Ordenação alfabética natural (A-Z)
  if (btnSortImagesAz) {
    btnSortImagesAz.addEventListener('click', () => {
      if (imageSlides.length === 0) return;
      imageSlides.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      imagesGeneratedPptx = null;
      renderImagesOrganizer();
      showToast('Slides ordenados de A a Z por nome de arquivo.', 'success');
    });
  }

  // Inverter ordem dos slides
  if (btnReverseImages) {
    btnReverseImages.addEventListener('click', () => {
      if (imageSlides.length === 0) return;
      imageSlides.reverse();
      imagesGeneratedPptx = null;
      renderImagesOrganizer();
      showToast('Ordem dos slides invertida!', 'info');
    });
  }

  function resetImagesOrganizer() {
    imageSlides = [];
    imagesGeneratedPptx = null;
    if (selectedImageSlideIds) selectedImageSlideIds.clear();
    if (imagesFilesInput) imagesFilesInput.value = '';
    if (zipFilesInput) zipFilesInput.value = '';
    if (imagesPptxInput) imagesPptxInput.value = '';
    if (imagesProgressContainer) imagesProgressContainer.style.display = 'none';
    if (btnShareImagesMain) btnShareImagesMain.style.display = 'none';
    if (typeof updateSelectionFloatingBar === 'function') updateSelectionFloatingBar();
    renderImagesOrganizer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Limpar todas as imagens
  if (btnClearAllImages) {
    btnClearAllImages.addEventListener('click', () => {
      if (imageSlides.length === 0) return;
      if (confirm('Deseja remover todas as imagens do organizador?')) {
        resetImagesOrganizer();
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
      resetImagesOrganizer();
      showToast('Novo lote iniciado. Selecione as imagens ou apresentação.', 'info');
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
      } else if (fmt === 'zip') {
        imagesMainBtnIcon.textContent = '📦';
        imagesMainBtnLabel.textContent = 'Gerar e Baixar Pacote ZIP (.zip)';
      } else {
        imagesMainBtnIcon.textContent = '⚡';
        imagesMainBtnLabel.textContent = 'Baixar PowerPoint (.pptx)';
      }
    }
    if (btnDownloadImagesTop) {
      if (fmt === 'pdf') {
        btnDownloadImagesTop.innerHTML = '<span>📄</span> Baixar PDF (.pdf)';
      } else if (fmt === 'both') {
        btnDownloadImagesTop.innerHTML = '<span>✨</span> Baixar Ambos (.pptx + .pdf)';
      } else if (fmt === 'zip') {
        btnDownloadImagesTop.innerHTML = '<span>📦</span> Baixar Pacote ZIP (.zip)';
      } else {
        btnDownloadImagesTop.innerHTML = '<span>📥</span> Baixar PowerPoint (.pptx)';
      }
    }
  }

  if (imagesFormatSelect) {
    imagesFormatSelect.addEventListener('change', updateImagesExportBtnLabel);
  }

  // Geração e Exportação customizada (PPTX, PDF, ZIP ou Ambos) para Módulo 3
  async function generateImagesExport(requestedFormat) {
    if (imageSlides.length === 0) {
      showToast('Adicione pelo menos uma imagem para gerar a apresentação.', 'error');
      return false;
    }

    const formatChoice = requestedFormat || (imagesFormatSelect ? imagesFormatSelect.value : 'pptx');
    const aspectChoice = imagesAspectSelect ? imagesAspectSelect.value : '16x9';
    const fitChoice = imagesFitSelect ? imagesFitSelect.value : 'contain';
    const bgColor = imagesBgSelect ? imagesBgSelect.value : '000000';

    const now = new Date();
    const pad2 = n => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}_${pad2(now.getHours())}-${pad2(now.getMinutes())}-${pad2(now.getSeconds())}`;
    const pptxFileName = `Apresentacao_Imagens_${timestamp}.pptx`;
    const pdfFileName = `Apresentacao_Imagens_${timestamp}.pdf`;
    const zipFileName = `Apresentacao_Imagens_${timestamp}_PNG.zip`;

    if (btnGenerateImagesPptx) {
      btnGenerateImagesPptx.disabled = true;
    }
    if (imagesMainBtnIcon) imagesMainBtnIcon.textContent = '⏳';
    if (imagesMainBtnLabel) imagesMainBtnLabel.textContent = 'Exportando Slides...';
    if (imagesProgressContainer) {
      imagesProgressContainer.style.display = 'block';
      if (imagesProgressBar) imagesProgressBar.style.width = '10%';
      if (imagesProgressPercent) imagesProgressPercent.textContent = '10%';
      if (imagesProgressStatus) imagesProgressStatus.textContent = 'Preparando exportação...';
    }

    try {
      const total = imageSlides.length;
      let allOk = true;
      let pptxOk = false;

      // 1. Exportar PPTX se solicitado
      if (formatChoice === 'pptx' || formatChoice === 'both') {
        if (typeof PptxGenJS === 'undefined') {
          throw new Error('Biblioteca PptxGenJS não carregada.');
        }

        const pptx = new PptxGenJS();
        if (aspectChoice === 'original' && imageSlides[0] && imageSlides[0].ratio) {
          const firstRatio = imageSlides[0].ratio || (16 / 9);
          pptx.defineLayout({ name: 'CUSTOM_IMG', width: 10, height: 10 / firstRatio });
          pptx.layout = 'CUSTOM_IMG';
        } else if (aspectChoice === '4x3') {
          pptx.layout = 'LAYOUT_4x3';
        } else {
          pptx.layout = 'LAYOUT_16x9';
        }

        for (let i = 0; i < total; i++) {
          const slideData = imageSlides[i];
          const pct = Math.round(10 + ((i + 1) / total) * (formatChoice === 'both' ? 40 : 80));
          if (imagesProgressBar) imagesProgressBar.style.width = `${pct}%`;
          if (imagesProgressPercent) imagesProgressPercent.textContent = `${pct}%`;
          if (imagesProgressStatus) imagesProgressStatus.textContent = `PowerPoint: slide ${i + 1} de ${total}...`;

          const slide = pptx.addSlide();
          if (bgColor === 'theme_cinzel' || bgColor === 'assets/cinzel_theme_bg.png') {
            slide.background = { path: 'assets/cinzel_theme_bg.png' };
          } else if (bgColor === 'theme_ts' || bgColor === 'assets/ts_theme_bg.png') {
            slide.background = { path: 'assets/ts_theme_bg.png' };
          } else if (bgColor === 'theme_bible' || bgColor === 'assets/church_sermon_bg.jpg') {
            slide.background = { path: 'assets/church_sermon_bg.jpg' };
          } else {
            slide.background = { color: bgColor };
          }

          if (fitChoice === 'cover') {
            slide.addImage({ data: slideData.dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
          } else {
            slide.addImage({ data: slideData.dataUrl, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'contain', w: '100%', h: '100%' } });
          }
        }

        imagesGeneratedPptx = pptx;
        imagesPptxFileName = pptxFileName;
        const blob = await pptx.write({ outputType: 'blob' });
        pptxOk = await saveOrShareFileNative(blob, pptxFileName, 'download');
        allOk = allOk && pptxOk;
      }

      // 2. Exportar PDF se solicitado
      if (formatChoice === 'pdf' || formatChoice === 'both') {
        if (imagesProgressStatus) imagesProgressStatus.textContent = 'Gerando documento em PDF (.pdf)...';

        const pdfOk = await generateSlidesPdfDoc({
          slides: imageSlides,
          aspectChoice,
          fitChoice,
          bgChoice: bgColor,
          fileName: pdfFileName,
          progressCallback: (cur, tot) => {
            const startPct = formatChoice === 'both' ? 55 : 10;
            const range = formatChoice === 'both' ? 40 : 85;
            const pct = Math.round(startPct + (cur / tot) * range);
            if (imagesProgressBar) imagesProgressBar.style.width = `${pct}%`;
            if (imagesProgressPercent) imagesProgressPercent.textContent = `${pct}%`;
            if (imagesProgressStatus) imagesProgressStatus.textContent = `PDF: página ${cur} de ${tot}...`;
          }
        });
        allOk = allOk && pdfOk;
      }

      // 3. Exportar Pacote ZIP com imagens PNG se solicitado
      if (formatChoice === 'zip') {
        if (imagesProgressStatus) imagesProgressStatus.textContent = 'Gerando pacote ZIP com imagens PNG...';

        const zipOk = await generateSlidesZip({
          slides: imageSlides,
          aspectChoice,
          fitChoice,
          bgChoice: bgColor,
          zipFileName,
          progressCallback: (cur, tot, statusText) => {
            const pct = Math.round((cur / tot) * 95);
            if (imagesProgressBar) imagesProgressBar.style.width = `${pct}%`;
            if (imagesProgressPercent) imagesProgressPercent.textContent = `${pct}%`;
            if (imagesProgressStatus) imagesProgressStatus.textContent = statusText || `PNG: slide ${cur} de ${tot}...`;
          }
        });
        allOk = allOk && zipOk;
      }

      if (imagesProgressStatus) imagesProgressStatus.textContent = allOk ? 'Concluído!' : 'Exportação não concluída.';
      if (imagesProgressBar) imagesProgressBar.style.width = allOk ? '100%' : '0%';
      if (imagesProgressPercent) imagesProgressPercent.textContent = allOk ? '100%' : '0%';

      if (pptxOk && btnShareImagesMain) {
        btnShareImagesMain.style.display = 'inline-flex';
      }

      if (allOk) {
        if (formatChoice === 'both') {
          showToast(`🎉 Apresentação exportada em PPTX e PDF (${total} slides cada)!`, 'success');
        } else if (formatChoice === 'pdf') {
          showToast(`🎉 Documento PDF exportado com sucesso (${total} páginas)!`, 'success');
        } else if (formatChoice === 'zip') {
          showToast(`🎉 Pacote ZIP exportado com sucesso (${total} imagens PNG)!`, 'success');
        } else {
          showToast(`🎉 Apresentação PPTX exportada com sucesso (${total} slides)!`, 'success');
        }
      }
      return allOk;

    } catch (err) {
      console.error('Erro na exportação de imagens:', err);
      showToast('Erro ao exportar: ' + err.message, 'error');
      return false;
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

  async function shareImagesPptx() {
    if (!imagesGeneratedPptx) {
      showToast('Gere a apresentação primeiro para compartilhar.', 'info');
      return;
    }
    try {
      showToast('Preparando apresentação para compartilhar...', 'info');
      const blob = await imagesGeneratedPptx.write({ outputType: 'blob' });
      await saveOrShareFileNative(blob, imagesPptxFileName || 'SLIDES_IMAGENS.pptx', 'share');
    } catch(e) {
      if (e.name !== 'AbortError') showToast('Erro ao compartilhar: ' + e.message, 'error');
    }
  }

  const btnShareImagesMain = document.getElementById('btn-share-images-main');
  if (btnShareImagesMain) btnShareImagesMain.addEventListener('click', shareImagesPptx);

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

  if (btnExportImagesPngZip) {
    btnExportImagesPngZip.addEventListener('click', () => generateImagesExport('zip'));
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
    if (verseSearchStatus) verseSearchStatus.innerText = `Consultando passagem online (${version})...`;

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
        if (verseSearchStatus) {
          verseSearchStatus.innerText = version === 'Almeida'
            ? '✅ Texto bíblico carregado (Almeida online)!'
            : `✅ Texto carregado (Almeida online) • Rótulo marcado como ${version}.`;
        }
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
  // Toast utilitário
  function showToast(msg, type = 'info') {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast ' + type;
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

  // ==========================================
  // MÓDULO: Parágrafo para Slide
  // ==========================================
  const btnProcessParagrafo = document.getElementById('btn-process-paragrafo');
  const inputParagrafo = document.getElementById('paragrafo-text-input');
  
  if (btnProcessParagrafo && inputParagrafo) {
    btnProcessParagrafo.addEventListener('click', () => {
      const rawText = inputParagrafo.value.trim();
      if (!rawText) {
        showToast('Cole ou digite algum texto primeiro!', 'error');
        return;
      }

      // Separa os blocos pulando uma linha em branco (no mínimo 2 quebras de linha consecutivas)
      const blocks = rawText.split(/\n\s*\n/g).map(b => b.trim()).filter(Boolean);

      if (blocks.length === 0) {
        showToast('Nenhum parágrafo válido encontrado.', 'error');
        return;
      }

      const generatedSlides = [];

      for (const block of blocks) {
        // Verifica se há alguma linha com [ref]
        const lines = block.split('\n');
        let reference = 'Parágrafo';
        let mainLines = [];
        
        for (const line of lines) {
          if (line.toLowerCase().includes('[ref]')) {
            // Encontrou uma referência
            reference = line.replace(/\[ref\]/ig, '').trim();
          } else {
            mainLines.push(line);
          }
        }
        
        const mainText = mainLines.join('\n').trim();
        
        // Se a pessoa só colocou [ref] sem texto, usa a própria ref como texto
        const finalContent = mainText || reference;

        // buildRunsFromHighlights processa os *asteriscos* agora
        const runs = buildRunsFromHighlights(finalContent, []);

        generatedSlides.push({
          type: 'verse', // Mapeamos como verse para ter o design bonito
          reference: reference !== 'Parágrafo' ? reference : '',
          runs: runs
        });
      }

      currentSlides = generatedSlides;
      currentDownloadUrl = null;
      
      // Ocultar section de inputs
      const inputSectionEl = document.getElementById('input-section');
      const resultsSectionEl = document.getElementById('results-section');
      
      if (inputSectionEl) inputSectionEl.style.display = 'none';
      if (resultsSectionEl) resultsSectionEl.style.display = 'block';
      
      // Limpar o dropzone original se houver
      currentFile = null;
      const selFileInfo = document.getElementById('selected-file-info');
      if (selFileInfo) selFileInfo.style.display = 'none';
      const dzText = document.querySelector('#dropzone .dropzone-text');
      if (dzText) dzText.style.display = 'block';

      renderResults();
      showToast('Slides gerados a partir do parágrafo!', 'success');
    });
  }

  // ==========================================
  // MELHORAR SLIDE COM IA (MODAL INTERATIVO & PREVIEW FULL HD)
  // ==========================================
  const modalEnhanceAi = document.getElementById('modalEnhanceAi');
  const btnCloseEnhanceModal = document.getElementById('btn-close-enhance-modal');
  const btnCancelEnhanceModal = document.getElementById('btn-cancel-enhance-modal');
  const enhanceSlideInfoBadge = document.getElementById('enhance-slide-info-badge');
  const enhanceAiLoading = document.getElementById('enhance-ai-loading');
  const enhanceAiLoadingText = document.getElementById('enhance-ai-loading-text');
  const enhanceLivePreviewImg = document.getElementById('enhance-live-preview-img');
  const enhancePreviewCanvas = document.getElementById('enhance-preview-canvas');
  const btnEnhanceReanalyze = document.getElementById('btn-enhance-reanalyze');
  const enhanceSlideType = document.getElementById('enhance-slide-type');
  const enhanceBgTheme = document.getElementById('enhance-bg-theme');
  const enhanceThemeBadge = document.getElementById('enhance-theme-badge');
  const enhanceRefBox = document.getElementById('enhance-ref-box');
  const enhanceRefInput = document.getElementById('enhance-ref-input');
  const btnEnhanceFetchVerse = document.getElementById('btn-enhance-fetch-verse');
  const btnEnhanceHighlight = document.getElementById('btn-enhance-highlight');
  const btnEnhanceQuotes = document.getElementById('btn-enhance-quotes');
  const btnEnhanceClearTags = document.getElementById('btn-enhance-clear-tags');
  const enhanceTextInput = document.getElementById('enhance-text-input');
  const enhanceTextAlign = document.getElementById('enhance-text-align');
  const btnEnhanceFontMinus = document.getElementById('btn-enhance-font-minus');
  const btnEnhanceFontPlus = document.getElementById('btn-enhance-font-plus');
  const btnEnhanceFontReset = document.getElementById('btn-enhance-font-reset');
  const enhanceFontSizeDisplay = document.getElementById('enhance-font-size-display');
  const btnEnhanceInsertAsNew = document.getElementById('btn-enhance-insert-as-new');
  const btnEnhanceApplyReplace = document.getElementById('btn-enhance-apply-replace');

  let activeEnhanceTarget = null; // { slide, index, organizerType: 'direct'|'images' }
  let enhanceManualFontSizeDelta = 0; // Ajuste estilo PowerPoint (A▲ / A▼)
  let enhanceRenderDebounceTimer = null;
  let enhanceRenderSeq = 0;

  let defaultChurchBgImage = null;
  function loadDefaultChurchBgImage() {
    if (defaultChurchBgImage && defaultChurchBgImage.complete && defaultChurchBgImage.naturalWidth > 0) {
      return Promise.resolve(defaultChurchBgImage);
    }
    return new Promise((resolve) => {
      const img = new Image();
      // Não definir crossOrigin para caminhos relativos locais, evitando tainted canvas!
      img.onload = () => {
        defaultChurchBgImage = img;
        resolve(img);
      };
      img.onerror = () => {
        const imgPng = new Image();
        imgPng.onload = () => {
          defaultChurchBgImage = imgPng;
          resolve(imgPng);
        };
        imgPng.onerror = () => resolve(null);
        imgPng.src = 'assets/church_sermon_bg.png';
      };
      img.src = 'assets/church_sermon_bg.jpg';
    });
  }

  let defaultTsBgImage = null;
  function loadDefaultTsBgImage() {
    if (defaultTsBgImage && defaultTsBgImage.complete && defaultTsBgImage.naturalWidth > 0) {
      return Promise.resolve(defaultTsBgImage);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        defaultTsBgImage = img;
        resolve(img);
      };
      img.onerror = () => {
        const imgJpg = new Image();
        imgJpg.onload = () => {
          defaultTsBgImage = imgJpg;
          resolve(imgJpg);
        };
        imgJpg.onerror = () => resolve(null);
        imgJpg.src = 'assets/ts_theme_bg.jpg';
      };
      img.src = 'assets/ts_theme_bg.png';
    });
  }

  let defaultCinzelBgImage = null;
  function loadDefaultCinzelBgImage() {
    if (defaultCinzelBgImage && defaultCinzelBgImage.complete && defaultCinzelBgImage.naturalWidth > 0) {
      return Promise.resolve(defaultCinzelBgImage);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        defaultCinzelBgImage = img;
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = 'assets/cinzel_theme_bg.png';
    });
  }

  async function loadActiveEnhanceBgImage() {
    let activeUrl = (enhanceBgTheme && enhanceBgTheme.value) ? enhanceBgTheme.value : null;
    if (!activeUrl) {
      activeUrl = (typeof getActiveBackgroundUrl === 'function') ? getActiveBackgroundUrl() : 'assets/church_sermon_bg.jpg';
    }
    if (activeUrl && (activeUrl.includes('cinzel') || activeUrl.includes('nobre') || activeUrl === 'assets/cinzel_theme_bg.png')) {
      const cinzelImg = await loadDefaultCinzelBgImage();
      if (cinzelImg) return cinzelImg;
    }
    if (activeUrl && (activeUrl.includes('ts_theme_bg') || activeUrl === 'assets/ts_theme_bg.png')) {
      const tsImg = await loadDefaultTsBgImage();
      if (tsImg) return tsImg;
    }
    if (activeUrl && activeUrl !== 'assets/church_sermon_bg.jpg' && !activeUrl.includes('church_sermon_bg')) {
      const customOrTemplateImg = await new Promise((resolve) => {
        const img = new Image();
        if (/^https?:\/\//i.test(activeUrl)) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = activeUrl;
      });
      if (customOrTemplateImg && customOrTemplateImg.complete && customOrTemplateImg.naturalWidth > 0) {
        return customOrTemplateImg;
      }
    }
    return loadDefaultChurchBgImage();
  }

  // Pré-carrega as imagens oficiais dos temas Bíblia, TS e Cinzel na memória
  loadDefaultChurchBgImage();
  loadDefaultTsBgImage();
  loadDefaultCinzelBgImage();

  function scheduleEnhanceCanvasPreview() {
    if (enhanceRenderDebounceTimer) {
      clearTimeout(enhanceRenderDebounceTimer);
    }
    enhanceRenderDebounceTimer = setTimeout(() => {
      enhanceRenderDebounceTimer = null;
      renderEnhanceCanvasPreview();
    }, 120);
  }

  function closeEnhanceModal() {
    if (enhanceRenderDebounceTimer) {
      clearTimeout(enhanceRenderDebounceTimer);
      enhanceRenderDebounceTimer = null;
    }
    enhanceRenderSeq++;
    if (modalEnhanceAi) {
      modalEnhanceAi.style.display = 'none';
    }
    if (enhancePreviewCanvas) {
      enhancePreviewCanvas.width = 0;
      enhancePreviewCanvas.height = 0;
    }
    activeEnhanceTarget = null;
  }

  if (btnCloseEnhanceModal) btnCloseEnhanceModal.addEventListener('click', closeEnhanceModal);
  if (btnCancelEnhanceModal) btnCancelEnhanceModal.addEventListener('click', closeEnhanceModal);

  function openEnhanceAiModal(slide, index, organizerType) {
    if (!modalEnhanceAi) return;

    activeEnhanceTarget = { slide, index, organizerType };
    const totalCount = organizerType === 'direct' ? directSlides.length : imageSlides.length;

    if (enhanceSlideInfoBadge) {
      enhanceSlideInfoBadge.textContent = `Slide #${index + 1} de ${totalCount} • Pré-visualização e Ajuste`;
    }

    if (enhanceBgTheme) {
      const activeUrl = (typeof getActiveBackgroundUrl === 'function') ? getActiveBackgroundUrl() : 'assets/church_sermon_bg.jpg';
      if (activeUrl && (activeUrl.includes('cinzel') || activeUrl.includes('nobre'))) {
        enhanceBgTheme.value = 'assets/cinzel_theme_bg.png';
      } else if (activeUrl && activeUrl.includes('ts_theme_bg')) {
        enhanceBgTheme.value = 'assets/ts_theme_bg.png';
      } else {
        enhanceBgTheme.value = 'assets/church_sermon_bg.jpg';
      }
      if (enhanceThemeBadge) {
        if (enhanceBgTheme.value.includes('cinzel') || enhanceBgTheme.value.includes('nobre')) {
          enhanceThemeBadge.textContent = '🏛️ Fundo Nobre (16:9)';
        } else if (enhanceBgTheme.value.includes('ts_theme_bg')) {
          enhanceThemeBadge.textContent = '✨ Fundo TS (16:9)';
        } else {
          enhanceThemeBadge.textContent = '📖 Fundo Bíblia (16:9)';
        }
      }
    }

    if (enhanceSlideType) enhanceSlideType.value = 'verse';
    const isCinzelActive = (enhanceBgTheme && (enhanceBgTheme.value.includes('cinzel') || enhanceBgTheme.value.includes('nobre'))) || currentSelectedFont === 'cinzel';
    if (enhanceTextAlign) enhanceTextAlign.value = isCinzelActive ? 'center' : ((typeof currentSelectedAlign === 'string' && currentSelectedAlign) ? currentSelectedAlign : 'left');
    enhanceManualFontSizeDelta = 0;
    if (enhanceTextInput) enhanceTextInput.value = 'Carregando análise da IA...';
    if (enhanceRefInput) enhanceRefInput.value = '';

    modalEnhanceAi.style.display = 'flex';
    renderEnhanceCanvasPreview();

    // Dispara a leitura multimodal com IA
    analyzeSlideWithAi(slide);
  }

  // Redimensiona/comprime imagem para envio rápido para a API Gemini Vision
  async function prepareImageBase64ForAi(imgSrc) {
    return new Promise((resolve) => {
      if (!imgSrc) return resolve(null);
      const img = new Image();
      if (/^https?:\/\//i.test(imgSrc)) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        const cv = document.createElement('canvas');
        try {
          const maxW = 1280;
          const maxH = 720;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (!w || !h) {
            resolve(null);
            return;
          }
          if (w > maxW || h > maxH) {
            const ratio = Math.min(maxW / w, maxH / h);
            w = Math.max(1, Math.round(w * ratio));
            h = Math.max(1, Math.round(h * ratio));
          }
          cv.width = w;
          cv.height = h;
          const ctx = cv.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = cv.toDataURL('image/jpeg', 0.85);
          const parts = dataUrl.split(',');
          resolve({
            mimeType: 'image/jpeg',
            base64: parts[1] || ''
          });
        } catch (err) {
          resolve(null);
        } finally {
          cv.width = 0;
          cv.height = 0;
        }
      };
      img.onerror = () => {
        // Fallback: se já for dataURL puro
        if (imgSrc.startsWith('data:')) {
          const mimeMatch = imgSrc.match(/^data:(.*?);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const base64 = imgSrc.split(',')[1] || '';
          resolve({ mimeType, base64 });
        } else {
          resolve(null);
        }
      };
      img.src = imgSrc;
    });
  }

  async function analyzeSlideWithAi(slide) {
    if (!slide) return;
    const imgSrc = slide.imgData || slide.dataUrl;

    if (enhanceAiLoading) {
      enhanceAiLoading.style.display = 'flex';
      if (enhanceAiLoadingText) {
        enhanceAiLoadingText.textContent = 'IA Gemini Vision analisando slide e identificando versículo...';
      }
    }

    try {
      const imgData = await prepareImageBase64ForAi(imgSrc);
      if (!imgData || !imgData.base64) {
        throw new Error('Não foi possível carregar a imagem do slide.');
      }

      const defaultKey = atob('QVEuQWI4Uk42Si1lTWMtdVdvWVlpMWpsVGw4WXVvZ3RTajhuTXE2VzdSdVl1Zk8zbi1LcXc=');
      const apiKey = localStorage.getItem('GEMINI_API_KEY') || defaultKey;

      const prompt = `Você é um assistente especialista em produção de slides de cultos e sermões da igreja.
Analise a imagem desta lâmina/slide de apresentação.
Sua missão:
1. Detectar se é um versículo bíblico ("type": "verse") ou frase/tópico de sermão ("type": "topic").
2. Se for versículo bíblico:
   - "reference": Identifique o Livro, Capítulo e Versículo canônico (ex: "Lucas 6:24", "João 3:16", "Romanos 8:28"). Mesmo que a referência não esteja escrita ou esteja abreviada, deduza pelo texto bíblico canônico.
   - "text": O texto bíblico exato e limpo da passagem (sem a referência embutida e sem números soltos).
   - "highlights": De 2 a 4 termos ou palavras-chave de maior ênfase para destaque dourado na projeção (ex: ["ai de vós", "ricos", "consolação"]).
3. Se for tópico/título:
   - "reference": Título se houver (ou deixe vazio se não houver).
   - "text": O texto da frase ou tópico.
   - "highlights": Palavras-chave principais para destaque.

Retorne ESTRITAMENTE em formato JSON puro, sem blocos markdown:
{
  "type": "verse",
  "reference": "Lucas 6:24",
  "text": "Mas ai de vós, ricos! Porque já tendes a vossa consolação.",
  "highlights": ["ai de vós", "ricos"]
}`;

      const parts = [
        {
          inline_data: {
            mime_type: imgData.mimeType,
            data: imgData.base64
          }
        },
        { text: prompt }
      ];

      const models = [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
      ];

      let jsonResult = null;
      let lastError = null;

      for (const model of models) {
        let timeoutId = null;
        try {
          if (enhanceAiLoadingText) {
            enhanceAiLoadingText.textContent = `Consultando modelo de IA (${model})...`;
          }
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 20000);

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
              }
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            lastError = errData?.error?.message || `HTTP ${res.status}`;
            continue;
          }

          const data = await res.json();
          if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            const rawText = data.candidates[0].content.parts[0].text;
            const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            jsonResult = JSON.parse(cleaned);
            if (jsonResult) break;
          }
        } catch (e) {
          lastError = e.message || String(e);
          console.warn(`Tentativa com ${model} falhou:`, lastError);
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }
      }

      if (jsonResult) {
        applyAiResultToModal(jsonResult);
        showToast('✨ Slide interpretado pela IA com sucesso!', 'success');
      } else {
        throw new Error('A IA não conseguiu interpretar a imagem' + (lastError ? `: ${lastError}` : '.'));
      }
    } catch (err) {
      console.warn('Falha no reconhecimento com IA:', err);
      if (enhanceRefInput && !enhanceRefInput.value) {
        enhanceRefInput.value = (slide.title && slide.title.length < 35) ? slide.title : 'Versículo / Tópico';
      }
      if (enhanceTextInput && (!enhanceTextInput.value || enhanceTextInput.value === 'Carregando análise da IA...')) {
        enhanceTextInput.value = 'Digite o texto do versículo ou frase aqui.';
      }
      renderEnhanceCanvasPreview();
      showToast('Você pode ajustar os textos manualmente abaixo.', 'info');
    } finally {
      if (enhanceAiLoading) {
        enhanceAiLoading.style.display = 'none';
      }
    }
  }

  function applyAiResultToModal(data) {
    if (!data) return;

    if (enhanceSlideType) {
      enhanceSlideType.value = data.type === 'topic' ? 'topic' : 'verse';
    }

    if (enhanceRefInput) {
      enhanceRefInput.value = data.reference || '';
    }

    let cleanText = (data.text || '').trim();
    const highlights = Array.isArray(data.highlights) ? data.highlights : [];

    // Aplica [HL] nas palavras-chave detectadas
    if (highlights.length > 0) {
      highlights.forEach(h => {
        if (!h || typeof h !== 'string' || h.trim().length === 0) return;
        const escaped = h.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp(`(?<!\\[HL\\])(${escaped})(?!\\[\\/HL\\])`, 'gi');
        cleanText = cleanText.replace(reg, '[HL]$1[/HL]');
      });
    }

    // Se for versículo e não tiver aspas, adiciona aspas
    if (data.type !== 'topic' && !cleanText.startsWith('“') && !cleanText.startsWith('"')) {
      cleanText = `“${cleanText}”`;
    }

    if (enhanceTextInput) {
      enhanceTextInput.value = cleanText;
    }

    enhanceManualFontSizeDelta = 0;
    renderEnhanceCanvasPreview();
  }

  // ==========================================
  // RENDERIZAÇÃO DO PREVIEW OFICIAL (CANVAS FULL HD & PREVIEW EM TEMPO REAL)
  // ==========================================
  async function renderEnhanceCanvasPreview() {
    if (enhanceRenderDebounceTimer) {
      clearTimeout(enhanceRenderDebounceTimer);
      enhanceRenderDebounceTimer = null;
    }
    const mySeq = ++enhanceRenderSeq;

    const rawText = enhanceTextInput ? enhanceTextInput.value.trim() : '';
    const refText = enhanceRefInput ? enhanceRefInput.value.trim() : '';
    const align = enhanceTextAlign ? enhanceTextAlign.value : 'left';
    const type = enhanceSlideType ? enhanceSlideType.value : 'verse';

    if (enhanceRefBox) {
      enhanceRefBox.style.display = type === 'verse' ? 'block' : 'none';
    }

    if (!enhancePreviewCanvas) return;
    const ctx = enhancePreviewCanvas.getContext('2d');
    if (!ctx) return;

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }
    if (mySeq !== enhanceRenderSeq) return;

    // Fundo ativo sincronizado com o tema do Módulo 1 (fallback para fundo oficial)
    const bgImg = await loadActiveEnhanceBgImage();
    if (mySeq !== enhanceRenderSeq) return;

    const w = 1920;
    const h = 1080;
    enhancePreviewCanvas.width = w;
    enhancePreviewCanvas.height = h;

    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, w, h);
    }

    // Parse de Runs ([HL]...[/HL])
    const segments = [];
    const hlRegex = /\[HL\](.*?)\[\/HL\]/gi;
    let lastIdx = 0;
    let m;
    while ((m = hlRegex.exec(rawText)) !== null) {
      if (m.index > lastIdx) {
        segments.push({ text: rawText.substring(lastIdx, m.index), highlight: false });
      }
      segments.push({ text: m[1], highlight: true });
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < rawText.length) {
      segments.push({ text: rawText.substring(lastIdx), highlight: false });
    }
    if (segments.length === 0 && rawText.length > 0) {
      segments.push({ text: rawText, highlight: false });
    }

    const words = [];
    segments.forEach(seg => {
      const parts = seg.text.split(/(\s+)/);
      parts.forEach(p => {
        if (p.length > 0) {
          words.push({ text: p, isSpace: /^\s+$/.test(p), highlight: seg.highlight });
        }
      });
    });

    const totalChars = rawText.replace(/\[\/?HL\]/gi, '').length;

    const isCinzel = (enhanceBgTheme && enhanceBgTheme.value && (enhanceBgTheme.value.includes('cinzel') || enhanceBgTheme.value.includes('nobre'))) || currentSelectedFont === 'cinzel';

    // Proporção cinematográfica oficial 1080p fiel ao PowerPoint (96 DPI / Módulo 1)
    let baseFontSize = 84;
    if (isCinzel) {
      if (type === 'topic') {
        if (totalChars < 45) baseFontSize = 96;
        else if (totalChars > 90) baseFontSize = 72;
        else baseFontSize = 84;
      } else {
        if (totalChars <= 90) baseFontSize = 84;
        else if (totalChars <= 140) baseFontSize = 74;
        else if (totalChars <= 200) baseFontSize = 66;
        else baseFontSize = 60;
      }
    } else {
      if (type === 'topic') {
        if (totalChars < 40) baseFontSize = 108;
        else if (totalChars > 90) baseFontSize = 78;
        else baseFontSize = 92;
      } else {
        // Versículo bíblico oficial
        if (totalChars <= 80) baseFontSize = 92;
        else if (totalChars <= 140) baseFontSize = 82;
        else if (totalChars <= 200) baseFontSize = 72;
        else baseFontSize = 64;
      }
    }

    let fontSize = Math.max(34, Math.min(150, baseFontSize + enhanceManualFontSizeDelta));

    const activeFontCfg = isCinzel
      ? CHURCH_FONTS['cinzel']
      : ((typeof CHURCH_FONTS !== 'undefined' && CHURCH_FONTS[currentSelectedFont])
        ? CHURCH_FONTS[currentSelectedFont]
        : (typeof CHURCH_FONTS !== 'undefined' ? CHURCH_FONTS['bahnschrift_semibold_condensed'] : null));
    const fontCss = activeFontCfg ? activeFontCfg.cssFamily : '"Bahnschrift SemiBold Condensed", "Bahnschrift", "Roboto Condensed", "Arial Narrow", sans-serif';
    const fontWeight = (activeFontCfg && activeFontCfg.fontWeight) ? activeFontCfg.fontWeight : 'bold';
    ctx.font = `${fontWeight} ${fontSize}px ${fontCss}`;
    let lineHeight = fontSize * (isCinzel ? 1.28 : 1.25);

    // Margens simétricas oficiais (0.9" = 130px de cada lado em 1920x1080)
    const startX = 130;
    const maxWidth = 1660; // 1920 - (130 * 2)
    const topLimit = 160;
    const availableHeight = 650; // Área útil livre acima da referência (y=880)

    function buildLines(fSize) {
      ctx.font = `${fontWeight} ${fSize}px ${fontCss}`;
      const resLines = [];
      let curL = [];
      let curW = 0;
      for (let i = 0; i < words.length; i++) {
        const token = words[i];
        const tokenW = ctx.measureText(token.text).width;
        if (token.isSpace) {
          if (curL.length > 0) {
            curL.push(token);
            curW += tokenW;
          }
          continue;
        }
        if (curW + tokenW > maxWidth && curL.length > 0) {
          resLines.push({ items: curL, width: curW });
          curL = [token];
          curW = tokenW;
        } else {
          curL.push(token);
          curW += tokenW;
        }
      }
      if (curL.length > 0) {
        resLines.push({ items: curL, width: curW });
      }
      return resLines;
    }

    let lines = buildLines(fontSize);
    let totalTextHeight = lines.length * lineHeight;

    // Auto-fit inteligente de proteção: NUNCA deixa o texto ultrapassar a altura útil ou colidir com a referência
    while (totalTextHeight > availableHeight && fontSize > 38) {
      fontSize -= 2;
      lineHeight = fontSize * 1.25;
      lines = buildLines(fontSize);
      totalTextHeight = lines.length * lineHeight;
    }

    if (enhanceFontSizeDisplay) {
      if (enhanceManualFontSizeDelta === 0) {
        enhanceFontSizeDisplay.textContent = `${fontSize}px`;
        enhanceFontSizeDisplay.title = 'Tamanho automático padrão';
        enhanceFontSizeDisplay.style.color = '#E8B859';
      } else {
        const sign = enhanceManualFontSizeDelta > 0 ? `+${enhanceManualFontSizeDelta}` : `${enhanceManualFontSizeDelta}`;
        enhanceFontSizeDisplay.textContent = `${fontSize}px (${sign})`;
        enhanceFontSizeDisplay.title = `Tamanho manual ajustado: ${fontSize}px (${sign})`;
        enhanceFontSizeDisplay.style.color = '#48BB78';
      }
    }

    // Posição vertical: centralizado perfeitamente na área superior/média (valign: middle)
    const startY = topLimit + Math.max(0, (availableHeight - totalTextHeight) / 2);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    lines.forEach((lineObj, lineIdx) => {
      const lineY = startY + (lineIdx * lineHeight);
      let curX = startX;

      if (align === 'center') {
        let visualWidth = 0;
        lineObj.items.forEach(it => { visualWidth += ctx.measureText(it.text).width; });
        curX = Math.round((w - visualWidth) / 2);
      }

      lineObj.items.forEach(token => {
        const tokenW = ctx.measureText(token.text).width;
        if (!token.isSpace) {
          ctx.save();
          if (isCinzel) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = token.highlight ? '#E6C486' : '#E1D3C1';
          } else {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = token.highlight ? '#E8B859' : '#FFFFFF';
          }

          ctx.fillText(token.text, curX, lineY);
          ctx.restore();
        }
        curX += tokenW;
      });
    });

    // Referência Bíblica SEPARADA no Rodapé (y = 880px, fontSize: 52px, idêntico ao Slide Killer / PowerPoint)
    if (refText && type === 'verse') {
      ctx.save();
      const refY = isCinzel ? 860 : 880;
      const refFontSize = isCinzel ? 44 : 52;
      ctx.font = `${fontWeight} ${refFontSize}px ${fontCss}`;
      ctx.fillStyle = isCinzel ? '#E1D3C1' : '#E8B859';
      ctx.shadowColor = isCinzel ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = isCinzel ? 5 : 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.textBaseline = 'top';

      const displayRef = refText.toUpperCase();
      if (align === 'center' || isCinzel) {
        ctx.textAlign = 'center';
        ctx.fillText(displayRef, w / 2, refY);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(displayRef, startX, refY);
      }
      ctx.restore();
    }

    // Atualiza o preview visual do modal com o Canvas real (100% o que você vê é o que você terá!)
    try {
      const previewDataUrl = enhancePreviewCanvas.toDataURL('image/jpeg', 0.92);
      if (enhanceLivePreviewImg) {
        enhanceLivePreviewImg.src = previewDataUrl;
      }
    } catch (err) {
      console.warn('Erro ao atualizar imagem de preview do modal:', err);
    }
  }

  // Listeners de Redesenho em Tempo Real (com debounce em digitação para evitar lag/uso excessivo de CPU)
  if (enhanceTextInput) enhanceTextInput.addEventListener('input', scheduleEnhanceCanvasPreview);
  if (enhanceRefInput) enhanceRefInput.addEventListener('input', scheduleEnhanceCanvasPreview);
  if (enhanceSlideType) enhanceSlideType.addEventListener('change', renderEnhanceCanvasPreview);
  if (enhanceTextAlign) enhanceTextAlign.addEventListener('change', renderEnhanceCanvasPreview);
  if (enhanceBgTheme) {
    enhanceBgTheme.addEventListener('change', () => {
      if (enhanceThemeBadge) {
        if (enhanceBgTheme.value.includes('cinzel') || enhanceBgTheme.value.includes('nobre')) {
          enhanceThemeBadge.textContent = '🏛️ Fundo Nobre (16:9)';
          if (enhanceTextAlign) enhanceTextAlign.value = 'center';
        } else if (enhanceBgTheme.value.includes('ts_theme_bg')) {
          enhanceThemeBadge.textContent = '✨ Fundo TS (16:9)';
        } else {
          enhanceThemeBadge.textContent = '📖 Fundo Bíblia (16:9)';
        }
      }
      renderEnhanceCanvasPreview();
    });
  }

  // Botões de Tamanho estilo PowerPoint (A▲ / A▼ / ↺)
  if (btnEnhanceFontMinus) {
    btnEnhanceFontMinus.addEventListener('click', () => {
      enhanceManualFontSizeDelta = Math.max(-48, enhanceManualFontSizeDelta - 4);
      renderEnhanceCanvasPreview();
    });
  }

  if (btnEnhanceFontPlus) {
    btnEnhanceFontPlus.addEventListener('click', () => {
      enhanceManualFontSizeDelta = Math.min(60, enhanceManualFontSizeDelta + 4);
      renderEnhanceCanvasPreview();
    });
  }

  if (btnEnhanceFontReset) {
    btnEnhanceFontReset.addEventListener('click', () => {
      enhanceManualFontSizeDelta = 0;
      renderEnhanceCanvasPreview();
    });
  }

  // Botões de Formatação Rápida do Texto
  if (btnEnhanceHighlight) {
    btnEnhanceHighlight.addEventListener('click', () => {
      if (!enhanceTextInput) return;
      const start = enhanceTextInput.selectionStart;
      const end = enhanceTextInput.selectionEnd;
      const val = enhanceTextInput.value;
      if (start !== end) {
        const selected = val.substring(start, end).replace(/\[\/?HL\]/gi, '');
        const replacement = `[HL]${selected}[/HL]`;
        enhanceTextInput.value = val.substring(0, start) + replacement + val.substring(end);
        enhanceTextInput.selectionStart = start;
        enhanceTextInput.selectionEnd = start + replacement.length;
      } else {
        showToast('Selecione uma palavra ou trecho para destacar em dourado.', 'info');
      }
      enhanceTextInput.focus();
      renderEnhanceCanvasPreview();
    });
  }

  if (btnEnhanceQuotes) {
    btnEnhanceQuotes.addEventListener('click', () => {
      if (!enhanceTextInput) return;
      let val = enhanceTextInput.value.trim();
      if ((val.startsWith('“') && val.endsWith('”')) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.replace(/^[“”"]|[“”"]$/g, '').trim();
      } else {
        val = `“${val}”`;
      }
      enhanceTextInput.value = val;
      enhanceTextInput.focus();
      renderEnhanceCanvasPreview();
    });
  }

  if (btnEnhanceClearTags) {
    btnEnhanceClearTags.addEventListener('click', () => {
      if (!enhanceTextInput) return;
      enhanceTextInput.value = enhanceTextInput.value.replace(/\[\/?HL\]/gi, '');
      enhanceTextInput.focus();
      renderEnhanceCanvasPreview();
    });
  }

  // Buscar Versículo Oficial na API Bíblica Pública
  if (btnEnhanceFetchVerse) {
    btnEnhanceFetchVerse.addEventListener('click', async () => {
      if (!enhanceRefInput) return;
      const rawQuery = enhanceRefInput.value.trim();
      const query = rawQuery.replace(/\s*\([^)]+\)\s*$/, '').trim();
      if (!query) {
        showToast('Digite a referência do versículo (ex: Lucas 6:24, João 3:16).', 'error');
        return;
      }

      btnEnhanceFetchVerse.disabled = true;
      btnEnhanceFetchVerse.innerHTML = '⏳...';

      let timeoutId = null;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000);
        const cleanQuery = query.replace(/\s+/g, '+').replace(/salmo\b/i, 'salmos').replace(/cântico\b/i, 'cantares');
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(cleanQuery)}?translation=almeida`, {
          signal: controller.signal
        });
        if (res.ok) {
          const d = await res.json();
          if (d && d.text) {
            let found = d.text.replace(/\s+/g, ' ').trim();
            if (!found.startsWith('“') && !found.startsWith('"')) found = `“${found}”`;
            if (enhanceTextInput) enhanceTextInput.value = found;
            if (d.reference) enhanceRefInput.value = `${d.reference} (Almeida)`;
            renderEnhanceCanvasPreview();
            showToast('Texto bíblico atualizado!', 'success');
          } else {
            showToast('Passagem não localizada automaticamente.', 'warning');
          }
        } else {
          showToast('Passagem não localizada automaticamente.', 'warning');
        }
      } catch (e) {
        showToast('Erro ao consultar versículo online.', 'warning');
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        btnEnhanceFetchVerse.disabled = false;
        btnEnhanceFetchVerse.innerHTML = '🔍 Buscar';
      }
    });
  }

  if (btnEnhanceReanalyze) {
    btnEnhanceReanalyze.addEventListener('click', () => {
      if (activeEnhanceTarget && activeEnhanceTarget.slide) {
        analyzeSlideWithAi(activeEnhanceTarget.slide);
      }
    });
  }

  // Confirmação: Substituir Slide Atual
  if (btnEnhanceApplyReplace) {
    btnEnhanceApplyReplace.addEventListener('click', async () => {
      if (!activeEnhanceTarget || !enhancePreviewCanvas) return;

      btnEnhanceApplyReplace.disabled = true;
      btnEnhanceApplyReplace.innerHTML = '⏳ Atualizando slide...';

      try {
        // 1. Garante renderização no canvas Full HD e aguarda conclusão
        await renderEnhanceCanvasPreview();

        // 2. Extrai dataURL em alta resolução
        const newImgData = enhancePreviewCanvas.toDataURL('image/jpeg', 0.95);
        if (!newImgData || newImgData === 'data:,') {
          throw new Error('Falha ao gerar imagem do canvas.');
        }

        const newTitle = enhanceRefInput && enhanceRefInput.value.trim() ? enhanceRefInput.value.trim() : 'Slide Bíblico';
        const targetIndex = activeEnhanceTarget.index;
        const orgType = activeEnhanceTarget.organizerType;

        // 3. Atualiza o objeto de slide por referência
        if (activeEnhanceTarget.slide) {
          activeEnhanceTarget.slide.imgData = newImgData;
          activeEnhanceTarget.slide.dataUrl = newImgData;
          activeEnhanceTarget.slide.title = newTitle;
          activeEnhanceTarget.slide.name = newTitle;
          activeEnhanceTarget.slide.ratio = 16 / 9;
          activeEnhanceTarget.slide.width = 1920;
          activeEnhanceTarget.slide.height = 1080;
          activeEnhanceTarget.slide.type = 'enhanced';
          activeEnhanceTarget.slide.enhanced = true;
        }

        // 4. Atualiza no array específico do organizador, invalida cache PPTX e redesenha a tela
        if (orgType === 'direct') {
          if (directSlides[targetIndex]) {
            Object.assign(directSlides[targetIndex], {
              imgData: newImgData,
              dataUrl: newImgData,
              title: newTitle,
              type: 'enhanced',
              ratio: 16 / 9,
              width: 1920,
              height: 1080,
              enhanced: true
            });
          }
          directGeneratedPptx = null;
          renderDirectOrganizer();
        } else {
          if (imageSlides[targetIndex]) {
            Object.assign(imageSlides[targetIndex], {
              imgData: newImgData,
              dataUrl: newImgData,
              name: newTitle,
              type: 'enhanced',
              ratio: 16 / 9,
              width: 1920,
              height: 1080,
              enhanced: true
            });
          }
          imagesGeneratedPptx = null;
          renderImagesOrganizer();
        }

        // 5. Atualização visual instantânea direta no card do DOM
        const gridSelector = orgType === 'direct' ? '#direct-slides-grid' : '#images-reorder-grid';
        const cardImg = document.querySelector(`${gridSelector} [data-index="${targetIndex}"] img`);
        if (cardImg) {
          cardImg.src = newImgData;
        }

        const idxNum = targetIndex + 1;
        closeEnhanceModal();
        showToast(`✨ Slide #${idxNum} atualizado com sucesso no organizador!`, 'success');
      } catch (err) {
        console.error('Erro ao substituir slide:', err);
        showToast('Erro ao atualizar slide: ' + err.message, 'error');
      } finally {
        btnEnhanceApplyReplace.disabled = false;
        btnEnhanceApplyReplace.innerHTML = '✨ Substituir Slide Atual';
      }
    });
  }

  // Confirmação: Inserir como Novo Slide na sequência
  if (btnEnhanceInsertAsNew) {
    btnEnhanceInsertAsNew.addEventListener('click', async () => {
      if (!activeEnhanceTarget || !enhancePreviewCanvas) return;

      btnEnhanceInsertAsNew.disabled = true;
      btnEnhanceInsertAsNew.innerHTML = '⏳ Inserindo...';

      try {
        await renderEnhanceCanvasPreview();
        const newImgData = enhancePreviewCanvas.toDataURL('image/jpeg', 0.95);
        if (!newImgData || newImgData === 'data:,') {
          throw new Error('Falha ao gerar imagem do canvas.');
        }
        const newTitle = enhanceRefInput && enhanceRefInput.value.trim() ? enhanceRefInput.value.trim() : 'Slide Bíblico';

        const newSlide = {
          id: 'slide_enh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          imgData: newImgData,
          dataUrl: newImgData,
          title: newTitle,
          name: newTitle,
          type: 'enhanced',
          ratio: 16 / 9,
          width: 1920,
          height: 1080,
          enhanced: true
        };

        if (activeEnhanceTarget.organizerType === 'direct') {
          directSlides.splice(activeEnhanceTarget.index + 1, 0, newSlide);
          directGeneratedPptx = null;
          renderDirectOrganizer();
        } else {
          imageSlides.splice(activeEnhanceTarget.index + 1, 0, newSlide);
          imagesGeneratedPptx = null;
          renderImagesOrganizer();
        }

        closeEnhanceModal();
        showToast('✨ Novo slide oficial inserido na sequência!', 'success');
      } catch (err) {
        console.error('Erro ao inserir slide:', err);
        showToast('Erro ao inserir slide: ' + err.message, 'error');
      } finally {
        btnEnhanceInsertAsNew.disabled = false;
        btnEnhanceInsertAsNew.innerHTML = '➕ Inserir como Novo';
      }
    });
  }

});
