import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { competitors as mockCompetitors } from "@/lib/mockData";
import { getUserFromToken } from "@/lib/auth";

const searchSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  radius: z.number().min(1).max(50),
  competitorCount: z.number().min(1).max(20),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Optional authentication - allow public access but track if authenticated
    let user = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      user = await getUserFromToken(token);
    }

    const body = await request.json();
      
      // Validate input
      const result = searchSchema.safeParse(body);
      if (!result.success) {
        return errorResponse(
          "Validation error",
          400,
          "VALIDATION_ERROR",
          result.error.issues
        );
      }

      const { address, radius, competitorCount, lat, lng } = result.data;

      // If lat/lng not provided, we need to geocode first
      if (!lat || !lng) {
        return errorResponse(
          "Location coordinates required. Please geocode address first.",
          400,
          "MISSING_COORDINATES"
        );
      }

      // Import Google Maps functions and caching
      const { searchNearbyPlaces, calculateDistance } = await import("@/lib/google-maps");
      const { getCachedPlaceDetailsBatch } = await import("@/lib/place-cache");
      
      // Search for real competitors using Google Places API
      const radiusMeters = Math.round(radius * 1609.34); // Convert miles to meters
      const places = await searchNearbyPlaces(
        { lat, lng },
        radiusMeters,
        "nail salon"
      );

      // Fetch detailed info (including website) using cache
      console.log(`📊 Fetching details for ${places.length} places (with caching)...`);
      const placeIds = places.map(p => p.placeId);
      const detailedPlaces = await getCachedPlaceDetailsBatch(placeIds);

      // Calculate distances and add to results
      const placesWithDistance = detailedPlaces.map((place) => {
        const priceLevel = place.priceLevel || 2;
        const priceRange = priceLevel === 1 ? "$" : priceLevel === 2 ? "$$" : priceLevel === 3 ? "$$$" : "$$$$";
        
        return {
          id: place.placeId,
          name: place.name,
          website: place.website || "#",
          address: place.address,
          location: place.location,
          rating: place.rating || 0,
          reviewCount: place.userRatingsTotal || 0,
          priceRange: priceRange,
          distanceMiles: calculateDistance(lat, lng, place.location.lat, place.location.lng),
          // Placeholder prices - will be replaced with scraped prices
          samplePrices: {
            gel: null,
            pedicure: null,
            acrylic: null,
          },
          staffBand: (place.userRatingsTotal || 0) > 200 ? "8+" : (place.userRatingsTotal || 0) > 100 ? "4-7" : "1-3",
          hoursPerWeek: 50 + Math.floor(Math.random() * 30),
          amenities: ["Wi-Fi", "Wheelchair Accessible", "Parking"].slice(0, Math.floor(Math.random() * 3) + 1),
        };
      });

      // Smart sorting algorithm: Balance quality, popularity, and proximity
      // Score formula: (rating/5) × log(reviews + 1) / distance
      // Higher score = better competitor (popular, well-rated, and reasonably close)
      const competitorsWithScore = placesWithDistance.map(comp => {
        const rating = comp.rating || 3.0;
        const reviews = comp.reviewCount || 1;
        const distance = comp.distanceMiles || 0.1;
        
        // Calculate quality score (0-1)
        const ratingScore = rating / 5;
        
        // Calculate popularity score using logarithm (diminishing returns for reviews)
        const popularityScore = Math.log(reviews + 1);
        
        // Calculate proximity score (inverse of distance)
        const proximityScore = 1 / Math.max(distance, 0.1);
        
        // Combined score (weighted)
        const score = (ratingScore * 10) * (popularityScore * 2) * (proximityScore * 0.5);
        
        return {
          ...comp,
          competitiveScore: Math.round(score * 10) / 10
        };
      });

      // Sort by competitive score (highest first), then by distance as tiebreaker
      competitorsWithScore.sort((a, b) => {
        if (Math.abs(a.competitiveScore - b.competitiveScore) > 1) {
          return b.competitiveScore - a.competitiveScore; // Higher score first
        }
        return a.distanceMiles - b.distanceMiles; // Same score? Closer first
      });
      
      const competitors = competitorsWithScore.slice(0, competitorCount);

      // 🤖 WEB SCRAPING: Extract real prices from competitor websites
      console.log(`🤖 Starting web scraping for ${competitors.length} competitors...`);
      let scrapedPricesMap = new Map();
      
      try {
        const { batchScrapeCompetitors } = await import("@/lib/scraping/competitor-price-scraper");
        
        const scrapingTargets = competitors
          .filter(comp => comp.website && comp.website !== "#")
          .map(comp => ({
            name: comp.name,
            website: comp.website
          }));
        
        console.log(`🎯 ${scrapingTargets.length} competitors have websites to scrape`);
        
        if (scrapingTargets.length > 0) {
          scrapedPricesMap = await batchScrapeCompetitors(scrapingTargets, 3);
          console.log(`✅ Web scraping completed: ${scrapedPricesMap.size} results`);
        } else {
          console.log(`⚠️  No websites to scrape`);
        }
      } catch (scrapingError) {
        console.error("❌ Web scraping failed, falling back to estimates:", scrapingError);
        // Continue with estimated prices if scraping fails
      }
      
      // Merge scraped prices into competitors
      competitors.forEach(comp => {
        const scrapedData = scrapedPricesMap.get(comp.name);
        if (scrapedData && scrapedData.success) {
          console.log(`✅ Using scraped prices for ${comp.name}`);
          comp.samplePrices = {
            gel: scrapedData.gel || null,
            pedicure: scrapedData.pedicure || null,
            acrylic: scrapedData.acrylic || null,
          };
        } else {
          // NO FAKE PRICES - Leave blank if we can't find real ones
          console.log(`⚠️  No real prices found for ${comp.name}, leaving blank`);
          comp.samplePrices = {
            gel: null,
            pedicure: null,
            acrylic: null,
          };
        }
      });

      // Reconnect Prisma after long scraping operation
      try {
        await prisma.$connect();
      } catch (reconnectError) {
        console.error("Prisma reconnect failed:", reconnectError);
      }

      // Save search to database (only if authenticated)
      if (user) {
        try {
          await prisma.savedSearch.create({
            data: {
              userId: user.id,
              searchAddress: address,
              radiusMiles: radius,
              competitorCount: competitors.length,
              results: JSON.parse(JSON.stringify(competitors)), // Convert to JSON
            },
          });
        } catch (dbError) {
          console.error("Failed to save search:", dbError);
          // Continue even if save fails
        }
      }

      // Track API usage (only if authenticated)
      if (user) {
        try {
          await prisma.apiUsage.upsert({
            where: {
              userId_endpoint_date: {
                userId: user.id,
                endpoint: "/api/competitors/search",
                date: new Date(),
              },
            },
            update: {
              requestCount: {
                increment: 1,
              },
            },
            create: {
              userId: user.id,
              endpoint: "/api/competitors/search",
              requestCount: 1,
              date: new Date(),
            },
          });
        } catch (dbError) {
          console.error("Failed to track usage:", dbError);
          // Continue even if tracking fails
        }
      }

      return successResponse({
        competitors,
        searchLocation: { lat, lng },
        meta: {
          searchAddress: address,
          radius,
          count: competitors.length,
          lat,
          lng,
        },
      }, "Competitors found successfully");
  } catch (error) {
    console.error("Search error:", error);
    return errorResponse(
      "Failed to search competitors",
      500,
      "INTERNAL_ERROR"
    );
  }
}



