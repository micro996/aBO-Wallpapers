/* ============================================================
   Wallpaper App — Local Storage Manager
   ============================================================
   Centralized read/write for all locally persisted data:
   theme, favorites, recent searches, settings, and cache.
   ============================================================ */

'use strict';

const Storage = (() => {
  // Storage key constants
  const KEYS = {
    THEME: 'wallpaper_theme',
    FAVORITES: 'wallpaper_favorites',
    RECENT_SEARCHES: 'wallpaper_recent_searches',
    SETTINGS: 'wallpaper_settings',
    CACHE: 'wallpaper_cache',
    CATEGORY_CACHE: 'category_cache',
    DOWNLOADS: 'wallpaper_downloads',
    HERO_CACHE: 'hero_banner_cache',
  };

  const MAX_RECENT_SEARCHES = 10;

  /* --- Generic helpers ------------------------------------ */

  /**
   * Safely reads and parses JSON from localStorage.
   * @param {string} key
   * @param {*} fallback - Default value if key is missing or corrupt.
   * @returns {*}
   */
  function _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Writes a value to localStorage as JSON.
   * @param {string} key
   * @param {*} value
   */
  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('[Storage] Write failed:', err);
    }
  }

  /* --- Theme ---------------------------------------------- */

  function getTheme() {
    return _read(KEYS.THEME, 'dark');
  }

  function setTheme(theme) {
    _write(KEYS.THEME, theme);
  }

  /* --- Favorites ------------------------------------------ */

  function getFavorites() {
    return _read(KEYS.FAVORITES, []);
  }

  function addFavorite(wallpaper) {
    const favorites = getFavorites();
    if (favorites.some((fav) => fav.id === wallpaper.id)) return false;
    favorites.unshift(wallpaper);
    _write(KEYS.FAVORITES, favorites);
    return true;
  }

  function removeFavorite(id) {
    const favorites = getFavorites().filter((fav) => fav.id !== id);
    _write(KEYS.FAVORITES, favorites);
  }

  function isFavorite(id) {
    return getFavorites().some((fav) => fav.id === id);
  }

  function clearFavorites() {
    _write(KEYS.FAVORITES, []);
  }

  /* --- Recent Searches ------------------------------------ */

  function getRecentSearches() {
    return _read(KEYS.RECENT_SEARCHES, []);
  }

  function addRecentSearch(query) {
    let searches = getRecentSearches().filter((s) => s !== query);
    searches.unshift(query);
    if (searches.length > MAX_RECENT_SEARCHES) {
      searches = searches.slice(0, MAX_RECENT_SEARCHES);
    }
    _write(KEYS.RECENT_SEARCHES, searches);
  }

  function removeRecentSearch(query) {
    const searches = getRecentSearches().filter((s) => s !== query);
    _write(KEYS.RECENT_SEARCHES, searches);
  }

  function clearRecentSearches() {
    _write(KEYS.RECENT_SEARCHES, []);
  }

  /* --- Downloads ------------------------------------------ */

  function getDownloads() {
    return _read(KEYS.DOWNLOADS, []);
  }

  function addDownload(wallpaper) {
    const downloads = getDownloads();
    // Move to top if already exists
    const filtered = downloads.filter((dl) => dl.id !== wallpaper.id);
    
    // Build rich metadata for the download record
    const quality = getDownloadQuality();
    const isFav = isFavorite(wallpaper.id);

    const richMetadata = {
      id: wallpaper.id,
      title: wallpaper.title || 'Untitled Wallpaper',
      description: wallpaper.description || '',
      photographer: wallpaper.photographer || 'Unknown',
      photographerUrl: wallpaper.photographerUrl || null,
      thumbnailUrl: wallpaper.url || null,
      previewUrl: wallpaper.fullUrl || null,
      fullUrl: wallpaper.fullUrl || null,
      downloadUrl: wallpaper.downloadUrl || null,
      width: wallpaper.width || 0,
      height: wallpaper.height || 0,
      resolution: wallpaper.resolution || `${wallpaper.width} × ${wallpaper.height}`,
      downloadQuality: quality,
      downloadDate: new Date().toISOString(),
      fileSize: wallpaper.fileSize || null,
      likes: wallpaper.likes || 0,
      location: wallpaper.location || null,
      camera: wallpaper.camera || null,
      tags: wallpaper.tags || [],
      isFavorite: isFav,
      downloaded: true,
      // Retain original fields required by UI (e.g. url, downloadLocation)
      url: wallpaper.url,
      downloadLocation: wallpaper.downloadLocation
    };

    filtered.unshift(richMetadata);
    _write(KEYS.DOWNLOADS, filtered);
  }

  function removeDownload(id) {
    const downloads = getDownloads().filter((dl) => dl.id !== id);
    _write(KEYS.DOWNLOADS, downloads);
  }

  function clearDownloads() {
    _write(KEYS.DOWNLOADS, []);
  }

  /* --- Settings ------------------------------------------- */

  function getSettings() {
    return _read(KEYS.SETTINGS, {
      theme: 'dark',
      animations: true,
      cacheEnabled: true,
      downloadQuality: 'auto',
    });
  }

  function updateSettings(partial) {
    const current = getSettings();
    _write(KEYS.SETTINGS, { ...current, ...partial });
  }

  function getDownloadQuality() {
    return getSettings().downloadQuality || 'auto';
  }

  function setDownloadQuality(quality) {
    updateSettings({ downloadQuality: quality });
  }

    // Application version constant (single source of truth)
  const APP_VERSION = '1.0.0';

  /**
   * Returns the current application version.
   * For web builds, uses the constant. For Capacitor, this can be overridden
   * to read the native version via Capacitor's App plugin.
   * @returns {string}
   */
  function getAppVersion() {
    // Future Capacitor integration placeholder:
    // if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App) {
    //   return Capacitor.Plugins.App.getVersion();
    // }
    return APP_VERSION;
  }

  /* --- Search Cache (24-Hour) ----------------------------- */

  function getSearchCache(key) {
    const cache = _read(KEYS.CACHE, {});
    const entry = cache[key];
    if (!entry) return null;
    // Expire after 24 hours
    if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
      delete cache[key];
      _write(KEYS.CACHE, cache);
      return null;
    }
    // Invalidate stale empty cache from previous bug
    if (entry.data && entry.data.wallpapersToRender && entry.data.wallpapersToRender.length === 0) {
      delete cache[key];
      _write(KEYS.CACHE, cache);
      return null;
    }
    return entry.data;
  }

  function setSearchCache(key, data) {
    cleanupExpiredCache();
    const cache = _read(KEYS.CACHE, {});
    cache[key] = { data, timestamp: Date.now() };
    _write(KEYS.CACHE, cache);
  }

  function getCategoryCache(key) {
    const cache = _read(KEYS.CATEGORY_CACHE, {});
    const entry = cache[key];
    if (!entry) return null;
    // Expire after 24 hours
    if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
      delete cache[key];
      _write(KEYS.CATEGORY_CACHE, cache);
      return null;
    }
    // Invalidate stale empty cache from previous bug
    if (entry.data && entry.data.wallpapersToRender && entry.data.wallpapersToRender.length === 0) {
      delete cache[key];
      _write(KEYS.CATEGORY_CACHE, cache);
      return null;
    }
    return entry.data;
  }

  function setCategoryCache(key, data) {
    cleanupExpiredCache();
    const cache = _read(KEYS.CATEGORY_CACHE, {});
    cache[key] = { data, timestamp: Date.now() };
    _write(KEYS.CATEGORY_CACHE, cache);
  }

  function clearCache() {
    _write(KEYS.CACHE, {});
    _write(KEYS.CATEGORY_CACHE, {});
    localStorage.removeItem(KEYS.HERO_CACHE);
  }

  function getCacheSize() {
    let size = 0;
    const cacheKeys = [KEYS.CACHE, KEYS.CATEGORY_CACHE, KEYS.HERO_CACHE];
    cacheKeys.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw) {
        size += new Blob([raw]).size;
      }
    });
    return size;
  }

  function getCacheCount() {
    let hero = 0;
    let search = 0;
    let category = 0;

    const heroRaw = localStorage.getItem(KEYS.HERO_CACHE);
    if (heroRaw) hero = 1;

    const searchRaw = localStorage.getItem(KEYS.CACHE);
    if (searchRaw && searchRaw !== '{}') {
      try { search = Object.keys(JSON.parse(searchRaw)).length; } catch(e) {}
    }

    const catRaw = localStorage.getItem(KEYS.CATEGORY_CACHE);
    if (catRaw && catRaw !== '{}') {
      try { category = Object.keys(JSON.parse(catRaw)).length; } catch(e) {}
    }

    return { hero, search, category, totalSize: getCacheSize() };
  }

  function _enforceCacheLimit(key, maxEntries = 50) {
    const cache = _read(key, {});
    const keys = Object.keys(cache);
    if (keys.length <= maxEntries) return;

    // Sort by timestamp (oldest first)
    const sortedKeys = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
    // Remove oldest entries
    const keysToRemove = sortedKeys.slice(0, keys.length - maxEntries);
    keysToRemove.forEach(k => delete cache[k]);
    _write(key, cache);
  }

  function cleanupExpiredCache() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;

    // 1. Search Cache
    let searchCache = _read(KEYS.CACHE, {});
    let searchChanged = false;
    Object.keys(searchCache).forEach(key => {
      if (now - searchCache[key].timestamp > maxAge) {
        delete searchCache[key];
        searchChanged = true;
      }
    });
    if (searchChanged) _write(KEYS.CACHE, searchCache);
    _enforceCacheLimit(KEYS.CACHE, 50);

    // 2. Category Cache
    let catCache = _read(KEYS.CATEGORY_CACHE, {});
    let catChanged = false;
    Object.keys(catCache).forEach(key => {
      if (now - catCache[key].timestamp > maxAge) {
        delete catCache[key];
        catChanged = true;
      }
    });
    if (catChanged) _write(KEYS.CATEGORY_CACHE, catCache);
    _enforceCacheLimit(KEYS.CATEGORY_CACHE, 50);

    // 3. Hero Cache
    const heroCache = _read(KEYS.HERO_CACHE, null);
    if (heroCache && heroCache.timestamp && (now - heroCache.timestamp > maxAge)) {
      localStorage.removeItem(KEYS.HERO_CACHE);
    }
  }

  function getCacheSizeFormatted() {
    const bytes = getCacheSize();
    if (bytes === 0) return '0 KB';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /* --- Hero Banner Cache (24-Hour) ------------------------ */

  /**
   * Retrieves the cached hero banner array if it's less than 24 hours old.
   * @param {boolean} [ignoreExpiry=false] - If true, returns expired cache (for offline fallback).
   */
  function getHeroCache(ignoreExpiry = false) {
    const cache = _read(KEYS.HERO_CACHE, null);
    if (!cache || !cache.wallpapers || !cache.timestamp) return null;

    const age = Date.now() - cache.timestamp;
    const isExpired = age > 24 * 60 * 60 * 1000;

    if (isExpired && !ignoreExpiry) {
      return null;
    }

    return cache.wallpapers;
  }

  function setHeroCache(wallpapers) {
    cleanupExpiredCache(); // Before saving new entry
    _write(KEYS.HERO_CACHE, {
      wallpapers,
      timestamp: Date.now()
    });
  }

  /* --- Public API ----------------------------------------- */
  return {
    getAppVersion,
    getTheme,
    setTheme,
    getFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites,
    getRecentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    getSettings,
    updateSettings,
    getDownloadQuality,
    setDownloadQuality,
    getAppVersion,
    getSearchCache,
    setSearchCache,
    getCategoryCache,
    setCategoryCache,
    cleanupExpiredCache,
    getCacheSize,
    getCacheCount,
    clearCache,
    getCacheSizeFormatted,
    getDownloads,
    addDownload,
    removeDownload,
    clearDownloads,
    getHeroCache,
    setHeroCache,
  };
})();
