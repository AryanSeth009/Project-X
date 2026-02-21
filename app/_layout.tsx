import '../global.css';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { FontFamily } from '@/lib/fonts';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  useFrameworkReady();
  const { resolvedScheme } = useTheme();
  const { setUser, setProfile } = useStore();

  const [fontsLoaded] = useFonts({
    [FontFamily.regular]: require('@/assets/Inter/static/Inter_24pt-Regular.ttf'),
    [FontFamily.medium]: require('@/assets/Inter/static/Inter_24pt-Medium.ttf'),
    [FontFamily.semibold]: require('@/assets/Inter/static/Inter_24pt-SemiBold.ttf'),
    [FontFamily.bold]: require('@/assets/Inter/static/Inter_24pt-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Set default body font for all <Text> once fonts are ready
  if (fontsLoaded && !(Text as any).__interDefaultSet) {
    (Text as any).__interDefaultSet = true;
    const prev = (Text as any).defaultProps ?? {};
    (Text as any).defaultProps = {
      ...prev,
      style: [{ fontFamily: FontFamily.regular }, prev.style].filter(Boolean),
    };
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data && !error) {
      setProfile(data);
    }
  };

  if (!fontsLoaded) {
    // Keep splash screen visible until Inter has loaded
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="loading" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
