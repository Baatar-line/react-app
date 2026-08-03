import type { Metadata } from 'next';
import { Manrope, Playfair_Display, Rubik_Bubbles } from 'next/font/google';
import Script from 'next/script';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import AppShell from '../components/AppShell';

// next/font self-hosts these and injects a real `@font-face` for the literal
// family name ('Manrope' / 'Playfair Display') — every inline `fontFamily`
// string across the app already references those names directly, so nothing
// else needs to change; this just removes the old render-blocking Google
// Fonts <link> from index.html.
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-manrope' });
const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: ['700'], style: ['italic', 'normal'], variable: '--font-playfair' });
// Bubbly display face for MarauderLoader's 0-100% counter (see components/MarauderLoader.tsx).
const rubikBubbles = Rubik_Bubbles({ subsets: ['latin'], weight: ['400'], variable: '--font-rubik-bubbles' });

export const metadata: Metadata = {
  title: 'Big Bang — Minii Bolzoo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={`${manrope.variable} ${playfairDisplay.variable} ${rubikBubbles.variable}`}>
      <body>
        {/* Map / globe / travel engines — vanilla global scripts (see
            components/bigbang/BigBangLayout.tsx, GlobePage, AboutPage). Every
            call site already polls `if (!window.X) setTimeout(retry, 150)`
            before using these, so they don't need beforeInteractive. */}
        <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" />
        <Script src="https://unpkg.com/three@0.155.0/build/three.min.js" strategy="lazyOnload" />
        <Script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js" strategy="lazyOnload" />
        <Script src="https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js" strategy="lazyOnload" />
        {/* ?v= on the two local ones: they're plain files under public/, so they
            get no build hash and a browser will happily keep running the copy it
            already has after they're edited. Bump the number when editing them. */}
        <Script src="/assets/globe-engine.js?v=3" strategy="lazyOnload" />
        <Script src="/assets/travel-map.js?v=4" strategy="lazyOnload" />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
