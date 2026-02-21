import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { History, LogOut, User as UserIcon } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, reset, itineraries } = useStore();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          reset();
          router.replace('/auth');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#1A1C19' }}>
        <Text className="font-inter" style={{ color: '#F5F5DC' }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#1A1C19' }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#242922', '#1A1C19']} className="pt-16 pb-10 px-6">
        <View className="flex-row items-center gap-3">
          <View className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: 'rgba(76, 175, 80, 0.25)' }}>
            <UserIcon size={26} color="#4CAF50" />
          </View>
          <View className="flex-1">
            <Text className="font-inter-bold text-2xl" style={{ color: '#F5F5DC' }}>Profile</Text>
            <Text className="font-inter" numberOfLines={1} style={{ color: 'rgba(245, 245, 220, 0.9)' }}>
              {user.email}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-6 mb-6">
        <View className="rounded-3xl p-6 shadow-xl" style={{ backgroundColor: '#242922' }}>
          <Text className="font-inter-semibold text-xs mb-2 uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
            Trips saved
          </Text>
          <Text className="font-inter-bold text-4xl" style={{ color: '#F5F5DC' }}>
            {itineraries.length}
          </Text>

          <TouchableOpacity
            className="mt-5 rounded-2xl py-4 flex-row items-center justify-center gap-2"
            style={{ backgroundColor: '#4CAF50' }}
            onPress={() => router.push('/(tabs)/itinerary')}
            activeOpacity={0.85}
          >
            <History size={20} color="#1A1C19" />
            <Text className="font-inter-bold text-base" style={{ color: '#1A1C19' }}>Open Itineraries</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6 mb-10">
        <TouchableOpacity
          className="border-2 rounded-2xl p-4 flex-row items-center justify-center gap-3"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="font-inter-bold text-base" style={{ color: '#EF4444' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
