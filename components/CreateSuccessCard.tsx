'use client';

// Small confirmation card shown right after a place/scenic pin/event actually
// gets created — i.e. once ConfirmSubmitOtp's per-submission re-verify has
// passed and the row is in (see BigBangLayout's onConfirmOtpVerified). Until
// this existed, a successful submission just closed every modal and left the
// user on whatever page they started from, with nothing saying it worked.
// The profile button matters as much as the message: a submission's real
// state (a place waiting on admin approval, a scenic pin/event already live)
// only shows up on the Profile page's "Миний нэмсэн…" lists.
import React from 'react';
import { Check } from 'lucide-react';
import { useIsMobile } from './bigbang/ui';

interface Props {
  kind: 'place' | 'scenic' | 'event';
  /** BigBangLayout's active language pack (V.L) — keeps the copy in whichever
   * language the rest of the UI is currently in. */
  L: any;
  onClose: () => void;
  onGoProfile: () => void;
}

export default function CreateSuccessCard({ kind, L, onClose, onGoProfile }: Props) {
  const isMobile = useIsMobile();
  const stop = (ev: React.MouseEvent) => ev.stopPropagation();
  const title = kind === 'place' ? L.createdPlaceTitle : kind === 'scenic' ? L.createdScenicTitle : L.createdEventTitle;
  // Only a place goes through moderation — the other two are live the moment
  // they're created (same split the "Контент нэмэх" cards' badges show).
  const note = kind === 'place' ? L.createdPlaceNote : L.createdInstantNote;

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] box-border flex items-center justify-center bg-[rgba(6,8,12,.72)] backdrop-blur-[8px] [animation:bbFadeUp_.25s_ease_both]" style={{ padding: isMobile ? '14px' : '36px' }}>
      <div onClick={stop} className="box-border w-[340px] max-w-full rounded-2xl border border-[rgba(255,255,255,.14)] bg-[#171410] text-center shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '22px 18px 20px' : '26px 24px 24px' }}>
        <div className="mx-auto mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[rgba(168,213,162,.14)] text-[#a8d5a2]">
          <Check size={26} strokeWidth={3} />
        </div>
        <div className="text-[16.5px] font-extrabold tracking-[-0.02em] text-cream-2">{title}</div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[rgba(242,237,227,.55)]">{note}</p>
        <button
          onClick={onGoProfile}
          className="mt-4 w-full cursor-pointer rounded-xl border-none bg-[var(--accent,#E8B84B)] py-[11px] font-[inherit] text-[13.5px] font-extrabold text-[#132a1f] transition-transform hover:-translate-y-0.5"
        >
          {L.createdGoProfile}
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full cursor-pointer rounded-xl border border-[rgba(242,237,227,.2)] bg-transparent py-[10px] font-[inherit] text-[12.5px] font-bold text-[rgba(242,237,227,.7)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]"
        >
          {L.createdClose}
        </button>
      </div>
    </div>
  );
}
