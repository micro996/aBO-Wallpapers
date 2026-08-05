/* ============================================================
   Wallpaper App — API Service
   ============================================================
   All Unsplash API communication flows through this module.
   No other module should call fetch() to Unsplash directly.
   ============================================================ */

'use strict';

const API = (() => {
  const BASE_URL = 'http://127.0.0.1:3000/api';
  const DEFAULT_PER_PAGE = 30;

  const _activeRequests = new Map();

  /**
   * Makes a request to the API with deduplication, retries, and timeout.
   */
  async function _request(endpoint, params = {}, signal, retryCount = 1) {
    const url = new URL(BASE_URL + endpoint);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    const urlString = url.toString();

    // 1. Deduplication
    if (_activeRequests.has(urlString)) {
      return _activeRequests.get(urlString);
    }

    const fetchPromise = (async () => {
      // 5. Request Timeout (10 seconds)
      const timeoutController = new AbortController();
      let didTimeout = false;
      const timeoutId = setTimeout(() => {
        didTimeout = true;
        timeoutController.abort();
      }, 10000);

      const onUserAbort = () => timeoutController.abort();
      if (signal) {
        if (signal.aborted) {
          timeoutController.abort();
        } else {
          signal.addEventListener('abort', onUserAbort);
        }
      }

      try {
        const response = await fetch(urlString, {
          signal: timeoutController.signal,
        });

        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener('abort', onUserAbort);

        // Rate limit detection
        const remaining = response.headers.get('X-Ratelimit-Remaining');
        if (remaining !== null && parseInt(remaining, 10) <= 5) {
          console.warn('[API] Rate limit nearly exhausted:', remaining, 'requests remaining');
        }

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('API rate limit exceeded. Please try again later.');
          }
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (err) {
        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener('abort', onUserAbort);

        if (didTimeout) {
          err = new Error('Request timed out after 10 seconds.');
          err.name = 'TimeoutError';
        }

        // 4. Retry Logic
        if (retryCount > 0 && err.name !== 'AbortError') {
          console.warn(`[API] Request failed. Retrying... (${retryCount} left)`, urlString);
          await new Promise(r => setTimeout(r, 1000));
          return _request(endpoint, params, signal, retryCount - 1);
        }
        throw err;
      } finally {
        _activeRequests.delete(urlString);
      }
    })();

    _activeRequests.set(urlString, fetchPromise);
    return fetchPromise;
  }

  /**
   * Normalizes a raw Unsplash photo into our app's wallpaper format.
   * @param {Object} photo - Raw Unsplash photo object.
   * @param {string} category - Category label.
   * @param {number} index - Index within the result set.
   * @returns {Object} Normalized wallpaper object.
   */
  function _normalizePhoto(photo, category, index) {
    return {
      id: photo.id,
      url: photo.urls.small,        // Small for grid thumbnails
      fullUrl: photo.urls.regular,   // Regular for preview
      downloadUrl: photo.urls.full,  // Full for download
      title: photo.alt_description || `${category} Wallpaper ${index + 1}`,
      category,
      resolution: `${photo.width}x${photo.height}`,
      width: photo.width,
      height: photo.height,
      downloadLocation: photo.links.download_location,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      thumbnail: photo.urls.thumb,
      color: photo.color,
      likes: photo.likes,
      createdAt: photo.created_at,
      location: photo.location?.name || photo.user?.location || null,
      camera: photo.exif ? (`${photo.exif.make || ''} ${photo.exif.model || ''}`).trim() : null,
      tags: photo.tags ? photo.tags.map(t => t.title) : [],
      source: photo.source || 'unsplash'
    };
  }

  /**
   * Searches for wallpapers by query.
   * @param {string} query - Search term.
   * @param {Object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.perPage=30]
   * @param {string} [options.orientation] - 'landscape' | 'portrait' | 'squarish'
   * @param {string} [options.orderBy] - 'relevant' | 'latest'
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<{wallpapers: Object[], totalPages: number, total: number}>}
   */
  async function searchWallpapers(query, options = {}) {
    const {
      page = 1,
      perPage = DEFAULT_PER_PAGE,
      orientation,
      orderBy,
      signal,
    } = options;



    const data = await _request('/search/photos', {
      query,
      page,
      per_page: perPage,
      orientation,
      order_by: orderBy,
    }, signal);

    const result = {
      wallpapers: data.results.map((photo, i) => _normalizePhoto(photo, query, i + (page - 1) * perPage)),
      totalPages: data.total_pages,
      total: data.total,
    };



    return result;
  }

  /**
   * Fetches the latest featured wallpapers from the editorial feed.
   * @param {number} [count=5]
   * @returns {Promise<Object[]>} Array of normalized wallpapers
   */
  async function getFeaturedWallpapers(count = 5) {
    const data = await _request('/photos', {
      page: 1,
      per_page: count,
      order_by: 'popular'
    });

    return data.map((photo, i) => _normalizePhoto(photo, 'Featured', i));
  }

  /**
   * Triggers Unsplash download tracking and returns the download URL.
   * (Required by Unsplash API guidelines.)
   * @param {string} downloadLocation - The photo's download_location link.
   * @returns {Promise<string>} The actual image download URL.
   */
  async function triggerDownload(downloadLocation) {
    const data = await _request('/download', { url: downloadLocation });
    return data.url;
  }

  /**
   * Fetches related wallpapers for a given wallpaper.
   * Uses tags to perform a search query if available.
   * @param {Object} wallpaper
   * @param {number} [count=10]
   */
  async function getRelatedWallpapers(wallpaper, count = 10) {
    const cacheKey = `related_${wallpaper.id}`;
    const cached = Storage.getSearchCache(cacheKey);
    if (cached) return cached;

    let query = wallpaper.category || 'Nature';
    if (wallpaper.tags && wallpaper.tags.length > 0) {
      query = wallpaper.tags.slice(0, 2).join(' ');
    }

    try {
      const result = await searchWallpapers(query, { page: 1, perPage: count + 1 });
      let related = result.wallpapers.filter(w => w.id !== wallpaper.id).slice(0, count);
      Storage.setSearchCache(cacheKey, related);
      return related;
    } catch (e) {
      console.error('[API] Failed to fetch related wallpapers', e);
      return [];
    }
  }

  /* --- Public API ----------------------------------------- */
  return {
    searchWallpapers,
    getFeaturedWallpapers,
    triggerDownload,
    getRelatedWallpapers,
    DEFAULT_PER_PAGE,
  };
})();
