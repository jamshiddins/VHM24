import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Redux
import { store, persistor } from './src/store';
import { PersistGate } from 'redux-persist/integration/react';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import TasksScreen from './src/screens/tasks/TasksScreen';
import TaskDetailScreen from './src/screens/tasks/TaskDetailScreen';
import MachinesScreen from './src/screens/machines/MachinesScreen';
import MachineDetailScreen from './src/screens/machines/MachineDetailScreen';
import IncassationScreen from './src/screens/incassation/IncassationScreen';
import AnalyticsScreen from './src/screens/analytics/AnalyticsScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import QRScannerScreen from './src/screens/scanner/QRScannerScreen';
import CameraScreen from './src/screens/camera/CameraScreen';
import MapScreen from './src/screens/map/MapScreen';

// Components
import LoadingScreen from './src/components/LoadingScreen';
import NetworkStatus from './src/components/NetworkStatus';

// Services
import { AuthService } from './src/services/AuthService';
import { WebSocketService } from './src/services/WebSocketService';
import { NotificationService } from './src/services/NotificationService';

// Types
import { RootStackParamList, TabParamList } from './src/types/navigation';

// Theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#1abc9c',
    background: '#f8f9fa',
    surface: '#ffffff',
    error: '#e74c3c',
    success: '#27ae60',
    warning: '#f39c12',
  },
};

const Stack = createStackNavigator<RootStackParamList>(
const Tab = createBottomTabNavigator<TabParamList>(

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync(

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'view-dashboard';
              break;
            case 'Tasks':
              iconName = 'format-list-checks';
              break;
            case 'Machines':
              iconName = 'robot';
              break;
            case 'Analytics':
              iconName = 'chart-line';
              break;
            case 'Profile':
              iconName = 'account';
              break;
            default:
              iconName = 'help-circle';
          }

          return (
            <MaterialCommunityIcons
              name={iconName as any}
              size={size}
              color={color}
            />
          
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Панель управления' }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen}
        options={{ title: 'Задачи' }}
      />
      <Tab.Screen 
        name="Machines" 
        component={MachinesScreen}
        options={{ title: 'Автоматы' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Аналитика' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  
}

function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null

  useEffect(() => {
    checkAuthStatus(
  }, []

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken'
      const isValid = await AuthService.validateToken(token
      setIsAuthenticated(isValid
    } catch (error) {
      console.error('Auth check failed:', error
      setIsAuthenticated(false
    }
  };

  if (isAuthenticated === null) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen 
            name="TaskDetail" 
            component={TaskDetailScreen}
            options={{ 
              headerShown: true,
              title: 'Детали задачи',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: 'white',
            }}
          />
          <Stack.Screen 
            name="MachineDetail" 
            component={MachineDetailScreen}
            options={{ 
              headerShown: true,
              title: 'Детали автомата',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: 'white',
            }}
          />
          <Stack.Screen 
            name="Incassation" 
            component={IncassationScreen}
            options={{ 
              headerShown: true,
              title: 'Инкассация',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: 'white',
            }}
          />
          <Stack.Screen 
            name="QRScanner" 
            component={QRScannerScreen}
            options={{ 
              headerShown: true,
              title: 'Сканер QR',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: 'white',
            }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen}
            options={{ 
              headerShown: true,
              title: 'Камера',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: 'white',
            }}
          />
          <Stack.Screen 
            name="Map" 
            component={MapScreen}
            options={{ 
              headerShown: true,
              title: 'Карта',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: 'white',
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ 
              headerShown: true,
              title: 'Настройки',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: 'white',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync({
          'Roboto': require('./assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
        }

        // Initialize services
        await NotificationService.initialize(
        WebSocketService.initialize(

        // Artificial delay to show splash screen
        await new Promise(resolve => setTimeout(resolve, 2000)
      } catch (e) {
        console.warn('App preparation failed:', e
      } finally {
        setAppIsReady(true
      }
    }

    prepare(
  }, []

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync(
    }
  }, [appIsReady]

  if (!appIsReady) {
    return <LoadingScreen />;
  }

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider onLayout={onLayoutRootView}>
            <NavigationContainer>
              <NetworkStatus />
              <AppNavigator />
              <StatusBar style="light" backgroundColor={theme.colors.primary} />
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </PersistGate>
    </ReduxProvider>
  
}

registerRootComponent(App
