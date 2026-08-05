/* ============================================================
   Wallpaper App — Search Module
   ============================================================
   Handles search input, debounced queries, Enter-key support,
   and recent search management.
   ============================================================ */

'use strict';

const Search = (() => {
  let searchInput = null;
  let searchGrid = null;
  let currentAbortController = null;
  let isLoading = false;

  /**
   * Renders the search screen shell if not already rendered.
   */
  function renderScreen() {
    const screenEl = document.getElementById('screen-search');
    if (!screenEl) return;
    
    // Check if already rendered
    if (screenEl.innerHTML.trim() === '') {
      screenEl.innerHTML = `
        <div class="search-screen">
          <header class="app-header">
            <h1 class="app-header__title" style="text-align: left;">Search</h1>
          </header>
          
          <section class="search-bar">
            <div class="search-bar__inner">
              <div class="search-bar__input-wrapper">
                <input type="search" id="dedicated-search-input" class="search-bar__input" placeholder="Search wallpapers..." autocomplete="off" />
              </div>
              <button class="search-bar__btn" id="dedicated-search-btn" aria-label="Search">
                <svg class="icon--md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" /></svg>
              </button>
            </div>
          </section>
          
          <main>
            <div id="search-grid-container" class="wallpaper-grid"></div>
          </main>
        </div>
      `;

      searchInput = document.getElementById('dedicated-search-input');
      const searchBtn = document.getElementById('dedicated-search-btn');
      searchGrid = document.getElementById('search-grid-container');

      // Bind events
      searchInput.addEventListener('input', (e) => {
        _debouncedSearch(e.target.value);
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          _executeSearch(searchInput.value);
        }
      });
      searchBtn.addEventListener('click', () => {
        _executeSearch(searchInput.value);
      });
    }

    // Focus input if empty
    if (searchInput && searchInput.value.trim() === '') {
      searchInput.focus();
    }
  }

  /**
   * Executes a search query and renders results.
   * @param {string} query
   */
  async function _executeSearch(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      if (searchGrid) searchGrid.innerHTML = '';
      return;
    }

    Storage.addRecentSearch(trimmed);
    
    if (!searchGrid) return;

    if (isLoading) {
      if (currentAbortController) currentAbortController.abort();
    }
    
    isLoading = true;
    currentAbortController = new AbortController();
    
    // Show simple loading
    searchGrid.innerHTML = '<div style="text-align: center; color: var(--color-text-secondary); grid-column: 1 / -1; padding: 2rem 0;">Searching...</div>';
    
    try {
      const result = await API.searchWallpapers(trimmed, { 
        page: 1, 
        perPage: 30,
        signal: currentAbortController.signal 
      });
      
      searchGrid.innerHTML = '';
      
      if (result.wallpapers.length === 0) {
        searchGrid.innerHTML = '<div style="text-align: center; color: var(--color-text-secondary); grid-column: 1 / -1; padding: 2rem 0;">No results found.</div>';
        isLoading = false;
        return;
      }
      
      const fragment = document.createDocumentFragment();
      result.wallpapers.forEach(wallpaper => {
        const card = UI.createWallpaperCard(wallpaper);
        
        const img = card.querySelector('.wallpaper-card__image');
        if (img) {
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => UI.openPreview(wallpaper));
        }

        const favBtn = card.querySelector('.wallpaper-card__favorite-btn');
        if (favBtn) {
          favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (Storage.isFavorite(wallpaper.id)) {
              Storage.removeFavorite(wallpaper.id);
              favBtn.classList.remove('wallpaper-card__favorite-btn--active');
            } else {
              Storage.addFavorite(wallpaper);
              favBtn.classList.add('wallpaper-card__favorite-btn--active');
            }
          });
        }

        const dlBtn = card.querySelector('.wallpaper-card__download-btn');
        if (dlBtn) {
          dlBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Downloads.startDownload(wallpaper);
          });
        }
        
        fragment.appendChild(card);
      });
      
      searchGrid.appendChild(fragment);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      searchGrid.innerHTML = '<div style="text-align: center; color: var(--color-error); grid-column: 1 / -1; padding: 2rem 0;">Error loading results.</div>';
    } finally {
      isLoading = false;
    }
  }

  /**
   * Debounced search handler for real-time input.
   */
  const _debouncedSearch = debounce((query) => {
    _executeSearch(query);
  }, 500);

  /**
   * Initializes module.
   */
  function init() {
    // Initialization done lazily in renderScreen
  }

  /**
   * Clears the search input field.
   */
  function clear() {
    if (searchInput) searchInput.value = '';
    if (searchGrid) searchGrid.innerHTML = '';
  }

  /* --- Public API ----------------------------------------- */
  return {
    init,
    clear,
    renderScreen,
  };
})();
