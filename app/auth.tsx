import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleLogo } from '@/components/GoogleLogo';
import { supabase } from '@/lib/supabase';

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

  return (
    <LinearGradient
      colors={['#F2EFE7', '#E8D5C0']}
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
            <Text className="font-inter-bold text-3xl text-gray-900 mb-2">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Text>
            <Text className="font-inter text-gray-500 text-base">
              {isLogin
                ? 'Welcome back you\'ve been missed'
                : 'Just a few quick things to get you started'}
            </Text>
          </View>

          {/* Main Content */}
          <View className="flex-1 px-6">
            {error ? (
              <View className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex-row items-center">
                <Text className="text-2xl mr-3">⚠️</Text>
                <Text className="font-inter-medium text-red-700 flex-1">{error}</Text>
              </View>
            ) : null}

            {/* Sign-up bonus banner */}
            {!isLogin && (
  <View className="mb-6 rounded-2xl overflow-hidden">
    {/* Gradient-style layered background */}
    <View className="bg-orange-500 p-px rounded-2xl">
      <View className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl px-4 py-3 flex-row items-center gap-3"
        style={{ backgroundColor: '#fff8f0' }}>
        
        {/* Left: Icon with glow ring */}
        <View className="relative">
          <View className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: '#FF6B35' }}>
            <Text className="text-2xl">🎁</Text>
          </View>
        </View>

        {/* Middle: Text */}
        <View className="flex-1">
          <Text className="font-inter-bold text-xs text-orange-400 uppercase tracking-widest mb-0.5">
            New Account Offer
          </Text>
          <Text className="font-inter-bold text-gray-900 text-base leading-tight">
            Get 3 Free Credits
          </Text>
        </View>

        {/* Right: Badge pill */}
        <View className="bg-orange-500 rounded-full px-3 py-1.5">
          <Text className="font-inter-bold text-white text-xs">FREE</Text>
        </View>

      </View>
    </View>
  </View>
)}

            <View className="gap-4">
              {/* Email Input */}
              <View>
                <Text className="font-inter-semibold text-gray-800 mb-2 text-sm">
                  Email ID
                </Text>
                <View className="bg-white border border-gray-300 rounded-xl px-4 py-2">
                  <TextInput
                    className="font-inter text-gray-800 text-base"
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
                <Text className="font-inter-semibold text-gray-800 mb-2 text-sm">
                  Password
                </Text>
                <View className="bg-white border border-gray-300 rounded-xl px-4 py-2 flex-row items-center">
                  <TextInput
                    className="font-inter flex-1 text-gray-800 text-base"
                    placeholder="Enter Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <Text className="text-gray-400 text-xl">👁</Text>
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
                      rememberMe ? 'bg-[#1A7A73] border-[#1A7A73]' : 'border-gray-300 bg-white'
                    }`}>
                      {rememberMe && <Text className="text-white text-xs">✓</Text>}
                    </View>
                    <Text className="font-inter text-gray-700 text-sm">Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Text className="font-inter-medium text-gray-700 text-sm">
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
                  style={{ backgroundColor: loading ? '#1A7A73' : '#1A7A73' }}
                  className="rounded-xl py-4"
                >
                  <Text className="font-inter-bold text-white text-center text-base">
                    {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create account')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px bg-gray-400" />
                <Text className="font-inter px-4 text-gray-400 text-sm">Or with</Text>
                <View className="flex-1 h-px bg-gray-400" />
              </View>

              {/* Social Login Options */}
              <View className="flex-row gap-3">

                <TouchableOpacity className="flex-1 bg-white border border-gray-300 rounded-xl py-3.5 items-center justify-center flex-row gap-2">
                  <GoogleLogo size={22} />
                  <Text className="font-inter-semibold text-gray-700 text-sm">Continue with Google</Text>
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
            <Text className="font-inter text-center text-gray-600 text-sm">
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Text className="font-inter-bold text-gray-900">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}