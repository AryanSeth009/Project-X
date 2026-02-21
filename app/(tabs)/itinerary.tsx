import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  TextInput,
  Alert,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Calendar,
  Wallet,
  Clock,
  Download,
  Share2,
  Pencil,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Navigation,
  ExternalLink,
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

type ItineraryListItem = {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

export default function ItineraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentItinerary, user, itineraries, setCurrentItinerary, deleteItinerary } = useStore();
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<ItineraryListItem[]>([]);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const [editingDay, setEditingDay] = useState<any>(null);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    time_start: '',
    time_end: '',
    location: '',
    cost: '',
    category: 'activity' as const,
  });

  const requestedId = useMemo(() => {
    const id = params.id;
    return typeof id === 'string' ? id : undefined;
  }, [params.id]);

  const requestedMode = useMemo(() => {
    const m = params.mode;
    return typeof m === 'string' ? m : undefined;
  }, [params.mode]);

  useEffect(() => {
    if (requestedMode === 'edit') setMode('edit');
  }, [requestedMode]);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    if (requestedId) {
      loadItineraryById(requestedId);
      return;
    }
    if (!currentItinerary) loadLatestItinerary();
  }, [user?.id, requestedId]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('itineraries')
        .select('id,title,destination,start_date,end_date,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data || []) as ItineraryListItem[]);
    } catch (e) {
      console.error('Error loading itinerary history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadItineraryById = async (itineraryId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', itineraryId)
        .eq('user_id', user.id)
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

  const loadLatestItinerary = async () => {
    if (!user) return;
    try {
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (itineraryError || !itineraryData) {
        return;
      }

      await loadItineraryById(itineraryData.id);
    } catch (e) {
      console.error('Error loading latest itinerary:', e);
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

  const handleAddActivity = async (dayId: string) => {
    if (!currentItinerary) return;
    if (!newActivity.title || !newActivity.time_start || !newActivity.time_end) {
      Alert.alert('Missing fields', 'Title, start time and end time are required.');
      return;
    }

    try {
      const day = currentItinerary.days.find((d) => d.id === dayId);
      const orderIndex = day?.activities?.length ?? 0;

      const { data, error } = await supabase
        .from('activities')
        .insert([
          {
            day_id: dayId,
            title: newActivity.title,
            description: newActivity.description,
            time_start: newActivity.time_start,
            time_end: newActivity.time_end,
            location: newActivity.location,
            cost: parseFloat(newActivity.cost) || 0,
            category: newActivity.category,
            order_index: orderIndex,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const updatedDays = currentItinerary.days.map((d) =>
        d.id === dayId ? { ...d, activities: [...d.activities, data] } : d
      );

      setCurrentItinerary({ ...currentItinerary, days: updatedDays });
      setNewActivity({
        title: '',
        description: '',
        time_start: '',
        time_end: '',
        location: '',
        cost: '',
        category: 'activity',
      });
      setShowAddActivity(false);
      setEditingDay(null);
      Alert.alert('Saved', 'Activity added.');
    } catch (e) {
      console.error('Error adding activity:', e);
      Alert.alert('Error', 'Failed to add activity.');
    }
  };

  const handleDeleteActivity = async (activityId: string, dayId: string) => {
    if (!currentItinerary) return;
    Alert.alert('Delete activity?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('activities')
              .delete()
              .eq('id', activityId);

            if (error) throw error;

            const updatedDays = currentItinerary.days.map((d) =>
              d.id === dayId
                ? { ...d, activities: d.activities.filter((a) => a.id !== activityId) }
                : d
            );
            setCurrentItinerary({ ...currentItinerary, days: updatedDays });
          } catch (e) {
            console.error('Error deleting activity:', e);
            Alert.alert('Error', 'Failed to delete activity.');
          }
        },
      },
    ]);
  };

  const handleUpdateActivity = async (activityId: string, updates: any) => {
    if (!currentItinerary) return;
    try {
      const payload = {
        title: updates.title,
        description: updates.description,
        time_start: updates.time_start,
        time_end: updates.time_end,
        location: updates.location,
        cost: Number(updates.cost) || 0,
        category: updates.category,
      };

      const { error } = await supabase
        .from('activities')
        .update(payload)
        .eq('id', activityId);

      if (error) throw error;

      const updatedDays = currentItinerary.days.map((day) => ({
        ...day,
        activities: day.activities.map((a) =>
          a.id === activityId ? { ...a, ...payload } : a
        ),
      }));

      setCurrentItinerary({ ...currentItinerary, days: updatedDays });
      setEditingActivity(null);
      Alert.alert('Saved', 'Activity updated.');
    } catch (e) {
      console.error('Error updating activity:', e);
      Alert.alert('Error', 'Failed to update activity.');
    }
  };

  const handleDeleteItinerary = async (itineraryId: string) => {
    Alert.alert(
      'Delete Itinerary',
      'Are you sure you want to delete this itinerary? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('itineraries')
                .delete()
                .eq('id', itineraryId);

              if (error) throw error;

              // Update local state
              setHistory((prev) => prev.filter((it) => it.id !== itineraryId));
              deleteItinerary(itineraryId);

              // If the deleted one was current, reset current
              if (currentItinerary?.id === itineraryId) {
                setCurrentItinerary(null);
              }
              
              Alert.alert('Deleted', 'Itinerary has been removed.');
            } catch (e) {
              console.error('Error deleting itinerary:', e);
              Alert.alert('Error', 'Failed to delete itinerary.');
            }
          },
        },
      ]
    );
  };

  const handleMoveActivity = async (dayId: string, activityId: string, direction: 'up' | 'down') => {
    if (!currentItinerary) return;

    const day = currentItinerary.days.find(d => d.id === dayId);
    if (!day) return;

    const activities = [...day.activities].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const currentIndex = activities.findIndex(a => a.id === activityId);
    
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === activities.length - 1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentActivity = activities[currentIndex];
    const targetActivity = activities[swapIndex];

    // Swap order_index
    const newCurrentOrder = targetActivity.order_index || 0;
    const newTargetOrder = currentActivity.order_index || 0;

    try {
      // Update both in Supabase
      const { error: error1 } = await supabase
        .from('activities')
        .update({ order_index: newCurrentOrder })
        .eq('id', currentActivity.id);

      const { error: error2 } = await supabase
        .from('activities')
        .update({ order_index: newTargetOrder })
        .eq('id', targetActivity.id);

      if (error1 || error2) throw error1 || error2;

      // Update local state
      const updatedActivities = activities.map(a => {
        if (a.id === currentActivity.id) return { ...a, order_index: newCurrentOrder };
        if (a.id === targetActivity.id) return { ...a, order_index: newTargetOrder };
        return a;
      }).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      const updatedDays = currentItinerary.days.map(d => 
        d.id === dayId ? { ...d, activities: updatedActivities } : d
      );

      setCurrentItinerary({ ...currentItinerary, days: updatedDays });
    } catch (e) {
      console.error('Error reordering activities:', e);
      Alert.alert('Error', 'Failed to reorder activities.');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#1A1C19' }}>
        <Text className="font-inter" style={{ color: '#F5F5DC' }}>Loading itinerary...</Text>
      </View>
    );
  }

  if (!currentItinerary) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: '#1A1C19' }}>
        <Text className="text-6xl mb-4">📋</Text>
        <Text className="font-inter-bold text-2xl mb-2" style={{ color: '#F5F5DC' }}>
          No Itinerary Yet
        </Text>
        <Text className="font-inter text-center" style={{ color: '#9CA3AF' }}>
          Create your first itinerary from the Home tab
        </Text>
        <TouchableOpacity
          className="mt-6 rounded-xl px-5 py-3"
          style={{ backgroundColor: '#4CAF50' }}
          onPress={() => router.push('/(tabs)/home')}
        >
          <Text className="font-inter-bold" style={{ color: '#1A1C19' }}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalCost = calculateTotalCost();

  const aiProviderLabel = (() => {
    const p = (currentItinerary as any)?.meta?.aiProvider;
    if (p === 'openai') return 'Generated by GPT-4o-mini';
    if (p === 'gemini') return 'Generated by Gemini 1.5 Flash';
    if (p === 'claude') return 'Generated by Claude';
    if (p === 'local') return 'Generated locally';
    return null;
  })();

  const openInMaps = (location: string) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${0},${0}`;
    const label = location;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url);
    } else {
      // Fallback for web or other platforms
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      Linking.openURL(googleMapsUrl);
    }
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#1A1C19' }} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#242922', '#1A1C19']}
        className="pt-12 pb-6 px-6"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-inter-bold text-3xl mb-2" style={{ color: '#F5F5DC' }}>
              {currentItinerary.title}
            </Text>
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color="#4CAF50" />
              <Text className="font-inter-medium text-lg" style={{ color: 'rgba(245, 245, 220, 0.9)' }}>
                {currentItinerary.destination}
              </Text>
            </View>
            {aiProviderLabel && (
              <View className="mt-2 self-start rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(76, 175, 80, 0.25)' }}>
                <Text className="font-inter text-xs" style={{ color: '#F5F5DC' }}>{aiProviderLabel}</Text>
              </View>
            )}
          </View>

          <View className="flex-row rounded-2xl p-1" style={{ backgroundColor: 'rgba(36, 41, 34, 0.8)' }}>
            <TouchableOpacity
              className={`px-3 py-2 rounded-xl flex-row items-center gap-2 ${mode === 'view' ? '' : ''}`}
              style={mode === 'view' ? { backgroundColor: 'rgba(76, 175, 80, 0.3)' } : {}}
              onPress={() => setMode('view')}
            >
              <Eye size={16} color="#F5F5DC" />
              <Text className="font-inter-bold" style={{ color: '#F5F5DC' }}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-2 rounded-xl flex-row items-center gap-2 ${mode === 'edit' ? '' : ''}`}
              style={mode === 'edit' ? { backgroundColor: 'rgba(76, 175, 80, 0.3)' } : {}}
              onPress={() => setMode('edit')}
            >
              <Pencil size={16} color="#F5F5DC" />
              <Text className="font-inter-bold" style={{ color: '#F5F5DC' }}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 py-4">
        {/* History picker */}
        <View className="mb-6">
          <Text className="font-inter-bold text-sm mb-3" style={{ color: '#F5F5DC' }}>History</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {(history.length ? history : (itineraries as any)).slice(0, 20).map((it: any) => {
                const isActive = it.id === currentItinerary.id;
                return (
                  <View key={it.id} className="mr-4">
                    <TouchableOpacity
                      className="w-64 h-40 rounded-3xl overflow-hidden shadow-lg border-2"
                      style={{ borderColor: isActive ? '#4CAF50' : 'transparent' }}
                      onPress={() => loadItineraryById(it.id)}
                      disabled={loadingHistory}
                    >
                      <Image
                        source={{ uri: `https://source.unsplash.com/800x600/?${encodeURIComponent(it.destination)}` }}
                        className="absolute inset-0 w-full h-full"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        className="absolute inset-0 p-4 justify-end"
                      >
                        <Text className="font-inter-bold text-white text-lg" numberOfLines={1}>
                          {it.destination}
                        </Text>
                        <View className="flex-row items-center justify-between mt-1">
                          <Text className="font-inter text-white/70 text-xs">
                            {it.start_date}
                          </Text>
                          <TouchableOpacity 
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteItinerary(it.id);
                            }}
                            className="bg-black/40 p-1.5 rounded-full"
                          >
                            <Trash2 size={14} color="#FF6B6B" />
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View className="rounded-2xl p-4 shadow-md mb-6 flex-row justify-around" style={{ backgroundColor: '#242922' }}>
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Calendar size={16} color="#F39C12" />
              <Text className="text-xs" style={{ color: '#9CA3AF' }}>Duration</Text>
            </View>
            <Text className="font-inter-bold text-lg" style={{ color: '#F5F5DC' }}>
              {(currentItinerary as any).title?.toLowerCase().includes('top 10') ? 'Top 10' : `${currentItinerary.days.length} Days`}
            </Text>
          </View>
          <View className="w-px" style={{ backgroundColor: '#1A1C19' }} />
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Wallet size={16} color="#F39C12" />
              <Text className="text-xs" style={{ color: '#9CA3AF' }}>Budget</Text>
            </View>
            <Text className="font-inter-bold text-lg" style={{ color: '#F5F5DC' }}>
              ₹{currentItinerary.budget.toLocaleString()}
            </Text>
          </View>
          <View className="w-px" style={{ backgroundColor: '#1A1C19' }} />
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Wallet size={16} color="#4CAF50" />
              <Text className="text-xs" style={{ color: '#9CA3AF' }}>Estimated</Text>
            </View>
            <Text className="text-lg font-bold" style={{ color: '#4CAF50' }}>
              ₹{totalCost.toLocaleString()}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-1 rounded-xl py-3 flex-row items-center justify-center gap-2"
            style={{ backgroundColor: '#4CAF50' }}
            onPress={handleShare}
          >
            <Share2 size={18} color="#1A1C19" />
            <Text className="font-bold" style={{ color: '#1A1C19' }}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 border-2 rounded-xl py-3 flex-row items-center justify-center gap-2" style={{ backgroundColor: '#242922', borderColor: '#4CAF50' }}>
            <Download size={18} color="#F39C12" />
            <Text className="font-bold" style={{ color: '#4CAF50' }}>PDF</Text>
          </TouchableOpacity>
        </View>

        {mode === 'view' ? (
          <>
            <Text className="font-inter-bold text-2xl mb-4" style={{ color: '#F5F5DC' }}>
              Your Journey
            </Text>

            {currentItinerary.days.map((day) => (
              <View key={day.id} className="mb-6">
                <View className="rounded-t-2xl p-4 border-l-4" style={{ backgroundColor: '#242922', borderLeftColor: '#4CAF50' }}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-inter-bold text-lg" style={{ color: '#F5F5DC' }}>
                      {(currentItinerary as any).title?.toLowerCase().includes('top 10') ? 'Top Recommended Spots' : `Day ${day.day_number}`}
                    </Text>
                    <Text className="text-sm" style={{ color: '#9CA3AF' }}>
                      {new Date(day.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={{ color: 'rgba(245, 245, 220, 0.8)' }}>{day.title}</Text>
                </View>

                <View className="rounded-b-2xl px-4 pb-4 shadow-lg" style={{ backgroundColor: '#242922' }}>
                  {day.activities.map((activity, actIndex) => (
                    <View key={activity.id || `activity-${day.id}-${actIndex}`}>
                      <TouchableOpacity 
                        className="flex-row gap-3 py-4"
                        onPress={() => {
                          setSelectedActivity(activity);
                          setShowDetailModal(true);
                        }}
                      >
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
                              <Text className="text-base font-bold mb-1" style={{ color: '#F5F5DC' }}>
                                {activity.title}
                              </Text>
                              <View className="flex-row items-center gap-1 mb-1">
                                <Clock size={12} color="#9CA3AF" />
                                <Text className="text-xs" style={{ color: '#9CA3AF' }}>
                                  {activity.time_start} - {activity.time_end}
                                </Text>
                              </View>
                              <View className="flex-row items-center gap-1">
                                <MapPin size={12} color="#9CA3AF" />
                                <Text className="text-xs" numberOfLines={1} style={{ color: '#9CA3AF' }}>
                                  {activity.location}
                                </Text>
                              </View>
                            </View>
                            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(76, 175, 80, 0.2)' }}>
                              <Text className="font-bold text-sm" style={{ color: '#4CAF50' }}>
                                ₹{activity.cost}
                              </Text>
                            </View>
                            <View className="ml-2 self-center">
                              <ChevronRight size={18} color="#9CA3AF" />
                            </View>
                          </View>

                          {activity.image_url && (
                            <Image
                              source={{ uri: activity.image_url }}
                              className="w-full h-40 rounded-xl mb-2"
                              resizeMode="cover"
                            />
                          )}

                          <Text className="text-sm leading-5" numberOfLines={2} style={{ color: 'rgba(245, 245, 220, 0.8)' }}>
                            {activity.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {actIndex < day.activities.length - 1 && (
                        <View className="h-px" style={{ backgroundColor: '#1A1C19' }} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Activity Detail Modal */}
            <Modal
              visible={showDetailModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDetailModal(false)}
            >
              <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <View className="h-[90%] rounded-t-[40px] overflow-hidden" style={{ backgroundColor: '#242922' }}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header Image */}
                    <View className="h-80 w-full relative">
                      <Image
                        source={{ uri: selectedActivity?.image_url || `https://source.unsplash.com/800x600/?${encodeURIComponent(selectedActivity?.title || 'travel')}` }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <BlurView intensity={30} className="absolute top-12 left-6 rounded-full overflow-hidden">
                        <TouchableOpacity 
                          onPress={() => setShowDetailModal(false)}
                          className="w-12 h-12 items-center justify-center"
                        >
                          <ChevronRight size={24} color="#F5F5DC" style={{ transform: [{rotate: '180deg'}] }} />
                        </TouchableOpacity>
                      </BlurView>

                      <LinearGradient
                        colors={['transparent', '#242922']}
                        className="absolute bottom-0 left-0 right-0 h-24"
                      />
                    </View>

                    {/* Content */}
                    <View className="px-8 pb-12">
                      <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-1 mr-4">
                          <Text className="font-inter-bold text-3xl mb-2" style={{ color: '#F5F5DC' }}>
                            {selectedActivity?.title}
                          </Text>
                          <View className="flex-row items-center gap-2">
                            <MapPin size={16} color="#F39C12" />
                            <Text className="font-inter-medium" style={{ color: '#9CA3AF' }}>
                              {selectedActivity?.location}
                            </Text>
                          </View>
                        </View>
                        <View className="px-4 py-2 rounded-2xl" style={{ backgroundColor: '#1A1C19' }}>
                          <Text className="font-inter-bold" style={{ color: '#4CAF50' }}>
                            ₹{selectedActivity?.cost}
                          </Text>
                        </View>
                      </View>

                      {/* Stats */}
                      <View className="flex-row gap-4 mb-8">
                        <View className="px-4 py-3 rounded-2xl flex-row items-center gap-2" style={{ backgroundColor: '#1A1C19' }}>
                          <Clock size={16} color="#9CA3AF" />
                          <Text className="font-inter-medium" style={{ color: '#F5F5DC' }}>
                            {selectedActivity?.time_start} - {selectedActivity?.time_end}
                          </Text>
                        </View>
                        <View className="px-4 py-3 rounded-2xl flex-row items-center gap-2" style={{ backgroundColor: '#1A1C19' }}>
                          <Text className="text-lg">{categoryIcons[selectedActivity?.category]}</Text>
                          <Text className="font-inter-medium" style={{ color: '#F5F5DC' }}>
                            {selectedActivity?.category?.charAt(0).toUpperCase() + selectedActivity?.category?.slice(1)}
                          </Text>
                        </View>
                      </View>

                      {/* Description */}
                      <Text className="font-inter-bold text-xl mb-3" style={{ color: '#F5F5DC' }}>About</Text>
                      <Text className="font-inter leading-7 text-lg mb-10" style={{ color: 'rgba(245, 245, 220, 0.85)' }}>
                        {selectedActivity?.description}
                      </Text>

                      {/* Map Button */}
                      <TouchableOpacity
                        onPress={() => openInMaps(selectedActivity?.location || selectedActivity?.title)}
                        className="h-16 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg"
                        style={{ backgroundColor: '#4CAF50' }}
                      >
                        <Navigation size={22} color="#1A1C19" />
                        <Text className="font-inter-bold text-lg" style={{ color: '#1A1C19' }}>Open in Maps</Text>
                        <ExternalLink size={18} color="#1A1C19" />
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </>
        ) : (
          <>
            <Text className="font-inter-bold text-2xl mb-4" style={{ color: '#F5F5DC' }}>
              Edit in place
            </Text>

            {currentItinerary.days.map((day) => (
              <View key={day.id} className="mb-6">
                <View className="rounded-t-2xl p-4 border-l-4" style={{ backgroundColor: '#242922', borderLeftColor: '#4CAF50' }}>
                  <Text className="font-inter-bold text-lg" style={{ color: '#F5F5DC' }}>
                    Day {day.day_number}: {day.title}
                  </Text>
                  <Text className="text-sm" style={{ color: '#9CA3AF' }}>
                    {new Date(day.date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                <View className="rounded-b-2xl shadow-lg" style={{ backgroundColor: '#242922' }}>
                  {day.activities.map((activity, actIndex) => (
                    <View
                      key={activity.id || `activity-${day.id}-${actIndex}`}
                      className="border-b last:border-b-0"
                      style={{ borderColor: '#1A1C19' }}
                    >
                      {editingActivity?.id === activity.id ? (
                        <View className="p-4" style={{ backgroundColor: '#1A1C19' }}>
                          <TextInput
                            className="rounded-lg px-3 py-2 mb-2"
                            style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                            placeholder="Title"
                            placeholderTextColor="#9CA3AF"
                            value={editingActivity.title}
                            onChangeText={(text) =>
                              setEditingActivity({ ...editingActivity, title: text })
                            }
                          />
                          <TextInput
                            className="rounded-lg px-3 py-2 mb-2"
                            style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                            placeholder="Description"
                            placeholderTextColor="#9CA3AF"
                            value={editingActivity.description}
                            onChangeText={(text) =>
                              setEditingActivity({
                                ...editingActivity,
                                description: text,
                              })
                            }
                            multiline
                          />
                          <View className="flex-row gap-2 mb-2">
                            <TextInput
                              className="flex-1 rounded-lg px-3 py-2"
                              style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                              placeholder="Start (HH:MM)"
                              placeholderTextColor="#9CA3AF"
                              value={editingActivity.time_start}
                              onChangeText={(text) =>
                                setEditingActivity({
                                  ...editingActivity,
                                  time_start: text,
                                })
                              }
                            />
                            <TextInput
                              className="flex-1 rounded-lg px-3 py-2"
                              style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                              placeholder="End (HH:MM)"
                              placeholderTextColor="#9CA3AF"
                              value={editingActivity.time_end}
                              onChangeText={(text) =>
                                setEditingActivity({
                                  ...editingActivity,
                                  time_end: text,
                                })
                              }
                            />
                          </View>
                          <TextInput
                            className="rounded-lg px-3 py-2 mb-2"
                            style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                            placeholder="Location"
                            placeholderTextColor="#9CA3AF"
                            value={editingActivity.location}
                            onChangeText={(text) =>
                              setEditingActivity({ ...editingActivity, location: text })
                            }
                          />
                          <TextInput
                            className="rounded-lg px-3 py-2 mb-3"
                            style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                            placeholder="Cost (₹)"
                            placeholderTextColor="#9CA3AF"
                            value={String(editingActivity.cost ?? '')}
                            onChangeText={(text) =>
                              setEditingActivity({
                                ...editingActivity,
                                cost: parseFloat(text) || 0,
                              })
                            }
                            keyboardType="number-pad"
                          />
                          <View className="flex-row gap-2">
                            <TouchableOpacity
                              className="flex-1 rounded-lg py-2"
                              style={{ backgroundColor: '#4CAF50' }}
                              onPress={() =>
                                handleUpdateActivity(activity.id, editingActivity)
                              }
                            >
                              <Text className="text-center font-bold" style={{ color: '#1A1C19' }}>
                                Save
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-1 rounded-lg py-2"
                              style={{ backgroundColor: '#242922' }}
                              onPress={() => setEditingActivity(null)}
                            >
                              <Text className="text-center font-bold" style={{ color: '#F5F5DC' }}>
                                Cancel
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          className="p-4 flex-row items-center gap-3"
                          onPress={() => setEditingActivity(activity)}
                        >
                          <GripVertical size={20} color="#9CA3AF" />
                          <View className="flex-1">
                            <Text className="font-bold mb-1" style={{ color: '#F5F5DC' }}>
                              {activity.title}
                            </Text>
                            <View className="flex-row items-center gap-3">
                              <Text className="text-xs" style={{ color: '#9CA3AF' }}>
                                {activity.time_start}–{activity.time_end}
                              </Text>
                              <Text className="text-xs" style={{ color: '#9CA3AF' }} numberOfLines={1}>
                                {activity.location}
                              </Text>
                              <Text className="text-xs font-bold" style={{ color: '#4CAF50' }}>
                                ₹{activity.cost}
                              </Text>
                            </View>
                          </View>
                          <View className="flex-row items-center">
                            <TouchableOpacity
                              onPress={() => handleMoveActivity(day.id, activity.id, 'up')}
                              className="p-2 mr-1"
                              disabled={actIndex === 0}
                            >
                              <ChevronUp size={18} color={actIndex === 0 ? '#E5E7EB' : '#9CA3AF'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleMoveActivity(day.id, activity.id, 'down')}
                              className="p-2 mr-2"
                              disabled={actIndex === day.activities.length - 1}
                            >
                              <ChevronDown size={18} color={actIndex === day.activities.length - 1 ? '#E5E7EB' : '#9CA3AF'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteActivity(activity.id, day.id)}
                              className="p-2"
                            >
                              <Trash2 size={18} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {showAddActivity && editingDay?.id === day.id ? (
                    <View className="p-4 border-t-2" style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: 'rgba(76, 175, 80, 0.3)' }}>
                      <Text className="font-bold mb-3" style={{ color: '#F5F5DC' }}>
                        Add New Activity
                      </Text>
                      <TextInput
                        className="rounded-lg px-3 py-2 mb-2"
                        style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                        placeholder="Activity title"
                        placeholderTextColor="#9CA3AF"
                        value={newActivity.title}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, title: text })
                        }
                      />
                      <TextInput
                        className="rounded-lg px-3 py-2 mb-2"
                        style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                        placeholder="Description"
                        placeholderTextColor="#9CA3AF"
                        value={newActivity.description}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, description: text })
                        }
                        multiline
                      />
                      <View className="flex-row gap-2 mb-2">
                        <TextInput
                          className="flex-1 rounded-lg px-3 py-2"
                          style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                          placeholder="Start (09:00)"
                          placeholderTextColor="#9CA3AF"
                          value={newActivity.time_start}
                          onChangeText={(text) =>
                            setNewActivity({ ...newActivity, time_start: text })
                          }
                        />
                        <TextInput
                          className="flex-1 rounded-lg px-3 py-2"
                          style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                          placeholder="End (11:00)"
                          placeholderTextColor="#9CA3AF"
                          value={newActivity.time_end}
                          onChangeText={(text) =>
                            setNewActivity({ ...newActivity, time_end: text })
                          }
                        />
                      </View>
                      <TextInput
                        className="rounded-lg px-3 py-2 mb-2"
                        style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                        placeholder="Location"
                        placeholderTextColor="#9CA3AF"
                        value={newActivity.location}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, location: text })
                        }
                      />
                      <TextInput
                        className="rounded-lg px-3 py-2 mb-3"
                        style={{ backgroundColor: '#242922', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                        placeholder="Cost (₹)"
                        placeholderTextColor="#9CA3AF"
                        value={newActivity.cost}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, cost: text })
                        }
                        keyboardType="number-pad"
                      />
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          className="flex-1 rounded-lg py-2"
                          style={{ backgroundColor: '#4CAF50' }}
                          onPress={() => handleAddActivity(day.id)}
                        >
                          <Text className="text-center font-bold" style={{ color: '#1A1C19' }}>
                            Add Activity
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 rounded-lg py-2"
                          style={{ backgroundColor: '#242922' }}
                          onPress={() => {
                            setShowAddActivity(false);
                            setEditingDay(null);
                          }}
                        >
                          <Text className="text-center font-bold" style={{ color: '#F5F5DC' }}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="p-4 flex-row items-center justify-center gap-2 border-t"
                      style={{ borderColor: '#1A1C19' }}
                      onPress={() => {
                        setShowAddActivity(true);
                        setEditingDay(day);
                      }}
                    >
                      <Plus size={18} color="#F39C12" />
                      <Text className="font-bold" style={{ color: '#4CAF50' }}>
                        Add Activity
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}
