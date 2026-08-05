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

  async function _initHeroBanner() {
    try {
      heroWallpapers = await API.getFeaturedWallpapers(5);
      if (heroWallpapers.length > 0) {
        _renderHeroSlide(0);
        _startHeroCarousel();
        _initHeroPagination();
      } else {
        document.getElementById('featured-section').style.display = 'none';
      }
    } catch (err) {
      console.error('[App] Failed to load hero wallpapers', err);
    }
  }

  function _renderHeroSlide(index) {
    if (!heroWallpapers[index]) return;
    const wallpaper = heroWallpapers[index];
    currentHeroIndex = index;

    const img = document.getElementById('featured-image');
    const title = document.getElementById('featured-title');
    const desc = document.getElementById('featured-description');

    if (img) img.src = wallpaper.fullUrl;
    if (title) {
      // Split title into two lines if possible
      const words = wallpaper.title.split(' ');
      if (words.length >= 2) {
        title.textContent = '';
        title.appendChild(document.createTextNode(words[0]));
        title.appendChild(document.createElement('br'));
        title.appendChild(document.createTextNode(words.slice(1).join(' ')));
      } else {
        title.textContent = wallpaper.title;
      }
    }
    if (desc) desc.textContent = `Photo by ${wallpaper.photographer}`;

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
      downloadBtn.onclick = () => Downloads.startDownload(wallpaper);
    }
    const viewBtn = document.getElementById('featured-view-btn');
    if (viewBtn) {
      viewBtn.onclick = () => {
        UI.openPreview(wallpaper);
      };
    }
  }

  function _startHeroCarousel() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
      let nextIndex = (currentHeroIndex + 1) % heroWallpapers.length;
      _renderHeroSlide(nextIndex);
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

      // Show/hide hero banner based on category
      const hero = document.getElementById('featured-section');
      if (hero) {
        hero.style.display = category === DEFAULT_CATEGORY ? '' : 'none';
      }

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

    switch (screenName) {
      case 'home':
        // Show hero only for default category
        const hero = document.getElementById('featured-section');
        if (hero) {
          hero.style.display = activeCategory === DEFAULT_CATEGORY ? '' : 'none';
        }
        HomeFilters.setQuery(activeCategory);
        Gallery.loadWithFilters(HomeFilters.getState());
        break;

      case 'search':
        Search.renderScreen();
        break;

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
        _navigateTo(screen);
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

  /* --- Initialize ----------------------------------------- */

  function init() {
    // Initialize modules
    Settings.init();
    HomeFilters.init();
    Gallery.init();
    Search.init();
    Favorites.init();
    Downloads.init();
    UI.initPreview();

    // Render UI
    _renderCategories();
    _initNavigation();
    _initKeyboard();
    _initHeroBanner();

    // Load default wallpapers
    HomeFilters.setQuery(DEFAULT_CATEGORY);
    Gallery.loadWithFilters(HomeFilters.getState());
  }

  /* --- Boot ----------------------------------------------- */
  document.addEventListener('DOMContentLoaded', init);

  /* --- Public API ----------------------------------------- */
  return { init, navigateTo: _navigateTo };
})();

/* --- Service Worker Registration ------------------------ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.error('[SW] Registration failed', err));
  });
}
