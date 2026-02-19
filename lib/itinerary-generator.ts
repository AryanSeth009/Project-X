export interface ItineraryFormData {
  destination: string;
  startDate: string;
  endDate: string;
  travelers?: string;
  budget?: string;
  interests?: string[];
  personalPrompt?: string;
  /** Optional: where user is staying (e.g. Baga, Anjuna) - used to tailor Day 1 */
  stayLocation?: string;
}

export interface GeneratedActivity {
  title: string;
  description: string;
  time_start: string;
  time_end: string;
  location: string;
  cost: number;
  category: 'attraction' | 'food' | 'transport' | 'accommodation' | 'activity';
  order_index: number;
  image_url?: string;
}

export interface GeneratedDay {
  day_number: number;
  date: string;
  title: string;
  notes?: string;
  activities: GeneratedActivity[];
}

export interface GeneratedItinerary {
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  travelers: number;
  preferences: any;
  days: GeneratedDay[];
}

class ItineraryGenerator {
  private activityDatabase = {
    attractions: {
      Goa: [
        // North Goa Beaches
        {
          name: 'Baga Beach',
          cost: 0,
          duration: 3,
          category: 'attraction' as const,
          description: 'Popular beach known for water sports and nightlife',
        },
        {
          name: 'Calangute Beach',
          cost: 0,
          duration: 2.5,
          category: 'attraction' as const,
          description:
            'Largest beach in North Goa, ideal for relaxing and water sports',
        },
        {
          name: 'Candolim Beach',
          cost: 0,
          duration: 2,
          category: 'attraction' as const,
          description: 'Quieter alternative to Calangute with scenic views',
        },
        {
          name: 'Anjuna Beach',
          cost: 0,
          duration: 2.5,
          category: 'attraction' as const,
          description: 'Famous for flea market and sunset views',
        },
        {
          name: 'Vagator Beach',
          cost: 0,
          duration: 2,
          category: 'attraction' as const,
          description: 'Cliffside beach with dramatic scenery',
        },

        // South Goa Beaches
        {
          name: 'Palolem Beach',
          cost: 0,
          duration: 3,
          category: 'attraction' as const,
          description: 'Peaceful crescent beach ideal for relaxing',
        },
        {
          name: 'Colva Beach',
          cost: 0,
          duration: 2,
          category: 'attraction' as const,
          description: 'Popular South Goa beach with white sand',
        },
        {
          name: 'Butterfly Beach',
          cost: 300,
          duration: 3,
          category: 'attraction' as const,
          description: 'Hidden beach accessible by boat',
        },

        // Forts & Heritage
        {
          name: 'Fort Aguada',
          cost: 100,
          duration: 2,
          category: 'attraction' as const,
          description: 'Historic Portuguese fort with sea views',
        },
        {
          name: 'Chapora Fort',
          cost: 50,
          duration: 1.5,
          category: 'attraction' as const,
          description: 'Famous Dil Chahta Hai fort with sunset views',
        },
        {
          name: 'Basilica of Bom Jesus',
          cost: 0,
          duration: 1.5,
          category: 'attraction' as const,
          description: 'UNESCO heritage church',
        },

        // Nature
        {
          name: 'Dudhsagar Falls',
          cost: 700,
          duration: 5,
          category: 'attraction' as const,
          description: 'One of India’s tallest waterfalls',
        },
        {
          name: 'Spice Plantation Tour',
          cost: 1200,
          duration: 4,
          category: 'activity' as const,
          description: 'Guided spice farm experience with lunch',
        },

        // Party & Nightlife Spots
        {
          name: 'Tito’s Lane',
          cost: 1500,
          duration: 3,
          category: 'activity' as const,
          description: 'Most famous nightlife street in Goa',
        },
        {
          name: 'Curlies Beach Shack',
          cost: 1000,
          duration: 2,
          category: 'food' as const,
          description: 'Legendary beach shack with music and food',
        },

        // Unique Experiences
        {
          name: 'Casino Cruise',
          cost: 3000,
          duration: 4,
          category: 'activity' as const,
          description: 'Casino experience on Mandovi river cruise',
        },
        {
          name: 'Sunset at Dona Paula',
          cost: 0,
          duration: 1.5,
          category: 'attraction' as const,
          description: 'Romantic sunset viewpoint',
        },
      ],
      Kerala: [
        {
          name: 'Backwaters Houseboat',
          cost: 8000,
          duration: 8,
          category: 'attraction' as const,
          description: 'Overnight stay in traditional Kerala houseboat',
        },
        {
          name: 'Munnar Tea Gardens',
          cost: 500,
          duration: 4,
          category: 'attraction' as const,
          description: 'Sprawling tea plantations in Western Ghats',
        },
        {
          name: 'Periyar Wildlife Sanctuary',
          cost: 1500,
          duration: 6,
          category: 'attraction' as const,
          description: 'Tiger reserve with boat safari and wildlife spotting',
        },
        {
          name: 'Athirappilly Waterfalls',
          cost: 300,
          duration: 3,
          category: 'attraction' as const,
          description: 'Niagara of India - spectacular waterfall',
        },
        {
          name: 'Kumarakom Bird Sanctuary',
          cost: 200,
          duration: 3,
          category: 'attraction' as const,
          description: 'Paradise for bird watchers on Vembanad Lake',
        },
        {
          name: 'Fort Kochi',
          cost: 100,
          duration: 3,
          category: 'attraction' as const,
          description:
            'Historic area with Chinese fishing nets and colonial architecture',
        },
        {
          name: 'Alleppey Beach',
          cost: 0,
          duration: 2,
          category: 'attraction' as const,
          description: 'Beautiful beach with pier and lighthouse',
        },
        {
          name: 'Mattancherry Palace',
          cost: 150,
          duration: 2,
          category: 'attraction' as const,
          description: 'Dutch palace with beautiful murals',
        },
      ],
      Rajasthan: [
        {
          name: 'Amber Fort',
          cost: 500,
          duration: 4,
          category: 'attraction' as const,
          description: 'Majestic hilltop fort with elephant rides available',
        },
        {
          name: 'City Palace Jaipur',
          cost: 300,
          duration: 3,
          category: 'attraction' as const,
          description: 'Royal palace complex with museums and courtyards',
        },
        {
          name: 'Hawa Mahal',
          cost: 200,
          duration: 1.5,
          category: 'attraction' as const,
          description: 'Palace of Winds with intricate honeycomb facade',
        },
        {
          name: 'Jantar Mantar',
          cost: 200,
          duration: 2,
          category: 'attraction' as const,
          description: 'Astronomical observatory with massive instruments',
        },
        {
          name: 'Udaipur City Palace',
          cost: 600,
          duration: 4,
          category: 'attraction' as const,
          description: 'Lakeside palace complex with stunning architecture',
        },
        {
          name: 'Lake Pichola Boat Ride',
          cost: 800,
          duration: 1.5,
          category: 'attraction' as const,
          description: 'Scenic boat ride on picturesque lake',
        },
        {
          name: 'Mehrangarh Fort',
          cost: 400,
          duration: 4,
          category: 'attraction' as const,
          description: 'Impressive fort overlooking Blue City',
        },
        {
          name: 'Camel Safari Jaisalmer',
          cost: 2000,
          duration: 6,
          category: 'attraction' as const,
          description: 'Desert adventure on camelback with sunset views',
        },
      ],
      Default: [
        {
          name: 'City Heritage Walk',
          cost: 500,
          duration: 3,
          category: 'attraction' as const,
          description: 'Guided tour through historic old town area',
        },
        {
          name: 'Local Museum',
          cost: 200,
          duration: 2,
          category: 'attraction' as const,
          description: 'Learn about local history and culture',
        },
        {
          name: 'Sunset Viewpoint',
          cost: 100,
          duration: 2,
          category: 'attraction' as const,
          description: 'Best spot to watch the sunset',
        },
        {
          name: 'Local Market',
          cost: 0,
          duration: 2,
          category: 'attraction' as const,
          description: 'Vibrant market with local crafts and spices',
        },
        {
          name: 'City Park',
          cost: 0,
          duration: 1.5,
          category: 'attraction' as const,
          description: 'Peaceful green space in the city center',
        },
        {
          name: 'Art Gallery',
          cost: 300,
          duration: 2,
          category: 'attraction' as const,
          description: 'Showcase of local and regional artists',
        },
      ],
    },
    food: [
      {
        name: 'Goan Seafood Lunch',
        cost: 800,
        duration: 1.5,
        category: 'food' as const,
        description: 'Fish curry, prawn fry, local cuisine',
      },
      {
        name: 'Beach Shack Dinner',
        cost: 1200,
        duration: 2,
        category: 'food' as const,
        description: 'Dinner at beach shack with live music',
      },
      {
        name: 'Cafe Hopping in Assagao',
        cost: 700,
        duration: 2,
        category: 'food' as const,
        description: 'Visit Goa’s most aesthetic cafes',
      },
      {
        name: 'Night Club Experience',
        cost: 2000,
        duration: 3,
        category: 'activity' as const,
        description: 'Party at Goa’s best clubs',
      },
    ],

    activities: [
      {
        name: 'Scuba Diving',
        cost: 3500,
        duration: 4,
        category: 'activity' as const,
        description: 'Dive into Arabian Sea and explore marine life',
      },
      {
        name: 'Jet Ski Ride',
        cost: 800,
        duration: 1,
        category: 'activity' as const,
        description: 'Thrilling jet ski experience',
      },
      {
        name: 'Parasailing',
        cost: 1500,
        duration: 1.5,
        category: 'activity' as const,
        description: 'Fly over the sea with parachute',
      },
      {
        name: 'Banana Boat Ride',
        cost: 600,
        duration: 1,
        category: 'activity' as const,
        description: 'Fun group water ride',
      },
      {
        name: 'Sunset Cruise Mandovi River',
        cost: 1200,
        duration: 2,
        category: 'activity' as const,
        description: 'Evening cruise with live music',
      },
      {
        name: 'Goa Pub Crawl',
        cost: 2000,
        duration: 4,
        category: 'activity' as const,
        description: 'Visit Goa’s best clubs in one night',
      },
      {
        name: 'Beach Yoga Session',
        cost: 500,
        duration: 1.5,
        category: 'activity' as const,
        description: 'Yoga session on beach at sunrise',
      },
      {
        name: 'Scooter Rental',
        cost: 400,
        duration: 24,
        category: 'transport' as const,
        description: 'Rent scooter to explore Goa freely',
      },
    ],

    transport: [
      {
        name: 'Airport Transfer',
        cost: 800,
        duration: 1,
        category: 'transport' as const,
        description: 'Private transfer from airport',
      },
      {
        name: 'City Taxi Tour',
        cost: 2000,
        duration: 8,
        category: 'transport' as const,
        description: 'Full day taxi for city exploration',
      },
      {
        name: 'Auto Rickshaw Ride',
        cost: 300,
        duration: 0.5,
        category: 'transport' as const,
        description: 'Local auto rickshaw experience',
      },
      {
        name: 'Train Journey',
        cost: 500,
        duration: 3,
        category: 'transport' as const,
        description: 'Scenic train ride to nearby destination',
      },
      {
        name: 'Bicycle Rental',
        cost: 200,
        duration: 4,
        category: 'transport' as const,
        description: 'Explore area on bicycle',
      },
      {
        name: 'Boat Transfer',
        cost: 600,
        duration: 1,
        category: 'transport' as const,
        description: 'Boat transfer to island or beach',
      },
    ],
    accommodation: [
      {
        name: 'Luxury Resort',
        cost: 8000,
        duration: 24,
        category: 'accommodation' as const,
        description: '5-star resort with all amenities',
      },
      {
        name: 'Boutique Hotel',
        cost: 4000,
        duration: 24,
        category: 'accommodation' as const,
        description: 'Charming boutique hotel',
      },
      {
        name: 'Heritage Property',
        cost: 5000,
        duration: 24,
        category: 'accommodation' as const,
        description: 'Historic heritage property',
      },
      {
        name: 'Beach Resort',
        cost: 6000,
        duration: 24,
        category: 'accommodation' as const,
        description: 'Resort with beach access',
      },
      {
        name: 'Budget Hotel',
        cost: 1500,
        duration: 24,
        category: 'accommodation' as const,
        description: 'Clean and comfortable budget option',
      },
      {
        name: 'Homestay',
        cost: 2000,
        duration: 24,
        category: 'accommodation' as const,
        description: 'Stay with local family',
      },
    ],
  };

