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
import { Sparkles, MapPin, Calendar, Users, Wallet, Heart, Info, MessageCircle } from 'lucide-react-native';
import { useStore } from '@/store/useStore';

export default function HomeScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState('1');
  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [personalPrompt, setPersonalPrompt] = useState('');

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

  const handleNext = () => {
    if (!destination || !startDate || !endDate) {
      Alert.alert('Missing Information', 'Please fill destination and dates.');
      return;
    }
    setStep(2);
  };

  const handleGenerate = () => {
    if (!destination || !startDate || !endDate) {
      Alert.alert('Missing Information', 'Please fill destination and dates.');
      return;
    }

    const formData = {
      destination,
      startDate,
      endDate,
      travelers,
      budget,
      interests,
      personalPrompt,
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
            <Text className="font-inter-bold text-white text-3xl">Project X</Text>
            <Text className="font-inter text-white/90 text-sm">-description-</Text>
          </View>
          <View className="bg-white/20 rounded-full px-4 py-2 flex-row items-center gap-2">
            <Sparkles size={16} color="#FFFFFF" />
            <Text className="font-inter-semibold text-white">AI Trip Planner</Text>
          </View>
        </View>

        <View className="bg-[white/10] rounded-2xl p-4 backdrop-blur-lg">
          <Text className="font-inter-semibold text-white text-xl mb-2">
            Plan Your Dream Trip
          </Text>
          <Text className="font-inter text-white/80">
            Step {step} of 2 — quick details, then personalize.
          </Text>
        </View>
      </LinearGradient>

      <View className="px-6 py-6 bg-gradient-to-b from-[#E8D5C0] to-[#F2EFE7]">
        <View className="bg-[#F2EFE7] rounded-3xl p-6 shadow-lg mb-6">
          <Text className="font-inter-bold text-2xl text-gray-800 mb-6">
            Trip Details
          </Text>

          <View className="gap-5">
            {step === 1 ? (
              <>
                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <MapPin size={18} color="#FF9933" />
                    <Text className="font-inter-semibold text-gray-700">
                      Where do you wanna go?
                    </Text>
                  </View>
                  <TextInput
                    className="font-inter bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="e.g., Goa, Kerala, Rajasthan"
                    value={destination}
                    onChangeText={setDestination}
                  />
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Calendar size={18} color="#FF9933" />
                      <Text className="font-inter-semibold text-gray-700">Start</Text>
                    </View>
                    <TextInput
                      className="font-inter bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                      placeholder="YYYY-MM-DD"
                      value={startDate}
                      onChangeText={setStartDate}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <Calendar size={18} color="#FF9933" />
                      <Text className="font-inter-semibold text-gray-700">End</Text>
                    </View>
                    <TextInput
                      className="font-inter bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                      placeholder="YYYY-MM-DD"
                      value={endDate}
                      onChangeText={setEndDate}
                    />
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Users size={18} color="#FF9933" />
                    <Text className="font-inter-semibold text-gray-700">
                      No. of travelers
                    </Text>
                  </View>
                  <TextInput
                    className="font-inter bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="1"
                    value={travelers}
                    onChangeText={setTravelers}
                    keyboardType="number-pad"
                  />

                </View>

                <TouchableOpacity
                  className="bg-saffron-500 rounded-xl py-4 mt-2 shadow-md"
                  onPress={handleNext}
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Text className="font-inter-bold text-white text-center text-lg">
                      Next
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View>
                  <View className="flex-row items-center gap-2 mb-3">
                    <Heart size={18} color="#FF9933" />
                    <Text className="font-inter-semibold text-gray-700">
                      What are you interested in?
                    </Text>
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
                          className={`font-inter-semibold ${
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

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Wallet size={18} color="#FF9933" />
                    <Text className="font-inter-semibold text-gray-700">
                      Budget (optional)
                    </Text>
                  </View>
                  <TextInput
                    className="font-inter bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="e.g., 50000"
                    value={budget}
                    onChangeText={setBudget}
                    keyboardType="number-pad"
                  />
                  <View className="flex-row items-center gap-2 mt-2">
                    <Info size={14} color="#6B7280" />
                    <Text className="font-inter text-xs text-gray-500 flex-1">
                      Leave blank if you want a balanced plan.
                    </Text>
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <MessageCircle size={18} color="#FF9933" />
                    <Text className="font-inter-semibold text-gray-700">
                      Personalize (optional)
                    </Text>
                  </View>
                  <TextInput
                    className="font-inter bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="Chat-style prompt… e.g., 'I love hidden cafes, no temples, and I want a chill pace.'"
                    value={personalPrompt}
                    onChangeText={setPersonalPrompt}
                    multiline
                  />
                </View>

                <View className="flex-row gap-3 mt-2">
                  <TouchableOpacity
                    className="flex-1 bg-white border-2 border-gray-200 rounded-xl py-4"
                    onPress={() => setStep(1)}
                  >
                    <Text className="font-inter-bold text-gray-700 text-center text-lg">
                      Back
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-saffron-500 rounded-xl py-4 shadow-md"
                    onPress={handleGenerate}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <Sparkles size={20} color="#FFFFFF" />
                      <Text className="font-inter-bold text-white text-center text-lg">
                        Generate Itinerary
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        <View className="bg-gradient-to-r from-saffron-50 to-green-50 rounded-2xl p-6 mb-6">
          <Text className="font-inter-bold text-lg text-gray-800 mb-3">
            🎉 Demo Itinerary
          </Text>
          <Text className="font-inter text-gray-600 mb-4">
            See how YatraAI creates perfect travel plans. Check out our sample Goa itinerary!
          </Text>
          <TouchableOpacity
            className="bg-white border-2 border-saffron-500 rounded-xl py-3"
            onPress={() => router.push('/(tabs)/itinerary')}
          >
            <Text className="font-inter-bold text-saffron-500 text-center">
              View Demo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
