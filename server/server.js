require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const unsplashProvider = require('./providers/unsplash');
const pexelsProvider = require('./providers/pexels');
const pixabayProvider = require('./providers/pixabay');
const providerManager = require('./providerManager');

// Helper to convert standard internal format to legacy Unsplash format
function mapToLegacyUnsplash(item) {
  return {
    id: item.id,
    width: item.width,
    height: item.height,
    color: '#1a1a1a', 
    alt_description: `Wallpaper by ${item.photographer}`,
    urls: {
      raw: item.imageUrl,
      full: item.downloadUrl,
      regular: item.imageUrl,
      small: item.thumbUrl,
      thumb: item.thumbUrl
    },
    links: {
      download_location: item.downloadUrl
    },
    user: {
      name: item.photographer,
      links: { html: '' }
    },
    source: item.source
  };
}

// 1. Security Headers
app.use(helmet());

// 2. Payload limits to prevent DOS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// 3. Enable Strict CORS for frontend
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://abo-wallpapers-backend.onrender.com',
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'http://localhost:8080',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:5502',
  'http://localhost:5502'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    // and allow requests matching our allowed origins array.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET']
}));

// 2. Rate Limiting to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Removed inline fetchUnsplash (now in providers/unsplash.js)

// Health check route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "ABO Wallpapers Backend is running 🚀"
  });
});

// 4. Proxy Endpoints

// Search Photos
app.get('/api/search/photos', async (req, res) => {
  try {
    const { query, page, per_page, orientation, order_by } = req.query;

    // Validation
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid search query' });
    }
    if (page && isNaN(parseInt(page, 10))) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    if (per_page && isNaN(parseInt(per_page, 10))) {
      return res.status(400).json({ error: 'Invalid per_page number' });
    }
    const validOrientations = ['landscape', 'portrait', 'squarish'];
    if (orientation && !validOrientations.includes(orientation)) {
      return res.status(400).json({ error: 'Invalid orientation' });
    }

    const standardData = await providerManager.searchPhotos({ query, page, per_page, orientation, order_by });
    
    // Convert to legacy Unsplash format
    const legacyData = {
      total: standardData.total,
      total_pages: standardData.totalPages,
      results: standardData.results.map(mapToLegacyUnsplash)
    };
    
    res.json(legacyData);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream API Timeout' });
    }
    console.error('Error in /api/search/photos:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Photos (Featured)
app.get('/api/photos', async (req, res) => {
  try {
    const { page, per_page, order_by } = req.query;

    if (page && isNaN(parseInt(page, 10))) {
      return res.status(400).json({ error: 'Invalid page number' });
    }

    const standardData = await providerManager.getFeaturedPhotos({ page, per_page, order_by });
    
    // Convert to legacy format (array of objects)
    const legacyData = standardData.map(mapToLegacyUnsplash);
    
    res.json(legacyData);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream API Timeout' });
    }
    console.error('Error in /api/photos:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Trigger Download
app.get('/api/download', async (req, res) => {
  try {
    const { url: downloadLocation } = req.query;
    if (!downloadLocation) {
      return res.status(400).json({ error: 'Missing download url parameter' });
    }

    const data = await providerManager.triggerDownload(downloadLocation);
    res.json(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream API Timeout' });
    }
    console.error('Error in /api/download:', error.message);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// ==========================================
// NEW STANDARDIZED TEST ENDPOINTS (PHASE 5.1)
// ==========================================

app.get('/api/unsplash/search', async (req, res) => {
  try {
    const data = await unsplashProvider.search(req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pexels/search', async (req, res) => {
  try {
    const data = await pexelsProvider.search(req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pixabay/search', async (req, res) => {
  try {
    const data = await pixabayProvider.search(req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize providers before listening
providerManager.initProviders();

app.listen(PORT, () => {
  console.log(`Wallpaper Gallery Backend Proxy is running on port ${PORT}`);
});
