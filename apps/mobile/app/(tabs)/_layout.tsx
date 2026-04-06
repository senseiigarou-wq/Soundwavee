import { Tabs } from 'expo-router';
import { Home, Search, Library, Users, User } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#111111',
            borderTopColor: 'rgba(255,255,255,0.08)',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 4,
          },
          tabBarActiveTintColor:   '#FF6B9D',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        }}
      >
        <Tabs.Screen name="index"   options={{ title: 'Home',    tabBarIcon: ({ color }) => <Home    size={22} color={color} /> }} />
        <Tabs.Screen name="search"  options={{ title: 'Search',  tabBarIcon: ({ color }) => <Search  size={22} color={color} /> }} />
        <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: ({ color }) => <Library size={22} color={color} /> }} />
        <Tabs.Screen name="social"  options={{ title: 'Social',  tabBarIcon: ({ color }) => <Users   size={22} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <User    size={22} color={color} /> }} />
      </Tabs>
    </View>
  );
}
