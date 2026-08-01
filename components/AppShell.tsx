'use client';

import { useEffect, useState } from 'react';
import MarauderLoader from './MarauderLoader';
import { apiGet } from '@/lib/api';

// Runs once per full page load (not per client-side route change — this
// component doesn't remount on navigation within the app), then unmounts
// for good, same as the old App.tsx's loading gate.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  // Admin Panel can set this via the "Ачаалж буй дэлгэцийн фон" tab — same
  // best-effort fetch as BigBangLayout's own fetchSettings; silently keeps
  // the built-in gradient if the backend isn't reachable.
  const [loaderBg, setLoaderBg] = useState<string | undefined>(undefined);
  // MarauderLoader used to mount instantly with no photo, then swap to the
  // fetched one mid-animation once /settings resolved — a visible flash from
  // the default gradient to the real background. Hold the loader off-screen
  // until the fetch has settled (success or fail) so it always mounts already
  // knowing the right background, never has to swap.
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    apiGet<{ loaderBackgroundImage: string | null }>('/settings')
      .then((s) => { if (s.loaderBackgroundImage) setLoaderBg(s.loaderBackgroundImage); })
      .catch(() => {})
      .finally(() => setSettingsReady(true));
  }, []);

  if (loading) {
    if (!settingsReady) return <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0b0d0b' }} />;
    // MarauderLoader's own animation length is independent of how fast the
    // real page/data loaded — it always runs the full duration below, then
    // waits for the pin-drop (a fixed .9s baked into MarauderLoader) before
    // calling onFinish. So on a fast connection this is what makes the site
    // still hold on the loader instead of revealing itself the instant it's
    // ready; 2100ms + that .9s = a consistent ~3s splash either way.
    return <MarauderLoader loop={false} duration={2100} onFinish={() => setLoading(false)} backgroundImage={loaderBg} />;
  }

  return <>{children}</>;
}
