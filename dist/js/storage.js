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
    DOWNLOADS: 'wallpaper_downloads',
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

  /* --- Cache (optional) ----------------------------------- */

  function getCached(query) {
    const cache = _read(KEYS.CACHE, {});
    const entry = cache[query];
    if (!entry) return null;
    // Expire after 30 minutes
    if (Date.now() - entry.timestamp > 30 * 60 * 1000) {
      delete cache[query];
      _write(KEYS.CACHE, cache);
      return null;
    }
    return entry.data;
  }

  function setCache(query, data) {
    const cache = _read(KEYS.CACHE, {});
    cache[query] = { data, timestamp: Date.now() };
    _write(KEYS.CACHE, cache);
  }

  function clearCache() {
    _write(KEYS.CACHE, {});
  }

  function getCacheSizeFormatted() {
    const raw = localStorage.getItem(KEYS.CACHE);
    
    // If empty string, null, or represents an empty object
    if (!raw || raw === '{}') return '0 KB';
    
    try {
      const parsed = JSON.parse(raw);
      if (Object.keys(parsed).length === 0) return '0 KB';
    } catch {
      // If unparseable for some reason, fallback to 0 KB
      return '0 KB';
    }

    // Calculate size in bytes
    const bytes = new Blob([raw]).size;
    if (bytes === 0) return '0 KB';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    clearRecentSearches,
    getSettings,
    updateSettings,
    getDownloadQuality,
    setDownloadQuality,
    getCached,
    setCache,
    clearCache,
    getCacheSizeFormatted,
    getDownloads,
    addDownload,
    removeDownload,
    clearDownloads,
  };
})();
