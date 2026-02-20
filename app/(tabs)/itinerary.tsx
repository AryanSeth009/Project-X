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
} from 'react-native';
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
  const { currentItinerary, user, itineraries, setCurrentItinerary } = useStore();
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<ItineraryListItem[]>([]);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const [editingDay, setEditingDay] = useState<any>(null);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="font-inter text-gray-500">Loading itinerary...</Text>
      </View>
    );
  }

  if (!currentItinerary) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-6xl mb-4">📋</Text>
        <Text className="font-inter-bold text-2xl text-gray-800 mb-2">
          No Itinerary Yet
        </Text>
        <Text className="font-inter text-gray-500 text-center">
          Create your first itinerary from the Home tab
        </Text>
        <TouchableOpacity
          className="mt-6 bg-saffron-500 rounded-xl px-5 py-3"
          onPress={() => router.push('/(tabs)/home')}
        >
          <Text className="font-inter-bold text-white">Go to Home</Text>
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

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#FF9933', '#FFA500']}
        className="pt-12 pb-6 px-6"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-inter-bold text-white text-3xl mb-2">
              {currentItinerary.title}
            </Text>
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color="#FFFFFF" />
              <Text className="font-inter-medium text-white/90 text-lg">
                {currentItinerary.destination}
              </Text>
            </View>
            {aiProviderLabel && (
              <View className="mt-2 self-start bg-white/25 rounded-full px-3 py-1">
                <Text className="font-inter text-xs text-white/95">{aiProviderLabel}</Text>
              </View>
            )}
          </View>

          <View className="flex-row bg-white/20 rounded-2xl p-1">
            <TouchableOpacity
              className={`px-3 py-2 rounded-xl flex-row items-center gap-2 ${
                mode === 'view' ? 'bg-white/25' : ''
              }`}
              onPress={() => setMode('view')}
            >
              <Eye size={16} color="#FFFFFF" />
              <Text className="font-inter-bold text-white">View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-2 rounded-xl flex-row items-center gap-2 ${
                mode === 'edit' ? 'bg-white/25' : ''
              }`}
              onPress={() => setMode('edit')}
            >
              <Pencil size={16} color="#FFFFFF" />
              <Text className="font-inter-bold text-white">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 py-4">
        {/* History picker */}
        <View className="mb-6">
          <Text className="font-inter-bold text-sm text-gray-700 mb-3">History</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {(history.length ? history : (itineraries as any)).slice(0, 20).map((it: any) => {
                const isActive = it.id === currentItinerary.id;
                return (
                  <TouchableOpacity
                    key={it.id}
                    className={`px-4 py-3 rounded-2xl border ${
                      isActive ? 'bg-saffron-50 border-saffron-300' : 'bg-white border-gray-200'
                    }`}
                    onPress={() => loadItineraryById(it.id)}
                    disabled={loadingHistory}
                  >
                    <Text className="font-inter-bold text-gray-800" numberOfLines={1}>
                      {it.destination}
                    </Text>
                    <Text className="font-inter text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                      {it.start_date} → {it.end_date}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View className="bg-white rounded-2xl p-4 shadow-md mb-6 flex-row justify-around">
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Calendar size={16} color="#FF9933" />
              <Text className="text-xs text-gray-500">Duration</Text>
            </View>
            <Text className="font-inter-bold text-lg text-gray-800">
              {currentItinerary.days.length} Days
            </Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Wallet size={16} color="#FF9933" />
              <Text className="text-xs text-gray-500">Budget</Text>
            </View>
            <Text className="font-inter-bold text-lg text-gray-800">
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

        {mode === 'view' ? (
          <>
            <Text className="font-inter-bold text-2xl text-gray-800 mb-4">
              Your Journey
            </Text>

            {currentItinerary.days.map((day) => (
              <View key={day.id} className="mb-6">
                <View className="bg-white rounded-t-2xl p-4 border-l-4 border-saffron-500">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-inter-bold text-lg text-gray-800">
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
                    <View key={activity.id || `activity-${day.id}-${actIndex}`}>
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
          </>
        ) : (
          <>
            <Text className="font-inter-bold text-2xl text-gray-800 mb-4">
              Edit in place
            </Text>

            {currentItinerary.days.map((day) => (
              <View key={day.id} className="mb-6">
                <View className="bg-white rounded-t-2xl p-4 border-l-4 border-saffron-500">
                  <Text className="font-inter-bold text-lg text-gray-800">
                    Day {day.day_number}: {day.title}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {new Date(day.date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                <View className="bg-white rounded-b-2xl shadow-lg">
                  {day.activities.map((activity, actIndex) => (
                    <View
                      key={activity.id || `activity-${day.id}-${actIndex}`}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      {editingActivity?.id === activity.id ? (
                        <View className="p-4 bg-gray-50">
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2 mb-2"
                            placeholder="Title"
                            value={editingActivity.title}
                            onChangeText={(text) =>
                              setEditingActivity({ ...editingActivity, title: text })
                            }
                          />
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2 mb-2"
                            placeholder="Description"
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
                              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="Start (HH:MM)"
                              value={editingActivity.time_start}
                              onChangeText={(text) =>
                                setEditingActivity({
                                  ...editingActivity,
                                  time_start: text,
                                })
                              }
                            />
                            <TextInput
                              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2"
                              placeholder="End (HH:MM)"
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
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2 mb-2"
                            placeholder="Location"
                            value={editingActivity.location}
                            onChangeText={(text) =>
                              setEditingActivity({ ...editingActivity, location: text })
                            }
                          />
                          <TextInput
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2 mb-3"
                            placeholder="Cost (₹)"
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
                              className="flex-1 bg-saffron-500 rounded-lg py-2"
                              onPress={() =>
                                handleUpdateActivity(activity.id, editingActivity)
                              }
                            >
                              <Text className="text-white text-center font-bold">
                                Save
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-1 bg-gray-300 rounded-lg py-2"
                              onPress={() => setEditingActivity(null)}
                            >
                              <Text className="text-gray-700 text-center font-bold">
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
                            <Text className="font-bold text-gray-800 mb-1">
                              {activity.title}
                            </Text>
                            <View className="flex-row items-center gap-3">
                              <Text className="text-xs text-gray-500">
                                {activity.time_start}–{activity.time_end}
                              </Text>
                              <Text className="text-xs text-gray-500" numberOfLines={1}>
                                {activity.location}
                              </Text>
                              <Text className="text-xs text-green-600 font-bold">
                                ₹{activity.cost}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteActivity(activity.id, day.id)}
                            className="p-2"
                          >
                            <Trash2 size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {showAddActivity && editingDay?.id === day.id ? (
                    <View className="p-4 bg-blue-50 border-t-2 border-blue-200">
                      <Text className="font-bold text-gray-800 mb-3">
                        Add New Activity
                      </Text>
                      <TextInput
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 mb-2"
                        placeholder="Activity title"
                        value={newActivity.title}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, title: text })
                        }
                      />
                      <TextInput
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 mb-2"
                        placeholder="Description"
                        value={newActivity.description}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, description: text })
                        }
                        multiline
                      />
                      <View className="flex-row gap-2 mb-2">
                        <TextInput
                          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Start (09:00)"
                          value={newActivity.time_start}
                          onChangeText={(text) =>
                            setNewActivity({ ...newActivity, time_start: text })
                          }
                        />
                        <TextInput
                          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="End (11:00)"
                          value={newActivity.time_end}
                          onChangeText={(text) =>
                            setNewActivity({ ...newActivity, time_end: text })
                          }
                        />
                      </View>
                      <TextInput
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 mb-2"
                        placeholder="Location"
                        value={newActivity.location}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, location: text })
                        }
                      />
                      <TextInput
                        className="bg-white border border-gray-300 rounded-lg px-3 py-2 mb-3"
                        placeholder="Cost (₹)"
                        value={newActivity.cost}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, cost: text })
                        }
                        keyboardType="number-pad"
                      />
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          className="flex-1 bg-saffron-500 rounded-lg py-2"
                          onPress={() => handleAddActivity(day.id)}
                        >
                          <Text className="text-white text-center font-bold">
                            Add Activity
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 bg-gray-300 rounded-lg py-2"
                          onPress={() => {
                            setShowAddActivity(false);
                            setEditingDay(null);
                          }}
                        >
                          <Text className="text-gray-700 text-center font-bold">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="p-4 flex-row items-center justify-center gap-2 border-t border-gray-100"
                      onPress={() => {
                        setShowAddActivity(true);
                        setEditingDay(day);
                      }}
                    >
                      <Plus size={18} color="#FF9933" />
                      <Text className="text-saffron-500 font-bold">
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
