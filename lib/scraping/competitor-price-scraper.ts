import { createPage, navigateToUrl, closeBrowser } from "./browser";
import { ServicePrice, extractPrices, detectServiceType } from "./price-extractor";
import * as cheerio from "cheerio";

export interface ScrapedPrices {
  gel?: number;
  pedicure?: number;
  acrylic?: number;
  success: boolean;
  confidence: number;
  source: string;
  allServices?: ServicePrice[];
}

/**
 * Extended URL patterns to try
 */
const SERVICE_PAGE_PATHS = [
  "",  // Homepage first
  "/services",
  "/pricing",
  "/menu",
  "/price-list",
  "/our-services",
  "/nail-services",
  "/rates",
  "/prices",
  "/service-menu",
  "/nail-menu",
];

/**
 * SIMPLIFIED: Just look for these keywords near prices
 */
const SERVICE_KEYWORDS = {
  gel: ["gel"],
  pedicure: ["pedicure", "pedi"],
  acrylic: ["acrylic", "acrylics"],
};

/**
 * ONLY exclude very specific non-services (be MUCH more permissive)
 */
const EXCLUDE_KEYWORDS = [
  "removal only",
  "soak off only",
  "repair only",
  "per nail",
  "each nail",
  "add-on",
  "addon",
];

/**
 * VERY RELAXED price ranges (capture almost everything)
 */
const PRICE_RANGES = {
  gel: { min: 15, max: 100 },
  pedicure: { min: 20, max: 150 },
  acrylic: { min: 30, max: 250 },
};

/**
 * Click "See more" / "Load more" / "View all" buttons to expand content
 */
