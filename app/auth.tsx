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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
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
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Simple Header - no gradient */}
          <View className="pt-16 pb-8 px-6 bg-white">
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
              <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex-row items-center">
                <View className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center mr-3">
                  <Text className="text-xl">🎁</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-inter-bold text-gray-800 text-sm">Welcome Gift!</Text>
                  <Text className="font-inter text-gray-600 text-xs mt-0.5">
                    Get started with your first trips instantly
                  </Text>
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
                      rememberMe ? 'bg-purple-600 border-purple-600' : 'border-gray-300 bg-white'
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
                  style={{ backgroundColor: loading ? '#D1D5DB' : '#000000' }}
                  className="rounded-xl py-4"
                >
                  <Text className="font-inter-bold text-white text-center text-base">
                    {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create account')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="font-inter px-4 text-gray-400 text-sm">Or with</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              {/* Social Login Options */}
              <View className="flex-row gap-3">

                <TouchableOpacity className="flex-1 bg-white border border-gray-300 rounded-xl py-3.5 items-center justify-center flex-row gap-2">
                  <Image
                    source={require('../assets/icons/googleicon.svg')}
                    style={{ width: 20, height: 20, resizeMode: 'contain' }}
                  />
                  <Text className="font-inter-semibold text-gray-700 text-sm">Continue with Google</Text>
                </TouchableOpacity>
                </View>
                </View>
          </View>
        </ScrollView>

        {/* Toggle Auth Mode - Fixed to bottom */}
        <View className="absolute bottom-8 left-0 right-0 px-6 bg-white py-4">
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
    </View>
  );
}