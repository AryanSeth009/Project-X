// JavaScript runtime version of the itinerary generator
// for use by the Node.js API server (api-server.js, ai-service.js).
// Production-ready: variety per day, geo-first, no repetition.

const CONFIG = {
  MAX_ACTIVITY_COST_RATIO: 0.3, // Max 30% of daily budget per activity
  BREAK_MINUTES: 30,
  DAY_START_HOUR: 9,
  DAY_END_HOUR: 21,
  ARRIVAL_DEPARTURE_HOURS: 6,
  FULL_DAY_HOURS: 8,
};

class ItineraryGenerator {
  constructor() {
    this.activityDatabase = {
      attractions: {
        Goa: [
          {
            name: 'Baga Beach',
            cost: 0,
            duration: 2,
            category: 'attraction',
            description: 'Famous beach with water sports and vibrant atmosphere',
          },
          {
            name: 'Dudhsagar Falls',
            cost: 600,
            duration: 4,
            category: 'attraction',
            description: 'Spectacular four-tiered waterfall in the Western Ghats',
          },
          {
            name: 'Basilica of Bom Jesus',
            cost: 0,
            duration: 1.5,
            category: 'attraction',
            description: "UNESCO World Heritage site with St. Francis Xavier's remains",
          },
          {
            name: 'Fort Aguada',
            cost: 100,
            duration: 2,
            category: 'attraction',
            description: '17th-century Portuguese fort with panoramic views',
          },
          {
            name: 'Anjuna Beach',
            cost: 0,
            duration: 2,
            category: 'attraction',
            description: 'Rocky beach famous for flea market and nightlife',
          },
          {
            name: 'Palolem Beach',
            cost: 0,
            duration: 3,
            category: 'attraction',
            description: 'Scenic crescent-shaped beach with calm waters',
          },
          {
            name: 'Old Goa Churches',
            cost: 200,
            duration: 3,
            category: 'attraction',
            description: 'Historical churches from Portuguese era',
          },
          {
            name: 'Aguada Lighthouse',
            cost: 50,
            duration: 1,
            category: 'attraction',
            description: 'Historic lighthouse with ocean views',
          },
        ],
        Kerala: [
          {
            name: 'Backwaters Houseboat',
            cost: 8000,
            duration: 8,
            category: 'attraction',
            description: 'Overnight stay in traditional Kerala houseboat',
          },
          {
            name: 'Munnar Tea Gardens',
            cost: 500,
            duration: 4,
            category: 'attraction',
            description: 'Sprawling tea plantations in Western Ghats',
          },
          {
            name: 'Periyar Wildlife Sanctuary',
            cost: 1500,
            duration: 6,
            category: 'attraction',
            description: 'Tiger reserve with boat safari and wildlife spotting',
          },
          {
            name: 'Athirappilly Waterfalls',
            cost: 300,
            duration: 3,
            category: 'attraction',
            description: 'Niagara of India - spectacular waterfall',
          },
          {
            name: 'Kumarakom Bird Sanctuary',
            cost: 200,
            duration: 3,
            category: 'attraction',
            description: 'Paradise for bird watchers on Vembanad Lake',
          },
          {
            name: 'Fort Kochi',
            cost: 100,
            duration: 3,
            category: 'attraction',
            description: 'Historic area with Chinese fishing nets and colonial architecture',
          },
          {
            name: 'Alleppey Beach',
            cost: 0,
            duration: 2,
            category: 'attraction',
            description: 'Beautiful beach with pier and lighthouse',
          },
          {
            name: 'Mattancherry Palace',
            cost: 150,
            duration: 2,
            category: 'attraction',
            description: 'Dutch palace with beautiful murals',
          },
        ],
        Manali: [
          { name: 'Rohtang Pass', cost: 0, duration: 8, category: 'attraction', description: 'High-altitude pass with snow and scenic views' },
          { name: 'Solang Valley', cost: 500, duration: 4, category: 'attraction', description: 'Adventure sports - paragliding, skiing, zorbing' },
          { name: 'Hadimba Temple', cost: 30, duration: 1, category: 'attraction', description: 'Wooden temple in cedar forest' },
          { name: 'Vashisht Hot Springs', cost: 50, duration: 1, category: 'attraction', description: 'Natural hot water springs' },
          { name: 'Old Manali Cafes', cost: 400, duration: 2, category: 'attraction', description: 'Cafe hopping with mountain views' },
          { name: 'Jogini Falls', cost: 0, duration: 3, category: 'attraction', description: 'Scenic waterfall trek from Vashisht' },
        ],
        Jaipur: [
          { name: 'Amber Fort', cost: 500, duration: 4, category: 'attraction', description: 'Hill fort with elephant rides' },
          { name: 'Hawa Mahal', cost: 50, duration: 1.5, category: 'attraction', description: 'Palace of Winds facade' },
          { name: 'City Palace', cost: 500, duration: 3, category: 'attraction', description: 'Royal residence and museums' },
          { name: 'Jantar Mantar', cost: 200, duration: 2, category: 'attraction', description: 'Astronomical instruments' },
          { name: 'Nahargarh Fort', cost: 200, duration: 2, category: 'attraction', description: 'Sunset views over Pink City' },
          { name: 'Johari Bazaar', cost: 0, duration: 2, category: 'attraction', description: 'Jewelry and handicrafts market' },
        ],
        Rajasthan: [
          {
            name: 'Amber Fort',
            cost: 500,
            duration: 4,
            category: 'attraction',
            description: 'Majestic hilltop fort with elephant rides available',
          },
          {
            name: 'City Palace Jaipur',
            cost: 300,
            duration: 3,
            category: 'attraction',
            description: 'Royal palace complex with museums and courtyards',
          },
          {
            name: 'Hawa Mahal',
            cost: 200,
            duration: 1.5,
            category: 'attraction',
            description: 'Palace of Winds with intricate honeycomb facade',
          },
          {
            name: 'Jantar Mantar',
            cost: 200,
            duration: 2,
            category: 'attraction',
            description: 'Astronomical observatory with massive instruments',
          },
          {
            name: 'Udaipur City Palace',
            cost: 600,
            duration: 4,
            category: 'attraction',
            description: 'Lakeside palace complex with stunning architecture',
          },
          {
            name: 'Lake Pichola Boat Ride',
            cost: 800,
            duration: 1.5,
            category: 'attraction',
            description: 'Scenic boat ride on picturesque lake',
          },
          {
            name: 'Mehrangarh Fort',
            cost: 400,
            duration: 4,
            category: 'attraction',
            description: 'Impressive fort overlooking Blue City',
          },
          {
            name: 'Camel Safari Jaisalmer',
            cost: 2000,
            duration: 6,
            category: 'attraction',
            description: 'Desert adventure on camelback with sunset views',
          },
        ],
        Default: [
          {
            name: 'City Heritage Walk',
            cost: 500,
            duration: 3,
            category: 'attraction',
            description: 'Guided tour through historic old town area',
          },
          {
            name: 'Local Museum',
            cost: 200,
            duration: 2,
            category: 'attraction',
            description: 'Learn about local history and culture',
          },
          {
            name: 'Sunset Viewpoint',
            cost: 100,
            duration: 2,
            category: 'attraction',
            description: 'Best spot to watch the sunset',
          },
          {
            name: 'Local Market',
            cost: 0,
            duration: 2,
            category: 'attraction',
            description: 'Vibrant market with local crafts and spices',
          },
          {
            name: 'City Park',
            cost: 0,
            duration: 1.5,
            category: 'attraction',
            description: 'Peaceful green space in the city center',
          },
          {
            name: 'Art Gallery',
            cost: 300,
            duration: 2,
            category: 'attraction',
            description: 'Showcase of local and regional artists',
          },
        ],
      },
      food: [
        {
          name: 'Traditional Breakfast',
          cost: 300,
          duration: 1,
          category: 'food',
          description: 'Authentic local breakfast specialties',
        },
        {
          name: 'Street Food Tour',
          cost: 800,
          duration: 3,
          category: 'food',
          description: 'Explore local street food scene',
        },
        {
          name: 'Fine Dining Restaurant',
          cost: 2000,
          duration: 2,
          category: 'food',
          description: 'Upscale restaurant with local cuisine',
        },
        {
          name: 'Local Cafe',
          cost: 400,
          duration: 1.5,
          category: 'food',
          description: 'Cozy cafe with local specialties',
        },
        {
          name: 'Beachside Restaurant',
          cost: 1200,
          duration: 2,
          category: 'food',
          description: 'Dining with ocean views',
        },
        {
          name: 'Cooking Class',
          cost: 1500,
          duration: 4,
          category: 'food',
          description: 'Learn to cook local dishes',
        },
      ],
      activities: [
        {
          name: 'Yoga Session',
          cost: 500,
          duration: 1.5,
          category: 'activity',
          description: 'Relaxing yoga session with instructor',
        },
        {
          name: 'Spa Treatment',
          cost: 2000,
          duration: 2,
          category: 'activity',
          description: 'Traditional spa and wellness treatment',
        },
        {
          name: 'Adventure Sports',
          cost: 1500,
          duration: 3,
          category: 'activity',
          description: 'Thrilling adventure activities',
        },
        {
          name: 'Cultural Show',
          cost: 800,
          duration: 2,
          category: 'activity',
          description: 'Traditional dance and music performance',
        },
        {
          name: 'Shopping Tour',
          cost: 1000,
          duration: 3,
          category: 'activity',
          description: 'Guided shopping for local crafts',
        },
        {
          name: 'Photography Walk',
          cost: 600,
          duration: 2.5,
          category: 'activity',
          description: 'Capture best spots with local photographer',
        },
        {
          name: 'Village Tour',
          cost: 800,
          duration: 4,
          category: 'activity',
          description: 'Experience rural local life',
        },
        {
          name: 'Sunset Cruise',
          cost: 1200,
          duration: 2,
          category: 'activity',
          description: 'Scenic cruise during golden hour',
        },
      ],
      transport: [
        {
          name: 'Airport Transfer',
          cost: 800,
          duration: 1,
          category: 'transport',
          description: 'Private transfer from airport',
        },
        {
          name: 'City Taxi Tour',
          cost: 2000,
          duration: 8,
          category: 'transport',
          description: 'Full day taxi for city exploration',
        },
        {
          name: 'Auto Rickshaw Ride',
          cost: 300,
          duration: 0.5,
          category: 'transport',
          description: 'Local auto rickshaw experience',
        },
        {
          name: 'Train Journey',
          cost: 500,
          duration: 3,
          category: 'transport',
          description: 'Scenic train ride to nearby destination',
        },
        {
          name: 'Bicycle Rental',
          cost: 200,
          duration: 4,
          category: 'transport',
          description: 'Explore area on bicycle',
        },
        {
          name: 'Boat Transfer',
          cost: 600,
          duration: 1,
          category: 'transport',
          description: 'Boat transfer to island or beach',
        },
      ],
      accommodation: [
        {
          name: 'Luxury Resort',
          cost: 8000,
          duration: 24,
          category: 'accommodation',
          description: '5-star resort with all amenities',
        },
        {
          name: 'Boutique Hotel',
          cost: 4000,
          duration: 24,
          category: 'accommodation',
          description: 'Charming boutique hotel',
        },
        {
          name: 'Heritage Property',
          cost: 5000,
          duration: 24,
          category: 'accommodation',
          description: 'Historic heritage property',
        },
        {
          name: 'Beach Resort',
          cost: 6000,
          duration: 24,
          category: 'accommodation',
          description: 'Resort with beach access',
        },
        {
          name: 'Budget Hotel',
          cost: 1500,
          duration: 24,
          category: 'accommodation',
          description: 'Clean and comfortable budget option',
        },
        {
          name: 'Homestay',
          cost: 2000,
          duration: 24,
          category: 'accommodation',
          description: 'Stay with local family',
        },
      ],
    };
  }

