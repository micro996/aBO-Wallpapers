const fetch = require('node-fetch');

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'your_unsplash_key') {
  console.warn('[Unsplash] UNSPLASH_ACCESS_KEY is missing or invalid. Provider disabled.');
}

// Helper to safely fetch from Unsplash with timeout
const fetchUnsplash = async (endpoint, queryParams = {}) => {
  const url = new URL(endpoint, UNSPLASH_BASE_URL);
  url.searchParams.set('client_id', UNSPLASH_ACCESS_KEY);

  // Sanitize query params (ensure strings, remove empty)
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value).trim());
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

/**
 * LEGACY METHODS - Do not modify response structure
 * These power the existing frontend integration.
 */
async function searchRaw(params) {
  const response = await fetchUnsplash('/search/photos', params);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.errors?.[0] || 'Unsplash API error');
  }
  return data;
}

async function getPhotosRaw(params) {
  const response = await fetchUnsplash('/photos', params);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.errors?.[0] || 'Unsplash API error');
  }
  return data;
}

async function triggerDownloadRaw(downloadLocation) {
  // Ensure the requested download URL is actually an Unsplash download location
  if (!downloadLocation.startsWith(UNSPLASH_BASE_URL)) {
    throw new Error('Invalid download location');
  }

  const response = await fetchUnsplash(downloadLocation.replace(UNSPLASH_BASE_URL, ''));
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.errors?.[0] || 'Unsplash API error');
  }
  return data;
}

/**
 * STANDARDIZED METHOD
 * Powers the new multi-provider architecture.
 */
async function search(params) {
  const rawData = await searchRaw(params);
  
  // Standardize the response format
  const results = rawData.results.map(photo => ({
    id: photo.id,
    imageUrl: photo.urls.regular, // Standard web viewing
    thumbUrl: photo.urls.small,
    downloadUrl: photo.links.download_location,
    photographer: photo.user.name,
    width: photo.width,
    height: photo.height,
    source: 'unsplash'
  }));

  return {
    results,
    total: rawData.total,
    totalPages: rawData.total_pages
  };
}

async function getFeatured(params) {
  const rawData = await getPhotosRaw(params);
  
  // getPhotosRaw returns an array directly, not an object with results
  return rawData.map(photo => ({
    id: photo.id,
    imageUrl: photo.urls.regular,
    thumbUrl: photo.urls.small,
    downloadUrl: photo.links.download_location,
    photographer: photo.user.name,
    width: photo.width,
    height: photo.height,
    source: 'unsplash'
  }));
}

module.exports = {
  searchRaw,
  getPhotosRaw,
  triggerDownloadRaw,
  search,
  getFeatured
};
