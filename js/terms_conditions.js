/* ============================================================
   Wallpaper App — Terms & Conditions Module
   ============================================================
   Manages rendering and interactivity of the Terms & Conditions view.
   ============================================================ */

'use strict';

const TermsConditions = (() => {
  /**
   * Renders the Terms & Conditions Screen structure and injects content.
   */
  function renderScreen() {
    const screenEl = document.getElementById('screen-terms-conditions');
    if (!screenEl) return;

    screenEl.innerHTML = `
      <div class="terms-conditions-screen" style="max-width: 600px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; min-height: 100vh;">
        <!-- Header -->
        <header class="settings-header">
          <button id="terms-back-btn" class="settings-back-btn" aria-label="Go back to settings">
            <svg style="width:1.5rem; height:1.5rem;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M15.75 19.5L8.25 12l7.5-7.5" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>
          <h1 class="settings-title">Terms &amp; Conditions</h1>
        </header>

        <!-- Content Area -->
        <main class="settings-main" style="flex: 1; padding: 1.5rem; line-height: 1.6; font-size: 0.95rem;">
          <div class="terms-policy-content custom-scrollbar" style="max-height: calc(100vh - 80px); overflow-y: auto;">
            <!-- App Branding -->
            <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 100%; margin-bottom: 2rem;">
              <div class="app-logo-icon" style="width: 60px; height: 60px; border-radius: 16px; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); background: var(--color-bg-primary);">
                <img src="assets/apple-touch-icon.png" alt="ABO Logo" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--color-text-primary);">Wallpaper Gallery</h2>
              <span style="font-size: 0.8rem; color: var(--color-text-secondary);">Last Updated: July 2026</span>
            </div>
            ${TermsConditionsContent.getHTML()}
          </div>
        </main>
      </div>
    `;

    // Bind Back Button
    document.getElementById('terms-back-btn')?.addEventListener('click', () => {
      App.navigateTo('settings');
    });
  }

  return {
    renderScreen
  };
})();