  getDestinationActivities(destination, excludeGenericFood = false) {
    const dest = String(destination || '').toLowerCase();
    const keys = Object.keys(this.activityDatabase.attractions);
    const match =
      keys.find((key) => dest.includes(key.toLowerCase())) || 'Default';

    const food = excludeGenericFood ? [] : this.activityDatabase.food;
    return [
      ...this.activityDatabase.attractions[match],
      ...food,
      ...this.activityDatabase.activities,
      ...this.activityDatabase.transport,
      ...this.activityDatabase.accommodation,
    ];
  }

  filterByInterests(activities, interests) {
    if (!interests || interests.length === 0) return activities;

    const interestMap = {
      Culture: ['attraction', 'activity'],
      Adventure: ['activity', 'attraction'],
      Food: ['food'],
      Nature: ['attraction', 'activity'],
      Shopping: ['activity'],
      Nightlife: ['activity'],
      History: ['attraction'],
      Relaxation: ['activity', 'accommodation'],
    };

    const preferredCategories = interests.flatMap(
      (interest) => interestMap[interest] || [],
    );
    if (preferredCategories.length === 0) return activities;

    return activities.map((activity) => ({
      ...activity,
      score: preferredCategories.includes(activity.category) ? 2 : 1,
    }));
  }

  filterByBudget(activities, dailyBudget) {
    return activities.filter((a) => (a && a.cost) <= dailyBudget * CONFIG.MAX_ACTIVITY_COST_RATIO);
  }

