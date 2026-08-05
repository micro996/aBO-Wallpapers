/* ============================================================
   Wallpaper App — Downloads Module
   ============================================================
   Handles downloading wallpapers via the Unsplash API,
   triggering browser download, and providing user feedback.
   ============================================================ */

'use strict';

const Downloads = (() => {
  /**
   * Downloads a wallpaper.
   * Triggers Unsplash download tracking, fetches the image blob,
   * and initiates a browser file download.
   * @param {Object} wallpaper - Wallpaper object with downloadLocation and title.
   */
  async function startDownload(wallpaper) {
    const filename = toFilename(wallpaper.title);
    UI.showToast('Starting download…');

    // Save to history immediately
    Storage.addDownload(wallpaper);

    try {
      // 1. Trigger Unsplash download tracking (required by API guidelines)
      const triggerUrl = await API.triggerDownload(wallpaper.downloadLocation);

      // 2. Select the correct URL based on user quality preference
      const quality = Storage.getDownloadQuality();
      let finalUrl = triggerUrl; // default (auto) uses full resolution from API

      if (quality === 'high' && wallpaper.downloadUrl) {
        finalUrl = wallpaper.downloadUrl;
      } else if (quality === 'medium' && wallpaper.fullUrl) {
        finalUrl = wallpaper.fullUrl;
      } else if (quality === 'low' && wallpaper.url) {
        finalUrl = wallpaper.url;
      }

      // 3. Trigger browser download natively without CORS-sensitive blob fetch
      const link = document.createElement('a');
      link.href = finalUrl;
      link.target = '_blank';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      UI.showToast('Download started!');
    } catch (err) {
      console.error('[Downloads] Failed:', err);
      UI.showToast('Download failed. Please try again.');
    }
  }

  /**
   * Renders the downloads screen.
   */
  function renderScreen() {
    const screenEl = document.getElementById('screen-downloads');
    if (!screenEl) return;

    const downloads = Storage.getDownloads();

    if (downloads.length === 0) {
      screenEl.innerHTML = `
        <div class="downloads-screen">
          <header class="app-header">
            <h1 class="app-header__title" style="text-align: left;">Downloads</h1>
          </header>
          <main>
            <div class="empty-state">
              <svg class="empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
              <h2 class="empty-state__title">No Downloads Yet</h2>
              <p class="empty-state__description">Wallpapers you download will appear here.</p>
            </div>
          </main>
        </div>
      `;
    } else {
      screenEl.innerHTML = `
        <div class="downloads-screen">
          <header class="app-header">
            <h1 class="app-header__title" style="text-align: left;">Downloads</h1>
          </header>
          <main>
            <div id="downloads-grid-container" class="wallpaper-grid"></div>
          </main>
        </div>
      `;

      const gridContainer = document.getElementById('downloads-grid-container');
      const fragment = document.createDocumentFragment();
      downloads.forEach(wallpaper => {
        const card = document.createElement('div');
        card.className = 'download-card';

        const img = document.createElement('img');
        img.className = 'download-card__image'; // removed wallpaper-card__image to avoid opacity:0 side-effect
        img.src = wallpaper.url || wallpaper.fullUrl;
        img.alt = wallpaper.title || 'Downloaded Wallpaper';
        img.loading = 'lazy';

        const overlay = document.createElement('div');
        overlay.className = 'download-card__overlay';

        const dateStr = wallpaper.downloadDate ? new Date(wallpaper.downloadDate).toLocaleDateString() : 'Unknown';
        const dateText = document.createElement('span');
        dateText.className = 'download-card__date';
        dateText.textContent = dateStr;

        overlay.appendChild(dateText);
        card.appendChild(img);
        card.appendChild(overlay);

        // Hide the download button since it's already downloaded, or leave it. 
        // We'll leave it but let's re-bind interactions.
        const cardImg = card.querySelector('.download-card__image');
        if (cardImg) {
          cardImg.style.cursor = 'pointer';
          cardImg.addEventListener('click', () => Downloads.openDetails(wallpaper));
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
      gridContainer.appendChild(fragment);
    }
  }

  /**
   * Initializes the Downloads module.
   */
  function init() {
    // Initialization if needed
  }
  /* --- Download Details Screen ---------------------------- */

  function openDetails(wallpaper) {
    const detailsScreen = document.getElementById('screen-download-details');
    if (!detailsScreen) return;

    const isFav = Storage.isFavorite(wallpaper.id);
    const dateStr = wallpaper.downloadDate ? new Date(wallpaper.downloadDate).toLocaleDateString() : 'Unknown';
    const sizeStr = wallpaper.fileSize ? (wallpaper.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown';

    // Build static shell
    detailsScreen.innerHTML = `
      <div class="download-details">
        <header class="download-details__header">
          <button class="download-details__back-btn" id="details-back-btn" aria-label="Go back">
            <svg class="icon--md" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 24px; height: 24px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </button>
          <h1 class="download-details__title">Download Details</h1>
        </header>

        <main class="download-details__main">
          <section class="download-details__hero">
            <img class="download-details__image" id="details-hero-img" alt="" />
          </section>

          <section class="download-details__title-section">
            <div class="download-details__title-info">
              <h2 id="details-title-text"></h2>
              <p id="details-author-text"></p>
            </div>
            <div class="download-details__title-actions">
              <button class="download-details__btn-card ${isFav ? 'download-details__btn-card--active' : ''}" id="details-fav-btn">
                ${UI.ICONS.heart}
                <span id="details-fav-text">${isFav ? 'Favorited' : 'Favorite'}</span>
              </button>
              <button class="download-details__btn-card" id="details-share-btn">
                <svg class="icon--md" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 24px; height: 24px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                <span>Share</span>
              </button>
            </div>
          </section>

          <section class="download-details__settings-grid">
            <button class="download-details__setting-btn" id="details-set-home-btn">
              <svg class="icon--lg" fill="none" stroke="#60A5FA" viewBox="0 0 24 24" style="width: 32px; height: 32px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              <div>
                <p class="font-bold">Set as</p>
                <p class="text-muted">Home Screen</p>
              </div>
            </button>
            <button class="download-details__setting-btn" id="details-set-lock-btn">
              <svg class="icon--lg" fill="none" stroke="#FBBF24" viewBox="0 0 24 24" style="width: 32px; height: 32px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              <div>
                <p class="font-bold">Set as</p>
                <p class="text-muted">Lock Screen</p>
              </div>
            </button>
            <button class="download-details__setting-btn" id="details-set-both-btn">
              <svg class="icon--lg" fill="none" stroke="#4ADE80" viewBox="0 0 24 24" style="width: 32px; height: 32px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <div>
                <p class="font-bold">Set as</p>
                <p class="text-muted">Both Wallpapers</p>
              </div>
            </button>
          </section>

          <p class="download-details__note">
            <span>✦</span> Available in the Android app
          </p>

          <section class="download-details__metadata">
            <div class="download-details__meta-row">
              <div class="download-details__meta-label">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                Resolution
              </div>
              <div class="download-details__meta-value" id="details-res-text"></div>
            </div>
            <div class="download-details__meta-row">
              <div class="download-details__meta-label">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                File Size
              </div>
              <div class="download-details__meta-value" id="details-size-text"></div>
            </div>
            <div class="download-details__meta-row">
              <div class="download-details__meta-label">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Quality
              </div>
              <div class="download-details__meta-value" style="text-transform: capitalize;" id="details-quality-text"></div>
            </div>
            <div class="download-details__meta-row">
              <div class="download-details__meta-label">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Downloaded On
              </div>
              <div class="download-details__meta-value" id="details-date-text"></div>
            </div>
          </section>

          <section class="download-details__description">
            <div class="download-details__desc-header">
              <svg fill="none" stroke="#60A5FA" viewBox="0 0 24 24" style="width: 20px; height: 20px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <h3>Description</h3>
            </div>
            <p id="details-desc-text"></p>
          </section>

          <section class="download-details__footer">
            <button class="download-details__remove-btn" id="details-remove-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 24px; height: 24px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Remove from Downloads</span>
            </button>
            <p class="download-details__remove-note">This will remove the wallpaper from your download history.</p>
          </section>
        </main>
      </div>
    `;

    // Safely inject dynamic data
    document.getElementById('details-hero-img').src = wallpaper.fullUrl || wallpaper.url;
    document.getElementById('details-hero-img').alt = wallpaper.title || 'Untitled Wallpaper';
    document.getElementById('details-title-text').textContent = wallpaper.title || 'Untitled Wallpaper';
    document.getElementById('details-author-text').textContent = `By ${wallpaper.photographer || 'Unknown Photographer'}`;
    document.getElementById('details-res-text').textContent = wallpaper.width && wallpaper.height ? `${wallpaper.width} × ${wallpaper.height}` : 'Unknown';
    document.getElementById('details-size-text').textContent = sizeStr;
    document.getElementById('details-quality-text').textContent = wallpaper.downloadQuality || 'Auto';
    document.getElementById('details-date-text').textContent = dateStr;
    document.getElementById('details-desc-text').textContent = wallpaper.description || 'No description available.';

    document.getElementById('details-back-btn').addEventListener('click', closeDetails);

    document.getElementById('details-fav-btn').addEventListener('click', () => {
      if (UI.hapticImpact) UI.hapticImpact();
      const favBtn = document.getElementById('details-fav-btn');
      const favText = document.getElementById('details-fav-text');
      
      if (Storage.isFavorite(wallpaper.id)) {
        Storage.removeFavorite(wallpaper.id);
        favBtn.classList.remove('download-details__btn-card--active');
        favText.textContent = 'Favorite';
      } else {
        Storage.addFavorite(wallpaper);
        favBtn.classList.add('download-details__btn-card--active');
        favText.textContent = 'Favorited';
      }
    });

    document.getElementById('details-share-btn').addEventListener('click', () => {
      if (UI.hapticImpact) UI.hapticImpact();
      if (navigator.share) {
        navigator.share({
          title: wallpaper.title,
          text: `Check out this wallpaper by ${wallpaper.photographer}`,
          url: wallpaper.photographerUrl || wallpaper.url,
        }).catch(console.error);
      } else {
        UI.showToast('Share not supported on this browser');
      }
    });

    document.getElementById('details-remove-btn').addEventListener('click', () => {
      if (UI.hapticImpact) UI.hapticImpact();
      if (confirm('Remove this wallpaper from download history?')) {
        Storage.removeDownload(wallpaper.id);
        closeDetails();
        UI.showToast('Removed from history');
        renderScreen(); // Re-render the downloads list to reflect deletion
      }
    });

    ['details-set-home-btn', 'details-set-lock-btn', 'details-set-both-btn'].forEach(id => {
      document.getElementById(id).addEventListener('click', () => {
        if (UI.hapticImpact) UI.hapticImpact();
        UI.showToast('Available in the Android app.');
      });
    });

    App.navigateTo('download-details');
  }

  function closeDetails() {
    App.navigateTo('downloads');
  }
  return {
    init,
    startDownload,
    renderScreen,
    openDetails,
    closeDetails,
  };
})();

