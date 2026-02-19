// JavaScript runtime version of the itinerary generator
// for use by the Node.js API server (api-server.js, ai-service.js).
// The Expo app uses the TypeScript version in `itinerary-generator.ts`.

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

  getDestinationActivities(destination) {
    const keys = Object.keys(this.activityDatabase.attractions);
    const match =
      keys.find((key) =>
        destination.toLowerCase().includes(key.toLowerCase()),
      ) || 'Default';

    return [
      ...this.activityDatabase.attractions[match],
      ...this.activityDatabase.food,
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
    return activities.filter((activity) => activity.cost <= dailyBudget * 0.3);
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

  getRandomImage(category) {
    const imageMap = {
      attraction: 'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg',
      food: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      activity: 'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg',
      transport: 'https://images.pexels.com/photos/1550372/pexels-photo-1550372.jpeg',
      accommodation: 'https://images.pexels.com/photos/271643/pexels-photo-271643.jpeg',
    };
    return imageMap[category] || imageMap.attraction;
  }

  generateTimeSlots(activities, startHour = 9) {
    // Work in minutes to avoid fractional hours like 10.5
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

      const endMinutes = Math.min(currentMinutes + durationMinutes, 21 * 60);
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
        location: `${activity.name} Location`,
        cost: activity.cost,
        category: activity.category,
        order_index: index,
        image_url: this.getRandomImage(activity.category),
      });

      // 30-minute break between activities
      currentMinutes = Math.min(endMinutes + 30, 21 * 60);
    });

    return result;
  }

  getDayTitle(dayNumber, destination) {
    const titles = [
      `Arrival & ${destination} Exploration`,
      'Cultural Immersion & Heritage',
      'Adventure & Local Experiences',
      'Nature & Scenic Beauty',
      'Hidden Gems & Local Life',
      'Relaxation & Leisure',
      'Farewell & Departure',
    ];
    return titles[dayNumber - 1] || `Day ${dayNumber} in ${destination}`;
  }

  async generateItinerary(formData) {
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

    const allActivities = this.getDestinationActivities(
      formData.destination,
    );
    const filteredByInterests = this.filterByInterests(
      allActivities,
      formData.interests,
    );
    const filteredByBudget = this.filterByBudget(
      filteredByInterests,
      dailyBudget,
    );

    const generatedDays = [];
    const usedActivityNames = new Set();

    for (let day = 1; day <= days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day - 1);

      const availableHours = day === 1 || day === days ? 6 : 8;

      const remaining = filteredByBudget.filter((a) => !usedActivityNames.has(a && a.name));
      const pool = remaining.length > 0 ? remaining : filteredByBudget;
      const dayActivities = this.optimizeSchedule(pool, availableHours, day);
      dayActivities.forEach((a) => {
        if (a && a.name) usedActivityNames.add(a.name);
      });
      const timeSlots = this.generateTimeSlots(dayActivities);

      generatedDays.push({
        day_number: day,
        date: currentDate.toISOString().split('T')[0],
        title: this.getDayTitle(day, formData.destination),
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

