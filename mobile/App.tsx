import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";

import HomeScreen from "./src/screens/HomeScreen";
import ItemDetailScreen from "./src/screens/ItemDetailScreen";
import PostItemScreen from "./src/screens/PostItemScreen";
import LoginScreen from "./src/screens/LoginScreen";
import { colors, radius } from "./src/theme";

export type RootStackParamList = {
  Home: undefined;
  ItemDetail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function BrandTitle() {
  return (
    <View style={brand.row}>
      <View style={brand.pill}>
        <Text style={brand.pillText}>CU</Text>
      </View>
      <Text style={brand.rest}>Finder</Text>
    </View>
  );
}

const brand = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  pill: {
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pillText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  rest: { color: colors.text, fontWeight: "700", fontSize: 18 },
});

const headerBase = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerShadowVisible: false,
  headerBottomBorderColor: colors.border,
} as const;

function BrowseStack() {
  return (
    <Stack.Navigator screenOptions={headerBase}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerTitle: () => <BrandTitle /> }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: "Item Details" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarIcon: () => null,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: { fontSize: 13, fontWeight: "600" },
        }}
      >
        <Tab.Screen
          name="Browse"
          component={BrowseStack}
          options={{ tabBarLabel: "Browse" }}
        />
        <Tab.Screen
          name="Post"
          component={PostItemScreen}
          options={{
            ...headerBase,
            headerShown: true,
            headerTitle: "Post an Item",
            tabBarLabel: "Post Item",
          }}
        />
        <Tab.Screen
          name="Login"
          component={LoginScreen}
          options={{
            ...headerBase,
            headerShown: true,
            headerTitle: () => <BrandTitle />,
            tabBarLabel: "Sign In",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
