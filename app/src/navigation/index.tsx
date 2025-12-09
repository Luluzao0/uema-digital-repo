import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, fontScale, getBottomSpace, screenHeight } from '../utils/responsive';

import {
  LoginScreen,
  DashboardScreen,
  DocumentsScreen,
  ProcessesScreen,
  ReportsScreen,
  ChatScreen,
  SettingsScreen,
} from '../screens';
import { User } from '../types';
import { colors } from '../theme';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Documents: undefined;
  Chat: undefined;
  Processes: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

interface MainTabsProps {
  user: User;
  onLogout: () => void;
}

const MainTabs: React.FC<MainTabsProps> = ({ user, onLogout }) => {
  const navigation = useNavigation<any>();
  
  const handleNavigate = (screen: string) => {
    navigation.navigate(screen);
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Documents':
              iconName = focused ? 'document' : 'document-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Processes':
              iconName = focused ? 'git-network' : 'git-network-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.tabBarAndroid]} />
          )
        ),
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        options={{ tabBarLabel: 'Início' }}
      >
        {() => <DashboardScreen user={user} onNavigate={handleNavigate} />}
      </Tab.Screen>
      <Tab.Screen
        name="Documents"
        options={{ tabBarLabel: 'Documentos' }}
      >
        {() => <DocumentsScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Chat"
        options={{ tabBarLabel: 'Chat IA' }}
      >
        {() => <ChatScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Processes"
        options={{ tabBarLabel: 'Processos' }}
      >
        {() => <ProcessesScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        options={{ tabBarLabel: 'Ajustes' }}
      >
        {() => <SettingsScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

interface AppNavigatorProps {
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ user, onLogin, onLogout }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main">
          {() => <MainTabs user={user} onLogout={onLogout} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login">
          {() => <LoginScreen onLogin={onLogin} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    height: Platform.OS === 'ios' ? scale(85) + getBottomSpace() : scale(65),
    paddingBottom: Platform.OS === 'ios' ? getBottomSpace() : scale(10),
  },
  tabBarAndroid: {
    backgroundColor: 'rgba(18, 18, 24, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabBarLabel: {
    fontSize: fontScale(10),
    fontWeight: '500',
  },
});
