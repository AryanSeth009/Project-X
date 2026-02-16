# YatraAI - AI Travel Planner 🇮🇳

A complete React Native + Expo app for AI-powered travel itinerary planning with Indian saffron branding, inspired by Wonderplan.ai and Wanderlog.

## Features

### Core Functionality
- **AI Itinerary Generation** - Create personalized travel plans with one click
- **Wonderplan-style Cards** - Beautiful, visual itinerary display with images
- **Wanderlog-style Timeline** - Drag-and-drop editing interface
- **Credit System** - Free credits + Pro subscription model
- **Razorpay Integration** - UPI payments for Indian market

### Screens
1. **Splash Screen** - 3-second saffron gradient loading
2. **Authentication** - Email/password with Supabase Auth
3. **Home** - Hero section + trip generation form with interests
4. **Loading** - Animated AI generation with rotating messages
5. **Itinerary** - Day-by-day cards with activities, budget tracking, PDF export
6. **Edit** - Timeline editor with add/edit/delete activities
7. **Profile** - Credits display, Pro upgrade (₹199/mo), payment history

## Tech Stack

- **Framework**: React Native + Expo SDK 52
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS)
- **State**: Zustand
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: Razorpay
- **Icons**: Lucide React Native

## Database Schema

### Tables
- `profiles` - User profiles with credits and Pro status
- `itineraries` - Travel plans with destination, dates, budget
- `itinerary_days` - Days within each itinerary
- `activities` - Individual activities with time, location, cost
- `transactions` - Payment records for credits/Pro

## Setup Instructions

### 1. Environment Variables
Update `.env` with your credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_RAZORPAY_KEY=your_razorpay_key
```

### 2. Database Setup
Database is already configured with:
- All tables created
- Row Level Security enabled
- Policies configured for user isolation
- Triggers for auto-updating timestamps

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
# Web
npm run build:web

# iOS/Android
npx expo build:ios
npx expo build:android
```

## Key Features

### Credit System
- New users get 3 free credits
- 1 credit = 1 itinerary generation
- Purchase options: 5 for ₹99, 10 for ₹149, 25 for ₹299

### Pro Subscription (₹199/month)
- Unlimited itinerary generation
- Priority AI processing
- Advanced editing features
- Premium destinations database
- 24/7 Priority support
- Multiple export formats

### Itinerary Features
- AI-generated day-by-day plans
- Activity categorization (attraction, food, transport, accommodation, activity)
- Time-based scheduling
- Budget tracking and estimation
- Beautiful image integration from Pexels
- Share functionality
- PDF export

### Edit Features
- Drag-and-drop reordering (Phase 2)
- Add/edit/delete activities
- Real-time updates
- Inline editing interface

## Design System

### Colors
- **Saffron**: #FF9933 (Primary)
- **Green**: #138808 (Secondary)
- **White**: #FFFFFF (Background)
- Indian tricolor gradient throughout

### Typography
- Sans-serif system fonts
- Bold headings
- Clean, readable body text

### Components
- Rounded corners (12-24px)
- Elevation shadows
- Gradient backgrounds
- Icon-first design

## Navigation Structure

```
app/
├── index.tsx (Splash)
├── auth.tsx (Login/Signup)
├── loading.tsx (AI Generation)
├── _layout.tsx (Root)
└── (tabs)/
    ├── _layout.tsx (Tab Navigator)
    ├── home.tsx (Generate Form)
    ├── itinerary.tsx (View Cards)
    ├── edit.tsx (Timeline Editor)
    └── profile.tsx (Credits & Pro)
```

## Phase 1 Complete ✅

All core features implemented:
- Full authentication flow
- Itinerary generation with mock AI
- Beautiful card-based display
- Timeline editing interface
- Credit system with Razorpay integration
- Profile management with Pro upgrade
- Responsive design for iOS/Android/Web

## Phase 2 Roadmap

- Real AI integration (OpenAI/Anthropic)
- Advanced drag-and-drop reordering
- Multi-format exports (PDF, Excel, iCal)
- Offline mode with sync
- Social sharing features
- Collaborative trip planning
- Hotel/flight booking integration

## License

Proprietary - All rights reserved

## Made with 🇮🇳 in India
