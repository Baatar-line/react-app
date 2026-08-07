'use client';

import { useEffect, useState } from 'react';
import MarauderLoader from './MarauderLoader';
import { apiGet } from '@/lib/api';

// Runs once per full page load (not per client-side route change — this
// component doesn't remount on navigation within the app), then unmounts
// for good, same as the old App.tsx's loading gate.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [homeReady, setHomeReady] = useState(false);
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
  useEffect(() => {
    const ready = () => setHomeReady(true);
    window.addEventListener('atlas:home-ready', ready);
    const fallback = window.setTimeout(ready, 15000);
    return () => { window.removeEventListener('atlas:home-ready', ready); window.clearTimeout(fallback); };
  }, []);
  useEffect(() => {
    if (animationFinished && homeReady) setLoading(false);
  }, [animationFinished, homeReady]);

  return <>
    {children}
    {loading && (settingsReady
      ? <MarauderLoader loop={false} duration={2100} onFinish={() => setAnimationFinished(true)} backgroundImage={loaderBg} />
      : <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0b0d0b' }} />)}
  </>;
}
