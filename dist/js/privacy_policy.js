/* ============================================================
   Wallpaper App — Privacy Policy Module
   ============================================================
   Manages rendering and interactivity of the Privacy Policy view.
   ============================================================ */

'use strict';

const PrivacyPolicy = (() => {
  /**
   * Renders the Privacy Policy Screen structure and injects content.
   */
  function renderScreen() {
    const screenEl = document.getElementById('screen-privacy-policy');
    if (!screenEl) return;

    screenEl.innerHTML = `
      <div class="privacy-policy-screen" style="max-width: 600px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; min-height: 100vh;">
        <!-- Header -->
        <header class="settings-header">
          <button id="privacy-back-btn" class="settings-back-btn" aria-label="Go back to settings">
            <svg style="width:1.5rem; height:1.5rem;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M15.75 19.5L8.25 12l7.5-7.5" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>
          <h1 class="settings-title">Privacy Policy</h1>
        </header>

        <!-- Content Area -->
        <main class="settings-main" style="flex: 1; padding: 1.5rem; line-height: 1.6; font-size: 0.95rem;">
          <div class="privacy-policy-content custom-scrollbar" style="max-height: calc(100vh - 80px); overflow-y: auto;">
            ${PrivacyPolicyContent.getHTML()}
          </div>
        </main>
      </div>
    `;

    // Bind Back Button
    document.getElementById('privacy-back-btn')?.addEventListener('click', () => {
      App.navigateTo('settings');
    });
  }

  return {
    renderScreen
  };
})();
