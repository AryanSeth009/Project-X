# Geo Intelligence Service - Complete Implementation

## Overview

Geo Intelligence is the **competitive differentiator** that transforms generic itineraries into **specific, actionable plans** with exact places, restaurants, hostels, and activities.

### Without Geo Intelligence:
- Generic: "Visit beaches, enjoy nightlife"
- Generic: "Traditional Breakfast"

### With Geo Intelligence:
- **Specific**: "Day 1 Morning: Visit Baga Beach"
- **Specific**: "Breakfast at German Bakery Anjuna (₹300)"
- **Specific**: "Lunch at Britto's Baga (₹800)"
- **Specific**: "Evening: Explore Anjuna Flea Market (Wednesday 4PM-9PM)"
- **Specific**: "Stay at Zostel Baga (₹500/night)"

## Architecture

```
Mobile App
    ↓
POST /itinerary/generate
    ↓
API Server (api-server.js)
    ↓
├── Geo Service (lib/geo-service.js)
│   └── Supabase destination_contexts OR static datasets
│
├── Vector Geo Service (backend/src/services/geoVectorService.cjs)
│   └── JSON datasets + OpenAI embeddings + Pinecone vector DB
│
├── Context Builder (backend/src/services/contextBuilder.cjs)
│   └── Merges structured + vector + specific places
│   └── Extracts: restaurants, hostels, activities, attractions
│
└── AI Service (lib/ai-service.js)
    └── Uses rich geo context to generate specific activities
    └── Falls back to Itinerary Generator (lib/itinerary-generator.ts)
        └── createSpecificActivitiesFromGeo() injects exact places
```

## Data Sources

### 1. Structured JSON Datasets
Location: `backend/src/geo-data/*.json`

**Goa** (`goa.json`):
- Areas: Baga, Anjuna, Palolem, Calangute, Arambol, Colva
- Specific restaurants: Britto's, German Bakery, Curlies, etc.
- Specific hostels: Zostel Baga, Funky Monkey Hostel, etc.
- Specific activities: Jet Ski at Baga, Anjuna Flea Market, etc.
- Attractions: Baga Beach, Fort Aguada, Chapora Fort, etc.
- Travel clusters: North Goa, South Goa, Central Goa
- Budget tips, hidden gems

**Manali** (`manali.json`):
- Areas: Old Manali, Mall Road, Solang Valley, Vashisht
- Specific restaurants: Dylan's Toasted & Roasted, Drifters' Inn Cafe, etc.
- Specific hostels: Zostel Manali, GoStops Manali, etc.
- Specific activities: Paragliding Solang, Vashisht Hot Springs, etc.
- Attractions: Rohtang Pass, Solang Valley, Hadimba Temple, etc.

**Jaipur** (`jaipur.json`):
- Areas: MI Road, Pink City, Amer/Jaigarh
- Specific restaurants: LMB, Handi Restaurant, Tapri Central, etc.
- Specific hostels: Zostel Jaipur, Moustache Hostel, etc.
- Specific activities: Elephant Ride to Amber Fort, Shopping at Johari Bazaar, etc.
- Attractions: Amber Fort, Hawa Mahal, City Palace, etc.

### 2. Vector Database (Pinecone)
- Stores travel tips, hidden gems, budget insights as embeddings
- Semantic search matches user queries to relevant insights
- Optional: Requires `OPENAI_API_KEY` and `PINECONE_API_KEY`

### 3. Supabase Database
- `destination_contexts` table (optional)
- Can store geo data in PostgreSQL
- Falls back to JSON if not configured

## Key Components

### 1. Context Builder (`backend/src/services/contextBuilder.cjs`)

**Function**: `getGeoContext(destination, userQuery, vectorGeoContext)`

**What it does**:
1. Loads structured JSON dataset for destination
2. Extracts specific places from areas:
   - `specificRestaurants`: Exact restaurants with costs, timings, locations
   - `specificHostels`: Exact hostels with prices, amenities
   - `specificActivities`: Exact activities with costs, operators
3. Merges vector insights from Pinecone (if available)
4. Returns rich context object

**Output Structure**:
```javascript
{
  destination: "Goa",
  recommendedAreas: [...],
  avgHotelCost: 1200,
  scooterCost: 400,
  specificRestaurants: [
    {
      name: "Britto's",
      type: "Beach shack",
      cost: 800,
      bestFor: "Seafood",
      timing: "12PM-11PM",
      area: "Baga"
    },
    ...
  ],
  specificHostels: [...],
  specificActivities: [...],
  popularAttractions: [...],
  budgetTips: [...],
  hiddenGems: [...],
  vectorInsights: [...]
}
```

