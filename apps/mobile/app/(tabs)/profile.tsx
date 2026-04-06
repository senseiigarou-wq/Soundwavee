import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function ProfileScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.heading}>Profile</Text>
        <View style={s.card}>
          <Text style={s.icon}>🎵</Text>
          <Text style={s.appName}>Soundwave</Text>
          <Text style={s.sub}>Your personal music streaming app</Text>
          <Text style={s.badge}>YouTube · Jamendo · Offline</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#000' },
  content: { padding: 20, paddingBottom: 120 },
  heading: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 24 },
  card:    { alignItems: 'center', padding: 32, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 10 },
  icon:    { fontSize: 48 },
  appName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub:     { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
  badge:   { color: '#FF6B9D', fontSize: 12, fontWeight: '700' },
});
