import { BigBangLayoutRoute } from '../../components/bigbang/BigBangLayout';

export default function BigBangGroupLayout({ children }: { children: React.ReactNode }) {
  return <BigBangLayoutRoute>{children}</BigBangLayoutRoute>;
}
