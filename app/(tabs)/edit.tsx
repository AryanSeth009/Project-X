import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

const categoryOptions = ['attraction', 'food', 'transport', 'accommodation', 'activity'];

export default function EditScreen() {
  const { currentItinerary, setCurrentItinerary } = useStore();
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

  if (!currentItinerary) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-6xl mb-4">✏️</Text>
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          No Itinerary Selected
        </Text>
        <Text className="text-gray-500 text-center">
          Create an itinerary first to edit it
        </Text>
      </View>
    );
  }

  const handleAddActivity = async (dayId: string) => {
    if (!newActivity.title || !newActivity.time_start || !newActivity.time_end) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([
          {
            day_id: dayId,
            ...newActivity,
            cost: parseFloat(newActivity.cost) || 0,
            order_index: editingDay.activities.length,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const updatedDays = currentItinerary.days.map((day) =>
        day.id === dayId
          ? { ...day, activities: [...day.activities, data] }
          : day
      );

      setCurrentItinerary({
        ...currentItinerary,
        days: updatedDays,
      });

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

      Alert.alert('Success', 'Activity added successfully');
    } catch (error) {
      console.error('Error adding activity:', error);
      Alert.alert('Error', 'Failed to add activity');
    }
  };

  const handleDeleteActivity = async (activityId: string, dayId: string) => {
    Alert.alert('Delete Activity', 'Are you sure you want to delete this activity?', [
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

            const updatedDays = currentItinerary.days.map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    activities: day.activities.filter((a) => a.id !== activityId),
                  }
                : day
            );

            setCurrentItinerary({
              ...currentItinerary,
              days: updatedDays,
            });

            Alert.alert('Success', 'Activity deleted');
          } catch (error) {
            console.error('Error deleting activity:', error);
            Alert.alert('Error', 'Failed to delete activity');
          }
        },
      },
    ]);
  };

  const handleUpdateActivity = async (activityId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', activityId);

      if (error) throw error;

      const updatedDays = currentItinerary.days.map((day) => ({
        ...day,
        activities: day.activities.map((a) =>
          a.id === activityId ? { ...a, ...updates } : a
        ),
      }));

      setCurrentItinerary({
        ...currentItinerary,
        days: updatedDays,
      });

      setEditingActivity(null);
      Alert.alert('Success', 'Activity updated');
    } catch (error) {
      console.error('Error updating activity:', error);
      Alert.alert('Error', 'Failed to update activity');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#FF9933', '#FFA500']}
        className="pt-12 pb-6 px-6"
      >
        <Text className="text-white text-3xl font-bold mb-2">Edit Itinerary</Text>
        <Text className="text-white/90">
          Drag to reorder, tap to edit, swipe to delete
        </Text>
      </LinearGradient>

      <View className="px-6 py-6">
        {currentItinerary.days.map((day) => (
          <View key={day.id} className="mb-6">
            <View className="bg-white rounded-t-2xl p-4 border-l-4 border-saffron-500">
              <Text className="text-lg font-bold text-gray-800">
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
              {day.activities.map((activity, index) => (
                <View
                  key={activity.id}
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
                        value={editingActivity.cost.toString()}
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
                          <View className="flex-row items-center gap-1">
                            <Clock size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-500">
                              {activity.time_start}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <MapPin size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-500">
                              {activity.location}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Text className="text-xs text-green-600 font-bold">
                              ₹{activity.cost}
                            </Text>
                          </View>
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
                  <Text className="text-saffron-500 font-bold">Add Activity</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
