import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import RecordScreen from "../screens/RecordScreen";
import RaveScreen from "../screens/RaveScreen";
import { Ionicons, Feather } from "@expo/vector-icons";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 5,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === "Home") {
            return <Ionicons name="home-outline" size={size} color={color} />;
          } else if (route.name === "Record") {
            return <Feather name="mic" size={size} color={color} />;
          } else if (route.name === "RAVE") {
            return <Ionicons name="musical-notes" size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Record" component={RecordScreen} />
      <Tab.Screen name="RAVE" component={RaveScreen} />
    </Tab.Navigator>
  );
}
