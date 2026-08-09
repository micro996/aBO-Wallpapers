/* ============================================================
   Wallpaper App — Home Filters Module
   ============================================================
   Manages the Home Screen's isolated search and filter state.
   ============================================================ */

'use strict';

const HomeFilters = (() => {
  let state = {
    query: '',
    orientation: 'portrait',
    resolution: null,
    sortBy: 'relevant'
  };

  const config = {
    orientation: [
      { label: 'All', value: null },
      { label: 'Landscape', value: 'landscape' },
      { label: 'Portrait', value: 'portrait' },
      { label: 'Squarish', value: 'squarish' }
    ],
    resolution: [
      { label: 'Any', value: null },
      { label: '4K (3840+)', value: '4k' },
      { label: 'HD (1920+)', value: 'hd' }
    ],
    sort: [
      { label: 'Relevant', value: 'relevant' },
      { label: 'Latest', value: 'latest' }
    ]
  };

  function init() {
    _initSearch();
    _initDropdowns();
  }

  function _initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    const helperMsg = document.getElementById('search-helper-message');

    // Phase 4.7 - Typing State and Clearing Search
    searchInput.addEventListener('input', () => {
      const val = searchInput.value.trim();

      if (val === '') {
        // Clear search -> Instantly restore home
        App.resetToHome();
        if (helperMsg) helperMsg.classList.add('hidden');
      } else {
        // Typing -> show helper message
        if (helperMsg) helperMsg.classList.remove('hidden');
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        state.query = searchInput.value.trim();
        if (state.query) Storage.addRecentSearch(state.query);
        _triggerGalleryUpdate();
      }
    });

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        state.query = searchInput.value.trim();
        if (state.query) Storage.addRecentSearch(state.query);
        _triggerGalleryUpdate();
      });
    }
  }

  function _initDropdowns() {
    _buildDropdown('filter-orientation', config.orientation, 'orientation');
    _buildDropdown('filter-resolution', config.resolution, 'resolution');
    _buildDropdown('filter-sort', config.sort, 'sortBy');

    // Global click listener to close dropdowns
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.filter-dropdown')) {
        document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('active'));
        document.querySelectorAll('.filter-dropdown__menu').forEach(m => m.classList.remove('active'));
      }
    });
  }

  function _buildDropdown(buttonTextId, options, stateKey) {
    const textEl = document.getElementById(buttonTextId);
    if (!textEl) return;
    const buttonEl = textEl.closest('.filter-dropdown');
    if (!buttonEl) return;

    const menu = document.createElement('div');
    menu.className = 'filter-dropdown__menu';

    options.forEach(opt => {
      const item = document.createElement('button');
      item.className = 'filter-dropdown__item';
      if (opt.value === state[stateKey]) {
        item.classList.add('filter-dropdown__item--active');
        textEl.textContent = opt.label;
      }
      item.textContent = opt.label;
      item.addEventListener('click', (e) => {
        e.stopPropagation();

        // Update state
        state[stateKey] = opt.value;
        textEl.textContent = opt.label;

        // Update active class
        menu.querySelectorAll('.filter-dropdown__item').forEach(i => i.classList.remove('filter-dropdown__item--active'));
        item.classList.add('filter-dropdown__item--active');

        // Close menu
        buttonEl.classList.remove('active');
        menu.classList.remove('active');

        // Phase 4.10 - Auto-refresh if a search is active
        const isSearching = !!state.query && state.query.toLowerCase() !== 'nature';
        if (isSearching) {
          _triggerGalleryUpdate();
        }
      });
      menu.appendChild(item);
    });

    buttonEl.appendChild(menu);

    buttonEl.addEventListener('click', (e) => {

      // Toggle logic
      const isActive = buttonEl.classList.contains('active');

      // Close all others
      document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('active'));
      document.querySelectorAll('.filter-dropdown__menu').forEach(m => m.classList.remove('active'));

      if (!isActive) {
        buttonEl.classList.add('active');
        menu.classList.add('active');
      }
    });
  }

  function _triggerGalleryUpdate() {
    // Phase 4.7 - Hide helper message on execute
    const helperMsg = document.getElementById('search-helper-message');
    if (helperMsg) helperMsg.classList.add('hidden');

    Gallery.loadWithFilters(state);
  }

  function setQuery(q) {
    state.query = q;
    const searchInput = document.getElementById('search-input');
    if (searchInput && q !== searchInput.value) {
      searchInput.value = q === 'Nature' ? '' : q;
    }
  }

  function getState() {
    return { ...state };
  }

  function executeSearch(query) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = query;
    state.query = query;
    if (query) Storage.addRecentSearch(query);
    _triggerGalleryUpdate();
  }

  return {
    init,
    getState,
    setQuery,
    executeSearch
  };
})();
