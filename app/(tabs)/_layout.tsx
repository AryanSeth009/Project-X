import { Tabs } from 'expo-router';
import { Home, Map, User, Crown } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { View, StyleSheet, Platform } from 'react-native';
import { FontFamily } from '@/lib/fonts';

const TAB_RADIUS = 26;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#9CA3AF',

        // Floating, rounded container
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: TAB_RADIUS,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 28,
            },
          }),
        },

        // Glassmorphism background rendered inside its own rounded container
        tabBarBackground: () => (
          <View style={styles.glassContainer}>
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            >
              {/* dark glass wash */}
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: 'rgba(36, 41, 34, 0.85)',
                  },
                ]}
              />
              {/* top-half sheen */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '55%',
                  backgroundColor: 'rgba(76, 175, 80, 0.08)',
                }}
              />
              {/* 1 px glass-edge highlight */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: StyleSheet.hairlineWidth * 2,
                  backgroundColor: 'rgba(245, 245, 220, 0.3)',
                }}
              />
            </BlurView>
          </View>
        ),

        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: FontFamily.semibold,
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

const styles = StyleSheet.create({
  glassContainer: {
    flex: 1,
    borderRadius: TAB_RADIUS,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});