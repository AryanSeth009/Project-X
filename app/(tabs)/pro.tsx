import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';

export default function ProScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#FF9933', '#FFA500']}
        className="pt-16 pb-10 px-6"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 bg-white/25 rounded-2xl items-center justify-center">
            <Crown size={26} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="font-inter-bold text-white text-2xl">Pro</Text>
            <Text className="font-inter text-white/90">
              Optional upgrades will live here.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 py-6">
        <View className="bg-white rounded-3xl p-6 shadow-md">
          <Text className="font-inter-bold text-gray-800 text-lg mb-2">
            Coming soon
          </Text>
          <Text className="font-inter text-gray-600 leading-6">
            Your Profile and Home are now subscription-free. Any future Pro
            features can be added on this screen without cluttering the rest of
            the app.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

