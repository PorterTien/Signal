import React from 'react';
import { Tabs } from 'expo-router';
import { BarChart3, ListChecks } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121316',
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarActiveTintColor: '#FC4C02',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size ?? 22} />,
        }}
      />
    </Tabs>
  );
}
