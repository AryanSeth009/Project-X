import { useEffect, useState } from 'react';
import { View, Text, Animated, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { itineraryGenerator, type ItineraryFormData } from '@/lib/itinerary-generator';

const loadingMessages = [
  '🔍 Analyzing your travel preferences...',
  '🗺️ Finding the best destinations in your area...',
  '🤖 AI is crafting your perfect itinerary...',
  '⭐ Adding amazing experiences and hidden gems...',
  '📍 Calculating optimal routes and timing...',
  '💰 Optimizing for your budget...',
  '🎯 Personalizing activities based on your interests...',
  '✨ Almost ready! Your adventure awaits...',
];

export default function LoadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, addItinerary, setCurrentItinerary } = useStore();
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

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
      if (!user) return;

      const formData = JSON.parse(params.data as string);

      const mockItinerary = {
        user_id: user.id,
        title: `${formData.destination} Adventure`,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget: parseInt(formData.budget) || 50000,
        travelers: parseInt(formData.travelers) || 1,
        preferences: {
          interests: formData.interests || [],
          personalPrompt: formData.personalPrompt || '',
        },
        status: 'active' as const,
      };

      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries')
        .insert([{
          user_id: user.id,
          title: generatedItinerary.title,
          destination: generatedItinerary.destination,
          start_date: generatedItinerary.start_date,
          end_date: generatedItinerary.end_date,
          budget: generatedItinerary.budget,
          travelers: generatedItinerary.travelers,
          preferences: generatedItinerary.preferences,
          status: 'active' as const,
        }])
        .select()
        .single();

      if (itineraryError) throw itineraryError;

      // Save days and activities
      const dayRecords = [];
      for (const day of generatedItinerary.days) {
        const { data: dayData, error: dayError } = await supabase
          .from('itinerary_days')
          .insert([{
            itinerary_id: itinerary.id,
            day_number: day.day_number,
            date: day.date,
            title: day.title,
            notes: day.notes,
          }])
          .select()
          .single();

        if (dayError) throw dayError;

        // Save activities for this day
        const activitiesWithDayId = day.activities.map(activity => ({
          ...activity,
          day_id: dayData.id,
        }));

        const { error: activitiesError } = await supabase
          .from('activities')
          .insert(activitiesWithDayId);

        if (activitiesError) throw activitiesError;

        dayRecords.push({ ...dayData, activities: day.activities });
      }

      // Update user credits
      const newCredits = (profile.credits || 0) - 1;
      updateProfile({ credits: newCredits });

      await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      // Update store
      const fullItinerary = { ...itinerary, days: dayRecords };
      addItinerary(fullItinerary);
      setCurrentItinerary(fullItinerary);

      console.log('✅ Itinerary generation complete!');

      // Navigate to itinerary screen
      setTimeout(() => {
        router.replace({
          pathname: '/(tabs)/itinerary',
          params: { id: itinerary.id },
        });
      }, 1500);
    } catch (error) {
      console.error('❌ Error generating itinerary:', error);
      Alert.alert('Error', 'Failed to generate itinerary. Please try again.');
      router.back();
    }
  };

  return (
    <LinearGradient
      colors={['#FF9933', '#FFFFFF', '#138808']}
      className="flex-1 items-center justify-center px-6"
    >
      <View className="items-center">
        <View className="w-40 h-40 bg-white rounded-full items-center justify-center mb-8 shadow-2xl">
          <Text className="text-7xl animate-spin">✨</Text>
        </View>

        <Text className="text-3xl font-bold text-white mb-4 text-center">
          Creating Your Journey
        </Text>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text className="text-xl text-white/90 text-center px-8">
            {loadingMessages[messageIndex]}
          </Text>
        </Animated.View>

        <View className="mt-12 flex-row gap-2">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className="w-3 h-3 bg-white rounded-full"
              style={{
                opacity: messageIndex % 4 === i ? 1 : 0.3,
              }}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}
