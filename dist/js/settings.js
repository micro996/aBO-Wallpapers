/* ============================================================
   Wallpaper App — Settings Module
   ============================================================
   Manages user settings: theme, cache, and preferences.
   ============================================================ */

'use strict';

const Settings = (() => {
  /**
   * Applies the saved theme to the document.
   */
  function applyTheme() {
    const theme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update browser theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0F172A' : '#F8FAFC');
    }
  }

  /**
   * Toggles between light and dark themes.
   */
  function toggleTheme() {
    const current = Storage.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    Storage.setTheme(next);
    applyTheme();
    // Immediately update the theme display value in settings
    const themeVal = document.getElementById('theme-display-val');
    if (themeVal) themeVal.textContent = next === 'dark' ? 'Dark' : 'Light';
    UI.showToast(`Switched to ${next} mode`);
  }

  /**
   * Clears the API response cache.
   */
  function clearCache() {
    Storage.clearCache();
    const cacheVal = document.getElementById('cache-size-val');
    if (cacheVal) cacheVal.textContent = Storage.getCacheSizeFormatted();
    UI.showToast('Cache cleared');
  }

  /**
   * Handles the Rate App action.
   * For web, shows a toast informing the rating is available in the mobile app.
   * For Capacitor native builds, attempts to open the app store page.
   */
  function rateApp() {
    // Detect Capacitor environment
    const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.getPlatform;
    if (isCapacitor) {
      const platform = Capacitor.getPlatform();
      let storeUrl = '';
      if (platform === 'android') {
        // TODO: replace with actual package name
        storeUrl = 'https://play.google.com/store/apps/details?id=com.example.app';
      } else if (platform === 'ios') {
        // TODO: replace with actual App Store ID
        storeUrl = 'https://apps.apple.com/app/id123456789';
      }
      if (storeUrl) {
        try {
          window.open(storeUrl, '_blank');
          return;
        } catch (_) {
          // fall through to toast error
        }
      }
      UI.showToast('Unable to open the app store. Please try again later.');
    } else {
      // Web fallback
      UI.showToast('Rating is available in the mobile app.');
    }
  }

  /**
   * Renders the Settings screen.
   * All colors use CSS classes referencing CSS custom properties —
   * no hardcoded hex/rgba inline styles for colors.
   */
  function renderScreen() {
    const screenEl = document.getElementById('screen-settings');
    if (!screenEl) return;

    screenEl.innerHTML = `
      <div class="settings-screen settings-container">
        <!-- Header -->
        <header class="settings-header">
          <button id="settings-back-btn" class="settings-back-btn">
            <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M15.75 19.5L8.25 12l7.5-7.5" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>
          <h1 class="settings-title">Settings</h1>
        </header>

        <main class="settings-main">
          <!-- APPEARANCE SECTION -->
          <section class="settings-section">
            <h2 class="settings-section__label">Appearance</h2>
            <div class="settings-card">
              <div id="theme-toggle-btn" class="settings-row">
                <div class="settings-row__left">
                  <span class="settings-row__icon">
                    <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                  <span class="settings-row__text">Theme</span>
                </div>
                <div class="settings-row__right">
                  <span id="theme-display-val" class="settings-row__value">${Storage.getTheme() === 'dark' ? 'Dark' : 'Light'}</span>
                  <span class="settings-row__chevron">
                    <svg class="icon--sm" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- GENERAL SECTION -->
          <section class="settings-section">
            <h2 class="settings-section__label">General</h2>
            <div class="settings-card">
              <!-- Clear Cache -->
              <div id="clear-cache-btn" class="settings-row settings-row--bordered">
                <div class="settings-row__left">
                  <span class="settings-row__icon">
                    <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                  <span class="settings-row__text">Clear Cache</span>
                </div>
                <div class="settings-row__right">
                  <span id="cache-size-val" class="settings-row__value">${Storage.getCacheSizeFormatted()}</span>
                  <span class="settings-row__chevron">
                    <svg class="icon--sm" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </div>
              <!-- Clear Recent Searches -->
              <div id="clear-history-btn" class="settings-row settings-row--bordered">
                <div class="settings-row__left">
                  <span class="settings-row__icon">
                    <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                  <span class="settings-row__text">Clear Recent Searches</span>
                </div>
                <div class="settings-row__right">
                  <span class="settings-row__value">${Storage.getRecentSearches().length}</span>
                  <span class="settings-row__chevron">
                    <svg class="icon--sm" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </div>
              <!-- Download Quality -->
                <div id="download-quality-btn" class="settings-row">
                  <div class="settings-row__left">
                    <span class="settings-row__icon">
                      <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </span>
                    <span class="settings-row__text">Download Quality</span>
                  </div>
                  <div class="settings-row__right">
                    <span id="download-quality-val" class="settings-row__value">${(() => { const q = Storage.getDownloadQuality(); return q.charAt(0).toUpperCase() + q.slice(1); })()}</span>
                    <span class="settings-row__chevron">
                      <svg class="icon--sm" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </span>
                  </div>
                </div>
            </div>
          </section>

          <!-- ABOUT SECTION -->
          <section class="settings-section">
            <h2 class="settings-section__label">About</h2>
            <div class="settings-card">
              <!-- App Version -->
              <div class="settings-row settings-row--bordered">
                <div class="settings-row__left">
                  <span class="settings-row__icon">
                    <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                  <span class="settings-row__text">App Version</span>
                </div>
                <div class="settings-row__right">
                  <span class="settings-row__value">${Storage.getAppVersion()}</span>
                  <span class="settings-row__chevron">
                    <svg class="icon--sm" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </div>
              <!-- Rate App -->
              <div id="rate-app-btn" class="settings-row settings-row--bordered">
                <div class="settings-row__left">
                  <span class="settings-row__icon">
                    <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                  <span class="settings-row__text">Rate App</span>
                </div>
                <span class="settings-row__chevron">
                  <svg class="icon--sm" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </span>
              </div>
              <!-- Share App -->
              <div class="settings-row settings-row--bordered">
                <div class="settings-row__left">
                  <span class="settings-row__icon">
                    <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                  <span class="settings-row__text">Share App</span>
                </div>
                <span class="settings-row__chevron">
                  <svg class="icon--sm" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </span>
              </div>
              <!-- About us -->
              <div id="about-us-btn" class="settings-row settings-row--bordered">
                <div class="settings-row__left">
                  <span class="settings-row__icon">
                    <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                  <span class="settings-row__text">About us</span>
                </div>
                <span class="settings-row__chevron">
                  <svg class="icon--sm" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </span>
              </div>
              <!-- Privacy Policy -->
              <div id="privacy-policy-btn" class="settings-row settings-row--bordered">
                <div class="settings-row__left">
                  <span class="settings-row__icon">
                    <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 10-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                  </span>
                  <span class="settings-row__text">Privacy Policy</span>
                </div>
                <span class="settings-row__chevron">
                  <svg class="icon--sm" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </span>
              </div>
              <!-- Terms & Conditions -->
              <div id="terms-conditions-btn" class="settings-row">
                <div class="settings-row__left">
                  <span class="settings-row__icon">
                    <svg class="icon--md" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                  <span class="settings-row__text">Terms &amp; Conditions</span>
                </div>
                <span class="settings-row__chevron">
                  <svg class="icon--sm" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </span>
              </div>
            </div>
          </section>
        </main>
      </div>
    `;

    // --- Download Quality Modal (appended to body, not inside settings) ---
    // Remove any stale modal from previous renderScreen calls
    const existingModal = document.getElementById('download-quality-modal');
    if (existingModal) existingModal.remove();

    const dqModal = document.createElement('div');
    dqModal.id = 'download-quality-modal';
    dqModal.className = 'dq-modal dq-modal--hidden';
    dqModal.setAttribute('role', 'dialog');
    dqModal.setAttribute('aria-modal', 'true');
    dqModal.setAttribute('aria-labelledby', 'dq-modal-title');
    dqModal.innerHTML = `
      <div class="dq-modal__backdrop"></div>
      <div class="dq-modal__panel" role="radiogroup" aria-labelledby="dq-modal-title">
        <h3 class="dq-modal__title" id="dq-modal-title">Download Quality</h3>
        <div class="dq-modal__options">
          <button class="dq-modal__option" data-quality="auto" role="radio" aria-checked="false">
            <span class="dq-modal__radio"></span>
            <span class="dq-modal__label">Auto <span class="dq-modal__hint">(Recommended)</span></span>
          </button>
          <button class="dq-modal__option" data-quality="high" role="radio" aria-checked="false">
            <span class="dq-modal__radio"></span>
            <span class="dq-modal__label">High</span>
          </button>
          <button class="dq-modal__option" data-quality="medium" role="radio" aria-checked="false">
            <span class="dq-modal__radio"></span>
            <span class="dq-modal__label">Medium</span>
          </button>
          <button class="dq-modal__option" data-quality="low" role="radio" aria-checked="false">
            <span class="dq-modal__radio"></span>
            <span class="dq-modal__label">Low</span>
          </button>
        </div>
        <button class="dq-modal__cancel" id="dq-modal-cancel">Cancel</button>
      </div>
    `;
    document.body.appendChild(dqModal);

    const dqBackdrop = dqModal.querySelector('.dq-modal__backdrop');
    const dqPanel = dqModal.querySelector('.dq-modal__panel');

    function openDqModal() {
      syncDqSelection();
      dqModal.classList.remove('dq-modal--hidden');
      // Trigger reflow so transition plays
      void dqPanel.offsetWidth;
      dqModal.classList.add('dq-modal--visible');
      document.body.style.overflow = 'hidden';
      // Focus the currently selected option
      const selected = dqPanel.querySelector('.dq-modal__option[aria-checked="true"]');
      if (selected) selected.focus();
    }

    function closeDqModal() {
      dqModal.classList.remove('dq-modal--visible');
      document.body.style.overflow = '';
      // After transition, hide completely
      setTimeout(() => dqModal.classList.add('dq-modal--hidden'), 250);
    }

    function syncDqSelection() {
      const current = Storage.getDownloadQuality();
      dqPanel.querySelectorAll('.dq-modal__option').forEach(btn => {
        const match = btn.dataset.quality === current;
        btn.setAttribute('aria-checked', match);
        btn.classList.toggle('dq-modal__option--selected', match);
      });
    }

    function selectDqOption(quality) {
      Storage.setDownloadQuality(quality);
      const label = quality.charAt(0).toUpperCase() + quality.slice(1);
      const display = document.getElementById('download-quality-val');
      if (display) display.textContent = label;
      UI.showToast(`Download quality set to ${label}`);
      closeDqModal();
    }

    // --- Event listeners ---
    // Click an option
    dqPanel.addEventListener('click', (e) => {
      const opt = e.target.closest('.dq-modal__option');
      if (opt) {
        selectDqOption(opt.dataset.quality);
        return;
      }
      if (e.target.id === 'dq-modal-cancel') {
        closeDqModal();
      }
    });

    // Click backdrop to cancel
    dqBackdrop.addEventListener('click', closeDqModal);

    // Keyboard navigation
    dqModal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDqModal();
        return;
      }
      const opts = Array.from(dqPanel.querySelectorAll('.dq-modal__option, .dq-modal__cancel'));
      const idx = opts.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        opts[(idx + 1) % opts.length].focus();
      } else if (e.key === 'ArrowUp' || e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        opts[(idx - 1 + opts.length) % opts.length].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (document.activeElement.dataset?.quality) {
          selectDqOption(document.activeElement.dataset.quality);
        } else if (document.activeElement.id === 'dq-modal-cancel') {
          closeDqModal();
        }
      }
    });

    // Bind actions
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('clear-cache-btn')?.addEventListener('click', clearCache);
    document.getElementById('clear-history-btn')?.addEventListener('click', () => {
      Storage.clearRecentSearches();
      renderScreen(); // Re-render to update the count
    });
    document.getElementById('download-quality-btn')?.addEventListener('click', openDqModal);
    document.getElementById('privacy-policy-btn')?.addEventListener('click', () => {
      App.navigateTo('privacy-policy');
    });
    document.getElementById('about-us-btn')?.addEventListener('click', () => {
      App.navigateTo('about-us');
    });
    document.getElementById('terms-conditions-btn')?.addEventListener('click', () => {
      App.navigateTo('terms-conditions');
    });
  }

  /**
   * Initializes the Settings module.
   */
  function init() {
    applyTheme();
  }

  /* --- Public API ----------------------------------------- */
  return {
    init,
    applyTheme,
    toggleTheme,
    clearCache,
    renderScreen,
  };
})();
