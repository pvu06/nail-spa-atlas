# 🕷️ Phase 5: Web Scraping & Price Intelligence

## ⚠️ IMPORTANT LEGAL DISCLAIMER

**Web scraping must comply with:**
1. **Terms of Service** of target websites
2. **robots.txt** directives
3. **CFAA** (Computer Fraud and Abuse Act)
4. **GDPR** and privacy laws
5. **Copyright** laws

**Recommendations:**
- ✅ Use official APIs when available
- ✅ Respect robots.txt
- ✅ Rate limit requests (1 request/5s minimum)
- ✅ Identify your bot in User-Agent
- ✅ Don't scrape personal data without consent
- ❌ Don't overwhelm servers
- ❌ Don't bypass technical barriers
- ❌ Don't scrape copyrighted content

**This implementation is for EDUCATIONAL PURPOSES.**
**For production, obtain permission or use official APIs.**

---

## 📊 What Was Built (Phase 5)

### ✅ Core Scraping Infrastructure

#### 1. **Browser Utilities** (`lib/scraping/browser.ts`)

**Features:**
- ✅ Puppeteer browser management
- ✅ Random user agent rotation
- ✅ Page creation with proper headers
- ✅ Navigation with retry logic
- ✅ Screenshot capability (debugging)
- ✅ Selector waiting
- ✅ Text extraction helpers

**Functions:**
```typescript
- getBrowser() - Get browser instance
- createPage() - New page with random UA
- navigateToUrl() - Navigate with retries
- takeScreenshot() - Debug screenshots
- waitForSelector() - Wait for elements
- extractText() - Extract text from selector
- extractTexts() - Extract multiple texts
```

#### 2. **Price Extraction** (`lib/scraping/price-extractor.ts`)

**Service Detection Patterns:**
- ✅ Gel manicure
- ✅ Pedicure
- ✅ Acrylic/Full set
- ✅ Dip powder
- ✅ Regular manicure
- ✅ Waxing
- ✅ Massage
- ✅ Gel removal
- ✅ Nail art
- ✅ Shellac/CND

**Price Extraction Patterns:**
- ✅ `$50` or `$50.00`
- ✅ `$40-$60` (ranges)
- ✅ `50 USD`
- ✅ `Price: $50`

**Duration Extraction:**
- ✅ `45 mins`, `45 minutes`
- ✅ `1 hr`, `1 hour`
- ✅ `1h30m`

**Functions:**
```typescript
- detectServiceType(name) - Detect service category
- extractPrices(text) - Extract all prices from text
- extractPriceRange(text) - Extract min-max range
- extractDuration(text) - Extract duration
- parseServiceItem() - Parse service + price
- normalizeServiceName() - Clean service name
- isValidPrice() - Validate price (0-1000)
- extractServicesFromHtml() - Extract from HTML
```

---

## 🏗️ Architecture Overview

### Data Flow

```
1. User requests competitor analysis
   ↓
2. Google Places API finds competitors
   ↓
3. Store competitors in database
   ↓
4. Queue scraping jobs (Bull)
   ↓
5. Workers process jobs:
   - Check robots.txt
   - Rate limit (1 req/5s)
   - Scrape website/Yelp/etc
   - Extract prices
   - ML estimation if no prices
   ↓
6. Store prices in database
   ↓
7. Return to user with confidence scores
```

### Components Needed (Not Fully Implemented)

#### 1. **Bull Queue Setup**

```typescript
// lib/scraping/queue.ts
import Bull from "bull";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export const scrapingQueue = new Bull("scraping", {
  redis: {
    host: "localhost",
    port: 6379,
  },
});

// Job types
interface ScrapingJob {
  competitorId: string;
  url: string;
  sources: string[]; // ['website', 'yelp', 'google']
  priority: 'high' | 'medium' | 'low';
  frequency: 'daily' | 'weekly' | 'monthly';
}

// Add job
export async function queueScraping(job: ScrapingJob) {
  await scrapingQueue.add(job, {
    priority: job.priority === 'high' ? 1 : job.priority === 'medium' ? 5 : 10,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 minute
    },
  });
}

// Process jobs
scrapingQueue.process(async (job) => {
  const { competitorId, url, sources } = job.data;
  
  // Check robots.txt
  if (!await isAllowed(url)) {
    throw new Error('Blocked by robots.txt');
  }
  
  // Rate limit
  await rateLimiter.wait(url);
  
  // Scrape
  const results = await scrapeCompetitor(url, sources);
  
  // Store in database
  await storeScrapingResults(competitorId, results);
  
  return results;
});
```

