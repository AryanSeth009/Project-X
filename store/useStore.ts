import { create } from 'zustand';

export interface Activity {
  id: string;
  day_id: string;
  title: string;
  description: string;
  time_start: string;
  time_end: string;
  location: string;
  cost: number;
  category: 'attraction' | 'food' | 'transport' | 'accommodation' | 'activity';
  order_index: number;
  image_url?: string;
  created_at: string;
}

export interface ItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  date: string;
  title: string;
  notes?: string;
  activities: Activity[];
  created_at: string;
}

export interface Itinerary {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  travelers: number;
  preferences: any;
  status: 'draft' | 'active' | 'completed';
  days: ItineraryDay[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  credits: number;
  is_pro: boolean;
  pro_expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface AppStore {
  user: any;
  profile: Profile | null;
  currentItinerary: Itinerary | null;
  itineraries: Itinerary[];
  isLoading: boolean;

  setUser: (user: any) => void;
  setProfile: (profile: Profile | null) => void;
  setCurrentItinerary: (itinerary: Itinerary | null) => void;
  setItineraries: (itineraries: Itinerary[]) => void;
  setLoading: (loading: boolean) => void;

  addItinerary: (itinerary: Itinerary) => void;
  updateItinerary: (id: string, updates: Partial<Itinerary>) => void;
  deleteItinerary: (id: string) => void;

  updateProfile: (updates: Partial<Profile>) => void;

  reset: () => void;
}

const initialState = {
  user: null,
  profile: null,
  currentItinerary: null,
  itineraries: [],
  isLoading: false,
};

export const useStore = create<AppStore>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setCurrentItinerary: (currentItinerary) => set({ currentItinerary }),
  setItineraries: (itineraries) => set({ itineraries }),
  setLoading: (isLoading) => set({ isLoading }),

  addItinerary: (itinerary) =>
    set((state) => ({
      itineraries: [itinerary, ...state.itineraries],
    })),

  updateItinerary: (id, updates) =>
    set((state) => ({
      itineraries: state.itineraries.map((it) =>
        it.id === id ? { ...it, ...updates } : it
      ),
      currentItinerary:
        state.currentItinerary?.id === id
          ? { ...state.currentItinerary, ...updates }
          : state.currentItinerary,
    })),

  deleteItinerary: (id) =>
    set((state) => ({
      itineraries: state.itineraries.filter((it) => it.id !== id),
      currentItinerary:
        state.currentItinerary?.id === id ? null : state.currentItinerary,
    })),

  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    })),

  reset: () => set(initialState),
}));
