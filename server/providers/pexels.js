const fetch = require('node-fetch');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

async function fetchPexels(endpoint, queryParams = {}) {
  const url = new URL(endpoint, PEXELS_BASE_URL);
  
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value).trim());
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: PEXELS_API_KEY
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function search(params) {
  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'your_pexels_key') {
    throw new Error('Pexels API Key is missing or invalid.');
  }

  // Map incoming Unsplash-like params to Pexels where possible
  // Pexels uses 'query', 'page', 'per_page'.
  // Orientation map: landscape, portrait, square
  const pexelsParams = {
    query: params.query,
    page: params.page,
    per_page: params.per_page,
  };

  if (params.orientation) {
    // Unsplash uses 'squarish', Pexels uses 'square'
    pexelsParams.orientation = params.orientation === 'squarish' ? 'square' : params.orientation;
  }

  const response = await fetchPexels('/search', pexelsParams);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Pexels API error');
  }

  // Standardize the response format
  const results = data.photos.map(photo => ({
    id: String(photo.id),
    imageUrl: photo.src.large2x || photo.src.large, // High res for modal
    thumbUrl: photo.src.medium,                     // Thumbnail for grid
    downloadUrl: photo.src.original,                // Direct image link for download
    photographer: photo.photographer,
    width: photo.width,
    height: photo.height,
    source: 'pexels'
  }));

  const perPage = params.per_page || 30;
  return {
    results,
    total: data.total_results || results.length,
    totalPages: data.total_results ? Math.ceil(data.total_results / perPage) : 1
  };
}

async function getFeatured(params) {
  // Pexels has a curated endpoint: /v1/curated
  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'your_pexels_key') {
    throw new Error('Pexels API Key is missing or invalid.');
  }
  const pexelsParams = {
    page: params.page,
    per_page: params.per_page
  };
  const response = await fetchPexels('/curated', pexelsParams);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Pexels API error');

  return data.photos.map(photo => ({
    id: String(photo.id),
    imageUrl: photo.src.large2x || photo.src.large,
    thumbUrl: photo.src.medium,
    downloadUrl: photo.src.original,
    photographer: photo.photographer,
    width: photo.width,
    height: photo.height,
    source: 'pexels'
  }));
}

module.exports = {
  search,
  getFeatured
};
