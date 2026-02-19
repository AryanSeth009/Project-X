// Upload Goa embeddings to Pinecone
// Usage:
//   PINECONE_API_KEY=... node backend/src/scripts/uploadGoaEmbeddingsToPinecone.cjs
//   (Make sure index \"travel-app\" exists with correct dimensionality.)

const fs = require('fs');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index('travel-app');

const embeddingsPath = path.join(
  __dirname,
  '..',
  'geo-data',
  'goa-embeddings.json',
);
const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'));

async function upload() {
  await index.upsert(
    embeddings.map((item, i) => ({
      id: item.id || `goa-${i}`,
      values: item.embedding,
      metadata: {
        text: item.text,
        destination: 'Goa',
      },
    })),
  );

  console.log('Uploaded', embeddings.length, 'vectors to Pinecone index travel-app');
}

upload().catch((err) => {
  console.error('Upload to Pinecone failed:', err);
  process.exit(1);
});

