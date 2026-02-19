// Perplexity Service (real-time web insights)
// Docs: https://docs.perplexity.ai (Chat Completions / Sonar models)

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

async function fetchWithTimeout(url, options, timeoutMs = 20000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

const perplexityService = {
  /**
   * Fetch real-time travel insights for a destination.
   * Returns: weather info, reddit insights, latest recommendations.
   *
   * Env:
   * - PERPLEXITY_API_KEY (required for live web insights)
   * - PERPLEXITY_MODEL (default: sonar-pro)
   */
  async getTravelInsights(destination, userQuery = '') {
    const safeDestination = destination || 'your destination';
    const apiKey = process.env.PERPLEXITY_API_KEY;
    const model = process.env.PERPLEXITY_MODEL || 'sonar-pro';

    // If no key is configured, return a deterministic fallback so the app still works.
    if (!apiKey) {
      return {
        destination: safeDestination,
        summary: `Fallback insights (no PERPLEXITY_API_KEY configured) for ${safeDestination}.`,
        weather: {
          note: 'Configure PERPLEXITY_API_KEY to fetch real-time weather.',
        },
        reddit: {
          note: 'Configure PERPLEXITY_API_KEY to fetch real-time Reddit insights.',
        },
        latest_recommendations: {
          note: 'Configure PERPLEXITY_API_KEY to fetch real-time recommendations.',
        },
        sources: [],
        meta: {
          provider: 'perplexity',
          model,
          live: false,
        },
      };
    }

    const system = [
      'You are a travel research assistant with web access.',
      'Return ONLY valid JSON (no markdown, no extra text).',
      'Be concise, factual, and include sources when possible.',
    ].join('\n');

    const user = [
      `Destination: ${safeDestination}`,
      userQuery ? `User query: ${String(userQuery).trim()}` : '',
      '',
      'Task: Provide real-time travel insights with these fields:',
      '- weather: key notes for the travel dates if known (otherwise seasonal info), and typical temps/precip',
      '- reddit: common advice/pitfalls, best areas, scams to avoid, what locals recommend',
      '- latest_recommendations: new/updated attractions, restaurants, events (if any)',
      '- safety: short safety notes',
      '- budgeting: short budgeting notes',
      '- sources: array of { title, url } (best-effort; include at least 2 when available)',
      '',
      'Output JSON schema:',
      '{',
      '  "destination": string,',
      '  "summary": string,',
      '  "weather": object,',
      '  "reddit": object,',
      '  "latest_recommendations": object,',
      '  "safety": string,',
      '  "budgeting": string,',
      '  "sources": [{"title": string, "url": string}]',
      '}',
    ].join('\n');

    const resp = await fetchWithTimeout(
      'https://api.perplexity.ai/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      },
      25000,
    );

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(
        `Perplexity API error (${resp.status}): ${errText || resp.statusText}`,
      );
    }

    const json = await resp.json();
    const content = json?.choices?.[0]?.message?.content;
    const parsed = safeJsonParse(extractJson(content));

    if (!parsed) {
      throw new Error(
        'Perplexity returned non-JSON content. Update prompt/model or enable JSON output.',
      );
    }

    return {
      ...parsed,
      destination: parsed.destination || safeDestination,
      meta: {
        provider: 'perplexity',
        model,
        live: true,
      },
    };
  },
};

module.exports = { perplexityService };

