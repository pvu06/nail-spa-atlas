# 🗺️ Google Maps API Debug Guide

## Problem
Getting 500 error on `/api/maps/geocode`:
```
Failed to geocode address
```

## Root Cause
The **server-side** Google Maps API call is failing. This could be:

1. ❌ `GOOGLE_MAPS_API_KEY` not set in Vercel
2. ❌ Geocoding API not enabled in Google Cloud
3. ❌ API key restrictions blocking server requests

## Solution Steps

### Step 1: Verify API Key in Vercel

Go to Vercel Dashboard → Settings → Environment Variables

Check that **BOTH** keys exist:
- ✅ `GOOGLE_MAPS_API_KEY` (for server-side)
- ✅ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (for client-side)

Both should have the same value: `your-api-key-here`

### Step 2: Enable Geocoding API

1. Go to: https://console.cloud.google.com/google/maps-apis
2. Click **"Enable APIs and Services"**
3. Search for and enable:
   - ✅ **Geocoding API** ← Required for address → lat/lng
   - ✅ **Places API** ← Required for competitor search
   - ✅ **Maps JavaScript API** ← Required for map display

### Step 3: Check API Key Restrictions

In Google Cloud Console → Credentials:

1. Click on your API key
2. Under **"Application restrictions"**:
   - Select **"None"** (for testing)
   - OR add these referrers:
     - `https://nail-spa-atlas.vercel.app/*`
     - `http://localhost:3000/*`

3. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Enable these APIs:
     - Geocoding API
     - Places API
     - Maps JavaScript API

4. Click **Save**

### Step 4: Test the API Key

Test directly with curl:

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Los+Angeles,CA&key=YOUR_API_KEY_HERE"
```

**Expected response:**
```json
{
  "results": [...],
  "status": "OK"
}
```

**If you get an error:**
- `REQUEST_DENIED` → API not enabled or key restricted
- `INVALID_REQUEST` → Check the address format
- `OVER_QUERY_LIMIT` → Billing not enabled

### Step 5: Enable Billing (If Needed)

Google Maps API requires billing to be enabled (but has generous free tier):

1. Go to: https://console.cloud.google.com/billing
2. Link a billing account
3. Free tier includes:
   - $200/month credit
   - 40,000 geocoding requests/month free

### Step 6: Redeploy Vercel

After making changes in Google Cloud:
1. Wait 2-5 minutes for changes to propagate
2. Trigger a redeploy in Vercel (or push to GitHub)
3. Test again: https://nail-spa-atlas.vercel.app/analyze

## Quick Test Checklist

- [ ] Both API keys set in Vercel
- [ ] Geocoding API enabled in Google Cloud
- [ ] Places API enabled in Google Cloud
- [ ] Maps JavaScript API enabled in Google Cloud
- [ ] API key has no restrictions (or correct restrictions)
- [ ] Billing enabled in Google Cloud
- [ ] Test direct API call with curl (see above)
- [ ] Redeploy Vercel after changes

## Expected Behavior After Fix

1. Visit: https://nail-spa-atlas.vercel.app/analyze
2. Enter address: "Los Angeles, CA"
3. Select radius and competitor count
4. Click "Analyze Competitors"
5. Should see:
   - ✅ Address geocoded successfully
   - ✅ Competitors found and displayed
   - ✅ Map showing locations
   - ✅ Table with competitor data

## Still Not Working?

Check Vercel Function Logs:
1. Vercel Dashboard → Your Project
2. Click latest deployment
3. Go to **Functions** tab
4. Click `/api/maps/geocode`
5. Look for the actual error message

Common errors:
- `API key not valid` → Wrong key or not enabled
- `This API project is not authorized` → Enable the API
- `REQUEST_DENIED` → Check restrictions
- `OVER_QUERY_LIMIT` → Enable billing

---

**Most likely issue:** Geocoding API not enabled in Google Cloud Console

