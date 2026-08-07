'use client';

// "Complete your profile" modal — shown when someone tries to add a place,
// scenic pin, or event without having a display name, phone number, and
// Instagram handle on file yet (see BigBangLayout's isProfileComplete). Same
// chrome as UserAuthForm (which gates on being signed in at all) — this
// gates one step further, once signed in, on having enough contact info for
// admin/other users to actually reach them. Whatever place/scenic/event
// submission triggered the prompt is replayed automatically once this is
// saved (see BigBangLayout's onProfileCompleted).
import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useIsMobile } from './bigbang/ui';
import { apiGetAuthed, apiPut, uploadImage, ApiClientError } from '../lib/api';
import { imgUrl } from './bigbang/data';

export interface ProfileInfo {
  name: string;
  phoneNumber: string;
  socialMediaURL: string;
  email: string;
  avatarImage?: string;
}

interface Props {
  initial?: Partial<ProfileInfo> | null;
  token?: string;
  onClose: () => void;
  onSaved: (profile: ProfileInfo) => void;
  // Called instead of just showing an error when the save fails because the
  // signed-in session no longer refers to a real account (e.g. a long-lived
  // token from before the account was removed) — the parent clears the
  // stale session and re-prompts sign-in rather than this form retrying a
  // save that can never succeed.
  onSessionExpired?: () => void;
}

const PHONE_RE = /^\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Both name the way out, not just the problem: the conflicting account is
// almost always the same person's own earlier sign-in with the other contact
// method, so "sign in with it instead" is the actual fix.
const TAKEN_EMAIL_MSG = 'Энэ и-мэйл өөр бүртгэлд ашиглагдсан байна. Тэр бүртгэлээрээ нэвтэрч орох, эсвэл өөр и-мэйл оруулна уу.';
const TAKEN_PHONE_MSG = 'Энэ утасны дугаар өөр бүртгэлд ашиглагдсан байна. Тэр бүртгэлээрээ нэвтэрч орох, эсвэл өөр дугаар оруулна уу.';

