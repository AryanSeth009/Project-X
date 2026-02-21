import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { History, LogOut, User as UserIcon, Sun, Moon, Smartphone } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeMode } from '@/context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, reset, itineraries } = useStore();
  const { colors, mode, setMode } = useTheme();

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
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text className="font-inter" style={{ color: colors.text }}>Loading profile...</Text>
      </View>
    );
  }

  const appearanceOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'system', label: 'System', icon: Smartphone },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[colors.backgroundSecondary, colors.background]} className="pt-16 pb-10 px-6">
        <View className="flex-row items-center gap-3">
          <View className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: colors.greenMuted }}>
            <UserIcon size={26} color={colors.green} />
          </View>
          <View className="flex-1">
            <Text className="font-inter-bold text-2xl" style={{ color: colors.text }}>Profile</Text>
            <Text className="font-inter" numberOfLines={1} style={{ color: colors.textSecondary }}>
              {user.email}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Appearance Settings */}
      <View className="px-6 mb-6">
        <View className="rounded-3xl p-6 shadow-xl" style={{ backgroundColor: colors.card }}>
          <Text className="font-inter-semibold text-xs mb-3 uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Appearance
          </Text>
          <View className="flex-row gap-3">
            {appearanceOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = mode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setMode(opt.value)}
                  className="flex-1 rounded-2xl p-4 items-center gap-2 border-2"
                  style={{
                    backgroundColor: isActive ? colors.greenMuted : colors.inputBg,
                    borderColor: isActive ? colors.green : colors.border,
                  }}
                  activeOpacity={0.85}
                >
                  <Icon size={22} color={isActive ? colors.green : colors.textMuted} />
                  <Text className="font-inter-semibold text-sm" style={{ color: isActive ? colors.green : colors.textMuted }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View className="px-6 mb-6">
        <View className="rounded-3xl p-6 shadow-xl" style={{ backgroundColor: colors.card }}>
          <Text className="font-inter-semibold text-xs mb-2 uppercase tracking-wide" style={{ color: colors.textMuted }}>
            Trips saved
          </Text>
          <Text className="font-inter-bold text-4xl" style={{ color: colors.text }}>
            {itineraries.length}
          </Text>

          <TouchableOpacity
            className="mt-5 rounded-2xl py-4 flex-row items-center justify-center gap-2"
            style={{ backgroundColor: colors.green }}
            onPress={() => router.push('/(tabs)/itinerary')}
            activeOpacity={0.85}
          >
            <History size={20} color={colors.onGreen} />
            <Text className="font-inter-bold text-base" style={{ color: colors.onGreen }}>Open Itineraries</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6 mb-10">
        <TouchableOpacity
          className="border-2 rounded-2xl p-4 flex-row items-center justify-center gap-3"
          style={{ backgroundColor: colors.errorMuted, borderColor: colors.errorBorder }}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <LogOut size={20} color={colors.error} />
          <Text className="font-inter-bold text-base" style={{ color: colors.error }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
