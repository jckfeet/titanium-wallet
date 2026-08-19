/** Entry route: sends a fresh install to onboarding, everyone else to the wallet. */
import { Redirect } from 'expo-router';
import React from 'react';

import { useWallet } from '@/store/wallet';

export default function Index() {
  const onboarded = useWallet((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
