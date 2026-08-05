/* ============================================================
   Wallpaper App — Favorites Module
   ============================================================
   Manages the Favorites screen: displaying saved wallpapers,
   toggling favorites, and rendering empty states.
   ============================================================ */

'use strict';

const Favorites = (() => {
  /**
   * Toggles a wallpaper's favorite status.
   * @param {Object} wallpaper - Wallpaper object.
   * @returns {boolean} true if now favorited, false if removed.
   */
  function toggle(wallpaper) {
    if (Storage.isFavorite(wallpaper.id)) {
      Storage.removeFavorite(wallpaper.id);
      return false;
    } else {
      Storage.addFavorite(wallpaper);
      return true;
    }
  }

  /**
   * Returns all favorited wallpapers.
   * @returns {Object[]}
   */
  function getAll() {
    return Storage.getFavorites();
  }

  /**
   * Clears all favorites.
   */
  function clearAll() {
    Storage.clearFavorites();
    UI.showToast('All favorites cleared');
  }

  /**
   * Checks if a wallpaper is favorited.
   * @param {string} id
   * @returns {boolean}
   */
  function isFavorite(id) {
    return Storage.isFavorite(id);
  }

  /**
   * Renders the favorites screen.
   */
  function renderScreen() {
    const screenEl = document.getElementById('screen-favorites');
    if (!screenEl) return;

    const favorites = getAll();
    const arrowLeft = '<svg class="icon--md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>';

    if (favorites.length === 0) {
      screenEl.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
          </svg>
          <h2 class="empty-state__title">No Favorites Yet</h2>
          <p class="empty-state__description">Wallpapers you favorite will appear here.</p>
          <button class="empty-state__btn" onclick="App.navigateTo('home')">Explore Wallpapers</button>
        </div>
      `;
    } else {
      // Build the shell HTML
      screenEl.innerHTML = `
        <div class="favorites-screen">
          <header class="app-header">
            <h1 class="app-header__title" style="text-align: left;">Favorites</h1>
          </header>
          <main>
            <div id="favorites-grid-container" class="wallpaper-grid"></div>
          </main>
        </div>
      `;

      // Append cards using UI component
      const gridContainer = document.getElementById('favorites-grid-container');
      const fragment = document.createDocumentFragment();
      favorites.forEach(wallpaper => {
        const card = UI.createWallpaperCard(wallpaper);
        
        // Bind interactions manually for this screen
        const img = card.querySelector('.wallpaper-card__image');
        if (img) {
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => UI.openPreview(wallpaper));
        }

        const favBtn = card.querySelector('.wallpaper-card__favorite-btn');
        if (favBtn) {
          favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle(wallpaper);
            renderScreen(); // Re-render to update the list and counter
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
      gridContainer.appendChild(fragment);
    }
  }

  /**
   * Initializes the Favorites module.
   */
  function init() {
    // Initialization if needed
  }

  /* --- Public API ----------------------------------------- */
  return {
    init,
    toggle,
    getAll,
    clearAll,
    isFavorite,
    renderScreen,
  };
})();
