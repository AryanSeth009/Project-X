const { itineraryGenerator } = require('./lib/itinerary-generator.js');
const { loadGeoDataset, buildRichContext } = require('./backend/src/services/contextBuilder.cjs');

async function testGenerator() {
  try {
    const destination = 'Munnar';
    // Get basic context directly to simulate the JSON pipeline
    const structuredData = loadGeoDataset(destination);
    const geoContext = buildRichContext(destination, structuredData, []);
    
    if (!geoContext) {
      console.error('No geo context found');
      return;
    }

    const formData = {
      destination: destination,
      startDate: '2026-03-01',
      endDate: '2026-03-03',
      budget: '30000',
      travelers: '2',
      interests: ['Nature', 'Relaxation']
    };

    const itinerary = await itineraryGenerator.generateItinerary(formData, geoContext);
    console.log('Itinerary Title:', itinerary.title);
    console.log('Number of days:', itinerary.days.length);
    let totalActivities = 0;
    itinerary.days.forEach((d, i) => {
      console.log(`Day ${i+1}: ${d.activities.length} activities`);
      totalActivities += d.activities.length;
    });
    console.log('Total activities scheduled:', totalActivities);
    if (totalActivities > 0) {
      console.log('Sample activity:', itinerary.days[0].activities[0]);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testGenerator();
