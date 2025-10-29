# 🔧 Deployment Fix - 500 Error on /api/crawler/logs

## Problem
Getting `500 (Internal Server Error)` on `https://nail-spa-atlas.vercel.app/api/crawler/logs`

## Root Cause
The endpoint tries to query the database but:
1. Database connection is not configured
2. Prisma migrations haven't been run
3. Environment variables are missing on Vercel

## Fix Steps

### 1. Check Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
```
DATABASE_URL=(Your PostgreSQL connection string)
JWT_SECRET=(Strong random string)
GOOGLE_MAPS_API_KEY=(Your Google Maps key)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=(Same as above for client-side)
REDIS_URL=(Optional - for rate limiting)
```

### 2. Setup PostgreSQL Database

**Option A: Use Vercel Postgres (Recommended)**
1. Go to Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Postgres"
3. Copy the connection string to `DATABASE_URL`

**Option B: Use External Service**
- **Neon** (Free): https://neon.tech
- **Supabase** (Free): https://supabase.com

### 3. Run Prisma Migrations

```bash
# Connect to your production database
DATABASE_URL="your-production-database-url" npx prisma migrate deploy

# Or use Prisma Studio to verify
DATABASE_URL="your-production-database-url" npx prisma studio
```

### 4. Test Database Connection

After setting up the database, test it:
```bash
curl https://nail-spa-atlas.vercel.app/api/test-db
```

Should return:
```json
{
  "success": true,
  "message": "Database connection successful"
}
```

### 5. Re-deploy on Vercel

```bash
# Push to GitHub
git add .
git commit -m "Fix database configuration"
git push

# Or trigger a redeploy from Vercel dashboard
```

## Quick Test

Visit these URLs after fixing:
- ✅ Health check: https://nail-spa-atlas.vercel.app/api/health
- ✅ Database test: https://nail-spa-atlas.vercel.app/api/test-db
- ✅ Crawler logs: https://nail-spa-atlas.vercel.app/api/crawler/logs

## Alternative: Disable Crawler Feature Temporarily

If you want to deploy without crawler features:

1. Create a simple health check:
```typescript
// app/api/crawler/logs/route.ts
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Crawler logs API - Database not configured yet",
    data: { logs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
  });
}
```

2. Or add a database check:
```typescript
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: false,
      error: "Database not configured",
      message: "Please set DATABASE_URL in Vercel environment variables"
    }, { status: 503 });
  }
  
  // ... rest of your code
}
```

## Expected Outcome

After fixing:
- ✅ No more 500 errors
- ✅ Database queries work
- ✅ Crawler logs API returns data (or empty array if no logs)




