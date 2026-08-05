const unsplash = require('./providers/unsplash');
const pexels = require('./providers/pexels');
const pixabay = require('./providers/pixabay');

const providersState = {
  unsplash: false,
  pexels: false,
  pixabay: false
};

/**
 * Initializes and detects available providers at startup.
 */
function initProviders() {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const pexelsKey = process.env.PEXELS_API_KEY;
  const pixabayKey = process.env.PIXABAY_API_KEY;

  providersState.unsplash = !!unsplashKey && unsplashKey !== 'your_unsplash_key';
  providersState.pexels = !!pexelsKey && pexelsKey !== 'your_pexels_key';
  providersState.pixabay = !!pixabayKey && pixabayKey !== 'your_pixabay_key';

  console.log('\n--- Image Provider Status ---');
  console.log(`${providersState.unsplash ? '✓' : '✗'} Unsplash ${providersState.unsplash ? 'enabled' : 'disabled (API key missing or invalid)'}`);
  console.log(`${providersState.pexels ? '✓' : '✗'} Pexels ${providersState.pexels ? 'enabled' : 'disabled (API key missing or invalid)'}`);
  console.log(`${providersState.pixabay ? '✓' : '✗'} Pixabay ${providersState.pixabay ? 'enabled' : 'disabled (API key missing or invalid)'}`);
  console.log('-----------------------------\n');

  if (!providersState.unsplash && !providersState.pexels && !providersState.pixabay) {
    console.error('FATAL: No image providers are configured. Please set at least one valid API key in .env');
    process.exit(1);
  }
}

/**
 * Executes a fallback cascade across providers.
 * Tries Unsplash -> Pexels -> Pixabay.
 * Returns the first successful response that has results.
 */
async function searchPhotos(params) {
  if (providersState.unsplash) {
    try {
      const data = await unsplash.search(params);
      if (data.results && data.results.length > 0) return data;
    } catch (err) {
      console.warn('[ProviderManager] Unsplash search failed:', err.message);
    }
  }

  if (providersState.pexels) {
    try {
      const data = await pexels.search(params);
      if (data.results && data.results.length > 0) return data;
    } catch (err) {
      console.warn('[ProviderManager] Pexels search failed:', err.message);
    }
  }

  if (providersState.pixabay) {
    try {
      const data = await pixabay.search(params);
      if (data.results && data.results.length > 0) return data;
      return data; // Return empty array if Pixabay also fails
    } catch (err) {
      console.error('[ProviderManager] Pixabay search failed:', err.message);
    }
  }

  throw new Error('All image providers failed or are disabled.');
}

/**
 * Fetches featured photos with the same fallback cascade.
 */
async function getFeaturedPhotos(params) {
  if (providersState.unsplash) {
    try {
      const data = await unsplash.getFeatured(params);
      if (data && data.length > 0) return data;
    } catch (err) {
      console.warn('[ProviderManager] Unsplash getFeatured failed:', err.message);
    }
  }

  if (providersState.pexels) {
    try {
      const data = await pexels.getFeatured(params);
      if (data && data.length > 0) return data;
    } catch (err) {
      console.warn('[ProviderManager] Pexels getFeatured failed:', err.message);
    }
  }

  if (providersState.pixabay) {
    try {
      const data = await pixabay.getFeatured(params);
      if (data && data.length > 0) return data;
      return data; // Return empty array if all fail
    } catch (err) {
      console.error('[ProviderManager] Pixabay getFeatured failed:', err.message);
    }
  }

  throw new Error('All image providers failed or are disabled.');
}

/**
 * Triggers a download.
 * Only Unsplash strictly requires an API hit for downloads.
 * For Pexels and Pixabay, the direct URL is provided to the frontend.
 */
async function triggerDownload(downloadLocation) {
  if (downloadLocation.includes('unsplash.com')) {
    return await unsplash.triggerDownloadRaw(downloadLocation);
  }
  
  // For Pexels and Pixabay, there's no download trigger required by the API.
  // The frontend just needs a { url } object.
  return { url: downloadLocation };
}

module.exports = {
  initProviders,
  searchPhotos,
  getFeaturedPhotos,
  triggerDownload
};
