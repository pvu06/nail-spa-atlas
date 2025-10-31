import { createPage, navigateToUrl, closeBrowser } from "./browser";
import { ServicePrice } from "./price-extractor";

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
 * SMART MULTI-STRATEGY SCRAPER
 * Strategy 1: Look for booking buttons (Book Online, Schedule) → booking platforms
 * Strategy 2: Traditional service pages (/services, /pricing)
 * Strategy 3: Social media (Facebook/Instagram)
 */
export async function smartScrapeCompetitorPrices(
  websiteUrl: string,
  competitorName: string
): Promise<ScrapedPrices> {
  console.log(`\n🧠 SMART SCRAPER for: ${competitorName}`);
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

  if (websiteUrl.includes('google.com/search') || websiteUrl.includes('google.com/maps')) {
    console.log(`⚠️  Skipping Google search/maps URL`);
    return result;
  }

  let page;
  try {
    page = await createPage();
    let bestServices: ServicePrice[] = [];

    // ==================== STRATEGY 1: BOOKING BUTTONS ====================
    console.log(`\n📱 STRATEGY 1: Looking for "Book Online" buttons...`);
    const bookingServices = await tryBookingButtons(page, websiteUrl);
    if (bookingServices.length >= 2) {
      console.log(`✅ SUCCESS via booking button! Found ${bookingServices.length} services`);
      bestServices = bookingServices;
    }

    // ==================== STRATEGY 2: TRADITIONAL PAGES ====================
    if (bestServices.length < 2) {
      console.log(`\n📄 STRATEGY 2: Trying traditional service pages...`);
      const traditionalServices = await tryTraditionalPages(page, websiteUrl);
      if (traditionalServices.length > bestServices.length) {
        bestServices = traditionalServices;
      }
    }

    // ==================== FINALIZE RESULTS ====================
    if (bestServices.length === 0) {
      console.log(`❌ No prices found for ${competitorName}`);
      return result;
    }

    // Group by service type
    const gelServices = bestServices.filter(s => 
      s.serviceType === 'gel' || s.serviceName.toLowerCase().includes('gel')
    );
    const pedicureServices = bestServices.filter(s => 
      s.serviceType === 'pedicure' || s.serviceName.toLowerCase().includes('pedicure')
    );
    const acrylicServices = bestServices.filter(s => 
      s.serviceType === 'acrylic' || s.serviceName.toLowerCase().includes('acrylic')
    );

    result.gel = gelServices.length > 0 ? median(gelServices.map(s => s.price)) : undefined;
    result.pedicure = pedicureServices.length > 0 ? median(pedicureServices.map(s => s.price)) : undefined;
    result.acrylic = acrylicServices.length > 0 ? median(acrylicServices.map(s => s.price)) : undefined;

    result.confidence = (gelServices.length > 0 ? 1 : 0) + (pedicureServices.length > 0 ? 1 : 0) + (acrylicServices.length > 0 ? 1 : 0);
    result.confidence = result.confidence / 3;
    result.success = result.confidence > 0;
    result.allServices = bestServices;

    console.log(`\n✅ Final results for ${competitorName}:`);
    console.log(`   Gel: $${result.gel || "N/A"}`);
    console.log(`   Pedicure: $${result.pedicure || "N/A"}`);
    console.log(`   Acrylic: $${result.acrylic || "N/A"}\n`);

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
 * STRATEGY 1: Try booking buttons (HIGHEST SUCCESS RATE)
 */
async function tryBookingButtons(page: any, websiteUrl: string): Promise<ServicePrice[]> {
  try {
    await navigateToUrl(page, websiteUrl, 3);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find booking buttons
    const bookingLinks = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("a, button"));
      return elements
        .map(el => {
          const text = (el.textContent?.toLowerCase() || "").trim();
          const href = (el as HTMLAnchorElement).href || "";
          return { text, href };
        })
        .filter(item => {
          const combined = item.text + " " + item.href;
          return (
            (combined.includes("book") && (combined.includes("online") || combined.includes("now"))) ||
            combined.includes("schedule") ||
            combined.includes("reserve") ||
            combined.includes("appointment")
          ) && item.href && item.href.startsWith("http") && !item.href.includes("#");
        });
    });

    console.log(`  📍 Found ${bookingLinks.length} booking links`);

    for (const link of bookingLinks.slice(0, 2)) {
      console.log(`  🎯 Clicking: "${link.text}" → ${link.href}`);
      
      const success = await navigateToUrl(page, link.href, 3);
      if (!success) continue;

      // Wait LONGER for booking systems (JavaScript heavy!)
      console.log(`  ⏳ Waiting 8 seconds for booking system...`);
      await new Promise(resolve => setTimeout(resolve, 8000));

      const currentUrl = page.url();
      
      // Platform-specific extraction
      let services: ServicePrice[] = [];
      if (currentUrl.includes('chronos')) {
        console.log(`  🎪 byChronos detected!`);
        services = await extractFromByChronos(page);
      } else if (currentUrl.includes('vagaro')) {
        console.log(`  🎪 Vagaro detected!`);
        services = await extractFromVagaro(page);
      } else {
        console.log(`  🔍 Generic extraction`);
        services = await extractSimple(page);
      }

      console.log(`  📊 Found ${services.length} services`);
      if (services.length >= 2) return services;
    }

    return [];
  } catch (error: any) {
    console.log(`  ❌ Booking button failed: ${error.message}`);
    return [];
  }
}

