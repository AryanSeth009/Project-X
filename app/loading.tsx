import { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

const loadingMessages = [
  'Analyzing your preferences...',
  'Finding the best destinations...',
  'Crafting your perfect itinerary...',
  'Adding amazing experiences...',
  'Calculating optimal routes...',
  'Almost ready!',
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
        .insert([mockItinerary])
        .select()
        .single();

      if (itineraryError) throw itineraryError;

      const days = calculateDays(formData.startDate, formData.endDate);
      const dayRecords = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(formData.startDate);
        date.setDate(date.getDate() + i);

        const dayData = {
          itinerary_id: itinerary.id,
          day_number: i + 1,
          date: date.toISOString().split('T')[0],
          title: `Day ${i + 1}: ${getDayTitle(i, formData.destination)}`,
          notes: null,
        };

        const { data: day, error: dayError } = await supabase
          .from('itinerary_days')
          .insert([dayData])
          .select()
          .single();

        if (dayError) throw dayError;

        const activities = getMockActivities(i, day.id, formData.destination);

        const { error: activitiesError } = await supabase
          .from('activities')
          .insert(activities);

        if (activitiesError) throw activitiesError;

        dayRecords.push({ ...day, activities });
      }

      const fullItinerary = { ...itinerary, days: dayRecords };
      addItinerary(fullItinerary);
      setCurrentItinerary(fullItinerary);

      setTimeout(() => {
        router.replace({
          pathname: '/(tabs)/itinerary',
          params: { id: itinerary.id },
        });
      }, 1000);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      router.back();
    }
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const getDayTitle = (dayIndex: number, destination: string) => {
    const titles = [
      `Arrival & ${destination} Exploration`,
      'Cultural Immersion',
      'Adventure & Activities',
      'Local Experiences',
      'Hidden Gems Discovery',
      'Relaxation & Leisure',
      'Farewell & Departure',
    ];
    return titles[dayIndex % titles.length];
  };

  const getMockActivities = (dayIndex: number, dayId: string, destination: string) => {
    const activities = [
      {
        day_id: dayId,
        title: 'Morning Temple Visit',
        description: `Explore the beautiful ancient temples of ${destination}`,
        time_start: '09:00',
        time_end: '11:00',
        location: `${destination} Old Town`,
        cost: 500,
        category: 'attraction' as const,
        order_index: 0,
        image_url: 'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg',
      },
      {
        day_id: dayId,
        title: 'Local Cuisine Lunch',
        description: 'Taste authentic regional dishes at a popular restaurant',
        time_start: '12:30',
        time_end: '14:00',
        location: 'City Center',
        cost: 800,
        category: 'food' as const,
        order_index: 1,
        image_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      },
      {
        day_id: dayId,
        title: 'Heritage Walk',
        description: 'Guided walking tour through historic neighborhoods',
        time_start: '15:00',
        time_end: '17:30',
        location: 'Heritage District',
        cost: 600,
        category: 'activity' as const,
        order_index: 2,
        image_url: 'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg',
      },
      {
        day_id: dayId,
        title: 'Sunset Viewpoint',
        description: 'Watch the stunning sunset from the best vantage point',
        time_start: '18:00',
        time_end: '19:30',
        location: `${destination} Viewpoint`,
        cost: 200,
        category: 'attraction' as const,
        order_index: 3,
        image_url: 'https://images.pexels.com/photos/1659437/pexels-photo-1659437.jpeg',
      },
    ];

    return activities;
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
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className="w-3 h-3 bg-white rounded-full"
              style={{
                opacity: messageIndex % 3 === i ? 1 : 0.3,
              }}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}
