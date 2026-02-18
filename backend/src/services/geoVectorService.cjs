// Geo Intelligence via JSON dataset + Pinecone vector search
// getGeoContext(destination, userQuery) -> { structuredData, vectorInsights }

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

function loadStructuredData(destination) {
  const slug = String(destination || '').toLowerCase();
  const filePath = path.join(
    __dirname,
    '..',
    'geo-data',
    `${slug}.json`,
  );
  if (!fs.existsSync(filePath)) {
    throw new Error(`No geo dataset JSON found for destination: ${destination}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function getClients() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const pineconeKey = process.env.PINECONE_API_KEY;
  if (!openaiKey || !pineconeKey) {
    return { openai: null, pinecone: null };
  }
  const openai = new OpenAI({ apiKey: openaiKey });
  const pinecone = new Pinecone({ apiKey: pineconeKey });
  return { openai, pinecone };
}

async function getGeoContext(destination, userQuery) {
  const structuredData = loadStructuredData(destination);
  const { openai, pinecone } = getClients();

  // If keys not configured, return only structured JSON dataset.
  if (!openai || !pinecone) {
    return {
      structuredData,
      vectorInsights: [],
      meta: { vectorsEnabled: false },
    };
  }

  const index = pinecone.index('travel-app');

  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: userQuery,
  });

  const results = await index.query({
    vector: queryEmbedding.data[0].embedding,
    topK: 5,
    filter: {
      destination: destination,
    },
  });

  const vectorInsights = (results.matches || []).map((m) => m.metadata?.text).filter(Boolean);

  return {
    structuredData,
    vectorInsights,
    meta: { vectorsEnabled: true, vectorCount: vectorInsights.length },
  };
}

module.exports = {
  getGeoContext,
};

