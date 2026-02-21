// Test Gemini + Mistral API keys
require('dotenv').config();

// ── Gemini ──────────────────────────────────────────────────────────────────
async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  console.log('\n🔷 GEMINI');
  if (!key) { console.log('  ❌ GEMINI_API_KEY not set'); return; }
  console.log(`  Key: ${key.slice(0, 12)}...  Model: ${model}`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Reply with just the word: hello' }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 10 },
      }),
    });
    const json = await r.json();
    if (!r.ok) {
      console.log(`  ❌ Error ${r.status}: ${(json?.error?.message || '').slice(0, 150)}`);
    } else {
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '(no text)';
      console.log(`  ✅ Response: "${text.trim()}"`);
    }
  } catch (e) {
    console.log(`  💥 Fetch error: ${e.message}`);
  }
}

// ── Mistral ──────────────────────────────────────────────────────────────────
async function testMistral() {
  const key = process.env.MISTRAL_API_KEY;
  const model = process.env.MISTRAL_MODEL || 'mistral-small-latest';
  console.log('\n🟡 MISTRAL');
  if (!key) { console.log('  ❌ MISTRAL_API_KEY not set'); return; }
  console.log(`  Key: ${key.slice(0, 12)}...  Model: ${model}`);
  try {
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Reply with just the word: hello' }],
      }),
    });
    const json = await r.json();
    if (!r.ok) {
      console.log(`  ❌ Error ${r.status}: ${(json?.message || JSON.stringify(json)).slice(0, 150)}`);
    } else {
      const text = json?.choices?.[0]?.message?.content || '(no text)';
      console.log(`  ✅ Response: "${text.trim()}"`);
    }
  } catch (e) {
    console.log(`  💥 Fetch error: ${e.message}`);
  }
}

(async () => {
  console.log('═══════════════════════════════════════');
  console.log('         AI API Key Tester');
  console.log('═══════════════════════════════════════');
  await testGemini();
  await testMistral();
  console.log('\n═══════════════════════════════════════\n');
})();
