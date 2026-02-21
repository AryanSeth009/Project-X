import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { GoogleLogo } from '@/components/GoogleLogo';
import { supabase } from '@/lib/supabase';

// Handle redirect for deep linking
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
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
      colors={['#1A1C19', '#242922']}
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
            <Text className="font-inter-bold text-3xl text-[#F5F5DC] mb-2">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Text>
            <Text className="font-inter text-[#F5F5DC]/70 text-base">
              {isLogin
                ? 'Welcome back you\'ve been missed'
                : 'Just a few quick things to get you started'}
            </Text>
          </View>

          {/* Main Content */}
          <View className="flex-1 px-6">
            {error ? (
              <View className="border-l-4 border-red-500 rounded-xl p-4 mb-6 flex-row items-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                <Text className="text-2xl mr-3">⚠️</Text>
                <Text className="font-inter-medium flex-1" style={{ color: '#FCA5A5' }}>{error}</Text>
              </View>
            ) : null}

            {/* Sign-up bonus banner */}
            {!isLogin && (
  <View className="mb-6 rounded-2xl overflow-hidden">
    <View className="p-px rounded-2xl" style={{ backgroundColor: '#F39C12' }}>
      <View className="rounded-2xl px-4 py-3 flex-row items-center gap-3"
        style={{ backgroundColor: '#242922' }}>
        
        <View className="relative">
          <View className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: '#F39C12' }}>
            <Text className="text-2xl">🎁</Text>
          </View>
        </View>

        <View className="flex-1">
          <Text className="font-inter-bold text-xs text-[#F39C12] uppercase tracking-widest mb-0.5">
            New Account Offer
          </Text>
          <Text className="font-inter-bold text-[#F5F5DC] text-base leading-tight">
            Get 3 Free Credits
          </Text>
        </View>

        <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: '#4CAF50' }}>
          <Text className="font-inter-bold text-[#1A1C19] text-xs">FREE</Text>
        </View>

      </View>
    </View>
  </View>
)}

            <View className="gap-4">
              {/* Email Input */}
              <View>
                <Text className="font-inter-semibold text-[#F5F5DC] mb-2 text-sm">
                  Email ID
                </Text>
                <View className="rounded-xl px-4 py-2 border border-[#242922]" style={{ backgroundColor: '#242922' }}>
                  <TextInput
                    className="font-inter text-base"
                    style={{ color: '#F5F5DC' }}
                    placeholder="Enter Email ID"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="font-inter-semibold text-[#F5F5DC] mb-2 text-sm">
                  Password
                </Text>
                <View className="rounded-xl px-4 py-2 flex-row items-center border border-[#242922]" style={{ backgroundColor: '#242922' }}>
                  <TextInput
                    className="font-inter flex-1 text-base"
                    style={{ color: '#F5F5DC' }}
                    placeholder="Enter Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <Text className="text-[#F5F5DC]/60 text-xl">👁</Text>
                </View>
              </View>

              {/* Remember Me & Forgot Password Row (only on login) */}
              {isLogin && (
                <View className="flex-row items-center justify-between -mt-1">
                  <TouchableOpacity 
                    className="flex-row items-center gap-2"
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View className={`w-5 h-5 rounded border-2 items-center justify-center ${
                      rememberMe ? 'border-[#4CAF50]' : 'border-[#242922]'
                    }`} style={rememberMe ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#242922' }}>
                      {rememberMe && <Text className="text-[#1A1C19] text-xs">✓</Text>}
                    </View>
                    <Text className="font-inter text-[#F5F5DC] text-sm">Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Text className="font-inter-medium text-[#F5F5DC]/80 text-sm">
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
                  style={{ backgroundColor: '#4CAF50' }}
                  className="rounded-xl py-4"
                >
                  <Text className="font-inter-bold text-[#1A1C19] text-center text-base">
                    {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create account')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px bg-[#242922]" />
                <Text className="font-inter px-4 text-[#F5F5DC]/60 text-sm">Or with</Text>
                <View className="flex-1 h-px bg-[#242922]" />
              </View>

              {/* Social Login Options */}
              <View className="flex-row gap-3">

                <TouchableOpacity 
                  className="flex-1 rounded-xl py-3.5 items-center justify-center flex-row gap-2 border border-[#242922]" 
                  style={{ backgroundColor: '#242922' }}
                  onPress={handleGoogleLogin}
                  disabled={loading}
                >
                  <GoogleLogo size={22} />
                  <Text className="font-inter-semibold text-[#F5F5DC] text-sm">Continue with Google</Text>
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
            <Text className="font-inter text-center text-[#F5F5DC]/80 text-sm">
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Text className="font-inter-bold text-[#4CAF50]">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}