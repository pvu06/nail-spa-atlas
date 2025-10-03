# 🚀 NailSpa Atlas API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://nailspa-atlas.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📌 Endpoints

### Authentication

#### 1. Register User
**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "salonName": "My Nail Salon",
  "salonAddress": "123 Main St, Los Angeles, CA"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "salonName": "My Nail Salon",
      "salonAddress": "123 Main St, Los Angeles, CA",
      "subscriptionTier": "free",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Errors:**
- `400` - Validation error
- `409` - User already exists

---

#### 2. Login
**POST** `/api/auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "salonName": "My Nail Salon",
      "subscriptionTier": "free",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Errors:**
- `400` - Validation error
- `401` - Invalid credentials

---

#### 3. Get Current User
**GET** `/api/auth/me`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "salonName": "My Nail Salon",
    "salonAddress": "123 Main St, Los Angeles, CA",
    "subscriptionTier": "free",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "User retrieved successfully"
}
```

**Errors:**
- `401` - Unauthorized

---

### Competitor Search

#### 4. Search Competitors
**POST** `/api/competitors/search`

Search for competitors in a specific area.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "address": "Los Angeles, CA",
  "radius": 5,
  "competitorCount": 5,
  "lat": 34.0522,
  "lng": -118.2437
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "competitors": [
      {
        "id": "1",
        "name": "Glamour Nails & Spa",
        "website": "https://glamournails.com",
        "rating": 4.5,
        "reviewCount": 220,
        "priceRange": "$$",
        "samplePrices": {
          "gel": 35,
          "pedicure": 40,
          "acrylic": 55
        },
        "staffBand": "4–7",
        "hoursPerWeek": 60,
        "amenities": ["Wi-Fi", "Wheelchair Accessible"],
        "distanceMiles": 1.2
      }
    ],
    "meta": {
      "searchAddress": "Los Angeles, CA",
      "radius": 5,
      "count": 5,
      "lat": 34.0522,
      "lng": -118.2437
    }
  },
  "message": "Competitors found successfully"
}
```

**Rate Limits:**
- Free tier: 100 requests/hour
- Pro tier: 1,000 requests/hour
- Enterprise: 10,000 requests/hour

**Errors:**
- `400` - Validation error
- `401` - Unauthorized
- `429` - Rate limit exceeded

---

#### 5. Get Competitor Details
**GET** `/api/competitors/:id`

Get detailed information about a specific competitor.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "placeId": "ChIJ...",
    "name": "Glamour Nails & Spa",
    "address": "123 Main St, LA",
    "rating": 4.5,
    "reviewCount": 220,
    "services": [
      {
        "id": "uuid",
        "serviceType": "gel",
        "price": 35.00,
        "durationMinutes": 45,
        "verified": true
      }
    ],
    "amenities": [
      {
        "id": "uuid",
        "amenityName": "Wi-Fi",
        "verified": true
      }
    ]
  }
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Competitor not found

---

### Saved Searches

#### 6. List Saved Searches
**GET** `/api/searches?page=1&limit=10`

Get list of user's saved searches.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "searches": [
      {
        "id": "uuid",
        "searchAddress": "Los Angeles, CA",
        "radiusMiles": 5.00,
        "competitorCount": 5,
        "results": { /* JSON data */ },
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

#### 7. Save Search
**POST** `/api/searches`

Save a search for later reference.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "searchAddress": "Los Angeles, CA",
  "radiusMiles": 5,
  "competitorCount": 5,
  "results": { /* competitor data */ }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "searchAddress": "Los Angeles, CA",
    "radiusMiles": 5.00,
    "competitorCount": 5,
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Search saved successfully"
}
```

---

#### 8. Delete Saved Search
**DELETE** `/api/searches/:id`

Delete a saved search.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": null,
  "message": "Saved search deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not your search)
- `404` - Search not found

---

### Export

#### 9. Export to CSV
**POST** `/api/export/csv`

Export competitor data to CSV file.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "competitors": [
    {
      "name": "Glamour Nails & Spa",
      "rating": 4.5,
      "reviewCount": 220,
      ...
    }
  ]
}
```

**Response:** `200 OK`
- Content-Type: `text/csv`
- Downloads file: `competitors-{timestamp}.csv`

---

#### 10. Export to PDF
**POST** `/api/export/pdf`

Export competitor analysis report to PDF.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "competitors": [ ... ],
  "searchAddress": "Los Angeles, CA"
}
```

**Response:** `200 OK`
- Content-Type: `text/html`
- Downloads file: `competitors-{timestamp}.html`
- Can be printed to PDF from browser

---

## Rate Limiting

All endpoints enforce rate limits based on subscription tier:

| Tier | Limit | Window |
|------|-------|--------|
| Free | 100 | 1 hour |
| Pro | 1,000 | 1 hour |
| Enterprise | 10,000 | 1 hour |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000000
```

**429 Response:**
```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { /* additional info */ }
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - No permission
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Example Usage

### JavaScript/TypeScript
```typescript
// Register
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    salonName: 'My Salon'
  })
});

const { data } = await registerResponse.json();
const token = data.token;

// Search competitors
const searchResponse = await fetch('http://localhost:3000/api/competitors/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    address: 'Los Angeles, CA',
    radius: 5,
    competitorCount: 5
  })
});

const competitors = await searchResponse.json();
```

### cURL
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Search (with token)
curl -X POST http://localhost:3000/api/competitors/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"address":"Los Angeles, CA","radius":5,"competitorCount":5}'
```

---

## Websocket Support (Coming Soon)

Real-time updates for competitor changes:

```typescript
const ws = new WebSocket('wss://nailspa-atlas.com/ws');
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'competitors',
  token: 'your-jwt-token'
}));
```

---

## Changelog

### v1.0.0 (2025-01-01)
- Initial API release
- Authentication endpoints
- Competitor search
- Saved searches
- Export functionality
- Rate limiting

---

For support, email: api@nailspa-atlas.com



