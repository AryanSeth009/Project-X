import { useState, useMemo, useRef, useEffect } from 'react';
import {View,Text,TextInput,TouchableOpacity,ScrollView,Alert,Modal} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, MapPin, Calendar, Users, Wallet, Heart, Info, MessageCircle, Home, X, ChevronLeft, ChevronRight, ChevronDown, TreePalm, Mountain, Landmark, Ship, Sun } from 'lucide-react-native';
import { useStore } from '@/store/useStore';

// Destinations supported by the app (matches geo-service / itinerary data)
const DESTINATIONS = ['Goa', 'Manali', 'Jaipur', 'Kerala', 'Rajasthan'];

const DESTINATION_DESCRIPTIONS: Record<string, string> = {
  Goa: 'Beaches, chill, clubs',
  Manali: 'Mountains, adventure, snow',
  Jaipur: 'Heritage, palaces, bazaars',
  Kerala: 'Backwaters, nature, houseboats',
  Rajasthan: 'Desert, forts, culture',
};

const ICON_COLOR = '#4CAF50';

const DESTINATION_ICONS: Record<string, typeof TreePalm> = {
  Goa: TreePalm,
  Manali: Mountain,
  Jaipur: Landmark,
  Kerala: Ship,
  Rajasthan: Sun,
};

// Interests that are actually available at each destination (aligned with geo-service tags & attractions)
const DESTINATION_INTERESTS: Record<string, string[]> = {
  Goa: [
    'Beach',
    'Nightlife',
    'Relaxation',
    'Food',
    'Nature',
    'Shopping',
    'Culture',
    'History',
  ],
  Manali: [
    'Mountain',
    'Adventure',
    'Nature',
    'Food',
    'Shopping',
    'Relaxation',
    'History',
    'Culture',
  ],
  Jaipur: [
    'History',
    'Culture',
    'Shopping',
    'Food',
    'City',
    'Temple',
  ],
  Kerala: [
    'Nature',
    'River',
    'Lake',
    'Forest',
    'Relaxation',
    'Culture',
    'Food',
  ],
  Rajasthan: [
    'Desert',
    'History',
    'Culture',
    'Adventure',
    'Shopping',
    'Food',
    'City',
    'Temple',
  ],
};

// Levenshtein distance for fuzzy typo matching (e.g. "Gooa" -> "Goa")
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  const dp: number[][] = Array(an + 1).fill(null).map(() => Array(bn + 1).fill(0));
  for (let i = 0; i <= an; i++) dp[i][0] = i;
  for (let j = 0; j <= bn; j++) dp[0][j] = j;
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[an][bn];
}

