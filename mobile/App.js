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

/* =========================================================
   MAIN TABS
========================================================= */

function MainTabs({ setLoggedIn }) {
  const insets = useSafeAreaInsets();
  const { isSmallPhone } = useResponsiveLayout();

  const bottomInset = Math.max(insets.bottom, 6);

  const tabHeight =
    (isSmallPhone ? 54 : 58) + (insets.bottom > 0 ? insets.bottom - 4 : 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: colors.primary,

        tabBarInactiveTintColor: "#8E8E93",

        tabBarHideOnKeyboard: true,

        tabBarLabelStyle: {
          fontSize: isSmallPhone ? 10 : 11,
          fontWeight: "600",
          marginTop: -2,
          marginBottom: insets.bottom > 0 ? 0 : 4,
        },

        tabBarStyle: {
          height: tabHeight,
          paddingTop: 6,
          paddingBottom: bottomInset,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F0E7EA",
          elevation: 0,
          borderRadius: 30,
          marginBottom: 10,
          marginHorizontal: 10,
        },

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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
        }}
      />

      <Tab.Screen
        name="Interests"
        component={InterestsScreen}
        options={{
          title: "Interests",
        }}
      />

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

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [authState, setAuthState] = useState(null);

  useEffect(() => {
    checkLogin();
  }, []);

  async function checkLogin() {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setAuthState({
          loggedIn: false,
          profileCompleted: false,
        });

        return;
      }

      const storedUser = await AsyncStorage.getItem("user");

      let user = null;

      try {
        user = storedUser ? JSON.parse(storedUser) : null;
      } catch {
        user = null;
      }

      setAuthState({
        loggedIn: true,
        profileCompleted: user?.profileCompleted === true,
      });
    } catch (error) {
      console.log("AUTH CHECK ERROR:", error);

      setAuthState({
        loggedIn: false,
        profileCompleted: false,
      });
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (authState === null) {
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
          {/* =================================================
              LOGGED OUT
          ================================================= */}

          {!authState.loggedIn ? (
            <>
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    setLoggedIn={(value) => {
                      if (value) {
                        checkLogin();
                      } else {
                        setAuthState({
                          loggedIn: false,
                          profileCompleted: false,
                        });
                      }
                    }}
                  />
                )}
              </Stack.Screen>

              <Stack.Screen name="Signup">
                {(props) => (
                  <SignupScreen
                    {...props}
                    setLoggedIn={(value) => {
                      if (value) {
                        checkLogin();
                      }
                    }}
                  />
                )}
              </Stack.Screen>
            </>
          ) : (
            <>
              {/* =================================================
                  PROFILE NOT COMPLETED
              ================================================= */}

              {!authState.profileCompleted ? (
                <Stack.Screen
                  name="CompleteProfile"
                  component={CompleteProfileScreen}
                />
              ) : (
                /* =================================================
                   PROFILE COMPLETED
                ================================================= */

                <>
                  <Stack.Screen name="Main">
                    {(props) => (
                      <MainTabs
                        {...props}
                        setLoggedIn={(value) => {
                          if (!value) {
                            AsyncStorage.multiRemove(["token", "user"]);

                            setAuthState({
                              loggedIn: false,
                              profileCompleted: false,
                            });
                          }
                        }}
                      />
                    )}
                  </Stack.Screen>

                  <Stack.Screen name="Search" component={SearchScreen} />

                  <Stack.Screen
                    name="ProfileDetail"
                    component={ProfileDetailScreen}
                  />

                  <Stack.Screen
                    name="Notifications"
                    component={NotificationsScreen}
                  />
                </>
              )}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
