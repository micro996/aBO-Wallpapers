/* ============================================================
   Wallpaper App — Application Entry Point
   ============================================================
   Initializes all modules, populates the UI, wires global
   event listeners (navigation, categories), and manages
   screen switching for the single-page application.
   ============================================================ */

'use strict';

const App = (() => {
  /* --- Category Definitions ------------------------------- */
  const CATEGORIES = [
    { name: 'Nature', icon: UI.ICONS.globe },
    { name: 'Anime' },
    { name: 'Cars' },
    { name: 'Abstract' },
    { name: 'Space' },
    { name: 'Mountains' },
    { name: 'Ocean' },
    { name: 'Forest' },
    { name: 'Sky' },
    { name: 'Desert' },
    { name: 'Flowers' },
    { name: 'Galaxy' },
    { name: 'Neon' },
    { name: 'Cyberpunk' },
    { name: 'Minimal' },
    { name: 'Dark Mode' },
    { name: 'Gaming' },
    { name: 'Movies' },
    { name: 'Superheroes' },
    { name: 'Animals' },
    { name: 'Technology' },
    { name: 'Architecture' },
    { name: 'Photography' },
    { name: 'Digital Art' },
    { name: 'Sports' },
  ];

  const DEFAULT_CATEGORY = 'Nature';

  /* --- Screen State --------------------------------------- */
  // Tracks which screen is currently active to prevent
  // redundant renders and enable clean transitions.
  let currentScreen = 'home';

  /* --- Home-specific UI selectors to show/hide ------------ */
  const HOME_UI_SELECTORS = [
    '.app-header',
    '.search-bar',
    '.category-pills',
    '.filter-bar',
    '#featured-section',
  ];

  /* --- State ---------------------------------------------- */
  let activeCategory = DEFAULT_CATEGORY;

  /* --- Hero Banner ---------------------------------------- */
  let heroWallpapers = [];
  let currentHeroIndex = 0;
  let heroInterval = null;
  let activeImageIndex = 1;
  let isAnimating = false;
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isSwiping = false;

  async function _initHeroBanner() {
    try {
      let cached = Storage.getHeroCache();
      if (cached && cached.length > 0) {
        heroWallpapers = cached;
      } else {
        heroWallpapers = await API.getFeaturedWallpapers(5);
        if (heroWallpapers.length > 0) {
          Storage.setHeroCache(heroWallpapers);
        }
      }

      if (heroWallpapers && heroWallpapers.length > 0) {
        _renderHeroSlide(0);
        _startHeroCarousel();
        _initHeroPagination();
      } else {
        document.getElementById('featured-section').style.display = 'none';
      }
    } catch (err) {
      console.error('[App] Failed to load hero wallpapers', err);
      // Offline fallback: use expired cache if available
      const expiredCache = Storage.getHeroCache(true);
      if (expiredCache && expiredCache.length > 0) {
        console.log('[App] Offline fallback: Using expired hero cache.');
        heroWallpapers = expiredCache;
        _renderHeroSlide(0);
        _startHeroCarousel();
        _initHeroPagination();
      } else {
        document.getElementById('featured-section').style.display = 'none';
      }
    }
  }

  function _preloadAdjacentHeroImages(index) {
    if (!heroWallpapers || heroWallpapers.length <= 1) return;
    const nextIdx = (index + 1) % heroWallpapers.length;
    const prevIdx = (index - 1 + heroWallpapers.length) % heroWallpapers.length;

    [nextIdx, prevIdx].forEach(idx => {
      const img = new Image();
      img.src = heroWallpapers[idx].fullUrl || heroWallpapers[idx].url?.regular;
    });
  }

  function _renderHeroSlide(index, direction = 'none') {
    if (!heroWallpapers[index]) return;
    if (isAnimating && direction !== 'none') return;

    const wallpaper = heroWallpapers[index];
    currentHeroIndex = index;

    const title = document.getElementById('featured-title');
    const desc = document.getElementById('featured-description');

    // Clean title algorithm (2-4 meaningful words)
    let rawTitle = (wallpaper.title || 'Featured Wallpaper').replace(/[^a-zA-Z\s-]/g, '').trim();
    let words = rawTitle.split(/\s+/);
    const stopWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'with', 'under', 'over', 'into', 'beautiful', 'stunning', 'amazing', 'awesome', 'gorgeous', 'pretty', 'of', 'in', 'through']);
    let cleanWords = words.filter(w => !stopWords.has(w.toLowerCase()));
    let finalTitle = cleanWords.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    if (!finalTitle) finalTitle = 'Featured Wallpaper';

    if (title) title.textContent = finalTitle;
    if (desc) desc.textContent = `Photo by ${wallpaper.photographer}`;

    const activeImg = document.getElementById(`featured-image-${activeImageIndex}`);
    const nextImageIndex = activeImageIndex === 1 ? 2 : 1;
    const nextImg = document.getElementById(`featured-image-${nextImageIndex}`);

    if (direction === 'none') {
      if (activeImg) {
        activeImg.src = wallpaper.fullUrl || wallpaper.url?.regular;
        activeImg.style.display = '';
        activeImg.style.transform = '';
      }
      if (nextImg) nextImg.style.display = 'none';
      _preloadAdjacentHeroImages(index);
    } else {
      isAnimating = true;
      nextImg.src = wallpaper.fullUrl || wallpaper.url?.regular;
      nextImg.style.display = '';
      nextImg.classList.remove('hero-image-transition');

      if (direction === 'left') {
        nextImg.classList.add('hero-slide-in-right');
        nextImg.classList.remove('hero-slide-in-left');
      } else {
        nextImg.classList.add('hero-slide-in-left');
        nextImg.classList.remove('hero-slide-in-right');
      }

      // Force reflow
      void nextImg.offsetWidth;

      activeImg.classList.add('hero-image-transition');
      nextImg.classList.add('hero-image-transition');

      if (direction === 'left') {
        activeImg.classList.add('hero-slide-out-left');
        nextImg.classList.remove('hero-slide-in-right');
      } else {
        activeImg.classList.add('hero-slide-out-right');
        nextImg.classList.remove('hero-slide-in-left');
      }

      setTimeout(() => {
        activeImg.style.display = 'none';
        activeImg.classList.remove('hero-image-transition', 'hero-slide-out-left', 'hero-slide-out-right');
        nextImg.classList.remove('hero-image-transition');
        activeImageIndex = nextImageIndex;
        isAnimating = false;
        _preloadAdjacentHeroImages(index);
      }, 400);
    }

    // Update dots
    const dots = document.querySelectorAll('.featured-card__pagination .pagination-dot');
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.remove('pagination-dot--inactive');
        dot.classList.add('pagination-dot--active');
        dot.setAttribute('aria-selected', 'true');
      } else {
        dot.classList.remove('pagination-dot--active');
        dot.classList.add('pagination-dot--inactive');
        dot.setAttribute('aria-selected', 'false');
      }
    });

    // Wire buttons
    const downloadBtn = document.getElementById('featured-download-btn');
    if (downloadBtn) {
      downloadBtn.onclick = (e) => {
        e.stopPropagation();
        Downloads.startDownload(wallpaper);
      };
    }

    // Make entire hero banner clickable & swipeable
    const bannerContainer = document.querySelector('.featured-card__container');
    if (bannerContainer && !bannerContainer.hasAttribute('data-touch-bound')) {
      bannerContainer.setAttribute('data-touch-bound', 'true');

      bannerContainer.onclick = () => {
        if (!isSwiping) {
          UI.openPreview(heroWallpapers[currentHeroIndex]);
        }
      };

      bannerContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        isSwiping = false;
        if (heroInterval) clearInterval(heroInterval);
      }, { passive: true });

      bannerContainer.addEventListener('touchmove', (e) => {
        if (isAnimating) return;
        touchCurrentX = e.touches[0].clientX;
        const deltaX = touchStartX - touchCurrentX;

        if (Math.abs(deltaX) > 10) {
          isSwiping = true;
        }
      }, { passive: true });

      bannerContainer.addEventListener('touchend', (e) => {
        if (!isSwiping || isAnimating) {
          _startHeroCarousel();
          return;
        }

        const deltaX = touchStartX - touchCurrentX;
        if (Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            let nextIndex = (currentHeroIndex + 1) % heroWallpapers.length;
            _renderHeroSlide(nextIndex, 'left');
          } else {
            let prevIndex = (currentHeroIndex - 1 + heroWallpapers.length) % heroWallpapers.length;
            _renderHeroSlide(prevIndex, 'right');
          }
        }

        _startHeroCarousel();
      });
    }
  }

  function _startHeroCarousel() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
      let nextIndex = (currentHeroIndex + 1) % heroWallpapers.length;
      _renderHeroSlide(nextIndex, 'left');
    }, 5000);
  }

  function _initHeroPagination() {
    const dots = document.querySelectorAll('.featured-card__pagination .pagination-dot');
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        _renderHeroSlide(i);
        _startHeroCarousel(); // Reset interval
      });
    });
  }

  /* --- Category Pills ------------------------------------- */

  /**
   * Populates the horizontal category pill list.
   */
  function _renderCategories() {
    const listEl = document.getElementById('category-list');
    if (!listEl) return;

    const fragment = document.createDocumentFragment();

    listEl.innerHTML = ''; // clear existing before rendering

    CATEGORIES.forEach((cat) => {
      const pill = UI.createCategoryPill(cat, cat.name === activeCategory);
      fragment.appendChild(pill);
    });

    listEl.appendChild(fragment);

    // Event delegation for category clicks
    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-pill');
      if (!btn) return;

      const category = btn.getAttribute('data-category');
      if (category === activeCategory) return;

      // Update active state
      const prevActive = listEl.querySelector('.category-pill--active');
      if (prevActive) {
        prevActive.classList.remove('category-pill--active');
        prevActive.setAttribute('aria-selected', 'false');
      }
      btn.classList.add('category-pill--active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = category;

      // Load wallpapers for the selected category
      HomeFilters.setQuery(category);
      Gallery.loadWithFilters(HomeFilters.getState());
    });
  }

  /* --- Screen Navigation ---------------------------------- */

  /**
   * Navigates to a screen. This is the single entry point for
   * all screen transitions. It:
   * 1. Closes any open preview modal
   * 2. Resets body scroll
   * 3. Hides all screen containers
   * 4. Shows the target screen container
   * 5. Renders the target screen content
   *
   * @param {string} screenName - 'home' | 'search' | 'favorites' | 'downloads' | 'settings'
   */
  function _navigateTo(screenName) {
    // Always close preview modal when switching screens
    UI.closePreview();

    // Skip redundant navigation to the same screen
    // (except 'home' which may need gallery reload after category change)
    if (screenName === currentScreen && screenName !== 'home') return;

    currentScreen = screenName;

    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.add('hidden');
      screen.classList.remove('active');
    });

    // Show the target screen
    const targetScreen = document.getElementById(`screen-${screenName}`);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      targetScreen.classList.add('active');
    }

    // Scroll to top on screen change
    window.scrollTo(0, 0);

    // Phase 4.5 - Unified search, remove hidden-on-home logic

    switch (screenName) {
      case 'home':
        HomeFilters.setQuery(activeCategory);
        Gallery.loadWithFilters(HomeFilters.getState());
        break;

      // Removed dedicated search screen

      case 'favorites':
        Favorites.renderScreen();
        break;

      case 'downloads':
        Downloads.renderScreen();
        break;

      case 'settings':
        Settings.renderScreen();
        break;

      case 'privacy-policy':
        PrivacyPolicy.renderScreen();
        break;

      case 'about-us':
        AboutUs.renderScreen();
        break;

      case 'terms-conditions':
        TermsConditions.renderScreen();
        break;

      default:
        break;
    }
  }

  /* --- Bottom Navigation ---------------------------------- */

  function _initNavigation() {
    const navButtons = document.querySelectorAll('[data-nav]');

    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Remove active from all
        navButtons.forEach((b) => {
          b.classList.remove('nav-item--active');
          b.removeAttribute('aria-current');
        });
        // Activate clicked
        btn.classList.add('nav-item--active');
        btn.setAttribute('aria-current', 'page');

        const screen = btn.getAttribute('data-nav');
        if (UI && UI.hapticImpact) UI.hapticImpact();

        if (screen === 'search') {
          // Unified Search - switch to home, scroll, focus
          if (currentScreen !== 'home') {
            _navigateTo('home');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setTimeout(() => {
            document.getElementById('search-input')?.focus();
          }, 300);
        } else {
          _navigateTo(screen);
        }
      });
    });
  }

  /* --- Keyboard Shortcuts --------------------------------- */

  function _initKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Esc to close any modal
      if (e.key === 'Escape') {
        UI.closePreview();
      }
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    });
  }

  /* --- Pull to Refresh ------------------------------------ */

  function _initPullToRefresh() {
    const screenHome = document.getElementById('screen-home');
    const ptrSpinner = document.getElementById('ptr-spinner');
    if (!screenHome || !ptrSpinner) return;

    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    const threshold = 60; // pixels to trigger refresh

    screenHome.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });

    screenHome.addEventListener('touchmove', (e) => {
      if (!isPulling) return;
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0 && window.scrollY === 0) {
        e.preventDefault(); // Prevent native scroll
        // Resistance curve
        const pullDistance = Math.min(deltaY * 0.4, threshold + 20);

        ptrSpinner.classList.add('visible');
        ptrSpinner.style.transform = `translateY(${pullDistance - 20}px)`;

        if (pullDistance >= threshold) {
          ptrSpinner.classList.add('ready');
        } else {
          ptrSpinner.classList.remove('ready');
        }
      } else if (window.scrollY > 0) {
        isPulling = false;
        _resetPtr(ptrSpinner);
      } else if (deltaY < 0) {
        _resetPtr(ptrSpinner);
      }
    }, { passive: false });

    screenHome.addEventListener('touchend', () => {
      if (!isPulling) return;
      isPulling = false;

      const deltaY = currentY - startY;
      const pullDistance = deltaY * 0.4;

      if (pullDistance >= threshold && window.scrollY === 0) {
        _triggerRefresh(ptrSpinner);
      } else {
        _resetPtr(ptrSpinner);
      }
    });
  }

  function _resetPtr(spinner) {
    spinner.style.transform = '';
    spinner.classList.remove('visible', 'ready', 'refreshing');
  }

  async function _triggerRefresh(spinner) {
    spinner.classList.add('refreshing');
    spinner.style.transform = `translateY(10px)`;

    try {
      // Refresh Hero (uses cache natively if valid)
      await _initHeroBanner();

      // Refresh Gallery (reset to page 1, load current filters)
      if (window.Gallery && window.HomeFilters) {
        Gallery.reset();
        Gallery.loadWithFilters(HomeFilters.getState());
      }
    } finally {
      setTimeout(() => _resetPtr(spinner), 500); // Give time for UI update
    }
  }

  /* --- Initialize ----------------------------------------- */

  async function init() {
    Storage.cleanupExpiredCache();
    // Initialize modules
    Settings.init();
    HomeFilters.init();
    Gallery.init();
    Favorites.init();
    Downloads.init();
    UI.initPreview();

    // Render UI
    _renderCategories();
    _initNavigation();
    _initKeyboard();
    _initHeroBanner();
    _initPullToRefresh();

    // Load default wallpapers
    HomeFilters.setQuery(DEFAULT_CATEGORY);
    Gallery.loadWithFilters(HomeFilters.getState());

    // Splash Screen Lifecycle
    const splash = document.getElementById('app-splash');
    const staticImage = document.querySelector('.splash__static-image');
    
    if (splash && staticImage) {
      // 1. Reveal Phase 2 (Background Image) as soon as the shooting star finishes (2.9s)
      setTimeout(() => {
        staticImage.classList.remove('hidden');
      }, 2900);

      // 2. Fade out the entire splash screen after Phase 2 has been shown for 3 seconds (5.9s total)
      setTimeout(() => {
        splash.classList.add('hidden');
      }, 5900);

      // 3. Remove the splash screen from the DOM completely (after the 800ms fade transition finishes)
      setTimeout(() => {
        splash.remove();
      }, 6700);
    }
  }

  /* --- Boot ----------------------------------------------- */
  document.addEventListener('DOMContentLoaded', init);

  /* --- Public API ----------------------------------------- */

  function resetToHome() {
    activeCategory = DEFAULT_CATEGORY;
    _renderCategories();
    HomeFilters.setQuery(DEFAULT_CATEGORY);
    Gallery.loadWithFilters(HomeFilters.getState());
  }

  return { init, navigateTo: _navigateTo, resetToHome };
})();

/* --- Service Worker Registration ------------------------ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.error('[SW] Registration failed', err));
  });
}
