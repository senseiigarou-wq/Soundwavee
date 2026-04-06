import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

try { SplashScreen.preventAutoHideAsync(); } catch {}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const t = setTimeout(async () => {
      try { await SplashScreen.hideAsync(); } catch {}
      setReady(true);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#000000" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#000000' },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="player"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
