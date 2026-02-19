import { useEffect } from 'react';
import { View, Text, Image, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';

const { width, height } = Dimensions.get('window');

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
    }, 1000000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/doodle-loading-page.png')} // 👈 change this path
        style={styles.background}
        resizeMode="cover"          // "contain" = no stretch, fully visible, letterboxed
        imageStyle={styles.bgImage}
      >
        {/* Dark overlay so content stays readable over any image */}
        <View style={styles.overlay} />

        {/* Decorative circles */}
        <View className="absolute top-20 right-10 w-40 h-40 bg-white/10 rounded-full" />
        <View className="absolute bottom-32 left-8 w-32 h-32 bg-white/10 rounded-full" />
        <View className="absolute top-1/3 left-16 w-20 h-20 bg-white/5 rounded-full" />

        <View className="flex-1 items-center justify-center px-6">
          {/* Icon container */}

          {/* App name */}
          <Text className="font-inter-bold text-5xl text-white mb-3 tracking-tight">
            Project X AI
          </Text>

          <Text className="font-inter-medium text-base text-white/80 mb-2">
            Your AI *******
          </Text>

          <View className="flex-row items-center gap-1 mb-12">
            <View className="w-1 h-1 bg-white/60 rounded-full" />
            <Text className="font-inter-medium text-sm text-white/60">
              Smart  Fast  Personalized
            </Text>
            <View className="w-1 h-1 bg-white/60 rounded-full" />
          </View>

          {/* Loading indicator */}
          <View className="mt-8 items-center">
            <View className="flex-row gap-2 mb-2">
              <View className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              <View className="w-2.5 h-2.5 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <View className="w-2.5 h-2.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '500ms' }} />
            </View>
            <Text className="font-inter-medium text-xs text-white/50 tracking-wide">
              Loading your experience
            </Text>
          </View>
        </View>

        {/* Bottom accent */}
        <View className="absolute bottom-0 left-0 right-0 h-1 bg-white/20" />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // background behind the contained image
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bgImage: {
    // centers the image on screen without stretching
    alignSelf: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // tune opacity to taste
  },
});