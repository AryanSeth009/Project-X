## YatraAI – Project Overview

### High-level idea

YatraAI is an Expo + React Native app that lets users sign up, buy credits / go Pro, and generate AI-style travel itineraries. It uses Supabase as the backend for auth, data storage, and a credits/transactions system. The UI is tab-based with four main tabs: Home, Itinerary, Edit, and Profile.

### Tech stack

- **Frontend**: Expo SDK 54, React Native, `expo-router`, `nativewind` (Tailwind-like classes).
- **State management**: `zustand` (`store/useStore.ts`) for user, profile, itineraries, and loading state.
- **Backend / DB**: Supabase (`lib/supabase.ts`) with a Postgres schema defined in `supabase/migrations/..._create_travel_itinerary_schema.sql`.
- **Auth**: Supabase email/password auth via `supabase.auth.*`.

### Data model (Supabase schema)

Defined in `supabase/migrations/20260216095602_create_travel_itinerary_schema.sql`:

- **`profiles`**
  - One row per auth user (triggered from `auth.users` insert).
  - Fields: `email`, `credits` (default 3), `is_pro`, `pro_expires_at`, timestamps.
  - RLS: users can only read/update their own profile.
- **`itineraries`**
  - Top-level trip: `title`, `destination`, `start_date`, `end_date`, `budget`, `travelers`, `preferences`, `status`.
  - Linked to `profiles` via `user_id`.
  - RLS: users can CRUD only their own itineraries.
- **`itinerary_days`**
  - Per-day entries for an itinerary: `day_number`, `date`, `title`, optional `notes`.
  - Linked to `itineraries` via `itinerary_id`.
- **`activities`**
  - Concrete activities per day: `title`, `description`, `time_start`, `time_end`, `location`, `cost`, `category`, `order_index`, optional `image_url`.
  - Linked to `itinerary_days` via `day_id`.
- **`transactions`**
  - Records payments / credit purchases / subscriptions: `type`, `amount`, `credits_added`, Razorpay IDs, `status`.
  - Linked to `profiles` via `user_id`.

There are RLS policies on all tables to ensure each user only sees and mutates their own data. Triggers keep `updated_at` in sync and create a profile row for new auth users.

### Client-side state (`store/useStore.ts`)

`useStore` (Zustand) holds:

- **State**
  - `user`: current Supabase auth user (or `null`).
  - `profile`: current user profile row (credits, pro status, etc.).
  - `currentItinerary`: the itinerary currently being viewed/edited.
  - `itineraries`: list of itineraries in memory.
  - `isLoading`: global loading flag.
- **Actions**
  - `setUser`, `setProfile`, `setCurrentItinerary`, `setItineraries`, `setLoading`.
  - `addItinerary`, `updateItinerary`, `deleteItinerary`.
  - `updateProfile` (merges into existing profile).
  - `reset` (clears all state on sign-out).

### Supabase client (`lib/supabase.ts`)

- Reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env`.
- If either is missing, throws immediately to fail fast.
- Exports a single `supabase` client instance used across screens.

### Navigation & layout (Expo Router)

- **Root layout**: `app/_layout.tsx`
  - Imports global styles (`global.css`), sets up `Stack` navigator and `StatusBar`.
  - On mount, calls `supabase.auth.getSession()`:
    - Populates `useStore.user` with the current user.
    - If logged in, calls `loadProfile(user.id)` to fetch the `profiles` row and put it into state.
  - Subscribes to `supabase.auth.onAuthStateChange`:
    - Updates `user` and `profile` in the store whenever auth state changes.
    - Clears `profile` on sign-out.
  - Declares stack screens: `index` (splash), `(tabs)` (main app), `loading` (itinerary generation), `auth`, and `+not-found`.

- **Tabs layout**: `app/(tabs)/_layout.tsx`
  - Uses `Tabs` from `expo-router` with four tabs:
    - `home`: trip form and generator.
    - `itinerary`: view latest / current itinerary.
    - `edit`: edit activities of the current itinerary.
    - `profile`: account, credits, Pro upsell.
  - Custom tab bar styling and icons via `lucide-react-native`.

- **Splash / entry screen**: `app/index.tsx`
  - Simple splash screen with branding.
  - After 3 seconds:
    - If `useStore.user` is set, navigates to `/(tabs)/home`.
    - Otherwise, navigates to `/auth`.

### Auth flow (`app/auth.tsx`)

- UI:
  - Toggle between **Sign In** and **Sign Up**.
  - Email + password fields, validation, loading state, and error display.
- Logic:
  - On submit:
    - If logging in, calls `supabase.auth.signInWithPassword({ email, password })`.
    - If signing up, calls `supabase.auth.signUp({ email, password })`.
  - On success, immediately `router.replace('/(tabs)/home')`.
  - On error, sets `error` to `error.message` for user-friendly display.
- Supabase side:
  - On successful sign-up, Supabase’s `auth.users` trigger inserts into `public.profiles` with default credits (3).
  - The root layout’s `onAuthStateChange` then fetches this profile into `useStore`.

### Home / itinerary generation (`app/(tabs)/home.tsx` & `app/loading.tsx`)

**Home screen (`home.tsx`)**

- Shows:
  - Current credits from `profile.credits`.
  - Trip form:
    - Destination, start date, end date, travelers, budget, interests.
- On **Generate Itinerary**:
  - Validates required fields.
  - Ensures user has at least 1 credit (`profile.credits >= 1`).
  - Pushes to `/loading` with the form data as a serialized JSON string in route params.

**Loading screen (`loading.tsx`)**

- Shows animated loading messages while generating an itinerary.
- On mount, calls `generateItinerary()`:
  - Aborts if no `profile` or `user` in the store.
  - Parses `params.data` (formData).
  - Constructs a new itinerary object:
    - `title`, `destination`, `start_date`, `end_date`, `budget`, `travelers`, `preferences`, `status`.
  - Inserts into `supabase.from('itineraries')` and gets the inserted row.
  - Computes the number of days between start and end date (inclusive).
  - For each day:
    - Inserts a row into `itinerary_days` with a generated title and date.
    - Inserts a set of **mock activities** into `activities` for that day (hard-coded demo data).
    - Builds an in-memory `dayRecords` array with each day and its activities.
  - Decrements user credits:
    - Calls `updateProfile({ credits: profile.credits - 1 })` in the store.
    - Updates the `profiles` row in Supabase.
  - Builds `fullItinerary = { ...itinerary, days: dayRecords }`.
    - `addItinerary(fullItinerary)` to prepend into the local list.
    - `setCurrentItinerary(fullItinerary)` for immediate viewing/editing.
  - After a short delay, redirects to `/(tabs)/itinerary` with the itinerary ID in params.
- On error:
  - Logs the error and calls `router.back()` to return to the previous screen.

### Viewing itineraries (`app/(tabs)/itinerary.tsx`)

- If `currentItinerary` is null and user is logged in:
  - Calls `loadLatestItinerary()`:
    - Fetches the most recent itinerary for `user.id` from Supabase.
    - Fetches its `itinerary_days`, ordered by `day_number`.
    - For each day, fetches `activities` ordered by `order_index`.
    - Combines into a single object and stores via `setCurrentItinerary`.
- If still loading, shows a loading placeholder.
- If no itinerary exists, shows a “No Itinerary Yet” message and instructs user to create one.
- When `currentItinerary` exists:
  - Displays high-level summary:
    - Title, destination, duration (days), budget, computed estimated total cost.
  - Shows buttons to **Share** (native share sheet) and a placeholder **PDF** button.
  - Renders each day with its activities, including:
    - Category emoji and color.
    - Time, location, cost.
    - Optional image and description.

### Editing itineraries (`app/(tabs)/edit.tsx`)

- If `currentItinerary` is null:
  - Shows an empty state asking user to create an itinerary first.
- When `currentItinerary` exists:
  - Lists days and activities, similar to the itinerary view but editable.
  - **Add activity**:
    - Uses local `newActivity` state.
    - On save:
      - Inserts into `activities` with the appropriate `day_id`, parsed numeric cost, and `order_index` based on existing activities length.
      - Appends the new activity to the matching `day` in `currentItinerary`.
  - **Update activity**:
    - When tapping an activity, turns into an editable form.
    - On save:
      - Updates the activity row in Supabase.
      - Updates the corresponding activity in all `currentItinerary.days`.
  - **Delete activity**:
    - Confirms via `Alert`.
    - Deletes from Supabase, then removes from `currentItinerary` in state.

### Profile, credits, and Pro (`app/(tabs)/profile.tsx`)

- Requires `user` and `profile` to be loaded (otherwise shows a loading placeholder).
- Shows:
  - User email.
  - Plan status: Free vs Pro.
  - Credits count (or ∞ for Pro).
  - Count of itineraries from the store.
- **Buying credits**:
  - Predefined credit packs (5, 10, 25).
  - On selection:
    - Inserts a pending transaction into `transactions`.
    - Simulates a Razorpay payment via an alert:
      - On “Simulate Success”:
        - Marks transaction as `completed`.
        - Updates `profiles.credits` in Supabase and in the store.
        - Shows success alert.
- **Upgrading to Pro**:
  - Similar simulated payment flow:
    - On success:
      - Sets `is_pro = true` and `pro_expires_at` one month in the future.
      - Updates both Supabase and local store.
- **Sign out**:
  - Calls `supabase.auth.signOut()`.
  - Clears all state via `reset()` and navigates to `/auth`.

### Auth / profile bootstrap flow summary

1. App starts on `app/_layout.tsx`.
2. Root layout:
   - Checks `supabase.auth.getSession()`:
     - If a session exists, stores `user` and loads profile.
   - Subscribes to auth state changes:
     - On sign-in/sign-up: sets `user`, loads `profile`.
     - On sign-out: clears `user` and `profile`.
3. Splash screen (`index.tsx`):
   - Waits 3 seconds, then:
     - If `user` present → `/(tabs)/home`.
     - Else → `/auth`.
4. Auth screen (`auth.tsx`):
   - Logs in or signs up via Supabase, then navigates to `/(tabs)/home`.
   - Auth state subscription in root layout ensures user/profile are synced after that.

### What’s left / potential next steps

- **Real AI integration**:
  - Replace `getMockActivities` and static day titles in `loading.tsx` with calls to an AI backend (Edge Function or separate NestJS/Express service).
  - Store and reuse prompts, embeddings, and feedback in Supabase.
- **Real payments**:
  - Wire `transactions` to actual Razorpay (or another provider) webhooks instead of simulated alerts.
  - Add screens for **itinerary history** and **payment history** (placeholders exist in `profile.tsx`).
- **Better validation & UX**:
  - Date pickers instead of plain text inputs.
  - More robust form validation (e.g., ensure end date ≥ start date).
- **Offline & caching**:
  - Persist itineraries locally using AsyncStorage or a database for offline access.
- **Security & production hardening**:
  - Review Supabase RLS policies for edge cases.
  - Add logging/monitoring around itinerary generation and payments.

