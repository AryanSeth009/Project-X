const fetch = require('node-fetch');

async function testRichGeo() {
  try {
    const res = await fetch('http://localhost:3001/api/geo/context?destination=Alleppey');
    const data = await res.json();
    
    console.log('Success:', data.success);
    if (data.richGeo) {
      console.log('Keys:', Object.keys(data.richGeo));
      console.log('Areas:', data.richGeo.recommendedAreas);
      console.log('Restaurants:', data.richGeo.specificRestaurants);
      
    } else {
      console.log('No rich geo context returned.');
    }
  } catch (err) {
    console.error('Test script error:', err.message);
  }
}

testRichGeo();
