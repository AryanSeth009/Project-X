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
          await supabase.auth.signOut();
          reset();
          router.replace('/auth');
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
    <ScrollView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={profile.is_pro ? ['#FFD700', '#FFA500'] : ['#FF9933', '#FFA500']}
        className="pt-12 pb-8 px-6"
      >
        <View className="items-center">
          <View
            className={`w-24 h-24 ${
              profile.is_pro ? 'bg-yellow-400' : 'bg-white'
            } rounded-full items-center justify-center mb-4 shadow-lg`}
          >
            {profile.is_pro ? (
              <Crown size={48} color="#FF9933" />
            ) : (
              <Text className="text-5xl">👤</Text>
            )}
          </View>
          <Text className="text-white text-2xl font-bold mb-1">
            {user.email}
          </Text>
          {profile.is_pro ? (
            <View className="bg-white/20 rounded-full px-4 py-1 flex-row items-center gap-2">
              <Crown size={16} color="#FFFFFF" />
              <Text className="text-white font-bold">Pro Member</Text>
            </View>
          ) : (
            <Text className="text-white/80">Free Plan</Text>
          )}
        </View>
      </LinearGradient>

      <View className="px-6 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-gray-500 mb-1">Available Credits</Text>
              <View className="flex-row items-center gap-2">
                <Sparkles size={24} color="#FF9933" />
                <Text className="text-4xl font-bold text-gray-800">
                  {profile.is_pro ? '∞' : profile.credits}
                </Text>
              </View>
            </View>
            <View>
              <Text className="text-gray-500 mb-1">Itineraries</Text>
              <Text className="text-4xl font-bold text-saffron-500">
                {itineraries.length}
              </Text>
            </View>
          </View>

          {!profile.is_pro && (
            <View className="border-t border-gray-100 pt-4">
              <Text className="text-sm text-gray-600 mb-3">
                1 credit = 1 itinerary generation
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-blue-500 rounded-xl py-3"
                  onPress={() => handleBuyCredits(5, 99)}
                >
                  <Text className="text-white text-center font-bold">
                    5 Credits
                  </Text>
                  <Text className="text-white/80 text-center text-xs">₹99</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-blue-600 rounded-xl py-3"
                  onPress={() => handleBuyCredits(10, 149)}
                >
                  <Text className="text-white text-center font-bold">
                    10 Credits
                  </Text>
                  <Text className="text-white/80 text-center text-xs">₹149</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-blue-700 rounded-xl py-3"
                  onPress={() => handleBuyCredits(25, 299)}
                >
                  <Text className="text-white text-center font-bold">
                    25 Credits
                  </Text>
                  <Text className="text-white/80 text-center text-xs">₹299</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {!profile.is_pro && (
          <View className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 mb-6 shadow-xl">
            <View className="flex-row items-center gap-2 mb-3">
              <Crown size={28} color="#FFFFFF" />
              <Text className="text-white text-2xl font-bold">Upgrade to Pro</Text>
            </View>
            <Text className="text-white/90 mb-4 text-lg">
              Unlock unlimited potential for just ₹199/month
            </Text>
            <View className="gap-2 mb-6">
              {[
                'Unlimited itinerary generation',
                'Priority AI processing',
                'Advanced editing features',
                'Premium destinations database',
                '24/7 Priority support',
                'Export to PDF & more formats',
              ].map((feature, index) => (
                <View key={index} className="flex-row items-center gap-2">
                  <View className="w-5 h-5 bg-white/20 rounded-full items-center justify-center">
                    <Check size={14} color="#FFFFFF" />
                  </View>
                  <Text className="text-white flex-1">{feature}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              className="bg-white rounded-xl py-4 shadow-lg"
              onPress={handleUpgradePro}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Zap size={20} color="#FF9933" />
                <Text className="text-saffron-500 font-bold text-lg">
                  Upgrade Now - ₹199/mo
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {profile.is_pro && (
          <View className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center gap-2 mb-2">
              <Crown size={24} color="#10B981" />
              <Text className="text-green-800 text-xl font-bold">
                Pro Member Benefits
              </Text>
            </View>
            <Text className="text-green-700">
              Your Pro subscription is active. Enjoy unlimited itineraries and premium features!
            </Text>
            {profile.pro_expires_at && (
              <Text className="text-green-600 text-sm mt-2">
                Renews on:{' '}
                {new Date(profile.pro_expires_at).toLocaleDateString('en-IN')}
              </Text>
            )}
          </View>
        )}

        <View className="gap-3 mb-6">
          <TouchableOpacity className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                <History size={20} color="#3B82F6" />
              </View>
              <Text className="text-gray-800 font-semibold">
                Itinerary History
              </Text>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                <CreditCard size={20} color="#9333EA" />
              </View>
              <Text className="text-gray-800 font-semibold">
                Payment History
              </Text>
            </View>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex-row items-center justify-center gap-2"
          onPress={handleSignOut}
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="text-red-600 font-bold">Sign Out</Text>
        </TouchableOpacity>

        <View className="mt-8 items-center">
          <Text className="text-gray-400 text-sm">YatraAI v1.0.0</Text>
          <Text className="text-gray-400 text-xs">Made with 🇮🇳 in India</Text>
        </View>
      </View>
    </ScrollView>
  );
}
