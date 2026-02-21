// AI Service – generates structured itinerary JSON using OpenAI or Claude.
// Falls back to local heuristic generator if no API key is configured.

const { itineraryGenerator } = require('./itinerary-generator');

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const fence = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) return fence[1].trim();
  return text.trim();
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toValidTime(str) {
  if (str == null) return null;
  const s = String(str).trim();
  // Convert legacy fractional hour format: "14.5:00" -> "14:30"
  const m = s.match(/^(\d+)\.5:00$/);
  if (m) return String(m[1]).padStart(2, '0') + ':30';
  // Accept HH:MM or HH:MM:SS, normalize to HH:MM
  const mm = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (mm) return String(mm[1]).padStart(2, '0') + ':' + mm[2];
  return null;
}

function normalizeItinerary(itinerary, fallback) {
  const it = itinerary || fallback;
  if (!it) return null;

  const days = Array.isArray(it.days) ? it.days : [];
  return {
    title: it.title || fallback?.title,
    destination: it.destination || fallback?.destination,
    start_date: it.start_date || fallback?.start_date,
    end_date: it.end_date || fallback?.end_date,
    budget: Number.isFinite(it.budget) ? it.budget : fallback?.budget,
    travelers: Number.isFinite(it.travelers) ? it.travelers : fallback?.travelers,
    preferences: it.preferences ?? fallback?.preferences,
    days: days.map((d) => ({
      day_number: d.day_number,
      date: d.date,
      title: d.title,
      notes: d.notes,
      activities: (Array.isArray(d.activities) ? d.activities : []).map((a, idx) => ({
        title: a.title,
        description: a.description,
        time_start: toValidTime(a.time_start) || '09:00',
        time_end: toValidTime(a.time_end) || '10:00',
        location: a.location,
        cost: typeof a.cost === 'number' ? a.cost : 0,
        category: a.category || 'activity',
        order_index: typeof a.order_index === 'number' ? a.order_index : idx,
        image_url: a.image_url,
      })),
    })),
  };
}

async function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function generateWithOpenAI({ prompt, model }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const resp = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Return ONLY valid JSON. Do not include markdown. Ensure times are HH:MM 24-hour format.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    },
    45000,
  );

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`OpenAI API error (${resp.status}): ${errText || resp.statusText}`);
  }

  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  return safeJsonParse(extractJson(content));
}

async function generateWithGemini({ prompt, model }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
        systemInstruction: {
          parts: [{ text: 'Return ONLY valid JSON. Do not include markdown. Ensure times are HH:MM 24-hour format.' }],
        },
      }),
    },
    45000,
  );

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Gemini API error (${resp.status}): ${errText || resp.statusText}`);
  }

  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return safeJsonParse(extractJson(text || ''));
}

async function generateWithClaude({ prompt, model }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const resp = await fetchWithTimeout(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2500,
        system:
          'Return ONLY valid JSON. Do not include markdown. Ensure times are HH:MM 24-hour format.',
        messages: [{ role: 'user', content: prompt }],
      }),
    },
    60000,
  );

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Claude API error (${resp.status}): ${errText || resp.statusText}`);
  }

  const json = await resp.json();
  const blocks = Array.isArray(json?.content) ? json.content : [];
  const text = blocks
    .filter((b) => b?.type === 'text' && typeof b?.text === 'string')
    .map((b) => b.text)
    .join('\n');

  return safeJsonParse(extractJson(text));
}

function buildPrompt({ formData, geo, insights }) {
  const schema = {
    title: 'string',
    destination: 'string',
    start_date: 'YYYY-MM-DD',
    end_date: 'YYYY-MM-DD',
    budget: 'number',
    travelers: 'number',
    preferences: 'any',
    days: [
      {
        day_number: 'number (1..N)',
        date: 'YYYY-MM-DD',
        title: 'string',
        notes: 'string (optional)',
        activities: [
          {
            title: 'string',
            description: 'string',
            time_start: 'HH:MM (24h)',
            time_end: 'HH:MM (24h)',
            location: 'string',
            cost: 'number',
            category: 'attraction|food|transport|accommodation|activity',
            order_index: 'number (0..)',
            image_url: 'string (optional)',
          },
        ],
      },
    ],
  };

  return [
    'Generate a travel itinerary as STRICT JSON matching this schema (no extra keys):',
    JSON.stringify(schema, null, 2),
    '',
    'User input:',
    JSON.stringify(formData, null, 2),
    '',
    formData?.personalPrompt ? `User prompt: ${String(formData.personalPrompt).trim()}` : 'User prompt: (none)',
    '',
    'Geo context (best areas / average cost / transport / attractions):',
    JSON.stringify(geo, null, 2),
    '',
    'Perplexity insights (weather/reddit/latest recommendations):',
    JSON.stringify(insights, null, 2),
    '',
    'Constraints:',
    '- Use 24-hour times in HH:MM (no decimals).',
    '- Keep total daily costs roughly within daily budget (budget / number of days).',
    formData?.itineraryStyle === 'top-10' 
      ? '- IMPORTANT: Return EXACTLY ONE DAY with EXACTLY 10 activities representing the best spots in the city. Title this day "Top 10 Must-Visit Places".'
      : '- Include 4-7 activities/day depending on arrival/departure days.',
    '- Prefer geo best_areas and popular_attractions when relevant.',
  ].join('\n');
}

