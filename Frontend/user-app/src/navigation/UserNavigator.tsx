import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { LayoutGrid, ClipboardList, User } from 'lucide-react-native';

import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import MyBookingsScreen from '../screens/bookings/MyBookingsScreen';
import HomeScreen from '../screens/home/HomeScreen';
import NearbyStationsScreen from '../screens/home/NearbyStationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import BookSlotScreen from '../screens/stations/BookSlotScreen';
import BookingSuccessScreen from '../screens/bookings/BookingSuccessScreen';
import StationDetailScreen from '../screens/stations/StationDetailScreen';
import LocationPermissionScreen from '../screens/system/LocationPermissionScreen';
import NotFoundScreen from '../screens/system/NotFoundScreen';
import PhaseTwoComingSoonScreen from '../screens/system/PhaseTwoComingSoonScreen';

import { colors, typography } from '../styles/theme';
import { stackScreenOptions } from './screenOptions';

export type DiscoverStackParamList = {
  Home: undefined;
  Nearby: undefined;
  StationDetail: { stationId: number };
  BookSlot: { stationId: number; stationName?: string };
  BookingSuccess: { bookingId?: number };
  ComingSoon: { title?: string };
  NotFound: undefined;
};

export type BookingsStackParamList = {
  MyBookings: undefined;
  BookingDetail: { bookingId: number };
  NotFound: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  LocationPermission: undefined;
  ComingSoon: { title?: string };
};

const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>();
const BookingsStack = createNativeStackNavigator<BookingsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function DiscoverNavigator(): JSX.Element {
  return (
    <DiscoverStack.Navigator screenOptions={stackScreenOptions}>
      <DiscoverStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <DiscoverStack.Screen name="Nearby" component={NearbyStationsScreen} options={{ title: 'Nearby hubs' }} />
      <DiscoverStack.Screen name="StationDetail" component={StationDetailScreen} options={{ title: 'Station' }} />
      <DiscoverStack.Screen name="BookSlot" component={BookSlotScreen} options={{ title: 'Reserve slot' }} />
      <DiscoverStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ title: 'Booking ready' }}
      />
      <DiscoverStack.Screen name="ComingSoon" component={PhaseTwoComingSoonScreen} options={{ title: 'Roadmap' }} />
      <DiscoverStack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Missing data' }} />
    </DiscoverStack.Navigator>
  );
}

function BookingsNavigator(): JSX.Element {
  return (
    <BookingsStack.Navigator initialRouteName="MyBookings" screenOptions={stackScreenOptions}>
      <BookingsStack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My bookings' }} />
      <BookingsStack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking' }} />
      <BookingsStack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Missing booking' }} />
    </BookingsStack.Navigator>
  );
}

function ProfileNavigator(): JSX.Element {
  return (
    <ProfileStack.Navigator initialRouteName="ProfileHome" screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen
        name="LocationPermission"
        component={LocationPermissionScreen}
        options={{ title: 'Location access' }}
      />
      <ProfileStack.Screen name="ComingSoon" component={PhaseTwoComingSoonScreen} options={{ title: 'Roadmap' }} />
    </ProfileStack.Navigator>
  );
}

const Tabs = createBottomTabNavigator();

export default function UserNavigator(): JSX.Element {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: typography.small,
      }}>
      <Tabs.Screen
        name="Discover"
        component={DiscoverNavigator}
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="BookingsTab"
        component={BookingsNavigator}
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}