  private getDestinationActivities(destination: string): any[] {
    const destKey =
      (
        Object.keys(this.activityDatabase.attractions) as Array<
          keyof typeof this.activityDatabase.attractions
        >
      ).find((key) => destination.toLowerCase().includes(key.toLowerCase())) ||
      'Default';

    return [
      ...this.activityDatabase.attractions[destKey],
      ...this.activityDatabase.food,
      ...this.activityDatabase.activities,
      ...this.activityDatabase.transport,
      ...this.activityDatabase.accommodation,
    ];
  }

  private filterByInterests(activities: any[], interests: string[]): any[] {
    if (!interests || interests.length === 0) return activities;

    const interestMap: Record<string, string[]> = {
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

    // Boost scores for preferred categories
    return activities.map((activity) => ({
      ...activity,
      score: preferredCategories.includes(activity.category) ? 2 : 1,
    }));
  }

  private filterByBudget(activities: any[], dailyBudget: number): any[] {
    return activities.filter((activity) => activity.cost <= dailyBudget * 0.3); // Max 30% of daily budget per activity
  }

  private hashStringToUnitInterval(input: string): number {
    // Deterministic hash -> [0, 1) for stable per-day shuffling
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    // Convert to unsigned 32-bit then to [0,1)
    return (hash >>> 0) / 4294967296;
  }

  private optimizeSchedule(
    activities: any[],
    availableHours: number,
    daySeed: number,
  ): any[] {
    const sorted = [...activities].sort((a, b) => {
      const scoreA = a?.score ?? 1;
      const scoreB = b?.score ?? 1;
      if (scoreB !== scoreA) return scoreB - scoreA;

      // Tie-breaker: vary order by day to avoid repeating same picks each day
      const nameA = String(a?.name ?? '');
      const nameB = String(b?.name ?? '');
      const jA = this.hashStringToUnitInterval(`${daySeed}:${nameA}`);
      const jB = this.hashStringToUnitInterval(`${daySeed}:${nameB}`);
      return jB - jA;
    });
    const selected: any[] = [];
    let totalHours = 0;

    for (const activity of sorted) {
      const duration = activity?.duration ?? 1;
      if (totalHours + duration <= availableHours) {
        selected.push(activity);
        totalHours += duration;
      }
    }

    return selected;
  }

  private generateTimeSlots(
    activities: any[],
    startHour: number = 9,
  ): GeneratedActivity[] {
    // Work in minutes to avoid fractional hours like 10.5
    let currentMinutes = startHour * 60;
    const result: GeneratedActivity[] = [];

    activities.forEach((activity, index) => {
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const startHourFormatted =
        startH.toString().padStart(2, '0') +
        ':' +
        startM.toString().padStart(2, '0');

      const durationHours = activity.duration ?? 1;
      const durationMinutes = Math.round(durationHours * 60);

      const endMinutes = Math.min(currentMinutes + durationMinutes, 21 * 60);
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const endHourFormatted =
        endH.toString().padStart(2, '0') +
        ':' +
        endM.toString().padStart(2, '0');

      result.push({
        title: activity.name,
        description: activity.description,
        time_start: startHourFormatted,
        time_end: endHourFormatted,
        location: activity.location || activity.name,
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

  private getRandomImage(category: string): string {
    const imageMap: Record<string, string> = {
      attraction:
        'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg',
      food: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      activity:
        'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg',
      transport:
        'https://images.pexels.com/photos/1550372/pexels-photo-1550372.jpeg',
      accommodation:
        'https://images.pexels.com/photos/271643/pexels-photo-271643.jpeg',
    };
    return imageMap[category] || imageMap.attraction;
  }

  private getDayTitle(dayNumber: number, destination: string): string {
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

  private createSpecificActivitiesFromGeo(geoContext: any, day: number, dailyBudget: number): any[] {
    if (!geoContext) return [];
    
    const specific: any[] = [];
    const usedNames = new Set<string>();
    
    // Add specific restaurants (breakfast/lunch/dinner)
    if (geoContext.specificRestaurants && Array.isArray(geoContext.specificRestaurants)) {
      const restaurants = geoContext.specificRestaurants.filter((r: any) => 
        (r.cost || 0) <= dailyBudget * 0.3 && !usedNames.has(r.name)
      );
      
      if (restaurants.length > 0) {
        const breakfast = restaurants.find((r: any) => 
          r.bestFor?.toLowerCase().includes('breakfast') || 
          r.timing?.includes('AM')
        ) || restaurants[0];
        
        const lunch = restaurants.find((r: any) => 
          r.bestFor?.toLowerCase().includes('lunch') || 
          r.bestFor?.toLowerCase().includes('seafood') ||
          (r.name !== breakfast.name)
        ) || restaurants[restaurants.length > 1 ? 1 : 0];
        
        if (breakfast && !usedNames.has(breakfast.name)) {
          specific.push({
            name: `Breakfast at ${breakfast.name}`,
            cost: breakfast.cost || 400,
            duration: 1,
            category: 'food' as const,
            description: `${breakfast.type} - ${breakfast.bestFor || 'Local cuisine'} (₹${breakfast.cost})`,
            location: `${breakfast.area || ''} ${breakfast.name}`.trim(),
            geoSpecific: true,
          });
          usedNames.add(breakfast.name);
        }
        
        if (lunch && lunch.name !== breakfast.name && !usedNames.has(lunch.name)) {
          specific.push({
            name: `Lunch at ${lunch.name}`,
            cost: lunch.cost || 600,
            duration: 1.5,
            category: 'food' as const,
            description: `${lunch.type} - ${lunch.bestFor || 'Local cuisine'} (₹${lunch.cost})`,
            location: `${lunch.area || ''} ${lunch.name}`.trim(),
            geoSpecific: true,
          });
          usedNames.add(lunch.name);
        }
      }
    }
    
    // Add specific activities from geo data
    if (geoContext.specificActivities && Array.isArray(geoContext.specificActivities)) {
      geoContext.specificActivities.slice(0, 2).forEach((act: any) => {
        if ((act.cost || 0) <= dailyBudget * 0.3 && !usedNames.has(act.name)) {
          const duration = parseFloat(String(act.duration)) || 2;
          specific.push({
            name: act.name,
            cost: act.cost || 0,
            duration,
            category: 'activity' as const,
            description: act.operator ? `${act.description || act.name} (${act.operator})` : (act.description || act.name),
            location: `${act.area || ''} ${act.name}`.trim(),
            geoSpecific: true,
          });
          usedNames.add(act.name);
        }
      });
    }
    
    // Add popular attractions as specific activities
    if (geoContext.popularAttractions && Array.isArray(geoContext.popularAttractions)) {
      geoContext.popularAttractions.slice(0, 2).forEach((attr: any) => {
        if (!usedNames.has(attr.name)) {
          const avgTimeStr = attr.avgTime || '2';
          const avgTime = parseFloat(avgTimeStr.split('-')[0]) || 2;
          const entryFeeStr = attr.entryFee || '0';
          const entryFee = parseFloat(entryFeeStr.replace(/[^0-9]/g, '')) || 0;
          specific.push({
            name: `Visit ${attr.name}`,
            cost: entryFee,
            duration: avgTime,
            category: 'attraction' as const,
            description: `${attr.type}${attr.bestTime ? ` - Best time: ${attr.bestTime}` : ''}${entryFee > 0 ? ` (Entry: ${attr.entryFee})` : ''}`.trim(),
            location: attr.name,
            geoSpecific: true,
          });
          usedNames.add(attr.name);
        }
      });
    }
    
    return specific;
  }

  async generateItinerary(
    formData: ItineraryFormData,
    geoContext?: any,
  ): Promise<GeneratedItinerary> {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    const budget = parseInt(formData.budget ?? '') || 50000;
    const travelers = parseInt(formData.travelers ?? '') || 1;
    const dailyBudget = budget / days;
    const isGoa = formData.destination.toLowerCase().includes('goa');

    const allActivities = this.getDestinationActivities(formData.destination);
    
    // Boost activities that match geo intelligence (popular_attractions, best_areas)
    let geoBoostedActivities = allActivities;
    if (geoContext?.popular_attractions && Array.isArray(geoContext.popular_attractions)) {
      const geoAttractionNames = geoContext.popular_attractions.map((a: any) => 
        String(a?.name || '').toLowerCase()
      );
      geoBoostedActivities = allActivities.map((act) => {
        const nameLower = String(act.name || '').toLowerCase();
        const matchesGeo = geoAttractionNames.some((geoName: string) => 
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
      formData.interests || [],
    );
    const filteredByBudget = this.filterByBudget(
      filteredByInterests,
      dailyBudget,
    );

    const generatedDays: GeneratedDay[] = [];
    const usedActivityNames = new Set<string>();

    for (let day = 1; day <= days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day - 1);

      // Vary available hours by day type
      const availableHours =
        day === 1 || day === days
          ? 6
          : isGoa
            ? 10 // Goa needs more flexible exploration time
            : 8;
      let dayFocus = '';

      if (isGoa) {
        if (day === 1) dayFocus = 'Arrival & North Goa Beaches';
        else if (day === 2) dayFocus = 'Water Sports & Adventure';
        else if (day === 3) dayFocus = 'South Goa Relaxation';
        else if (day === days) dayFocus = 'Departure & Shopping';
      }

      // Less hours on arrival/departure days

      // Create SPECIFIC activities from geo intelligence (restaurants, exact places)
      const geoSpecificActivities = this.createSpecificActivitiesFromGeo(geoContext, day, dailyBudget);
      
      // Mix geo-specific with generic activities
      const remaining = filteredByBudget.filter(
        (a) => !usedActivityNames.has(a?.name),
      );
      const pool = remaining.length > 0 ? remaining : filteredByBudget;
      const geoHoursUsed = geoSpecificActivities.reduce((sum: number, a: any) => sum + (a.duration || 0), 0);
      const genericActivities = this.optimizeSchedule(pool, Math.max(0, availableHours - geoHoursUsed), day);
      
      // Combine: geo-specific first (they're more valuable), then generic
      const dayActivities = [...geoSpecificActivities, ...genericActivities];
      dayActivities.forEach((a) => {
        if (a?.name) usedActivityNames.add(a.name);
      });
      const timeSlots = this.generateTimeSlots(dayActivities);

      if (isGoa && day !== 1) {
        timeSlots.unshift({
          title: 'Scooter Rental',
          description: 'Rent scooter for easy travel in Goa',
          time_start: '09:00',
          time_end: '09:30',
          location: 'Scooter Rental Shop',
          cost: 400,
          category: 'transport',
          order_index: -1,
          image_url: this.getRandomImage('transport'),
        });
      }

      generatedDays.push({
        day_number: day,
        date: currentDate.toISOString().split('T')[0],
        title: dayFocus || this.getDayTitle(day, formData.destination), 
        activities: timeSlots,
      });
    }

    return {
      title: `${formData.destination} Adventure - ${days} Days`,
      destination: formData.destination,
      start_date: formData.startDate,
      end_date: formData.endDate,
      budget: budget,
      travelers: travelers,
      preferences: formData.interests,
      days: generatedDays,
    };
  }

  async enhanceWithAI(
    itinerary: GeneratedItinerary,
  ): Promise<GeneratedItinerary> {
    // This would integrate with a real AI service like OpenAI, Claude, etc.
    // For now, we'll enhance with smart recommendations

    // Add weather-based recommendations
    // Add crowd-based timing suggestions
    // Add budget optimization
    // Add personalization based on user history

    return itinerary;
  }
}

export const itineraryGenerator = new ItineraryGenerator();
