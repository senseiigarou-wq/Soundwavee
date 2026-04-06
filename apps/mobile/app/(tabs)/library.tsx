import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function LibraryScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.heading}>Your Library</Text>
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📚</Text>
          <Text style={s.emptyText}>Your playlists and liked songs appear here</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#000' },
  content:   { padding: 20, paddingBottom: 120 },
  heading:   { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 24 },
  empty:     { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' },
});
