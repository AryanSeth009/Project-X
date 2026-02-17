import { Tabs } from 'expo-router';
import { Home, Map, User, Crown } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { View, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A7A73',
        tabBarInactiveTintColor: '#9CA3AF',

        // ── Floating position ──────────────────────────────────────
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: 28,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,        // remove default top border
          backgroundColor: 'transparent',
          elevation: 0,             // remove Android shadow so BlurView shows
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 28,
            },
          }),
        },

        // ── Glassmorphism background rendered via tabBarBackground ──
        tabBarBackground: () => (
          <BlurView
            intensity={75}
            tint="light"
            style={StyleSheet.absoluteFillObject}
          >
            {/* white glass wash */}
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(255, 255, 255, 0.55)',
                borderRadius: 28,
              }}
            />
            {/* top-half sheen */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
              }}
            />
            {/* 1 px glass-edge highlight */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
              }}
            />
          </BlurView>
        ),

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          title: 'Itinerary',
          tabBarIcon: ({ size, color }) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pro"
        options={{
          title: 'Pro',
          tabBarIcon: ({ size, color }) => <Crown size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}