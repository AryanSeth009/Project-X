import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, MapPin, Calendar, Users, Wallet, Heart } from 'lucide-react-native';
import { useStore } from '@/store/useStore';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user } = useStore();
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState('1');
  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const interestOptions = [
    'Culture',
    'Adventure',
    'Food',
    'Nature',
    'Shopping',
    'Nightlife',
    'History',
    'Relaxation',
  ];

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleGenerate = () => {
    if (!destination || !startDate || !endDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (!profile || profile.credits < 1) {
      Alert.alert(
        'No Credits',
        'You need credits to generate an itinerary. Purchase credits or upgrade to Pro!'
      );
      return;
    }

    const formData = {
      destination,
      startDate,
      endDate,
      travelers,
      budget,
      interests,
    };

    router.push({
      pathname: '/loading',
      params: { data: JSON.stringify(formData) },
    });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#FF9933', '#FFA500']}
        className="pt-12 pb-8 px-6"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-white text-3xl font-bold">YatraAI</Text>
            <Text className="text-white/90 text-sm">AI Travel Planner</Text>
          </View>
          <View className="bg-white/20 rounded-full px-4 py-2 flex-row items-center gap-2">
            <Sparkles size={16} color="#FFFFFF" />
            <Text className="text-white font-bold">
              {profile?.credits || 0} Credits
            </Text>
          </View>
        </View>

        <View className="bg-white/10 rounded-2xl p-4 backdrop-blur-lg">
          <Text className="text-white text-xl font-bold mb-2">
            Plan Your Dream Trip
          </Text>
          <Text className="text-white/80">
            Tell us where you want to go and we'll create a perfect itinerary
          </Text>
        </View>
      </LinearGradient>

      <View className="px-6 py-6">
        <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-6">
            Trip Details
          </Text>

          <View className="gap-5">
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <MapPin size={18} color="#FF9933" />
                <Text className="text-gray-700 font-semibold">Destination</Text>
              </View>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                placeholder="e.g., Goa, Kerala, Rajasthan"
                value={destination}
                onChangeText={setDestination}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <Calendar size={18} color="#FF9933" />
                  <Text className="text-gray-700 font-semibold">Start Date</Text>
                </View>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <Calendar size={18} color="#FF9933" />
                  <Text className="text-gray-700 font-semibold">End Date</Text>
                </View>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="YYYY-MM-DD"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <Users size={18} color="#FF9933" />
                  <Text className="text-gray-700 font-semibold">Travelers</Text>
                </View>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="1"
                  value={travelers}
                  onChangeText={setTravelers}
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <Wallet size={18} color="#FF9933" />
                  <Text className="text-gray-700 font-semibold">Budget (₹)</Text>
                </View>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="50000"
                  value={budget}
                  onChangeText={setBudget}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View>
              <View className="flex-row items-center gap-2 mb-3">
                <Heart size={18} color="#FF9933" />
                <Text className="text-gray-700 font-semibold">Your Interests</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full border-2 ${
                      interests.includes(interest)
                        ? 'bg-saffron-500 border-saffron-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        interests.includes(interest)
                          ? 'text-white'
                          : 'text-gray-600'
                      }`}
                    >
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            className="bg-saffron-500 rounded-xl py-4 mt-6 shadow-md"
            onPress={handleGenerate}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Sparkles size={20} color="#FFFFFF" />
              <Text className="text-white text-center font-bold text-lg">
                Generate Itinerary (1 Credit)
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="bg-gradient-to-r from-saffron-50 to-green-50 rounded-2xl p-6 mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            🎉 Demo Itinerary
          </Text>
          <Text className="text-gray-600 mb-4">
            See how YatraAI creates perfect travel plans. Check out our sample Goa itinerary!
          </Text>
          <TouchableOpacity
            className="bg-white border-2 border-saffron-500 rounded-xl py-3"
            onPress={() => router.push('/(tabs)/itinerary')}
          >
            <Text className="text-saffron-500 text-center font-bold">
              View Demo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