  hashStringToUnitInterval(input) {
    // Deterministic hash -> [0, 1) for stable per-day shuffling
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) / 4294967296);
  }

  optimizeSchedule(activities, availableHours, daySeed) {
    const sorted = [...activities].sort((a, b) => {
      const scoreA = (a && a.score) != null ? a.score : 1;
      const scoreB = (b && b.score) != null ? b.score : 1;
      if (scoreB !== scoreA) return scoreB - scoreA;

      const nameA = String((a && a.name) || '');
      const nameB = String((b && b.name) || '');
      const jA = this.hashStringToUnitInterval(`${daySeed}:${nameA}`);
      const jB = this.hashStringToUnitInterval(`${daySeed}:${nameB}`);
      return jB - jA;
    });
    const selected = [];
    let totalHours = 0;

    for (const activity of sorted) {
      const duration = activity.duration || 1;
      if (totalHours + duration <= availableHours) {
        selected.push(activity);
        totalHours += duration;
      }
    }

    return selected;
  }

  getRandomImage(activity) {
    const title = activity.name || activity.title || '';
    const category = activity.category || 'travel';
    const keywords = [
      'aerial',
      'landscape',
      'landmark',
      'scenic',
      '4k',
      'satellite'
    ];
    
    // Choose 2 random realism keywords
    const seed = this.hashStringToUnitInterval(title) * 100;
    const k1 = keywords[Math.floor(seed) % keywords.length];
    const k2 = keywords[Math.floor(seed * 1.5) % keywords.length];
    
    const query = `${encodeURIComponent(title || category)} ${k1} ${k2}`;
    return `https://source.unsplash.com/800x600/?${query}`;
  }

  generateTimeSlots(activities, startHour = CONFIG.DAY_START_HOUR) {
    let currentMinutes = startHour * 60;
    const result = [];

    activities.forEach((activity, index) => {
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const startHourFormatted = `${String(startH).padStart(2, '0')}:${String(
        startM,
      ).padStart(2, '0')}`;

      const durationHours = activity.duration || 1;
      const durationMinutes = Math.round(durationHours * 60);

      const endMinutes = Math.min(currentMinutes + durationMinutes, CONFIG.DAY_END_HOUR * 60);
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const endHourFormatted = `${String(endH).padStart(2, '0')}:${String(
        endM,
      ).padStart(2, '0')}`;

      result.push({
        title: activity.name,
        description: activity.description,
        time_start: startHourFormatted,
        time_end: endHourFormatted,
        location: activity.location || `${activity.name}`,
        cost: activity.cost,
        category: activity.category,
        order_index: index,
        image_url: this.getRandomImage(activity),
      });

      currentMinutes = Math.min(endMinutes + CONFIG.BREAK_MINUTES, CONFIG.DAY_END_HOUR * 60);
    });

    return result;
  }

  getDayTitle(dayNumber, destination, totalDays) {
    const dest = String(destination || '').toLowerCase();
    const isFirst = dayNumber === 1;
    const isLast = dayNumber === totalDays;
    if (isFirst) return `Arrival & ${destination} Exploration`;
    if (isLast) return `Farewell & Departure`;
    const themes = [
      'Beaches & Water Sports',
      'Heritage & Culture',
      'Adventure & Nature',
      'Local Life & Markets',
      'Relaxation & Hidden Gems',
    ];
    return themes[(dayNumber - 2) % themes.length] || `Day ${dayNumber} in ${destination}`;
  }

  /**
   * Create geo-specific activities. Rotates by day to avoid repetition.
   * When stayLocation is set and day === 1, prioritizes activities from that area.
   * @param {object} geoContext - Rich geo from contextBuilder
   * @param {number} day - Day number (1-based)
   * @param {number} dailyBudget - Budget per day
   * @param {Set} usedActivityNames - Global set of already-used activity names (mutated)
   * @param {string} stayLocation - Optional: where user is staying (e.g. Baga, Anjuna)
   */
  createSpecificActivitiesFromGeo(geoContext, day, dailyBudget, usedActivityNames = new Set(), stayLocation = '') {
    if (!geoContext) return [];
    const maxCost = dailyBudget * CONFIG.MAX_ACTIVITY_COST_RATIO;
    const specific = [];
    const useStayArea = stayLocation && day === 1;
    const stayAreaLower = useStayArea ? String(stayLocation).toLowerCase() : '';

    const markUsed = (name) => {
      if (name) usedActivityNames.add(name);
    };
    const isUsed = (name) => usedActivityNames.has(name);
    const matchesStayArea = (area) => area && String(area).toLowerCase().includes(stayAreaLower);

    // Restaurants: rotate by day; on Day 1 with stayLocation, prefer restaurants in that area
    if (Array.isArray(geoContext.specificRestaurants) && geoContext.specificRestaurants.length > 0) {
      let restaurants = geoContext.specificRestaurants.filter((r) => (r.cost || 0) <= maxCost);
      if (useStayArea && stayAreaLower) {
        const inArea = restaurants.filter((r) => matchesStayArea(r.area));
        if (inArea.length > 0) restaurants = inArea;
      }
      if (restaurants.length > 0) {
        const breakfastCandidates = restaurants.filter((r) =>
          (r.bestFor && String(r.bestFor).toLowerCase().includes('breakfast')) ||
          (r.timing && String(r.timing).includes('AM')),
        );
        const breakfastPool = breakfastCandidates.length > 0 ? breakfastCandidates : restaurants;
        const lunchPool = restaurants.filter((r) => !breakfastPool.includes(r) || breakfastPool.length <= 1)
          .length > 0 ? restaurants : breakfastPool;

        const breakfastIdx = (day - 1) % breakfastPool.length;
        const lunchIdx = (day - 1) % lunchPool.length;
        const breakfast = breakfastPool[breakfastIdx];
        const lunch = lunchPool[lunchIdx];

        const breakfastName = `Breakfast at ${breakfast.name}`;
        const lunchName = `Lunch at ${lunch.name}`;
        if (!isUsed(breakfastName)) {
          specific.push({
            name: breakfastName,
            cost: breakfast.cost || 400,
            duration: 1,
            category: 'food',
            description: `${breakfast.type || 'Restaurant'} - ${breakfast.bestFor || 'Local cuisine'} (₹${breakfast.cost || 400})`,
            location: `${(breakfast.area || '')} ${breakfast.name}`.trim(),
            geoSpecific: true,
          });
          markUsed(breakfastName);
        }
        if (lunch.name !== breakfast.name && !isUsed(lunchName)) {
          specific.push({
            name: lunchName,
            cost: lunch.cost || 600,
            duration: 1.5,
            category: 'food',
            description: `${lunch.type || 'Restaurant'} - ${lunch.bestFor || 'Local cuisine'} (₹${lunch.cost || 600})`,
            location: `${(lunch.area || '')} ${lunch.name}`.trim(),
            geoSpecific: true,
          });
          markUsed(lunchName);
        }
      }
    }

    // Activities: rotate by day; on Day 1 with stayLocation, prefer activities in that area
    if (Array.isArray(geoContext.specificActivities) && geoContext.specificActivities.length > 0) {
      let affordable = geoContext.specificActivities.filter((a) => (a.cost || 0) <= maxCost && !isUsed(a.name));
      if (useStayArea && stayAreaLower) {
        const inArea = affordable.filter((a) => matchesStayArea(a.area));
        if (inArea.length > 0) affordable = inArea;
      }
      if (affordable.length > 0) {
        const act = affordable[(day - 1) % affordable.length];
        let duration = 2;
        const d = act.duration;
        if (typeof d === 'number') duration = d;
        else if (typeof d === 'string') {
          duration = /min/i.test(d) ? Math.max(0.25, (parseFloat(d) || 30) / 60) : parseFloat(d) || 2;
        }
        specific.push({
          name: act.name,
          cost: act.cost || 0,
          duration,
          category: 'activity',
          description: act.operator ? `${act.description || act.name} (${act.operator})` : (act.description || act.name),
          location: `${(act.area || '')} ${act.name}`.trim(),
          geoSpecific: true,
        });
        markUsed(act.name);
      }
    }

    // Attractions: rotate by day; on Day 1 with stayLocation, prefer attractions near that area
    if (Array.isArray(geoContext.popularAttractions) && geoContext.popularAttractions.length > 0) {
      const visitName = (n) => `Visit ${n}`;
      let unused = geoContext.popularAttractions.filter((a) => !isUsed(visitName(a.name)));
      if (useStayArea && stayAreaLower) {
        const nearArea = unused.filter((a) =>
          (a.name && String(a.name).toLowerCase().includes(stayAreaLower)) ||
          (a.nearby && Array.isArray(a.nearby) && a.nearby.some((n) => String(n).toLowerCase().includes(stayAreaLower))),
        );
        if (nearArea.length > 0) unused = nearArea;
      }
      if (unused.length > 0) {
        const attr = unused[(day - 1) % unused.length];
        const avgTimeStr = attr.avgTime || '2';
        const avgTime = parseFloat(String(avgTimeStr).split('-')[0]) || 2;
        const entryFee = parseFloat(String(attr.entryFee || '0').replace(/[^0-9]/g, '')) || 0;
        const name = visitName(attr.name);
        specific.push({
          name,
          cost: entryFee,
          duration: avgTime,
          category: 'attraction',
          description: `${attr.type || 'Attraction'}${attr.bestTime ? ` - Best time: ${attr.bestTime}` : ''}${entryFee > 0 ? ` (Entry: ${attr.entryFee})` : ''}`.trim(),
          location: attr.name,
          geoSpecific: true,
        });
        markUsed(name);
      }
    }

    return specific;
  }

  async generateItinerary(formData, geoContext) {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    const budget = parseInt(formData.budget, 10) || 50000;
    const travelers = parseInt(formData.travelers, 10) || 1;
    const dailyBudget = budget / days;

    const hasRichGeo =
      geoContext &&
      ((Array.isArray(geoContext.specificRestaurants) && geoContext.specificRestaurants.length > 0) ||
        (Array.isArray(geoContext.popularAttractions) && geoContext.popularAttractions.length > 0));
    const destination = String(formData.destination || '');
    const isGoa = destination.toLowerCase().includes('goa');

    const allActivities = this.getDestinationActivities(destination, !!hasRichGeo);

    // Boost activities that match geo intelligence
    let geoBoostedActivities = allActivities;
    const geoAttractions = geoContext?.popular_attractions || geoContext?.popularAttractions;
    if (geoContext && Array.isArray(geoAttractions) && geoAttractions.length > 0) {
      const geoAttractionNames = geoAttractions.map((a) =>
        String((a && a.name) || '').toLowerCase(),
      );
      geoBoostedActivities = allActivities.map((act) => {
        const nameLower = String((act && act.name) || '').toLowerCase();
        const matchesGeo = geoAttractionNames.some((geoName) => 
          nameLower.includes(geoName) || geoName.includes(nameLower)
        );
        return {
          ...act,
          score: (act.score || 1) + (matchesGeo ? 3 : 0), // Strong boost for geo matches
        };
      });
    }
    
    const filteredByInterests = this.filterByInterests(
      geoBoostedActivities,
      formData.interests,
    );
    const filteredByBudget = this.filterByBudget(
      filteredByInterests,
      dailyBudget,
    );

    const generatedDays = [];
    const usedActivityNames = new Set();

    if (formData.itineraryStyle === 'top-10') {
      // Pick top 10 activities
      const top10Activities = [...filteredByBudget]
        .sort((a, b) => (b.score || 1) - (a.score || 1))
        .slice(0, 10);
      
      const timeSlots = this.generateTimeSlots(top10Activities);
      
      generatedDays.push({
        day_number: 1,
        date: startDate.toISOString().split('T')[0],
        title: `Top 10 Places to Visit in ${formData.destination}`,
        activities: timeSlots,
      });
      
      return {
        title: `Top 10 Spots in ${formData.destination}`,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget: budget,
        travelers: travelers,
        preferences: formData.interests,
        days: generatedDays,
      };
    }

    for (let day = 1; day <= days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day - 1);

      // Vary available hours by day type (match TS logic)
      const availableHours =
        day === 1 || day === days
          ? CONFIG.ARRIVAL_DEPARTURE_HOURS
          : isGoa
            ? 10 // Goa needs more flexible exploration time
            : CONFIG.FULL_DAY_HOURS;

      // Create SPECIFIC activities from geo intelligence - rotates by day, no repetition
      const stayLocation = formData.stayLocation || '';
      const geoSpecificActivities = this.createSpecificActivitiesFromGeo(
        geoContext,
        day,
        dailyBudget,
        usedActivityNames,
        stayLocation,
      );
      
      // Mix geo-specific with generic activities
      const remaining = filteredByBudget.filter((a) => !usedActivityNames.has(a && a.name));
      const pool = remaining.length > 0 ? remaining : filteredByBudget;
      const geoHours = geoSpecificActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
      const genericActivities = this.optimizeSchedule(pool, Math.max(0, availableHours - geoHours), day);
      
      // Combine: geo-specific first (they're more valuable), then generic
      const dayActivities = [...geoSpecificActivities, ...genericActivities];
      dayActivities.forEach((a) => {
        if (a && a.name) usedActivityNames.add(a.name);
      });
      const timeSlots = this.generateTimeSlots(dayActivities);

      // Goa-specific: add scooter rental on non-arrival days (mirror TS)
      if (isGoa && day !== 1) {
        const scooterCost =
          (geoContext && (geoContext.scooterCost || geoContext.transport?.scooter?.costPerDay)) ||
          400;
        timeSlots.unshift({
          title: 'Scooter Rental',
          description: 'Rent a scooter for flexible travel around Goa',
          time_start: '09:00',
          time_end: '09:30',
          location: 'Scooter rental shop (Baga / Anjuna / Calangute)',
          cost: scooterCost,
          category: 'transport',
          order_index: -1,
          image_url: this.getRandomImage('transport'),
        });
      }

      // Goa-specific day titles; when stayLocation set, Day 1 reflects their area
      let title;
      if (isGoa) {
        if (day === 1) {
          title = stayLocation
            ? `Arrival & Exploring ${stayLocation}`
            : 'Arrival & North Goa Beaches';
        }
        else if (day === 2) title = 'Water Sports & Adventure';
        else if (day === 3) title = 'South Goa Relaxation';
        else if (day === days) title = 'Departure & Shopping';
        else title = this.getDayTitle(day, destination, days);
      } else {
        title = this.getDayTitle(day, destination, days);
      }

      generatedDays.push({
        day_number: day,
        date: currentDate.toISOString().split('T')[0],
        title,
        activities: timeSlots,
      });
    }

    return {
      title: `${formData.destination} Adventure - ${days} Days`,
      destination: formData.destination,
      start_date: formData.startDate,
      end_date: formData.endDate,
      budget,
      travelers,
      preferences: formData.interests,
      days: generatedDays,
    };
  }

  async enhanceWithAI(itinerary) {
    // Placeholder for additional AI enhancements if needed.
    return itinerary;
  }
}

const itineraryGenerator = new ItineraryGenerator();

module.exports = { ItineraryGenerator, itineraryGenerator };

