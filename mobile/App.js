import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import InterestsScreen from "./src/screens/InterestsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import ProfileDetailScreen from "./src/screens/ProfileDetailScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import CompleteProfileScreen from "./src/screens/CompleteProfileScreen";

import { colors } from "./src/theme";
import { useResponsiveLayout } from "./src/utils/responsive";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ setLoggedIn }) {
  const insets = useSafeAreaInsets();
  const { isSmallPhone } = useResponsiveLayout();

  // Bottom safe-area inset
  const bottomInset = Math.max(insets.bottom, 6);

  // Dynamic tab height
  const tabHeight =
    (isSmallPhone ? 54 : 58) + (insets.bottom > 0 ? insets.bottom - 4 : 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // Tab colors
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#8E8E93",

        // Hide tab bar when keyboard opens
        tabBarHideOnKeyboard: true,

        // Tab label
        tabBarLabelStyle: {
          fontSize: isSmallPhone ? 10 : 11,
          fontWeight: "600",
          marginTop: -2,
          marginBottom: insets.bottom > 0 ? 0 : 4,
        },

        // Tab bar
        tabBarStyle: {
          height: tabHeight,
          paddingTop: 6,
          // paddingBottom: 10,
          paddingBottom: bottomInset,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F0E7EA",
          elevation: 0,
          borderRadius: 30,
          marginBottom: 10,
          marginHorizontal: 10,
        },

        // Tab icons
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Interests") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={isSmallPhone ? 22 : 24}
              color={color}
            />
          );
        },
      })}
    >
      {/* ================= HOME TAB ================= */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
        }}
      />

      {/* ================= INTERESTS TAB ================= */}
      <Tab.Screen
        name="Interests"
        component={InterestsScreen}
        options={{
          title: "Interests",
        }}
      />

      {/* ================= PROFILE TAB ================= */}
      <Tab.Screen
        name="Profile"
        options={{
          title: "Profile",
        }}
      >
        {(props) => <ProfileScreen {...props} setLoggedIn={setLoggedIn} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(null);

  useEffect(() => {
    checkLogin();
  }, []);

  async function checkLogin() {
    try {
      const token = await AsyncStorage.getItem("token");

      setLoggedIn(!!token);
    } catch (error) {
      console.log("AUTH CHECK ERROR:", error);

      setLoggedIn(false);
    }
  }

  // ================= AUTH CHECK LOADING =================

  if (loggedIn === null) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.bg,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!loggedIn ? (
            <>
              {/* ================= LOGIN ================= */}

              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen {...props} setLoggedIn={setLoggedIn} />
                )}
              </Stack.Screen>

              {/* ================= SIGNUP ================= */}

              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          ) : (
            <>
              {/* ================= MAIN TABS ================= */}

              <Stack.Screen name="Main">
                {(props) => <MainTabs {...props} setLoggedIn={setLoggedIn} />}
              </Stack.Screen>

              {/* ================= SEARCH ================= */}
              {/* Search is a Stack screen, NOT a bottom tab */}

              <Stack.Screen name="Search" component={SearchScreen} />

              {/* ================= PROFILE DETAIL ================= */}

              <Stack.Screen
                name="ProfileDetail"
                component={ProfileDetailScreen}
              />

              {/* ================= NOTIFICATIONS ================= */}

              <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
              />
              <Stack.Screen
                name="CompleteProfile"
                component={CompleteProfileScreen}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
