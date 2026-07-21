// Login / Signup — OTP user flow + Host registration flow.
// Converted from Login.dc.html to React + TypeScript + Tailwind.
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Accessibility, Eye, type LucideIcon } from 'lucide-react';
import { PLACEHOLDER_IMG } from './bigbang/data';

const ACCENT = '#E8B84B';

const HCRIT = [
  'Тэргэнцэртэй орох боломж — хаалганы өргөн ≥ 120 см',
  'Тусгай зам (налуу зам)',
  'Тэргэнцэрт зориулсан ариун цэврийн өрөө',
  'Довжоо / налуу гарц',
  'Тайлбар бичлэг (дүрс, дууны тайлбар)',
];

const inputCls =
  'rounded-[11px] border border-white/20 bg-ink/[.35] px-[13px] py-[10px] font-sans text-cream outline-none transition-colors focus:border-accent placeholder:text-cream/[.32]';

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className="relative h-6 w-[42px] flex-shrink-0 rounded-full transition-colors"
      style={{ background: on ? ACCENT : 'rgba(255,255,255,.2)' }}
    >
      <span
        className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-[left]"
        style={{ left: on ? 21 : 3 }}
      />
    </span>
  );
}

function AccessRow({
  icon: Icon,
  title,
  desc,
  on,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border px-[15px] py-[13px] text-left transition-all"
      style={{
        borderColor: on ? ACCENT : 'rgba(255,255,255,.18)',
        background: on ? 'rgba(232, 184, 75,.14)' : 'rgba(0,0,0,.3)',
      }}
    >
      <Icon size={19} className="text-cream" />
      <span className="flex-1">
        <span className="block font-bold text-cream">{title}</span>
        <span className="mt-0.5 block text-[11px] text-cream/[.55]">{desc}</span>
      </span>
      <Toggle on={on} />
    </button>
  );
}

export default function Login() {
  const [role, setRole] = useState<'user' | 'host'>('user');

  // user flow
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'done'>('input');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [spNeeds, setSpNeeds] = useState(false);
  const [a11y, setA11y] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // host flow
  const [hEmail, setHEmail] = useState('');
  const [hPhone, setHPhone] = useState('');
  const [hPass, setHPass] = useState('');
  const [hPlace, setHPlace] = useState('');
  const [hA11y, setHA11y] = useState(false);
  const [hCrit, setHCrit] = useState([false, false, false, false, false]);
  const [hostDone, setHostDone] = useState(false);

  const isPhone = method === 'phone';
  const contactShown = contact || (isPhone ? '99112233' : 'tanii@email.mn');
  const hAllCrit = hA11y && hCrit.every(Boolean);

  const toggleSp = () => {
    setSpNeeds((v) => {
      try { localStorage.setItem('bb_sp', !v ? '1' : '0'); } catch { /* ignore */ }
      return !v;
    });
  };
  const toggleA11y = () => {
    setA11y((v) => {
      try { localStorage.setItem('bb_big', !v ? '1' : '0'); } catch { /* ignore */ }
      return !v;
    });
  };

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
    <div className={a11y ? 'bb-hc' : undefined}>
      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10"
        data-screen-label="Нэвтрэх / Бүртгүүлэх"
      >
        {/* background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              `linear-gradient(rgba(0,0,0,.72), rgba(0,0,0,.88)), url('${PLACEHOLDER_IMG}')`,
          }}
        />

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

              <div className="mb-2.5">
                <AccessRow
                  icon={Accessibility}
                  title="Тусгай хэрэгцээт юу?"
                  desc="Тийм бол ♿ шалгуур хангасан газруудыг хамгийн дээр харуулна"
                  on={spNeeds}
                  onClick={toggleSp}
                />
              </div>
              <div className="mb-[18px]">
                <AccessRow
                  icon={Eye}
                  title="Харааны бэрхшээлтэй юу?"
                  desc="Тийм бол товч, текстийг стандартын дагуу томоор, тодоор харуулна"
                  on={a11y}
                  onClick={toggleA11y}
                />
              </div>

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
              <p className="mb-[18px] mt-2 text-[13px] text-cream/60">
                {a11y ? 'Том текстийн горим идэвхжсэн байна.' : 'Big bang-д тавтай морил!'}
              </p>
              <Link
                to="/"
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
                  { label: 'Газрын нэр', v: hPlace, set: setHPlace, ph: 'Ж: Sky Lounge 21', type: 'text', mode: undefined },
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

                <AccessRow
                  icon={Accessibility}
                  title="Хөгжлийн бэрхшээлтэй хүнд тохиромжтой юу?"
                  desc="Сонговол доорх шалгууруудыг бүгдийг хангасан байх шаардлагатай"
                  on={hA11y}
                  onClick={() => setHA11y((v) => !v)}
                />

                {hA11y && (
                  <div className="flex flex-col gap-2 rounded-xl border border-dashed border-[rgba(232, 184, 75,.45)] bg-[rgba(232, 184, 75,.05)] px-[15px] py-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.06em] text-accent">
                      <Accessibility size={13} /> Шалгуурууд — бүгдийг хангасан байх
                    </div>
                    {HCRIT.map((label, i) => {
                      const on = hCrit[i];
                      return (
                        <button
                          key={i}
                          onClick={() => setHCrit((c) => { const n = c.slice(); n[i] = !n[i]; return n; })}
                          className="flex items-center gap-2.5 rounded-[9px] border px-2.5 py-2 text-left transition-all"
                          style={{
                            borderColor: on ? 'rgba(232, 184, 75,.4)' : 'rgba(255,255,255,.12)',
                            background: on ? 'rgba(232, 184, 75,.1)' : 'transparent',
                          }}
                        >
                          <span
                            className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border-[1.5px] text-[12px] font-extrabold text-[#132a1f]"
                            style={{
                              borderColor: on ? ACCENT : 'rgba(255,255,255,.3)',
                              background: on ? ACCENT : 'transparent',
                            }}
                          >
                            {on ? '✓' : ''}
                          </span>
                          <span className="text-[12px] font-semibold leading-snug text-cream/[.85]">{label}</span>
                        </button>
                      );
                    })}
                    {hAllCrit && (
                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#a8d5a2]">
                        <Accessibility size={14} /> Таны газар «Тусгай хэрэгцээт хүнд ээлтэй» тэмдэгтэй харагдана
                      </div>
                    )}
                  </div>
                )}

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
                      to="/"
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
