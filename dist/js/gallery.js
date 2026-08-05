/* ============================================================
   Wallpaper App — Gallery Module
   ============================================================
   Manages the wallpaper grid: rendering cards, infinite
   scrolling, and category/search result loading.
   ============================================================ */

'use strict';

const Gallery = (() => {
  /* --- State ---------------------------------------------- */
  let currentQuery = 'Nature';
  let currentFilters = {};
  let currentPage = 1;
  let totalPages = 1;
  let isLoading = false;
  let currentAbortController = null;

  /* --- DOM References ------------------------------------- */
  const galleryEl = document.getElementById('gallery');

  /* --- Render Wallpapers ---------------------------------- */

  /**
   * Renders an array of wallpaper objects into the gallery grid.
   * @param {Object[]} wallpapers
   * @param {boolean} [append=false] - If true, append to existing cards.
   */
  function render(wallpapers, append = false) {
    if (!galleryEl) return;

    if (!append) {
      galleryEl.innerHTML = '';
    }

    const fragment = document.createDocumentFragment();

    wallpapers.forEach((wallpaper) => {
      const card = UI.createWallpaperCard(wallpaper);

      // --- Card event listeners ---

      // Click card image → open preview (future: modal)
      const img = card.querySelector('.wallpaper-card__image');
      if (img) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          UI.openPreview(wallpaper);
        });
      }

      // Favorite button
      const favBtn = card.querySelector('.wallpaper-card__favorite-btn');
      if (favBtn) {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isFav = Storage.isFavorite(wallpaper.id);
          if (isFav) {
            Storage.removeFavorite(wallpaper.id);
            favBtn.classList.remove('wallpaper-card__favorite-btn--active');
            favBtn.setAttribute('aria-label', 'Add to favorites');
            UI.showToast('Removed from favorites');
          } else {
            Storage.addFavorite(wallpaper);
            favBtn.classList.add('wallpaper-card__favorite-btn--active');
            favBtn.setAttribute('aria-label', 'Remove from favorites');
            UI.showToast('Added to favorites');
          }
        });
      }

      // Download button
      const dlBtn = card.querySelector('.wallpaper-card__download-btn');
      if (dlBtn) {
        dlBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          Downloads.startDownload(wallpaper);
        });
      }

      fragment.appendChild(card);
    });

    galleryEl.appendChild(fragment);
  }

  /* --- Load Wallpapers ------------------------------------ */
  
  function loadWithFilters(filters) {
    load(filters.query, filters);
  }

  /**
   * Loads wallpapers for a query, replacing the current grid.
   * @param {string} query
   * @param {Object} filters
   */
  async function load(query, filters = {}) {
    if (isLoading) {
      // Cancel previous request
      if (currentAbortController) currentAbortController.abort();
    }

    currentQuery = query || 'Nature';
    currentFilters = filters;
    currentPage = 1;
    isLoading = true;

    currentAbortController = new AbortController();
    UI.showSkeletons(6);

    try {
      const apiOptions = {
        page: currentPage,
        signal: currentAbortController.signal,
      };
      if (filters.orientation) apiOptions.orientation = filters.orientation;
      if (filters.sortBy) apiOptions.orderBy = filters.sortBy;

      const result = await API.searchWallpapers(currentQuery, apiOptions);

      totalPages = result.totalPages;
      
      let wallpapersToRender = result.wallpapers;
      if (filters.resolution) {
        wallpapersToRender = wallpapersToRender.filter(w => {
          const maxDim = Math.max(w.width, w.height);
          if (filters.resolution === '4k') return maxDim >= 3840;
          if (filters.resolution === 'hd') return maxDim >= 1920;
          return true;
        });
      }
      
      render(wallpapersToRender, false);

      if (wallpapersToRender.length === 0) {
        galleryEl.innerHTML = `
          <div class="empty-state">
            <svg class="empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 class="empty-state__title">No Results Found</h2>
            <p class="empty-state__description">Try adjusting your search or filters.</p>
          </div>
        `;
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // Cancelled, ignore
      console.error('[Gallery] Load error:', err);
      if (!navigator.onLine) {
        galleryEl.innerHTML = `<div class="empty-state">
          <svg class="empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" /></svg>
          <h2 class="empty-state__title">You are offline</h2>
          <p class="empty-state__description">Check your internet connection and try again.</p>
        </div>`;
      } else {
        galleryEl.innerHTML = `
          <div class="empty-state">
            <svg class="empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 class="empty-state__title">Something went wrong</h2>
            <p class="empty-state__description">Failed to load wallpapers. Please try again.</p>
          </div>
        `;
        UI.showToast(err.message || 'Failed to load wallpapers');
      }
    }

    isLoading = false;
    UI.hideLoading();
  }

  /**
   * Loads the next page of results (infinite scroll).
   */
  async function loadMore() {
    if (isLoading || currentPage >= totalPages) return;

    currentPage++;
    isLoading = true;

    try {
      const apiOptions = {
        page: currentPage,
      };
      if (currentFilters.orientation) apiOptions.orientation = currentFilters.orientation;
      if (currentFilters.sortBy) apiOptions.orderBy = currentFilters.sortBy;

      const result = await API.searchWallpapers(currentQuery, apiOptions);
      
      let wallpapersToRender = result.wallpapers;
      if (currentFilters.resolution) {
        wallpapersToRender = wallpapersToRender.filter(w => {
          const maxDim = Math.max(w.width, w.height);
          if (currentFilters.resolution === '4k') return maxDim >= 3840;
          if (currentFilters.resolution === 'hd') return maxDim >= 1920;
          return true;
        });
      }

      render(wallpapersToRender, true);
    } catch (err) {
      console.error('[Gallery] Load more error:', err);
      currentPage--; // Revert so user can retry
      UI.showToast('Failed to load more wallpapers');
    } finally {
      isLoading = false;
    }
  }

  /* --- Infinite Scroll ------------------------------------ */

  function _initInfiniteScroll() {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: '600px' }
    );

    // Observe a sentinel element at the bottom of the gallery
    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    if (galleryEl && galleryEl.parentNode) {
      galleryEl.parentNode.appendChild(sentinel);
      observer.observe(sentinel);
    }
  }

  /* --- Getters -------------------------------------------- */

  function getCurrentQuery() {
    return currentQuery;
  }

  function getIsLoading() {
    return isLoading;
  }

  /* --- Initialize ----------------------------------------- */

  function init() {
    _initInfiniteScroll();
  }

  /* --- Public API ----------------------------------------- */
  return {
    init,
    load,
    loadWithFilters,
    loadMore,
    render,
    getCurrentQuery,
    getIsLoading,
  };
})();
