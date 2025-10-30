/**
 * Client-side Sentiment Analysis
 * Simple but effective keyword-based sentiment analysis
 */

export interface SentimentResult {
  score: number; // -1 (very negative) to 1 (very positive)
  sentiment: "positive" | "negative" | "neutral";
  keywords: string[];
  topics: string[];
  insights: string[];
}

// Sentiment keywords
const POSITIVE_KEYWORDS = [
  "excellent", "amazing", "great", "wonderful", "fantastic", "perfect", "love", "loved",
  "best", "awesome", "beautiful", "clean", "friendly", "professional", "recommend",
  "talented", "skilled", "relaxing", "comfortable", "satisfied", "happy", "pleasant",
  "gentle", "caring", "attentive", "thorough", "meticulous", "impressed", "outstanding",
];

const NEGATIVE_KEYWORDS = [
  "terrible", "horrible", "bad", "worst", "awful", "poor", "rude", "unprofessional",
  "dirty", "unclean", "disappointing", "disappointed", "overpriced", "expensive",
  "rushed", "careless", "painful", "hurt", "uncomfortable", "unsanitary", "avoid",
  "never", "waste", "regret", "complaint", "issue", "problem", "fail", "failed",
];

// Topic detection
const TOPIC_KEYWORDS: Record<string, string[]> = {
  service_quality: ["service", "quality", "work", "job", "done", "result", "finish"],
  cleanliness: ["clean", "sanitary", "hygiene", "sterile", "neat", "tidy", "spotless"],
  price: ["price", "cost", "expensive", "cheap", "value", "worth", "afford", "overpriced"],
  staff: ["staff", "technician", "employee", "worker", "team", "friendly", "rude", "professional"],
  atmosphere: ["atmosphere", "ambiance", "environment", "comfortable", "relaxing", "cozy"],
  wait_time: ["wait", "appointment", "schedule", "time", "late", "prompt", "delay"],
  skill: ["skill", "talented", "experienced", "expertise", "precision", "technique"],
  products: ["product", "polish", "gel", "quality", "brand", "tool", "equipment"],
};

/**
 * Analyze sentiment of review text
 */
export function analyzeSentiment(text: string): SentimentResult {
  if (!text) {
    return {
      score: 0,
      sentiment: "neutral",
      keywords: [],
      topics: [],
      insights: [],
    };
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\W+/);

  // Count positive and negative keywords
  let positiveCount = 0;
  let negativeCount = 0;
  const foundKeywords: string[] = [];

  POSITIVE_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      positiveCount++;
      foundKeywords.push(keyword);
    }
  });

  NEGATIVE_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      negativeCount++;
      foundKeywords.push(keyword);
    }
  });

  // Calculate sentiment score
  const total = positiveCount + negativeCount;
  let score = 0;
  if (total > 0) {
    score = (positiveCount - negativeCount) / total;
  }

  // Determine sentiment category
  let sentiment: "positive" | "negative" | "neutral";
  if (score > 0.3) sentiment = "positive";
  else if (score < -0.3) sentiment = "negative";
  else sentiment = "neutral";

  // Detect topics
  const topics: string[] = [];
  Object.entries(TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
    const found = keywords.some((keyword) => lowerText.includes(keyword));
    if (found) topics.push(topic);
  });

  return {
    score,
    sentiment,
    keywords: foundKeywords.slice(0, 10), // Top 10 keywords
    topics,
    insights: [],
  };
}

/**
 * Analyze multiple reviews and generate insights
 */
