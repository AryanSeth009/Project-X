export interface ItineraryFormData {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  budget: string;
  interests: string[];
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
      'Goa': [
        { name: 'Baga Beach', cost: 0, duration: 2, category: 'attraction' as const, description: 'Famous beach with water sports and vibrant atmosphere' },
        { name: 'Dudhsagar Falls', cost: 600, duration: 4, category: 'attraction' as const, description: 'Spectacular four-tiered waterfall in the Western Ghats' },
        { name: 'Basilica of Bom Jesus', cost: 0, duration: 1.5, category: 'attraction' as const, description: 'UNESCO World Heritage site with St. Francis Xavier\'s remains' },
        { name: 'Fort Aguada', cost: 100, duration: 2, category: 'attraction' as const, description: '17th-century Portuguese fort with panoramic views' },
        { name: 'Anjuna Beach', cost: 0, duration: 2, category: 'attraction' as const, description: 'Rocky beach famous for flea market and nightlife' },
        { name: 'Palolem Beach', cost: 0, duration: 3, category: 'attraction' as const, description: 'Scenic crescent-shaped beach with calm waters' },
        { name: 'Old Goa Churches', cost: 200, duration: 3, category: 'attraction' as const, description: 'Historical churches from Portuguese era' },
        { name: 'Aguada Lighthouse', cost: 50, duration: 1, category: 'attraction' as const, description: 'Historic lighthouse with ocean views' },
      ],
      'Kerala': [
        { name: 'Backwaters Houseboat', cost: 8000, duration: 8, category: 'attraction' as const, description: 'Overnight stay in traditional Kerala houseboat' },
        { name: 'Munnar Tea Gardens', cost: 500, duration: 4, category: 'attraction' as const, description: 'Sprawling tea plantations in Western Ghats' },
        { name: 'Periyar Wildlife Sanctuary', cost: 1500, duration: 6, category: 'attraction' as const, description: 'Tiger reserve with boat safari and wildlife spotting' },
        { name: 'Athirappilly Waterfalls', cost: 300, duration: 3, category: 'attraction' as const, description: 'Niagara of India - spectacular waterfall' },
        { name: 'Kumarakom Bird Sanctuary', cost: 200, duration: 3, category: 'attraction' as const, description: 'Paradise for bird watchers on Vembanad Lake' },
        { name: 'Fort Kochi', cost: 100, duration: 3, category: 'attraction' as const, description: 'Historic area with Chinese fishing nets and colonial architecture' },
        { name: 'Alleppey Beach', cost: 0, duration: 2, category: 'attraction' as const, description: 'Beautiful beach with pier and lighthouse' },
        { name: 'Mattancherry Palace', cost: 150, duration: 2, category: 'attraction' as const, description: 'Dutch palace with beautiful murals' },
      ],
      'Rajasthan': [
        { name: 'Amber Fort', cost: 500, duration: 4, category: 'attraction' as const, description: 'Majestic hilltop fort with elephant rides available' },
        { name: 'City Palace Jaipur', cost: 300, duration: 3, category: 'attraction' as const, description: 'Royal palace complex with museums and courtyards' },
        { name: 'Hawa Mahal', cost: 200, duration: 1.5, category: 'attraction' as const, description: 'Palace of Winds with intricate honeycomb facade' },
        { name: 'Jantar Mantar', cost: 200, duration: 2, category: 'attraction' as const, description: 'Astronomical observatory with massive instruments' },
        { name: 'Udaipur City Palace', cost: 600, duration: 4, category: 'attraction' as const, description: 'Lakeside palace complex with stunning architecture' },
        { name: 'Lake Pichola Boat Ride', cost: 800, duration: 1.5, category: 'attraction' as const, description: 'Scenic boat ride on picturesque lake' },
        { name: 'Mehrangarh Fort', cost: 400, duration: 4, category: 'attraction' as const, description: 'Impressive fort overlooking Blue City' },
        { name: 'Camel Safari Jaisalmer', cost: 2000, duration: 6, category: 'attraction' as const, description: 'Desert adventure on camelback with sunset views' },
      ],
      'Default': [
        { name: 'City Heritage Walk', cost: 500, duration: 3, category: 'attraction' as const, description: 'Guided tour through historic old town area' },
        { name: 'Local Museum', cost: 200, duration: 2, category: 'attraction' as const, description: 'Learn about local history and culture' },
        { name: 'Sunset Viewpoint', cost: 100, duration: 2, category: 'attraction' as const, description: 'Best spot to watch the sunset' },
        { name: 'Local Market', cost: 0, duration: 2, category: 'attraction' as const, description: 'Vibrant market with local crafts and spices' },
        { name: 'City Park', cost: 0, duration: 1.5, category: 'attraction' as const, description: 'Peaceful green space in the city center' },
        { name: 'Art Gallery', cost: 300, duration: 2, category: 'attraction' as const, description: 'Showcase of local and regional artists' },
      ]
    },
    food: [
      { name: 'Traditional Breakfast', cost: 300, duration: 1, category: 'food' as const, description: 'Authentic local breakfast specialties' },
      { name: 'Street Food Tour', cost: 800, duration: 3, category: 'food' as const, description: 'Explore local street food scene' },
      { name: 'Fine Dining Restaurant', cost: 2000, duration: 2, category: 'food' as const, description: 'Upscale restaurant with local cuisine' },
      { name: 'Local Cafe', cost: 400, duration: 1.5, category: 'food' as const, description: 'Cozy cafe with local specialties' },
      { name: 'Beachside Restaurant', cost: 1200, duration: 2, category: 'food' as const, description: 'Dining with ocean views' },
      { name: 'Cooking Class', cost: 1500, duration: 4, category: 'food' as const, description: 'Learn to cook local dishes' },
    ],
    activities: [
      { name: 'Yoga Session', cost: 500, duration: 1.5, category: 'activity' as const, description: 'Relaxing yoga session with instructor' },
      { name: 'Spa Treatment', cost: 2000, duration: 2, category: 'activity' as const, description: 'Traditional spa and wellness treatment' },
      { name: 'Adventure Sports', cost: 1500, duration: 3, category: 'activity' as const, description: 'Thrilling adventure activities' },
      { name: 'Cultural Show', cost: 800, duration: 2, category: 'activity' as const, description: 'Traditional dance and music performance' },
      { name: 'Shopping Tour', cost: 1000, duration: 3, category: 'activity' as const, description: 'Guided shopping for local crafts' },
      { name: 'Photography Walk', cost: 600, duration: 2.5, category: 'activity' as const, description: 'Capture best spots with local photographer' },
      { name: 'Village Tour', cost: 800, duration: 4, category: 'activity' as const, description: 'Experience rural local life' },
      { name: 'Sunset Cruise', cost: 1200, duration: 2, category: 'activity' as const, description: 'Scenic cruise during golden hour' },
    ],
    transport: [
      { name: 'Airport Transfer', cost: 800, duration: 1, category: 'transport' as const, description: 'Private transfer from airport' },
      { name: 'City Taxi Tour', cost: 2000, duration: 8, category: 'transport' as const, description: 'Full day taxi for city exploration' },
      { name: 'Auto Rickshaw Ride', cost: 300, duration: 0.5, category: 'transport' as const, description: 'Local auto rickshaw experience' },
      { name: 'Train Journey', cost: 500, duration: 3, category: 'transport' as const, description: 'Scenic train ride to nearby destination' },
      { name: 'Bicycle Rental', cost: 200, duration: 4, category: 'transport' as const, description: 'Explore area on bicycle' },
      { name: 'Boat Transfer', cost: 600, duration: 1, category: 'transport' as const, description: 'Boat transfer to island or beach' },
    ],
    accommodation: [
      { name: 'Luxury Resort', cost: 8000, duration: 24, category: 'accommodation' as const, description: '5-star resort with all amenities' },
      { name: 'Boutique Hotel', cost: 4000, duration: 24, category: 'accommodation' as const, description: 'Charming boutique hotel' },
      { name: 'Heritage Property', cost: 5000, duration: 24, category: 'accommodation' as const, description: 'Historic heritage property' },
      { name: 'Beach Resort', cost: 6000, duration: 24, category: 'accommodation' as const, description: 'Resort with beach access' },
      { name: 'Budget Hotel', cost: 1500, duration: 24, category: 'accommodation' as const, description: 'Clean and comfortable budget option' },
      { name: 'Homestay', cost: 2000, duration: 24, category: 'accommodation' as const, description: 'Stay with local family' },
    ]
  };

  private getDestinationActivities(destination: string): any[] {
    const destKey = (Object.keys(this.activityDatabase.attractions) as Array<keyof typeof this.activityDatabase.attractions>).find(key => 
      destination.toLowerCase().includes(key.toLowerCase())
    ) || 'Default';
    
    return [
      ...this.activityDatabase.attractions[destKey],
      ...this.activityDatabase.food,
      ...this.activityDatabase.activities,
      ...this.activityDatabase.transport,
      ...this.activityDatabase.accommodation
    ];
  }

  private filterByInterests(activities: any[], interests: string[]): any[] {
    if (!interests || interests.length === 0) return activities;
    
    const interestMap: Record<string, string[]> = {
      'Culture': ['attraction', 'activity'],
      'Adventure': ['activity', 'attraction'],
      'Food': ['food'],
      'Nature': ['attraction', 'activity'],
      'Shopping': ['activity'],
      'Nightlife': ['activity'],
      'History': ['attraction'],
      'Relaxation': ['activity', 'accommodation']
    };

    const preferredCategories = interests.flatMap(interest => interestMap[interest] || []);
    
    if (preferredCategories.length === 0) return activities;
    
    // Boost scores for preferred categories
    return activities.map(activity => ({
      ...activity,
      score: preferredCategories.includes(activity.category) ? 2 : 1
    }));
  }

  private filterByBudget(activities: any[], dailyBudget: number): any[] {
    return activities.filter(activity => activity.cost <= dailyBudget * 0.3); // Max 30% of daily budget per activity
  }

  private optimizeSchedule(activities: any[], availableHours: number): any[] {
    const sorted = activities.sort((a, b) => b.score - a.score);
    const selected: any[] = [];
    let totalHours = 0;

    for (const activity of sorted) {
      if (totalHours + activity.duration <= availableHours) {
        selected.push(activity);
        totalHours += activity.duration;
      }
    }

    return selected;
  }

  private generateTimeSlots(activities: any[], startHour: number = 9): GeneratedActivity[] {
    let currentHour = startHour;
    const result: GeneratedActivity[] = [];

    activities.forEach((activity, index) => {
      const startHourFormatted = currentHour.toString().padStart(2, '0') + ':00';
      currentHour += activity.duration;
      const endHourFormatted = Math.min(currentHour, 21).toString().padStart(2, '0') + ':00';

      result.push({
        title: activity.name,
        description: activity.description,
        time_start: startHourFormatted,
        time_end: endHourFormatted,
        location: `${activity.name} Location`,
        cost: activity.cost,
        category: activity.category,
        order_index: index,
        image_url: this.getRandomImage(activity.category)
      });

      currentHour = Math.min(currentHour + 0.5, 21); // 30 min break between activities
    });

    return result;
  }

  private getRandomImage(category: string): string {
    const imageMap: Record<string, string> = {
      attraction: 'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg',
      food: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      activity: 'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg',
      transport: 'https://images.pexels.com/photos/1550372/pexels-photo-1550372.jpeg',
      accommodation: 'https://images.pexels.com/photos/271643/pexels-photo-271643.jpeg'
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
      'Farewell & Departure'
    ];
    return titles[dayNumber - 1] || `Day ${dayNumber} in ${destination}`;
  }

  async generateItinerary(formData: ItineraryFormData): Promise<GeneratedItinerary> {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const budget = parseInt(formData.budget) || 50000;
    const travelers = parseInt(formData.travelers) || 1;
    const dailyBudget = budget / days;
    
    const allActivities = this.getDestinationActivities(formData.destination);
    const filteredByInterests = this.filterByInterests(allActivities, formData.interests);
    const filteredByBudget = this.filterByBudget(filteredByInterests, dailyBudget);

    const generatedDays: GeneratedDay[] = [];

    for (let day = 1; day <= days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day - 1);
      
      // Vary available hours by day type
      const availableHours = day === 1 || day === days ? 6 : 8; // Less hours on arrival/departure days
      
      const dayActivities = this.optimizeSchedule(filteredByBudget, availableHours);
      const timeSlots = this.generateTimeSlots(dayActivities);

      generatedDays.push({
        day_number: day,
        date: currentDate.toISOString().split('T')[0],
        title: this.getDayTitle(day, formData.destination),
        activities: timeSlots
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
      days: generatedDays
    };
  }

  async enhanceWithAI(itinerary: GeneratedItinerary): Promise<GeneratedItinerary> {
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
