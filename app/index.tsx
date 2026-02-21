import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, Dimensions, StatusBar, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, ArrowRight } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

const PLACES = [
  {
    image: 'https://images.unsplash.com/photo-1496566084516-c5b96fcbd5c8?q=80&w=1172&auto=format&fit=crop',
    location: 'Goa, India'
  },
  {
    image: 'https://images.unsplash.com/photo-1711359940524-ed5e0ad9b89b?q=80&w=687&auto=format&fit=crop',
    location: 'Manali, India'
  },
  {
    image: 'https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?q=80&w=664&auto=format&fit=crop',
    location: 'Jaipur, India'
  },
  {
    image: 'https://images.unsplash.com/photo-1627370778723-4d26700cd972?q=80&w=687&auto=format&fit=crop',
    location: 'Kerala, India'
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useStore();
  const { colors, resolvedScheme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)/home');
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      Animated.timing(fadeAnim, {
        toValue: 0.8,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((prev) => (prev + 1) % PLACES.length);
        // Fade back in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    router.push('/auth');
  };

  const handleLogin = () => {
    router.push('/auth');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={resolvedScheme === 'dark' ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
        <ImageBackground
          source={{ uri: PLACES[currentIndex].image }}
          style={styles.background}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', `${colors.background}80`, colors.background]}
            locations={[0, 0.4, 0.95]}
            style={styles.overlay}
          >
            <View className="flex-1 px-8 pb-12 justify-end">
              {/* Header Content */}
              <View className="mb-10">
                <Text className="font-inter-bold text-[44px] leading-[48px] mb-4" style={{ color: colors.text }}>
                  Explore the{"\n"}world with us!
                </Text>
                <Text className="font-inter-medium text-lg leading-6" style={{ color: colors.textSecondary }}>
                  With SafarYatraAI, you can find stays and travel spots in matter of seconds! Sounds cool right?
                </Text>
              </View>

              {/* Location Badge */}
              <View className="flex-row items-center self-start px-4 py-2 rounded-full border mb-8" style={{ backgroundColor: colors.card, borderColor: colors.greenBorder }}>
                <MapPin size={16} color={colors.green} />
                <Text className="font-inter-medium ml-2" style={{ color: colors.text }}>
                  {PLACES[currentIndex].location}
                </Text>
              </View>

              {/* Pagination Dots */}
              <View className="flex-row gap-2 mb-10">
                {PLACES.map((_, index) => (
                  <View 
                    key={index}
                    className="h-1.5 rounded-full"
                    style={{
                      width: index === currentIndex ? 40 : 24,
                      backgroundColor: index === currentIndex ? colors.green : colors.textMuted + '80'
                    }}
                  />
                ))}
              </View>

              {/* Bottom Section Card */}
              <View 
                className="rounded-[40px] p-6 items-center border"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <TouchableOpacity
                  onPress={handleStart}
                  className="w-full h-16 rounded-2xl flex-row items-center justify-center gap-3"
                  style={{ backgroundColor: colors.green }}
                >
                  <Text className="font-inter-bold text-lg" style={{ color: colors.onGreen }}>Let's start your journey</Text>
                  <ArrowRight size={20} color={colors.onGreen} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogin} className="mt-6 flex-row">
                  <Text className="font-inter text-base" style={{ color: colors.text }}>Already have an account? </Text>
                  <Text className="font-inter-bold text-base" style={{ color: colors.green }}>Login here</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});