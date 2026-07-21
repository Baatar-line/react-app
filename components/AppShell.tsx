'use client';

import { useState } from 'react';
import MarauderLoader from './MarauderLoader';

// Runs once per full page load (not per client-side route change — this
// component doesn't remount on navigation within the app), then unmounts
// for good, same as the old App.tsx's loading gate.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  if (loading) return <MarauderLoader loop={false} onFinish={() => setLoading(false)} />;

  return <>{children}</>;
}
