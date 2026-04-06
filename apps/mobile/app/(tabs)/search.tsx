import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WORKER = 'https://nameless-limit-5817.senseiigarou.workers.dev';
interface Song { youtubeId: string; title: string; artist: string; cover: string; }

export default function SearchScreen() {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState<Song[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    fetch(`${WORKER}/api/youtube/search?q=${encodeURIComponent(q)}&max=8`)
      .then(r => r.json())
      .then(d => setResults(d.songs ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(text), 600);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.bar}>
        <Text style={s.barIcon}>🔍</Text>
        <TextInput style={s.input} value={query} onChangeText={handleChange}
          placeholder="Artists, songs…" placeholderTextColor="rgba(255,255,255,0.3)"
          returnKeyType="search" onSubmitEditing={() => doSearch(query)} />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && <ActivityIndicator color="#FF6B9D" size="large" style={{ marginTop: 60 }} />}

      <FlatList
        data={results}
        keyExtractor={i => i.youtubeId}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={searched && !loading
          ? <Text style={s.empty}>No results found</Text> : null}
        renderItem={({ item }) => (
          <View style={s.row}>
            {item.cover
              ? <Image source={{ uri: item.cover }} style={s.thumb} />
              : <View style={[s.thumb, { backgroundColor: '#1a1a1a', alignItems:'center', justifyContent:'center' }]}>
                  <Text>🎵</Text></View>
            }
            <View style={s.info}>
              <Text style={s.title} numberOfLines={1}>{item.title}</Text>
              <Text style={s.artist} numberOfLines={1}>{item.artist}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  bar:    { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  barIcon:{ fontSize: 16 },
  input:  { flex: 1, color: '#fff', fontSize: 15 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, marginBottom: 4 },
  thumb:  { width: 52, height: 52, borderRadius: 8, backgroundColor: '#1a1a1a' },
  info:   { flex: 1, minWidth: 0 },
  title:  { color: '#fff', fontSize: 14, fontWeight: '600' },
  artist: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  empty:  { color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 60, fontSize: 14 },
});
