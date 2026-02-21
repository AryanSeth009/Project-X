import { useState, useMemo, useRef, useEffect } from 'react';
import {View,Text,TextInput,TouchableOpacity,ScrollView,Alert,Modal} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, MapPin, Calendar, Users, Wallet, Heart, Info, MessageCircle, Home, X, ChevronLeft, ChevronRight, ChevronDown, TreePalm, Mountain, Landmark, Ship, Sun, Train, Plane, Search, Ticket, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/context/ThemeContext';

// States and Cities supported by the app (matches geo-service / itinerary data)
const STATES = ['Goa', 'Himachal Pradesh', 'Jammu & Kashmir', 'Kerala', 'Rajasthan'];

const STATE_CITIES: Record<string, string[]> = {
  'Goa': ['Baga', 'Anjuna', 'Palolem', 'Calangute', 'Goa'],
  'Himachal Pradesh': ['Manali', 'Shimla'],
  'Jammu & Kashmir': ['Srinagar', 'Gulmarg', 'Pahalgam', 'Kashmir'],
  'Kerala': ['Alleppey', 'Munnar', 'Kochi', 'Varkala', 'Thekkady', 'Wayanad', 'Kovalam Beach', 'Kerala'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer'],
};

// All available destinations to support existing logic if needed
const DESTINATIONS = Object.values(STATE_CITIES).flat();

const DESTINATION_DESCRIPTIONS: Record<string, string> = {
  Goa: 'Beaches, chill, clubs',
  Baga: 'Vibrant nightlife, water sports',
  Anjuna: 'Flea markets, trance, backpackers',
  Palolem: 'Peaceful beaches, yoga, nature',
  Calangute: 'Shopping, commercial beach, food',
  Manali: 'Mountains, adventure, snow',
  Shimla: 'Colonial charm, hills, snow',
  Kashmir: 'Paradise on earth, valleys, lakes',
  Srinagar: 'Houseboats, Dal Lake, gardens',
  Gulmarg: 'Skiing, gondola, snow',
  Pahalgam: 'Valleys, rivers, trekking',
  Jaipur: 'Heritage, palaces, bazaars',
  Jodhpur: 'Blue city, forts, culture',
  Udaipur: 'City of lakes, romance, palaces',
  Jaisalmer: 'Golden city, desert, camel safari',
  Kerala: 'Backwaters, nature, houseboats',
  Alleppey: 'Houseboats, backwaters, serene',
  Munnar: 'Tea estates, misty hills, nature',
  Kochi: 'Heritage, history, Chinese fishing nets',
  Varkala: 'Cliffs, beaches, yoga retreats',
  Thekkady: 'Wildlife, spice plantations, nature',
  Wayanad: 'Hills, caves, waterfalls',
  'Kovalam Beach': 'Lighthouse, surfing, beaches',
  Rajasthan: 'Desert, forts, culture', // Fallback
};


const DESTINATION_ICONS: Record<string, typeof TreePalm> = {
  Goa: TreePalm,
  Baga: TreePalm,
  Anjuna: TreePalm,
  Palolem: TreePalm,
  Calangute: TreePalm,
  Manali: Mountain,
  Shimla: Mountain,
  Kashmir: Mountain,
  Srinagar: Ship,
  Gulmarg: Mountain,
  Pahalgam: Mountain,
  Jaipur: Landmark,
  Jodhpur: Landmark,
  Udaipur: Landmark,
  Jaisalmer: Sun,
  Kerala: Ship,
  Alleppey: Ship,
  Munnar: Mountain,
  Kochi: Landmark,
  Varkala: TreePalm,
  Thekkady: TreePalm,
  Wayanad: Mountain,
  'Kovalam Beach': TreePalm,
  Rajasthan: Sun,
};

// Common interets array for parent propagation
const goaInterests = ['Beach', 'Nightlife', 'Relaxation', 'Food', 'Nature', 'Shopping', 'Culture', 'History'];
const keralaInterests = ['Nature', 'River', 'Lake', 'Forest', 'Relaxation', 'Culture', 'Food'];
const kashmirInterests = ['Mountain', 'Lake', 'Nature', 'Culture', 'Food', 'Shopping', 'Relaxation'];

// Interests that are actually available at each destination (aligned with geo-service tags & attractions)
const DESTINATION_INTERESTS: Record<string, string[]> = {
  Goa: goaInterests,
  Baga: goaInterests,
  Anjuna: goaInterests,
  Palolem: goaInterests,
  Calangute: goaInterests,
  Manali: [
    'Mountain', 'Adventure', 'Nature', 'Food', 'Shopping', 'Relaxation', 'History', 'Culture',
  ],
  Shimla: [
    'Mountain', 'History', 'Culture', 'Nature', 'Shopping', 'Relaxation',
  ],
  Kashmir: kashmirInterests,
  Srinagar: kashmirInterests,
  Gulmarg: kashmirInterests,
  Pahalgam: kashmirInterests,
  Jaipur: [
    'History', 'Culture', 'Shopping', 'Food', 'City', 'Temple',
  ],
  Jodhpur: [
    'History', 'Culture', 'Shopping', 'Food', 'Adventure', 'City',
  ],
  Udaipur: [
    'Lake', 'History', 'Culture', 'Food', 'Relaxation', 'Shopping', 'City',
  ],
  Jaisalmer: [
    'Desert', 'Adventure', 'History', 'Culture', 'Shopping',
  ],
  Kerala: keralaInterests,
  Alleppey: keralaInterests,
  Munnar: keralaInterests,
  Kochi: keralaInterests,
  Varkala: keralaInterests,
  Thekkady: keralaInterests,
  Wayanad: keralaInterests,
  'Kovalam Beach': keralaInterests,
  Rajasthan: [
    'Desert', 'History', 'Culture', 'Adventure', 'Shopping', 'Food', 'City', 'Temple',
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
  const { colors } = useTheme();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedState, setSelectedState] = useState('');
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
  // Step 3: Tickets & transport
  const [checkTickets, setCheckTickets] = useState<boolean | null>(null);
  const [departurePlace, setDeparturePlace] = useState('');
  const [transportOption, setTransportOption] = useState<'train' | 'flight' | ''>('');
  const [transportSchedule, setTransportSchedule] = useState<Array<{ type: string; name: string; departure: string; arrival: string; price: number; class?: string }>>([]);
  const [transportLoading, setTransportLoading] = useState(false);
  const [highDemandNotice, setHighDemandNotice] = useState(false);
  
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  
  const stateInputRef = useRef<TextInput>(null);
  const stateBlurRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const destinationInputRef = useRef<TextInput>(null);
  const destinationBlurRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredStates = useMemo(() => {
    const q = selectedState.trim().toLowerCase();
    if (!q) return STATES;
    return STATES.filter(s => s.toLowerCase().includes(q));
  }, [selectedState]);

  const isValidState = useMemo(
    () => STATES.some((s) => s.toLowerCase() === selectedState.trim().toLowerCase()),
    [selectedState]
  );

  const activeCityList = useMemo(() => {
    if (isValidState) {
      const stateKey = STATES.find(s => s.toLowerCase() === selectedState.trim().toLowerCase());
      return stateKey ? STATE_CITIES[stateKey] : [];
    }
    return [];
  }, [isValidState, selectedState]);

  const filteredDestinations = useMemo(() => {
    const q = destination.trim().toLowerCase();
    if (!q) return activeCityList;
    return activeCityList.filter(c => c.toLowerCase().includes(q));
  }, [destination, activeCityList]);

  const isValidDestination = useMemo(
    () => DESTINATIONS.some((d) => d.toLowerCase() === destination.trim().toLowerCase()) && 
          activeCityList.some(c => c.toLowerCase() === destination.trim().toLowerCase()),
    [destination, activeCityList]
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

  const handleNextFromStep2 = () => {
    setStep(3);
    setCheckTickets(null);
    setDeparturePlace('');
    setTransportOption('');
    setTransportSchedule([]);
    setHighDemandNotice(Math.random() > 0.5); // Simulate high demand for demo
  };

  const fetchTransportSchedule = async () => {
    if (!departurePlace.trim() || !transportOption || !destination) {
      Alert.alert('Missing info', 'Please enter departure city and select train or flight.');
      return;
    }
    setTransportLoading(true);
    try {
      const { API_BASE_URL } = await import('@/lib/api');
      const res = await fetch(
        `${API_BASE_URL}/api/transport/schedule?departure=${encodeURIComponent(departurePlace.trim())}&destination=${encodeURIComponent(destination)}&startDate=${startDate}&endDate=${endDate}&transport=${transportOption}&budget=${budget || 'midrange'}`
      );
      const json = await res.json();
      if (json.success && json.options?.length) {
        setTransportSchedule(json.options);
      } else {
        setTransportSchedule([]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not fetch schedule. You can still generate the itinerary.');
      setTransportSchedule([]);
    } finally {
      setTransportLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleNext = async () => {
    if (!selectedState || !destination || !startDate || !endDate) {
      Alert.alert('Missing Information', 'Please fill state, city, and dates.');
      return;
    }
    if (!isValidState || !isValidDestination) {
      Alert.alert('Invalid Selection', 'Please select a valid State and City from the dropdown.');
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
      checkTickets: checkTickets === true,
      departurePlace: checkTickets ? departurePlace.trim() || undefined : undefined,
      transportOption: checkTickets && transportOption ? transportOption : undefined,
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
      style={{ backgroundColor: colors.background }}
      scrollEnabled={!showDestinationDropdown}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient
        colors={[colors.backgroundSecondary, colors.background]}
        className="pt-12 pb-8 px-6"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="font-inter-bold text-3xl" style={{ color: colors.text }}>SafarYatraAI</Text>
            <Text className="font-inter text-sm" style={{ color: colors.textSecondary }}>Your One Tap Itinerary Planner</Text>
          </View>
          <View className="rounded-full px-4 py-2 flex-row items-center gap-2" style={{ backgroundColor: colors.greenMuted }}>
            <Sparkles size={16} color={colors.green} />
            <Text className="font-inter-semibold" style={{ color: colors.text }}>AI Trip Planner</Text>
          </View>
        </View>

        <View className="rounded-2xl p-4" style={{ backgroundColor: colors.card }}>
          <Text className="font-inter-semibold text-xl mb-2" style={{ color: colors.text }}>
            Plan Your Dream Trip
          </Text>
          <Text className="font-inter" style={{ color: colors.textSecondary }}>
            Step {step} of 3 — {step === 1 ? 'route & dates' : step === 2 ? 'personalize' : 'tickets & transport'}.
          </Text>
        </View>
      </LinearGradient>

      <View className="px-6 py-6" style={{ backgroundColor: colors.background }}>
        <View className="rounded-3xl p-6 shadow-lg mb-6" style={{ backgroundColor: colors.card }}>
          <View className="flex-row items-center gap-3 mb-6">
            {step > 1 && (
              <TouchableOpacity
                onPress={() => setStep((step - 1) as 1 | 2 | 3)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.inputBg }}
              >
                <ArrowLeft size={22} color={colors.text} />
              </TouchableOpacity>
            )}
            <Text className="font-inter-bold text-2xl flex-1" style={{ color: colors.text }}>
              Trip Details
            </Text>
          </View>

          <View className="gap-5">
            {step === 1 ? (
              <>
                <View>
                  <View className="mb-4">
                    <View className="flex-row items-center gap-2 mb-2">
                      <MapPin size={18} color={colors.orange} />
                      <Text className="font-inter-semibold" style={{ color: colors.text }}>
                        State
                      </Text>
                    </View>
                    <View className="relative" style={{ zIndex: showStateDropdown ? 1000 : 0 }} collapsable={false}>
                      <TextInput
                        ref={stateInputRef}
                        className="font-inter rounded-xl px-4 py-3 pr-10"
                        style={{
                          backgroundColor: colors.inputBg,
                          borderWidth: 1,
                          borderColor: showStateDropdown ? colors.green : colors.inputBorder,
                          color: colors.text,
                          borderBottomWidth: showStateDropdown && filteredStates.length > 0 ? 0 : 1,
                          borderBottomLeftRadius: showStateDropdown && filteredStates.length > 0 ? 0 : 12,
                          borderBottomRightRadius: showStateDropdown && filteredStates.length > 0 ? 0 : 12,
                        }}
                        placeholder="Type or select a state..."
                        placeholderTextColor={colors.textMuted}
                        value={selectedState}
                        onChangeText={(text) => {
                          setSelectedState(text);
                          setShowStateDropdown(true);
                          setDestination('');
                        }}
                        onFocus={() => {
                          if (stateBlurRef.current) {
                            clearTimeout(stateBlurRef.current);
                            stateBlurRef.current = null;
                          }
                          setShowStateDropdown(true);
                        }}
                        onBlur={() => {
                          stateBlurRef.current = setTimeout(() => {
                            setShowStateDropdown(false);
                            stateBlurRef.current = null;
                          }, 200);
                        }}
                      />
                      <View className="absolute right-3 top-0 bottom-0 justify-center pointer-events-none">
                        <ChevronDown size={20} color={colors.textMuted} />
                      </View>
                      {showStateDropdown && (
                        <View
                          className="rounded-b-xl border-x border-b overflow-hidden absolute top-full left-0 right-0"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderColor: colors.border,
                            borderWidth: 1,
                            maxHeight: 200,
                            zIndex: 1001,
                            elevation: 8,
                          }}
                          pointerEvents="auto"
                        >
                          <ScrollView
                            keyboardShouldPersistTaps="always"
                            nestedScrollEnabled
                            style={{ maxHeight: 200 }}
                          >
                            {filteredStates.map((name) => (
                              <TouchableOpacity
                                key={name}
                                activeOpacity={0.7}
                                className="px-4 py-3 flex-row items-center gap-3"
                                style={{
                                  backgroundColor: name === selectedState ? colors.greenMuted : 'transparent',
                                  borderBottomWidth: 1,
                                  borderBottomColor: colors.border,
                                }}
                                onPress={() => {
                                  if (stateBlurRef.current) {
                                    clearTimeout(stateBlurRef.current);
                                    stateBlurRef.current = null;
                                  }
                                  setSelectedState(name);
                                  setShowStateDropdown(false);
                                  stateInputRef.current?.blur();
                                  
                                  const cities = STATE_CITIES[name];
                                  if (cities && cities.length === 1) {
                                    setDestination(cities[0]);
                                  } else {
                                    setDestination('');
                                  }
                                }}
                              >
                                <Text className="font-inter flex-1" style={{ color: colors.text }}>
                                  {name}
                                </Text>
                                {name === selectedState ? (
                                  <Text className="font-inter-semibold text-xs" style={{ color: colors.green }}>Selected</Text>
                                ) : null}
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>

                  {isValidState && activeCityList.length > 0 && (
                    <View className="mb-4">
                      <View className="flex-row items-center gap-2 mb-2">
                        <MapPin size={18} color={colors.green} />
                        <Text className="font-inter-semibold" style={{ color: colors.text }}>
                          City / Region
                        </Text>
                      </View>
                      <View className="relative" style={{ zIndex: showDestinationDropdown ? 999 : 0 }} collapsable={false}>
                        <TextInput
                          ref={destinationInputRef}
                          className="font-inter rounded-xl px-4 py-3 pr-10"
                          style={{
                            backgroundColor: colors.inputBg,
                            borderWidth: 1,
                            borderColor: showDestinationDropdown ? colors.green : colors.inputBorder,
                            color: colors.text,
                            borderBottomWidth: showDestinationDropdown && filteredDestinations.length > 0 ? 0 : 1,
                            borderBottomLeftRadius: showDestinationDropdown && filteredDestinations.length > 0 ? 0 : 12,
                            borderBottomRightRadius: showDestinationDropdown && filteredDestinations.length > 0 ? 0 : 12,
                          }}
                          placeholder={`Select city in ${selectedState}...`}
                          placeholderTextColor={colors.textMuted}
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
                            }, 200);
                          }}
                        />
                        <View className="absolute right-3 top-0 bottom-0 justify-center pointer-events-none">
                          <ChevronDown size={20} color={colors.textMuted} />
                        </View>
                        {showDestinationDropdown && (
                          <View
                            className="rounded-b-xl border-x border-b overflow-hidden absolute top-full left-0 right-0"
                            style={{
                              backgroundColor: colors.inputBg,
                              borderColor: colors.border,
                              borderWidth: 1,
                              maxHeight: 260,
                              zIndex: 1000,
                              elevation: 8,
                            }}
                            pointerEvents="auto"
                          >
                            <ScrollView
                              keyboardShouldPersistTaps="always"
                              nestedScrollEnabled
                              style={{ maxHeight: 260 }}
                            >
                              {filteredDestinations.length === 0 ? (
                                <View className="px-4 py-3">
                                  <Text className="font-inter text-sm" style={{ color: colors.textMuted }}>
                                    No matches found.
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
                                        backgroundColor: name === destination ? colors.greenMuted : 'transparent',
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.border,
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
                                          <IconComponent size={22} color={colors.green} />
                                        </View>
                                      ) : null}
                                      <View className="flex-1">
                                        <Text className="font-inter" style={{ color: colors.text }}>
                                          {name}
                                        </Text>
                                        <Text className="font-inter text-xs mt-0.5" style={{ color: colors.textMuted }} numberOfLines={1}>
                                          {DESTINATION_DESCRIPTIONS[name] ?? ''}
                                        </Text>
                                      </View>
                                      {name === destination ? (
                                        <Text className="font-inter-semibold text-xs" style={{ color: colors.green }}>Selected</Text>
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
                        <Text className="font-inter text-xs mt-1.5" style={{ color: colors.orange }}>
                          Select a city from the dropdown to continue
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                <View>
                  <View className="flex-row items-center gap-2 mb-3">
                    <Sparkles size={18} color={colors.orange} />
                    <Text className="font-inter-semibold" style={{ color: colors.text }}>
                      Itinerary Style
                    </Text>
                  </View>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setItineraryStyle('day-wise')}
                      className="flex-1 p-4 rounded-2xl border-2"
                      style={{
                        backgroundColor: itineraryStyle === 'day-wise' ? colors.orangeMuted : colors.inputBg,
                        borderColor: itineraryStyle === 'day-wise' ? colors.orange : colors.border
                      }}
                    >
                      <View className="flex-row items-center gap-2 mb-1">
                        <Calendar size={18} color={itineraryStyle === 'day-wise' ? colors.orange : colors.textMuted} />
                        <Text className="font-inter-bold" style={{ color: itineraryStyle === 'day-wise' ? colors.text : colors.textMuted }}>
                          Daily Plan
                        </Text>
                      </View>
                      <Text className="font-inter text-xs leading-4" style={{ color: itineraryStyle === 'day-wise' ? colors.textSecondary : colors.textMuted }}>
                        Day-by-day complete schedule
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setItineraryStyle('top-10')}
                      className="flex-1 p-4 rounded-2xl border-2"
                      style={{
                        backgroundColor: itineraryStyle === 'top-10' ? colors.greenMuted : colors.inputBg,
                        borderColor: itineraryStyle === 'top-10' ? colors.green : colors.border
                      }}
                    >
                      <View className="flex-row items-center gap-2 mb-1">
                        <Sparkles size={18} color={itineraryStyle === 'top-10' ? colors.green : colors.textMuted} />
                        <Text className="font-inter-bold" style={{ color: itineraryStyle === 'top-10' ? colors.text : colors.textMuted }}>
                          Top 10 Spots
                        </Text>
                      </View>
                      <Text className="font-inter text-xs leading-4" style={{ color: itineraryStyle === 'top-10' ? colors.textSecondary : colors.textMuted }}>
                        Curated list of best places
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-1">
  <View className="flex-row items-center gap-2 mb-2">
    <Calendar size={18} color={colors.orange} />
    <Text className="font-inter-semibold" style={{ color: colors.text }}>Date Range</Text>
  </View>
  <TouchableOpacity
    className="rounded-xl px-4 py-3 flex-row items-center justify-between"
    style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }}
    onPress={() => setShowCalendar(true)}
  >
    <Text className="font-inter" style={{ color: startDate && endDate ? colors.text : colors.textMuted }}>
      {startDate && endDate
        ? `${startDate}  →  ${endDate}`
        : startDate
        ? `${startDate}  →  Select end`
        : 'Select dates'}
    </Text>
    <Calendar size={16} color={colors.textMuted} />
  </TouchableOpacity>

  {/* Calendar Modal */}
  <Modal
    visible={showCalendar}
    transparent
    animationType="fade"
    onRequestClose={() => setShowCalendar(false)}
  >
    <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <View className="rounded-t-3xl px-5 pt-5 pb-8" style={{ backgroundColor: colors.card }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-inter-semibold text-lg" style={{ color: colors.text }}>Select Dates</Text>
          <TouchableOpacity onPress={() => setShowCalendar(false)}>
            <X size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text className="font-inter text-sm mb-4" style={{ color: colors.textMuted }}>
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
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text className="font-inter-semibold text-base" style={{ color: colors.text }}>
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
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Day Labels */}
        <View className="flex-row mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <View key={day} className="flex-1 items-center">
              <Text className="font-inter text-xs" style={{ color: colors.textMuted }}>{day}</Text>
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
                        ? { backgroundColor: colors.green }
                        : isInRange
                        ? { backgroundColor: colors.greenMuted }
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
                    <Text className={`font-inter text-sm ${isStart || isEnd ? 'font-inter-semibold' : ''}`} style={{ color: isStart || isEnd ? colors.onGreen : colors.text }}>
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
          style={{ backgroundColor: startDate && endDate ? colors.green : colors.inputBg }}
          onPress={() => {
            if (startDate && endDate) setShowCalendar(false);
          }}
          disabled={!startDate || !endDate}
        >
          <Text className="font-inter-semibold text-base" style={{ color: startDate && endDate ? colors.onGreen : colors.textMuted }}>
            {startDate && endDate ? 'Confirm Dates' : 'Select both dates'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
</View>

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Users size={18} color={colors.orange} />
                    <Text className="font-inter-semibold" style={{ color: colors.text }}>
                      No. of travelers
                    </Text>
                  </View>
                  <TextInput
                    className="font-inter rounded-xl px-4 py-3"
                    style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                    placeholder="1"
                    placeholderTextColor={colors.textMuted}
                    value={travelers}
                    onChangeText={setTravelers}
                    keyboardType="number-pad"
                  />

                </View>

                <TouchableOpacity
                  className="rounded-xl py-4 mt-2 shadow-md"
                  style={{ backgroundColor: colors.green }}
                  onPress={handleNext}
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Text className="font-inter-bold text-center text-lg" style={{ color: colors.onGreen }}>
                      Next
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : step === 2 ? (
              <>
                {areaOptions.length > 0 && (
                  <View>
                    <View className="flex-row items-center gap-2 mb-2">
                      <Home size={18} color={colors.orange} />
                      <Text className="font-inter-semibold" style={{ color: colors.text }}>
                        Where are you staying? (optional)
                      </Text>
                    </View>
                    <Text className="font-inter text-xs mb-2" style={{ color: colors.textMuted }}>
                      We'll tailor Day 1 around your area
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      <TouchableOpacity
                        onPress={() => setStayLocation('')}
                        className="px-4 py-2 rounded-full border-2"
                        style={{
                          backgroundColor: !stayLocation ? colors.green : colors.inputBg,
                          borderColor: !stayLocation ? colors.green : colors.border,
                        }}
                      >
                        <Text className="font-inter-semibold" style={{ color: !stayLocation ? colors.onGreen : colors.text }}>
                          Skip
                        </Text>
                      </TouchableOpacity>
                      {areaOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt.name}
                          onPress={() => setStayLocation(opt.name)}
                          className="px-4 py-2 rounded-full border-2"
                          style={{
                            backgroundColor: stayLocation === opt.name ? colors.green : colors.inputBg,
                            borderColor: stayLocation === opt.name ? colors.green : colors.border,
                          }}
                        >
                          <Text className="font-inter-semibold" style={{ color: stayLocation === opt.name ? colors.onGreen : colors.text }}>
                            {opt.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Heart size={18} color={colors.orange} />
                    <Text className="font-inter-semibold" style={{ color: colors.text }}>
                      What are you interested in?
                    </Text>
                  </View>
                  <Text className="font-inter text-xs mb-3" style={{ color: colors.textMuted }}>
                    Only interests available in {destination}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {interestOptionsForDestination.map((interest) => (
                      <TouchableOpacity
                        key={interest}
                        onPress={() => toggleInterest(interest)}
                        className="px-4 py-2 rounded-full border-2"
                        style={{
                          backgroundColor: interests.includes(interest) ? colors.green : colors.inputBg,
                          borderColor: interests.includes(interest) ? colors.green : colors.border,
                        }}
                      >
                        <Text
                          className="font-inter-semibold"
                          style={{ color: interests.includes(interest) ? colors.onGreen : colors.text }}
                        >
                          {interest}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Wallet size={18} color={colors.orange} />
                    <Text className="font-inter-semibold" style={{ color: colors.text }}>
                      Budget (optional)
                    </Text>
                  </View>
                  <View className="flex-row gap-3">
                    {[
                      { id: 'budget', label: '₹', sub: 'Budget' },
                      { id: 'midrange', label: '₹₹', sub: 'Midrange' },
                      { id: 'luxury', label: '₹₹₹', sub: 'Luxury' },
                    ].map((tier) => {
                      const isActive = budget === tier.id;
                      return (
                        <TouchableOpacity
                          key={tier.id}
                          onPress={() => setBudget(isActive ? '' : tier.id)}
                          className="flex-1 rounded-2xl border-2 py-4 items-center justify-center"
                          style={{
                            backgroundColor: isActive ? colors.orange : colors.inputBg,
                            borderColor: isActive ? colors.orange : colors.border,
                          }}
                          activeOpacity={0.85}
                        >
                          <Text className="font-inter-bold text-xl mb-0.5" style={{ color: isActive ? colors.onGreen : colors.text }}>
                            {tier.label}
                          </Text>
                          <Text className="font-inter text-xs" style={{ color: isActive ? colors.onGreen : colors.textMuted }}>
                            {tier.sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View className="flex-row items-center gap-2 mt-2">
                    <Info size={14} color={colors.textMuted} />
                    <Text className="font-inter text-xs flex-1" style={{ color: colors.textMuted }}>
                      Tap to select; tap again to clear. Leave unselected for a balanced plan.
                    </Text>
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <MessageCircle size={18} color={colors.orange} />
                    <Text className="font-inter-semibold" style={{ color: colors.text }}>
                      Personalize (optional)
                    </Text>
                  </View>
                  <TextInput
                    className="font-inter rounded-xl px-4 py-3"
                    style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                    placeholder="Chat-style prompt… e.g., 'I love hidden cafes, no temples, and I want a chill pace.'"
                    placeholderTextColor={colors.textMuted}
                    value={personalPrompt}
                    onChangeText={setPersonalPrompt}
                    multiline
                  />
                </View>

                <TouchableOpacity
                  className="rounded-xl py-4 mt-2 shadow-md"
                  style={{ backgroundColor: colors.green }}
                  onPress={handleNextFromStep2}
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Text className="font-inter-bold text-center text-lg" style={{ color: colors.onGreen }}>
                      Next
                    </Text>
                    <ChevronRight size={20} color={colors.onGreen} />
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              /* Step 3: Tickets & transport */
              <>
                <View>
                  <Text className="font-inter-bold text-xl mb-1" style={{ color: colors.text }}>
                    Would you like to check tickets?
                  </Text>
                  <Text className="font-inter text-sm mb-4" style={{ color: colors.textSecondary }}>
                    We can pull real-time availability and pricing from IRCTC and Flight APIs for your specific dates.
                  </Text>
                  <View className="gap-3">
                    <TouchableOpacity
                      onPress={() => { setCheckTickets(true); setTransportSchedule([]); }}
                      className="rounded-2xl p-4 border-2 flex-row items-center gap-3"
                      style={{
                        backgroundColor: checkTickets === true ? colors.greenMuted : colors.inputBg,
                        borderColor: checkTickets === true ? colors.green : colors.border,
                      }}
                      activeOpacity={0.85}
                    >
                      <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: checkTickets === true ? colors.greenMuted : colors.card }}>
                        <Search size={24} color={checkTickets === true ? colors.green : colors.textMuted} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-inter-bold" style={{ color: colors.text }}>Yes, find me tickets</Text>
                        <Text className="font-inter text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                          Check flights and trains from your current location to destination.
                        </Text>
                      </View>
                      {checkTickets === true ? <CheckCircle size={20} color={colors.green} /> : <ChevronRight size={20} color={colors.textMuted} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { setCheckTickets(false); setTransportSchedule([]); setTransportOption(''); setDeparturePlace(''); }}
                      className="rounded-2xl p-4 border-2 flex-row items-center gap-3"
                      style={{
                        backgroundColor: checkTickets === false ? colors.greenMuted : colors.inputBg,
                        borderColor: checkTickets === false ? colors.green : colors.border,
                      }}
                      activeOpacity={0.85}
                    >
                      <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: colors.card }}>
                        <Ticket size={24} color={checkTickets === false ? colors.green : colors.textMuted} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-inter-bold" style={{ color: colors.text }}>No, I've already booked</Text>
                        <Text className="font-inter text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                          Skip transport and go straight to planning your activities.
                        </Text>
                      </View>
                      {checkTickets === false ? <CheckCircle size={20} color={colors.green} /> : <ChevronRight size={20} color={colors.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>

                {checkTickets === true && (
                  <>
                    <View>
                      <Text className="font-inter-semibold mb-2" style={{ color: colors.text }}>Departure city</Text>
                      <TextInput
                        className="font-inter rounded-xl px-4 py-3"
                        style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                        placeholder="e.g. Mumbai, Delhi, Bangalore"
                        placeholderTextColor={colors.textMuted}
                        value={departurePlace}
                        onChangeText={setDeparturePlace}
                      />
                    </View>
                    <View>
                      <Text className="font-inter-semibold mb-2" style={{ color: colors.text }}>Train or flight?</Text>
                      <View className="flex-row gap-3">
                        <TouchableOpacity
                          onPress={() => setTransportOption('train')}
                          className="flex-1 rounded-2xl p-4 border-2 flex-row items-center justify-center gap-2"
                          style={{
                            backgroundColor: transportOption === 'train' ? colors.orangeMuted : colors.inputBg,
                            borderColor: transportOption === 'train' ? colors.orange : colors.border,
                          }}
                        >
                          <Train size={22} color={transportOption === 'train' ? colors.orange : colors.textMuted} />
                          <Text className="font-inter-bold" style={{ color: transportOption === 'train' ? colors.orange : colors.textMuted }}>Train</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setTransportOption('flight')}
                          className="flex-1 rounded-2xl p-4 border-2 flex-row items-center justify-center gap-2"
                          style={{
                            backgroundColor: transportOption === 'flight' ? colors.orangeMuted : colors.inputBg,
                            borderColor: transportOption === 'flight' ? colors.orange : colors.border,
                          }}
                        >
                          <Plane size={22} color={transportOption === 'flight' ? colors.orange : colors.textMuted} />
                          <Text className="font-inter-bold" style={{ color: transportOption === 'flight' ? colors.orange : colors.textMuted }}>Flight</Text>
                        </TouchableOpacity>
                      </View>
                      {budget && transportOption === 'train' && (
                        <Text className="font-inter text-xs mt-2" style={{ color: colors.textMuted }}>
                          {budget === 'budget' && 'Estimated for 3AC (3 Tier AC). '}
                          {budget === 'midrange' && 'Estimated for 2AC (2 Tier AC). '}
                          {budget === 'luxury' && 'Estimated for 1AC (1 Tier AC). '}
                          Prices are indicative.
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={fetchTransportSchedule}
                      disabled={transportLoading || !departurePlace.trim() || !transportOption}
                      className="rounded-xl py-3 flex-row items-center justify-center gap-2 border-2"
                      style={{ backgroundColor: colors.card, borderColor: colors.orange }}
                    >
                      {transportLoading ? (
                        <Text className="font-inter-semibold" style={{ color: colors.orange }}>Checking...</Text>
                      ) : (
                        <>
                          <Search size={18} color={colors.orange} />
                          <Text className="font-inter-semibold" style={{ color: colors.orange }}>Check availability & prices</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    {transportSchedule.length > 0 && (
                      <View className="rounded-2xl p-4 border" style={{ backgroundColor: colors.inputBg, borderColor: colors.border }}>
                        <Text className="font-inter-bold mb-2" style={{ color: colors.text }}>Available options</Text>
                        {transportSchedule.slice(0, 5).map((opt, i) => (
                          <View key={i} className="flex-row justify-between items-center py-2 border-b" style={{ borderColor: colors.divider }}>
                            <View>
                              <Text className="font-inter-semibold" style={{ color: colors.text }}>{opt.name}</Text>
                              <Text className="font-inter text-xs" style={{ color: colors.textMuted }}>{opt.departure} → {opt.arrival}{opt.class ? ` • ${opt.class}` : ''}</Text>
                            </View>
                            <Text className="font-inter-bold" style={{ color: colors.green }}>₹{opt.price.toLocaleString()}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}

                {highDemandNotice && checkTickets === true && (
                  <View className="rounded-xl p-4 flex-row gap-3 border" style={{ backgroundColor: colors.orangeMuted, borderColor: colors.orangeBorder }}>
                    <Text className="text-xl">⚠️</Text>
                    <Text className="font-inter text-sm flex-1" style={{ color: colors.text }}>
                      Based on your dates, we've noticed high demand for this route. Checking now is recommended.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  className="rounded-xl py-4 mt-2 shadow-md"
                  style={{ backgroundColor: colors.green }}
                  onPress={handleGenerate}
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Sparkles size={20} color={colors.onGreen} />
                    <Text className="font-inter-bold text-center text-lg" style={{ color: colors.onGreen }}>
                      Generate Itinerary
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View className="rounded-2xl p-6 mb-6" style={{ backgroundColor: colors.greenMuted, borderWidth: 1, borderColor: colors.greenBorder }}>
          <Text className="font-inter-bold text-lg mb-3" style={{ color: colors.text }}>
            🎉 Demo Itinerary
          </Text>
          <Text className="font-inter mb-4" style={{ color: colors.textSecondary }}>
            See how YatraAI creates perfect travel plans. Check out our sample Goa itinerary!
          </Text>
          <TouchableOpacity
            className="border-2 rounded-xl py-3"
            style={{ backgroundColor: colors.card, borderColor: colors.green }}
            onPress={() => router.push('/(tabs)/itinerary')}
          >
            <Text className="font-inter-bold text-center" style={{ color: colors.green }}>
              View Demo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
