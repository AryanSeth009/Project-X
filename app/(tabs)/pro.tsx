import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';

export default function ProScreen() {
  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#1A1C19' }} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#242922', '#1A1C19']}
        className="pt-16 pb-10 px-6"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: 'rgba(243, 156, 18, 0.25)' }}>
            <Crown size={26} color="#F39C12" />
          </View>
          <View className="flex-1">
            <Text className="font-inter-bold text-2xl" style={{ color: '#F5F5DC' }}>Pro</Text>
            <Text className="font-inter" style={{ color: 'rgba(245, 245, 220, 0.9)' }}>
              Optional upgrades will live here.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 py-6">
        <View className="rounded-3xl p-6 shadow-md" style={{ backgroundColor: '#242922' }}>
          <Text className="font-inter-bold text-lg mb-2" style={{ color: '#F5F5DC' }}>
            Coming soon
          </Text>
          <Text className="font-inter leading-6" style={{ color: 'rgba(245, 245, 220, 0.8)' }}>
            Your Profile and Home are now subscription-free. Any future Pro
            features can be added on this screen without cluttering the rest of
            the app.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

