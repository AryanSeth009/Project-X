// Simple Geo service used by the itinerary generation API.
// In a real system this would call an external geocoding provider.

const DESTINATION_MAP = {
  goa: {
    name: 'Goa',
    country: 'India',
    coordinates: { lat: 15.2993, lng: 74.124 },
    timezone: 'Asia/Kolkata',
    bestSeason: 'November to February',
    tags: ['beach', 'nightlife', 'relaxation'],
  },
  kerala: {
    name: 'Kerala',
    country: 'India',
    coordinates: { lat: 10.8505, lng: 76.2711 },
    timezone: 'Asia/Kolkata',
    bestSeason: 'September to March',
    tags: ['backwaters', 'nature', 'ayurveda'],
  },
  rajasthan: {
    name: 'Rajasthan',
    country: 'India',
    coordinates: { lat: 27.0238, lng: 74.2179 },
    timezone: 'Asia/Kolkata',
    bestSeason: 'October to March',
    tags: ['desert', 'palaces', 'culture'],
  },
};

function normalizeDestination(destination) {
  if (!destination) return null;
  const key = destination.trim().toLowerCase();
  if (DESTINATION_MAP[key]) return DESTINATION_MAP[key];

  // Fallback "generic city" context
  return {
    name: destination,
    country: 'Unknown',
    coordinates: null,
    timezone: 'UTC',
    bestSeason: 'Varies by location',
    tags: ['city-break'],
  };
}

const geoService = {
  /**
   * Get geo / destination context for itinerary generation.
   * @param {string} destination
   * @returns {Promise<object>}
   */
  async getDestinationContext(destination) {
    // In a real implementation you would:
    // - Call a geocoding API (e.g. Google Maps, Mapbox, OpenStreetMap)
    // - Resolve coordinates, timezone, climate, etc.
    // Here we return a small, deterministic mock.
    return normalizeDestination(destination);
  },
};

module.exports = { geoService };

