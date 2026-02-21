import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, Dimensions, StatusBar, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, ArrowRight } from 'lucide-react-native';
import { useStore } from '@/store/useStore';

const { width } = Dimensions.get('window');

const PLACES = [
  {
    image: 'https://i.pinimg.com/736x/ed/4b/4a/ed4b4ad24bcbe3c3a27b14cdb8fbb3cf.jpg',
    location: 'Goa, India'
  },
  {
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2000&auto=format&fit=crop',
    location: 'Manali, India'
  },
  {
    image: 'https://images.unsplash.com/photo-1506929113675-b82f1fefd81a?q=80&w=2000&auto=format&fit=crop',
    location: 'Jaipur, India'
  },
  {
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop',
    location: 'Kerala, India'
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useStore();
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
    <View className="flex-1 bg-[#1A1C19]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
        <ImageBackground
          source={{ uri: PLACES[currentIndex].image }}
          style={styles.background}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(26,28,25,0.5)', '#1A1C19']}
            locations={[0, 0.4, 0.95]}
            style={styles.overlay}
          >
            <View className="flex-1 px-8 pb-12 justify-end">
              {/* Header Content */}
              <View className="mb-10">
                <Text className="font-inter-boldnt text-[44px] leading-[48px] text-[#F5F5DC] mb-4">
                  Explore the{"\n"}world with us!
                </Text>
                <Text className="font-inter-medium text-lg text-[#F5F5DC]/70 leading-6">
                  With SafarYatraAI, you can find stays and travel spots in matter of seconds! Sounds cool right?
                </Text>
              </View>

              {/* Location Badge */}
              <View className="flex-row items-center bg-[#242922] self-start px-4 py-2 rounded-full border border-[#4CAF50]/30 mb-8">
                <MapPin size={16} color="#4CAF50" />
                <Text className="font-inter-medium text-[#F5F5DC] ml-2">
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
                      backgroundColor: index === currentIndex ? '#4CAF50' : 'rgba(245, 245, 220, 0.3)'
                    }}
                  />
                ))}
              </View>

              {/* Bottom Section Card */}
              <View 
                className="rounded-[40px] p-6 items-center border border-[#242922]"
                style={{ backgroundColor: '#242922' }}
              >
                <TouchableOpacity
                  onPress={handleStart}
                  className="w-full h-16 rounded-2xl flex-row items-center justify-center gap-3"
                  style={{ backgroundColor: '#4CAF50' }}
                >
                  <Text className="text-[#1A1C19] font-inter-bold text-lg">Let's start your journey</Text>
                  <ArrowRight size={20} color="#1A1C19" />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogin} className="mt-6 flex-row">
                  <Text className="font-inter text-[#F5F5DC] text-base">Already have an account? </Text>
                  <Text className="font-inter-bold text-[#4CAF50] text-base">Login here</Text>
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