export default function CompleteProfileForm({ initial, token, onClose, onSaved, onSessionExpired }: Props) {
  const isMobile = useIsMobile();
  const inputFontClass = isMobile ? 'text-base' : 'text-[13.5px]';
  const [name, setName] = useState(initial?.name || '');
  const [phone, setPhone] = useState(initial?.phoneNumber || '');
  const [instagram, setInstagram] = useState(initial?.socialMediaURL || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [avatarImage, setAvatarImage] = useState(initial?.avatarImage || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Once a phone/email is on file (whether from the original OTP sign-up or
  // a previous profile save), it's locked — these are what OTP re-verification
  // on every place/scenic/event submission checks against (see
  // BigBangLayout's onConfirmOtpVerified), so letting them be silently
  // swapped here would undermine that. Computed once from `initial` (not the
  // live `phone`/`email` state) so typing into a still-empty field doesn't
  // flip it to locked mid-keystroke.
  const phoneLocked = !!(initial?.phoneNumber && initial.phoneNumber.trim());
  const emailLocked = !!(initial?.email && initial.email.trim());

  // Signing in by phone and signing in by email each create their own account
  // (both are optional-and-unique on User), so one person can easily end up
  // with two — and then typing their real email here collides with the other
  // account and the save can never succeed. Checking as they type turns that
  // into an inline hint on the field itself, instead of a red error only
  // after Хадгалах with no indication of what to change.
  const [emailTaken, setEmailTaken] = useState(false);
  const [phoneTaken, setPhoneTaken] = useState(false);
  useEffect(() => {
    const candidateEmail = emailLocked || !EMAIL_RE.test(email.trim()) ? '' : email.trim();
    const candidatePhone = phoneLocked || !PHONE_RE.test(phone.trim()) ? '' : phone.trim();
    if (!candidateEmail && !candidatePhone) { setEmailTaken(false); setPhoneTaken(false); return; }
    if (!token) return;
    let alive = true;
    // Debounced — this fires per keystroke otherwise.
    const timer = setTimeout(() => {
      const qs = new URLSearchParams();
      if (candidateEmail) qs.set('email', candidateEmail);
      if (candidatePhone) qs.set('phone', candidatePhone);
      apiGetAuthed<{ emailTaken: boolean; phoneTaken: boolean }>(`/profile/contact-taken?${qs}`, token)
        .then((r) => { if (!alive) return; setEmailTaken(!!candidateEmail && r.emailTaken); setPhoneTaken(!!candidatePhone && r.phoneTaken); })
        .catch(() => {});
    }, 400);
    return () => { alive = false; clearTimeout(timer); };
  }, [email, phone, emailLocked, phoneLocked, token]);

  const stop = (ev: React.MouseEvent) => ev.stopPropagation();

  const pickAvatar = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
    setErr('');
  };

  const save = async () => {
    if (!name.trim()) { setErr('Нэрээ оруулна уу'); return; }
    if (!PHONE_RE.test(phone.trim())) { setErr('Утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233'); return; }
    if (!instagram.trim()) { setErr('Instagram хаягаа оруулна уу'); return; }
    if (!EMAIL_RE.test(email.trim())) { setErr('Зөв и-мэйл хаяг оруулна уу'); return; }
    if (emailTaken) { setErr(TAKEN_EMAIL_MSG); return; }
    if (phoneTaken) { setErr(TAKEN_PHONE_MSG); return; }
    setBusy(true);
    setErr('');
    try {
      const finalAvatar = avatarFile ? await uploadImage(avatarFile, 'bigbang/avatars', token) : avatarImage;
      const payload = { name: name.trim(), phoneNumber: phone.trim(), socialMediaURL: instagram.trim(), email: email.trim(), avatarImage: finalAvatar };
      await apiPut('/profile/me', payload, token);
      onSaved(payload);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 401 && onSessionExpired) { onSessionExpired(); return; }
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
          Газар, үзэсгэлэнт газар эсвэл эвент нэмэхийн тулд эхлээд нэр, утасны дугаар, Instagram, и-мэйлээ бүртгүүлнэ үү.
        </p>
        <div className="mb-4 flex justify-center">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Профайл зураг оруулах"
            className="relative h-[76px] w-[76px] cursor-pointer overflow-hidden rounded-full border-0 bg-[linear-gradient(135deg,_var(--accent,#E8B84B),_#b8895a)] p-0 font-[inherit] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {(avatarPreview || avatarImage) ? (
              <img src={avatarPreview || imgUrl(avatarImage, 200)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[26px] font-extrabold text-[#132a1f]">{(name || 'Б').charAt(0).toUpperCase()}</span>
            )}
            <span className="absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-[rgba(0,0,0,.55)] text-[rgba(246,241,231,.95)]"><Camera size={13} /></span>
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Нэр</span>
            <input value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="Бат-Эрдэнэ" className={`${inputClass} ${inputFontClass}`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>
              Утасны дугаар {phoneLocked && <span className="font-normal text-[rgba(242,237,227,.4)]">(баталгаажсан — өөрчлөх боломжгүй)</span>}
            </span>
            <input
              value={phone}
              disabled={phoneLocked}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 8)); setErr(''); }}
              placeholder="99112233" inputMode="numeric" maxLength={8}
              className={`${inputClass} ${inputFontClass} ${phoneLocked ? 'cursor-not-allowed opacity-60' : ''} ${phoneTaken ? 'border-[#f08a8a]' : ''}`}
            />
            {phoneTaken && <span className="text-[11px] leading-snug text-[#f08a8a]">{TAKEN_PHONE_MSG}</span>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Instagram</span>
            <input value={instagram} onChange={(e) => { setInstagram(e.target.value); setErr(''); }} placeholder="instagram.com/tanii_hayg" className={`${inputClass} ${inputFontClass}`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>
              И-мэйл {emailLocked && <span className="font-normal text-[rgba(242,237,227,.4)]">(баталгаажсан — өөрчлөх боломжгүй)</span>}
            </span>
            <input
              type="email" value={email} disabled={emailLocked}
              onChange={(e) => { setEmail(e.target.value); setErr(''); }}
              placeholder="tanii@email.com"
              className={`${inputClass} ${inputFontClass} ${emailLocked ? 'cursor-not-allowed opacity-60' : ''} ${emailTaken ? 'border-[#f08a8a]' : ''}`}
            />
            {emailTaken && <span className="text-[11px] leading-snug text-[#f08a8a]">{TAKEN_EMAIL_MSG}</span>}
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
