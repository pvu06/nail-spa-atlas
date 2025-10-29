# ⚠️ Environment Configuration Required

Your project is missing environment variables. Please create a `.env.local` file in the `spa-atlas` directory with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nailspa_atlas?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Google Maps API (Server-side)
GOOGLE_MAPS_API_KEY=""

# Google Maps API (Client-side - REQUIRED for maps to work)
# Must use NEXT_PUBLIC_ prefix to expose to browser
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Rate Limiting
RATE_LIMIT_FREE=100
RATE_LIMIT_PRO=1000
RATE_LIMIT_ENTERPRISE=10000

# App Configuration
NODE_ENV="development"
NEXT_PUBLIC_API_URL="/api"
```

## Quick Setup Steps:

1. **Create `.env.local` file:**
   ```bash
   cd spa-atlas
   # Create the file manually or copy this template
   ```

2. **Setup PostgreSQL:**
   - Install PostgreSQL: https://www.postgresql.org/download/
   - Create database: `createdb nailspa_atlas`
   - Update `DATABASE_URL` with your credentials

3. **Setup Redis (optional but recommended):**
   - Install Redis: https://redis.io/download
   - Or use Docker: `docker run -d -p 6379:6379 redis`
   - Or use cloud service: https://upstash.com (free tier available)

4. **Get Google Maps API Key:**
   - Go to: https://console.cloud.google.com/google/maps-apis
   - Enable these APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Create credentials and add to `GOOGLE_MAPS_API_KEY`

5. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

6. **Run Database Migrations:**
   ```bash
   npm run db:migrate
   ```

7. **Start Development Server:**
   ```bash
   npm run dev
   ```

## Priority Order:

1. ⚠️ **Database** - Required for app to run
2. ⚠️ **Google Maps API** - Required for competitor search
3. ⚡ **Redis** - Recommended for rate limiting (can run without initially)
4. 🔐 **JWT_SECRET** - Critical for production, use strong random string

