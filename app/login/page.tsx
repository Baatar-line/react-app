'use client';

// Login / Signup — OTP user flow. Signup always creates a plain user
// account; becoming a host happens later from /profile (see "Host болох"
// there), not as a separate signup path here.
// Converted from Login.dc.html to React + TypeScript + Tailwind.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PLACEHOLDER_IMG, isVideoUrl } from '@/components/bigbang/data';
import { apiGet } from '@/lib/api';

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

  // Signup only ever creates a plain user account now — becoming a host
  // happens later, from the same account, via the "Host болох" flow on
  // /profile (see BigBangLayout's hostForm state) instead of a separate
  // signup path here.
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'done'>('input');
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isPhone = method === 'phone';
  const contactShown = contact || (isPhone ? '99112233' : 'tanii@email.mn');

  const onOtp = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, '').slice(-1);
    setOtp((o) => { const n = o.slice(); n[i] = d; return n; });
    if (d && i < 3) otpRefs.current[i + 1]?.focus();
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
              b
            </div>
            <span className="text-[15px] font-extrabold tracking-[-0.03em] text-cream">big bang</span>
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
                    onClick={() => setMethod(m)}
                    className="rounded-full border px-4 py-[7px] text-[12px] font-bold transition-all"
                    style={chip(method === m)}
                  >
                    {m === 'phone' ? 'Утас' : 'Имэйл'}
                  </button>
                ))}
              </div>

              <label className="mb-4 flex flex-col gap-[7px]">
                <span className="text-[12px] font-bold text-cream/70">{isPhone ? 'Утасны дугаар' : 'Имэйл хаяг'}</span>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={isPhone ? '99112233' : 'tanii@email.mn'}
                  className={`${inputCls} text-[16px]`}
                />
              </label>

              <button
                onClick={() => contact.trim() && setStep('otp')}
                className="w-full rounded-xl border-none bg-accent py-[11px] text-[14px] font-extrabold text-[#132a1f] transition-transform hover:-translate-y-0.5"
              >
                Код авах →
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.03em] text-cream-2">Кодоо оруулна уу</h1>
              <p className="mb-[22px] mt-1.5 text-[13px] leading-relaxed text-cream/60">
                <span className="font-bold text-accent">{contactShown}</span> руу 4 оронтой код илгээлээ.
              </p>

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

              <button
                onClick={() => otp.every((d) => d) && setStep('done')}
                className="w-full rounded-xl border-none bg-accent py-[11px] text-[14px] font-extrabold text-[#132a1f] transition-transform hover:-translate-y-0.5"
              >
                Нэвтрэх →
              </button>
              <div className="mt-3.5 flex justify-between">
                <button
                  onClick={() => { setStep('input'); setOtp(['', '', '', '']); }}
                  className="border-none bg-transparent p-0 text-[12px] font-bold text-cream/[.55] hover:text-accent"
                >
                  ← Буцах
                </button>
                <button className="border-none bg-transparent p-0 text-[12px] font-bold text-accent">Дахин илгээх</button>
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
