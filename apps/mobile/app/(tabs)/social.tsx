import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function SocialScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.heading}>Community</Text>
        <View style={s.card}>
          <Text style={s.icon}>👥</Text>
          <Text style={s.title}>Social features coming soon</Text>
          <Text style={s.sub}>Follow friends and share music on soundwavee.pages.dev</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#000' },
  content: { padding: 20, paddingBottom: 120 },
  heading: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 24 },
  card:    { alignItems: 'center', padding: 32, borderRadius: 20, backgroundColor: 'rgba(255,107,157,0.06)', borderWidth: 1, borderColor: 'rgba(255,107,157,0.15)', gap: 12 },
  icon:    { fontSize: 48 },
  title:   { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  sub:     { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
