// Perplexity service stub used by the itinerary generation API.
// Replace this with real Perplexity API calls when you have credentials.

const perplexityService = {
  /**
   * Get high-level travel insights for a destination.
   * In production, this would call the Perplexity API with a prompt.
   * @param {string} destination
   * @returns {Promise<object>}
   */
  async getTravelInsights(destination) {
    // NOTE: This is intentionally a lightweight, deterministic mock so that
    // the backend can run without external API keys.
    const safeDestination = destination || 'your destination';

    return {
      destination: safeDestination,
      summary: `High-level AI-generated travel insights for ${safeDestination}.`,
      tips: [
        'Balance must-see attractions with time for rest.',
        'Group nearby sights on the same day to reduce travel time.',
        'Plan key activities for mornings and sunsets for golden hour views.',
      ],
      safety: 'Follow local advisories, respect cultural norms, and keep copies of important documents.',
      budgeting: 'Prioritize accommodations and experiences that align with your daily budget.',
    };
  },
};

module.exports = { perplexityService };

