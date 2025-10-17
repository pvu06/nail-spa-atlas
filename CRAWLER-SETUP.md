# 🕷️ Spa Atlas Competitor Crawler System

Automated competitor analysis system for nail spas around Aventus Nail Spa in Lewis Center, OH.

## 🎯 Overview

This system automatically discovers and monitors nail spa competitors within a 5km radius of **Aventus Nail Spa** (94 Meadow Park Ave, Lewis Center, OH). It collects comprehensive data including:

### 📊 Data Collected
- **Basic Info**: Name, address, coordinates, phone, email, website
- **Business Hours**: Opening/closing times for each day
- **Services & Pricing**: Service menus with prices and durations
- **Ratings & Reviews**: Google, Facebook, and Yelp ratings
- **Social Media**: Facebook, Instagram, and Yelp profile links
- **SEO Analysis**: Page titles, meta descriptions, H1 tags, load times
- **Screenshots**: Homepage captures (weekly deep crawl)
- **Crawl Metadata**: Timestamps, status, errors, source URLs

### ⏰ Automated Schedule
- **Daily Crawl**: 2:00 AM EST - Basic competitor monitoring
- **Weekly Deep Crawl**: 3:00 AM EST (Sundays) - Full data collection with screenshots
- **Hourly Monitor**: Every hour - Lightweight status checks

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

### 2. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 3. Start the Crawler System
```bash
# Initialize and start all crawlers
npm run crawler:start
```

### 4. Monitor Dashboard
Visit `http://localhost:3000/crawler` to view:
- Crawler status and controls
- Real-time crawl logs
- Discovered competitors
- Performance statistics

## 🛠️ Configuration

### Environment Variables
```bash
# Required
GOOGLE_MAPS_API_KEY="your_api_key_here"
DATABASE_URL="postgresql://..."

# Optional
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_secret_here"
```

### Target Location
The system is configured for **Aventus Nail Spa**:
- **Name**: Aventus Nail Spa
- **Address**: 94 Meadow Park Ave, Lewis Center, OH, United States
- **Coordinates**: 40.1584, -83.0075
- **Search Radius**: 5km (5000 meters)

To change the target location, edit `lib/crawler/config.ts`.

## 📁 Project Structure

```
spa-atlas/
├── lib/crawler/
│   ├── config.ts              # Crawler configuration
│   ├── cron-manager.ts        # Cron job management
│   ├── competitor-crawler.ts  # Main crawling logic
│   └── social-media-finder.ts # Social media discovery
├── app/api/crawler/
│   ├── start/route.ts         # Start crawler API
│   ├── stop/route.ts          # Stop crawler API
│   ├── manual-crawl/route.ts  # Manual crawl API
│   └── logs/route.ts          # Crawl logs API
├── components/
│   └── CrawlerDashboard.tsx   # Monitoring dashboard
├── scripts/
│   ├── start-crawler.ts       # Startup script
│   └── stop-crawler.ts        # Shutdown script
└── prisma/
    └── schema.prisma          # Database schema
```

## 🔧 API Endpoints

### Crawler Management
```bash
# Start crawler
POST /api/crawler/start
{
  "crawlType": "daily" | "weekly" | "hourly"
}

# Stop crawler
POST /api/crawler/stop

# Manual crawl
POST /api/crawler/manual-crawl
{
  "name": "Aventus Nail Spa",
  "address": "94 Meadow Park Ave, Lewis Center, OH",
  "lat": 40.1584,
  "lng": -83.0075,
  "radius": 5000,
  "deepCrawl": true,
  "takeScreenshots": true
}

# Get crawler status
GET /api/crawler/start

# Get crawl logs
GET /api/crawler/logs?page=1&limit=20

# Get crawl statistics
POST /api/crawler/logs
```

### Competitor Data
```bash
# Get all competitors
GET /api/competitors

# Get specific competitor
GET /api/competitors/:id

# Search competitors
POST /api/competitors/search
```

## 📊 Database Schema

### Competitor Table
```sql
- id (UUID, Primary Key)
- placeId (Google Place ID)
- name, address, latitude, longitude
- phone, email, website
- googleRating, googleReviewCount
- facebookRating, facebookReviewCount, facebookUrl
- yelpRating, yelpReviewCount, yelpUrl
- instagramUrl
- seoTitle, seoDescription, h1Tag
- statusCode, pageLoadTime
- lastCrawled, crawlStatus, crawlErrors
- screenshotPath
```

