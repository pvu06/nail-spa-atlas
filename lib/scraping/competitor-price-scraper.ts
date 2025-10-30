import { createPage, navigateToUrl, closeBrowser } from "./browser";
import { extractServicesFromHtml, ServicePrice, extractPrices, detectServiceType } from "./price-extractor";
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
 * Common URL patterns for service/pricing pages
 */
const SERVICE_PAGE_PATHS = [
  "/services",
  "/pricing",
  "/menu",
  "/price-list",
  "/our-services",
  "/nail-services",
  "",  // Sometimes pricing is on homepage
];

/**
 * Scrape prices from a competitor's website
 */
export async function scrapeCompetitorPrices(
  websiteUrl: string,
  competitorName: string
): Promise<ScrapedPrices> {
  console.log(`🔍 Scraping prices for: ${competitorName}`);
  console.log(`🌐 Website: ${websiteUrl}`);

  // Default result
  const result: ScrapedPrices = {
    success: false,
    confidence: 0,
    source: websiteUrl,
  };

  // Skip if no valid website
  if (!websiteUrl || websiteUrl === "#" || !websiteUrl.startsWith("http")) {
    console.log(`⚠️  No valid website URL for ${competitorName}`);
    return result;
  }

  let page;
  try {
    // Create browser page
    page = await createPage();

    // Try different service page paths
    let htmlContent = "";
    let successfulUrl = "";

    for (const path of SERVICE_PAGE_PATHS) {
      try {
        const tryUrl = websiteUrl.endsWith("/") 
          ? `${websiteUrl}${path}`.replace("//", "/")
          : `${websiteUrl}${path}`;
        
        console.log(`  🔎 Trying: ${tryUrl}`);
        
        const success = await navigateToUrl(page, tryUrl, 2);
        if (success) {
          htmlContent = await page.content();
          successfulUrl = tryUrl;
          console.log(`  ✅ Loaded: ${tryUrl}`);
          
          // If we find pricing keywords, stop searching
          const lowerContent = htmlContent.toLowerCase();
          if (
            lowerContent.includes("$") &&
            (lowerContent.includes("gel") || 
             lowerContent.includes("pedicure") || 
             lowerContent.includes("acrylic") ||
             lowerContent.includes("manicure"))
          ) {
            console.log(`  💰 Found pricing information!`);
            break;
          }
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${path}`);
        continue;
      }
    }

    if (!htmlContent) {
      console.log(`❌ Could not load any pages for ${competitorName}`);
      return result;
    }

    // Extract services using price-extractor
    const extractedServices = extractServicesFromHtml(htmlContent, successfulUrl);
    console.log(`  📊 Extracted ${extractedServices.length} services`);

    if (extractedServices.length === 0) {
      // Fallback: Try manual extraction with Cheerio
      const manualServices = extractPricesManually(htmlContent);
      console.log(`  🔧 Manual extraction found ${manualServices.length} services`);
      extractedServices.push(...manualServices);
    }

    // Map services to gel/pedicure/acrylic
    const gelServices = extractedServices.filter(s => 
      s.serviceType === "gel" || s.serviceName.toLowerCase().includes("gel")
    );
    const pedicureServices = extractedServices.filter(s => 
      s.serviceType === "pedicure" || s.serviceName.toLowerCase().includes("pedicure")
    );
    const acrylicServices = extractedServices.filter(s => 
      s.serviceType === "acrylic" || s.serviceName.toLowerCase().includes("acrylic")
    );

    // Calculate average prices
    result.gel = gelServices.length > 0 
      ? Math.round(gelServices.reduce((sum, s) => sum + s.price, 0) / gelServices.length)
      : undefined;
    
    result.pedicure = pedicureServices.length > 0
      ? Math.round(pedicureServices.reduce((sum, s) => sum + s.price, 0) / pedicureServices.length)
      : undefined;
    
    result.acrylic = acrylicServices.length > 0
      ? Math.round(acrylicServices.reduce((sum, s) => sum + s.price, 0) / acrylicServices.length)
      : undefined;

    // Calculate confidence
    const foundServices = [result.gel, result.pedicure, result.acrylic].filter(p => p !== undefined).length;
    result.confidence = foundServices / 3; // 0-1 score based on how many we found
    result.success = foundServices > 0;
    result.allServices = extractedServices;

    console.log(`✅ Scraped ${competitorName}:`, {
      gel: result.gel,
      pedicure: result.pedicure,
      acrylic: result.acrylic,
      confidence: result.confidence
    });

  } catch (error) {
    console.error(`❌ Error scraping ${competitorName}:`, error);
  } finally {
    // Clean up
    if (page) {
      await page.close().catch(e => console.error("Error closing page:", e));
    }
  }

  return result;
}

/**
 * Manual extraction fallback using Cheerio
 */
function extractPricesManually(html: string): ServicePrice[] {
  const $ = cheerio.load(html);
  const services: ServicePrice[] = [];

  // Look for common pricing table structures
  $("table tr, ul li, .service, .price-item, .menu-item").each((_, element) => {
    const text = $(element).text();
    
    // Skip if too short or too long
    if (text.length < 10 || text.length > 200) return;

    // Look for price patterns
    const priceMatches = text.match(/\$\s*(\d+(?:\.\d{2})?)/g);
    if (!priceMatches || priceMatches.length === 0) return;

    // Detect service type
    const serviceType = detectServiceType(text);
    if (serviceType === "other") return;

    // Extract first price
    const priceStr = priceMatches[0].replace("$", "").trim();
    const price = parseFloat(priceStr);

    if (price > 0 && price < 500) {
      services.push({
        serviceName: text.substring(0, 50).trim(),
        serviceType,
        price,
        confidence: 0.6,
        source: "manual-extraction"
      });
    }
  });

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

