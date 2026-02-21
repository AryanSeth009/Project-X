async function fetchImageFromWiki(query) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&format=json&piprop=original`;
    const res = await fetch(url, { headers: { 'User-Agent': 'YatraAI/1.0' } });
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0];
      if (page.original && page.original.source) {
        return page.original.source;
      }
    }
  } catch (err) {}
  return null;
}

async function run() {
  console.log('Munnar:', await fetchImageFromWiki('Munnar'));
  console.log('Baga Beach:', await fetchImageFromWiki('Baga Beach'));
  console.log('Varkala Cliff:', await fetchImageFromWiki('Varkala Cliff'));
  console.log('Breakfast:', await fetchImageFromWiki('Breakfast in Kerala'));
  console.log('Taj Mahal:', await fetchImageFromWiki('Taj Mahal'));
}

run();
