"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Lightbulb,
  DollarSign,
  Star,
  MapPin
} from "lucide-react";
import { motion } from "framer-motion";

interface Competitor {
  name: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  samplePrices: {
    gel: number;
    pedicure: number;
    acrylic: number;
  };
  distanceMiles: number;
  amenities: string[];
}

interface AIInsightsProps {
  competitors: Competitor[];
}

export function AIInsights({ competitors }: AIInsightsProps) {
  // AI Analysis Functions
  const analyzePricing = () => {
    const avgGel = competitors.reduce((sum, c) => sum + c.samplePrices.gel, 0) / competitors.length;
    const avgPedicure = competitors.reduce((sum, c) => sum + c.samplePrices.pedicure, 0) / competitors.length;
    const avgAcrylic = competitors.reduce((sum, c) => sum + c.samplePrices.acrylic, 0) / competitors.length;
    
    return {
      avgGel: Math.round(avgGel),
      avgPedicure: Math.round(avgPedicure),
      avgAcrylic: Math.round(avgAcrylic)
    };
  };

  const findTopCompetitor = () => {
    return competitors.reduce((top, curr) => {
      const topScore = top.rating * Math.log(top.reviewCount + 1) / top.distanceMiles;
      const currScore = curr.rating * Math.log(curr.reviewCount + 1) / curr.distanceMiles;
      return currScore > topScore ? curr : top;
    }, competitors[0]);
  };

  const analyzeMarketGap = () => {
    const priceRanges = competitors.map(c => c.priceRange);
    const hasLowEnd = priceRanges.includes('$');
    const hasMidRange = priceRanges.includes('$$');
    const hasHighEnd = priceRanges.includes('$$$') || priceRanges.includes('$$$$');
    
    if (!hasLowEnd) return { segment: 'Budget', symbol: '$' };
    if (!hasMidRange) return { segment: 'Mid-Range', symbol: '$$' };
    if (!hasHighEnd) return { segment: 'Premium', symbol: '$$$' };
    return null;
  };

  const findCommonAmenities = () => {
    const amenityCounts: Record<string, number> = {};
    competitors.forEach(c => {
      c.amenities.forEach(a => {
        amenityCounts[a] = (amenityCounts[a] || 0) + 1;
      });
    });
    
    return Object.entries(amenityCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / competitors.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const findWeakCompetitors = () => {
    return competitors.filter(c => c.rating < 4.0).length;
  };

  // ===== ADVANCED AI ANALYSIS =====

  // 1. Market Opportunity Score (0-100)
  const calculateMarketOpportunity = () => {
    const avgRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length;
    const avgReviews = competitors.reduce((sum, c) => sum + c.reviewCount, 0) / competitors.length;
    const lowRatedCount = competitors.filter(c => c.rating < 4.0).length;
    const density = competitors.length / (Math.PI * Math.pow(competitors[0]?.distanceMiles || 5, 2));
    
    // Scoring factors
    const qualityGap = Math.max(0, (4.5 - avgRating) * 20); // Low quality = opportunity
    const weakCompetition = (lowRatedCount / competitors.length) * 30;
    const marketSaturation = Math.max(0, 30 - (density * 10)); // Low density = opportunity
    const reviewMaturity = Math.min(30, (avgReviews / 100) * 10); // Established market
    
    const score = Math.min(100, Math.round(qualityGap + weakCompetition + marketSaturation + reviewMaturity));
    
    let rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    if (score >= 75) rating = 'Excellent';
    else if (score >= 60) rating = 'Good';
    else if (score >= 40) rating = 'Fair';
    else rating = 'Poor';
    
    return { score, rating, avgRating, lowRatedCount, density: density.toFixed(2) };
  };

  // 2. Price-Quality Matrix
  const analyzePriceQuality = () => {
    const matrix = competitors.map(c => ({
      name: c.name,
      rating: c.rating,
      avgPrice: (c.samplePrices.gel + c.samplePrices.pedicure + c.samplePrices.acrylic) / 3,
      value: c.rating / ((c.samplePrices.gel + c.samplePrices.pedicure + c.samplePrices.acrylic) / 3) * 100
    }));

    const bestValue = matrix.reduce((best, curr) => curr.value > best.value ? curr : best);
    const overpriced = matrix.filter(c => c.rating < 4.0 && c.avgPrice > 40);
    const premium = matrix.filter(c => c.rating >= 4.5 && c.avgPrice > 50);
    
    return { bestValue, overpriced, premium, matrix };
  };

  // 3. Geographic Gap Analysis
  const analyzeGeographicGaps = () => {
    if (competitors.length < 3) return null;
    
    const distances = competitors.map(c => c.distanceMiles).sort((a, b) => a - b);
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const maxGap = Math.max(...distances.slice(1).map((d, i) => d - distances[i]));
    
    const nearbyCount = competitors.filter(c => c.distanceMiles < 1).length;
    const midRangeCount = competitors.filter(c => c.distanceMiles >= 1 && c.distanceMiles < 3).length;
    const farCount = competitors.filter(c => c.distanceMiles >= 3).length;
    
    let recommendation = '';
    if (nearbyCount === 0) recommendation = 'High opportunity in immediate area (< 1 mi)';
    else if (midRangeCount < 2) recommendation = 'Consider mid-range location (1-3 mi radius)';
    else if (farCount > competitors.length / 2) recommendation = 'Market is geographically dispersed';
    else recommendation = 'Saturated within 1-3 mile radius';
    
    return { avgDistance: avgDistance.toFixed(1), maxGap: maxGap.toFixed(1), nearbyCount, midRangeCount, farCount, recommendation };
  };

  // 4. Service Differentiation Opportunities
  const analyzeServiceGaps = () => {
    const allAmenities = competitors.flatMap(c => c.amenities);
    const amenitySet = new Set(allAmenities);
    
    // Standard amenities that should be offered
    const standardAmenities = ['Wi-Fi', 'Parking', 'Wheelchair Accessible'];
    const luxuryAmenities = ['Massage Chairs', 'Complimentary Drinks', 'VIP Room', 'Late Hours'];
    
    const missing = standardAmenities.filter(a => !amenitySet.has(a));
    const rare = luxuryAmenities.filter(a => {
      const count = allAmenities.filter(x => x === a).length;
      return count < competitors.length * 0.2; // Less than 20% have it
    });
    
    return { missing, rare, total: amenitySet.size };
  };

  // 5. Growth Trajectory Indicators
  const analyzeGrowthTrajectory = () => {
    const highGrowth = competitors.filter(c => c.reviewCount > 200 && c.rating >= 4.5);
    const declining = competitors.filter(c => c.reviewCount < 50 && c.rating < 4.0);
    const established = competitors.filter(c => c.reviewCount >= 100 && c.reviewCount <= 500);
    const emerging = competitors.filter(c => c.reviewCount < 100 && c.rating >= 4.3);
    
    let marketPhase: 'Mature' | 'Growth' | 'Emerging' | 'Mixed';
    if (established.length > competitors.length * 0.6) marketPhase = 'Mature';
    else if (emerging.length > competitors.length * 0.4) marketPhase = 'Emerging';
    else if (highGrowth.length > 2) marketPhase = 'Growth';
    else marketPhase = 'Mixed';
    
    return { highGrowth, declining, established, emerging, marketPhase };
  };

  // Perform Analysis
  const pricing = analyzePricing();
  const topCompetitor = findTopCompetitor();
  const marketGap = analyzeMarketGap();
  const commonAmenities = findCommonAmenities();
  const weakCompetitors = findWeakCompetitors();
  const avgRating = (competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length).toFixed(1);
  
  // Advanced Analysis
  const marketOpportunity = calculateMarketOpportunity();
  const priceQuality = analyzePriceQuality();
  const geoGaps = analyzeGeographicGaps();
  const serviceGaps = analyzeServiceGaps();
  const growthTrend = analyzeGrowthTrajectory();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="w-full rounded-2xl shadow-lg border-2 border-gray-300 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Sparkles className="h-6 w-6 text-gray-700" />
            AI-Powered Insights
          </CardTitle>
          <p className="text-sm text-gray-600">Smart analysis and recommendations based on your competitive landscape</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ===== EXECUTIVE SUMMARY ===== */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Executive Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="text-sm text-gray-300 mb-1">Market Score</div>
                <div className="text-2xl font-bold">{marketOpportunity.score}/100</div>
                <div className="text-xs text-gray-300">{marketOpportunity.rating}</div>
              </div>
              
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="text-sm text-gray-300 mb-1">Avg Quality</div>
                <div className="text-2xl font-bold">{avgRating}⭐</div>
                <div className="text-xs text-gray-300">{weakCompetitors} below 4.0</div>
              </div>
              
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="text-sm text-gray-300 mb-1">Competitors</div>
                <div className="text-2xl font-bold">{competitors.length}</div>
                <div className="text-xs text-gray-300">{marketOpportunity.density}/mi²</div>
              </div>
              
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="text-sm text-gray-300 mb-1">Avg Price</div>
                <div className="text-2xl font-bold">${pricing.avgGel}</div>
                <div className="text-xs text-gray-300">Gel manicure</div>
              </div>
            </div>
            
            <div className="border-t border-white/20 pt-3">
              <p className="text-sm text-gray-200">
                {marketOpportunity.score >= 75 && "🎯 Excellent market conditions - Low competition with quality gaps. Strong entry opportunity."}
                {marketOpportunity.score >= 60 && marketOpportunity.score < 75 && "✅ Good opportunity - Market has room for a quality player. Moderate competition."}
                {marketOpportunity.score >= 40 && marketOpportunity.score < 60 && "⚠️ Moderate opportunity - Competitive market. Strong differentiation required."}
                {marketOpportunity.score < 40 && "❌ Saturated market - High competition. Exceptional differentiation essential."}
              </p>
            </div>
          </div>

          {/* Top Competitor Alert */}
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">🎯 Main Competitor Alert</h4>
                <p className="text-gray-800">
                  <span className="font-semibold">{topCompetitor.name}</span> is your biggest threat - 
                  {topCompetitor.rating}⭐ rating with {topCompetitor.reviewCount} reviews, 
                  only {topCompetitor.distanceMiles} miles away.
                </p>
              </div>
            </div>
          </div>


          {/* ===== DETAILED ANALYSIS (2-Column Grid) ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              
              {/* Price-Quality Analysis */}
              <div className="border-2 border-gray-300 rounded-xl p-4">
                <h4 className="font-bold text-base mb-3 flex items-center gap-2 text-gray-900">
                  <DollarSign className="h-4 w-4 text-gray-700" />
                  Value Analysis
                </h4>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <span className="font-semibold">Best Value:</span> {priceQuality.bestValue.name} 
                    <span className="text-gray-600"> ({priceQuality.bestValue.rating}⭐ ${Math.round(priceQuality.bestValue.avgPrice)})</span>
                  </div>
                  
                  {priceQuality.premium.length > 0 && (
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      <span className="font-semibold">Premium:</span> {priceQuality.premium.length} salon{priceQuality.premium.length > 1 ? 's' : ''}
                      <span className="text-gray-600"> - High-end positioning viable</span>
                    </div>
                  )}
                  
                  {priceQuality.overpriced.length > 0 && (
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      <span className="font-semibold">⚠️ Overpriced:</span> {priceQuality.overpriced.length}
                      <span className="text-gray-600"> - Easy to undercut</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Geographic Analysis */}
              {geoGaps && (
                <div className="border-2 border-gray-300 rounded-xl p-4">
                  <h4 className="font-bold text-base mb-3 flex items-center gap-2 text-gray-900">
                    <MapPin className="h-4 w-4 text-gray-700" />
                    Location Intelligence
                  </h4>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xl font-bold text-gray-900">{geoGaps.nearbyCount}</div>
                      <div className="text-xs text-gray-600">&lt;1 mi</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xl font-bold text-gray-900">{geoGaps.midRangeCount}</div>
                      <div className="text-xs text-gray-600">1-3 mi</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xl font-bold text-gray-900">{geoGaps.farCount}</div>
                      <div className="text-xs text-gray-600">3+ mi</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-800">
                    <span className="font-semibold">📍 Insight:</span> {geoGaps.recommendation}
                  </div>
                </div>
              )}

              {/* Service Differentiation */}
              <div className="border-2 border-gray-300 rounded-xl p-4">
                <h4 className="font-bold text-base mb-3 flex items-center gap-2 text-gray-900">
                  <Sparkles className="h-4 w-4 text-gray-700" />
                  Differentiation
                </h4>
                <div className="space-y-2">
                  {serviceGaps.missing.length > 0 && (
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      <span className="font-semibold">⚠️ Missing:</span>
                      <span className="text-gray-700"> {serviceGaps.missing.join(', ')}</span>
                    </div>
                  )}
                  
                  {serviceGaps.rare.length > 0 && (
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      <span className="font-semibold">💎 Luxury Opportunities:</span>
                      <span className="text-gray-700"> {serviceGaps.rare.join(', ')}</span>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-700">
                    <span className="font-semibold">Total:</span> {serviceGaps.total} amenities in market
                  </div>
                </div>
              </div>

            </div>
            
            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              
              {/* Growth Trajectory */}
              <div className="border-2 border-gray-300 rounded-xl p-4">
                <h4 className="font-bold text-base mb-3 flex items-center gap-2 text-gray-900">
                  <TrendingUp className="h-4 w-4 text-gray-700" />
                  Market Dynamics
                </h4>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">Phase:</span>
                    <Badge className="bg-gray-800 text-white text-xs">{growthTrend.marketPhase}</Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    {growthTrend.marketPhase === 'Mature' && 'Established market - high competition'}
                    {growthTrend.marketPhase === 'Growth' && 'Expanding - good timing for entry'}
                    {growthTrend.marketPhase === 'Emerging' && 'New market - early mover advantage'}
                    {growthTrend.marketPhase === 'Mixed' && 'Diverse mix - analyze segments'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 p-2 rounded border border-gray-300">
                    <div className="text-xs font-semibold text-gray-900 mb-1">📈 Rising</div>
                    <div className="text-xl font-bold text-gray-900">{growthTrend.highGrowth.length}</div>
                    <div className="text-xs text-gray-600">Strong</div>
                  </div>
                  
                  <div className="bg-gray-50 p-2 rounded border border-gray-300">
                    <div className="text-xs font-semibold text-gray-900 mb-1">📉 Weak</div>
                    <div className="text-xl font-bold text-gray-900">{growthTrend.declining.length}</div>
                    <div className="text-xs text-gray-600">Vulnerable</div>
                  </div>
                </div>
                
                {growthTrend.declining.length > 0 && (
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <span className="font-semibold">🎯 Opportunity:</span> {growthTrend.declining.length} potential acquisition target{growthTrend.declining.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Strategic Insights - Compact */}
              <div className="border-2 border-gray-300 rounded-xl p-4">
                <h4 className="font-bold text-base mb-3 flex items-center gap-2 text-gray-900">
                  <Target className="h-4 w-4 text-gray-700" />
                  Strategic Insights
                </h4>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <span className="font-semibold">💰 Pricing:</span>
                    <span className="text-gray-700"> Target ${Math.round(pricing.avgGel * 0.95)}-${pricing.avgGel} gel, ${Math.round(pricing.avgPedicure * 0.95)}-${pricing.avgPedicure} pedicure</span>
                  </div>
                  
                  {marketGap && (
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      <span className="font-semibold">💡 Gap:</span>
                      <span className="text-gray-700"> {marketGap.segment} ({marketGap.symbol}) segment underserved</span>
                    </div>
                  )}
                  
                  {weakCompetitors > 0 && (
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      <span className="font-semibold">⭐ Quality:</span>
                      <span className="text-gray-700"> {weakCompetitors} below 4.0 - focus on service excellence</span>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <span className="font-semibold">📊 Amenities:</span>
                    <span className="text-gray-700"> {commonAmenities[0]?.percentage}% have {commonAmenities[0]?.name}</span>
                  </div>
                </div>
              </div>

              {/* Action Items - Compact */}
              <div className="border-2 border-gray-300 rounded-xl p-4">
                <h4 className="font-bold text-base mb-3 flex items-center gap-2 text-gray-900">
                  <Lightbulb className="h-4 w-4 text-gray-700" />
                  Key Actions
                </h4>
                <div className="space-y-1.5">
                  <div className="flex gap-2 text-xs">
                    <Badge className="bg-gray-800 text-white">1</Badge>
                    <p className="text-gray-700">Standard amenities: {commonAmenities[0]?.name}, {commonAmenities[1]?.name}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Badge className="bg-gray-800 text-white">2</Badge>
                    <p className="text-gray-700">Differentiate with luxury amenities or extended hours</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Badge className="bg-gray-800 text-white">3</Badge>
                    <p className="text-gray-700">Target {topCompetitor.reviewCount}+ reviews within 12 months</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Badge className="bg-gray-800 text-white">4</Badge>
                    <p className="text-gray-700">Price competitively to capture initial market share</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ===== ULTRA-DETAILED 30-DAY ACTION PLAN ===== */}
          <div className="border-3 border-gray-800 rounded-xl p-6 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <Target className="h-6 w-6 text-gray-800" />
              30-Day Competitive Action Plan
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Follow these step-by-step actions to gain competitive advantage in your market
            </p>

            {/* Week 1: Market Positioning */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-gray-900 text-white px-3 py-1">Week 1</Badge>
                <h4 className="font-bold text-base text-gray-900">Market Positioning & Setup</h4>
              </div>
              <div className="space-y-3 pl-4 border-l-4 border-gray-300">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex gap-3">
                    <span className="text-2xl">📊</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">Pricing Strategy Implementation</p>
                      <p className="text-xs text-gray-700 mb-2">
                        Set your gel manicure at <span className="font-bold text-green-600">${Math.round(pricing.avgGel * 0.95)}</span> (5% below market avg ${pricing.avgGel}),
                        pedicure at <span className="font-bold text-green-600">${Math.round(pricing.avgPedicure * 0.92)}</span> (8% below ${pricing.avgPedicure}), and
                        acrylic at <span className="font-bold text-green-600">${Math.round(pricing.avgAcrylic * 0.90)}</span> (10% below ${pricing.avgAcrylic}).
                      </p>
                      <p className="text-xs text-gray-600 italic">💡 Why: Aggressive initial pricing captures market share from {weakCompetitors} lower-rated competitors</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex gap-3">
                    <span className="text-2xl">⭐</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">Review Generation Campaign</p>
                      <p className="text-xs text-gray-700 mb-2">
                        Goal: {Math.round(topCompetitor.reviewCount / 10)} reviews in 30 days. 
                        Create QR code cards, offer 10% discount for honest reviews, train staff to ask satisfied customers.
                        Send follow-up texts 24 hours after service.
                      </p>
                      <p className="text-xs text-gray-600 italic">💡 Why: {topCompetitor.name} has {topCompetitor.reviewCount} reviews - you need social proof fast</p>
                    </div>
                  </div>
                </div>

                {serviceGaps.missing.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex gap-3">
                      <span className="text-2xl">✨</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900 mb-1">Essential Amenities Setup</p>
                        <p className="text-xs text-gray-700 mb-2">
                          Install: {serviceGaps.missing.join(", ")}. 
                          Budget: ~$500-1,500. These are table stakes - {Math.round((competitors.length - serviceGaps.missing.length) / competitors.length * 100)}% of competitors already offer them.
                        </p>
                        <p className="text-xs text-gray-600 italic">💡 Why: Missing basics hurts your competitive position immediately</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Week 2: Competitive Differentiation */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-gray-900 text-white px-3 py-1">Week 2</Badge>
                <h4 className="font-bold text-base text-gray-900">Differentiation & Service Excellence</h4>
              </div>
              <div className="space-y-3 pl-4 border-l-4 border-gray-300">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex gap-3">
                    <span className="text-2xl">🎯</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">Study {topCompetitor.name} (Your Main Threat)</p>
                      <p className="text-xs text-gray-700 mb-2">
                        Visit as a customer. Document: service speed, techniques, product brands, customer service, booking process, upsells.
                        Read their last 50 reviews for common complaints. Create a "beat them" checklist.
                      </p>
                      <p className="text-xs text-gray-600 italic">💡 Why: They're {topCompetitor.distanceMiles} miles away with {topCompetitor.rating}⭐ - you need to be better</p>
                    </div>
                  </div>
                </div>

                {serviceGaps.rare.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex gap-3">
                      <span className="text-2xl">💎</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900 mb-1">Luxury Differentiation</p>
                        <p className="text-xs text-gray-700 mb-2">
                          Add {serviceGaps.rare[0] || "massage chairs"} - only {Math.round(competitors.filter(c => c.amenities.includes(serviceGaps.rare[0] || "none")).length / competitors.length * 100)}% of competitors have this.
                          This gives you a unique selling point. Budget: $2,000-5,000.
                        </p>
                        <p className="text-xs text-gray-600 italic">💡 Why: Stand out in a crowded market with premium experiences</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex gap-3">
                    <span className="text-2xl">👥</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">Staff Training Intensive</p>
                      <p className="text-xs text-gray-700 mb-2">
                        Train on: asking for reviews tactfully, upselling (target +$15/customer), 
                        handling complaints professionally, speed without sacrificing quality. Role-play customer scenarios.
                      </p>
                      <p className="text-xs text-gray-600 italic">💡 Why: Service quality determines if you hit 4.5⭐ or stay below 4.0⭐</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Week 3: Marketing & Visibility */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-gray-900 text-white px-3 py-1">Week 3</Badge>
                <h4 className="font-bold text-base text-gray-900">Marketing Blitz</h4>
              </div>
              <div className="space-y-3 pl-4 border-l-4 border-gray-300">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex gap-3">
                    <span className="text-2xl">📱</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">Social Media Launch</p>
                      <p className="text-xs text-gray-700 mb-2">
                        Post daily: Before/after photos, special offers, behind-the-scenes. 
                        Run Facebook/Instagram ads targeting {geoGaps ? `${geoGaps.nearbyCount === 0 ? "immediate area" : "1-3 mile radius"}` : "local area"} 
                        with "$5 off first visit" ($200 budget). Instagram Reels perform best.
                      </p>
                      <p className="text-xs text-gray-600 italic">💡 Why: Your competitors are online - you need to be visible where customers search</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex gap-3">
                    <span className="text-2xl">🎁</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">Grand Opening Promotion</p>
                      <p className="text-xs text-gray-700 mb-2">
                        Week-long offer: 30% off all services. Goal: 100+ customers through the door.
                        Print 500 flyers, distribute in {geoGaps ? `${geoGaps.nearbyCount === 0 ? "< 1 mile" : "1-2 mile"}` : "nearby"} radius.
                        Partner with local businesses for cross-promotion.
                      </p>
                      <p className="text-xs text-gray-600 italic">💡 Why: Fast customer acquisition = fast review generation = faster credibility</p>
                    </div>
                  </div>
                </div>

                {geoGaps && geoGaps.nearbyCount === 0 && (
                  <div className="bg-white p-4 rounded-lg border border-yellow-400 shadow-sm">
                    <div className="flex gap-3">
                      <span className="text-2xl">📍</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900 mb-1">Location Advantage Campaign</p>
                        <p className="text-xs text-gray-700 mb-2">
                          ⚡ OPPORTUNITY: No immediate competitors (&lt; 1 mi)! Market heavily as &quot;closest nail salon&quot; to local residents.
                          Create &quot;neighborhood nail salon&quot; branding. Door-hanger campaign in apartment complexes.
                        </p>
                        <p className="text-xs text-gray-600 italic">💡 Why: Geographic advantage won't last - capitalize NOW</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Week 4: Optimization & Growth */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-gray-900 text-white px-3 py-1">Week 4</Badge>
                <h4 className="font-bold text-base text-gray-900">Optimize & Scale</h4>
              </div>
              <div className="space-y-3 pl-4 border-l-4 border-gray-300">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex gap-3">
                    <span className="text-2xl">📈</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">Performance Analysis</p>
                      <p className="text-xs text-gray-700 mb-2">
                        Metrics to track: Reviews (target: {Math.round(topCompetitor.reviewCount / 10)}), 
                        avg ticket (target: +$10 from upsells), customer retention (target: 40% return).
                        Adjust pricing if needed - increase by 5% if booked solid.
                      </p>
                      <p className="text-xs text-gray-600 italic">💡 Why: Data-driven decisions beat guesswork</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex gap-3">
                    <span className="text-2xl">🎯</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">Target Weak Competitors</p>
                      <p className="text-xs text-gray-700 mb-2">
                        {weakCompetitors} competitor{weakCompetitors > 1 ? "s" : ""} rated below 4.0⭐. 
                        Create comparison ads: "Tired of poor service? Try us - satisfaction guaranteed."
                        Steal their dissatisfied customers with quality and professionalism.
                      </p>
                      <p className="text-xs text-gray-600 italic">💡 Why: Low-hanging fruit - these customers are already looking to switch</p>
                    </div>
                  </div>
                </div>

                {priceQuality.overpriced.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex gap-3">
                      <span className="text-2xl">💰</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900 mb-1">Value Positioning Attack</p>
                        <p className="text-xs text-gray-700 mb-2">
                          {priceQuality.overpriced.length} competitor{priceQuality.overpriced.length > 1 ? "s" : ""} 
                          overpriced with low ratings. Run campaign: "Same quality, better price - see our reviews!"
                          This is your fastest growth opportunity.
                        </p>
                        <p className="text-xs text-gray-600 italic">💡 Why: Overpriced + low quality = vulnerable to value competition</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Success Metrics */}
            <div className="bg-gray-900 text-white p-4 rounded-lg">
              <h4 className="font-bold text-sm mb-2">✅ 30-Day Success Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="font-semibold">Reviews:</span> {Math.round(topCompetitor.reviewCount / 10)}+ reviews
                </div>
                <div>
                  <span className="font-semibold">Rating:</span> 4.5⭐ or higher
                </div>
                <div>
                  <span className="font-semibold">Customers:</span> 150+ served
                </div>
              </div>
            </div>
          </div>

          {/* Competitive Advantage */}
          <div className="text-center pt-4 border-t-2 border-gray-300">
            <p className="text-sm text-gray-700">
              💡 <span className="font-semibold text-gray-900">Pro Tip:</span> Print this action plan and check off items daily. 
              Market conditions change fast - re-run this analysis every 2 weeks to stay ahead of {topCompetitor.name} and emerging threats.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

