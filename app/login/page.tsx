'use client';

// Login / Signup — real OTP flow (phone or email). There's no "host" tier —
// signing in here is the same account that can submit places/scenic
// pins/events from /profile (a place just lands pending admin approval).
// Converted from Login.dc.html to React + TypeScript + Tailwind.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PLACEHOLDER_IMG, isVideoUrl } from '@/components/bigbang/data';
import { apiGet } from '@/lib/api';
import { getSession, saveSession } from '@/lib/session';

const ACCENT = '#E8B84B';

const inputCls =
  'rounded-[11px] border border-white/20 bg-ink/[.35] px-[13px] py-[10px] font-sans text-cream outline-none transition-colors focus:border-accent placeholder:text-cream/[.32]';

export default function Login() {
  // Admin Panel → "Фон зураг" → "Нэвтрэх хуудасны фон". Best-effort, same as
  // AppShell's loader background: keep the placeholder photo if the backend
  // isn't reachable rather than showing an empty screen.
  const [bgSrc, setBgSrc] = useState('');

  useEffect(() => {
    apiGet<{ loginBackgroundImage: string | null }>('/settings')
      .then((s) => { if (s.loginBackgroundImage) setBgSrc(s.loginBackgroundImage); })
      .catch(() => {});
  }, []);

  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [contactErr, setContactErr] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'done'>('input');
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [devCode, setDevCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [otpErr, setOtpErr] = useState('');

  // Already signed in (e.g. reached /login directly by URL, or the "Гарах"
  // button hasn't been clicked) — skip straight to the "done" screen instead
  // of making them go through the OTP flow again and overwrite the session.
  useEffect(() => {
    if (getSession()) setStep('done');
  }, []);

  const isPhone = method === 'phone';
  const contactShown = contact || (isPhone ? '99112233' : 'tanii@email.mn');

  // Rejects an obviously malformed phone number / email instead of silently
  // accepting whatever was typed and pretending a code was sent.
  const requestCode = async () => {
    const v = contact.trim();
    if (!v) { setContactErr(isPhone ? 'Утасны дугаараа оруулна уу' : 'Имэйл хаягаа оруулна уу'); return; }
    if (isPhone ? !/^\d{8}$/.test(v) : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setContactErr(isPhone ? 'Утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233' : 'Имэйл хаяг буруу байна — жишээ: tanii@email.mn');
      return;
    }
    setContactErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method, contact: v }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Код илгээхэд алдаа гарлаа');
      // Dev mode — no SMS/email provider connected yet, so the backend hands
      // the code straight back instead of actually sending it.
      setDevCode(json.devCode || '');
      setStep('otp');
    } catch (e) {
      setContactErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onOtp = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, '').slice(-1);
    setOtp((o) => { const n = o.slice(); n[i] = d; return n; });
    if (d && i < 3) otpRefs.current[i + 1]?.focus();
  };

  const verifyCode = async () => {
    const code = otp.join('');
    if (code.length < 4) { setOtpErr('4 оронтой кодоо бүтэн оруулна уу'); return; }
    setBusy(true);
    setOtpErr('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method, contact: contact.trim(), code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Код буруу байна');
      saveSession(json.token, json.user);
      setStep('done');
    } catch (e) {
      setOtpErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const chip = (active: boolean) => ({
    background: active ? 'rgba(232, 184, 75,.18)' : 'transparent',
    color: active ? ACCENT : 'rgba(242,237,227,.7)',
    borderColor: active ? ACCENT : 'rgba(255,255,255,.25)',
  });

  return (
    <div>
      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10"
        data-screen-label="Нэвтрэх / Бүртгүүлэх"
      >
        {/* background — admin-set photo or video, else the placeholder photo.
            A video needs its own element (a gradient can't be layered into it
            via background-image), so the darkening overlay is a sibling there. */}
        {isVideoUrl(bgSrc) ? (
          <>
            <video src={bgSrc} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.72),rgba(0,0,0,.88))]" />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                `linear-gradient(rgba(0,0,0,.72), rgba(0,0,0,.88)), url('${bgSrc || PLACEHOLDER_IMG}')`,
            }}
          />
        )}

        {/* card */}
        <div
          className="relative w-[400px] max-w-full animate-bbFadeUp rounded-[20px] border border-white/[.28] bg-white/[.07] px-[26px] pb-[26px] pt-6 backdrop-blur-2xl backdrop-saturate-[1.2]"
          style={{ boxShadow: '0 30px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.22)' }}
        >
          {/* logo */}
          <div className="mb-[22px] flex items-center gap-[10px]">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-accent text-[14px] font-extrabold text-[#132a1f]">
              a
            </div>
            <span className="text-[15px] font-extrabold tracking-[-0.03em] text-cream">atlas</span>
          </div>

          {/* ══ USER FLOW ══ */}
          {step === 'input' && (
            <>
              <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.03em] text-cream-2">Тавтай морил 👋</h1>
              <p className="mb-5 mt-1.5 text-[13px] leading-relaxed text-cream/60">
                Утасны дугаар эсвэл имэйлээ оруулбал бид нэг удаагийн код илгээнэ.
              </p>

              <div className="mb-3.5 flex gap-1.5">
                {(['phone', 'email'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMethod(m); setContactErr(''); }}
                    className="rounded-full border px-4 py-[7px] text-[12px] font-bold transition-all"
                    style={chip(method === m)}
                  >
                    {m === 'phone' ? 'Утас' : 'Имэйл'}
                  </button>
                ))}
              </div>

              <label className="mb-1.5 flex flex-col gap-[7px]">
                <span className="text-[12px] font-bold text-cream/70">{isPhone ? 'Утасны дугаар' : 'Имэйл хаяг'}</span>
                <input
                  value={contact}
                  onChange={(e) => {
                    // Utас field only ever accepts digits, capped at 8 —
                    // rejected as you type, not just on submit.
                    const next = isPhone ? e.target.value.replace(/\D/g, '').slice(0, 8) : e.target.value;
                    setContact(next);
                    if (contactErr) setContactErr('');
                  }}
                  placeholder={isPhone ? '99112233' : 'tanii@email.mn'}
                  inputMode={isPhone ? 'numeric' : 'email'}
                  maxLength={isPhone ? 8 : undefined}
                  className={`${inputCls} text-[16px]`}
                />
              </label>
              <div className="mb-4 min-h-[15px]">
                {contactErr && <span className="text-[11.5px] font-bold text-[#f08a8a]">{contactErr}</span>}
              </div>

              <button
                onClick={requestCode}
                disabled={busy}
                className="w-full rounded-xl border-none bg-accent py-[11px] text-[14px] font-extrabold text-[#132a1f] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {busy ? '...' : 'Код авах →'}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.03em] text-cream-2">Кодоо оруулна уу</h1>
              <p className="mb-[22px] mt-1.5 text-[13px] leading-relaxed text-cream/60">
                <span className="font-bold text-accent">{contactShown}</span> руу 4 оронтой код илгээлээ.
              </p>

              {devCode && (
                <div className="mb-4 rounded-[10px] border border-dashed border-accent/50 bg-accent/10 px-3 py-2 text-[11.5px] font-bold text-accent">
                  Dev горим — SMS/имэйл үйлчилгээ холбогдоогүй тул код шууд энд: {devCode}
                </div>
              )}

              <div className="mb-5 flex justify-center gap-2.5">
                {otp.map((v, i) => (
                  <input
                    key={i}
                    value={v}
                    onChange={onOtp(i)}
                    ref={(n) => { otpRefs.current[i] = n; }}
                    maxLength={1}
                    inputMode="numeric"
                    className="h-14 w-[50px] rounded-[14px] border-[1.5px] bg-ink/[.35] text-center text-[26px] font-extrabold text-cream outline-none transition-colors focus:border-accent"
                    style={{ borderColor: v ? ACCENT : 'rgba(255,255,255,.2)' }}
                  />
                ))}
              </div>

              {otpErr && <div className="mb-3.5 text-[11.5px] font-bold text-[#f08a8a]">{otpErr}</div>}
              <button
                onClick={verifyCode}
                disabled={busy}
                className="w-full rounded-xl border-none bg-accent py-[11px] text-[14px] font-extrabold text-[#132a1f] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {busy ? '...' : 'Нэвтрэх →'}
              </button>
              <div className="mt-3.5 flex justify-between">
                <button
                  onClick={() => { setStep('input'); setOtp(['', '', '', '']); setOtpErr(''); }}
                  className="border-none bg-transparent p-0 text-[12px] font-bold text-cream/[.55] hover:text-accent"
                >
                  ← Буцах
                </button>
                <button onClick={requestCode} disabled={busy} className="border-none bg-transparent p-0 text-[12px] font-bold text-accent disabled:opacity-60">Дахин илгээх</button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div className="px-0 pb-2.5 pt-5 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-[rgba(168,213,162,.5)] bg-[rgba(168,213,162,.16)] text-[28px]">
                ✓
              </div>
              <h1 className="m-0 text-[22px] font-extrabold text-cream-2">Амжилттай нэвтэрлээ</h1>
              <p className="mb-[18px] mt-2 text-[13px] text-cream/60">Big bang-д тавтай морил!</p>
              <Link
                href="/"
                className="inline-block rounded-xl border-none bg-accent px-7 py-[11px] text-[14px] font-extrabold !text-[#132a1f]"
              >
                Big bang руу орох →
              </Link>
            </div>
          )}

          <div className="mt-5 text-center text-[11px] text-cream/40">
            Бүртгүүлснээр та <a href="#" className="font-bold">үйлчилгээний нөхцөл</a>-ийг зөвшөөрч байна
          </div>
        </div>
      </div>
    </div>
  );
}
