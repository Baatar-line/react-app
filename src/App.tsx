import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BigBangLayoutRoute } from './screens/bigbang/BigBangLayout';
import Home from './screens/bigbang/pages/Home';
import CategoryPage from './screens/bigbang/pages/CategoryPage';
import PlaceDetail from './screens/bigbang/pages/PlaceDetail';
import MapsPage from './screens/bigbang/pages/MapsPage';
import GlobePage from './screens/bigbang/pages/GlobePage';
import EventPage from './screens/bigbang/pages/EventPage';
import SuggestPage from './screens/bigbang/pages/SuggestPage';
import SuggestDetail from './screens/bigbang/pages/SuggestDetail';
import AboutPage from './screens/bigbang/pages/AboutPage';
import ProfilePage from './screens/bigbang/pages/ProfilePage';
import Requirements from './screens/Requirements';
import Login from './screens/Login';
import AdminPanel from './screens/AdminPanel';
import HostProfile from './screens/HostProfile';
import MarauderLoader from './components/MarauderLoader';

export default function App() {
  // Runs once per app load (not per route — this component doesn't remount
  // on client-side navigation), then unmounts for good.
  const [loading, setLoading] = useState(true);

  if (loading) return <MarauderLoader loop={false} onFinish={() => setLoading(false)} />;

  return (
    <Routes>
      <Route path="/" element={<BigBangLayoutRoute />}>
        <Route index element={<Home />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="category/:slug/place/:index" element={<PlaceDetail />} />
        <Route path="maps" element={<MapsPage />} />
        <Route path="globe" element={<GlobePage />} />
        <Route path="event" element={<EventPage />} />
        <Route path="suggest" element={<SuggestPage />} />
        <Route path="suggest/:slug" element={<SuggestDetail />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="/requirements" element={<Requirements />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/host" element={<HostProfile />} />
      {/* API & Database screen can be added here once converted. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
