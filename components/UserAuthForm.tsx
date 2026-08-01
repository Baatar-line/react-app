'use client';

// Lightweight "sign in" modal — shown when someone tries to add a place,
// scenic pin, or event without a session. There's no "host" tier: any
// signed-in account can do all three (a place just lands `pending` until an
// admin approves it — see app/api/places/route.ts). Same phone/email OTP
// flow as the full-page /login screen, just compact enough to pop up mid-form
// without losing whatever the visitor already filled in.
import React, { useRef, useState } from 'react';
import { useIsMobile } from './bigbang/ui';

type Step = 'contact' | 'otp';
type Method = 'phone' | 'email';

interface Props {
  onClose: () => void;
  onAuthed: (token: string, user: any) => void;
}

export default function UserAuthForm({ onClose, onAuthed }: Props) {
  const isMobile = useIsMobile();
  const inputFontClass = isMobile ? 'text-base' : 'text-[13.5px]';
  const [step, setStep] = useState<Step>('contact');
  const [method, setMethod] = useState<Method>('phone');
  const [contact, setContact] = useState('');
  const [devCode, setDevCode] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const stop = (ev: React.MouseEvent) => ev.stopPropagation();

  const requestCode = async () => {
    const v = contact.trim();
    if (!v) { setErr(method === 'phone' ? 'Утасны дугаараа оруулна уу' : 'Имэйл хаягаа оруулна уу'); return; }
    setBusy(true);
    setErr('');
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
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onOtpDigit = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, '').slice(-1);
    setOtp((o) => { const n = o.slice(); n[i] = d; return n; });
    if (d && i < otp.length - 1) otpRefs.current[i + 1]?.focus();
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length < otp.length) { setErr('4 оронтой кодоо бүтэн оруулна уу'); return; }
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method, contact: contact.trim(), code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Код буруу байна');
      onAuthed(json.token, json.user);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const chip = (active: boolean) => ({
    background: active ? 'rgba(232, 184, 75,.18)' : 'transparent',
    color: active ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.7)',
    borderColor: active ? 'var(--accent,#E8B84B)' : 'rgba(255,255,255,.25)',
  });

  const inputClass = `w-full font-[inherit] rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-[13px] py-[11px] text-cream outline-none`;
  const labelSpanClass = 'text-xs font-semibold text-[rgba(242,237,227,.7)]';

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] box-border flex items-center justify-center bg-[rgba(6,8,12,.72)] backdrop-blur-[8px] [animation:bbFadeUp_.25s_ease_both]" style={{ padding: isMobile ? '14px' : '36px' }}>
      <div onClick={stop} className="box-border w-[400px] max-w-full rounded-2xl border border-[rgba(255,255,255,.14)] bg-[#171410] shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '26px 28px 28px' }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-extrabold tracking-[-0.02em] text-cream-2">Нэвтрэх</div>
          <button onClick={onClose} className="h-8 w-8 cursor-pointer rounded-full border border-[rgba(242,237,227,.2)] bg-transparent font-[inherit] text-lg leading-none text-[rgba(242,237,227,.75)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">×</button>
        </div>

        {step === 'contact' && (
          <>
            <p className="mb-4 text-[12.5px] leading-relaxed text-[rgba(242,237,227,.55)]">Газар, үзэсгэлэнт газар эсвэл эвент нэмэхийн тулд эхлээд нэвтрэх шаардлагатай. Бид нэг удаагийн код илгээнэ.</p>
            <div className="mb-3.5 flex gap-1.5">
              {(['phone', 'email'] as Method[]).map((m) => (
                <button key={m} onClick={() => { setMethod(m); setErr(''); }} className="rounded-full border px-4 py-[7px] text-[12px] font-bold transition-all" style={chip(method === m)}>
                  {m === 'phone' ? 'Утас' : 'Имэйл'}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={labelSpanClass}>{method === 'phone' ? 'Утасны дугаар' : 'Имэйл хаяг'}</span>
              <input
                value={contact}
                onChange={(e) => {
                  // Utас field only ever accepts digits, capped at 8 —
                  // rejected as you type, not just on submit.
                  const next = method === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 8) : e.target.value;
                  setContact(next);
                  setErr('');
                }}
                placeholder={method === 'phone' ? '99112233' : 'tanii@email.mn'}
                inputMode={method === 'phone' ? 'numeric' : 'email'}
                maxLength={method === 'phone' ? 8 : undefined}
                className={`${inputClass} ${inputFontClass}`}
              />
            </label>
            <button onClick={requestCode} disabled={busy} className="mt-4 w-full cursor-pointer rounded-xl border-none bg-[var(--accent,#E8B84B)] py-[11px] font-[inherit] text-[14px] font-extrabold text-[#132a1f] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
              {busy ? '...' : 'Код авах →'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="mb-4 text-[12.5px] leading-relaxed text-[rgba(242,237,227,.55)]">
              <span className="font-bold text-[var(--accent,#E8B84B)]">{contact}</span> руу 4 оронтой код илгээлээ.
            </p>
            {devCode && (
              <div className="mb-4 rounded-[10px] border border-dashed border-[rgba(232,184,75,.5)] bg-[rgba(232,184,75,.08)] px-3 py-2 text-[11.5px] font-bold text-[var(--accent,#E8B84B)]">
                Dev горим — SMS/имэйл үйлчилгээ холбогдоогүй тул код шууд энд: {devCode}
              </div>
            )}
            <div className="mb-4 flex justify-center gap-2.5">
              {otp.map((v, i) => (
                <input
                  key={i}
                  value={v}
                  onChange={onOtpDigit(i)}
                  ref={(n) => { otpRefs.current[i] = n; }}
                  maxLength={1}
                  inputMode="numeric"
                  className="h-14 w-[50px] rounded-[14px] border-[1.5px] bg-ink/[.35] text-center text-[26px] font-extrabold text-cream outline-none transition-colors focus:border-[var(--accent,#E8B84B)]"
                  style={{ borderColor: v ? 'var(--accent,#E8B84B)' : 'rgba(255,255,255,.2)' }}
                />
              ))}
            </div>
            <button onClick={verify} disabled={busy} className="w-full cursor-pointer rounded-xl border-none bg-[var(--accent,#E8B84B)] py-[11px] font-[inherit] text-[14px] font-extrabold text-[#132a1f] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
              {busy ? '...' : 'Нэвтрэх →'}
            </button>
            <div className="mt-3.5 flex justify-between">
              <button onClick={() => { setStep('contact'); setOtp(['', '', '', '']); setErr(''); }} className="border-none bg-transparent p-0 text-[12px] font-bold text-cream/[.55] hover:text-[var(--accent,#E8B84B)]">← Буцах</button>
              <button onClick={requestCode} disabled={busy} className="border-none bg-transparent p-0 text-[12px] font-bold text-[var(--accent,#E8B84B)]">Дахин илгээх</button>
            </div>
          </>
        )}

        {err && <div className="mt-3 text-[11.5px] font-bold text-[#f08a8a]">{err}</div>}
      </div>
    </div>
  );
}