### 2. Itinerary Generator (`lib/itinerary-generator.ts`)

**New Function**: `createSpecificActivitiesFromGeo(geoContext, day, dailyBudget)`

**What it does**:
1. Extracts specific restaurants for breakfast/lunch
2. Extracts specific activities from geo data
3. Extracts popular attractions as specific visits
4. Returns array of specific activities with exact names, costs, locations

**Example Output**:
```javascript
[
  {
    name: "Breakfast at German Bakery Anjuna",
    cost: 300,
    duration: 1,
    category: "food",
    description: "Cafe - Breakfast & coffee (₹300)",
    location: "Anjuna German Bakery",
    geoSpecific: true
  },
  {
    name: "Lunch at Britto's",
    cost: 800,
    duration: 1.5,
    category: "food",
    description: "Beach shack - Seafood (₹800)",
    location: "Baga Britto's",
    geoSpecific: true
  },
  {
    name: "Visit Baga Beach",
    cost: 0,
    duration: 2,
    category: "attraction",
    description: "Beach - Best time: Sunset (6PM)",
    location: "Baga Beach",
    geoSpecific: true
  }
]
```

### 3. Integration Flow

**In `api-server.js`**:
```javascript
// Step 2: Get basic geo context
const destinationContext = await geoService.getDestinationContext(destination, supabase);

// Step 2b: Get vector geo context (optional)
const vectorGeoContext = await getVectorGeoContext(destination, userQuery);

// Step 2c: Build RICH geo context (merges everything)
const richGeoContext = buildRichGeoContext(destination, userQuery, vectorGeoContext);

// Step 4: Pass to AI Service
const itinerary = await aiService.generateItinerary({
  formData,
  geo: richGeoContext, // Rich context with specific places
  insights: travelInsights
});
```

**In `lib/itinerary-generator.ts`**:
```typescript
// Create specific activities from geo intelligence
const geoSpecificActivities = this.createSpecificActivitiesFromGeo(geoContext, day, dailyBudget);

// Mix with generic activities
const dayActivities = [...geoSpecificActivities, ...genericActivities];

// Generate time slots
const timeSlots = this.generateTimeSlots(dayActivities);
```

## How It Works

1. **User requests itinerary** for "Goa" with budget ₹50,000
2. **Context Builder loads** `goa.json` dataset
3. **Extracts specific places**:
   - Restaurants: Britto's, German Bakery, Curlies, etc.
   - Hostels: Zostel Baga, Funky Monkey Hostel, etc.
   - Activities: Jet Ski at Baga, Anjuna Flea Market, etc.
4. **Generator creates specific activities**:
   - "Breakfast at German Bakery Anjuna (₹300)"
   - "Lunch at Britto's Baga (₹800)"
   - "Visit Baga Beach"
   - "Anjuna Flea Market (Wednesday 4PM-9PM)"
5. **AI Service** (if LLM available) uses rich context to generate even more specific outputs
6. **Final itinerary** contains exact places, costs, timings, locations

## Adding New Destinations

1. Create JSON file: `backend/src/geo-data/{destination}.json`
2. Follow structure:
   ```json
   {
     "destination": "Destination Name",
     "areas": [
       {
         "name": "Area Name",
         "specificPlaces": {
           "restaurants": [...],
           "hostels": [...],
           "activities": [...]
         }
       }
     ],
     "attractions": [...],
     "travelClusters": [...],
     "budgetTips": [...]
   }
   ```
3. Restart API server - it will automatically load the new dataset

## Testing

**Test endpoint**: `GET /api/geo/context?destination=goa`

**Expected response**:
```json
{
  "success": true,
  "data": {
    "destination": "Goa",
    "specificRestaurants": [...],
    "specificHostels": [...],
    "specificActivities": [...],
    "popularAttractions": [...]
  }
}
```

## Competitive Advantage

**Most apps**: Generic LLM outputs
**Your app**: 
- LLM + Proprietary geo data + Real-time Perplexity data
- Specific restaurants, hostels, activities
- Exact costs, timings, locations
- Budget-aware recommendations
- Hidden gems from research

**Result**: Superior itinerary quality that users can actually follow.
