/**
 * Root navigator.
 *
 * Holds the app open on the splash screen until AsyncStorage has rehydrated,
 * so the first frame already knows whether to show onboarding or the wallet.
 */
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useWallet } from '@/store/wallet';
import { colors, type } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useWallet((s) => s.hydrated);

  useEffect(() => {
    if (hydrated) void SplashScreen.hideAsync();
  }, [hydrated]);

  // Rendering nothing keeps the native splash up; without this the router
  // would briefly mount the wallet before rehydration flips to onboarding.
  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTitleStyle: type.header,
            headerTintColor: colors.accent,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding/create"
            options={{ title: 'Secret Recovery Phrase', headerBackTitle: 'Back' }}
          />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
          <Stack.Screen name="collectibles" options={{ title: 'Collectibles' }} />
          <Stack.Screen name="activity" options={{ title: 'Activity' }} />
          <Stack.Screen name="token/[id]" options={{ title: '' }} />
          <Stack.Screen name="send/index" options={{ title: 'Send', presentation: 'modal' }} />
          <Stack.Screen name="send/[id]" options={{ title: 'Send' }} />
          <Stack.Screen name="receive" options={{ title: 'Receive', presentation: 'modal' }} />
          <Stack.Screen name="buy" options={{ title: 'Buy', presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
          <Stack.Screen name="demo-settings" options={{ title: 'Demo Settings' }} />
          <Stack.Screen
            name="manage-tokens"
            options={{ title: 'Manage token list', presentation: 'modal' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
