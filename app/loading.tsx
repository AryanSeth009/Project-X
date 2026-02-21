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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Message cycle and fade
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      setMessageIndex((prev) =>
        prev < loadingMessages.length - 1 ? prev + 1 : prev
      );
    }, 3000);

    // Breathing pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle rotation for orbital effect
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    generateItinerary();

    return () => clearInterval(interval);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
      colors={['#1A1C19', '#242922', '#1A1C19']}
      className="flex-1 items-center justify-center px-6"
    >
      <View className="items-center justify-center">
        {/* Orbital Ring */}
        <Animated.View
          style={{
            transform: [{ rotate: spin }],
            position: 'absolute',
            borderWidth: 2,
            borderColor: 'rgba(76, 175, 80, 0.2)',
            width: 256,
            height: 256,
            borderRadius: 128,
            borderStyle: 'dashed',
          }}
        />

        {/* Outer Glow */}
        <View className="w-48 h-48 rounded-full absolute" style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)' }} />

        {/* Central Icon Container */}
        <Animated.View
          style={[
            { transform: [{ scale: pulseAnim }] },
            { backgroundColor: 'rgba(245, 245, 220, 0.1)', borderColor: 'rgba(245, 245, 220, 0.2)' }
          ]}
          className="w-36 h-36 rounded-full items-center justify-center border shadow-xl"
        >
          <Text className="text-6xl">✨</Text>
        </Animated.View>

        <View className="mt-12 items-center">
          <Text className="font-inter-bold text-3xl text-[#F5F5DC] mb-2 tracking-tight">
            Magical Planning
          </Text>
          <Text className="font-inter-medium text-sm uppercase tracking-[4px] mb-8" style={{ color: 'rgba(76, 175, 80, 0.8)' }}>
            AI Assistant
          </Text>

          <Animated.View style={{ opacity: fadeAnim }} className="h-12 justify-center">
            <Text className="font-inter-medium text-lg text-center px-4" style={{ color: 'rgba(245, 245, 220, 0.9)' }}>
              {loadingMessages[messageIndex]}
            </Text>
          </Animated.View>

          {/* New Progress Indicators */}
          <View className="flex-row mt-12 gap-3 items-center">
            {[0, 1, 2, 3].map((i) => (
              <Animated.View
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: '#4CAF50',
                  opacity: messageIndex % 4 === i ? 1 : 0.2,
                  transform: [{ scale: messageIndex % 4 === i ? 1.2 : 1 }],
                }}
              />
            ))}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
