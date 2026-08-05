const fetch = require('node-fetch');

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const PIXABAY_BASE_URL = 'https://pixabay.com/api/';

async function fetchPixabay(queryParams = {}) {
  const url = new URL(PIXABAY_BASE_URL);
  url.searchParams.set('key', PIXABAY_API_KEY);
  url.searchParams.set('image_type', 'photo'); // Default to photos
  url.searchParams.set('safesearch', 'true');  // Enforce safe search

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value).trim());
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function search(params) {
  if (!PIXABAY_API_KEY || PIXABAY_API_KEY === 'your_pixabay_key') {
    throw new Error('Pixabay API Key is missing or invalid.');
  }

  // Map incoming Unsplash-like params to Pixabay
  const pixabayParams = {
    q: params.query,
    page: params.page,
    per_page: params.per_page,
  };

  if (params.orientation) {
    // Pixabay supports "all", "horizontal", "vertical"
    if (params.orientation === 'landscape') {
      pixabayParams.orientation = 'horizontal';
    } else if (params.orientation === 'portrait') {
      pixabayParams.orientation = 'vertical';
    }
  }

  const response = await fetchPixabay(pixabayParams);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Pixabay API error');
  }

  // Standardize the response format
  const results = data.hits.map(photo => ({
    id: String(photo.id),
    imageUrl: photo.largeImageURL, // High res for modal
    thumbUrl: photo.webformatURL,  // Thumbnail for grid
    downloadUrl: photo.largeImageURL, // Direct image link for download
    photographer: photo.user,
    width: photo.imageWidth,
    height: photo.imageHeight,
    source: 'pixabay'
  }));

  const perPage = params.per_page || 30;
  return {
    results,
    total: data.totalHits || results.length,
    totalPages: data.totalHits ? Math.ceil(data.totalHits / perPage) : 1
  };
}

async function getFeatured(params) {
  if (!PIXABAY_API_KEY || PIXABAY_API_KEY === 'your_pixabay_key') {
    throw new Error('Pixabay API Key is missing or invalid.');
  }
  const pixabayParams = {
    page: params.page,
    per_page: params.per_page,
    order: 'popular' // Pixabay's equivalent to Unsplash's order_by=popular
  };
  const response = await fetchPixabay(pixabayParams);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Pixabay API error');

  return data.hits.map(photo => ({
    id: String(photo.id),
    imageUrl: photo.largeImageURL,
    thumbUrl: photo.webformatURL,
    downloadUrl: photo.largeImageURL,
    photographer: photo.user,
    width: photo.imageWidth,
    height: photo.imageHeight,
    source: 'pixabay'
  }));
}

module.exports = {
  search,
  getFeatured
};