function filterDestinations(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...DESTINATIONS];
  const exact: string[] = [];
  const fuzzy: { name: string; dist: number }[] = [];
  const seen = new Set<string>();
  for (const name of DESTINATIONS) {
    const lower = name.toLowerCase();
    if (lower === q || lower.startsWith(q) || lower.includes(q)) {
      if (!seen.has(name)) {
        exact.push(name);
        seen.add(name);
      }
    } else {
      const dist = levenshtein(q, lower);
      const maxDist = q.length <= 4 ? 1 : 2;
      if (dist <= maxDist && !seen.has(name)) {
        fuzzy.push({ name, dist });
        seen.add(name);
      }
    }
  }
  fuzzy.sort((a, b) => a.dist - b.dist);
  return [...exact, ...fuzzy.map((x) => x.name)];
}

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
  const [itineraryStyle, setItineraryStyle] = useState<'day-wise' | 'top-10'>('day-wise');
  const [areaOptions, setAreaOptions] = useState<{ name: string; type: string }[]>([]);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const destinationInputRef = useRef<TextInput>(null);
  const destinationBlurRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredDestinations = useMemo(
    () => filterDestinations(destination),
    [destination]
  );
  const isValidDestination = useMemo(
    () => DESTINATIONS.some((d) => d.toLowerCase() === destination.trim().toLowerCase()),
    [destination]
  );

  // Only show interests that exist at the selected destination (step 2)
  const interestOptionsForDestination = useMemo(() => {
    if (!destination.trim()) return [];
    const key = DESTINATIONS.find((d) => d.toLowerCase() === destination.trim().toLowerCase());
    if (!key || !DESTINATION_INTERESTS[key]) return [];
    return DESTINATION_INTERESTS[key];
  }, [destination]);

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

  // When destination or step changes in step 2, keep only interests valid for that destination
  useEffect(() => {
    if (step !== 2) return;
    const key = DESTINATIONS.find((d) => d.toLowerCase() === destination.trim().toLowerCase());
    const allowed = key ? (DESTINATION_INTERESTS[key] ?? []) : [];
    if (allowed.length === 0) return;
    setInterests((prev) => prev.filter((i) => allowed.includes(i)));
  }, [destination, step]);

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
    if (!isValidDestination) {
      Alert.alert('Select a destination', 'Please choose a destination from the dropdown (e.g. Goa, Kerala, Rajasthan).');
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
    if (!isValidDestination) {
      Alert.alert('Select a destination', 'Please choose a destination from the dropdown (e.g. Goa, Kerala, Rajasthan).');
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
      itineraryStyle,
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
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: '#1A1C19' }}
      scrollEnabled={!showDestinationDropdown}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient
        colors={['#242922', '#1A1C19']}
        className="pt-12 pb-8 px-6"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="font-inter-bold text-3xl" style={{ color: '#F5F5DC' }}>SafarYatraAI</Text>
            <Text className="font-inter text-sm" style={{ color: 'rgba(245, 245, 220, 0.9)' }}>Your One Tap Itinerary Planner</Text>
          </View>
          <View className="rounded-full px-4 py-2 flex-row items-center gap-2" style={{ backgroundColor: 'rgba(76, 175, 80, 0.25)' }}>
            <Sparkles size={16} color="#4CAF50" />
            <Text className="font-inter-semibold" style={{ color: '#F5F5DC' }}>AI Trip Planner</Text>
          </View>
        </View>

        <View className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(36, 41, 34, 0.9)' }}>
          <Text className="font-inter-semibold text-xl mb-2" style={{ color: '#F5F5DC' }}>
            Plan Your Dream Trip
          </Text>
          <Text className="font-inter" style={{ color: 'rgba(245, 245, 220, 0.8)' }}>
            Step {step} of 2 — quick details, then personalize.
          </Text>
        </View>
      </LinearGradient>

      <View className="px-6 py-6" style={{ backgroundColor: '#1A1C19' }}>
        <View className="rounded-3xl p-6 shadow-lg mb-6" style={{ backgroundColor: '#242922' }}>
          <Text className="font-inter-bold text-2xl mb-6" style={{ color: '#F5F5DC' }}>
            Trip Details
          </Text>

          <View className="gap-5">
            {step === 1 ? (
              <>
                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <MapPin size={18} color="#F39C12" />
                    <Text className="font-inter-semibold" style={{ color: '#F5F5DC' }}>
                      Where do you wanna go?
                    </Text>
                  </View>
                  <View className="relative" style={{ zIndex: showDestinationDropdown ? 1000 : 0 }} collapsable={false}>
                    <TextInput
                      ref={destinationInputRef}
                      className="font-inter rounded-t-xl px-4 py-3 pr-10"
                      style={{
                        backgroundColor: '#1A1C19',
                        borderWidth: 1,
                        borderColor: showDestinationDropdown ? '#4CAF50' : '#242922',
                        color: '#F5F5DC',
                        borderBottomWidth: showDestinationDropdown && filteredDestinations.length > 0 ? 0 : 1,
                      }}
                      placeholder="Type or select: Goa, Kerala, Rajasthan..."
                      placeholderTextColor="#9CA3AF"
                      value={destination}
                      onChangeText={(text) => {
                        setDestination(text);
                        setShowDestinationDropdown(true);
                      }}
                      onFocus={() => {
                        if (destinationBlurRef.current) {
                          clearTimeout(destinationBlurRef.current);
                          destinationBlurRef.current = null;
                        }
                        setShowDestinationDropdown(true);
                      }}
                      onBlur={() => {
                        destinationBlurRef.current = setTimeout(() => {
                          setShowDestinationDropdown(false);
                          destinationBlurRef.current = null;
                        }, 500);
                      }}
                    />
                    <View className="absolute right-3 top-0 bottom-0 justify-center pointer-events-none">
                      <ChevronDown size={20} color="#9CA3AF" />
                    </View>
                    {showDestinationDropdown && (
                      <View
                        className="rounded-b-xl border-x border-b overflow-hidden"
                        style={{
                          backgroundColor: '#1A1C19',
                          borderColor: '#242922',
                          borderWidth: 1,
                          maxHeight: 260,
                          zIndex: 1001,
                          elevation: 8,
                        }}
                        pointerEvents="auto"
                      >
                        <ScrollView
                          keyboardShouldPersistTaps="always"
                          nestedScrollEnabled
                          scrollEnabled={true}
                          style={{ maxHeight: 260 }}
                          showsVerticalScrollIndicator={true}
                        >
                          {filteredDestinations.length === 0 ? (
                            <View className="px-4 py-3">
                              <Text className="font-inter text-sm" style={{ color: '#9CA3AF' }}>
                                No matches. Try: Goa, Kerala, Rajasthan, Manali, Jaipur
                              </Text>
                            </View>
                          ) : (
                            filteredDestinations.map((name) => {
                              const IconComponent = DESTINATION_ICONS[name];
                              return (
                                <TouchableOpacity
                                  key={name}
                                  activeOpacity={0.7}
                                  className="px-4 py-3.5 flex-row items-center gap-3"
                                  style={{
                                    backgroundColor: name === destination ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#242922',
                                    minHeight: 56,
                                  }}
                                  onPress={() => {
                                    if (destinationBlurRef.current) {
                                      clearTimeout(destinationBlurRef.current);
                                      destinationBlurRef.current = null;
                                    }
                                    setDestination(name);
                                    setShowDestinationDropdown(false);
                                    destinationInputRef.current?.blur();
                                  }}
                                >
                                  {IconComponent ? (
                                    <View style={{ width: 28, alignItems: 'center' }}>
                                      <IconComponent size={22} color={ICON_COLOR} />
                                    </View>
                                  ) : null}
                                  <View className="flex-1">
                                    <Text className="font-inter" style={{ color: '#F5F5DC' }}>
                                      {name}
                                    </Text>
                                    <Text className="font-inter text-xs mt-0.5" style={{ color: '#9CA3AF' }} numberOfLines={1}>
                                      {DESTINATION_DESCRIPTIONS[name] ?? ''}
                                    </Text>
                                  </View>
                                  {name === destination ? (
                                    <Text className="font-inter-semibold text-xs" style={{ color: '#4CAF50' }}>Selected</Text>
                                  ) : null}
                                </TouchableOpacity>
                              );
                            })
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  {destination.length > 0 && !isValidDestination && (
                    <Text className="font-inter text-xs mt-1.5" style={{ color: '#F39C12' }}>
                      Select a destination from the dropdown to continue
                    </Text>
                  )}
                </View>

                <View>
                  <View className="flex-row items-center gap-2 mb-3">
                    <Sparkles size={18} color="#F39C12" />
                    <Text className="font-inter-semibold" style={{ color: '#F5F5DC' }}>
                      Itinerary Style
                    </Text>
                  </View>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setItineraryStyle('day-wise')}
                      className="flex-1 p-4 rounded-2xl border-2"
                      style={{
                        backgroundColor: itineraryStyle === 'day-wise' ? 'rgba(243, 156, 18, 0.2)' : '#1A1C19',
                        borderColor: itineraryStyle === 'day-wise' ? '#F39C12' : '#242922'
                      }}
                    >
                      <View className="flex-row items-center gap-2 mb-1">
                        <Calendar size={18} color={itineraryStyle === 'day-wise' ? '#F39C12' : '#9CA3AF'} />
                        <Text className="font-inter-bold" style={{ color: itineraryStyle === 'day-wise' ? '#F5F5DC' : '#9CA3AF' }}>
                          Daily Plan
                        </Text>
                      </View>
                      <Text className="font-inter text-xs leading-4" style={{ color: itineraryStyle === 'day-wise' ? 'rgba(245, 245, 220, 0.7)' : '#9CA3AF' }}>
                        Day-by-day complete schedule
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setItineraryStyle('top-10')}
                      className="flex-1 p-4 rounded-2xl border-2"
                      style={{
                        backgroundColor: itineraryStyle === 'top-10' ? 'rgba(76, 175, 80, 0.2)' : '#1A1C19',
                        borderColor: itineraryStyle === 'top-10' ? '#4CAF50' : '#242922'
                      }}
                    >
                      <View className="flex-row items-center gap-2 mb-1">
                        <Sparkles size={18} color={itineraryStyle === 'top-10' ? '#4CAF50' : '#9CA3AF'} />
                        <Text className="font-inter-bold" style={{ color: itineraryStyle === 'top-10' ? '#F5F5DC' : '#9CA3AF' }}>
                          Top 10 Spots
                        </Text>
                      </View>
                      <Text className="font-inter text-xs leading-4" style={{ color: itineraryStyle === 'top-10' ? 'rgba(245, 245, 220, 0.7)' : '#9CA3AF' }}>
                        Curated list of best places
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-1">
  <View className="flex-row items-center gap-2 mb-2">
    <Calendar size={18} color="#F39C12" />
    <Text className="font-inter-semibold" style={{ color: '#F5F5DC' }}>Date Range</Text>
  </View>
  <TouchableOpacity
    className="rounded-xl px-4 py-3 flex-row items-center justify-between"
    style={{ backgroundColor: '#1A1C19', borderWidth: 1, borderColor: '#242922' }}
    onPress={() => setShowCalendar(true)}
  >
    <Text className="font-inter" style={{ color: startDate && endDate ? '#F5F5DC' : '#9CA3AF' }}>
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
    <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <View className="rounded-t-3xl px-5 pt-5 pb-8" style={{ backgroundColor: '#242922' }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-inter-semibold text-lg" style={{ color: '#F5F5DC' }}>Select Dates</Text>
          <TouchableOpacity onPress={() => setShowCalendar(false)}>
            <X size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        <Text className="font-inter text-sm mb-4" style={{ color: '#9CA3AF' }}>
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
            <ChevronLeft size={20} color="#F5F5DC" />
          </TouchableOpacity>
          <Text className="font-inter-semibold text-base" style={{ color: '#F5F5DC' }}>
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
            <ChevronRight size={20} color="#F5F5DC" />
          </TouchableOpacity>
        </View>

        {/* Day Labels */}
        <View className="flex-row mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <View key={day} className="flex-1 items-center">
              <Text className="font-inter text-xs" style={{ color: '#9CA3AF' }}>{day}</Text>
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
                    className={`flex-1 items-center py-2 mx-0.5 rounded-full ${isPast ? 'opacity-30' : ''}`}
                    style={
                      isStart || isEnd
                        ? { backgroundColor: '#4CAF50' }
                        : isInRange
                        ? { backgroundColor: 'rgba(76, 175, 80, 0.3)' }
                        : {}
                    }
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
                    <Text className={`font-inter text-sm ${isStart || isEnd ? 'font-inter-semibold' : ''}`} style={{ color: isStart || isEnd ? '#1A1C19' : '#F5F5DC' }}>
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
          className="mt-5 rounded-2xl py-3.5 items-center"
          style={{ backgroundColor: startDate && endDate ? '#4CAF50' : '#1A1C19' }}
          onPress={() => {
            if (startDate && endDate) setShowCalendar(false);
          }}
          disabled={!startDate || !endDate}
        >
          <Text className="font-inter-semibold text-base" style={{ color: startDate && endDate ? '#1A1C19' : '#9CA3AF' }}>
            {startDate && endDate ? 'Confirm Dates' : 'Select both dates'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
</View>

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Users size={18} color="#F39C12" />
                    <Text className="font-inter-semibold" style={{ color: '#F5F5DC' }}>
                      No. of travelers
                    </Text>
                  </View>
                  <TextInput
                    className="font-inter rounded-xl px-4 py-3"
                    style={{ backgroundColor: '#1A1C19', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                    value={travelers}
                    onChangeText={setTravelers}
                    keyboardType="number-pad"
                  />

                </View>

                <TouchableOpacity
                  className="rounded-xl py-4 mt-2 shadow-md"
                  style={{ backgroundColor: '#4CAF50' }}
                  onPress={handleNext}
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Text className="font-inter-bold text-center text-lg" style={{ color: '#1A1C19' }}>
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
                      <Home size={18} color="#F39C12" />
                      <Text className="font-inter-semibold" style={{ color: '#F5F5DC' }}>
                        Where are you staying? (optional)
                      </Text>
                    </View>
                    <Text className="font-inter text-xs mb-2" style={{ color: '#9CA3AF' }}>
                      We'll tailor Day 1 around your area
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      <TouchableOpacity
                        onPress={() => setStayLocation('')}
                        className="px-4 py-2 rounded-full border-2"
                        style={{
                          backgroundColor: !stayLocation ? '#4CAF50' : '#1A1C19',
                          borderColor: !stayLocation ? '#4CAF50' : '#242922',
                        }}
                      >
                        <Text className="font-inter-semibold" style={{ color: !stayLocation ? '#1A1C19' : '#F5F5DC' }}>
                          Skip
                        </Text>
                      </TouchableOpacity>
                      {areaOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt.name}
                          onPress={() => setStayLocation(opt.name)}
                          className="px-4 py-2 rounded-full border-2"
                          style={{
                            backgroundColor: stayLocation === opt.name ? '#4CAF50' : '#1A1C19',
                            borderColor: stayLocation === opt.name ? '#4CAF50' : '#242922',
                          }}
                        >
                          <Text className="font-inter-semibold" style={{ color: stayLocation === opt.name ? '#1A1C19' : '#F5F5DC' }}>
                            {opt.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Heart size={18} color="#F39C12" />
                    <Text className="font-inter-semibold" style={{ color: '#F5F5DC' }}>
                      What are you interested in?
                    </Text>
                  </View>
                  <Text className="font-inter text-xs mb-3" style={{ color: '#9CA3AF' }}>
                    Only interests available in {destination}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {interestOptionsForDestination.map((interest) => (
                      <TouchableOpacity
                        key={interest}
                        onPress={() => toggleInterest(interest)}
                        className="px-4 py-2 rounded-full border-2"
                        style={{
                          backgroundColor: interests.includes(interest) ? '#4CAF50' : '#1A1C19',
                          borderColor: interests.includes(interest) ? '#4CAF50' : '#242922',
                        }}
                      >
                        <Text
                          className="font-inter-semibold"
                          style={{ color: interests.includes(interest) ? '#1A1C19' : '#F5F5DC' }}
                        >
                          {interest}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Wallet size={18} color="#F39C12" />
                    <Text className="font-inter-semibold" style={{ color: '#F5F5DC' }}>
                      Budget (optional)
                    </Text>
                  </View>
                  <TextInput
                    className="font-inter rounded-xl px-4 py-3"
                    style={{ backgroundColor: '#1A1C19', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                    placeholder="e.g., 50000"
                    placeholderTextColor="#9CA3AF"
                    value={budget}
                    onChangeText={setBudget}
                    keyboardType="number-pad"
                  />
                  <View className="flex-row items-center gap-2 mt-2">
                    <Info size={14} color="#9CA3AF" />
                    <Text className="font-inter text-xs flex-1" style={{ color: '#9CA3AF' }}>
                      Leave blank if you want a balanced plan.
                    </Text>
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <MessageCircle size={18} color="#F39C12" />
                    <Text className="font-inter-semibold" style={{ color: '#F5F5DC' }}>
                      Personalize (optional)
                    </Text>
                  </View>
                  <TextInput
                    className="font-inter rounded-xl px-4 py-3"
                    style={{ backgroundColor: '#1A1C19', borderWidth: 1, borderColor: '#242922', color: '#F5F5DC' }}
                    placeholder="Chat-style prompt… e.g., 'I love hidden cafes, no temples, and I want a chill pace.'"
                    placeholderTextColor="#9CA3AF"
                    value={personalPrompt}
                    onChangeText={setPersonalPrompt}
                    multiline
                  />
                </View>

                <View className="flex-row gap-3 mt-2">
                  <TouchableOpacity
                    className="flex-1 border-2 rounded-xl py-4"
                    style={{ backgroundColor: '#1A1C19', borderColor: '#242922' }}
                    onPress={() => setStep(1)}
                  >
                    <Text className="font-inter-bold text-center text-lg" style={{ color: '#F5F5DC' }}>
                      Back
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 rounded-xl py-4 shadow-md"
                    style={{ backgroundColor: '#4CAF50' }}
                    onPress={handleGenerate}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <Sparkles size={20} color="#1A1C19" />
                      <Text className="font-inter-bold text-center text-lg" style={{ color: '#1A1C19' }}>
                        Generate Itinerary
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        <View className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'rgba(76, 175, 80, 0.15)', borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.3)' }}>
          <Text className="font-inter-bold text-lg mb-3" style={{ color: '#F5F5DC' }}>
            🎉 Demo Itinerary
          </Text>
          <Text className="font-inter mb-4" style={{ color: 'rgba(245, 245, 220, 0.8)' }}>
            See how YatraAI creates perfect travel plans. Check out our sample Goa itinerary!
          </Text>
          <TouchableOpacity
            className="border-2 rounded-xl py-3"
            style={{ backgroundColor: '#242922', borderColor: '#4CAF50' }}
            onPress={() => router.push('/(tabs)/itinerary')}
          >
            <Text className="font-inter-bold text-center" style={{ color: '#4CAF50' }}>
              View Demo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
