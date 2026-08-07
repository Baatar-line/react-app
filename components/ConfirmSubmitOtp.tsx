'use client';

// Re-verification modal shown right before a place/scenic/event submission
// actually goes through (see BigBangLayout's onConfirmOtpVerified) — every
// single time, not just once. Unlike UserAuthForm (sign-in) this never asks
// for a contact value: phone/email are already on file (both mandatory —
// see CompleteProfileForm) and locked, so this only ever confirms a code
// sent to one of those two, via the account-scoped /api/auth/confirm-otp
// (no new session token, unlike /api/auth/verify-otp).
import React, { useRef, useState } from 'react';
import { useIsMobile } from './bigbang/ui';
import { apiPost } from '../lib/api';

type Step = 'request' | 'otp';
type Method = 'phone' | 'email';

interface Props {
  phone: string;
  email: string;
  token?: string;
  onClose: () => void;
  onVerified: () => void;
}

export default function ConfirmSubmitOtp({ phone, email, token, onClose, onVerified }: Props) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<Step>('request');
  const [method, setMethod] = useState<Method>(phone ? 'phone' : 'email');
  const [devCode, setDevCode] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const contact = method === 'phone' ? phone : email;

  const requestCode = async () => {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method, contact }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Код илгээхэд алдаа гарлаа');
      // Dev mode — no SMS/email provider connected yet, so the backend hands
      // the code straight back instead of actually sending it.
      setDevCode(json.devCode || '');
      setOtp(['', '', '', '']);
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
      await apiPost('/auth/confirm-otp', { method, code }, token);
      onVerified();
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

  // Deliberately no click-to-close on the backdrop, unlike the other modals:
  // this one sits on top of a submission that's already been filled in and
  // paid for with a code send, and a stray click just outside the card would
  // throw all of that away (see closeConfirmOtp — closing drops
  // _pendingCreate). The × is the only way out.
  return (
    <div className="fixed inset-0 z-[75] box-border flex items-center justify-center bg-[rgba(6,8,12,.72)] backdrop-blur-[8px] [animation:bbFadeUp_.25s_ease_both]" style={{ padding: isMobile ? '14px' : '36px' }}>
      <div className="box-border w-[400px] max-w-full rounded-2xl border border-[rgba(255,255,255,.14)] bg-[#171410] shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '26px 28px 28px' }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-extrabold tracking-[-0.02em] text-cream-2">Баталгаажуулах</div>
          <button onClick={onClose} className="h-8 w-8 cursor-pointer rounded-full border border-[rgba(242,237,227,.2)] bg-transparent font-[inherit] text-lg leading-none text-[rgba(242,237,227,.75)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">×</button>
        </div>

        {step === 'request' && (
          <>
            <p className="mb-4 text-[12.5px] leading-relaxed text-[rgba(242,237,227,.55)]">
              Аюулгүй байдлын үүднээс нийтлэхийн өмнө таны бүртгэлтэй утас эсвэл и-мэйл рүү нэг удаагийн код илгээж баталгаажуулна.
            </p>
            <div className="mb-3.5 flex gap-1.5">
              {phone && (
                <button onClick={() => { setMethod('phone'); setErr(''); }} className="rounded-full border px-4 py-[7px] text-[12px] font-bold transition-all" style={chip(method === 'phone')}>Утас</button>
              )}
              {email && (
                <button onClick={() => { setMethod('email'); setErr(''); }} className="rounded-full border px-4 py-[7px] text-[12px] font-bold transition-all" style={chip(method === 'email')}>Имэйл</button>
              )}
            </div>
            <div className="rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-[13px] py-[11px] text-[13.5px] font-semibold text-cream">{contact}</div>
            <button onClick={requestCode} disabled={busy || !contact} className="mt-4 w-full cursor-pointer rounded-xl border-none bg-[var(--accent,#E8B84B)] py-[11px] font-[inherit] text-[14px] font-extrabold text-[#132a1f] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
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
              {busy ? '...' : 'Баталгаажуулах →'}
            </button>
            <div className="mt-3.5 flex justify-between">
              <button onClick={() => { setStep('request'); setOtp(['', '', '', '']); setErr(''); }} className="border-none bg-transparent p-0 text-[12px] font-bold text-cream/[.55] hover:text-[var(--accent,#E8B84B)]">← Буцах</button>
              <button onClick={requestCode} disabled={busy} className="border-none bg-transparent p-0 text-[12px] font-bold text-[var(--accent,#E8B84B)]">Дахин илгээх</button>
            </div>
          </>
        )}

        {err && <div className="mt-3 text-[11.5px] font-bold text-[#f08a8a]">{err}</div>}
      </div>
    </div>
  );
}
