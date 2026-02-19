import { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { API_BASE_URL, postJson } from '@/lib/api';
import type {
  ItineraryFormData,
  GeneratedItinerary,
} from '@/lib/itinerary-generator';

const loadingMessages = [
  '🔍 Analyzing your travel preferences...',
  '🗺️ Finding the best destinations...',
  '🤖 AI is crafting your itinerary...',
  '⭐ Adding hidden gems...',
  '📍 Optimizing routes...',
  '💰 Optimizing for budget...',
  '🎯 Personalizing experiences...',
  '✨ Almost ready...',
];

export default function LoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    user,
    profile,
    updateProfile,
    addItinerary,
    setCurrentItinerary,
  } = useStore();

  const [messageIndex, setMessageIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setMessageIndex((prev) =>
        prev < loadingMessages.length - 1 ? prev + 1 : prev
      );
    }, 2000);

    generateItinerary();

    return () => clearInterval(interval);
  }, []);

  const generateItinerary = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      if (!params.data) {
        Alert.alert('Error', 'Missing itinerary data');
        router.back();
        return;
      }

      const formData: ItineraryFormData = JSON.parse(
        params.data as string
      );

      // Generate itinerary using backend AI pipeline
      type GenerateResponse = {
        success: boolean;
        data: any;
        meta?: any;
      };

      const apiResponse = await postJson<
        ItineraryFormData,
        GenerateResponse
      >('/itinerary/generate', formData);

      if (!apiResponse?.success || !apiResponse.data) {
        throw new Error('Failed to generate itinerary from API');
      }

      const apiItinerary = apiResponse.data;

      // Adapt backend response into GeneratedItinerary shape
      const generatedItinerary: GeneratedItinerary = {
        title: apiItinerary.title,
        destination: apiItinerary.destination,
        start_date: apiItinerary.start_date,
        end_date: apiItinerary.end_date,
        budget: apiItinerary.budget,
        travelers: apiItinerary.travelers,
        preferences: apiItinerary.preferences,
        days: (apiItinerary.days || []).map((day: any) => ({
          day_number: day.day_number,
          date: day.date,
          title: day.title,
          notes: day.notes ?? undefined,
          activities: (day.activities || []).map((activity: any) => ({
            title: activity.title,
            description: activity.description,
            time_start: activity.time_start,
            time_end: activity.time_end,
            location: activity.location,
            cost: activity.cost,
            category: activity.category,
            order_index: activity.order_index,
            image_url: activity.image_url,
          })),
        })),
      };

      if (!generatedItinerary) {
        throw new Error('Failed to generate itinerary');
      }

      // Save itinerary
      const { data: itinerary, error: itineraryError } =
        await supabase
          .from('itineraries')
          .insert([
            {
              user_id: user.id,
              title: generatedItinerary.title,
              destination: generatedItinerary.destination,
              start_date: generatedItinerary.start_date,
              end_date: generatedItinerary.end_date,
              budget: generatedItinerary.budget,
              travelers: generatedItinerary.travelers,
              preferences: generatedItinerary.preferences,
              status: 'active',
            },
          ])
          .select()
          .single();

      if (itineraryError) throw itineraryError;

      const dayRecords = [];

      // Save days and activities
      for (const day of generatedItinerary.days) {
        const { data: dayData, error: dayError } =
          await supabase
            .from('itinerary_days')
            .insert([
              {
                itinerary_id: itinerary.id,
                day_number: day.day_number,
                date: day.date,
                title: day.title,
                notes: day.notes,
              },
            ])
            .select()
            .single();

        if (dayError) throw dayError;

        const activities = day.activities.map((activity) => ({
          ...activity,
          day_id: dayData.id,
        }));

        const { error: activityError } =
          await supabase
            .from('activities')
            .insert(activities);

        if (activityError) throw activityError;

        dayRecords.push({
          ...dayData,
          activities: day.activities,
        });
      }

      // Deduct credits
      const newCredits = (profile?.credits || 0) - 1;

      updateProfile({
        ...profile,
        credits: newCredits,
      });

      await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      // Update store (include meta so we can show "Generated by AI" badge)
      const fullItinerary = {
        ...itinerary,
        days: dayRecords,
        meta: apiItinerary.meta,
      };

      addItinerary(fullItinerary);
      setCurrentItinerary(fullItinerary);

      const provider = apiItinerary.meta?.aiProvider || 'local';
      console.log('✅ Itinerary created', provider === 'local' ? '(local heuristic)' : `(AI: ${provider})`);

      setTimeout(() => {
        router.replace({
          pathname: '/(tabs)/itinerary',
          params: { id: itinerary.id },
        });
      }, 1200);

    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Failed to generate itinerary'
      );

      router.back();
    }
  };

  return (
    <LinearGradient
      colors={['#FF9933', '#FFFFFF', '#138808']}
      className="flex-1 items-center justify-center px-6"
    >
      <View className="items-center">

        <View className="w-40 h-40 bg-white rounded-full items-center justify-center mb-8">
          <Text className="text-6xl">✨</Text>
        </View>

        <Text className="font-inter-bold text-3xl text-white mb-4">
          Creating Your Journey
        </Text>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text className="font-inter-medium text-xl text-white text-center">
            {loadingMessages[messageIndex]}
          </Text>
        </Animated.View>

        <View className="flex-row mt-10 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className="w-3 h-3 bg-white rounded-full"
              style={{
                opacity:
                  messageIndex % 4 === i ? 1 : 0.3,
              }}
            />
          ))}
        </View>

      </View>
    </LinearGradient>
  );
}
