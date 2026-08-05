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
            <div style="text-align: center; margin-bottom: 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
              <div class="app-logo-icon" style="width: 60px; height: 60px; border-radius: 16px; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, var(--color-primary))); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <svg style="width: 2rem; height: 2rem;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
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