const aiService = {
  /**
   * Generate an itinerary using an LLM when configured.
   * Env:
   * - AI_PROVIDER: openai | claude | gemini (optional)
   * - OPENAI_API_KEY + OPENAI_MODEL (default: gpt-4o-mini)
   * - ANTHROPIC_API_KEY + ANTHROPIC_MODEL (default: claude-3-5-sonnet-latest)
   * - GEMINI_API_KEY + GEMINI_MODEL (default: gemini-1.5-flash) — for testing phase
   */
  async generateItinerary(context) {
    const { formData, geo, insights } = context;

    // Always compute a fallback itinerary so the app keeps working
    // if the LLM response is invalid or keys aren't configured.
    // Pass geo context so fallback also uses geo intelligence.
    const fallback = await itineraryGenerator.generateItinerary(formData, geo);

    // Initial phase: prefer GPT-4o-mini; testing phase: Gemini 1.5 Flash
    const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const claudeModel = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    const prompt = buildPrompt({ formData, geo, insights });

    let raw = null;
    let usedProvider = 'local';

    try {
      if (provider === 'gemini') {
        raw = await generateWithGemini({ prompt, model: geminiModel });
        usedProvider = raw ? 'gemini' : 'local';
      } else if (provider === 'claude') {
        raw = await generateWithClaude({ prompt, model: claudeModel });
        usedProvider = raw ? 'claude' : 'local';
      } else if (provider === 'openai') {
        raw = await generateWithOpenAI({ prompt, model: openaiModel });
        usedProvider = raw ? 'openai' : 'local';
      } else {
        // Auto-select based on which keys are present (OpenAI → Gemini → Claude)
        raw = await generateWithOpenAI({ prompt, model: openaiModel });
        if (raw) usedProvider = 'openai';
        if (!raw) {
          raw = await generateWithGemini({ prompt, model: geminiModel });
          if (raw) usedProvider = 'gemini';
        }
        if (!raw) {
          raw = await generateWithClaude({ prompt, model: claudeModel });
          if (raw) usedProvider = 'claude';
        }
      }
    } catch (err) {
      // If LLM fails, fall back to heuristic itinerary.
      raw = null;
      usedProvider = 'local';
      console.warn('AI generation failed, using fallback:', err.message);
    }

    // When we have rich geo with specific places, prefer fallback over generic LLM output
    const hasRichGeo =
      geo &&
      ((Array.isArray(geo.specificRestaurants) && geo.specificRestaurants.length > 0) ||
        (Array.isArray(geo.specificActivities) && geo.specificActivities.length > 0) ||
        (Array.isArray(geo.popularAttractions) && geo.popularAttractions.length > 0));

    let primary = raw;
    if (hasRichGeo) {
      if (!raw) primary = fallback;
      else {
        const llmHasSpecificPlaces = raw.days?.some((d) =>
          d.activities?.some((a) =>
            a.title &&
            (a.title.includes(' at ') ||
              /^(Lunch|Breakfast|Dinner) at /.test(a.title) ||
              /\b(Britto|German Bakery|Zostel|Curlies|Anjuna Flea)\b/i.test(a.title)),
          ),
        );
        if (!llmHasSpecificPlaces) primary = fallback;
      }
    }

    const itinerary = normalizeItinerary(primary, fallback);

    return {
      ...itinerary,
      meta: {
        geo,
        insights,
        generatedAt: new Date().toISOString(),
        aiProvider: usedProvider,
        models: {
          openai: openaiModel,
          claude: claudeModel,
          gemini: geminiModel,
        },
      },
    };
  },
};

module.exports = { aiService };