/**
 * STRATEGY 2: Traditional service pages
 */
async function tryTraditionalPages(page: any, websiteUrl: string): Promise<ServicePrice[]> {
  const paths = ["", "/services", "/pricing", "/menu", "/price-list"];
  let bestServices: ServicePrice[] = [];

  for (const path of paths) {
    try {
      const tryUrl = path === "" ? websiteUrl : `${websiteUrl.replace(/\/$/, "")}${path}`;
      console.log(`  🔎 Trying: ${tryUrl}`);
      
      const success = await navigateToUrl(page, tryUrl, 3);
      if (!success) continue;

      await new Promise(resolve => setTimeout(resolve, 3000));

      const services = await extractSimple(page);
      console.log(`  📊 Found ${services.length} services`);

      if (services.length > bestServices.length) {
        bestServices = services;
      }

      if (services.length >= 2) break;
    } catch (error: any) {
      console.log(`  ❌ Failed ${path}`);
    }
  }

  return bestServices;
}

/**
 * Extract from byChronos booking system
 */
async function extractFromByChronos(page: any): Promise<ServicePrice[]> {
  try {
    console.log(`    🔍 Extracting from byChronos...`);
    
    const extractionResult = await page.evaluate(() => {
      const results: any[] = [];
      const buttons = Array.from(document.querySelectorAll("button"));
      const debugInfo: any = { buttonCount: buttons.length, foundServices: [] };
      
      buttons.forEach((button: any) => {
        const text = button.textContent || "";
        // Format: "Service Name Duration $Price"
        const priceMatch = text.match(/\$(\d+)/);
        if (priceMatch) {
          const price = parseInt(priceMatch[1]);
          const lower = text.toLowerCase();
          
          let type = "other";
          if (lower.includes("gel")) type = "gel";
          else if (lower.includes("pedicure") || lower.includes("pedi")) type = "pedicure";
          else if (lower.includes("acrylic") || lower.includes("uv gel") || lower.includes("extension")) type = "acrylic";
          
          if (type !== "other" && price >= 15 && price <= 250) {
            debugInfo.foundServices.push(`${text.substring(0, 50)} → ${type} $${price}`);
            results.push({
              serviceName: text.split("$")[0].trim(),
              serviceType: type,
              price,
              confidence: 0.95,
              source: "bychronos"
            });
          }
        }
      });
      
      return { services: results, debug: debugInfo };
    });

    console.log(`    📊 byChronos: Found ${extractionResult.debug.buttonCount} buttons, extracted ${extractionResult.services.length} services`);
    if (extractionResult.services.length > 0) {
      extractionResult.debug.foundServices.forEach((s: string) => console.log(`      ✅ ${s}`));
    }
    return extractionResult.services;
  } catch (error: any) {
    console.log(`    ❌ byChronos extraction failed: ${error.message}`);
    return [];
  }
}

/**
 * Extract from Vagaro booking system (ULTRA AGGRESSIVE)
 */
