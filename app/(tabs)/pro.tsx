import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ProScreen() {
  const { colors } = useTheme();
  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[colors.backgroundSecondary, colors.background]}
        className="pt-16 pb-10 px-6"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: colors.orangeMuted }}>
            <Crown size={26} color={colors.orange} />
          </View>
          <View className="flex-1">
            <Text className="font-inter-bold text-2xl" style={{ color: colors.text }}>Pro</Text>
            <Text className="font-inter" style={{ color: colors.textSecondary }}>
              Optional upgrades will live here.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 py-6">
        <View className="rounded-3xl p-6 shadow-md" style={{ backgroundColor: colors.card }}>
          <Text className="font-inter-bold text-lg mb-2" style={{ color: colors.text }}>
            Coming soon
          </Text>
          <Text className="font-inter leading-6" style={{ color: colors.textSecondary }}>
            Your Profile and Home are now subscription-free. Any future Pro
            features can be added on this screen without cluttering the rest of
            the app.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

