'use client';

// "Complete your profile" modal — shown when someone tries to add a place,
// scenic pin, or event without having a display name, phone number, and
// Instagram handle on file yet (see BigBangLayout's isProfileComplete). Same
// chrome as UserAuthForm (which gates on being signed in at all) — this
// gates one step further, once signed in, on having enough contact info for
// admin/other users to actually reach them. Whatever place/scenic/event
// submission triggered the prompt is replayed automatically once this is
// saved (see BigBangLayout's onProfileCompleted).
import React, { useState } from 'react';
import { useIsMobile } from './bigbang/ui';
import { apiPut } from '../lib/api';

export interface ProfileInfo {
  name: string;
  phoneNumber: string;
  socialMediaURL: string;
}

interface Props {
  initial?: Partial<ProfileInfo> | null;
  token?: string;
  onClose: () => void;
  onSaved: (profile: ProfileInfo) => void;
}

const PHONE_RE = /^\d{8}$/;

export default function CompleteProfileForm({ initial, token, onClose, onSaved }: Props) {
  const isMobile = useIsMobile();
  const inputFontClass = isMobile ? 'text-base' : 'text-[13.5px]';
  const [name, setName] = useState(initial?.name || '');
  const [phone, setPhone] = useState(initial?.phoneNumber || '');
  const [instagram, setInstagram] = useState(initial?.socialMediaURL || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const stop = (ev: React.MouseEvent) => ev.stopPropagation();

  const save = async () => {
    if (!name.trim()) { setErr('Нэрээ оруулна уу'); return; }
    if (!PHONE_RE.test(phone.trim())) { setErr('Утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233'); return; }
    if (!instagram.trim()) { setErr('Instagram хаягаа оруулна уу'); return; }
    setBusy(true);
    setErr('');
    try {
      await apiPut('/profile/me', { name: name.trim(), phoneNumber: phone.trim(), socialMediaURL: instagram.trim() }, token);
      onSaved({ name: name.trim(), phoneNumber: phone.trim(), socialMediaURL: instagram.trim() });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const inputClass = `w-full font-[inherit] rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-[13px] py-[11px] text-cream outline-none`;
  const labelSpanClass = 'text-xs font-semibold text-[rgba(242,237,227,.7)]';

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] box-border flex items-center justify-center bg-[rgba(6,8,12,.72)] backdrop-blur-[8px] [animation:bbFadeUp_.25s_ease_both]" style={{ padding: isMobile ? '14px' : '36px' }}>
      <div onClick={stop} className="box-border w-[400px] max-w-full rounded-2xl border border-[rgba(255,255,255,.14)] bg-[#171410] shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '26px 28px 28px' }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-extrabold tracking-[-0.02em] text-cream-2">Профайлаа бөглөнө үү</div>
          <button onClick={onClose} className="h-8 w-8 cursor-pointer rounded-full border border-[rgba(242,237,227,.2)] bg-transparent font-[inherit] text-lg leading-none text-[rgba(242,237,227,.75)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">×</button>
        </div>
        <p className="mb-4 text-[12.5px] leading-relaxed text-[rgba(242,237,227,.55)]">
          Газар, үзэсгэлэнт газар эсвэл эвент нэмэхийн тулд эхлээд нэр, утасны дугаар, Instagram-аа бүртгүүлнэ үү.
        </p>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Нэр</span>
            <input value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="Бат-Эрдэнэ" className={`${inputClass} ${inputFontClass}`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Утасны дугаар</span>
            <input
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 8)); setErr(''); }}
              placeholder="99112233" inputMode="numeric" maxLength={8}
              className={`${inputClass} ${inputFontClass}`}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Instagram</span>
            <input value={instagram} onChange={(e) => { setInstagram(e.target.value); setErr(''); }} placeholder="instagram.com/tanii_hayg" className={`${inputClass} ${inputFontClass}`} />
          </label>
        </div>
        <button onClick={save} disabled={busy} className="mt-4 w-full cursor-pointer rounded-xl border-none bg-[var(--accent,#E8B84B)] py-[11px] font-[inherit] text-[14px] font-extrabold text-[#132a1f] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
          {busy ? '...' : 'Хадгалах →'}
        </button>
        {err && <div className="mt-3 text-[11.5px] font-bold text-[#f08a8a]">{err}</div>}
      </div>
    </div>
  );
}
