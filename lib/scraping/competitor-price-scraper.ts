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
 * Service keywords to look for
 */
const SERVICE_KEYWORDS = {
  gel: ["gel manicure", "gel polish", "gel nails", "gel color", "shellac"],
  pedicure: ["pedicure", "spa pedicure", "deluxe pedicure", "classic pedicure", "basic pedicure"],
  acrylic: ["acrylic", "full set", "acrylic nails", "acrylic full set", "nail extensions", "acrylics"],
};

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

  let page;
  try {
    page = await createPage();
    let bestServices: ServicePrice[] = [];
    let successfulUrl = "";

    // STEP 1: Try all URL patterns
    for (const path of SERVICE_PAGE_PATHS) {
      try {
        const tryUrl = path === "" ? websiteUrl : `${websiteUrl.replace(/\/$/, "")}${path}`;
        console.log(`  🔎 Trying: ${tryUrl}`);
        
        const success = await navigateToUrl(page, tryUrl, 3);
        if (!success) continue;

        // Wait for any dynamic content
        await page.waitForTimeout(2000);

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
        if (services.length >= 3) {
          console.log(`  ✨ Found enough services, stopping search`);
          break;
        }
      } catch (error: any) {
        console.log(`  ❌ Failed ${path}: ${error.message}`);
      }
    }

    // STEP 2: If no luck, try finding "Services" or "Pricing" links
    if (bestServices.length === 0) {
      console.log(`  🔗 Looking for service/pricing links on homepage...`);
      try {
        await navigateToUrl(page, websiteUrl, 3);
        await page.waitForTimeout(1000);

        // Find links containing service-related keywords
        const links = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll("a"));
          return anchors
            .map(a => ({
              text: a.textContent?.toLowerCase() || "",
              href: a.href,
            }))
            .filter(link => 
              link.href &&
              !link.href.includes("#") &&
              (link.text.includes("service") || 
               link.text.includes("price") || 
               link.text.includes("pricing") ||
               link.text.includes("menu"))
            );
        });

        console.log(`  📌 Found ${links.length} potential service links`);

        // Try the first 3 links
        for (const link of links.slice(0, 3)) {
          try {
            console.log(`  🔗 Following link: "${link.text}" -> ${link.href}`);
            await navigateToUrl(page, link.href, 3);
            await page.waitForTimeout(2000);

            const htmlContent = await page.content();
            const services = await extractAllServices(page, htmlContent, link.href);
            console.log(`  📊 Found ${services.length} services from link`);

            if (services.length > bestServices.length) {
              bestServices = services;
              successfulUrl = link.href;
            }

            if (services.length >= 3) break;
          } catch (error: any) {
            console.log(`  ❌ Failed link: ${error.message}`);
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
 * ULTRA AGGRESSIVE: Extract ALL possible services from page
 */
async function extractAllServices(page: any, html: string, url: string): Promise<ServicePrice[]> {
  const services: ServicePrice[] = [];
  const seen = new Set<string>();

  // METHOD 1: Parse visible text with Puppeteer
  try {
    const visibleServices = await page.evaluate(() => {
      const results: any[] = [];
      const elements = document.querySelectorAll("*");
      
      elements.forEach((el: any) => {
        const text = el.innerText || el.textContent;
        if (!text || text.length > 300 || text.length < 5) return;

        // Look for price patterns
        const priceRegex = /\$\s*(\d{2,3}(?:\.\d{2})?)/g;
        const matches = text.match(priceRegex);
        
        if (matches && matches.length > 0) {
          // Check if text contains service keywords
          const lower = text.toLowerCase();
          if (lower.includes("gel") || lower.includes("pedicure") || 
              lower.includes("acrylic") || lower.includes("manicure") ||
              lower.includes("nails")) {
            results.push({
              text: text.trim(),
              prices: matches
            });
          }
        }
      });
      
      return results;
    });

    console.log(`    🔍 METHOD 1: Found ${visibleServices.length} elements with prices`);

    for (const item of visibleServices) {
      const prices = extractPrices(item.text);
      if (prices.length === 0) continue;

      const serviceType = detectServiceType(item.text);
      if (serviceType === "other") continue;

      // Validate price range
      const validPrices = prices.filter(p => p >= 20 && p <= 250);
      if (validPrices.length === 0) continue;

      const key = `${serviceType}-${validPrices[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);

      services.push({
        serviceName: item.text.substring(0, 80).trim(),
        serviceType,
        price: validPrices[0],
        confidence: 0.8,
        source: "puppeteer-eval"
      });
    }
  } catch (error: any) {
    console.log(`    ⚠️  METHOD 1 failed: ${error.message}`);
  }

  // METHOD 2: Cheerio parsing (tables, lists, divs)
  const $ = cheerio.load(html);
  
  // Find all elements that might contain services
  const selectors = [
    "table tr",
    "ul li",
    ".service",
    ".price-item",
    ".menu-item",
    ".price",
    "[class*='service']",
    "[class*='price']",
    "[class*='menu']",
    "div[class*='item']",
  ];

  selectors.forEach(selector => {
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text.length < 10 || text.length > 300) return;

      const prices = extractPrices(text);
      if (prices.length === 0) return;

      const serviceType = detectServiceType(text);
      if (serviceType === "other") return;

      const validPrices = prices.filter(p => p >= 20 && p <= 250);
      if (validPrices.length === 0) return;

      const key = `${serviceType}-${validPrices[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);

      services.push({
        serviceName: text.substring(0, 80).trim(),
        serviceType,
        price: validPrices[0],
        confidence: 0.7,
        source: "cheerio"
      });
    });
  });

  console.log(`    🔍 METHOD 2: Cheerio found ${services.length - (services.filter(s => s.source === "puppeteer-eval").length)} more services`);

  // METHOD 3: RAW text extraction (last resort)
  if (services.length < 3) {
    const plainText = $("body").text();
    const lines = plainText.split("\n").map(l => l.trim()).filter(l => l.length > 10 && l.length < 200);

    for (const line of lines) {
      const prices = extractPrices(line);
      if (prices.length === 0) continue;

      const serviceType = detectServiceType(line);
      if (serviceType === "other") continue;

      const validPrices = prices.filter(p => p >= 20 && p <= 250);
      if (validPrices.length === 0) continue;

      // Check if price is near service keyword (within same line)
      const hasKeyword = Object.values(SERVICE_KEYWORDS).flat().some(kw => 
        line.toLowerCase().includes(kw.toLowerCase())
      );
      if (!hasKeyword) continue;

      const key = `${serviceType}-${validPrices[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);

      services.push({
        serviceName: line.substring(0, 80).trim(),
        serviceType,
        price: validPrices[0],
        confidence: 0.6,
        source: "raw-text"
      });
    }

    console.log(`    🔍 METHOD 3: Raw text found ${services.filter(s => s.source === "raw-text").length} services`);
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