### Service Table
```sql
- id (UUID, Primary Key)
- competitorId (Foreign Key)
- name, serviceType, price
- priceMin, priceMax (for ranges)
- durationMinutes, confidence
- source, verified, lastUpdated
```

### Crawl History Table
```sql
- id (UUID, Primary Key)
- competitorId (Foreign Key)
- crawlTimestamp, status, errors
- screenshotPath, sourceUrl
```

### Opening Hours Table
```sql
- id (UUID, Primary Key)
- competitorId (Foreign Key)
- dayOfWeek, hours
- lastUpdated
```

## 🎛️ Management Commands

### Start/Stop System
```bash
# Start crawler system
npm run crawler:start

# Stop crawler system
npm run crawler:stop

# Check status
curl http://localhost:3000/api/crawler/start
```

### Manual Operations
```bash
# Trigger manual crawl
curl -X POST http://localhost:3000/api/crawler/manual-crawl \
  -H "Content-Type: application/json" \
  -d '{"deepCrawl": true, "takeScreenshots": true}'

# Get recent logs
curl http://localhost:3000/api/crawler/logs?limit=10

# Get statistics
curl -X POST http://localhost:3000/api/crawler/logs
```

### Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## 📈 Monitoring & Analytics

### Dashboard Features
- **Real-time Status**: View running crawlers and their schedules
- **Crawl Logs**: Detailed history of all crawl activities
- **Competitor Discovery**: List of found competitors with ratings
- **Performance Stats**: Success rates, error counts, timing data
- **Manual Controls**: Start/stop crawlers, trigger manual crawls

### Key Metrics
- **Success Rate**: Percentage of successful crawls
- **Competitors Found**: Total competitors discovered
- **Average Processing Time**: Time per competitor crawl
- **Error Rate**: Failed crawls and common issues
- **Data Freshness**: Last crawl timestamps

## 🔍 Crawling Process

### 1. Discovery Phase
- Use Google Places API to find nail salons within 5km radius
- Search with multiple keywords: "nail salon", "nail spa", "beauty salon"
- Filter out target location (Aventus Nail Spa)
- Get basic place information (name, address, rating)

### 2. Data Collection Phase
- **Basic Info**: From Google Places API
- **Detailed Info**: From Google Place Details API
- **Website Crawling**: If website exists, scrape for:
  - Service menus and pricing
  - Contact information
  - SEO metadata
  - Screenshots (weekly only)

### 3. Social Media Discovery
- Search for Facebook, Instagram, and Yelp profiles
- Extract ratings and review counts
- Store profile URLs for future reference

### 4. Data Storage
- Save to PostgreSQL database with time-series tracking
- Create crawl history records
- Update existing competitors or create new ones
- Store services and opening hours separately

## ⚠️ Important Notes

### Rate Limiting
- Google Maps API: 60 requests/minute, 10,000/day
- Web scraping: 30 requests/minute, 1,000/hour
- Built-in delays between requests (2 seconds)

### Error Handling
- Automatic retries for failed requests
- Graceful degradation (partial data collection)
- Comprehensive error logging
- Failed crawls still save basic competitor info

### Privacy & Ethics
- Respects robots.txt files
- Uses reasonable request delays
- Only collects publicly available information
- No personal data collection

## 🚨 Troubleshooting

### Common Issues

**1. Google Maps API Quota Exceeded**
```bash
# Check API usage in Google Cloud Console
# Consider upgrading quota or implementing better caching
```

**2. Database Connection Issues**
```bash
# Verify DATABASE_URL in .env.local
# Check if PostgreSQL is running
# Run: npm run db:generate
```

**3. Crawler Not Starting**
```bash
# Check if ports are available
# Verify environment variables
# Check logs: npm run dev
```

**4. Screenshots Not Saving**
```bash
# Create screenshots directory: mkdir -p screenshots/competitors
# Check file permissions
# Verify Puppeteer installation
```

### Debug Mode
```bash
# Run in development mode with verbose logging
NODE_ENV=development npm run crawler:start
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Email notifications for new competitors
- [ ] Price change alerts
- [ ] Review sentiment analysis
- [ ] Competitive positioning reports
- [ ] API rate limit optimization
- [ ] Multi-location support
- [ ] Mobile app integration

### Advanced Analytics
- [ ] Market trend analysis
- [ ] Competitor ranking algorithms
- [ ] Predictive pricing models
- [ ] Customer review insights
- [ ] Business growth tracking

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review crawl logs in the dashboard
3. Check database connectivity
4. Verify API keys and quotas

## 📄 License

MIT License - See LICENSE file for details.

---

**Built with ❤️ for Aventus Nail Spa competitive intelligence**
