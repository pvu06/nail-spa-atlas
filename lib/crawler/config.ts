/**
 * Configuration for the competitor crawler system
 */

export const CRAWLER_CONFIG = {
  // Target location: Aventus Nail Spa
  TARGET: {
    name: "Aventus Nail Spa",
    address: "94 Meadow Park Ave, Lewis Center, OH, United States",
    lat: 40.1584,
    lng: -83.0075,
    radius: 5000 // 5km in meters
  },

  // Crawl schedules (in EST timezone)
  SCHEDULES: {
    daily: "0 2 * * *",      // 2:00 AM daily
    weekly: "0 3 * * 0",     // 3:00 AM on Sundays
    hourly: "0 * * * *"      // Every hour
  },

  // Crawler behavior settings
  SETTINGS: {
    maxConcurrentRequests: 5,
    requestDelayMs: 2000,
    pageTimeoutMs: 30000,
    screenshotDirectory: "screenshots/competitors",
    maxRetries: 3,
    retryDelayMs: 5000
  },

  // Search keywords for finding competitors
  SEARCH_KEYWORDS: [
    "nail salon",
    "nail spa",
    "beauty salon",
    "nail technician",
    "manicure pedicure",
    "nail art",
    "gel nails",
    "acrylic nails"
  ],

  // Service types to track
  SERVICE_TYPES: [
    "gel",
    "pedicure", 
    "acrylic",
    "dip",
    "manicure",
    "waxing",
    "massage",
    "gel-removal",
    "nail-art",
    "shellac"
  ],

  // Price ranges to validate (in USD)
  PRICE_VALIDATION: {
    minPrice: 5,
    maxPrice: 1000
  },

  // Crawl options by type
  CRAWL_OPTIONS: {
    daily: {
      deepCrawl: false,
      takeScreenshots: false,
      includeReviews: true,
      includeSocialMedia: false,
      includeSeoAnalysis: false
    },
    weekly: {
      deepCrawl: true,
      takeScreenshots: true,
      includeReviews: true,
      includeSocialMedia: true,
      includeSeoAnalysis: true
    },
    hourly: {
      deepCrawl: false,
      takeScreenshots: false,
      includeReviews: false,
      includeSocialMedia: false,
      includeSeoAnalysis: false
    }
  },

  // User agents for web scraping
  USER_AGENTS: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15"
  ],

  // Rate limiting configuration
  RATE_LIMITS: {
    googleMaps: {
      requestsPerMinute: 60,
      requestsPerDay: 10000
    },
    webScraping: {
      requestsPerMinute: 30,
      requestsPerHour: 1000
    }
  }
};

export default CRAWLER_CONFIG;



