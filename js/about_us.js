/* ============================================================
   Wallpaper App — About Us Module
   ============================================================
   Manages rendering and interactivity of the About Us view.
   ============================================================ */

'use strict';

const AboutUs = (() => {
  // Social Profiles Configuration
  const SOCIAL_LINKS = {
    facebook: {
      web: 'https://facebook.com/YourPage',
      app: 'fb://page/YourPage'
    },
    instagram: {
      web: 'https://instagram.com/YourProfile',
      app: 'instagram://user?username=YourProfile'
    },
    x: {
      web: 'https://x.com/YourProfile',
      app: 'twitter://user?screen_name=YourProfile'
    },
    youtube: {
      web: 'https://youtube.com/@YourChannel',
      app: 'vnd.youtube://@YourChannel'
    },
    pinterest: {
      web: 'https://pinterest.com/YourProfile',
      app: 'pinterest://user/YourProfile'
    },
    telegram: {
      web: 'https://t.me/YourChannel',
      app: 'tg://resolve?domain=YourChannel'
    }
  };

  /**
   * Safe method to open social profile using native app or web browser.
   */
  async function openSocialLink(platform) {
    const config = SOCIAL_LINKS[platform];
    if (!config) return;

    const isCapacitor = typeof Capacitor !== 'undefined';
    if (isCapacitor) {
      try {
        // Attempt using AppLauncher if available
        if (Capacitor.Plugins && Capacitor.Plugins.AppLauncher) {
          const canOpen = await Capacitor.Plugins.AppLauncher.canOpenUrl({ url: config.app });
          if (canOpen.value) {
            await Capacitor.Plugins.AppLauncher.openUrl({ url: config.app });
            return;
          }
        }
      } catch (e) {
        console.warn(`[AboutUs] Native app launch failed for ${platform}, falling back:`, e);
      }

      try {
        // Fallback to Capacitor Browser plugin
        if (Capacitor.Plugins && Capacitor.Plugins.Browser) {
          await Capacitor.Plugins.Browser.open({ url: config.web });
          return;
        }
      } catch (e) {
        console.warn(`[AboutUs] Browser plugin failed for ${platform}, falling back:`, e);
      }
    }

    // Default Web Fallback
    window.open(config.web, '_blank', 'noopener,noreferrer');
  }

  /**
   * Renders the About Us Screen structure and content.
   */
  function renderScreen() {
    const screenEl = document.getElementById('screen-about-us');
    if (!screenEl) return;

    const version = Storage.getAppVersion ? Storage.getAppVersion() : '1.0.0';

    screenEl.innerHTML = `
      <div class="about-us-screen" style="max-width: 600px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; min-height: 100vh;">
        <!-- Header -->
        <header class="settings-header">
          <button id="about-back-btn" class="settings-back-btn" aria-label="Go back to settings">
            <svg style="width:1.5rem; height:1.5rem;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M15.75 19.5L8.25 12l7.5-7.5" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>
          <h1 class="settings-title">About us</h1>
        </header>

        <!-- Content Area -->
        <main class="settings-main" style="flex: 1; padding: 1.5rem; line-height: 1.6; font-size: 0.95rem;">
          <div class="about-us-content custom-scrollbar" style="max-height: calc(100vh - 80px); overflow-y: auto; display: flex; flex-direction: column; align-items: center; gap: 2rem;">
            
            <!-- App Branding -->
            <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 100%;">
              <div class="app-logo-icon" style="width: 80px; height: 80px; border-radius: 20px; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); margin-bottom: 0.5rem; background: var(--color-bg-primary);">
                <img src="assets/apple-touch-icon.png" alt="ABO Logo" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <h2 style="font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--color-text-primary);">Wallpaper Gallery</h2>
              <p style="font-size: 0.9rem; color: var(--color-text-secondary); margin: 0; font-style: italic;">Beautiful wallpapers for every screen.</p>
              <span style="font-size: 0.8rem; background: var(--color-bg-secondary); padding: 0.25rem 0.75rem; border-radius: 9999px; color: var(--color-text-secondary); font-weight: 500; margin-top: 0.25rem; border: 1px solid var(--color-border);">Version ${version}</span>
            </div>

            <!-- Description -->
            <div style="width: 100%;">
              <p style="margin: 0; color: var(--color-text-primary); text-align: center;">
                Discover and download stunning, hand-picked wallpapers for your mobile device. Browse curated categories, search for specific themes, customize your downloads, and build a collection of your favorite wallpapers.
              </p>
            </div>

            <!-- Key Features -->
            <div style="width: 100%; display: flex; flex-direction: column; gap: 0.75rem;">
              <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--color-text-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">Key Features</h3>
              <ul style="margin: 0; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; color: var(--color-text-secondary);">
                <li><strong>High-quality wallpapers:</strong> Crisp resolutions tailored for modern screens.</li>
                <li><strong>Search wallpapers:</strong> Instantly search keywords to find matching backdrops.</li>
                <li><strong>Curated categories:</strong> Explore Nature, Anime, Cars, Cyberpunk, and more.</li>
                <li><strong>Favorites:</strong> Save your favorite wallpapers to view them easily.</li>
                <li><strong>Downloads:</strong> Choose your preferred download quality (Auto, High, Medium, Low).</li>
                <li><strong>Light/Dark Mode:</strong> Fluid application theme integration that respects system settings.</li>
                <li><strong>Offline favorites:</strong> Your saved wallpapers remain accessible offline.</li>
              </ul>
            </div>

            <!-- Developer Section & Contact details -->
            <div style="width: 100%; display: flex; flex-direction: column; gap: 0.75rem;">
              <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--color-text-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">Developer & Contact</h3>
              <p style="margin: 0; color: var(--color-text-secondary);">
                Developed with care by our team. If you have any inquiries, suggestions, or feedback, feel free to reach out.
              </p>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">

                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="color: var(--color-text-secondary); font-weight: 500;">Website:</span>
                  <a href="https://example.com" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); text-decoration: none; font-weight: 500;">https://example.com</a>
                </div>
              </div>
            </div>

            <!-- Support Us & Follow Us Section -->
            <div style="width: 100%; display: flex; flex-direction: column; gap: 1rem;">
              <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--color-text-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">❤️ Support Us</h3>
              <p style="margin: 0; color: var(--color-text-secondary);">
                Love using Wallpaper Gallery? Support us by following us on social media and sharing the app with your friends.
              </p>
              
              <!-- Social Media Icon Grid -->
              <div style="display: flex; justify-content: center; align-items: center; gap: 1.25rem; flex-wrap: wrap; margin-top: 0.5rem; width: 100%;">
                
                <!-- Facebook -->
                <button class="social-icon-btn" data-platform="facebook" aria-label="Follow us on Facebook" style="width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--color-border); background: var(--color-bg-secondary); color: var(--color-text-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; outline: none; padding: 0;">
                  <svg style="width: 1.5rem; height: 1.5rem;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                  </svg>
                </button>

                <!-- Instagram -->
                <button class="social-icon-btn" data-platform="instagram" aria-label="Follow us on Instagram" style="width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--color-border); background: var(--color-bg-secondary); color: var(--color-text-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; outline: none; padding: 0;">
                  <svg style="width: 1.5rem; height: 1.5rem;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </button>


              </div>
            </div>

            <!-- Footer -->
            <div style="width: 100%; text-align: center; margin-top: auto; padding: 2rem 0 1rem 0; border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 0.25rem; color: var(--color-text-muted, var(--color-text-secondary)); font-size: 0.8rem;">
              <div style="font-weight: 500;">Made with ❤️</div>
              <div>&copy; 2026 Wallpaper Gallery. All rights reserved.</div>
            </div>

          </div>
        </main>
      </div>
    `;

    // Add styles for hover/active/scale micro-animations and ripple feel
    let styleTag = document.getElementById('about-us-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'about-us-styles';
      styleTag.textContent = `
        .social-icon-btn:hover {
          transform: scale(1.1);
          color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          background: var(--color-bg-primary) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .social-icon-btn:active {
          transform: scale(0.95);
        }
      `;
      document.head.appendChild(styleTag);
    }

    // Bind Back Button
    document.getElementById('about-back-btn')?.addEventListener('click', () => {
      App.navigateTo('settings');
    });

    // Bind Social Media Buttons
    screenEl.querySelectorAll('.social-icon-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const platform = btn.getAttribute('data-platform');
        openSocialLink(platform);
      });
    });
  }

  return {
    renderScreen
  };
})();
