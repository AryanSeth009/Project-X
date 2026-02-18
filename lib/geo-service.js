/**
 * Geo Intelligence Service – destination-specific knowledge for itinerary generation.
 * Uses Supabase (destination_contexts table) when client is provided; otherwise static datasets.
 */

// Static datasets: best_areas, average_cost, transport_options, popular_attractions
const DESTINATION_DATASETS = {
  goa: {
    name: 'Goa',
    display_name: 'Goa',
    slug: 'goa',
    country: 'India',
    coordinates: { lat: 15.2993, lng: 74.124 },
    timezone: 'Asia/Kolkata',
    best_season: 'November to February',
    tags: ['beach', 'nightlife', 'heritage', 'relaxation'],
    best_areas: [
      { name: 'North Goa', description: 'Baga, Morjim, Calangute, Anjuna – beaches, nightlife, water sports', vibe: 'vibrant' },
      { name: 'South Goa', description: 'Palolem, Agonda – quieter beaches, resorts', vibe: 'relaxed' },
      { name: 'Panjim & Old Goa', description: 'Heritage, churches, Portuguese architecture', vibe: 'cultural' },
    ],
    average_cost: { min_per_day: 3000, max_per_day: 15000, currency: 'INR' },
    transport_options: [
      { type: 'Scooter/Bike rental', description: 'Best for beaches and short hops', avg_cost: 400 },
      { type: 'Taxi/Ola/Uber', description: 'Airport and long distances', avg_cost: 800 },
      { type: 'Local buses', description: 'Budget option between towns', avg_cost: 50 },
      { type: 'Private cab (full day)', description: 'Sightseeing tours', avg_cost: 2500 },
    ],
    popular_attractions: [
      { name: 'Baga Beach', type: 'beach', description: 'Water sports, shacks, nightlife' },
      { name: 'Dudhsagar Falls', type: 'nature', description: 'Four-tiered waterfall in Western Ghats' },
      { name: 'Basilica of Bom Jesus', type: 'heritage', description: 'UNESCO site, St. Francis Xavier' },
      { name: 'Fort Aguada', type: 'heritage', description: 'Portuguese fort, lighthouse, views' },
      { name: 'Anjuna Flea Market', type: 'shopping', description: 'Wednesday flea market' },
      { name: 'Palolem Beach', type: 'beach', description: 'Crescent beach, calm waters' },
    ],
  },
  manali: {
    name: 'Manali',
    display_name: 'Manali',
    slug: 'manali',
    country: 'India',
    coordinates: { lat: 32.2396, lng: 77.1887 },
    timezone: 'Asia/Kolkata',
    best_season: 'March to June, September to November',
    tags: ['mountains', 'adventure', 'snow', 'trekking'],
    best_areas: [
      { name: 'Old Manali', description: 'Cafes, hostels, backpacker vibe', vibe: 'chill' },
      { name: 'Mall Road', description: 'Shopping, restaurants, central', vibe: 'touristy' },
      { name: 'Solang Valley', description: 'Adventure sports, snow, day trips', vibe: 'adventure' },
      { name: 'Vashisht', description: 'Hot springs, temples, quiet', vibe: 'peaceful' },
    ],
    average_cost: { min_per_day: 2500, max_per_day: 12000, currency: 'INR' },
    transport_options: [
      { type: 'Local taxi', description: 'Within Manali and short trips', avg_cost: 500 },
      { type: 'HRTC buses', description: 'To Rohtang, Solang, Leh', avg_cost: 200 },
      { type: 'Bike rental', description: 'Popular for Rohtang and nearby', avg_cost: 1200 },
      { type: 'Private cab (full day)', description: 'Solang, Rohtang, sightseeing', avg_cost: 3500 },
    ],
    popular_attractions: [
      { name: 'Rohtang Pass', type: 'nature', description: 'High-altitude pass, snow, views' },
      { name: 'Solang Valley', type: 'adventure', description: 'Paragliding, skiing, zorbing' },
      { name: 'Hadimba Temple', type: 'heritage', description: 'Wooden temple in cedar forest' },
      { name: 'Vashisht Hot Springs', type: 'wellness', description: 'Natural hot water springs' },
      { name: 'Old Manali cafes', type: 'food', description: 'Israeli, continental, live music' },
      { name: 'Great Himalayan National Park', type: 'nature', description: 'UNESCO park, trekking' },
    ],
  },
  jaipur: {
    name: 'Jaipur',
    display_name: 'Jaipur',
    slug: 'jaipur',
    country: 'India',
    coordinates: { lat: 26.9124, lng: 75.7873 },
    timezone: 'Asia/Kolkata',
    best_season: 'October to March',
    tags: ['heritage', 'palaces', 'shopping', 'culture'],
    best_areas: [
      { name: 'MI Road / Bani Park', description: 'Hotels, restaurants, central', vibe: 'convenient' },
      { name: 'C-Scheme', description: 'Upscale cafes, boutiques', vibe: 'modern' },
      { name: 'Pink City (old)', description: 'Markets, Hawa Mahal, bazaars', vibe: 'cultural' },
      { name: 'Amer / Jaigarh', description: 'Near forts, heritage stays', vibe: 'heritage' },
    ],
    average_cost: { min_per_day: 2500, max_per_day: 18000, currency: 'INR' },
    transport_options: [
      { type: 'Auto-rickshaw', description: 'Short trips in city', avg_cost: 100 },
      { type: 'Ola/Uber', description: 'Comfortable city travel', avg_cost: 200 },
      { type: 'Taxi (full day)', description: 'Fort circuit, sightseeing', avg_cost: 2500 },
      { type: 'Elephant ride (Amber)', description: 'Up to Amber Fort', avg_cost: 1100 },
    ],
    popular_attractions: [
      { name: 'Amber Fort', type: 'heritage', description: 'Hill fort, elephant rides, palaces' },
      { name: 'Hawa Mahal', type: 'heritage', description: 'Palace of Winds, facade' },
      { name: 'City Palace', type: 'heritage', description: 'Royal residence, museums' },
      { name: 'Jantar Mantar', type: 'heritage', description: 'Astronomical instruments' },
      { name: 'Johari Bazaar', type: 'shopping', description: 'Jewellery, handicrafts' },
      { name: 'Nahargarh Fort', type: 'heritage', description: 'Views, sunset point' },
    ],
  },
  kerala: {
    name: 'Kerala',
    display_name: 'Kerala',
    slug: 'kerala',
    country: 'India',
    coordinates: { lat: 10.8505, lng: 76.2711 },
    timezone: 'Asia/Kolkata',
    best_season: 'September to March',
    tags: ['backwaters', 'nature', 'ayurveda'],
    best_areas: [
      { name: 'Alleppey / Alappuzha', description: 'Houseboats, backwaters', vibe: 'serene' },
      { name: 'Munnar', description: 'Tea gardens, hills', vibe: 'nature' },
      { name: 'Kochi', description: 'Fort Kochi, heritage, food', vibe: 'cultural' },
      { name: 'Thekkady', description: 'Periyar wildlife, spice plantations', vibe: 'wildlife' },
    ],
    average_cost: { min_per_day: 4000, max_per_day: 20000, currency: 'INR' },
    transport_options: [
      { type: 'Houseboat', description: 'Backwater cruises (overnight)', avg_cost: 8000 },
      { type: 'Taxi', description: 'Inter-city, hill stations', avg_cost: 2500 },
      { type: 'Local ferry', description: 'Backwater hops', avg_cost: 50 },
      { type: 'Auto-rickshaw', description: 'Within towns', avg_cost: 80 },
    ],
    popular_attractions: [
      { name: 'Backwaters houseboat', type: 'nature', description: 'Overnight on Vembanad Lake' },
      { name: 'Munnar Tea Gardens', type: 'nature', description: 'Tea plantations, Western Ghats' },
      { name: 'Periyar Wildlife Sanctuary', type: 'wildlife', description: 'Boat safari, tigers' },
      { name: 'Fort Kochi', type: 'heritage', description: 'Chinese nets, colonial architecture' },
      { name: 'Athirappilly Falls', type: 'nature', description: 'Niagara of India' },
      { name: 'Kumarakom Bird Sanctuary', type: 'nature', description: 'Bird watching' },
    ],
  },
  rajasthan: {
    name: 'Rajasthan',
    display_name: 'Rajasthan',
    slug: 'rajasthan',
    country: 'India',
    coordinates: { lat: 27.0238, lng: 74.2179 },
    timezone: 'Asia/Kolkata',
    best_season: 'October to March',
    tags: ['desert', 'palaces', 'culture'],
    best_areas: [
      { name: 'Jaipur', description: 'Pink City, forts, bazaars', vibe: 'heritage' },
      { name: 'Udaipur', description: 'City of Lakes, palaces', vibe: 'romantic' },
      { name: 'Jaisalmer', description: 'Desert, camel safari', vibe: 'adventure' },
      { name: 'Jodhpur', description: 'Blue City, Mehrangarh', vibe: 'cultural' },
    ],
    average_cost: { min_per_day: 3000, max_per_day: 20000, currency: 'INR' },
    transport_options: [
      { type: 'Taxi (full day)', description: 'Fort circuits, city tours', avg_cost: 2500 },
      { type: 'Auto-rickshaw', description: 'City short trips', avg_cost: 100 },
      { type: 'Camel safari', description: 'Jaisalmer desert', avg_cost: 2000 },
      { type: 'Inter-city cab', description: 'Jaipur–Udaipur–Jodhpur', avg_cost: 4000 },
    ],
    popular_attractions: [
      { name: 'Amber Fort', type: 'heritage', description: 'Jaipur hill fort' },
      { name: 'Lake Pichola', type: 'nature', description: 'Udaipur boat rides' },
      { name: 'Mehrangarh Fort', type: 'heritage', description: 'Jodhpur fort' },
      { name: 'Jaisalmer Desert', type: 'adventure', description: 'Camel safari, dunes' },
      { name: 'City Palace Udaipur', type: 'heritage', description: 'Palace complex' },
      { name: 'Hawa Mahal', type: 'heritage', description: 'Jaipur Palace of Winds' },
    ],
  },
};

