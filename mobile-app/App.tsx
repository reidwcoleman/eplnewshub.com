import React, { useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './screens/HomeScreen';
import FPLToolsScreen from './screens/FPLToolsScreen';
import StatsScreen from './screens/StatsScreen';
import MoreScreen from './screens/MoreScreen';

// Import services
import { initializeAds } from './services/ads';
import { initializeNotifications } from './services/notifications';
import { initializeAnalytics } from './services/analytics';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          ...Ionicons.font,
          'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
          'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
          'Roboto-Light': require('./assets/fonts/Roboto-Light.ttf'),
        });

        // Initialize services
        await initializeAds();
        await initializeNotifications();
        await initializeAnalytics();

        // Artificial delay to show splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar 
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
          backgroundColor="#262627"
        />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'FPL Tools') {
                  iconName = focused ? 'football' : 'football-outline';
                } else if (route.name === 'Stats') {
                  iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                } else if (route.name === 'More') {
                  iconName = focused ? 'menu' : 'menu-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#38003c',
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderTopColor: '#e0e0e0',
                paddingBottom: Platform.OS === 'ios' ? 20 : 5,
                height: Platform.OS === 'ios' ? 80 : 60,
              },
              headerStyle: {
                backgroundColor: '#262627',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontFamily: 'Roboto-Bold',
                fontSize: 18,
              },
            })}
          >
            <Tab.Screen 
              name="Home" 
              component={HomeScreen}
              options={{
                title: 'EPL News Hub',
                headerLeft: () => (
                  <View style={styles.logoContainer}>
                    <Ionicons name="football" size={24} color="#00ff87" />
                  </View>
                ),
              }}
            />
            <Tab.Screen 
              name="FPL Tools" 
              component={FPLToolsScreen}
              options={{
                title: 'FPL Tools',
              }}
            />
            <Tab.Screen 
              name="Stats" 
              component={StatsScreen}
              options={{
                title: 'Statistics',
              }}
            />
            <Tab.Screen 
              name="More" 
              component={MoreScreen}
              options={{
                title: 'More',
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    marginLeft: 15,
    padding: 5,
  },
});