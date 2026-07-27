'use client';

// Login / Signup — OTP user flow + Host registration flow.
// Converted from Login.dc.html to React + TypeScript + Tailwind.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PLACEHOLDER_IMG, isVideoUrl } from '@/components/bigbang/data';
import { apiGet } from '@/lib/api';

const ACCENT = '#E8B84B';

const inputCls =
  'rounded-[11px] border border-white/20 bg-ink/[.35] px-[13px] py-[10px] font-sans text-cream outline-none transition-colors focus:border-accent placeholder:text-cream/[.32]';

export default function Login() {
  const [role, setRole] = useState<'user' | 'host'>('user');
  // Admin Panel → "Фон зураг" → "Нэвтрэх хуудасны фон". Best-effort, same as
  // AppShell's loader background: keep the placeholder photo if the backend
  // isn't reachable rather than showing an empty screen.
  const [bgSrc, setBgSrc] = useState('');

  useEffect(() => {
    apiGet<{ loginBackgroundImage: string | null }>('/settings')
      .then((s) => { if (s.loginBackgroundImage) setBgSrc(s.loginBackgroundImage); })
      .catch(() => {});
  }, []);

  // user flow
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'done'>('input');
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // host flow
  const [hEmail, setHEmail] = useState('');
  const [hPhone, setHPhone] = useState('');
  const [hPass, setHPass] = useState('');
  const [hostDone, setHostDone] = useState(false);

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

          {/* role switch */}
          <div className="mb-[22px] flex gap-1.5 rounded-full border border-white/[.14] bg-ink/40 p-[5px]">
            {(['user', 'host'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="flex-1 rounded-full border-none py-[7px] text-[13px] font-bold transition-all"
                style={role === r
                  ? { background: ACCENT, color: '#132a1f' }
                  : { background: 'transparent', color: 'rgba(242,237,227,.75)' }}
              >
                {r === 'user' ? 'Хэрэглэгч' : 'Host — газар нэмэгч'}
              </button>
            ))}
          </div>

          {/* ══ USER FLOW ══ */}
          {role === 'user' && step === 'input' && (
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

          {role === 'user' && step === 'otp' && (
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

          {role === 'user' && step === 'done' && (
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

          {/* ══ HOST FLOW ══ */}
          {role === 'host' && (
            <>
              <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.03em] text-cream-2">Host болж бүртгүүлэх</h1>
              <p className="mb-5 mt-1.5 text-[13px] leading-relaxed text-cream/60">
                Өөрийн газраа big bang дээр нэмж, болзооны газруудын сүлжээнд нэгдээрэй.
              </p>

              <div className="flex flex-col gap-3.5">
                {[
                  { label: 'Имэйл', v: hEmail, set: setHEmail, ph: 'tanii@email.mn', type: 'text', mode: undefined },
                  { label: 'Утасны дугаар', v: hPhone, set: setHPhone, ph: '99112233', type: 'text', mode: 'numeric' as const },
                  { label: 'Нууц үг', v: hPass, set: setHPass, ph: 'Дор хаяж 8 тэмдэгт', type: 'password', mode: undefined },
                ].map((f) => (
                  <label key={f.label} className="flex flex-col gap-[7px]">
                    <span className="text-[12px] font-bold text-cream/70">{f.label}</span>
                    <input
                      type={f.type}
                      value={f.v}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.ph}
                      inputMode={f.mode}
                      className={`${inputCls} text-[16px]`}
                    />
                  </label>
                ))}

                <button
                  onClick={() => hEmail.trim() && hPhone.trim() && hPass.trim() && setHostDone(true)}
                  className="mt-1 w-full rounded-xl border-none bg-accent py-[11px] text-[14px] font-extrabold text-[#132a1f] transition-transform hover:-translate-y-0.5"
                >
                  Бүртгүүлэх →
                </button>

                {hostDone && (
                  <div className="mt-1 flex flex-col gap-3">
                    <div className="flex items-center gap-2.5 rounded-xl border border-[rgba(168,213,162,.4)] bg-[rgba(168,213,162,.12)] px-[15px] py-3 text-[12px] font-bold text-[#a8d5a2]">
                      ✓ Хүсэлт илгээгдлээ — админ баталсны дараа газраа нэмэх боломжтой болно.
                    </div>
                    <Link
                      href="/"
                      className="rounded-xl border-none bg-accent py-[11px] text-center text-[14px] font-extrabold !text-[#132a1f]"
                    >
                      Big bang руу орох →
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mt-5 text-center text-[11px] text-cream/40">
            Бүртгүүлснээр та <a href="#" className="font-bold">үйлчилгээний нөхцөл</a>-ийг зөвшөөрч байна
          </div>
        </div>
      </div>
    </div>
  );
}
