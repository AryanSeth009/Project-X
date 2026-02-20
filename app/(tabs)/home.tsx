import { useState } from 'react';
import {View,Text,TextInput,TouchableOpacity,ScrollView,Alert,Modal} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, MapPin, Calendar, Users, Wallet, Heart, Info, MessageCircle, Home, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
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
  const [stayLocation, setStayLocation] = useState('');
  const [areaOptions, setAreaOptions] = useState<{ name: string; type: string }[]>([]);

  const interestOptions = [
    'Culture',
    'Adventure',
    'Food',
    'Nature',
    'Shopping',
    'Nightlife',
    'History',
    'Relaxation',
    'Beach',
    'Mountain',
    'River',
    'Lake',
    'Forest',
    'Desert',
    'City',
    'Village',
    'Temple',
  ];

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleNext = async () => {
    if (!destination || !startDate || !endDate) {
      Alert.alert('Missing Information', 'Please fill destination and dates.');
      return;
    }
    setStep(2);
    setStayLocation('');
    const dest = destination.toLowerCase();
    if (dest.includes('goa') || dest.includes('manali') || dest.includes('jaipur')) {
      try {
        const { API_BASE_URL } = await import('@/lib/api');
        const res = await fetch(`${API_BASE_URL}/api/geo/areas?destination=${encodeURIComponent(destination)}`);
        const json = await res.json();
        if (json?.areas?.length) setAreaOptions(json.areas);
        else setAreaOptions([]);
      } catch {
        setAreaOptions([]);
      }
    } else {
      setAreaOptions([]);
    }
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
      stayLocation: stayLocation || undefined,
    };

    router.push({
      pathname: '/loading',
      params: { data: JSON.stringify(formData) },
    });
  };

const [showCalendar, setShowCalendar] = useState(false);
const today = new Date();
const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
const [calendarYear, setCalendarYear] = useState(today.getFullYear());


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

                <View className="flex-1">
  <View className="flex-row items-center gap-2 mb-2">
    <Calendar size={18} color="#FF9933" />
    <Text className="font-inter-semibold text-gray-700">Date Range</Text>
  </View>
  <TouchableOpacity
    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
    onPress={() => setShowCalendar(true)}
  >
    <Text className={`font-inter ${startDate && endDate ? 'text-gray-800' : 'text-gray-400'}`}>
      {startDate && endDate
        ? `${startDate}  →  ${endDate}`
        : startDate
        ? `${startDate}  →  Select end`
        : 'Select dates'}
    </Text>
    <Calendar size={16} color="#9CA3AF" />
  </TouchableOpacity>

  {/* Calendar Modal */}
  <Modal
    visible={showCalendar}
    transparent
    animationType="fade"
    onRequestClose={() => setShowCalendar(false)}
  >
    <View className="flex-1 bg-black/50 justify-end">
      <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-inter-semibold text-gray-900 text-lg">Select Dates</Text>
          <TouchableOpacity onPress={() => setShowCalendar(false)}>
            <X size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <Text className="font-inter text-gray-400 text-sm mb-4">
          {!startDate ? 'Pick a start date' : !endDate ? 'Pick an end date' : `${startDate}  →  ${endDate}`}
        </Text>

        {/* Month Navigation */}
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity
            onPress={() => {
              const d = new Date(calendarYear, calendarMonth - 1);
              setCalendarMonth(d.getMonth());
              setCalendarYear(d.getFullYear());
            }}
            className="p-2"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text className="font-inter-semibold text-gray-800 text-base">
            {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const d = new Date(calendarYear, calendarMonth + 1);
              setCalendarMonth(d.getMonth());
              setCalendarYear(d.getFullYear());
            }}
            className="p-2"
          >
            <ChevronRight size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Day Labels */}
        <View className="flex-row mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <View key={day} className="flex-1 items-center">
              <Text className="font-inter text-gray-400 text-xs">{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        {(() => {
          const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
          const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
          const today = new Date().toISOString().split('T')[0];
          const cells: (number | null)[] = [
            ...Array(firstDay).fill(null),
            ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
          ];
          const rows: (number | null)[][] = [];
          for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

          return rows.map((row, ri) => (
            <View key={ri} className="flex-row mb-1">
              {row.map((day, di) => {
                if (!day) return <View key={di} className="flex-1" />;
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isStart = dateStr === startDate;
                const isEnd = dateStr === endDate;
                const isInRange = startDate && endDate && dateStr > startDate && dateStr < endDate;
                const isPast = dateStr < today;

                return (
                  <TouchableOpacity
                    key={di}
                    className={`flex-1 items-center py-2 mx-0.5 rounded-full
                      ${isStart || isEnd ? 'bg-orange-500' : ''}
                      ${isInRange ? 'bg-orange-100 rounded-none' : ''}
                      ${isPast ? 'opacity-30' : ''}`}
                    onPress={() => {
                      if (isPast) return;
                      if (!startDate || (startDate && endDate)) {
                        setStartDate(dateStr);
                        setEndDate('');
                      } else if (dateStr > startDate) {
                        setEndDate(dateStr);
                      } else {
                        setStartDate(dateStr);
                        setEndDate('');
                      }
                    }}
                    disabled={isPast}
                  >
                    <Text className={`font-inter text-sm ${isStart || isEnd ? 'text-white font-inter-semibold' : 'text-gray-700'}`}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ));
        })()}

        {/* Done Button */}
        <TouchableOpacity
          className={`mt-5 rounded-2xl py-3.5 items-center ${startDate && endDate ? 'bg-orange-500' : 'bg-gray-200'}`}
          onPress={() => {
            if (startDate && endDate) setShowCalendar(false);
          }}
          disabled={!startDate || !endDate}
        >
          <Text className={`font-inter-semibold text-base ${startDate && endDate ? 'text-white' : 'text-gray-400'}`}>
            {startDate && endDate ? 'Confirm Dates' : 'Select both dates'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
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
                {areaOptions.length > 0 && (
                  <View>
                    <View className="flex-row items-center gap-2 mb-2">
                      <Home size={18} color="#FF9933" />
                      <Text className="font-inter-semibold text-gray-700">
                        Where are you staying? (optional)
                      </Text>
                    </View>
                    <Text className="font-inter text-xs text-gray-500 mb-2">
                      We'll tailor Day 1 around your area
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      <TouchableOpacity
                        onPress={() => setStayLocation('')}
                        className={`px-4 py-2 rounded-full border-2 ${
                          !stayLocation ? 'bg-saffron-500 border-saffron-500' : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text className={`font-inter-semibold ${!stayLocation ? 'text-white' : 'text-gray-600'}`}>
                          Skip
                        </Text>
                      </TouchableOpacity>
                      {areaOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt.name}
                          onPress={() => setStayLocation(opt.name)}
                          className={`px-4 py-2 rounded-full border-2 ${
                            stayLocation === opt.name ? 'bg-saffron-500 border-saffron-500' : 'bg-white border-gray-300'
                          }`}
                        >
                          <Text className={`font-inter-semibold ${stayLocation === opt.name ? 'text-white' : 'text-gray-600'}`}>
                            {opt.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

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
