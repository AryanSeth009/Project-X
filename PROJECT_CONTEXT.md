# Project Context: YatraAI (Project-X)

This document provides a comprehensive overview of the application architecture, tech stack, and core features to help contextualize the codebase for LLMs (like ChatGPT).

## 1. What Are We Building?
**YatraAI** is an AI-powered, collaborative travel itinerary planner. Users can generate highly customized, day-by-day trip itineraries using AI, edit those itineraries, and invite friends to collaborate, vote on activities, and plan trips together.

## 2. Tech Stack
### Frontend (Mobile App)
*   **Framework:** React Native with **Expo**.
*   **Routing:** Expo Router (file-based routing in the `app/` directory).
*   **Styling:** NativeWind (Tailwind CSS for React Native) + standard `StyleSheet`.
*   **UI Components:** Custom components, `expo-blur` for glassmorphism effects, `lucide-react-native` for icons.
*   **State Management:** Zustand (via `store/useStore.ts`).

### Backend (Custom Server)
*   **Framework:** Node.js + Express.js (`api-server.js` running on port 3001).
*   **AI Integrations:**
    *   **Perplexity API:** Used via `lib/perplexity-service.js` to gather real-time web insights, place details, and geographic context.
    *   **LLM Engine:** Multi-provider support (OpenAI, Anthropic, Gemini, Mistral) via `lib/ai-service.js` to physically generate the structured JSON itinerary using the context gathered by Perplexity.
*   **Geo Context:** Custom `geo-service.js` and `contextBuilder.cjs` to inject specific geographic boundaries and data into the AI prompts.

### Database & Auth (Backend-as-a-Service)
*   **Provider:** Supabase
*   **Database:** PostgreSQL
*   **Authentication:** Supabase Auth (Email magic links, standard signup). Handles deep-link redirects for invites.
*   **Security:** Heavy reliance on Row Level Security (RLS) policies in PostgreSQL to restrict data access based on user ID and collaboration roles. Server bypasses RLS using a Service Role Key (`supabaseAdmin`) for trusted internal operations.

## 3. Core Features
*   **AI Generation Flow:** User inputs preferences (destination, budget, vibe, days) -> Backend fetches live info via Perplexity -> LLM formats data into a structured day-by-day JSON itinerary -> Saved to Supabase.
*   **Interactive UI:** Users can view itineraries day-by-day, see AI-fetched images for locations, and drag-and-drop to reorder activities.
*   **Collaboration System:**
    *   Owners can invite friends via email.
    *   **Smart Routing:** If the invitee is already registered on the app, they receive an **in-app notification**. If they are a new user, Supabase Auth sends an **email invite** with a magic deep-link.
    *   Role management (Owner, Editor, Viewer).
*   **Social Voting:** Collaborators can Upvote (👍) or Downvote (👎) individual activities within a day.
*   **In-App Notifications:** A notification bell in the UI that loads from a `notifications` table, allowing users to Accept/Decline invites directly in the app.

## 4. Key Database Schema
*   `profiles`: Standard user data linked to Supabase Auth.
*   `itineraries`: Stores the trip metadata (destination, title, dates) and the core `itinerary` JSON object (the day-by-day plan).
*   `itinerary_collaborators`: Links a `user_id` to an `itinerary_id`. Contains `role` (viewer/editor), `status` (pending/accepted), and an `invite_token`.
*   `activity_votes`: Tracks user votes per activity. schema: `(id, itinerary_id, activity_id, user_id, vote [1 or -1])`.
*   `notifications`: Stores in-app alerts. schema: `(id, user_id, type, title, body, data JSONB, is_read)`.

## 5. Typical File Structure
*   `app/(tabs)/`: Main screen layouts (`home.tsx`, `itinerary.tsx`, `profile.tsx`).
*   `api-server.js`: The monolithic Express backend handling generation, AI orchestration, and collaboration routes (invites, votes, notifications).
*   `supabase/migrations/`: SQL files defining the tables and RLS policies (e.g., `20260221000000_collaboration.sql`).
*   `lib/`: Helper modules for AI, Perplexity, and geographic context.