async function clickExpandButtons(page: any): Promise<void> {
  try {
    console.log(`  🖱️  Looking for expand buttons...`);
    
    const clicked = await page.evaluate(() => {
      const keywords = [
        'see more', 'load more', 'view all', 'show more', 'show all',
        'more services', 'all services', 'expand', 'read more', 'view more'
      ];
      
      let clickCount = 0;
      const buttons = Array.from(document.querySelectorAll('button, a, span, div'));
      
      for (const element of buttons) {
        const text = (element.textContent || '').toLowerCase().trim();
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        const combined = text + ' ' + ariaLabel;
        
        // Check if element contains any expand keyword
        if (keywords.some(kw => combined.includes(kw))) {
          // Make sure it's clickable
          const el = element as HTMLElement;
          if (el.offsetParent !== null) { // Element is visible
            el.click();
            clickCount++;
            console.log(`Clicked: "${text}"`);
            
            // Don't click more than 3 buttons
            if (clickCount >= 3) break;
          }
        }
      }
      
      return clickCount;
    });
    
    if (clicked > 0) {
      console.log(`  ✅ Clicked ${clicked} expand button(s), waiting for content...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for content to load
    } else {
      console.log(`  ℹ️  No expand buttons found`);
    }
  } catch (error: any) {
    console.log(`  ⚠️  Button clicking failed: ${error.message}`);
  }
}

/**
 * SUPER AGGRESSIVE price scraper
 */
export async function scrapeCompetitorPrices(
  websiteUrl: string,
  competitorName: string
): Promise<ScrapedPrices> {
  console.log(`\n🔍 Scraping prices for: ${competitorName}`);
  console.log(`🌐 Website: ${websiteUrl}`);

  const result: ScrapedPrices = {
    success: false,
    confidence: 0,
    source: websiteUrl,
  };

  if (!websiteUrl || websiteUrl === "#" || !websiteUrl.startsWith("http")) {
    console.log(`⚠️  No valid website URL`);
    return result;
  }

  // ONLY filter out Google search/maps URLs (not real websites)
  const invalidUrlPatterns = [
    'google.com/search',
    'google.com/maps',
  ];

  if (invalidUrlPatterns.some(pattern => websiteUrl.includes(pattern))) {
    console.log(`⚠️  Skipping Google search/maps URL`);
    return result;
  }

  // Special handling for social media (Facebook, Instagram) - these are valid but need different approach
  const isFacebook = websiteUrl.includes('facebook.com');
  const isInstagram = websiteUrl.includes('instagram.com');
  
  if (isFacebook || isInstagram) {
    console.log(`  📱 Social media page detected, using simplified extraction`);
  }

  let page;
  try {
    page = await createPage();
    let bestServices: ServicePrice[] = [];
    let successfulUrl = "";

    // STEP 1: Try different approaches based on URL type
    const pathsToTry = (isFacebook || isInstagram) 
      ? [""] // Social media: just try the main page
      : SERVICE_PAGE_PATHS; // Regular websites: try all paths

    for (const path of pathsToTry) {
      try {
        const tryUrl = path === "" ? websiteUrl : `${websiteUrl.replace(/\/$/, "")}${path}`;
        console.log(`  🔎 Trying: ${tryUrl}`);
        
        const success = await navigateToUrl(page, tryUrl, 3);
        if (!success) continue;

        // Wait for any dynamic content (longer for social media)
        await new Promise(resolve => setTimeout(resolve, isFacebook || isInstagram ? 4000 : 3000));

        // CLICK "SEE MORE" / "LOAD MORE" / "VIEW ALL" BUTTONS
        if (!isFacebook && !isInstagram) {
          await clickExpandButtons(page);
        }

        const htmlContent = await page.content();
        console.log(`  ✅ Loaded: ${tryUrl} (${Math.round(htmlContent.length / 1024)}KB)`);

        // Extract services
        const services = await extractAllServices(page, htmlContent, tryUrl);
        console.log(`  📊 Found ${services.length} services with prices`);

        if (services.length > bestServices.length) {
          bestServices = services;
          successfulUrl = tryUrl;
        }

        // If we found good data, stop
        if (services.length >= 2) {
          console.log(`  ✨ Found enough services, stopping search`);
          break;
        }
      } catch (error: any) {
        console.log(`  ❌ Failed ${path}: ${error.message}`);
      }
    }

    // STEP 2: If no luck, try finding and clicking buttons/links (skip for social media)
    if (bestServices.length < 2 && !isFacebook && !isInstagram) {
      console.log(`  🔗 Looking for service/pricing/menu links and buttons...`);
      try {
        await navigateToUrl(page, websiteUrl, 3);
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Find ALL links and buttons with relevant keywords
        const linksAndButtons = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll("a, button"));
          return elements
            .map(el => {
              const text = (el.textContent?.toLowerCase() || "").trim();
              const href = (el as HTMLAnchorElement).href || el.getAttribute('onclick') || "";
              return { text, href };
            })
            .filter(item => {
              const combined = (item.text + " " + item.href).toLowerCase();
              return (
                combined.includes("service") || 
                combined.includes("price") || 
                combined.includes("pricing") ||
                combined.includes("menu") ||
                combined.includes("book") ||
                combined.includes("rates") ||
                combined.includes("appointment")
              ) && item.href && !item.href.includes("#");
            });
        });

        console.log(`  📌 Found ${linksAndButtons.length} potential links/buttons`);

        // Try the first 5 links
        for (const item of linksAndButtons.slice(0, 5)) {
          try {
            console.log(`  🔗 Following: "${item.text}" -> ${item.href}`);
            await navigateToUrl(page, item.href, 2);
            await new Promise(resolve => setTimeout(resolve, 1500));

            // CLICK "SEE MORE" BUTTONS
            await clickExpandButtons(page);

            const htmlContent = await page.content();
            const services = await extractAllServices(page, htmlContent, item.href);
            console.log(`  📊 Found ${services.length} services from link`);

            if (services.length > bestServices.length) {
              bestServices = services;
              successfulUrl = item.href;
            }

            // If we have at least 2 services, it's good enough
            if (services.length >= 2) break;
          } catch (error: any) {
            console.log(`  ❌ Failed: ${error.message}`);
          }
        }
      } catch (error: any) {
        console.log(`  ❌ Link following failed: ${error.message}`);
      }
    }

    // Process results
    if (bestServices.length === 0) {
      console.log(`❌ No prices found for ${competitorName}`);
      return result;
    }

    console.log(`\n✅ Total services extracted: ${bestServices.length}`);
    bestServices.forEach(s => {
      console.log(`   - ${s.serviceName}: $${s.price} (${s.serviceType})`);
    });

    // Map to gel/pedicure/acrylic
    const gelServices = bestServices.filter(s => 
      s.serviceType === "gel" || SERVICE_KEYWORDS.gel.some(kw => s.serviceName.toLowerCase().includes(kw))
    );
    const pedicureServices = bestServices.filter(s => 
      s.serviceType === "pedicure" || SERVICE_KEYWORDS.pedicure.some(kw => s.serviceName.toLowerCase().includes(kw))
    );
    const acrylicServices = bestServices.filter(s => 
      s.serviceType === "acrylic" || SERVICE_KEYWORDS.acrylic.some(kw => s.serviceName.toLowerCase().includes(kw))
    );

    // Use MEDIAN price (more representative than average)
    result.gel = gelServices.length > 0 ? median(gelServices.map(s => s.price)) : undefined;
    result.pedicure = pedicureServices.length > 0 ? median(pedicureServices.map(s => s.price)) : undefined;
    result.acrylic = acrylicServices.length > 0 ? median(acrylicServices.map(s => s.price)) : undefined;

    result.confidence = (gelServices.length > 0 ? 1 : 0) + (pedicureServices.length > 0 ? 1 : 0) + (acrylicServices.length > 0 ? 1 : 0);
    result.confidence = result.confidence / 3;
    result.success = result.confidence > 0;
    result.source = successfulUrl;
    result.allServices = bestServices;

    console.log(`\n✅ Final results for ${competitorName}:`);
    console.log(`   Gel: $${result.gel || "N/A"} (from ${gelServices.length} services)`);
    console.log(`   Pedicure: $${result.pedicure || "N/A"} (from ${pedicureServices.length} services)`);
    console.log(`   Acrylic: $${result.acrylic || "N/A"} (from ${acrylicServices.length} services)`);
    console.log(`   Confidence: ${Math.round(result.confidence * 100)}%\n`);

  } catch (error: any) {
    console.error(`❌ Error scraping ${competitorName}:`, error.message);
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }

  return result;
}

/**
 * Calculate median
 */
function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : Math.round(sorted[mid]);
}

/**
 * SUPER SIMPLE: Just find prices near service keywords (like a human would)
 */
async function extractAllServices(page: any, html: string, url: string): Promise<ServicePrice[]> {
  const services: ServicePrice[] = [];
  const seen = new Set<string>();

  // DEAD SIMPLE METHOD: Get all text, split by lines, find patterns
  try {
    console.log(`    🔍 Extracting all text from page...`);
    
    const allText = await page.evaluate(() => document.body.innerText || document.body.textContent);
    const lines = allText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 5);
    
    console.log(`    📄 Found ${lines.length} lines of text to analyze`);
    
    // Look through each line for service + price patterns
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      // Skip lines that are clearly not services
      if (line.length > 200) continue;
      if (!lineLower.match(/\d/) || !lineLower.match(/[a-z]/i)) continue;
      
      // Find ALL dollar amounts in this line
      const priceMatches = line.match(/\$?\s*(\d{2,3})(?:\.\d{2})?/g);
      if (!priceMatches) continue;
      
      // Check if line contains service keywords (VERY BROAD)
      const hasGel = lineLower.includes('gel') || lineLower.includes('shellac') || 
                     (lineLower.includes('color') && !lineLower.includes('acrylic'));
      const hasPedicure = lineLower.includes('pedicure') || lineLower.includes('pedi') || 
                          lineLower.includes('foot spa');
      const hasAcrylic = lineLower.includes('acrylic') || lineLower.includes('full set') || 
                         lineLower.includes('pink and white') || lineLower.includes('ombre') ||
                         (lineLower.includes('fill') && !lineLower.includes('color fill'));
      
      if (!hasGel && !hasPedicure && !hasAcrylic) continue;
      
      // Only skip if it's ONLY removal/repair (not a real service)
      const skipKeywords = ['removal only', 'repair only', 'soak off only', 'per nail', 'each nail', 'add-on'];
      if (skipKeywords.some(kw => lineLower.includes(kw))) continue;
      
      // Allow "Acrylic Fill", "Color Fill" (these are valid services)
      
      // Extract the first valid price
      let price = 0;
      for (const match of priceMatches) {
        const num = parseInt(match.replace(/\D/g, ''));
        if (num >= 20 && num <= 200) {
          price = num;
          break;
        }
      }
      
      if (price === 0) continue;
      
      // Determine service type
      let serviceType = 'other';
      if (hasGel) serviceType = 'gel';
      else if (hasPedicure) serviceType = 'pedicure';
      else if (hasAcrylic) serviceType = 'acrylic';
      
      // Avoid duplicates
      const key = `${serviceType}-${price}`;
      if (seen.has(key)) continue;
      seen.add(key);
      
      services.push({
        serviceName: line.substring(0, 80),
        serviceType,
        price,
        confidence: 0.9,
        source: "simple-text-scan"
      });
      
      console.log(`    ✅ Found: ${serviceType} - $${price} from "${line.substring(0, 40)}..."`);
    }
    
    console.log(`    🎯 SIMPLE METHOD: Extracted ${services.length} services`);
    
  } catch (error: any) {
    console.log(`    ⚠️  Simple extraction failed: ${error.message}`);
  }

  return services;
}

/**
 * Batch scrape multiple competitors (with concurrency limit)
 */
export async function batchScrapeCompetitors(
  competitors: Array<{ name: string; website: string }>,
  concurrency: number = 3
): Promise<Map<string, ScrapedPrices>> {
  const results = new Map<string, ScrapedPrices>();
  const queue = [...competitors];

  console.log(`🚀 Starting batch scrape for ${competitors.length} competitors`);

  // Process in batches
  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const batchResults = await Promise.all(
      batch.map(comp => scrapeCompetitorPrices(comp.website, comp.name))
    );

    batch.forEach((comp, idx) => {
      results.set(comp.name, batchResults[idx]);
    });
  }

  // Clean up browser after all scraping is done
  await closeBrowser();

  console.log(`✅ Batch scrape complete: ${results.size} results`);
  return results;
}

