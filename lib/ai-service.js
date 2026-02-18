// Core AI itinerary service.
// This service combines geo context + Perplexity insights + your itinerary
// generator to produce the final itinerary JSON.

const { itineraryGenerator } = require('./itinerary-generator');

const aiService = {
  /**
   * Generate an itinerary given the full context collected by the backend.
   * @param {object} context
   *  - formData: { destination, startDate, endDate, travelers, budget, interests }
   *  - geo: destinationContext from geoService
   *  - insights: travelInsights from perplexityService
   * @returns {Promise<object>} Generated itinerary
   */
  async generateItinerary(context) {
    const { formData, geo, insights } = context;

    // For now we delegate the heavy lifting to the existing
    // itineraryGenerator used in the app. In a real system you can
    // pass `geo` and `insights` into an LLM prompt and post-process
    // the result into the same schema.
    const baseItinerary = await itineraryGenerator.generateItinerary(formData);

    // Attach context so the caller can optionally display / debug it.
    return {
      ...baseItinerary,
      meta: {
        geo,
        insights,
        generatedAt: new Date().toISOString(),
      },
    };
  },
};

module.exports = { aiService };

