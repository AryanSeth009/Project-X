require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { geoService } = require('./lib/geo-service');
const { perplexityService } = require('./lib/perplexity-service');
const { aiService } = require('./lib/ai-service');
const { itineraryGenerator } = require('./lib/itinerary-generator');
const { getGeoContext: getVectorGeoContext } = require('./backend/src/services/geoVectorService.cjs');
const { getGeoContext: buildRichGeoContext } = require('./backend/src/services/contextBuilder.cjs');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Regular anon client (respects RLS) — used for normal app queries
const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Service role client (bypasses RLS) — used ONLY for trusted server-side operations
// like ownership checks in collaboration endpoints. Never expose this key to the client.
const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseServiceKey !== 'your_service_role_key_here')
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : supabase; // fallback to anon if no service key yet

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

// Ensure time strings are valid for Postgres (HH:MM or HH:MM:SS). Fix fractional hours like "14.5:00".
function toValidTime(str) {
  if (str == null || typeof str !== 'string') return str;
  const m = str.trim().match(/^(\d+)\.5:00$/);
  if (m) return String(m[1]).padStart(2, '0') + ':30';
  return str;
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'YatraAI API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Geo Intelligence: get area options for stay location (optional user input)
app.get('/api/geo/areas', (req, res) => {
  try {
    const destination = String(req.query.destination || '').trim();
    if (!destination) {
      return res.json({ success: true, areas: [] });
    }
    const { loadGeoDataset } = require('./backend/src/services/contextBuilder.cjs');
    const data = loadGeoDataset(destination);
    
    let areasRaw = [];
    if (data) {
      areasRaw = data.areas || data.completeTravelerGuide?.areas || [];
    }
    
    const areas = areasRaw.map((a) => ({ name: a.name, type: a.type, bestFor: a.bestFor || [] }));
    res.json({ success: true, destination, areas });
  } catch (err) {
    console.error('Geo areas error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Transport schedule: mock real-time train/flight options (IRCTC/Flight API integration point)
const TRAIN_CLASS_BY_BUDGET = { budget: '3AC', midrange: '2AC', luxury: '1AC' };
app.get('/api/transport/schedule', (req, res) => {
  try {
    const departure = String(req.query.departure || '').trim();
    const destination = String(req.query.destination || '').trim();
    const startDate = String(req.query.startDate || '');
    const transport = String(req.query.transport || 'train').toLowerCase();
    const budget = String(req.query.budget || 'midrange').toLowerCase();

    if (!departure || !destination) {
      return res.json({ success: true, options: [] });
    }

    const trainClass = TRAIN_CLASS_BY_BUDGET[budget] || '2AC';
    const options = [];

    if (transport === 'train') {
      const basePrice = budget === 'budget' ? 2800 : budget === 'luxury' ? 8500 : 5200;
      for (let i = 0; i < 5; i++) {
        options.push({
          type: 'train',
          name: `Train ${12301 + i} - ${departure} to ${destination}`,
          departure: `${6 + i}:00 AM`,
          arrival: `${2 + i}:30 PM`,
          price: Math.round(basePrice * (0.9 + Math.random() * 0.2)),
          class: trainClass,
        });
      }
    } else {
      const basePrice = budget === 'budget' ? 4500 : budget === 'luxury' ? 12000 : 7500;
      for (let i = 0; i < 5; i++) {
        options.push({
          type: 'flight',
          name: `Flight ${['6E', 'UK', 'SG', 'AI', 'I5'][i]} ${100 + i}${i}`,
          departure: `${7 + i}:15 AM`,
          arrival: `${9 + i}:45 AM`,
          price: Math.round(basePrice * (0.85 + Math.random() * 0.3)),
        });
      }
    }

    res.json({ success: true, departure, destination, startDate, options });
  } catch (err) {
    console.error('Transport schedule error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Geo Intelligence: test RICH destination context (specific restaurants, hostels, activities)
app.get('/api/geo/context', async (req, res) => {
  try {
    const destination = req.query.destination || 'Goa';
    const richContext = buildRichGeoContext(destination, `Trip to ${destination}`, null);
    const basicContext = await geoService.getDestinationContext(destination, supabase);
    res.json({
      success: true,
      destination,
      richGeo: richContext,
      basicGeo: basicContext,
      hasStructuredData: richContext?.specificRestaurants?.length > 0 || richContext?.popularAttractions?.length > 0,
    });
  } catch (err) {
    console.error('Geo context error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
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

// Generate itinerary (old main endpoint, kept for compatibility)
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
          time_start: toValidTime(activity.time_start),
          time_end: toValidTime(activity.time_end),
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

// STEP 3: Itinerary Generation System (CORE FEATURE)
// New core endpoint that follows the requested flow:
// 1) Validate input
// 2) Call Geo Service
// 3) Call Perplexity Service
// 4) Call AI Service
// 5) Save itinerary in database
// 6) Return itinerary JSON
app.post('/itinerary/generate', async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      travelers,
      budget,
      interests,
      personalPrompt,
      stayLocation,
      itineraryStyle,
      checkTickets,
      departurePlace,
      transportOption,
    } = req.body || {};

    // Step 1: Validate input
    if (!destination || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['destination', 'startDate', 'endDate'],
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Expected YYYY-MM-DD.',
      });
    }

    if (start < today) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be in the past',
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date',
      });
    }

    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

    if (days > 30) {
      return res.status(400).json({
        success: false,
        error: 'Maximum trip duration is 30 days',
      });
    }

    const formData = {
      destination,
      startDate,
      endDate,
      travelers: travelers?.toString() || '1',
      budget: budget?.toString() || '50000',
      interests: interests || [],
      personalPrompt: personalPrompt || '',
      stayLocation: stayLocation ? String(stayLocation).trim() : '',
      itineraryStyle: itineraryStyle || 'day-wise',
    };

    // Step 2: Call Geo Service (uses Supabase destination_contexts if configured, else static datasets)
    const destinationContext = await geoService.getDestinationContext(
      destination,
      supabase,
    );

    // Step 2b: (Optional) Vector Geo Context via JSON + Pinecone (Goa dataset etc.)
    // Uses backend/src/geo-data/*.json + embeddings in Pinecone index \"travel-app\".
    const userQuery =
      (personalPrompt && String(personalPrompt).trim()) ||
      `Trip to ${destination} for ${travelers || 1} travelers, budget ${budget || '50000'}, interests: ${(interests || []).join(', ')}`;
    
    let vectorGeoContext = null;
    try {
      vectorGeoContext = await getVectorGeoContext(
        destination,
        userQuery,
      );
    } catch (e) {
      console.warn('Vector Geo Service failed or not configured:', e.message);
    }

    // Step 2c: Build RICH geo context (merges structured + vector + specific places)
    // This creates the competitive advantage: specific restaurants, hostels, exact activities
    const richGeoContext = buildRichGeoContext(
      destination,
      userQuery,
      vectorGeoContext,
    );

    // Step 3: Call Perplexity Service
    const travelInsights = await perplexityService.getTravelInsights(
      destination,
      personalPrompt,
    );

    // Attach vector insights into insights for AI prompt if available
    if (vectorGeoContext && Array.isArray(vectorGeoContext.vectorInsights)) {
      travelInsights.vectorInsights = vectorGeoContext.vectorInsights;
      travelInsights.structuredGeo = vectorGeoContext.structuredData;
    }

    // Step 4: Call AI Service (pass rich geo context for specific outputs)
    const generatedItinerary = await aiService.generateItinerary({
      formData,
      geo: richGeoContext || destinationContext, // Use rich context if available
      insights: travelInsights,
    });

    // Log which provider generated the itinerary
    const aiProvider = generatedItinerary.meta?.aiProvider || 'local';
    console.log(`📋 Itinerary generated by: ${aiProvider === 'local' ? 'local heuristic (no AI)' : aiProvider}`);

    // Step 5: Save itinerary in database (using mock DB here)
    const itineraryId = `itinerary-${Date.now()}`;
    const itinerary = {
      id: itineraryId,
      user_id: 'test-user-1', // mock user for this core API
      title: generatedItinerary.title,
      destination: generatedItinerary.destination,
      start_date: generatedItinerary.start_date,
      end_date: generatedItinerary.end_date,
      budget: generatedItinerary.budget,
      travelers: generatedItinerary.travelers,
      preferences: generatedItinerary.preferences,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      meta: generatedItinerary.meta,
    };

    mockDatabase.itineraries.push(itinerary);

    const daysWithActivities = generatedItinerary.days.map((day, index) => {
      const dayRecord = {
        id: `day-${itineraryId}-${index + 1}`,
        itinerary_id: itineraryId,
        day_number: day.day_number,
        date: day.date,
        title: day.title,
        notes: day.notes || null,
        activities: day.activities.map((activity, actIndex) => ({
          id: `activity-${itineraryId}-${index + 1}-${actIndex + 1}`,
          day_id: `day-${itineraryId}-${index + 1}`,
          title: activity.title,
          description: activity.description,
          time_start: toValidTime(activity.time_start),
          time_end: toValidTime(activity.time_end),
          location: activity.location,
          cost: activity.cost,
          category: activity.category,
          order_index: activity.order_index,
          image_url: activity.image_url,
          created_at: new Date().toISOString(),
        })),
      };

      mockDatabase.activities.push(...dayRecord.activities);
      return dayRecord;
    });

    // Cost breakdown when user asked for tickets: Flights & Trains + Stay & Food
    let costBreakdown = null;
    if (checkTickets && (transportOption === 'train' || transportOption === 'flight')) {
      const budgetTier = (budget && ['budget', 'midrange', 'luxury'].includes(String(budget).toLowerCase())) ? String(budget).toLowerCase() : 'midrange';
      const travelersNum = Math.max(1, parseInt(String(travelers), 10) || 1);
      const flightsTrainsEst = transportOption === 'train'
        ? (budgetTier === 'budget' ? 3200 : budgetTier === 'luxury' ? 9000 : 5500) * travelersNum
        : (budgetTier === 'budget' ? 5000 : budgetTier === 'luxury' ? 14000 : 8000) * travelersNum;
      const stayFoodTotal = daysWithActivities.reduce((sum, day) => {
        return sum + day.activities.reduce((daySum, a) => daySum + (a.cost || 0), 0);
      }, 0);
      const stayFoodEst = stayFoodTotal > 0 ? stayFoodTotal : (generatedItinerary.budget || 20000) - flightsTrainsEst;
      costBreakdown = {
        flightsTrains: Math.round(flightsTrainsEst),
        stayFood: Math.round(Math.max(0, stayFoodEst)),
        total: Math.round(flightsTrainsEst + Math.max(0, stayFoodEst)),
        daysCount: daysWithActivities.length,
        trainClass: transportOption === 'train' ? (TRAIN_CLASS_BY_BUDGET[budgetTier] || '2AC') : null,
      };
    }

    // Step 6: Return itinerary JSON (include aiProvider and costBreakdown when applicable)
    return res.json({
      success: true,
      data: {
        ...itinerary,
        days: daysWithActivities,
        meta: generatedItinerary.meta,
        costBreakdown,
        checkTickets: !!checkTickets,
        departurePlace: departurePlace || null,
        transportOption: transportOption || null,
      },
      meta: {
        geo: richGeoContext || destinationContext,
        insights: travelInsights,
        vectorEnabled: vectorGeoContext?.meta?.vectorsEnabled || false,
        aiProvider: generatedItinerary.meta?.aiProvider,
      },
    });
  } catch (error) {
    console.error('❌ Error in /itinerary/generate:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
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


// ─────────────────────────────────────────────────────────────────────────────
// COLLABORATION ROUTES
// All routes expect the caller to pass `userId` in the request body / query
// (in production this would come from a verified JWT; here we trust the client
//  while Supabase RLS enforces the actual security).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/itineraries/:id/invite
 * Body: { userId, email, role: 'editor'|'viewer' }
 * Creates a pending collaborator row with a unique token.
 * Returns the deep-link the owner can share (works for new & existing users).
 */
app.post('/api/itineraries/:id/invite', async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' });
  const { id: itineraryId } = req.params;
  const { userId, email, role = 'viewer' } = req.body || {};

  if (!userId || !email) {
    return res.status(400).json({ error: 'userId and email are required' });
  }

  try {
    // Verify the requester owns this itinerary (uses supabaseAdmin to bypass RLS)
    const { data: itin, error: itinErr } = await supabaseAdmin
      .from('itineraries')
      .select('id, title, destination')
      .eq('id', itineraryId)
      .eq('user_id', userId)
      .single();

    if (itinErr || !itin) {
      return res.status(403).json({ error: 'Itinerary not found or not owned by you' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if invite already exists for this email on this itinerary
    const { data: existing } = await supabaseAdmin
      .from('itinerary_collaborators')
      .select('id, invite_token')
      .eq('itinerary_id', itineraryId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    let collab;
    if (existing) {
      // Re-invite: reset to pending with a fresh token
      const newToken = crypto.randomUUID();
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('itinerary_collaborators')
        .update({ status: 'pending', role, invite_token: newToken, invited_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (updateErr) throw updateErr;
      collab = updated;
    } else {
      // New invite
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('itinerary_collaborators')
        .insert({ itinerary_id: itineraryId, email: normalizedEmail, role, status: 'pending' })
        .select()
        .single();
      if (insertErr) throw insertErr;
      collab = inserted;
    }

    // ── Smart invite routing ─────────────────────────────────────────────────
    // Check if this email already belongs to a Supabase Auth user.
    const appScheme = process.env.APP_SCHEME || 'projectx';
    const inviteLink  = `${appScheme}://invite?token=${collab.invite_token}`;

    const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = (existingUsers || []).find(u => u.email?.toLowerCase() === normalizedEmail);

    if (existingUser) {
      // ── Existing user: link user_id immediately + send in-app notification ──
      await supabaseAdmin
        .from('itinerary_collaborators')
        .update({ user_id: existingUser.id })
        .eq('id', collab.id);

      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: existingUser.id,
          type: 'collab_invite',
          title: `Trip invite: ${itin.destination}`,
          body: `You've been invited to collaborate on "${itin.title}". Tap to accept or decline.`,
          data: {
            invite_token: collab.invite_token,
            itinerary_id: itineraryId,
            itinerary_title: itin.title,
            destination: itin.destination,
            role,
          },
          is_read: false,
        });

      console.log(`🔔 In-app notification sent to existing user: ${normalizedEmail}`);
    } else {
      // ── New user: send Supabase Auth invite email ────────────────────────
      const redirectTo = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/callback?invite_token=${collab.invite_token}&itinerary=${itineraryId}`;

      const { error: emailErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo,
        data: {
          invite_token: collab.invite_token,
          itinerary_id: itineraryId,
          itinerary_title: itin.title,
          destination: itin.destination,
          role,
        },
      });

      if (emailErr) {
        console.warn('⚠️  Invite email failed:', emailErr.message);
      } else {
        console.log(`📩 Invite email sent to new user: ${normalizedEmail}`);
      }
    }

    return res.json({
      success: true,
      inviteLink,
      collaborator: collab,
      isExistingUser: !!existingUser,
      message: existingUser
        ? `${normalizedEmail} is already on the app — they'll get an in-app notification`
        : `Invite email sent to ${normalizedEmail}`,
    });
  } catch (err) {
    console.error('Invite error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/invitations/claim/:token?userId=<uuid>
 * Called when the app opens with a deep-link token.
 * Links the invite to the now-authenticated user and marks it accepted.
 */
app.get('/api/invitations/claim/:token', async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' });
  const { token } = req.params;
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'userId query param required' });

  try {
    // Find the invite row
    const { data: invite, error: findErr } = await supabaseAdmin
      .from('itinerary_collaborators')
      .select('*, itineraries(title, destination)')
      .eq('invite_token', token)
      .single();

    if (findErr || !invite) {
      return res.status(404).json({ error: 'Invite not found or already used' });
    }

    if (invite.status === 'accepted') {
      return res.json({ success: true, alreadyAccepted: true, itinerary: invite.itineraries });
    }

    // Claim: set user_id and mark accepted
    const { error: updateErr } = await supabaseAdmin
      .from('itinerary_collaborators')
      .update({ user_id: userId, status: 'accepted', joined_at: new Date().toISOString() })
      .eq('invite_token', token);

    if (updateErr) throw updateErr;

    return res.json({
      success: true,
      itineraryId: invite.itinerary_id,
      itinerary: invite.itineraries,
      role: invite.role,
      message: 'You have joined the itinerary!',
    });
  } catch (err) {
    console.error('Claim invite error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/itineraries/:id/collaborators/:collabId
 * Body: { userId, role: 'editor'|'viewer' }
 * Owner changes a collaborator's role.
 */
app.patch('/api/itineraries/:id/collaborators/:collabId', async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' });
  const { id: itineraryId, collabId } = req.params;
  const { userId, role } = req.body || {};

  if (!userId || !role) return res.status(400).json({ error: 'userId and role required' });
  if (!['editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'role must be editor or viewer' });
  }

  try {
    const { data: itin } = await supabaseAdmin
      .from('itineraries')
      .select('id')
      .eq('id', itineraryId)
      .eq('user_id', userId)
      .single();

    if (!itin) return res.status(403).json({ error: 'Not authorised' });

    const { data, error } = await supabaseAdmin
      .from('itinerary_collaborators')
      .update({ role })
      .eq('id', collabId)
      .eq('itinerary_id', itineraryId)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, collaborator: data });
  } catch (err) {
    console.error('Update role error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/itineraries/:id/collaborators/:collabId
 * Body: { userId }
 * Owner removes a collaborator.
 */
app.delete('/api/itineraries/:id/collaborators/:collabId', async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' });
  const { id: itineraryId, collabId } = req.params;
  const { userId } = req.body || {};

  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const { data: itin } = await supabaseAdmin
      .from('itineraries')
      .select('id')
      .eq('id', itineraryId)
      .eq('user_id', userId)
      .single();

    if (!itin) return res.status(403).json({ error: 'Not authorised' });

    const { error } = await supabaseAdmin
      .from('itinerary_collaborators')
      .delete()
      .eq('id', collabId)
      .eq('itinerary_id', itineraryId);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    console.error('Remove collaborator error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/activities/:activityId/vote
 * Body: { userId, vote: 1 | -1 }
 * Casts, changes, or removes (toggle) a vote on an activity.
 */
app.post('/api/activities/:activityId/vote', async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' });
  const { activityId } = req.params;
  const { userId, vote } = req.body || {};

  if (!userId || ![1, -1].includes(Number(vote))) {
    return res.status(400).json({ error: 'userId and vote (1 or -1) required' });
  }

  try {
    // Check if user already voted
    const { data: existing } = await supabaseAdmin
      .from('activity_votes')
      .select('id, vote')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      if (existing.vote === Number(vote)) {
        // Toggle off — remove the vote
        await supabaseAdmin.from('activity_votes').delete().eq('id', existing.id);
      } else {
        await supabaseAdmin.from('activity_votes').update({ vote: Number(vote) }).eq('id', existing.id);
      }
    } else {
      await supabaseAdmin.from('activity_votes').insert({ activity_id: activityId, user_id: userId, vote: Number(vote) });
    }

    const { data: votes } = await supabaseAdmin
      .from('activity_votes')
      .select('vote')
      .eq('activity_id', activityId);

    const up = (votes || []).filter(v => v.vote === 1).length;
    const down = (votes || []).filter(v => v.vote === -1).length;

    return res.json({ success: true, tally: { up, down, net: up - down } });
  } catch (err) {
    console.error('Vote error:', err);
    return res.status(500).json({ error: err.message });
  }
});


// ── Notification routes ───────────────────────────────────────────────────────

/**
 * GET /api/notifications?userId=<uuid>
 * Returns all unread notifications for a user.
 */
app.get('/api/notifications', async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' });
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.json({ success: true, notifications: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Body: { userId }
 * Mark a notification as read.
 */
app.patch('/api/notifications/:id/read', async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' });
  const { id } = req.params;
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/notifications/:id/respond
 * Body: { userId, action: 'accept' | 'decline' }
 * Accept or decline a collab_invite notification.
 */
app.post('/api/notifications/:id/respond', async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' });
  const { id } = req.params;
  const { userId, action } = req.body || {};

  if (!userId || !['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'userId and action (accept|decline) required' });
  }

  try {
    // Fetch notification to get invite token
    const { data: notif, error: notifErr } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (notifErr || !notif) return res.status(404).json({ error: 'Notification not found' });

    const token = notif.data?.invite_token;
    if (!token) return res.status(400).json({ error: 'Invalid notification data' });

    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    const { error: collabErr } = await supabaseAdmin
      .from('itinerary_collaborators')
      .update({
        status: newStatus,
        user_id: userId,
        ...(action === 'accept' ? { joined_at: new Date().toISOString() } : {}),
      })
      .eq('invite_token', token);

    if (collabErr) throw collabErr;

    // Mark notification as read
    await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', id);

    return res.json({
      success: true,
      status: newStatus,
      itineraryId: notif.data?.itinerary_id,
    });
  } catch (err) {
    console.error('Respond error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


// Start server
// Bind to 0.0.0.0 so it's reachable from other devices on the network.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 YatraAI API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📖 API Documentation:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/itineraries/generate - Generate itinerary`);
  console.log(`   GET  /api/users/:userId - Get user profile`);
  console.log(`   GET  /api/users/:userId/itineraries - Get user itineraries`);
  console.log(`   POST /api/suggestions - Get smart suggestions`);
  console.log(`\n🧪 Ready for Postman testing!`);
});

module.exports = app;
