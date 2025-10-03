import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const RATE_LIMITS = {
  free: parseInt(process.env.RATE_LIMIT_FREE || "100"),
  pro: parseInt(process.env.RATE_LIMIT_PRO || "1000"),
  enterprise: parseInt(process.env.RATE_LIMIT_ENTERPRISE || "10000"),
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  userId: string,
  tier: "free" | "pro" | "enterprise" = "free"
): Promise<RateLimitResult> {
  const limit = RATE_LIMITS[tier];
  const key = `ratelimit:${userId}:${Date.now().toString().slice(0, -5)}`; // Per hour
  
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, 3600); // 1 hour
    }
    
    const ttl = await redis.ttl(key);
    const reset = Date.now() + ttl * 1000;
    
    return {
      success: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      reset,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fail open - allow request if Redis is down
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + 3600000,
    };
  }
}

export async function resetRateLimit(userId: string): Promise<void> {
  const pattern = `ratelimit:${userId}:*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}



