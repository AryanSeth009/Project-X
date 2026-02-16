import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Calendar,
  Wallet,
  Clock,
  Download,
  Share2,
  ChevronRight,
} from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

const categoryIcons: any = {
  attraction: '🏛️',
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏨',
  activity: '🎯',
};

const categoryColors: any = {
  attraction: 'bg-blue-500',
  food: 'bg-orange-500',
  transport: 'bg-purple-500',
  accommodation: 'bg-green-500',
  activity: 'bg-pink-500',
};

export default function ItineraryScreen() {
  const { currentItinerary, user, itineraries, setCurrentItinerary } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentItinerary && user) {
      loadLatestItinerary();
    }
  }, [user]);

  const loadLatestItinerary = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (itineraryError || !itineraryData) {
        setLoading(false);
        return;
      }

      const { data: daysData, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('itinerary_id', itineraryData.id)
        .order('day_number', { ascending: true });

      if (daysError) throw daysError;

      const daysWithActivities = await Promise.all(
        (daysData || []).map(async (day) => {
          const { data: activitiesData, error: activitiesError } = await supabase
            .from('activities')
            .select('*')
            .eq('day_id', day.id)
            .order('order_index', { ascending: true });

          if (activitiesError) throw activitiesError;

          return {
            ...day,
            activities: activitiesData || [],
          };
        })
      );

      setCurrentItinerary({
        ...itineraryData,
        days: daysWithActivities,
      });
    } catch (error) {
      console.error('Error loading itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    if (!currentItinerary) return 0;
    return currentItinerary.days.reduce(
      (total, day) =>
        total +
        day.activities.reduce((dayTotal, activity) => dayTotal + activity.cost, 0),
      0
    );
  };

  const handleShare = async () => {
    if (!currentItinerary) return;
    try {
      await Share.share({
        message: `Check out my ${currentItinerary.destination} itinerary created with YatraAI!`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Loading itinerary...</Text>
      </View>
    );
  }

  if (!currentItinerary) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-6xl mb-4">📋</Text>
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          No Itinerary Yet
        </Text>
        <Text className="text-gray-500 text-center">
          Create your first itinerary from the Home tab
        </Text>
      </View>
    );
  }

  const totalCost = calculateTotalCost();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#FF9933', '#FFA500']}
        className="pt-12 pb-6 px-6"
      >
        <Text className="text-white text-3xl font-bold mb-2">
          {currentItinerary.title}
        </Text>
        <View className="flex-row items-center gap-2">
          <MapPin size={16} color="#FFFFFF" />
          <Text className="text-white/90 text-lg">
            {currentItinerary.destination}
          </Text>
        </View>
      </LinearGradient>

      <View className="px-6 py-4">
        <View className="bg-white rounded-2xl p-4 shadow-md mb-6 flex-row justify-around">
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Calendar size={16} color="#FF9933" />
              <Text className="text-xs text-gray-500">Duration</Text>
            </View>
            <Text className="text-lg font-bold text-gray-800">
              {currentItinerary.days.length} Days
            </Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Wallet size={16} color="#FF9933" />
              <Text className="text-xs text-gray-500">Budget</Text>
            </View>
            <Text className="text-lg font-bold text-gray-800">
              ₹{currentItinerary.budget.toLocaleString()}
            </Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Wallet size={16} color="#10B981" />
              <Text className="text-xs text-gray-500">Estimated</Text>
            </View>
            <Text className="text-lg font-bold text-green-600">
              ₹{totalCost.toLocaleString()}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-1 bg-saffron-500 rounded-xl py-3 flex-row items-center justify-center gap-2"
            onPress={handleShare}
          >
            <Share2 size={18} color="#FFFFFF" />
            <Text className="text-white font-bold">Share</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-white border-2 border-saffron-500 rounded-xl py-3 flex-row items-center justify-center gap-2">
            <Download size={18} color="#FF9933" />
            <Text className="text-saffron-500 font-bold">PDF</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-2xl font-bold text-gray-800 mb-4">
          Your Journey
        </Text>

        {currentItinerary.days.map((day, dayIndex) => (
          <View key={day.id} className="mb-6">
            <View className="bg-white rounded-t-2xl p-4 border-l-4 border-saffron-500">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-lg font-bold text-gray-800">
                  Day {day.day_number}
                </Text>
                <Text className="text-sm text-gray-500">
                  {new Date(day.date).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <Text className="text-gray-600">{day.title}</Text>
            </View>

            <View className="bg-white rounded-b-2xl px-4 pb-4 shadow-lg">
              {day.activities.map((activity, actIndex) => (
                <View key={activity.id}>
                  <View className="flex-row gap-3 py-4">
                    <View className="items-center">
                      <View
                        className={`w-12 h-12 rounded-full ${
                          categoryColors[activity.category]
                        } items-center justify-center`}
                      >
                        <Text className="text-2xl">
                          {categoryIcons[activity.category]}
                        </Text>
                      </View>
                      {actIndex < day.activities.length - 1 && (
                        <View className="w-0.5 flex-1 bg-gray-200 mt-2" />
                      )}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                          <Text className="text-base font-bold text-gray-800 mb-1">
                            {activity.title}
                          </Text>
                          <View className="flex-row items-center gap-1 mb-1">
                            <Clock size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-500">
                              {activity.time_start} - {activity.time_end}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <MapPin size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-500">
                              {activity.location}
                            </Text>
                          </View>
                        </View>
                        <View className="bg-green-50 px-3 py-1 rounded-full">
                          <Text className="text-green-700 font-bold text-sm">
                            ₹{activity.cost}
                          </Text>
                        </View>
                      </View>

                      {activity.image_url && (
                        <Image
                          source={{ uri: activity.image_url }}
                          className="w-full h-40 rounded-xl mb-2"
                          resizeMode="cover"
                        />
                      )}

                      <Text className="text-sm text-gray-600 leading-5">
                        {activity.description}
                      </Text>
                    </View>
                  </View>
                  {actIndex < day.activities.length - 1 && (
                    <View className="h-px bg-gray-100" />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
