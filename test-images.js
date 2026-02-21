const fetch = require('node-fetch');

async function testImages() {
  const queries = ['Munnar', 'Baga Beach', 'Cafe', 'Taj Mahal'];

  for (const q of queries) {
    console.log(`\nTesting query: ${q}`);
    
    // Test LoremFlickr
    const loremUrl = `https://loremflickr.com/800/600/${encodeURIComponent(q.split(' ')[0])}`;
    try {
      const res = await fetch(loremUrl, { redirect: 'manual' }); // it redirects to actual image
      console.log(`LoremFlickr (${loremUrl}) status:`, res.status, res.headers.get('location') || 'no redirect');
    } catch (e) {
      console.error('LoremFlickr error:', e.message);
    }

    // Test Wiki
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=1&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=800`;
    try {
      const res = await fetch(wikiUrl);
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0];
        console.log(`Wiki image for ${q}:`, page.thumbnail?.source || 'No image found');
      } else {
        console.log(`Wiki: No results for ${q}`);
      }
    } catch (e) {
      console.error('Wiki error:', e.message);
    }
  }
}

testImages();