async function extractFromVagaro(page: any): Promise<ServicePrice[]> {
  try {
    console.log(`    🔍 Extracting from Vagaro...`);
    
    const extractionResult = await page.evaluate(() => {
      const results: any[] = [];
      const allText = document.body.innerText || document.body.textContent || "";
      const lines = allText.split("\n").filter(l => l.trim().length > 0);
      
      const seen = new Set();
      let priceCount = 0;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length < 5 || trimmed.length > 200) continue;
        
        // Look for ANY price
        const priceMatch = trimmed.match(/\$\s*(\d{2,3})/);
        if (!priceMatch) continue;
        
        priceCount++;
        const price = parseInt(priceMatch[1]);
        if (price < 15 || price > 250) continue;
        
        const lower = trimmed.toLowerCase();
        
        // Be VERY permissive
        let type = "other";
        if (lower.includes("gel") || lower.includes("shellac")) type = "gel";
        else if (lower.includes("pedicure") || lower.includes("pedi") || lower.includes("foot")) type = "pedicure";
        else if (lower.includes("acrylic") || lower.includes("full set") || lower.includes("extension") || lower.includes("tips")) type = "acrylic";
        
        if (type !== "other") {
          const key = `${type}-${price}`;
          if (seen.has(key)) continue;
          seen.add(key);
          
          results.push({
            serviceName: trimmed.split("$")[0].trim().substring(0, 60),
            serviceType: type,
            price,
            confidence: 0.85,
            source: "vagaro"
          });
        }
      }
      
      return { services: results, debug: { totalLines: lines.length, totalPrices: priceCount, matchedServices: results.length } };
    });

    console.log(`    📊 Vagaro: Found ${extractionResult.debug.totalLines} lines, ${extractionResult.debug.totalPrices} prices, ${extractionResult.services.length} matched`);
    return extractionResult.services;
  } catch (error: any) {
    console.log(`    ❌ Vagaro extraction failed: ${error.message}`);
    return [];
  }
}

/**
 * Simple extraction (fallback) - ULTRA AGGRESSIVE
 */
async function extractSimple(page: any): Promise<ServicePrice[]> {
  try {
    console.log(`    🔍 Using simple extraction...`);
    
    const extractionResult = await page.evaluate(() => {
      const results: any[] = [];
      const allText = document.body.innerText || document.body.textContent || "";
      const lines = allText.split("\n").map(l => l.trim()).filter(l => l.length > 3);
      
      const seen = new Set<string>();
      let totalPrices = 0;
      
      for (const line of lines) {
        if (line.length > 300) continue; // Skip very long lines
        
        const lower = line.toLowerCase();
        const priceMatch = line.match(/\$\s*(\d{2,3})/);
        
        if (!priceMatch) continue;
        totalPrices++;
        
        const price = parseInt(priceMatch[1]);
        if (price < 15 || price > 250) continue;
        
        // VERY permissive detection
        const hasGel = lower.includes("gel") || lower.includes("shellac") || lower.includes("polish");
        const hasPedi = lower.includes("pedicure") || lower.includes("pedi") || lower.includes("foot");
        const hasAcrylic = lower.includes("acrylic") || lower.includes("full set") || lower.includes("extension") || 
                           lower.includes("tips") || lower.includes("sculpt") || lower.includes("pink") || lower.includes("ombre");
        
        if (!hasGel && !hasPedi && !hasAcrylic) continue;
        
        let type = "other";
        if (hasGel) type = "gel";
        else if (hasPedi) type = "pedicure";
        else if (hasAcrylic) type = "acrylic";
        
        const key = `${type}-${price}`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        results.push({
          serviceName: line.substring(0, 60),
          serviceType: type,
          price,
          confidence: 0.7,
          source: "simple"
        });
      }
      
      return { services: results, debug: { totalLines: lines.length, totalPrices, matchedServices: results.length } };
    });

    console.log(`    📊 Simple: Found ${extractionResult.debug.totalLines} lines, ${extractionResult.debug.totalPrices} prices, ${extractionResult.services.length} matched`);
    return extractionResult.services;
  } catch (error: any) {
    console.log(`    ❌ Simple extraction failed: ${error.message}`);
    return [];
  }
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
 * Batch scrape multiple competitors
 */
export async function batchSmartScrape(
  competitors: Array<{ name: string; website: string }>,
  concurrency: number = 3
): Promise<Map<string, ScrapedPrices>> {
  const results = new Map<string, ScrapedPrices>();
  const queue = [...competitors];

  console.log(`🚀 Starting SMART batch scrape for ${competitors.length} competitors\n`);

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const batchResults = await Promise.all(
      batch.map(comp => smartScrapeCompetitorPrices(comp.website, comp.name))
    );

    batch.forEach((comp, idx) => {
      results.set(comp.name, batchResults[idx]);
    });
  }

  await closeBrowser();

  console.log(`\n✅ SMART batch scrape complete: ${results.size} results`);
  return results;
}

