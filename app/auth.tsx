import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <View className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Modern Header with gradient */}
          <LinearGradient
            colors={['#FF6B35', '#FF8C42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="pt-16 pb-8 px-6"
          >
            <View className="items-center">
              <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-4 shadow-lg">
                <Text className="text-3xl">✈️</Text>
              </View>
              <Text className="text-3xl font-black text-white mb-2">
                {isLogin ? 'Welcome back!' : 'Get started'}
              </Text>
              <Text className="text-white/80 text-center text-base">
                {isLogin
                  ? 'Sign in to continue exploring'
                  : 'Create your account in seconds'}
              </Text>
            </View>
          </LinearGradient>

          {/* Main Content Card */}
          <View className="flex-1 bg-gray-50 -mt-4 rounded-t-3xl px-6 pt-8">
            {error ? (
              <View className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-6 flex-row items-center">
                <Text className="text-2xl mr-3">⚠️</Text>
                <Text className="text-red-700 flex-1 font-medium">{error}</Text>
              </View>
            ) : null}

            {/* Sign-up bonus banner */}
            {!isLogin && (
              <View className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 mb-6 flex-row items-center">
                <View className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center mr-3">
                  <Text className="text-xl">🎁</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-bold text-sm">Welcome Gift!</Text>
                  <Text className="text-gray-600 text-xs mt-0.5">
                    Get started with your first trips instantly
                  </Text>
                </View>
              </View>
            )}

            <View className="gap-5">
              {/* Email Input */}
              <View>
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Email address
                </Text>
                <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center shadow-sm">
                  <Text className="text-gray-400 mr-3 text-lg">📧</Text>
                  <TextInput
                    className="flex-1 text-gray-800 text-base"
                    placeholder="name@example.com"
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
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Password
                </Text>
                <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center shadow-sm">
                  <Text className="text-gray-400 mr-3 text-lg">🔒</Text>
                  <TextInput
                    className="flex-1 text-gray-800 text-base"
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Forgot Password (only on login) */}
              {isLogin && (
                <TouchableOpacity className="self-end -mt-2">
                  <Text className="text-orange-500 font-semibold text-sm">
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              )}

              {/* CTA Button */}
              <TouchableOpacity
                className={`rounded-2xl py-4 mt-2 shadow-lg ${
                  loading ? 'bg-gray-300' : 'bg-gradient-to-r from-orange-500 to-orange-600'
                }`}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ['#D1D5DB', '#D1D5DB'] : ['#FF6B35', '#FF8C42']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-2xl py-4"
                >
                  <Text className="text-white text-center font-bold text-lg">
                    {loading ? (
                      <View className="flex-row items-center justify-center gap-2">
                        <Text>⏳</Text>
                        <Text className="text-white font-bold">Please wait...</Text>
                      </View>
                    ) : (
                      isLogin ? 'Sign in' : 'Create account'
                    )}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-2">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="px-4 text-gray-400 text-xs font-medium">OR</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              {/* Social Login Options */}
              <View className="flex-row gap-3">
                <TouchableOpacity className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 items-center shadow-sm">
                  <Text className="text-2xl">🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 items-center shadow-sm">
                  <Text className="text-2xl">📱</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-white border border-gray-200 rounded-2xl py-3 items-center shadow-sm">
                  <Text className="text-2xl">🍎</Text>
                </TouchableOpacity>
              </View>

              {/* Toggle Auth Mode */}
              <TouchableOpacity
                onPress={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="py-4"
              >
                <Text className="text-center text-gray-600 text-base">
                  {isLogin
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                  <Text className="text-orange-500 font-bold">
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom spacing */}
            <View className="h-8" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
