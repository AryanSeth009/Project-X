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
    <View className="flex-1 bg-white">
      {/* Modern gradient overlay with subtle effect */}
      <LinearGradient
        colors={['#FF6B35', '#FF8C42', '#FFA552']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 items-center justify-center"
      >
        {/* Decorative circles in background */}
        <View className="absolute top-20 right-10 w-40 h-40 bg-white/10 rounded-full" />
        <View className="absolute bottom-32 left-8 w-32 h-32 bg-white/10 rounded-full" />
        <View className="absolute top-1/3 left-16 w-20 h-20 bg-white/5 rounded-full" />
        
        <View className="items-center px-6">
          {/* Modern icon container */}
          <View className="w-28 h-28 bg-white rounded-3xl items-center justify-center mb-8 shadow-2xl">
            <Text className="text-6xl">✈️</Text>
          </View>
          
          {/* App name with modern typography */}
          <Text className="font-inter-bold text-5xl text-white mb-3 tracking-tight">
            Project X
          </Text>
          
          <Text className="font-inter-medium text-base text-white/80 mb-2">
            Your *Uncensored*
          </Text>
          
          <View className="flex-row items-center gap-1 mb-12">
            <View className="w-1 h-1 bg-white/60 rounded-full" />
            <Text className="font-inter-medium text-sm text-white/60">
              Smart • Fast • Personalized
            </Text>
            <View className="w-1 h-1 bg-white/60 rounded-full" />
          </View>
          
          {/* Modern loading indicator */}
          <View className="mt-8 items-center">
            <View className="flex-row gap-2 mb-2">
              <View className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              <View className="w-2.5 h-2.5 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <View className="w-2.5 h-2.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </View>
            <Text className="font-inter-medium text-xs text-white/50 tracking-wide">
              Loading your experience
            </Text>
          </View>
        </View>
        
        {/* Bottom accent */}
        <View className="absolute bottom-0 left-0 right-0 h-1 bg-white/20" />
      </LinearGradient>
    </View>
  );
}