function slugFromDestination(destination) {
  if (!destination || typeof destination !== 'string') return null;
  const s = destination.trim().toLowerCase();
  if (DESTINATION_DATASETS[s]) return s;
  // Partial match: "goa trip" -> goa, "manali" -> manali
  for (const key of Object.keys(DESTINATION_DATASETS)) {
    if (s.includes(key)) return key;
  }
  return null;
}

function getStaticContext(destination) {
  const slug = slugFromDestination(destination);
  if (slug) return { ...DESTINATION_DATASETS[slug] };

  return {
    name: destination || 'Unknown',
    display_name: destination || 'Unknown',
    slug: null,
    country: 'India',
    coordinates: null,
    timezone: 'Asia/Kolkata',
    best_season: 'Varies',
    tags: ['city-break'],
    best_areas: [],
    average_cost: { min_per_day: 2000, max_per_day: 10000, currency: 'INR' },
    transport_options: [
      { type: 'Taxi', description: 'Local travel', avg_cost: 300 },
      { type: 'Auto-rickshaw', description: 'Short trips', avg_cost: 100 },
    ],
    popular_attractions: [],
  };
}

/** Normalize DB row to same shape as static dataset (camelCase where needed for backward compat). */
function normalizeDbRow(row) {
  if (!row) return null;
  return {
    name: row.display_name || row.slug,
    display_name: row.display_name,
    slug: row.slug,
    country: row.country || 'India',
    coordinates: row.coordinates || null,
    timezone: row.timezone || 'Asia/Kolkata',
    best_season: row.best_season || null,
    tags: row.tags || [],
    best_areas: row.best_areas || [],
    average_cost: row.average_cost || { min_per_day: 3000, max_per_day: 15000, currency: 'INR' },
    transport_options: row.transport_options || [],
    popular_attractions: row.popular_attractions || [],
  };
}

const geoService = {
  /**
   * Get destination context: best areas, average cost, transport options, popular attractions.
   * @param {string} destination - e.g. "Goa", "Manali", "Jaipur"
   * @param {object} [supabaseClient] - Optional Supabase client; if provided, fetches from destination_contexts first
   * @returns {Promise<object>}
   */
  async getDestinationContext(destination, supabaseClient = null) {
    if (supabaseClient) {
      try {
        const slug = slugFromDestination(destination);
        let result = null;

        if (slug) {
          const { data, error } = await supabaseClient
            .from('destination_contexts')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
          if (!error && data) result = data;
        }

        if (!result) {
          const { data, error } = await supabaseClient
            .from('destination_contexts')
            .select('*')
            .ilike('display_name', `%${(destination || '').trim()}%`)
            .limit(1)
            .maybeSingle();
          if (!error && data) result = data;
        }

        if (result) return normalizeDbRow(result);
      } catch (err) {
        console.warn('Geo: Supabase fetch failed, using static dataset:', err.message);
      }
    }

    return getStaticContext(destination);
  },
};

module.exports = { geoService, getStaticContext, slugFromDestination };
