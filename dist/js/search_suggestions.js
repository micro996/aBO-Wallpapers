/* ============================================================
   Wallpaper App — Smart Search Suggestions
   ============================================================
   Handles live search suggestions, recent searches history,
   and UI dropdown management.
   ============================================================ */

'use strict';

const SearchSuggestions = (() => {
  // Local keyword dictionary for fallback suggestions
  const LOCAL_KEYWORDS = [
    'Abstract', 'Aesthetic', 'AMOLED', 'Animals', 'Anime', 'Architecture',
    'Art', 'Autumn', 'Black', 'Blue', 'Cars', 'Cats', 'City', 'Cyberpunk',
    'Dark', 'Desktop', 'Dogs', 'Fantasy', 'Flowers', 'Forest', 'Gaming',
    'Green', 'Illustration', 'Landscape', 'Minimalist', 'Mountains',
    'Nature', 'Neon', 'Night', 'Ocean', 'Pattern', 'Pink', 'Purple',
    'Red', 'Retro', 'Sci-Fi', 'Sky', 'Space', 'Sports', 'Summer',
    'Sunset', 'Technology', 'Texture', 'Travel', 'Typography', 'Vintage',
    'Water', 'White', 'Winter', 'Yellow'
  ];

  let inputEl;
  let containerEl;
  let debounceTimer;

  function init() {
    inputEl = document.getElementById('search-input');
    containerEl = document.getElementById('search-suggestions-container');

    if (!inputEl || !containerEl) return;

    // Event listeners
    inputEl.addEventListener('focus', handleFocus);
    inputEl.addEventListener('input', handleInput);
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!inputEl.contains(e.target) && !containerEl.contains(e.target)) {
        hide();
      }
    });

    // Handle Escape key
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hide();
      }
    });
  }

  function handleFocus() {
    const query = inputEl.value.trim();
    if (query.length < 3) {
      renderRecentSearches();
    } else {
      renderSuggestions(query);
    }
  }

  function handleInput(e) {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();

    if (query.length === 0) {
      renderRecentSearches();
      return;
    }

    if (query.length < 3) {
      hide();
      return;
    }

    debounceTimer = setTimeout(() => {
      renderSuggestions(query);
    }, 300);
  }

  function hide() {
    containerEl.classList.add('hidden');
  }

  function show() {
    containerEl.classList.remove('hidden');
  }

  function renderRecentSearches() {
    const recent = Storage.getRecentSearches();
    
    if (recent.length === 0) {
      hide();
      return;
    }

    let html = `
      <div class="search-suggestions__header">Recent Searches</div>
      <div class="search-suggestions__list">
    `;

    recent.forEach(query => {
      html += `
        <div class="search-suggestion-item" tabindex="0" data-query="${escapeHtml(query)}">
          <div class="search-suggestion-item__content">
            <svg class="icon--sm search-suggestion-item__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="search-suggestion-item__text">${escapeHtml(query)}</span>
          </div>
          <button class="search-suggestion__remove-btn" aria-label="Remove recent search" data-remove="${escapeHtml(query)}">
            <svg class="icon--sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      `;
    });

    html += `
      </div>
      <div class="search-suggestions__footer">
        <button class="search-suggestions__clear-btn" id="clear-recent-btn">Clear All</button>
      </div>
    `;

    containerEl.innerHTML = html;
    bindEvents();
    show();
  }

  function renderSuggestions(query) {
    const qLower = query.toLowerCase();
    
    // Priority 1: Recent Searches
    const recentMatches = Storage.getRecentSearches().filter(s => s.toLowerCase().includes(qLower));
    
    // Priority 2/3: Local Keywords
    const keywordMatches = LOCAL_KEYWORDS.filter(k => k.toLowerCase().includes(qLower) && !recentMatches.some(r => r.toLowerCase() === k.toLowerCase()));
    
    // Combine and limit to 8
    const combined = [...recentMatches, ...keywordMatches].slice(0, 8);

    if (combined.length === 0) {
      hide();
      return;
    }

    let html = `
      <div class="search-suggestions__header">Suggestions</div>
      <div class="search-suggestions__list">
    `;
    
    combined.forEach(match => {
      html += `
        <div class="search-suggestion-item" tabindex="0" data-query="${escapeHtml(match)}">
          <div class="search-suggestion-item__content">
            <svg class="icon--sm search-suggestion-item__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span class="search-suggestion-item__text">${highlightMatch(match, query)}</span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    containerEl.innerHTML = html;
    bindEvents();
    show();
  }

  function bindEvents() {
    // Search item clicks
    const items = containerEl.querySelectorAll('.search-suggestion-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        // Prevent trigger if clicking remove button
        if (e.target.closest('.search-suggestion__remove-btn')) return;
        
        const query = item.getAttribute('data-query');
        executeSuggestion(query);
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = item.getAttribute('data-query');
          executeSuggestion(query);
        }
      });
    });

    // Remove specific recent search
    const removeBtns = containerEl.querySelectorAll('.search-suggestion__remove-btn');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const query = btn.getAttribute('data-remove');
        Storage.removeRecentSearch(query);
        // Re-render recent searches if still empty/focused
        if (inputEl.value.trim().length < 3) {
          renderRecentSearches();
        }
      });
    });

    // Clear all recent searches
    const clearBtn = document.getElementById('clear-recent-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        Storage.clearRecentSearches();
        hide();
      });
    }
  }

  function executeSuggestion(query) {
    hide();
    inputEl.blur();
    
    if (window.HomeFilters && window.HomeFilters.executeSearch) {
      window.HomeFilters.executeSearch(query);
    }
  }

  function escapeHtml(unsafe) {
    return (unsafe || '').replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }

  function highlightMatch(text, query) {
    const escapedText = escapeHtml(text);
    const escapedQuery = escapeHtml(query);
    if (!escapedQuery) return escapedText;
    
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapedText.replace(regex, '<span style="color: var(--color-accent);">$1</span>');
  }

  // Auto-init when DOM is ready
  document.addEventListener('DOMContentLoaded', init);

  return {
    init
  };
})();
