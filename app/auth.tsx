import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { GoogleLogo } from '@/components/GoogleLogo';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

// Handle redirect for deep linking
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.replace('/(tabs)/home');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create a deep link to return to the app
      const redirectTo = Linking.createURL('/');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // Let Expo WebBrowser handle the open
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        // Open the system browser for auth
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        if (res.type === 'success' && res.url) {
          // Parse the URL hash fragment returned by Supabase
          const urlParams = new URL(res.url.replace('#', '?')).searchParams;
          const access_token = urlParams.get('access_token');
          const refresh_token = urlParams.get('refresh_token');

          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) throw sessionError;
            // Router replacement to home is handled by the global auth listener in _layout.tsx
          }
        }
      }
    } catch (e: any) {
      setError(e.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Simple Header - transparent to show gradient */}
          <View className="pt-16 pb-8 px-6">
            <Text className="font-inter-bold text-3xl mb-2" style={{ color: colors.text }}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Text>
            <Text className="font-inter text-base" style={{ color: colors.textSecondary }}>
              {isLogin
                ? 'Welcome back you\'ve been missed'
                : 'Just a few quick things to get you started'}
            </Text>
          </View>

          {/* Main Content */}
          <View className="flex-1 px-6">
            {error ? (
              <View className="border-l-4 rounded-xl p-4 mb-6 flex-row items-center" style={{ backgroundColor: colors.errorMuted, borderColor: colors.error }}>
                <Text className="text-2xl mr-3">⚠️</Text>
                <Text className="font-inter-medium flex-1" style={{ color: colors.error }}>{error}</Text>
              </View>
            ) : null}

            {/* Sign-up bonus banner */}
            {!isLogin && (
  <View className="mb-6 rounded-2xl overflow-hidden">
    <View className="p-px rounded-2xl" style={{ backgroundColor: colors.orange }}>
      <View className="rounded-2xl px-4 py-3 flex-row items-center gap-3"
        style={{ backgroundColor: colors.card }}>
        
        <View className="relative">
          <View className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.orange }}>
            <Text className="text-2xl">🎁</Text>
          </View>
        </View>

        <View className="flex-1">
          <Text className="font-inter-bold text-xs uppercase tracking-widest mb-0.5" style={{ color: colors.orange }}>
            New Account Offer
          </Text>
          <Text className="font-inter-bold text-base leading-tight" style={{ color: colors.text }}>
            Get 3 Free Credits
          </Text>
        </View>

        <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: colors.green }}>
          <Text className="font-inter-bold text-xs" style={{ color: colors.onGreen }}>FREE</Text>
        </View>

      </View>
    </View>
  </View>
)}

            <View className="gap-4">
              {/* Email Input */}
              <View>
                <Text className="font-inter-semibold mb-2 text-sm" style={{ color: colors.text }}>
                  Email ID
                </Text>
                <View className="rounded-xl px-4 py-2 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                  <TextInput
                    className="font-inter text-base"
                    style={{ color: colors.text }}
                    placeholder="Enter Email ID"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="font-inter-semibold mb-2 text-sm" style={{ color: colors.text }}>
                  Password
                </Text>
                <View className="rounded-xl px-4 py-2 flex-row items-center border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
                  <TextInput
                    className="font-inter flex-1 text-base"
                    style={{ color: colors.text }}
                    placeholder="Enter Password"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <Text className="text-xl" style={{ color: colors.textMuted }}>👁</Text>
                </View>
              </View>

              {/* Remember Me & Forgot Password Row (only on login) */}
              {isLogin && (
                <View className="flex-row items-center justify-between -mt-1">
                  <TouchableOpacity 
                    className="flex-row items-center gap-2"
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View className="w-5 h-5 rounded border-2 items-center justify-center" style={{
                      borderColor: rememberMe ? colors.green : colors.border,
                      backgroundColor: rememberMe ? colors.green : colors.card,
                    }}>
                      {rememberMe && <Text className="text-xs" style={{ color: colors.onGreen }}>✓</Text>}
                    </View>
                    <Text className="font-inter text-sm" style={{ color: colors.text }}>Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Text className="font-inter-medium text-sm" style={{ color: colors.textSecondary }}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* CTA Button */}
              <TouchableOpacity
                className="rounded-xl mt-2"
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View 
                  style={{ backgroundColor: colors.green }}
                  className="rounded-xl py-4"
                >
                  <Text className="font-inter-bold text-center text-base" style={{ color: colors.onGreen }}>
                    {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create account')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
                <Text className="font-inter px-4 text-sm" style={{ color: colors.textMuted }}>Or with</Text>
                <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
              </View>

              {/* Social Login Options */}
              <View className="flex-row gap-3">

                <TouchableOpacity
                  className="flex-1 rounded-xl py-3.5 items-center justify-center flex-row gap-2 border"
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                  onPress={handleGoogleLogin}
                  disabled={loading}
                >
                  <GoogleLogo size={22} />
                  <Text className="font-inter-semibold text-sm" style={{ color: colors.text }}>Continue with Google</Text>
                </TouchableOpacity>
                </View>
                </View>
          </View>
        </ScrollView>

        {/* Toggle Auth Mode - Fixed to bottom */}
        <View className="absolute bottom-8 left-0 right-0 px-6 py-4">
          <TouchableOpacity
            onPress={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            <Text className="font-inter text-center text-sm" style={{ color: colors.textSecondary }}>
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Text className="font-inter-bold" style={{ color: colors.green }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}