export function analyzeReviewsInsights(reviews: Array<{
  text?: string;
  rating: number;
}>): {
  overallSentiment: "positive" | "negative" | "neutral";
  avgSentimentScore: number;
  topKeywords: Array<{ keyword: string; count: number }>;
  topTopics: Array<{ topic: string; count: number }>;
  strengths: string[];
  weaknesses: string[];
  actionableInsights: string[];
} {
  if (reviews.length === 0) {
    return {
      overallSentiment: "neutral",
      avgSentimentScore: 0,
      topKeywords: [],
      topTopics: [],
      strengths: [],
      weaknesses: [],
      actionableInsights: [],
    };
  }

  // Analyze all reviews
  const analyses = reviews.map((r) => analyzeSentiment(r.text || ""));

  // Calculate average sentiment score
  const avgSentimentScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;

  // Determine overall sentiment
  let overallSentiment: "positive" | "negative" | "neutral";
  if (avgSentimentScore > 0.2) overallSentiment = "positive";
  else if (avgSentimentScore < -0.2) overallSentiment = "negative";
  else overallSentiment = "neutral";

  // Count keywords
  const keywordCounts = new Map<string, number>();
  analyses.forEach((a) => {
    a.keywords.forEach((kw) => {
      keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
    });
  });

  const topKeywords = Array.from(keywordCounts.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Count topics
  const topicCounts = new Map<string, number>();
  analyses.forEach((a) => {
    a.topics.forEach((topic) => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });
  });

  const topTopics = Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  // Generate strengths (positive keywords that appear frequently)
  const strengths: string[] = [];
  topKeywords.forEach(({ keyword, count }) => {
    if (POSITIVE_KEYWORDS.includes(keyword) && count >= 2) {
      strengths.push(keyword);
    }
  });

  // Generate weaknesses (negative keywords that appear frequently)
  const weaknesses: string[] = [];
  topKeywords.forEach(({ keyword, count }) => {
    if (NEGATIVE_KEYWORDS.includes(keyword) && count >= 2) {
      weaknesses.push(keyword);
    }
  });

  // Generate actionable insights based on topics and sentiment
  const actionableInsights: string[] = [];

  // Service quality insights
  if (topTopics.some((t) => t.topic === "service_quality" && t.count > reviews.length * 0.3)) {
    if (overallSentiment === "negative") {
      actionableInsights.push("Focus on improving service quality - it's a common concern among reviewers");
    } else {
      actionableInsights.push("Service quality is a strong point - highlight this in your marketing");
    }
  }

  // Cleanliness insights
  if (topTopics.some((t) => t.topic === "cleanliness")) {
    if (weaknesses.includes("dirty") || weaknesses.includes("unclean")) {
      actionableInsights.push("⚠️ CRITICAL: Multiple reviews mention cleanliness issues - immediate action required");
    } else if (strengths.includes("clean")) {
      actionableInsights.push("Cleanliness is a competitive advantage - emphasize this in your branding");
    }
  }

  // Price insights
  if (topTopics.some((t) => t.topic === "price")) {
    if (weaknesses.includes("expensive") || weaknesses.includes("overpriced")) {
      actionableInsights.push("Consider reviewing your pricing strategy - customers perceive it as high");
    } else if (strengths.includes("value")) {
      actionableInsights.push("Customers appreciate your value proposition - maintain this balance");
    }
  }

  // Staff insights
  if (topTopics.some((t) => t.topic === "staff")) {
    if (weaknesses.includes("rude") || weaknesses.includes("unprofessional")) {
      actionableInsights.push("⚠️ Staff training needed - professionalism and friendliness are concerns");
    } else if (strengths.includes("friendly") || strengths.includes("professional")) {
      actionableInsights.push("Your staff is a major asset - consider featuring them in marketing");
    }
  }

  // Wait time insights
  if (topTopics.some((t) => t.topic === "wait_time")) {
    if (weaknesses.includes("wait") || weaknesses.includes("late")) {
      actionableInsights.push("Improve scheduling and appointment management to reduce wait times");
    }
  }

  // Skill insights
  if (topTopics.some((t) => t.topic === "skill")) {
    if (strengths.includes("talented") || strengths.includes("skilled")) {
      actionableInsights.push("Technical skill is a differentiator - showcase your technicians' expertise");
    }
  }

  return {
    overallSentiment,
    avgSentimentScore,
    topKeywords,
    topTopics,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    actionableInsights,
  };
}

/**
 * Generate competitive analysis based on sentiment comparison
 */
export function compareCompetitorSentiment(competitors: Array<{
  name: string;
  reviews?: Array<{ text?: string; rating: number }>;
}>): Array<{
  name: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  strengths: string[];
  weaknesses: string[];
}> {
  return competitors.map((comp) => {
    if (!comp.reviews || comp.reviews.length === 0) {
      return {
        name: comp.name,
        sentiment: "neutral" as const,
        score: 0,
        strengths: [],
        weaknesses: [],
      };
    }

    const analysis = analyzeReviewsInsights(comp.reviews);
    
    return {
      name: comp.name,
      sentiment: analysis.overallSentiment,
      score: analysis.avgSentimentScore,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
    };
  });
}



