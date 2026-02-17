import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  Crown,
  History,
  LogOut,
  CreditCard,
  Zap,
  Check,
} from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { signOutCompletely } from '@/lib/auth';
import * as WebBrowser from 'expo-web-browser';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, setUser, setProfile, reset, itineraries } = useStore();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            console.log('Starting sign out process...');
            
            // Clear local state first
            reset();
            
            // Use comprehensive sign out function
            const result = await signOutCompletely();
            
            if (!result.success) {
              console.error('Sign out had issues:', result.error);
              Alert.alert('Warning', 'Signed out with some issues. You may need to restart the app.');
            } else {
              console.log('Sign out successful');
            }
            
            // Always navigate to auth screen
            router.replace('/auth');
            
          } catch (error) {
            console.error('Unexpected sign out error:', error);
            // Reset state and navigate anyway on unexpected errors
            reset();
            router.replace('/auth');
            Alert.alert('Signed Out', 'You have been signed out.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleBuyCredits = (amount: number, price: number) => {
    Alert.alert(
      'Buy Credits',
      `Purchase ${amount} credits for ₹${price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: () => initiatePayment('credit_purchase', price, amount),
        },
      ]
    );
  };

  const handleUpgradePro = () => {
    Alert.alert(
      'Upgrade to Pro',
      'Get unlimited itineraries, priority support, and exclusive features for just ₹199/month!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: () => initiatePayment('pro_subscription', 199, 0),
        },
      ]
    );
  };

  const initiatePayment = async (
    type: 'credit_purchase' | 'pro_subscription',
    amount: number,
    credits: number
  ) => {
    try {
      setLoading(true);

      const transaction = {
        user_id: user?.id,
        type,
        amount,
        credits_added: credits,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) throw error;

      const razorpayUrl = `https://pages.razorpay.com/pl_your_payment_link?amount=${amount * 100}&transaction_id=${data.id}`;

      Alert.alert(
        'Payment Integration',
        'Razorpay payment would open here. For demo purposes, this simulates a successful payment.',
        [
          {
            text: 'Simulate Success',
            onPress: async () => {
              await supabase
                .from('transactions')
                .update({
                  status: 'completed',
                  razorpay_payment_id: 'demo_payment_' + Date.now(),
                })
                .eq('id', data.id);

              if (type === 'credit_purchase') {
                const newCredits = (profile?.credits || 0) + credits;
                await supabase
                  .from('profiles')
                  .update({ credits: newCredits })
                  .eq('id', user?.id);
                setProfile({ ...profile!, credits: newCredits });
                Alert.alert('Success', `${credits} credits added to your account!`);
              } else {
                const proExpiresAt = new Date();
                proExpiresAt.setMonth(proExpiresAt.getMonth() + 1);
                await supabase
                  .from('profiles')
                  .update({
                    is_pro: true,
                    pro_expires_at: proExpiresAt.toISOString(),
                  })
                  .eq('id', user?.id);
                setProfile({
                  ...profile!,
                  is_pro: true,
                  pro_expires_at: proExpiresAt.toISOString(),
                });
                Alert.alert('Success', 'Welcome to Pro! Enjoy unlimited itineraries!');
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Premium Header */}
      <LinearGradient
        colors={profile.is_pro ? ['#FFD700', '#FF8C42'] : ['#FF6B35', '#FF8C42']}
        className="pt-16 pb-12 px-6"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative elements */}
        <View className="absolute top-10 right-8 w-32 h-32 bg-white/10 rounded-full" />
        <View className="absolute bottom-8 left-6 w-20 h-20 bg-white/10 rounded-full" />
        
        <View className="items-center relative z-10">
          <View
            className={`w-24 h-24 ${
              profile.is_pro ? 'bg-white' : 'bg-white'
            } rounded-3xl items-center justify-center mb-4 shadow-2xl`}
          >
            {profile.is_pro ? (
              <Crown size={44} color="#FF6B35" strokeWidth={2.5} />
            ) : (
              <Text className="text-5xl">👤</Text>
            )}
          </View>
          
          <Text className="text-white text-xl font-bold mb-2 text-center px-4" numberOfLines={1}>
            {user.email}
          </Text>
          
          {profile.is_pro ? (
            <View className="bg-white/25 backdrop-blur rounded-full px-5 py-2 flex-row items-center gap-2">
              <Crown size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="text-white font-bold text-sm tracking-wide">PRO MEMBER</Text>
            </View>
          ) : (
            <View className="bg-white/20 rounded-full px-4 py-1.5">
              <Text className="text-white/90 font-medium text-sm">Free Plan</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View className="px-6 -mt-6 mb-6">
        <View className="bg-white rounded-3xl p-6 shadow-xl">
          <View className="flex-row items-center justify-between">
            {/* Credits */}
            <View className="flex-1">
              <Text className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wide">
                Credits
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="w-10 h-10 bg-orange-100 rounded-2xl items-center justify-center">
                  <Sparkles size={20} color="#FF6B35" strokeWidth={2.5} />
                </View>
                <Text className="text-3xl font-black text-gray-800">
                  {profile.is_pro ? '∞' : profile.credits}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="w-px h-16 bg-gray-200 mx-4" />

            {/* Itineraries */}
            <View className="flex-1">
              <Text className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wide">
                Trips
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="w-10 h-10 bg-blue-100 rounded-2xl items-center justify-center">
                  <Text className="text-xl">✈️</Text>
                </View>
                <Text className="text-3xl font-black text-gray-800">
                  {itineraries.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Buy Credits Section */}
          {!profile.is_pro && (
            <View className="mt-6 pt-6 border-t border-gray-100">
              <Text className="text-gray-600 text-sm font-medium mb-4">
                💳 Purchase more credits
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-md"
                  onPress={() => handleBuyCredits(5, 99)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    className="rounded-2xl p-4"
                  >
                    <Text className="text-white font-black text-lg mb-1">5</Text>
                    <Text className="text-white/90 text-xs font-medium mb-2">credits</Text>
                    <Text className="text-white font-bold text-base">₹99</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 shadow-md border-2 border-indigo-400"
                  onPress={() => handleBuyCredits(10, 149)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    className="rounded-2xl p-4"
                  >
                    <View className="absolute -top-2 -right-2 bg-yellow-400 rounded-full px-2 py-0.5">
                      <Text className="text-xs font-black text-gray-800">SAVE</Text>
                    </View>
                    <Text className="text-white font-black text-lg mb-1">10</Text>
                    <Text className="text-white/90 text-xs font-medium mb-2">credits</Text>
                    <Text className="text-white font-bold text-base">₹149</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 shadow-md"
                  onPress={() => handleBuyCredits(25, 299)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#9333EA', '#7C3AED']}
                    className="rounded-2xl p-4"
                  >
                    <View className="absolute -top-2 -right-2 bg-green-400 rounded-full px-2 py-0.5">
                      <Text className="text-xs font-black text-gray-800">BEST</Text>
                    </View>
                    <Text className="text-white font-black text-lg mb-1">25</Text>
                    <Text className="text-white/90 text-xs font-medium mb-2">credits</Text>
                    <Text className="text-white font-bold text-base">₹299</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Pro Upgrade Card */}
      {!profile.is_pro && (
        <View className="px-6 mb-6">
          <LinearGradient
            colors={['#FFD700', '#FF8C42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-6 shadow-2xl"
          >
            {/* Decorative crown pattern */}
            <View className="absolute top-4 right-4 opacity-20">
              <Crown size={80} color="#FFFFFF" />
            </View>
            
            <View className="relative z-10">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-10 h-10 bg-white/30 rounded-2xl items-center justify-center">
                  <Crown size={20} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text className="text-white text-2xl font-black">Go Pro</Text>
              </View>
              
              <Text className="text-white/95 mb-5 text-base font-medium">
                Unlimited planning for ₹199/month
              </Text>

              <View className="gap-3 mb-6">
                {[
                  { icon: '♾️', text: 'Unlimited itineraries' },
                  { icon: '⚡', text: 'Priority AI processing' },
                  { icon: '✨', text: 'Advanced features' },
                  { icon: '🎯', text: 'Premium destinations' },
                  { icon: '🛟', text: '24/7 Priority support' },
                  { icon: '📄', text: 'Export to PDF' },
                ].map((feature, index) => (
                  <View key={index} className="flex-row items-center gap-3">
                    <View className="w-7 h-7 bg-white/25 rounded-xl items-center justify-center">
                      <Text className="text-sm">{feature.icon}</Text>
                    </View>
                    <Text className="text-white font-medium">{feature.text}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                className="bg-white rounded-2xl py-4 shadow-xl"
                onPress={handleUpgradePro}
                activeOpacity={0.9}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Zap size={22} color="#FF6B35" fill="#FF6B35" />
                  <Text className="text-orange-600 font-black text-lg">
                    Upgrade Now
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Pro Active Status */}
      {profile.is_pro && (
        <View className="px-6 mb-6">
          <View className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-6">
            <View className="flex-row items-center gap-3 mb-3">
              <View className="w-12 h-12 bg-green-500 rounded-2xl items-center justify-center shadow-md">
                <Crown size={24} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-green-800 text-lg font-black">
                  Pro Active
                </Text>
                <Text className="text-green-600 text-sm font-medium">
                  All premium features unlocked
                </Text>
              </View>
            </View>
            {profile.pro_expires_at && (
              <View className="bg-white/60 rounded-xl p-3 mt-2">
                <Text className="text-green-700 text-sm font-medium">
                  ⏱️ Renews on{' '}
                  {new Date(profile.pro_expires_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View className="px-6 mb-6">
        <Text className="text-gray-700 font-bold text-base mb-4 uppercase tracking-wide">
          Quick Actions
        </Text>
        <View className="gap-3">
          <TouchableOpacity 
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm active:scale-98"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 bg-blue-100 rounded-2xl items-center justify-center">
                <History size={22} color="#3B82F6" strokeWidth={2.5} />
              </View>
              <View>
                <Text className="text-gray-800 font-bold text-base">
                  Trip History
                </Text>
                <Text className="text-gray-500 text-xs">
                  View all your itineraries
                </Text>
              </View>
            </View>
            <Text className="text-gray-300 text-2xl">→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm active:scale-98"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 bg-purple-100 rounded-2xl items-center justify-center">
                <CreditCard size={22} color="#9333EA" strokeWidth={2.5} />
              </View>
              <View>
                <Text className="text-gray-800 font-bold text-base">
                  Billing
                </Text>
                <Text className="text-gray-500 text-xs">
                  Manage payments & invoices
                </Text>
              </View>
            </View>
            <Text className="text-gray-300 text-2xl">→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm active:scale-98"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 bg-gray-100 rounded-2xl items-center justify-center">
                <Text className="text-xl">⚙️</Text>
              </View>
              <View>
                <Text className="text-gray-800 font-bold text-base">
                  Settings
                </Text>
                <Text className="text-gray-500 text-xs">
                  Preferences & notifications
                </Text>
              </View>
            </View>
            <Text className="text-gray-300 text-2xl">→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Out */}
      <View className="px-6 mb-8">
        <TouchableOpacity
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex-row items-center justify-center gap-3 active:bg-red-100"
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
          <Text className="text-red-600 font-bold text-base">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="px-6 pb-12 items-center">
        <View className="w-12 h-1 bg-gray-200 rounded-full mb-4" />
        <Text className="text-gray-400 text-sm font-medium">YatraAI v1.0.0</Text>
        <Text className="text-gray-400 text-xs mt-1">Made with ❤️ in India 🇮🇳</Text>
      </View>
    </ScrollView>
  );
}
