# 🚀 Backend Setup Guide

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Redis installed and running (optional, for rate limiting)
- Git

---

## 📦 1. Installation

Already completed in your project:
```bash
npm install
```

**Dependencies installed:**
- `prisma` - ORM
- `@prisma/client` - Prisma client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `ioredis` - Redis client
- `zod` - Validation

---

## 🗄️ 2. Database Setup

### Option A: Local PostgreSQL

#### Install PostgreSQL (Mac)
```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb nailspa_atlas
```

#### Install PostgreSQL (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb nailspa_atlas
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

#### Install PostgreSQL (Windows)
1. Download from https://www.postgresql.org/download/windows/
2. Run installer
3. Use pgAdmin to create database `nailspa_atlas`

### Option B: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name nailspa-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nailspa_atlas \
  -p 5432:5432 \
  -d postgres:14

# Check if running
docker ps
```

### Option C: Cloud Database

**Supabase (Free):**
1. Go to https://supabase.com
2. Create new project
3. Copy connection string
4. Update `.env.local`

**Neon (Free):**
1. Go to https://neon.tech
2. Create new project
3. Copy connection string
4. Update `.env.local`

---

## 📝 3. Environment Variables

Create `.env.local` file in root:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nailspa_atlas?schema=public"

# JWT Secret (change in production!)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_EXPIRES_IN="7d"

# Redis (optional, for rate limiting)
REDIS_URL="redis://localhost:6379"

# Rate Limits
RATE_LIMIT_FREE=100
RATE_LIMIT_PRO=1000
RATE_LIMIT_ENTERPRISE=10000

# App
NODE_ENV="development"
APP_URL="http://localhost:3000"
```

**IMPORTANT:** 
- Change `JWT_SECRET` to a strong random string in production
- Never commit `.env.local` to git

---

## 🔄 4. Prisma Setup

### Generate Prisma Client
```bash
npx prisma generate
```

### Run Database Migrations
```bash
# Create migration
npx prisma migrate dev --name init

# This will:
# 1. Create migration files
# 2. Apply to database
# 3. Generate Prisma Client
```

### Check Database
```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Opens at http://localhost:5555
```

---

## 🔴 5. Redis Setup (Optional)

Redis is used for rate limiting and caching.

### Option A: Local Redis

**Mac:**
```bash
brew install redis
brew services start redis

# Test
redis-cli ping
# Should return: PONG
```

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server

# Test
redis-cli ping
```

**Windows:**
Download from https://github.com/microsoftarchive/redis/releases

### Option B: Docker Redis

```bash
docker run --name nailspa-redis \
  -p 6379:6379 \
  -d redis:7

# Test
docker exec -it nailspa-redis redis-cli ping
```

### Option C: Cloud Redis

**Upstash (Free):**
1. Go to https://upstash.com
2. Create Redis database
3. Copy connection string
4. Update `REDIS_URL` in `.env.local`

**Redis Cloud (Free):**
1. Go to https://redis.com/try-free/
2. Create database
3. Copy connection string

---

## 🌱 6. Seed Database (Optional)

Create seed file: `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: await hashPassword('password123'),
      salonName: 'Test Salon',
      salonAddress: '123 Test St, Los Angeles, CA',
      subscriptionTier: 'free',
    },
  });

  console.log('Created test user:', user.email);

  // Create test competitors
  const competitor1 = await prisma.competitor.create({
    data: {
      name: 'Glamour Nails & Spa',
      address: '123 Main St, Los Angeles, CA',
      latitude: 34.0522,
      longitude: -118.2437,
      rating: 4.5,
      reviewCount: 220,
      priceLevel: 2,
      staffBand: '4–7',
      hoursPerWeek: 60,
      services: {
        create: [
          { serviceType: 'gel', price: 35, verified: true },
          { serviceType: 'pedicure', price: 40, verified: true },
          { serviceType: 'acrylic', price: 55, verified: true },
        ],
      },
      amenities: {
        create: [
          { amenityName: 'Wi-Fi', verified: true },
          { amenityName: 'Wheelchair Accessible', verified: true },
        ],
      },
    },
  });

  console.log('Created competitor:', competitor1.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Update `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Install tsx:
```bash
npm install -D tsx
```

Run seed:
```bash
npx prisma db seed
```

---

## 🧪 7. Test API

### Start Development Server
```bash
npm run dev
```

### Test Endpoints

**Register User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "salonName": "My Salon"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Get User (with token):**
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Search Competitors:**
```bash
curl -X POST http://localhost:3000/api/competitors/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "address": "Los Angeles, CA",
    "radius": 5,
    "competitorCount": 5
  }'
