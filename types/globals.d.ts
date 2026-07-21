/// <reference types="react" />
// Global engine typings for the vanilla scripts loaded via next/script in app/layout.tsx
// (leaflet, three, d3, topojson-client, /assets/globe-engine.js, /assets/travel-map.js).
export {};

declare global {
  interface Window {
    L: any;
    THREE: any;
    d3: any;
    topojson: any;
    GlobeEngine: any;
    resolveCountry: (name: string) => any;
    GLOBE_COUNTRIES: { name: string; region: string; description: string; categories: string[] }[];
    renderTravelMap: (el: HTMLElement) => void;
    TRAVEL_ORIGINS: { rank: number; country: string; v: number; est?: boolean }[];
  }
}
