#!/usr/bin/env ts-node

/**
 * Startup script to initialize the competitor crawler system
 * This script sets up the cron jobs and performs an initial crawl
 */

import { cronManager } from "../lib/crawler/cron-manager";
import { crawlCompetitors } from "../lib/crawler/competitor-crawler";

async function main() {
  console.log("🚀 Starting Spa Atlas Competitor Crawler System");
  console.log("=" .repeat(50));

  try {
    // Target location: Aventus Nail Spa
    const targetLocation = {
      name: "Aventus Nail Spa",
      address: "94 Meadow Park Ave, Lewis Center, OH, United States",
      lat: 40.1584, // Lewis Center, OH coordinates
      lng: -83.0075,
      radius: 5000 // 5km radius
    };

    console.log(`📍 Target Location: ${targetLocation.name}`);
    console.log(`🏠 Address: ${targetLocation.address}`);
    console.log(`📏 Search Radius: ${targetLocation.radius}m (5km)`);
    console.log();

    // Start cron jobs
    console.log("⏰ Starting automated cron jobs...");
    cronManager.startAll();
    console.log("✅ Cron jobs started successfully");
    console.log();

    // Perform initial manual crawl
    console.log("🔍 Performing initial competitor discovery...");
    const results = await crawlCompetitors(targetLocation, {
      deepCrawl: true,
      takeScreenshots: true,
      includeReviews: true,
      includeSocialMedia: true,
      includeSeoAnalysis: true
    });

    console.log();
    console.log("📊 Initial Crawl Results:");
    console.log(`   • Competitors Found: ${results.competitors.length}`);
    console.log(`   • Successfully Processed: ${results.processed}`);
    console.log(`   • Errors: ${results.errors}`);
    console.log(`   • Total Time: ${(results.totalTime / 1000).toFixed(2)}s`);
    console.log();

    if (results.competitors.length > 0) {
      console.log("🏪 Discovered Competitors:");
      results.competitors.forEach((competitor, index) => {
        console.log(`   ${index + 1}. ${competitor.name}`);
        console.log(`      📍 ${competitor.address}`);
        console.log(`      ⭐ Rating: ${competitor.googleRating || 'N/A'} (${competitor.googleReviewCount || 0} reviews)`);
        console.log(`      🌐 Website: ${competitor.website || 'N/A'}`);
        console.log(`      📞 Phone: ${competitor.phone || 'N/A'}`);
        console.log(`      🔍 Status: ${competitor.crawlStatus}`);
        if (competitor.crawlErrors && competitor.crawlErrors.length > 0) {
          console.log(`      ⚠️  Errors: ${competitor.crawlErrors.join(', ')}`);
        }
        console.log();
      });
    }

    console.log("🎉 Crawler system initialized successfully!");
    console.log();
    console.log("📋 Next Steps:");
    console.log("   1. Monitor the dashboard at /crawler");
    console.log("   2. Check crawl logs for any issues");
    console.log("   3. Review discovered competitors");
    console.log("   4. Set up alerts for new competitors");
    console.log();
    console.log("⏰ Scheduled Crawls:");
    console.log("   • Daily crawl: 2:00 AM EST");
    console.log("   • Weekly deep crawl: 3:00 AM EST (Sundays)");
    console.log("   • Hourly monitoring: Every hour");
    console.log();
    console.log("🛑 To stop the crawler system, run: npm run crawler:stop");

  } catch (error) {
    console.error("❌ Failed to initialize crawler system:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log("\n🛑 Shutting down crawler system...");
  cronManager.stopAll();
  console.log("✅ Crawler system stopped");
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log("\n🛑 Shutting down crawler system...");
  cronManager.stopAll();
  console.log("✅ Crawler system stopped");
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
