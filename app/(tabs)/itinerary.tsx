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
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Only use expo-blur on iOS; it causes "String cannot be cast to Boolean" on Android
const BlurView = Platform.OS === 'ios' ? require('expo-blur').BlurView : null;
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Calendar,
  Wallet,
  Clock,
  Download,
  Share2,
  Pencil,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  Navigation,
  ExternalLink,
  Users2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  X,
  Send,
  Bell,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<ItineraryListItem[]>([]);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const [editingDay, setEditingDay] = useState<any>(null);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    time_start: '',
    time_end: '',
    location: '',
    cost: '',
    category: 'activity' as const,
  });

  // ── Collaboration state ────────────────────────────────────────────────────
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [votes, setVotes] = useState<Record<string, { up: number; down: number; myVote: number }>>({});

  // ── Notification state ──────────────────────────────────────────────────────
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Collaboration helpers ─────────────────────────────────────────────────
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

  const loadCollaborators = async (itineraryId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('itinerary_collaborators')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('invited_at', { ascending: true });
    setCollaborators(data || []);
  };

  const loadVotesForItinerary = async (itineraryId: string) => {
    if (!supabase || !user) return;
    // Collect all activity ids
    const { data: days } = await supabase
      .from('itinerary_days')
      .select('id')
      .eq('itinerary_id', itineraryId);
    if (!days?.length) return;
    const dayIds = days.map((d: any) => d.id);
    const { data: acts } = await supabase
      .from('activities')
      .select('id')
      .in('day_id', dayIds);
    if (!acts?.length) return;
    const actIds = acts.map((a: any) => a.id);
    const { data: voteRows } = await supabase
      .from('activity_votes')
      .select('activity_id, vote, user_id')
      .in('activity_id', actIds);
    const map: Record<string, { up: number; down: number; myVote: number }> = {};
    for (const v of voteRows || []) {
      if (!map[v.activity_id]) map[v.activity_id] = { up: 0, down: 0, myVote: 0 };
      if (v.vote === 1) map[v.activity_id].up++;
      else map[v.activity_id].down++;
      if (v.user_id === user.id) map[v.activity_id].myVote = v.vote;
    }
    setVotes(map);
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !currentItinerary || !user) return;
    setInviteSending(true);
    try {
      const resp = await fetch(`${apiUrl}/api/itineraries/${currentItinerary.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: inviteEmail.trim(), role: 'viewer' }),
      });
      const json = await resp.json();
      if (json.success) {
        setInviteLink(json.inviteLink || '');
        setInviteEmail('');
        await loadCollaborators(currentItinerary.id);
        Alert.alert('Invite sent!', `${inviteEmail} has been invited.`);
      } else {
        Alert.alert('Error', json.error || 'Failed to send invite');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setInviteSending(false);
    }
  };

  const handleRemoveCollaborator = async (collabId: string) => {
    if (!currentItinerary || !user) return;
    Alert.alert('Remove', 'Remove this collaborator?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await fetch(`${apiUrl}/api/itineraries/${currentItinerary.id}/collaborators/${collabId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        await loadCollaborators(currentItinerary.id);
      }},
    ]);
  };

  const handleChangeRole = async (collabId: string, newRole: string) => {
    if (!currentItinerary || !user) return;
    await fetch(`${apiUrl}/api/itineraries/${currentItinerary.id}/collaborators/${collabId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, role: newRole }),
    });
    await loadCollaborators(currentItinerary.id);
  };

  const handleVote = async (activityId: string, vote: 1 | -1) => {
    if (!user) return;
    try {
      const resp = await fetch(`${apiUrl}/api/activities/${activityId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, vote }),
      });
      const json = await resp.json();
      if (json.success) {
        setVotes(prev => ({
          ...prev,
          [activityId]: {
            up: json.tally.up,
            down: json.tally.down,
            myVote: prev[activityId]?.myVote === vote ? 0 : vote,
          },
        }));
      }
    } catch (e) {
      // silent fail — votes are best-effort
    }
  };

  // ── Notification helpers ─────────────────────────────────────────────────
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const resp = await fetch(`${apiUrl}/api/notifications?userId=${user.id}`);
      const json = await resp.json();
      if (json.success) setNotifications(json.notifications || []);
    } catch (_) {}
  };

  const respondToNotification = async (notifId: string, action: 'accept' | 'decline') => {
    if (!user) return;
    try {
      const resp = await fetch(`${apiUrl}/api/notifications/${notifId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action }),
      });
      const json = await resp.json();
      if (json.success) {
        await loadNotifications();
        if (action === 'accept' && json.itineraryId) {
          setShowNotifModal(false);
          Alert.alert('🎉 Joined!', 'You have joined the itinerary.', [
            { text: 'View', onPress: () => loadItineraryById(json.itineraryId) },
            { text: 'OK' },
          ]);
        } else {
          Alert.alert('Done', 'Invite declined.');
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  // Poll notifications every 15s
  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

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
      // Load by id only — RLS allows if user is owner OR accepted collaborator
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('id', itineraryId)
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

  const handleDragEnd = async (dayId: string, newOrder: any[]) => {
    if (!currentItinerary) return;
    const activitiesWithOrder = newOrder.map((a, i) => ({ ...a, order_index: i }));
    try {
      await Promise.all(
        activitiesWithOrder.map((a) =>
          supabase.from('activities').update({ order_index: a.order_index }).eq('id', a.id)
        )
      );
      const updatedDays = currentItinerary.days.map((d) =>
        d.id === dayId ? { ...d, activities: activitiesWithOrder } : d
      );
      setCurrentItinerary({ ...currentItinerary, days: updatedDays });
    } catch (e) {
      console.error('Error reordering activities:', e);
      Alert.alert('Error', 'Failed to reorder activities.');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text className="font-inter" style={{ color: colors.text }}>Loading itinerary...</Text>
      </View>
    );
  }

  if (!currentItinerary) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Same top-right layout as when there is an itinerary — notification bell in same position */}
        <View className="pt-12 px-6 pb-2 flex-row items-center justify-end">
          <TouchableOpacity
            className="relative w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.card + 'CC' }}
            onPress={() => { setShowNotifModal(true); loadNotifications(); }}
          >
            <Bell size={20} color={unreadCount > 0 ? colors.orange : colors.textMuted} />
            {unreadCount > 0 && (
              <View
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.error }}
              >
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">📋</Text>
          <Text className="font-inter-bold text-2xl mb-2" style={{ color: colors.text }}>
            No Itinerary Yet
          </Text>
          <Text className="font-inter text-center" style={{ color: colors.textMuted }}>
            Create your first itinerary from the Home tab
          </Text>
          <TouchableOpacity
            className="mt-6 rounded-xl px-5 py-3"
            style={{ backgroundColor: colors.green }}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text className="font-inter-bold" style={{ color: colors.onGreen }}>Go to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications modal — same as when itinerary exists, so bell works from empty state */}
        <Modal
          visible={showNotifModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNotifModal(false)}
        >
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View className="rounded-t-3xl pt-4 pb-10 px-4" style={{ backgroundColor: colors.background, maxHeight: '80%' }}>
              <View className="w-10 h-1 rounded-full self-center mb-4" style={{ backgroundColor: '#333' }} />
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold" style={{ color: colors.text }}>Notifications</Text>
                <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                  <X size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <View className="items-center py-12">
                    <Bell size={40} color="#333" />
                    <Text className="mt-3 text-sm" style={{ color: colors.textMuted }}>No notifications yet</Text>
                  </View>
                ) : (
                  notifications.map((notif) => (
                    <View
                      key={notif.id}
                      className="rounded-2xl p-4 mb-3"
                      style={{
                        backgroundColor: notif.is_read ? colors.card + '80' : colors.orangeMuted,
                        borderWidth: notif.is_read ? 0 : 1,
                        borderColor: colors.orangeBorder,
                      }}
                    >
                      <View className="flex-row items-start gap-3">
                        <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.orangeMuted }}>
                          <Bell size={18} color={colors.orange} />
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-sm mb-0.5" style={{ color: colors.text }}>{notif.title}</Text>
                          <Text className="text-xs leading-4 mb-3" style={{ color: colors.textMuted }}>{notif.body}</Text>
                          {notif.type === 'collab_invite' && !notif.is_read && (
                            <View className="flex-row gap-2">
                              <TouchableOpacity
                                className="flex-1 py-2 rounded-xl items-center"
                                style={{ backgroundColor: colors.greenMuted }}
                                onPress={() => respondToNotification(notif.id, 'accept')}
                              >
                                <View className="flex-row items-center gap-1">
                                  <CheckCircle size={14} color={colors.green} />
                                  <Text className="text-xs font-bold" style={{ color: colors.green }}>Accept</Text>
                                </View>
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="flex-1 py-2 rounded-xl items-center"
                                style={{ backgroundColor: colors.errorMuted }}
                                onPress={() => respondToNotification(notif.id, 'decline')}
                              >
                                <View className="flex-row items-center gap-1">
                                  <XCircle size={14} color={colors.error} />
                                  <Text className="text-xs font-bold" style={{ color: colors.error }}>Decline</Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          )}
                          {notif.is_read && (
                            <Text className="text-xs" style={{ color: colors.green }}>✓ Responded</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[colors.backgroundSecondary, colors.background]}
        className="pt-12 pb-6 px-6"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-inter-bold text-3xl mb-2" style={{ color: colors.text }}>
              {currentItinerary.title}
            </Text>
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color={colors.green} />
              <Text className="font-inter-medium text-lg" style={{ color: colors.textSecondary }}>
                {currentItinerary.destination}
              </Text>
            </View>
            {aiProviderLabel && (
              <View className="mt-2 self-start rounded-full px-3 py-1" style={{ backgroundColor: colors.greenMuted }}>
                <Text className="font-inter text-xs" style={{ color: colors.text }}>{aiProviderLabel}</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            {/* Collab icon with collaborator count badge */}
            <TouchableOpacity
              className="relative w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.card + 'CC' }}
              onPress={() => {
                if (currentItinerary) loadCollaborators(currentItinerary.id);
                setShowCollabModal(true);
              }}
            >
              <Users2 size={20} color={colors.green} />
              {collaborators.filter(c => c.status === 'accepted').length > 0 && (
                <View
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.green }}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.onGreen, fontSize: 9 }}>
                    {collaborators.filter(c => c.status === 'accepted').length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* 🔔 Notification bell with unread badge */}
            <TouchableOpacity
              className="relative w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.card + 'CC' }}
              onPress={() => { setShowNotifModal(true); loadNotifications(); }}
            >
              <Bell size={20} color={unreadCount > 0 ? colors.orange : colors.textMuted} />
              {unreadCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.error }}
                >
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </LinearGradient>

      {/* ── Collaborator Bottom Sheet Modal ─────────────────────────────── */}
      <Modal
        visible={showCollabModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCollabModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View className="rounded-t-3xl" style={{ backgroundColor: colors.card, maxHeight: '85%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
              <View className="flex-row items-center gap-2">
                <Users2 size={22} color={colors.green} />
                <Text className="font-inter-bold text-xl" style={{ color: colors.text }}>Collaborators</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCollabModal(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="px-6">
              {/* Current collaborators */}
              {collaborators.length === 0 ? (
                <Text className="text-center py-4 font-inter" style={{ color: colors.textMuted }}>
                  No collaborators yet. Invite someone below!
                </Text>
              ) : (
                collaborators.map((c) => (
                  <View
                    key={c.id}
                    className="flex-row items-center justify-between py-3 border-b"
                    style={{ borderColor: colors.divider }}
                  >
                    {/* Avatar + info */}
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: c.status === 'accepted' ? colors.greenMuted : colors.textMuted + '33' }}
                      >
                        <Text className="font-inter-bold" style={{ color: c.status === 'accepted' ? colors.green : colors.textMuted }}>
                          {c.email?.[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View>
                        <Text className="font-inter-medium" style={{ color: colors.text }} numberOfLines={1}>
                          {c.email}
                        </Text>
                        <View
                          className="self-start px-2 py-0.5 rounded-full mt-0.5"
                          style={{ backgroundColor: c.status === 'pending' ? colors.orangeMuted : colors.greenMuted }}
                        >
                          <Text className="text-xs" style={{ color: c.status === 'pending' ? colors.orange : colors.green }}>
                            {c.status === 'pending' ? 'Pending' : c.role === 'editor' ? 'Editor' : 'Viewer'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Owner controls */}
                    {currentItinerary?.user_id === user?.id && (
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          className="px-2 py-1 rounded-lg"
                          style={{ backgroundColor: colors.greenMuted }}
                          onPress={() => handleChangeRole(c.id, c.role === 'editor' ? 'viewer' : 'editor')}
                        >
                          <Text className="text-xs font-bold" style={{ color: colors.green }}>
                            {c.role === 'editor' ? '→ Viewer' : '→ Editor'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemoveCollaborator(c.id)}>
                          <X size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}

              {/* Invite section */}
              <View className="mt-6 mb-4">
                <Text className="font-inter-bold mb-3" style={{ color: colors.text }}>Invite by email</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 rounded-xl px-4 py-3 font-inter"
                    style={{ backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border }}
                    placeholder="friend@example.com"
                    placeholderTextColor={colors.textMuted}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    className="rounded-xl px-4 items-center justify-center"
                    style={{ backgroundColor: inviteSending ? colors.border : colors.green }}
                    onPress={sendInvite}
                    disabled={inviteSending}
                  >
                    <Send size={18} color={colors.onGreen} />
                  </TouchableOpacity>
                </View>

                {/* Copy invite link */}
                {inviteLink ? (
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 mt-3 py-3 rounded-xl border"
                    style={{ borderColor: colors.green }}
                    onPress={() => { Clipboard.setStringAsync(inviteLink); Alert.alert('Copied!', 'Invite link copied to clipboard.'); }}
                  >
                    <Copy size={16} color={colors.green} />
                    <Text className="font-inter-medium" style={{ color: colors.green }}>Copy Invite Link</Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-xs mt-2 text-center" style={{ color: colors.textMuted }}>
                    Send an invite to get a shareable link — works for new users too
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View className="px-6 py-4">
        {/* History picker */}
        <View className="mb-6">
          <Text className="font-inter-bold text-sm mb-3" style={{ color: colors.text }}>History</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {(history.length ? history : (itineraries as any)).slice(0, 20).map((it: any) => {
                const isActive = it.id === currentItinerary?.id;
                const coverUri = isActive && currentItinerary?.days?.[0]?.activities?.[0]?.image_url
                  ? currentItinerary.days[0].activities[0].image_url
                  : `https://picsum.photos/seed/${encodeURIComponent(it.id)}/800/600`;
                return (
                  <View key={it.id} className="mr-4">
                    <TouchableOpacity
                      className="w-64 h-40 rounded-3xl overflow-hidden shadow-lg border-2"
                      style={{ borderColor: isActive ? colors.green : 'transparent' }}
                      onPress={() => loadItineraryById(it.id)}
                      disabled={loadingHistory}
                    >
                      <Image
                        source={{ uri: coverUri }}
                        style={{ position: 'absolute', width: 256, height: 160 }}
                        resizeMode="cover"
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
                            <Trash2 size={14} color={colors.error} />
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

        <View className="rounded-2xl p-4 shadow-md mb-6 flex-row justify-around" style={{ backgroundColor: colors.card }}>
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Calendar size={16} color={colors.orange} />
              <Text className="text-xs" style={{ color: colors.textMuted }}>Duration</Text>
            </View>
            <Text className="font-inter-bold text-lg" style={{ color: colors.text }}>
              {(currentItinerary as any).title?.toLowerCase().includes('top 10') ? 'Top 10' : `${currentItinerary.days.length} Days`}
            </Text>
          </View>
          <View className="w-px" style={{ backgroundColor: colors.background }} />
          <View className="items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Wallet size={16} color={colors.orange} />
              <Text className="text-xs" style={{ color: colors.textMuted }}>Budget</Text>
            </View>
            <Text className="font-inter-bold text-lg" style={{ color: colors.text }}>
              ₹{currentItinerary.budget.toLocaleString()}
            </Text>
          </View>
        </View>

        {(currentItinerary as any).preferences?.costBreakdown && (
          <View className="rounded-2xl p-5 shadow-md mb-6" style={{ backgroundColor: colors.card }}>
            <Text className="font-inter-semibold text-xs uppercase tracking-wide mb-2" style={{ color: colors.textMuted }}>
              Estimated total cost
            </Text>
            <View className="flex-row items-baseline justify-between mb-4">
              <Text className="font-inter-bold text-2xl" style={{ color: colors.text }}>
                ₹{((currentItinerary as any).preferences.costBreakdown.total || 0).toLocaleString()}
                <Text className="font-inter-medium text-base ml-1" style={{ color: colors.textMuted }}>
                  / {(currentItinerary as any).preferences.costBreakdown.daysCount || currentItinerary.days.length} days
                </Text>
              </Text>
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.greenMuted }}>
                <Wallet size={20} color={colors.green} />
              </View>
            </View>
            <View className="h-px mb-4" style={{ backgroundColor: colors.divider }} />
            <View className="flex-row justify-between">
              <View>
                <Text className="font-inter text-sm mb-0.5" style={{ color: colors.textMuted }}>Flights & Trains</Text>
                <Text className="font-inter-bold text-lg" style={{ color: colors.text }}>
                  ₹{((currentItinerary as any).preferences.costBreakdown.flightsTrains || 0).toLocaleString()}
                </Text>
                {(currentItinerary as any).preferences.costBreakdown.trainClass && (
                  <Text className="font-inter text-xs mt-0.5" style={{ color: colors.textMuted }}>
                    ({(currentItinerary as any).preferences.costBreakdown.trainClass} estimated)
                  </Text>
                )}
              </View>
              <View className="items-end">
                <Text className="font-inter text-sm mb-0.5" style={{ color: colors.textMuted }}>Stay & Food</Text>
                <Text className="font-inter-bold text-lg" style={{ color: colors.text }}>
                  ₹{((currentItinerary as any).preferences.costBreakdown.stayFood || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-1 rounded-xl py-3 flex-row items-center justify-center gap-2"
            style={{ backgroundColor: colors.green }}
            onPress={handleShare}
          >
            <Share2 size={18} color={colors.onGreen} />
            <Text className="font-bold" style={{ color: colors.onGreen }}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 border-2 rounded-xl py-3 flex-row items-center justify-center gap-2" style={{ backgroundColor: colors.card, borderColor: colors.green }}>
            <Download size={18} color={colors.orange} />
            <Text className="font-bold" style={{ color: colors.green }}>PDF</Text>
          </TouchableOpacity>
        </View>

        {mode === 'view' ? (
          <>
            <Text className="font-inter-bold text-2xl mb-4" style={{ color: colors.text }}>
              Your Journey
            </Text>

            {currentItinerary.days.map((day) => (
              <View key={day.id} className="mb-6">
                <View className="rounded-t-2xl p-4 border-l-4" style={{ backgroundColor: colors.card, borderLeftColor: colors.green }}>
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="font-inter-bold text-lg" style={{ color: colors.text }}>
                        {(currentItinerary as any).title?.toLowerCase().includes('top 10') ? 'Top Recommended Spots' : `Day ${day.day_number}`}
                      </Text>
                      <TouchableOpacity
                        className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ backgroundColor: colors.greenMuted }}
                        onPress={() => { setEditingDay(day); setMode('edit'); }}
                      >
                        <Pencil size={12} color={colors.green} />
                        <Text className="font-inter-bold text-xs" style={{ color: colors.green }}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="text-sm" style={{ color: colors.textMuted }}>
                      {new Date(day.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary }}>{day.title}</Text>
                </View>

                <View className="rounded-b-2xl px-4 pb-4 shadow-lg" style={{ backgroundColor: colors.card }}>
                  {day.activities.map((activity, actIndex) => (
                    <View key={activity.id || `activity-${day.id}-${actIndex}`}>
                      <TouchableOpacity
                        className="flex-row gap-3 py-4"
                        onPress={() => {
                          setSelectedActivity(activity);
                          setShowDetailModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        {/* Category icon with connector line */}
                        <View className="items-center">
                          <View
                            className={`w-12 h-12 rounded-full items-center justify-center ${categoryColors[activity.category]}`}
                          >
                            <Text className="text-2xl">{categoryIcons[activity.category]}</Text>
                          </View>
                          {actIndex < day.activities.length - 1 && (
                            <View className="w-0.5 flex-1 mt-2" style={{ backgroundColor: colors.divider }} />
                          )}
                        </View>

                        <View className="flex-1">
                          <View className="flex-row items-start justify-between mb-2">
                            <View className="flex-1">
                              <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                                {activity.title}
                              </Text>
                              <View className="flex-row items-center gap-1 mb-1">
                                <Clock size={12} color={colors.textMuted} />
                                <Text className="text-xs" style={{ color: colors.textMuted }}>
                                  {activity.time_start} - {activity.time_end}
                                </Text>
                              </View>
                              <View className="flex-row items-center gap-1">
                                <MapPin size={12} color={colors.textMuted} />
                                <Text className="text-xs" numberOfLines={1} style={{ color: colors.textMuted }}>
                                  {activity.location}
                                </Text>
                              </View>
                            </View>
                            {/* Time badge */}
                            <View className="px-3 py-1 rounded-full flex-row items-center gap-1" style={{ backgroundColor: colors.orangeMuted }}>
                              <Clock size={11} color={colors.orange} />
                              <Text className="font-bold text-xs" style={{ color: colors.orange }}>
                                {activity.time_start}–{activity.time_end}
                              </Text>
                            </View>
                            <View className="ml-2 self-center">
                              <ChevronRight size={18} color={colors.textMuted} />
                            </View>
                          </View>

                          {activity.image_url && (
                            <TouchableOpacity
                              onPress={(e) => { e.stopPropagation(); setFullImageUri(activity.image_url ?? null); }}
                              activeOpacity={0.85}
                            >
                              <Image
                                source={{ uri: activity.image_url }}
                                className="w-full h-40 rounded-xl mb-2"
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          )}

                          <Text className="text-sm leading-5" numberOfLines={2} style={{ color: colors.textSecondary }}>
                            {activity.description}
                          </Text>

                          {/* Vote buttons */}
                          <View className="flex-row gap-3 mt-3">
                            <TouchableOpacity
                              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
                              style={{ backgroundColor: votes[activity.id]?.myVote === 1 ? colors.greenMuted : colors.textMuted + '18' }}
                              onPress={(e) => { e.stopPropagation(); handleVote(activity.id, 1); }}
                            >
                              <ThumbsUp size={13} color={votes[activity.id]?.myVote === 1 ? colors.green : colors.textMuted} />
                              <Text className="text-xs font-bold" style={{ color: votes[activity.id]?.myVote === 1 ? colors.green : colors.textMuted }}>
                                {votes[activity.id]?.up || 0}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
                              style={{ backgroundColor: votes[activity.id]?.myVote === -1 ? colors.errorMuted : colors.textMuted + '18' }}
                              onPress={(e) => { e.stopPropagation(); handleVote(activity.id, -1); }}
                            >
                              <ThumbsDown size={13} color={votes[activity.id]?.myVote === -1 ? colors.error : colors.textMuted} />
                              <Text className="text-xs font-bold" style={{ color: votes[activity.id]?.myVote === -1 ? colors.error : colors.textMuted }}>
                                {votes[activity.id]?.down || 0}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                      {actIndex < day.activities.length - 1 && (
                        <View className="h-px" style={{ backgroundColor: colors.divider }} />
                      )}
                    </View>
                  ))}
                </View>

              </View>
            ))}

            {/* 🔔 Notification Panel Modal */}
            <Modal
              visible={showNotifModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowNotifModal(false)}
            >
              <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <View className="rounded-t-3xl pt-4 pb-10 px-4" style={{ backgroundColor: colors.background, maxHeight: '80%' }}>
                  {/* Handle bar */}
                  <View className="w-10 h-1 rounded-full self-center mb-4" style={{ backgroundColor: '#333' }} />

                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold" style={{ color: colors.text }}>Notifications</Text>
                    <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                      <X size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {notifications.length === 0 ? (
                      <View className="items-center py-12">
                        <Bell size={40} color="#333" />
                        <Text className="mt-3 text-sm" style={{ color: colors.textMuted }}>No notifications yet</Text>
                      </View>
                    ) : (
                      notifications.map((notif) => (
                        <View
                          key={notif.id}
                          className="rounded-2xl p-4 mb-3"
                          style={{
                            backgroundColor: notif.is_read ? colors.card + '80' : colors.orangeMuted,
                            borderWidth: notif.is_read ? 0 : 1,
                            borderColor: colors.orangeBorder,
                          }}
                        >
                          <View className="flex-row items-start gap-3">
                            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.orangeMuted }}>
                              <Bell size={18} color={colors.orange} />
                            </View>
                            <View className="flex-1">
                              <Text className="font-bold text-sm mb-0.5" style={{ color: colors.text }}>{notif.title}</Text>
                              <Text className="text-xs leading-4 mb-3" style={{ color: colors.textMuted }}>{notif.body}</Text>

                              {notif.type === 'collab_invite' && !notif.is_read && (
                                <View className="flex-row gap-2">
                                  <TouchableOpacity
                                    className="flex-1 py-2 rounded-xl items-center"
                                    style={{ backgroundColor: colors.greenMuted }}
                                    onPress={() => respondToNotification(notif.id, 'accept')}
                                  >
                                    <View className="flex-row items-center gap-1">
                                      <CheckCircle size={14} color={colors.green} />
                                      <Text className="text-xs font-bold" style={{ color: colors.green }}>Accept</Text>
                                    </View>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    className="flex-1 py-2 rounded-xl items-center"
                                    style={{ backgroundColor: colors.errorMuted }}
                                    onPress={() => respondToNotification(notif.id, 'decline')}
                                  >
                                    <View className="flex-row items-center gap-1">
                                      <XCircle size={14} color={colors.error} />
                                      <Text className="text-xs font-bold" style={{ color: colors.error }}>Decline</Text>
                                    </View>
                                  </TouchableOpacity>
                                </View>
                              )}

                              {notif.is_read && (
                                <Text className="text-xs" style={{ color: colors.green }}>✓ Responded</Text>
                              )}
                            </View>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* Full-screen image modal (tap thumbnail to open) */}
            <Modal
              visible={!!fullImageUri}
              transparent
              animationType="fade"
              onRequestClose={() => setFullImageUri(null)}
            >
              <TouchableOpacity
                className="flex-1 bg-black items-center justify-center"
                activeOpacity={1}
                onPress={() => setFullImageUri(null)}
              >
                {fullImageUri ? (
                  <Image
                    source={{ uri: fullImageUri }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                ) : null}
                <TouchableOpacity
                  className="absolute top-12 right-6 w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                  onPress={() => setFullImageUri(null)}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>

            {/* Activity Detail Modal */}
            <Modal
              visible={showDetailModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDetailModal(false)}
            >
              <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <View className="h-[90%] rounded-t-[40px] overflow-hidden" style={{ backgroundColor: colors.card }}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header Image — software-rendered to avoid hardware bitmap crash with BlurView on iOS */}
                    <View className="h-80 w-full relative" renderToHardwareTextureAndroid={false}>
                      <Image
                        source={{ uri: selectedActivity?.image_url || `https://source.unsplash.com/800x600/?${encodeURIComponent(selectedActivity?.title || 'travel')}` }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      {BlurView ? (
                        <BlurView intensity={30} className="absolute top-12 left-6 rounded-full overflow-hidden">
                          <TouchableOpacity 
                            onPress={() => setShowDetailModal(false)}
                            className="w-12 h-12 items-center justify-center"
                          >
                            <ChevronRight size={24} color={colors.text} style={{ transform: [{rotate: '180deg'}] }} />
                          </TouchableOpacity>
                        </BlurView>
                      ) : (
                        <TouchableOpacity 
                          onPress={() => setShowDetailModal(false)}
                          className="absolute top-12 left-6 w-12 h-12 rounded-full overflow-hidden items-center justify-center"
                          style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
                        >
                          <ChevronRight size={24} color={colors.text} style={{ transform: [{rotate: '180deg'}] }} />
                        </TouchableOpacity>
                      )}

                      <LinearGradient
                        colors={['transparent', colors.card]}
                        className="absolute bottom-0 left-0 right-0 h-24"
                      />
                    </View>

                    {/* Content */}
                    <View className="px-8 pb-12">
                      <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-1 mr-4">
                          <Text className="font-inter-bold text-3xl mb-2" style={{ color: colors.text }}>
                            {selectedActivity?.title}
                          </Text>
                          <View className="flex-row items-center gap-2">
                            <MapPin size={16} color={colors.orange} />
                            <Text className="font-inter-medium" style={{ color: colors.textMuted }}>
                              {selectedActivity?.location}
                            </Text>
                          </View>
                        </View>
                        <View className="px-4 py-2 rounded-2xl" style={{ backgroundColor: colors.background }}>
                          <Text className="font-inter-bold" style={{ color: colors.green }}>
                            ₹{selectedActivity?.cost}
                          </Text>
                        </View>
                      </View>

                      {/* Stats */}
                      <View className="flex-row gap-4 mb-8">
                        <View className="px-4 py-3 rounded-2xl flex-row items-center gap-2" style={{ backgroundColor: colors.background }}>
                          <Clock size={16} color={colors.textMuted} />
                          <Text className="font-inter-medium" style={{ color: colors.text }}>
                            {selectedActivity?.time_start} - {selectedActivity?.time_end}
                          </Text>
                        </View>
                        <View className="px-4 py-3 rounded-2xl flex-row items-center gap-2" style={{ backgroundColor: colors.background }}>
                          <Text className="text-lg">{categoryIcons[selectedActivity?.category]}</Text>
                          <Text className="font-inter-medium" style={{ color: colors.text }}>
                            {selectedActivity?.category?.charAt(0).toUpperCase() + selectedActivity?.category?.slice(1)}
                          </Text>
                        </View>
                      </View>

                      {/* Description */}
                      <Text className="font-inter-bold text-xl mb-3" style={{ color: colors.text }}>About</Text>
                      <Text className="font-inter leading-7 text-lg mb-10" style={{ color: colors.textSecondary }}>
                        {selectedActivity?.description}
                      </Text>

                      {/* Map Button */}
                      <TouchableOpacity
                        onPress={() => openInMaps(selectedActivity?.location || selectedActivity?.title)}
                        className="h-16 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg"
                        style={{ backgroundColor: colors.green }}
                      >
                        <Navigation size={22} color={colors.onGreen} />
                        <Text className="font-inter-bold text-lg" style={{ color: colors.onGreen }}>Open in Maps</Text>
                        <ExternalLink size={18} color={colors.onGreen} />
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </>
        ) : (
          <>
            <Text className="font-inter-bold text-2xl mb-4" style={{ color: colors.text }}>
              Edit in place
            </Text>

            {currentItinerary.days.map((day) => (
              <View key={day.id} className="mb-6">
                <View className="rounded-t-2xl p-4 border-l-4" style={{ backgroundColor: colors.card, borderLeftColor: colors.green }}>
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-1">
                      <Text className="font-inter-bold text-lg" style={{ color: colors.text }}>
                        Day {day.day_number}: {day.title}
                      </Text>
                      <Text className="text-sm" style={{ color: colors.textMuted }}>
                        {new Date(day.date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    {/* Done only on the day that was edited (the one that triggered edit mode) */}
                    {mode === 'edit' && editingDay?.id === day.id && (
                      <TouchableOpacity
                        className="px-3 py-2 rounded-xl flex-row items-center gap-2"
                        style={{ backgroundColor: colors.greenMuted }}
                        onPress={() => { setMode('view'); setEditingDay(null); setShowAddActivity(false); setEditingActivity(null); }}
                      >
                        <CheckCircle size={16} color={colors.green} />
                        <Text className="font-inter-bold" style={{ color: colors.green }}>Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View className="rounded-b-2xl shadow-lg overflow-hidden" style={{ backgroundColor: colors.card }}>
                  <DraggableFlatList
                    data={[...day.activities].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))}
                    keyExtractor={(item) => item.id}
                    onDragEnd={({ data }) => handleDragEnd(day.id, data)}
                    renderItem={({ item: activity, drag, isActive }) => (
                      <View
                        className="border-b last:border-b-0"
                        style={{ borderColor: colors.divider, backgroundColor: isActive ? colors.greenMuted : undefined }}
                      >
                        {editingActivity?.id === activity.id ? (
                          <View className="p-5" style={{ backgroundColor: colors.background }}>
                            <TextInput
                              className="rounded-lg px-3 py-2 mb-2"
                              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                              placeholder="Title"
                              placeholderTextColor={colors.textMuted}
                              value={editingActivity.title}
                              onChangeText={(text) =>
                                setEditingActivity({ ...editingActivity, title: text })
                              }
                            />
                            <TextInput
                              className="rounded-lg px-3 py-2 mb-2"
                              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                              placeholder="Description"
                              placeholderTextColor={colors.textMuted}
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
                                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                                placeholder="Start (HH:MM)"
                                placeholderTextColor={colors.textMuted}
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
                                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                                placeholder="End (HH:MM)"
                                placeholderTextColor={colors.textMuted}
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
                              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                              placeholder="Location"
                              placeholderTextColor={colors.textMuted}
                              value={editingActivity.location}
                              onChangeText={(text) =>
                                setEditingActivity({ ...editingActivity, location: text })
                              }
                            />
                            <TextInput
                              className="rounded-lg px-3 py-2 mb-3"
                              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                              placeholder="Cost (₹)"
                              placeholderTextColor={colors.textMuted}
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
                                style={{ backgroundColor: colors.green }}
                                onPress={() =>
                                  handleUpdateActivity(activity.id, editingActivity)
                                }
                              >
                                <Text className="text-center font-bold" style={{ color: colors.onGreen }}>
                                  Save
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="flex-1 rounded-lg py-2"
                                style={{ backgroundColor: colors.card }}
                                onPress={() => setEditingActivity(null)}
                              >
                                <Text className="text-center font-bold" style={{ color: colors.text }}>
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            className="px-5 py-4 flex-row items-center gap-3"
                            onPress={() => setEditingActivity(activity)}
                            style={{ minHeight: 64 }}
                          >
                            <TouchableOpacity
                              onLongPress={drag}
                              className="p-2 -m-2"
                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                              <GripVertical size={22} color={colors.textMuted} />
                            </TouchableOpacity>
                            <View className="flex-1 min-w-0">
                              <Text className="font-bold mb-1" style={{ color: colors.text }}>
                                {activity.title}
                              </Text>
                              <View className="flex-row items-center gap-3 flex-wrap">
                                <Text className="text-xs" style={{ color: colors.textMuted }}>
                                  {activity.time_start}–{activity.time_end}
                                </Text>
                                <Text className="text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                                  {activity.location}
                                </Text>
                                <Text className="text-xs font-bold" style={{ color: colors.green }}>
                                  ₹{activity.cost}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleDeleteActivity(activity.id, day.id)}
                              className="p-2"
                            >
                              <Trash2 size={18} color={colors.error} />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  />

                  {showAddActivity && editingDay?.id === day.id ? (
                    <View className="p-4 border-t-2" style={{ backgroundColor: colors.greenMuted, borderColor: colors.greenBorder }}>
                      <Text className="font-bold mb-3" style={{ color: colors.text }}>
                        Add New Activity
                      </Text>
                      <TextInput
                        className="rounded-lg px-3 py-2 mb-2"
                        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                        placeholder="Activity title"
                        placeholderTextColor={colors.textMuted}
                        value={newActivity.title}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, title: text })
                        }
                      />
                      <TextInput
                        className="rounded-lg px-3 py-2 mb-2"
                        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                        placeholder="Description"
                        placeholderTextColor={colors.textMuted}
                        value={newActivity.description}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, description: text })
                        }
                        multiline
                      />
                      <View className="flex-row gap-2 mb-2">
                        <TextInput
                          className="flex-1 rounded-lg px-3 py-2"
                          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                          placeholder="Start (09:00)"
                          placeholderTextColor={colors.textMuted}
                          value={newActivity.time_start}
                          onChangeText={(text) =>
                            setNewActivity({ ...newActivity, time_start: text })
                          }
                        />
                        <TextInput
                          className="flex-1 rounded-lg px-3 py-2"
                          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                          placeholder="End (11:00)"
                          placeholderTextColor={colors.textMuted}
                          value={newActivity.time_end}
                          onChangeText={(text) =>
                            setNewActivity({ ...newActivity, time_end: text })
                          }
                        />
                      </View>
                      <TextInput
                        className="rounded-lg px-3 py-2 mb-2"
                        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                        placeholder="Location"
                        placeholderTextColor={colors.textMuted}
                        value={newActivity.location}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, location: text })
                        }
                      />
                      <TextInput
                        className="rounded-lg px-3 py-2 mb-3"
                        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                        placeholder="Cost (₹)"
                        placeholderTextColor={colors.textMuted}
                        value={newActivity.cost}
                        onChangeText={(text) =>
                          setNewActivity({ ...newActivity, cost: text })
                        }
                        keyboardType="number-pad"
                      />
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          className="flex-1 rounded-lg py-2"
                          style={{ backgroundColor: colors.green }}
                          onPress={() => handleAddActivity(day.id)}
                        >
                          <Text className="text-center font-bold" style={{ color: colors.onGreen }}>
                            Add Activity
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 rounded-lg py-2"
                          style={{ backgroundColor: colors.card }}
                          onPress={() => {
                            setShowAddActivity(false);
                            setEditingDay(null);
                          }}
                        >
                          <Text className="text-center font-bold" style={{ color: colors.text }}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="p-4 flex-row items-center justify-center gap-2 border-t"
                      style={{ borderColor: colors.divider }}
                      onPress={() => {
                        setShowAddActivity(true);
                        setEditingDay(day);
                      }}
                    >
                      <Plus size={18} color={colors.orange} />
                      <Text className="font-bold" style={{ color: colors.green }}>
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
