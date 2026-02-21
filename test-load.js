const { loadGeoDataset, getGeoContext } = require('./backend/src/services/contextBuilder.cjs');

console.log("Loading dataset...");
const data = loadGeoDataset('Alleppey');
console.log(data ? `Success! Destination: ${data.destination}` : "Failed to load.");

console.log("Building Context...");
const context = getGeoContext('Alleppey', 'Test');
console.log(context ? `Context built with areas: ${context.recommendedAreas?.length}` : "Failed to build.");
