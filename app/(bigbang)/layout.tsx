import { BigBangLayoutRoute } from '../../components/bigbang/BigBangLayout';
import AdModal from '../../components/AdModal';

// AdModal lives here (not in the root AppShell) so it only shows on the
// public-facing app — AppShell also wraps /admin, /login, /requirements,
// none of which should ever pop up a visitor-facing ad over the UI.
export default function BigBangGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <BigBangLayoutRoute>
      {children}
      <AdModal />
    </BigBangLayoutRoute>
  );
}
