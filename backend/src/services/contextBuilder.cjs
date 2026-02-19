// Context Builder – merges structured geo data + vector insights into rich context for AI
// This is the "secret sauce" that makes itineraries specific instead of generic

const fs = require('fs');
const path = require('path');

// Map destination variations to dataset slugs (e.g. "North Goa" -> "goa")
const DESTINATION_ALIASES = {
  goa: ['goa', 'north goa', 'south goa', 'baga', 'anjuna', 'palolem', 'calangute'],
  manali: ['manali', 'old manali', 'solang', 'rohtang'],
  jaipur: ['jaipur', 'pink city', 'amer', 'rajasthan'],
};

function resolveDestinationSlug(destination) {
  const input = String(destination || '').toLowerCase().trim();
  if (!input) return null;
  for (const [slug, aliases] of Object.entries(DESTINATION_ALIASES)) {
    if (aliases.some((a) => input.includes(a) || a.includes(input))) {
      return slug;
    }
  }
  return input.replace(/\s+/g, '-');
}

function loadGeoDataset(destination) {
  const slug = resolveDestinationSlug(destination);
  if (!slug) return null;
  const filePath = path.join(__dirname, '..', 'geo-data', `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function buildRichContext(destination, structuredData, vectorInsights = []) {
  if (!structuredData) return null;

  const areas = structuredData.areas || [];
  const attractions = structuredData.attractions || [];
  const travelClusters = structuredData.travelClusters || [];
  const budgetTips = structuredData.budgetTips || [];
  const hiddenGems = structuredData.hiddenGems || [];

  // Extract specific places (restaurants, hostels, activities) from areas
  const specificRestaurants = [];
  const specificHostels = [];
  const specificActivities = [];
  const specificAttractions = [];
  const specificTravelClusters = [];

  areas.forEach((area) => {
    if (area.specificPlaces) {
      if (Array.isArray(area.specificPlaces.restaurants)) {
        area.specificPlaces.restaurants.forEach((r) => {
          specificRestaurants.push({
            ...r,
            area: area.name,
            areaType: area.type,
          });
        });
      }
      if (Array.isArray(area.specificPlaces.hostels)) {
        area.specificPlaces.hostels.forEach((h) => {
          specificHostels.push({
            ...h,
            area: area.name,
            areaType: area.type,
          });
        });
      }
      if (Array.isArray(area.specificPlaces.activities)) {
        area.specificPlaces.activities.forEach((a) => {
          specificActivities.push({
            ...a,
            area: area.name,
            areaType: area.type,
          });
        });
      }
    }
  });

  // Build rich context object
  return {
    destination: structuredData.destination || destination,
    recommendedAreas: areas.map((a) => ({
      name: a.name,
      type: a.type,
      budgetRange: a.budgetRange,
      bestFor: a.bestFor || [],
    })),
    avgHotelCost: areas.length > 0
      ? Math.round(
          areas.reduce((sum, a) => sum + (a.budgetRange?.hotel || 0), 0) /
            areas.length,
        )
      : null,
    scooterCost: structuredData.transport?.scooter?.costPerDay || null,
    taxiCost: structuredData.transport?.taxi?.avgCostPerTrip || null,
    travelClusters: travelClusters.map((c) => ({
      clusterName: c.clusterName,
      places: c.places || [],
      vibe: c.vibe,
      dayPlan: c.dayPlan,
    })),
    specificRestaurants,
    specificHostels,
    specificActivities,
    specificAttractions,
    specificTravelClusters,
    popularAttractions: attractions.map((a) => ({
      name: a.name,
      type: a.type,
      avgTime: a.avgTime,
      bestTime: a.bestTime,
      entryFee: a.entryFee,
      nearby: a.nearby || [],
      specificActivities: a.specificActivities || [],
    })),
    budgetTips,
    hiddenGems,
    vectorInsights: Array.isArray(vectorInsights) ? vectorInsights : [],
  };
}

function getGeoContext(destination, userQuery, vectorGeoContext = null) {
  const structuredData = loadGeoDataset(destination);

  if (!structuredData) {
    return {
      destination,
      recommendedAreas: [],
      specificRestaurants: [],
      specificHostels: [],
      specificActivities: [],
      vectorInsights: vectorGeoContext?.vectorInsights || [],
      meta: { hasStructuredData: false },
    };
  }

  const vectorInsights =
    vectorGeoContext?.vectorInsights || vectorGeoContext?.meta?.vectorInsights || [];

  return buildRichContext(destination, structuredData, vectorInsights);
}

module.exports = {
  getGeoContext,
  buildRichContext,
  loadGeoDataset,
};