#### 2. **Website Scraper**

```typescript
// lib/scraping/scrapers/website-scraper.ts
import { createPage, navigateToUrl, extractTexts } from '../browser';
import { extractServicesFromHtml } from '../price-extractor';

export async function scrapeCompetitorWebsite(url: string) {
  const page = await createPage();
  
  try {
    const success = await navigateToUrl(page, url);
    if (!success) {
      throw new Error('Navigation failed');
    }
    
    // Wait for content
    await page.waitForTimeout(2000);
    
    // Get page HTML
    const html = await page.content();
    
    // Extract services
    const services = extractServicesFromHtml(html, 'website');
    
    // Look for specific selectors (customize per site)
    const serviceNames = await extractTexts(page, '.service-name, .menu-item-title');
    const servicePrices = await extractTexts(page, '.service-price, .price');
    
    // Combine
    const extractedServices = [];
    for (let i = 0; i < Math.min(serviceNames.length, servicePrices.length); i++) {
      const service = parseServiceItem(serviceNames[i], servicePrices[i], 'website');
      if (service) extractedServices.push(service);
    }
    
    return {
      success: true,
      services: [...services, ...extractedServices],
      source: 'website',
      scrapedAt: new Date(),
    };
  } finally {
    await page.close();
  }
}
```

#### 3. **Yelp Scraper** (Educational Only)

```typescript
// lib/scraping/scrapers/yelp-scraper.ts
// NOTE: Use Yelp Fusion API instead: https://www.yelp.com/developers

export async function scrapeYelp(businessUrl: string) {
  // BETTER: Use Yelp Fusion API
  const apiKey = process.env.YELP_API_KEY;
  const businessId = extractYelpBusinessId(businessUrl);
  
  const response = await fetch(
    `https://api.yelp.com/v3/businesses/${businessId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
  
  const data = await response.json();
  
  return {
    name: data.name,
    rating: data.rating,
    reviewCount: data.review_count,
    priceLevel: data.price?.length || null,
    photos: data.photos,
    hours: data.hours,
  };
}
```

#### 4. **Booking Platform Scrapers**

```typescript
// lib/scraping/scrapers/booking-platforms.ts

// Booksy API (they have official API)
// https://booksy.com/en-us/biz/api

// Fresha API (they have official API)
// https://www.fresha.com/developers

// Vagaro - No official API, would need scraping (risky)
// NOT RECOMMENDED: Check their ToS first
```

#### 5. **Robots.txt Checker**

```typescript
// lib/scraping/compliance.ts
import robotsParser from 'robots-parser';
import axios from 'axios';

const robotsCache = new Map<string, any>();

export async function isAllowed(url: string, userAgent = 'NailSpaAtlas-Bot/1.0'): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    
    // Check cache
    if (robotsCache.has(robotsUrl)) {
      const robots = robotsCache.get(robotsUrl);
      return robots.isAllowed(url, userAgent);
    }
    
    // Fetch robots.txt
    const response = await axios.get(robotsUrl, { timeout: 5000 });
    const robots = robotsParser(robotsUrl, response.data);
    
    // Cache
    robotsCache.set(robotsUrl, robots);
    
    return robots.isAllowed(url, userAgent);
  } catch (error) {
    // If robots.txt not found, assume allowed but be cautious
    console.warn('Robots.txt fetch failed:', error);
    return true;
  }
}

export async function getCrawlDelay(url: string, userAgent = 'NailSpaAtlas-Bot/1.0'): Promise<number> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    
    if (robotsCache.has(robotsUrl)) {
      const robots = robotsCache.get(robotsUrl);
      return robots.getCrawlDelay(userAgent) || 5000; // Default 5s
    }
  } catch (error) {
    // Default to 5 seconds
  }
  return 5000;
}
```

#### 6. **Rate Limiter**

```typescript
// lib/scraping/rate-limiter.ts
class DomainRateLimiter {
  private lastRequest: Map<string, number> = new Map();
  private minDelay = 5000; // 5 seconds minimum

