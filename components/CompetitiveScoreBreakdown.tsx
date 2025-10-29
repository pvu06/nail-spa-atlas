"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Star, Users, MapPin, DollarSign, Target } from "lucide-react";
import { motion } from "framer-motion";

interface Competitor {
  name: string;
  rating: number;
  reviewCount: number;
  distanceMiles: number;
  samplePrices?: {
    gel: number;
    pedicure: number;
    acrylic: number;
  };
  competitiveScore?: number;
}

interface CompetitiveScoreBreakdownProps {
  competitor: Competitor;
}

export function CompetitiveScoreBreakdown({ competitor }: CompetitiveScoreBreakdownProps) {
  // Calculate score components (matching the algorithm from API)
  const rating = competitor.rating || 3.0;
  const reviews = competitor.reviewCount || 1;
  const distance = competitor.distanceMiles || 0.1;

  // Component scores (0-100 scale)
  const ratingScore = (rating / 5) * 100; // Max 100 points
  const popularityScore = Math.min((Math.log(reviews + 1) / Math.log(1000)) * 100, 100); // Max 100 points
  const proximityScore = Math.max(0, 100 - distance * 10); // Closer = higher score
  
  // Price competitiveness (average price vs ideal range $30-$60)
  const avgPrice = competitor.samplePrices
    ? (competitor.samplePrices.gel + competitor.samplePrices.pedicure + competitor.samplePrices.acrylic) / 3
    : 50;
  const priceScore = avgPrice >= 30 && avgPrice <= 60 ? 100 : Math.max(0, 100 - Math.abs(45 - avgPrice) * 2);

  const totalScore = competitor.competitiveScore || Math.round((ratingScore + popularityScore + proximityScore + priceScore) / 4);

  const components = [
    {
      name: "Quality Rating",
      score: Math.round(ratingScore),
      weight: 30,
      icon: Star,
      color: "#FFB800",
      description: `${rating.toFixed(1)}⭐ rating`,
      insight: ratingScore >= 80 ? "Excellent reputation" : ratingScore >= 60 ? "Good ratings" : "Room for improvement",
    },
    {
      name: "Popularity",
      score: Math.round(popularityScore),
      weight: 25,
      icon: Users,
      color: "#9467BD",
      description: `${reviews.toLocaleString()} reviews`,
      insight: reviews > 500 ? "Highly established" : reviews > 100 ? "Growing presence" : "Building reputation",
    },
    {
      name: "Proximity",
      score: Math.round(proximityScore),
      weight: 20,
      icon: MapPin,
      color: "#E6863B",
      description: `${distance.toFixed(1)} miles away`,
      insight: distance < 2 ? "Direct competitor" : distance < 5 ? "Local competitor" : "Distant competitor",
    },
    {
      name: "Price Positioning",
      score: Math.round(priceScore),
      weight: 25,
      icon: DollarSign,
      color: "#2CA02C",
      description: `Avg $${avgPrice.toFixed(0)}`,
      insight: avgPrice < 30 ? "Budget positioning" : avgPrice > 60 ? "Premium positioning" : "Mid-market sweet spot",
    },
  ];

  const getThreatLevel = (score: number) => {
    if (score >= 70) return { label: "HIGH THREAT", color: "bg-red-500", textColor: "text-red-700" };
    if (score >= 40) return { label: "MEDIUM THREAT", color: "bg-orange-500", textColor: "text-orange-700" };
    return { label: "LOW THREAT", color: "bg-green-500", textColor: "text-green-700" };
  };

  const threat = getThreatLevel(totalScore);

  // Generate actionable recommendations
  const recommendations: string[] = [];
  
  if (ratingScore < 80) {
    recommendations.push("📈 Opportunity: Improve your service quality to match or exceed their rating");
  }
  if (popularityScore < 60 && reviews < 200) {
    recommendations.push("💬 Action: Encourage more customers to leave reviews - they have " + reviews + " reviews");
  }
  if (proximityScore > 70 && distance < 3) {
    recommendations.push("📍 Alert: This competitor is very close - differentiation is critical");
  }
  if (priceScore > 80 && avgPrice >= 30 && avgPrice <= 60) {
    recommendations.push("💰 Insight: Their pricing is optimal - consider matching or justifying premium");
  }
  if (totalScore >= 70) {
    recommendations.push("🎯 Strategy: Study their success factors - they're a market leader");
  }
  if (totalScore < 40) {
    recommendations.push("✅ Advantage: You can outcompete them with strategic improvements");
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-[#9467BD]" />
            Competitive Threat Analysis
          </CardTitle>
          <Badge className={`${threat.color} text-white font-bold px-4 py-2`}>
            {threat.label}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-2">{competitor.name}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-purple-50 to-orange-50 p-6 rounded-lg border-2 border-gray-200"
        >
          <div className="text-center">
            <div className="text-5xl font-bold text-[#9467BD] mb-2">
              {totalScore}
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            <div className="text-gray-600 font-medium">Competitive Threat Score</div>
            <div className={`text-sm mt-1 font-semibold ${threat.textColor}`}>
              {threat.label.replace(" THREAT", "")} priority to monitor
            </div>
          </div>
        </motion.div>

        {/* Score Components */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Score Breakdown
          </h4>
          
          {components.map((component, index) => (
            <motion.div
              key={component.name}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <component.icon className="h-4 w-4" style={{ color: component.color }} />
                  <span className="font-medium text-sm">{component.name}</span>
                  <span className="text-xs text-gray-500">({component.weight}% weight)</span>
                </div>
                <Badge variant="outline" className="font-bold">
                  {component.score}/100
                </Badge>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${component.score}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: component.color }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{component.description}</span>
                <span className="text-gray-500 italic">{component.insight}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-[#E6863B]" />
            Actionable Recommendations
          </h4>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-sm text-gray-700 flex items-start gap-2"
              >
                <span className="text-lg leading-none">{rec.charAt(0)}</span>
                <span>{rec.substring(2)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

