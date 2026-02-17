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
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FF9933', '#FFA500']} className="pt-16 pb-10 px-6">
        <View className="flex-row items-center gap-3">
          <View className="w-14 h-14 bg-white/25 rounded-2xl items-center justify-center">
            <UserIcon size={26} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-black">Profile</Text>
            <Text className="text-white/90" numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 -mt-6 mb-6">
        <View className="bg-white rounded-3xl p-6 shadow-xl">
          <Text className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wide">
            Trips saved
          </Text>
          <Text className="text-4xl font-black text-gray-800">
            {itineraries.length}
          </Text>

          <TouchableOpacity
            className="mt-5 bg-saffron-500 rounded-2xl py-4 flex-row items-center justify-center gap-2"
            onPress={() => router.push('/(tabs)/itinerary')}
            activeOpacity={0.85}
          >
            <History size={20} color="#FFFFFF" />
            <Text className="text-white font-black text-base">Open Itineraries</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6 mb-10">
        <TouchableOpacity
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex-row items-center justify-center gap-3"
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="text-red-600 font-bold text-base">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
