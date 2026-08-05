/* ============================================================
   Wallpaper App — UI Rendering Module
   ============================================================
   Responsible for rendering reusable UI components to the DOM:
   category pills, wallpaper cards, loading skeletons,
   empty states, toast notifications, and preview modal.
   ============================================================ */

'use strict';

const UI = (() => {
  /* --- SVG Icon Templates --------------------------------- */
  const ICONS = {
    heart: `<svg class="icon--sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    </svg>`,
    download: `<svg class="icon--sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    </svg>`,
    globe: `<svg class="icon--sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    </svg>`,
    lock: `<svg class="icon--sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 10-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    </svg>`
  };

  /* --- Category Pill -------------------------------------- */

  /**
   * Creates a category pill button element.
   * @param {Object} category - { name, icon? }
   * @param {boolean} isActive
   * @returns {HTMLLIElement}
   */
  function createCategoryPill(category, isActive = false) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = `category-pill${isActive ? ' category-pill--active' : ''}`;
    btn.setAttribute('data-category', category.name);
    btn.setAttribute('aria-label', `Category: ${category.name}`);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(isActive));
    btn.addEventListener('click', hapticImpact);

    // Icon (optional)
    if (category.icon) {
      const iconSpan = document.createElement('span');
      iconSpan.innerHTML = category.icon;
      iconSpan.setAttribute('aria-hidden', 'true');
      btn.appendChild(iconSpan);
    }

    // Label text
    const label = document.createTextNode(category.name);
    btn.appendChild(label);

    li.appendChild(btn);
    return li;
  }

  /* --- Wallpaper Card ------------------------------------- */

  /**
   * Creates a wallpaper card element.
   * @param {Object} wallpaper - { id, url, title, resolution, downloadLocation, photographer, photographerUrl }
   * @returns {HTMLDivElement}
   */
  function createWallpaperCard(wallpaper) {
    const card = document.createElement('article');
    card.__wallpaperData = wallpaper;
    card.className = 'wallpaper-card';
    card.setAttribute('data-id', wallpaper.id);
    card.setAttribute('role', 'figure');
    card.setAttribute('aria-label', wallpaper.title);

    // Image
    const img = document.createElement('img');
    img.className = 'wallpaper-card__image';
    img.src = wallpaper.url;
    img.alt = wallpaper.title;
    img.loading = 'lazy';
    img.decoding = 'async';

    // Fade-in when image loads
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });

    // Handle cached images that fire 'load' before listener attaches
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    }

    // Handle broken images
    img.addEventListener('error', () => {
      img.src = '';
      img.alt = 'Image failed to load';
      img.classList.add('loaded'); // Remove skeleton state
      card.style.backgroundColor = 'var(--color-bg-secondary)';
    });

    // Gradient overlay
    const overlay = document.createElement('div');
    overlay.className = 'wallpaper-card__overlay';
    overlay.setAttribute('aria-hidden', 'true');

    // Favorite button
    const isFav = Storage.isFavorite(wallpaper.id);
    const favBtn = document.createElement('button');
    favBtn.className = `wallpaper-card__favorite-btn${isFav ? ' wallpaper-card__favorite-btn--active' : ''}`;
    favBtn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
    favBtn.innerHTML = ICONS.heart;
    favBtn.addEventListener('click', hapticImpact);

    // Resolution badge
    const resBadge = document.createElement('div');
    resBadge.className = 'wallpaper-card__resolution';
    const resText = document.createElement('span');
    resText.className = 'wallpaper-card__resolution-text';
    resText.textContent = wallpaper.resolution || '4K';
    resBadge.appendChild(resText);

    // Download button
    const dlBtn = document.createElement('button');
    dlBtn.className = 'wallpaper-card__download-btn';
    dlBtn.setAttribute('aria-label', `Download ${wallpaper.title}`);
    dlBtn.innerHTML = ICONS.download;
    dlBtn.addEventListener('click', hapticImpact);

    // Assemble
    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(favBtn);
    card.appendChild(resBadge);
    card.appendChild(dlBtn);

    return card;
  }

  /* --- Skeleton Card -------------------------------------- */

  /**
   * Creates a skeleton loading placeholder card.
   * @returns {HTMLDivElement}
   */
  function createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'wallpaper-card skeleton';
    card.setAttribute('aria-hidden', 'true');
    card.style.aspectRatio = '3 / 5';
    return card;
  }

  /* --- Haptic Feedback ------------------------------------ */

  /**
   * Triggers a subtle haptic feedback for button taps.
   * Prepared for future Capacitor Haptics plugin.
   */
  function hapticImpact() {
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  }

  /* --- Toast Notification --------------------------------- */

  let toastTimer = null;

  /**
   * Shows a toast notification.
   * @param {string} message
   * @param {number} [duration=3000] - Display duration in ms.
   */
  function showToast(message, duration = 3000) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('toast--visible');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('toast--visible');
    }, duration);
  }

  /* --- Show/Hide Loading ---------------------------------- */

  function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.classList.remove('hidden');
  }

  function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.classList.add('hidden');
  }

  /**
   * Renders skeleton cards in the gallery while loading.
   * @param {number} [count=6]
   */
  function showSkeletons(count = 6) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    gallery.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      fragment.appendChild(createSkeletonCard());
    }
    gallery.appendChild(fragment);
  }

  /* --- Preview Modal -------------------------------------- */

  /* --- Preview Zoom State --------------------------------- */
  let currentPreviewCard = null;
  let currentScale = 1;
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let initialDistance = 0;
  let isPanning = false;
  let isSwiping = false;
  let lastTapTime = 0;
  const MIN_SCALE = 1;
  const MAX_SCALE = 5;

  function navigatePreview(direction) {
    if (!currentPreviewCard) return;
    
    let sibling = direction === 'next' ? currentPreviewCard.nextElementSibling : currentPreviewCard.previousElementSibling;
    
    // Skip non-wallpaper-card elements
    while (sibling && !sibling.classList.contains('wallpaper-card')) {
      sibling = direction === 'next' ? sibling.nextElementSibling : sibling.previousElementSibling;
    }
    
    if (sibling && sibling.__wallpaperData) {
      openPreview(sibling.__wallpaperData);
    } else {
      // Snap back if no sibling
      resetZoom();
    }
  }

  function resetZoom() {
    currentScale = 1;
    currentX = 0;
    currentY = 0;
    const img = document.getElementById('preview-image');
    if (img) {
      img.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
      img.style.transform = `translate(0px, 0px) scale(1)`;
    }
  }

  function initZoomGestures() {
    const img = document.getElementById('preview-image');
    if (!img) return;

    img.draggable = false;
    let isScaling = false;

    function getDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function clampPan() {
      const container = img.parentElement;
      const maxX = (container.clientWidth * currentScale - container.clientWidth) / 2;
      const maxY = (container.clientHeight * currentScale - container.clientHeight) / 2;
      
      currentX = Math.max(-maxX, Math.min(maxX, currentX));
      currentY = Math.max(-maxY, Math.min(maxY, currentY));
    }

    function updateTransform(useTransition = false) {
      if (useTransition) {
        img.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
      } else {
        img.style.transition = 'none';
      }
      
      requestAnimationFrame(() => {
        img.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
      });
    }

    img.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isScaling = true;
        isPanning = false;
        isSwiping = false;
        initialDistance = getDistance(e.touches);
      } else if (e.touches.length === 1) {
        if (currentScale > 1) {
          isPanning = true;
          isSwiping = false;
          startX = e.touches[0].clientX - currentX;
          startY = e.touches[0].clientY - currentY;
        } else {
          isSwiping = true;
          isPanning = false;
          startX = e.touches[0].clientX - currentX;
        }
      }
    }, { passive: false });

    img.addEventListener('touchmove', (e) => {
      if (isScaling && e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scaleChange = currentDistance / initialDistance;
        let newScale = currentScale * scaleChange;
        currentScale = Math.max(0.5, Math.min(newScale, MAX_SCALE + 1));
        initialDistance = currentDistance;
        updateTransform(false);
      } else if (isPanning && e.touches.length === 1) {
        e.preventDefault();
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
        updateTransform(false);
      } else if (isSwiping && e.touches.length === 1) {
        e.preventDefault();
        currentX = e.touches[0].clientX - startX;
        updateTransform(false);
      }
    }, { passive: false });

    img.addEventListener('touchend', (e) => {
      let wasSwiping = isSwiping;
      const finalX = currentX;

      isScaling = false;
      isPanning = false;
      isSwiping = false;

      if (wasSwiping) {
        const threshold = 50;
        if (finalX < -threshold) {
          navigatePreview('next');
          return;
        } else if (finalX > threshold) {
          navigatePreview('prev');
          return;
        }
      }

      if (currentScale < MIN_SCALE) {
        currentScale = MIN_SCALE;
        currentX = 0;
        currentY = 0;
      } else if (currentScale > MAX_SCALE) {
        currentScale = MAX_SCALE;
      }
      
      if (currentScale === MIN_SCALE) {
        currentX = 0;
        currentY = 0;
      } else {
        clampPan();
      }
      
      updateTransform(true);

      if (e.changedTouches.length === 1) {
        if (wasSwiping && Math.abs(finalX) > 10) return;

        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        
        if (tapLength < 300 && tapLength > 0) {
          if (currentScale > 1) {
            resetZoom();
          } else {
            currentScale = 2.5;
            updateTransform(true);
          }
          e.preventDefault();
        }
        lastTapTime = currentTime;
      }
    });
    
    img.addEventListener('dblclick', () => {
      if (currentScale > 1) {
        resetZoom();
      } else {
        currentScale = 2.5;
        updateTransform(true);
      }
    });
  }

  /**
   * Initializes preview modal event listeners.
   * Called once during app boot — binds close button,
   * overlay click, and modal background click.
   */
  function initPreview() {
    const modal = document.getElementById('preview-modal');
    const closeBtn = document.getElementById('preview-close-btn');
    const overlay = document.getElementById('preview-overlay');

    if (closeBtn) closeBtn.addEventListener('click', closePreview);
    if (overlay) overlay.addEventListener('click', closePreview);
    if (modal) {
      modal.addEventListener('click', (e) => {
        // Close if clicking the modal backdrop (not its children)
        if (e.target === modal) closePreview();
      });
    }

    initZoomGestures();
  }

  /**
   * Opens the preview modal for a wallpaper.
   * Populates the modal with wallpaper data, wires
   * favorite/download handlers, and locks body scroll.
   * @param {Object} wallpaper - Normalized wallpaper object.
   */
  function openPreview(wallpaper) {
    const modal = document.getElementById('preview-modal');
    if (!modal) return;

    currentPreviewCard = document.querySelector(`.screen:not(.hidden) .wallpaper-card[data-id="${wallpaper.id}"]`);

    const img = document.getElementById('preview-image');
    const title = document.getElementById('preview-title');
    const author = document.getElementById('preview-author-name');
    const res = document.getElementById('preview-resolution');
    const favBtn = document.getElementById('preview-favorite-btn');
    const dlBtn = document.getElementById('preview-download-btn');
    const loading = document.getElementById('preview-loading');

    // Populate data
    title.textContent = wallpaper.title;
    author.textContent = wallpaper.photographer;
    if (wallpaper.photographerUrl && /^https?:\/\//i.test(wallpaper.photographerUrl)) {
      author.href = wallpaper.photographerUrl;
    } else {
      author.removeAttribute('href');
    }
    res.textContent = wallpaper.resolution;

    // Extra details section removed per Phase 5.4.1

    // Reset image and show loading
    img.classList.remove('loaded');
    img.src = '';
    if (loading) loading.classList.remove('hidden');
    resetZoom();

    // Load full image — use addEventListener to prevent leaks
    const onLoad = () => {
      // Prevent stale events if user swiped quickly
      if (img.src !== wallpaper.fullUrl) return;
      if (loading) loading.classList.add('hidden');
      img.classList.add('loaded');
      img.removeEventListener('load', onLoad);
    };
    img.addEventListener('load', onLoad);
    img.src = wallpaper.fullUrl;

    // Silently preload next image for smoother swiping
    let nextCard = currentPreviewCard?.nextElementSibling;
    while (nextCard && !nextCard.classList.contains('wallpaper-card')) {
      nextCard = nextCard.nextElementSibling;
    }
    if (nextCard && nextCard.__wallpaperData) {
      const preloadImg = new Image();
      preloadImg.src = nextCard.__wallpaperData.fullUrl;
    }

    // Favorite button state
    const isFav = Storage.isFavorite(wallpaper.id);
    favBtn.classList.toggle('active', isFav);

    // Favorite click handler — use onclick to replace any previous handler
    favBtn.onclick = () => {
      const currentlyFav = Storage.isFavorite(wallpaper.id);
      if (currentlyFav) {
        Storage.removeFavorite(wallpaper.id);
        favBtn.classList.remove('active');
        showToast('Removed from favorites');
      } else {
        Storage.addFavorite(wallpaper);
        favBtn.classList.add('active');
        showToast('Added to favorites');
      }
    };

    // Download click handler
    dlBtn.onclick = () => {
      Downloads.startDownload(wallpaper);
    };

    // Show modal and lock scroll
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Fetch related wallpapers
    const relatedContainer = document.getElementById('preview-related-container');
    const relatedScroll = document.getElementById('preview-related');
    
    if (relatedContainer && relatedScroll) {
      relatedContainer.classList.remove('hidden');
      relatedScroll.innerHTML = '';
      
      // Add skeletons
      for (let i = 0; i < 4; i++) {
        const skeleton = createSkeletonCard();
        skeleton.style.flex = '0 0 120px';
        skeleton.style.height = '180px';
        relatedScroll.appendChild(skeleton);
      }
      
      API.getRelatedWallpapers(wallpaper, 8).then(relatedWallpapers => {
        // Double check if modal is still open and showing the same wallpaper
        if (currentPreviewCard && currentPreviewCard.__wallpaperData && currentPreviewCard.__wallpaperData.id !== wallpaper.id) return;
        
        relatedScroll.innerHTML = '';
        if (relatedWallpapers.length === 0) {
          relatedScroll.innerHTML = '<p style="color: var(--color-text-muted); font-size: var(--font-size-sm); padding: var(--space-2) 0;">No related wallpapers found.</p>';
        } else {
          relatedWallpapers.forEach(rw => {
            const card = createWallpaperCard(rw);
            const imgEl = card.querySelector('.wallpaper-card__image');
            if (imgEl) {
              imgEl.style.cursor = 'pointer';
              imgEl.addEventListener('click', () => {
                const modalContent = document.querySelector('.modal__content');
                if (modalContent) modalContent.scrollTop = 0;
                openPreview(rw);
              });
            }
            relatedScroll.appendChild(card);
          });
        }
      });
    }
  }

  /**
   * Closes the preview modal and restores body scroll.
   * Safe to call even if the modal is already closed.
   */
  function closePreview() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    // Always restore scroll — safety guard against stuck overflow
    document.body.style.overflow = '';
    resetZoom();
  }

  /* --- Public API ----------------------------------------- */
  return {
    createCategoryPill,
    createWallpaperCard,
    createSkeletonCard,
    showToast,
    showLoading,
    hideLoading,
    showSkeletons,
    initPreview,
    openPreview,
    closePreview,
    hapticImpact,
    ICONS,
  };
})();
