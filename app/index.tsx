import { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/store/useStore';

export default function SplashScreen() {
  const router = useRouter();
  const { user } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/auth');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <LinearGradient
      colors={['#FF9933', '#FFFFFF', '#138808']}
      className="flex-1 items-center justify-center"
    >
      <View className="items-center">
        <View className="w-32 h-32 bg-white rounded-full items-center justify-center mb-6 shadow-lg">
          <Text className="text-6xl">🇮🇳</Text>
        </View>
        <Text className="text-4xl font-bold text-white mb-2 tracking-wider">
          YatraAI
        </Text>
        <Text className="text-lg text-white/90">
          Plan Your Perfect Journey
        </Text>
        <View className="mt-8">
          <View className="flex-row gap-2">
            <View className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <View className="w-2 h-2 bg-white rounded-full animate-pulse delay-100" />
            <View className="w-2 h-2 bg-white rounded-full animate-pulse delay-200" />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
