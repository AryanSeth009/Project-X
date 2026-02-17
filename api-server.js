const express = require('express');
const cors = require('cors');
const { itineraryGenerator } = require('./lib/itinerary-generator');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user data for testing
const mockUsers = {
  'test-user-1': {
    id: 'test-user-1',
    email: 'test@example.com',
    credits: 10,
    is_pro: false
  }
};

// Mock database
const mockDatabase = {
  itineraries: [],
  activities: [],
  profiles: mockUsers
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'YatraAI API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Get user profile
app.get('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  const user = mockDatabase.profiles[userId];
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// Generate itinerary (main endpoint)
app.post('/api/itineraries/generate', async (req, res) => {
  try {
    const { 
      userId, 
      destination, 
      startDate, 
      endDate, 
      travelers, 
      budget, 
      interests 
    } = req.body;

    // Validate required fields
    if (!userId || !destination || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'destination', 'startDate', 'endDate']
      });
    }

    // Check if user exists and has credits
    const user = mockDatabase.profiles[userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.credits < 1) {
      return res.status(402).json({ 
        error: 'Insufficient credits',
        credits: user.credits 
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (days > 30) {
      return res.status(400).json({ error: 'Maximum trip duration is 30 days' });
    }

    // Generate itinerary using AI service
    console.log('🚀 Generating itinerary for:', { destination, days, budget, interests });
    
    const formData = {
      destination,
      startDate,
      endDate,
      travelers: travelers?.toString() || '1',
      budget: budget?.toString() || '50000',
      interests: interests || []
    };

    const generatedItinerary = await itineraryGenerator.generateItinerary(formData);
    
    // Create itinerary record
    const itinerary = {
      id: `itinerary-${Date.now()}`,
      user_id: userId,
      title: generatedItinerary.title,
      destination: generatedItinerary.destination,
      start_date: generatedItinerary.start_date,
      end_date: generatedItinerary.end_date,
      budget: generatedItinerary.budget,
      travelers: generatedItinerary.travelers,
      preferences: generatedItinerary.preferences,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to mock database
    mockDatabase.itineraries.push(itinerary);

    // Create days and activities
    const daysWithActivities = generatedItinerary.days.map((day, index) => {
      const dayRecord = {
        id: `day-${itinerary.id}-${index + 1}`,
        itinerary_id: itinerary.id,
        day_number: day.day_number,
        date: day.date,
        title: day.title,
        notes: day.notes || null,
        activities: day.activities.map((activity, actIndex) => ({
          id: `activity-${dayRecord.id}-${actIndex + 1}`,
          day_id: dayRecord.id,
          title: activity.title,
          description: activity.description,
          time_start: activity.time_start,
          time_end: activity.time_end,
          location: activity.location,
          cost: activity.cost,
          category: activity.category,
          order_index: activity.order_index,
          image_url: activity.image_url,
          created_at: new Date().toISOString()
        }))
      };
      
      mockDatabase.activities.push(...dayRecord.activities);
      return dayRecord;
    });

    // Deduct credits
    user.credits -= 1;

    const response = {
      success: true,
      data: {
        ...itinerary,
        days: daysWithActivities
      },
      userCredits: user.credits,
      message: 'Itinerary generated successfully!'
    };

    console.log('✅ Itinerary generated:', { 
      itineraryId: itinerary.id, 
      destination, 
      days: daysWithActivities.length,
      totalCost: daysWithActivities.reduce((sum, day) => 
        sum + day.activities.reduce((daySum, act) => daySum + act.cost, 0), 0
      )
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Error generating itinerary:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get user itineraries
app.get('/api/users/:userId/itineraries', (req, res) => {
  const { userId } = req.params;
  const userItineraries = mockDatabase.itineraries.filter(it => it.user_id === userId);
  
  res.json({
    success: true,
    data: userItineraries,
    count: userItineraries.length
  });
});

// Get specific itinerary with details
app.get('/api/itineraries/:itineraryId', (req, res) => {
  const { itineraryId } = req.params;
  const itinerary = mockDatabase.itineraries.find(it => it.id === itineraryId);
  
  if (!itinerary) {
    return res.status(404).json({ error: 'Itinerary not found' });
  }

  // Get days and activities (in a real app, this would come from database)
  const daysWithActivities = []; // This would be populated from database
  
  res.json({
    success: true,
    data: {
      ...itinerary,
      days: daysWithActivities
    }
  });
});

// Get smart suggestions for a day
app.post('/api/suggestions', async (req, res) => {
  try {
    const { destination, budget, usedCategories, dayNumber } = req.body;
    
    // Mock suggestions based on destination and budget
    const suggestions = [
      {
        title: 'Local Coffee Shop',
        description: 'Popular local cafe with authentic atmosphere',
        time_start: '15:00',
        time_end: '16:00',
        location: 'City Center',
        cost: Math.min(300, budget * 0.1),
        category: 'food',
        confidence: 0.85
      },
      {
        title: 'Photo Spot',
        description: 'Scenic viewpoint perfect for Instagram',
        time_start: '17:00',
        time_end: '18:00',
        location: 'Viewpoint Area',
        cost: 0,
        category: 'attraction',
        confidence: 0.90
      },
      {
        title: 'Local Market',
        description: 'Traditional market with local crafts and souvenirs',
        time_start: '11:00',
        time_end: '13:00',
        location: 'Market District',
        cost: Math.min(500, budget * 0.15),
        category: 'activity',
        confidence: 0.80
      }
    ].filter(suggestion => suggestion.cost <= budget);

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('❌ Error generating suggestions:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 YatraAI API Server running on http://localhost:${PORT}`);
  console.log(`📖 API Documentation:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/itineraries/generate - Generate itinerary`);
  console.log(`   GET  /api/users/:userId - Get user profile`);
  console.log(`   GET  /api/users/:userId/itineraries - Get user itineraries`);
  console.log(`   POST /api/suggestions - Get smart suggestions`);
  console.log(`\n🧪 Ready for Postman testing!`);
});

module.exports = app;