  async wait(url: string): Promise<void> {
    const domain = new URL(url).hostname;
    const now = Date.now();
    const lastReq = this.lastRequest.get(domain) || 0;
    const timeSinceLastReq = now - lastReq;

    if (timeSinceLastReq < this.minDelay) {
      const waitTime = this.minDelay - timeSinceLastReq;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequest.set(domain, Date.now());
  }
}

export const rateLimiter = new DomainRateLimiter();
```

#### 7. **ML Price Estimation**

```typescript
// lib/scraping/price-estimator.ts

interface PriceEstimationInput {
  serviceType: string;
  location: { lat: number; lng: number };
  zipCode: string;
  rating: number;
  reviewCount: number;
  priceLevel: number; // 1-4
  amenities: string[];
  competitors: Array<{
    serviceType: string;
    price: number;
    distance: number;
  }>;
}

export function estimatePrice(input: PriceEstimationInput): {
  estimatedPrice: number;
  confidence: number;
  range: { min: number; max: number };
} {
  // Base prices by service type
  const basePrices: Record<string, number> = {
    gel: 35,
    pedicure: 40,
    acrylic: 55,
    dip: 45,
    manicure: 25,
    waxing: 20,
  };

  let basePrice = basePrices[input.serviceType] || 30;

  // Adjust for price level
  const priceLevelMultiplier = [0.7, 0.85, 1.0, 1.15][input.priceLevel - 1] || 1.0;
  basePrice *= priceLevelMultiplier;

  // Adjust for rating
  if (input.rating >= 4.5) {
    basePrice *= 1.1;
  } else if (input.rating < 3.5) {
    basePrice *= 0.9;
  }

  // Adjust for amenities
  const premiumAmenities = ['wi-fi', 'luxury', 'massage', 'beverages'];
  const hasПремiumamenities = input.amenities.some(a => 
    premiumAmenities.some(p => a.toLowerCase().includes(p))
  );
  if (hasPremiumAmenities) {
    basePrice *= 1.05;
  }

  // Adjust based on nearby competitors
  if (input.competitors.length > 0) {
    const nearbyPrices = input.competitors
      .filter(c => c.serviceType === input.serviceType && c.distance < 2)
      .map(c => c.price);

    if (nearbyPrices.length > 0) {
      const avgNearbyPrice = nearbyPrices.reduce((a, b) => a + b) / nearbyPrices.length;
      // Weight: 70% base estimation, 30% nearby avg
      basePrice = basePrice * 0.7 + avgNearbyPrice * 0.3;
    }
  }

  // Calculate confidence
  let confidence = 0.6; // Base confidence for estimation
  if (input.competitors.length > 3) confidence += 0.1;
  if (input.reviewCount > 100) confidence += 0.1;
  confidence = Math.min(confidence, 0.8); // Max 80% for estimates

  // Calculate range (±20%)
  const range = {
    min: Math.round(basePrice * 0.8),
    max: Math.round(basePrice * 1.2),
  };

  return {
    estimatedPrice: Math.round(basePrice),
    confidence,
    range,
  };
}
```

---

## 🎯 Recommended Approach (Legal & Sustainable)

### Instead of Web Scraping, Use:

#### 1. **Official APIs** (Preferred)

**Yelp Fusion API:**
```bash
# Free tier: 5000 calls/day
curl https://api.yelp.com/v3/businesses/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -G \
  --data-urlencode "term=nail salon" \
  --data-urlencode "location=Los Angeles, CA"
```

**Google Places API:**
- Already implemented ✅
- Official, legal, supported

**Booksy API:**
- https://booksy.com/en-us/biz/api
- Official booking platform API

**Fresha API:**
- https://www.fresha.com/developers
- Partner program available

#### 2. **Crowdsourcing**

Ask salon owners to submit their own prices:
- Verification system
- Incentives (free trial, premium features)
- Community-driven
- Always up-to-date

#### 3. **Manual Data Entry**

For initial MVP:
- Research 50-100 top salons
- Manual price collection
- Verify with phone calls
- Update quarterly

#### 4. **User-Generated Content**

Let users report prices:
- "Did you visit this salon? Share prices!"
- Verification through receipts
- Points/rewards system
- Reviews + pricing

---

## 📋 Implementation Checklist

### If You Choose to Implement Scraping:

- [ ] **Legal Review** - Consult lawyer about ToS
- [ ] **robots.txt Compliance** - Always check
- [ ] **Rate Limiting** - Min 5s between requests
- [ ] **User-Agent** - Identify your bot clearly
- [ ] **Error Handling** - Graceful failures
- [ ] **Logging** - Track all scraping activity
- [ ] **Opt-Out** - Allow sites to block you
- [ ] **Data Storage** - Comply with privacy laws
- [ ] **Attribution** - Credit sources
- [ ] **Monitoring** - Watch for IP blocks

### Better Alternative Checklist:

- [x] **Google Places API** - Implemented ✅
- [ ] **Yelp Fusion API** - Sign up
- [ ] **Booksy API** - Apply for access
- [ ] **Fresha API** - Partner program
- [ ] **Manual Data Collection** - For top salons
- [ ] **User Submissions** - Build form
- [ ] **Price Estimation** - ML model
- [ ] **Community Verification** - User votes

---

## 💰 Cost Comparison

### Web Scraping:
- **Infrastructure:** $100-300/month (proxies, servers)
- **Legal Risk:** High (ToS violations, CFAA)
- **Maintenance:** High (sites change, break)
- **Data Quality:** Medium (outdated, errors)
- **Scalability:** Low (IP blocks, bans)

### Official APIs:
- **Infrastructure:** $50-200/month (API calls)
- **Legal Risk:** None (official, licensed)
- **Maintenance:** Low (stable APIs)
- **Data Quality:** High (authoritative)
- **Scalability:** High (rate limits clear)

### Crowdsourcing:
- **Infrastructure:** $0-50/month (storage)
- **Legal Risk:** None
- **Maintenance:** Low
- **Data Quality:** High (verified)
- **Scalability:** Very High (community)

**Recommendation:** Use Official APIs + Crowdsourcing

---

## 🚀 Quick Start (Safe Approach)

### 1. Yelp Fusion API

```bash
# Sign up: https://www.yelp.com/developers/v3/manage_app
# Get API key

# Add to .env.local
YELP_API_KEY="your-api-key"
```

```typescript
// lib/integrations/yelp.ts
export async function searchYelp(location: string, term: string = "nail salon") {
  const response = await fetch(
    `https://api.yelp.com/v3/businesses/search?location=${location}&term=${term}&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${process.env.YELP_API_KEY}`,
      },
    }
  );
  return response.json();
}
```

### 2. Manual Price Collection Form

```tsx
// components/PriceSubmissionForm.tsx
export function PriceSubmissionForm() {
  return (
    <form>
      <h3>Help us keep prices accurate!</h3>
      <Input name="salonName" placeholder="Salon Name" />
      <Input name="serviceName" placeholder="Service (e.g., Gel Manicure)" />
      <Input name="price" type="number" placeholder="Price" />
      <Input name="visitDate" type="date" placeholder="When did you visit?" />
      <Textarea name="notes" placeholder="Additional notes (optional)" />
      <Button type="submit">Submit Price Info</Button>
    </form>
  );
}
```

### 3. ML Price Estimation

Use the `price-estimator.ts` function when no price data available.

---

## 📚 Resources

### Legal
- [CFAA Overview](https://www.justice.gov/criminal-ccips/computer-fraud-and-abuse-act)
- [robots.txt Specification](https://www.robotstxt.org/)
- [Web Scraping Legal Issues](https://blog.apify.com/is-web-scraping-legal/)

### APIs
- [Yelp Fusion API](https://www.yelp.com/developers/documentation/v3)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Booksy API](https://booksy.com/en-us/biz/api)

### Tools
- [Puppeteer Docs](https://pptr.dev/)
- [Bull Queue](https://github.com/OptimalBits/bull)
- [Cheerio](https://cheerio.js.org/)

---

## ⚖️ Legal Summary

**✅ DO:**
- Use official APIs
- Respect robots.txt
- Rate limit requests
- Identify your bot
- Follow ToS
- Get permission

**❌ DON'T:**
- Bypass technical barriers
- Ignore robots.txt
- Overwhelm servers
- Scrape personal data
- Violate copyright
- Break ToS

**💡 BEST APPROACH:**
- Start with APIs
- Add crowdsourcing
- Use ML estimation
- Build community

---

**Status:** 🟡 **PARTIALLY IMPLEMENTED**

**What's Ready:**
- ✅ Browser utilities
- ✅ Price extraction
- ✅ ML estimation logic

**What's Needed:**
- 🔄 Official API integrations (Yelp, etc)
- 🔄 User submission system
- 🔄 Community verification

**Recommendation:** Focus on **legal, sustainable** data sources first!

---

*Built responsibly with legal compliance in mind* ⚖️