```

---

## 🛠️ 8. Database Management

### View Database
```bash
# Open Prisma Studio
npx prisma studio
```

### Reset Database
```bash
# WARNING: Deletes all data!
npx prisma migrate reset

# Reapply migrations and seed
npx prisma db seed
```

### Create Migration
```bash
# After changing schema.prisma
npx prisma migrate dev --name add_new_field
```

### Deploy to Production
```bash
# Apply migrations without prompts
npx prisma migrate deploy
```

---

## 📊 9. Monitoring & Debugging

### Check Database Connection
```bash
npx prisma db pull
```

### View Prisma Logs
Set in `.env.local`:
```env
DEBUG="prisma:*"
```

### Check Redis Connection
```bash
redis-cli ping

# View keys
redis-cli keys '*'

# Monitor commands
redis-cli monitor
```

---

## 🚀 10. Production Deployment

### Environment Variables
Set in production:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="STRONG_RANDOM_STRING_HERE"
REDIS_URL="redis://..."
NODE_ENV="production"
APP_URL="https://your-domain.com"
```

### Deploy to Vercel

1. **Push to GitHub**
2. **Import to Vercel**
3. **Set Environment Variables** in Vercel dashboard
4. **Add Database**:
   - Use Vercel Postgres or Neon
   - Copy connection string to `DATABASE_URL`
5. **Add Redis**:
   - Use Upstash Redis
   - Copy connection string to `REDIS_URL`
6. **Deploy**

### Run Migrations on Production
```bash
# Set DATABASE_URL to production
npx prisma migrate deploy
```

---

## 🔒 11. Security Checklist

- [ ] Change default `JWT_SECRET`
- [ ] Use strong database password
- [ ] Enable SSL for database connection
- [ ] Set up CORS properly
- [ ] Enable rate limiting
- [ ] Add request validation
- [ ] Set up monitoring (Sentry)
- [ ] Enable HTTPS
- [ ] Review security headers
- [ ] Set up backups

---

## 🐛 12. Troubleshooting

### Cannot connect to PostgreSQL
```bash
# Check if PostgreSQL is running
brew services list  # Mac
sudo systemctl status postgresql  # Linux

# Test connection
psql -h localhost -U postgres -d nailspa_atlas
```

### Prisma Client not found
```bash
# Regenerate client
npx prisma generate
```

### Migration errors
```bash
# Reset and start over
npx prisma migrate reset
npx prisma migrate dev
```

### Redis connection failed
```bash
# Check if Redis is running
redis-cli ping

# Or use Docker
docker start nailspa-redis
```

### Rate limiting not working
- Check Redis connection
- Verify `REDIS_URL` in `.env.local`
- Falls back to allowing all requests if Redis is down

---

## 📚 13. Useful Commands

```bash
# Prisma
npx prisma studio              # Open database GUI
npx prisma generate            # Generate client
npx prisma migrate dev         # Create & apply migration
npx prisma migrate reset       # Reset database
npx prisma db seed             # Seed database
npx prisma db pull             # Pull schema from database
npx prisma db push             # Push schema to database (dev only)

# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Database
createdb nailspa_atlas         # Create database
dropdb nailspa_atlas           # Drop database

# Redis
redis-cli ping                 # Test connection
redis-cli flushall             # Clear all data (dev only!)
redis-cli keys '*'             # View all keys
```

---

## 📖 Next Steps

1. ✅ Database setup complete
2. ✅ API endpoints working
3. 🔄 Connect frontend to backend
4. 🔄 Add Google Maps API integration
5. 🔄 Implement web scraping
6. 🔄 Add email notifications
7. 🔄 Set up payment (Stripe)

---

## 💬 Support

- **Documentation:** See `API-DOCUMENTATION.md`
- **Issues:** Open GitHub issue
- **Email:** support@nailspa-atlas.com

---

**You're all set! 🎉** Your backend is ready for development.



