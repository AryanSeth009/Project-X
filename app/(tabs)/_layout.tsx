import { Tabs } from 'expo-router';
import { Home, Map, User, Crown } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { View, StyleSheet, Platform } from 'react-native';
import { FontFamily } from '@/lib/fonts';
import { useTheme } from '@/context/ThemeContext';

const TAB_RADIUS = 32;

export default function TabLayout() {
  const { colors, resolvedScheme } = useTheme();
  const isDark = resolvedScheme === 'dark';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',

        tabBarStyle: {
          position: 'absolute',
          bottom: 34, // respects iPhone home indicator
          left: 16,
          right: 16,
          height: 68,
          borderRadius: TAB_RADIUS,
          paddingBottom: 0,
          paddingTop: 0,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 32,
            },
          }),
        },

        tabBarBackground: () => (
          <View style={styles.glassContainer}>
            {/* Core iOS-style blur */}
            <BlurView
              intensity={85}
              tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Subtle tint over the blur — keep opacity LOW so blur shows */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: isDark ? 'rgba(18, 20, 18, 0.35)' : 'rgba(255, 255, 255, 0.5)' },
              ]}
            />

            {/* Very faint green tint — brand accent without killing the glass */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.04)' : 'rgba(34, 139, 34, 0.04)' },
              ]}
            />

            {/* Top border highlight — the key to real glassmorphism */}
            <View style={styles.topBorder} />

            {/* Bottom inner shadow / depth line */}
            <View style={styles.bottomBorder} />
          </View>
        ),

        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: FontFamily.semibold,
          letterSpacing: 0.2,
          marginTop: -2,
        },

        tabBarItemStyle: {
          paddingVertical: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          title: 'Itinerary',
          tabBarIcon: ({ size, color }) => <Map size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="pro"
        options={{
          title: 'Pro',
          tabBarIcon: ({ size, color }) => <Crown size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size - 2} color={color} strokeWidth={1.8} />,
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
    // Outer border that catches light — subtle white rim
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'transparent',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderTopLeftRadius: TAB_RADIUS,
    borderTopRightRadius: TAB_RADIUS,
  },
  bottomBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});