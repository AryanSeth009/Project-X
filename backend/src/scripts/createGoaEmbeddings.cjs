// Create embeddings for Goa geo dataset using OpenAI (Node CJS)
// Usage:
//   OPENAI_API_KEY=... node backend/src/scripts/createGoaEmbeddings.cjs

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const dataPath = path.join(__dirname, '..', 'geo-data', 'goa.json');
const goaData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

async function processData() {
  const embeddings = [];

  for (const area of goaData.areas) {
    const text = [
      `Area: ${area.name}`,
      `Type: ${area.type}`,
      `Best for: ${area.bestFor.join(', ')}`,
      `Hostel cost: ${area.budgetRange.hostel}`,
    ].join('\n');

    const embedding = await createEmbedding(text);

    embeddings.push({
      id: `goa-area-${area.name.toLowerCase()}`,
      text,
      embedding,
    });
  }

  const outPath = path.join(__dirname, '..', 'geo-data', 'goa-embeddings.json');
  fs.writeFileSync(outPath, JSON.stringify(embeddings, null, 2));
  console.log('Wrote embeddings to', outPath);
}

processData().catch((err) => {
  console.error('Embedding generation failed:', err);
  process.exit(1);
});

