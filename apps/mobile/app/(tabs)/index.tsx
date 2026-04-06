import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const WORKER   = 'https://nameless-limit-5817.senseiigarou.workers.dev';
const CARD_W   = (width - 48) / 2;

const GENRES = [
  { id: 'all',    label: 'All',     emoji: '🎵' },
  { id: 'pop',    label: 'Pop',     emoji: '🎤' },
  { id: 'hiphop', label: 'Hip-Hop', emoji: '🎧' },
  { id: 'rnb',    label: 'R&B',     emoji: '🎷' },
  { id: 'opm',    label: 'OPM',     emoji: '🇵🇭' },
  { id: 'indie',  label: 'Indie',   emoji: '🌿' },
];

interface Song { youtubeId: string; title: string; artist: string; cover: string; }

export default function HomeScreen() {
  const [songs,   setSongs]   = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre,   setGenre]   = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch(`${WORKER}/api/youtube/trending?genre=${genre}&max=10`)
      .then(r => r.json())
      .then(d => setSongs(d.songs ?? []))
      .catch(() => setSongs([]))
      .finally(() => setLoading(false));
  }, [genre]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.greeting}>Good {greeting} 👋</Text>
          <Text style={s.title}>Soundwave</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {GENRES.map(g => (
            <TouchableOpacity key={g.id} onPress={() => setGenre(g.id)}
              style={[s.chip, genre === g.id && s.chipActive]}>
              <Text style={s.chipEmoji}>{g.emoji}</Text>
              <Text style={[s.chipLabel, genre === g.id && s.chipLabelActive]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Trending</Text>
          {loading
            ? <ActivityIndicator color="#FF6B9D" size="large" style={{ marginTop: 40 }} />
            : <View style={s.grid}>
                {songs.map(song => (
                  <View key={song.youtubeId} style={s.card}>
                    {song.cover
                      ? <Image source={{ uri: song.cover }} style={s.cardImg} />
                      : <View style={[s.cardImg, { backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 28 }}>🎵</Text>
                        </View>
                    }
                    <Text style={s.cardTitle} numberOfLines={1}>{song.title}</Text>
                    <Text style={s.cardArtist} numberOfLines={1}>{song.artist}</Text>
                  </View>
                ))}
              </View>
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#000' },
  header:         { padding: 20, paddingBottom: 8 },
  greeting:       { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  title:          { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  chips:          { marginBottom: 16 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginRight: 8 },
  chipActive:     { backgroundColor: 'rgba(255,107,157,0.15)', borderColor: 'rgba(255,107,157,0.4)' },
  chipEmoji:      { fontSize: 14 },
  chipLabel:      { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  chipLabelActive:{ color: '#FF6B9D' },
  section:        { paddingHorizontal: 16, paddingBottom: 120 },
  sectionTitle:   { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 14 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card:           { width: CARD_W },
  cardImg:        { width: CARD_W, height: CARD_W, borderRadius: 12 },
  cardTitle:      { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 8 },
  cardArtist:     { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
});
