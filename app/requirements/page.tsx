// Requirements — Big Bang product spec (User flow, functional reqs, roles).
// Converted from Requirements.dc.html to React + TypeScript + Tailwind.

type Card = { title: string; note?: string; items: Item[] };
type Item = string | { text: string; muted?: string; sub?: Item[] };

const userFlow: Card[] = [
  {
    title: 'Хэрэглэгч үүсгэх алхамууд',
    items: [
      'Username оруулж, давхардаагүй байхыг шалгах.',
      { text: 'Email болон password оруулж бүртгүүлэх.', muted: '(Амжилттай бүртгэл үүснэ.)' },
      { text: 'Өөрийн profile хэсэгт:', sub: ['Нүүр зураг оруулах.'] },
    ],
  },
  {
    title: 'Home хэсэг',
    items: [
      'Header.',
      'Ангилал болон монголын газрын зураг.',
      'Ангилал hover хийхэд хамгийн алдартай 3 газар гарч ирэх.',
      'Монголын газрын зураг дээр дарахад ангилалд нэмэгдэх.',
    ],
  },
  {
    title: 'Pin',
    items: [
      'Дуртай газраа пин үүсгэж бусдад түгээх.',
      'Аймаг болгонд байгаа бүх пин харагдах.',
      'Пин болгон дэлгэрэнгүй мэдээлэлтэй байх.',
    ],
  },
  {
    title: 'Event',
    items: [
      'Монголд болж буй томоохон эвентүүд харагддаг байх.',
      'Хүн болгон өөрийн гэсэн жижиг эвент үүсгэх боломжтой байх.',
    ],
  },
  {
    title: 'Suggest',
    items: ['Төрөл бүрийн хүмүүст зориулсан газруудыг санал болгох.'],
  },
];

const functional: Card[] = [
  {
    title: 'Хэрэглэгчийн бүртгэл ба нэвтрэх',
    items: [
      'Өөрийн account-ийг имэйл, нууц үгээ ашиглан шинээр үүсгэх боломжтой байх.',
      'Бүртгүүлсэн имэйл, нууц үгээрээ системд нэвтрэх боломжтой байх.',
    ],
  },
  {
    title: 'Profile удирдах',
    items: [
      'Profile хуудас хэсгээс өөрийн мэдээллийг хянаж, шинэчлэх боломжтой байх.',
      'Бусдад хуваалцах хуудсыг хэрэглэгч өөрийн хүссэнээр засварлах боломжтой байх.',
      'Өөрийн profile хуудасруу зочилох link-ийг хуулах боломжтой байх.',
      'Өөрийн банкны картыг холбох боломжтой байх.',
    ],
  },
  {
    title: 'Explore',
    items: [
      'Explore хуудас-аар дамжуулан бусад хүмүүсийн account-уудыг харах боломжтой байх.',
      'Бусад хүмүүсийн profile-аар зочлох боломжтой байх.',
      'Тухайн хэрэглэгчид хамгийн сүүлд хэн хандив өгснийг харах боломжтой байх.',
      'Бусад хэрэглэгчдэд donation өгөх боломжтой байх.',
      'Хэрэглэгчдийг хайх боломжтой байх.',
    ],
  },
];

type Role = { name: string; tag: string; headerBg: string; items: Item[] };

const roles: Role[] = [
  {
    name: 'User',
    tag: 'жирийн хэрэглэгч',
    headerBg: 'rgba(138,180,248,.14)',
    items: [
      'Venue, Pin, Event, Suggest — 4 хэсгийг үзэх, шүүх',
      'Category, дэд төрөл, audience (хосоор / найзаараа / гэр бүлээрээ), 🎧 зэргээр шүүлтүүр ашиглах',
      'Venue-ийн "нууц" reveal-ийг нээж дэлгэрэнгүй мэдээлэл харах',
      { text: 'Pin нэмэх', muted: '(Pending → Admin batal)' },
      { text: 'Event үүсгэх', muted: '(Pending → Admin batal)' },
      'Favorite / Save: Venue ♥, Event ♥, Pin 📌, Suggest 🎏 — бүгдийг профайл дээрээ хадгалж, дараа нь хялбар үзэх',
      'Контентыг дуу хоолойгоор эсвэл дохионы хэлээр тайлбарласан хувилбараар үзэх',
      'OTP-ээр бүртгүүлж нэвтрэх',
      'Хүсвэл Host болохоор хүсэлт гаргах',
    ],
  },
  {
    name: 'Host',
    tag: 'газар нэмэгч',
    headerBg: 'rgba(168,213,162,.14)',
    items: [
      {
        text: 'Venue нэмэх, дэлгэрэнгүй маягтаар:',
        sub: [
          'Ангилал (7)-аас 1-ийг сонгох, Дэд төрлөөс олноор сонгох',
          'Улирал (олноор сонгож болно)',
          'Байршил: хотод / хотоос гадуур, хаяг / газрын зурагт pin',
          'Нээх / хаах цаг, Хүний багтаамж',
          'Холбоо барих: утасны дугаар, Instagram, Facebook',
          'Зураг / медиа, Тайлбар',
          'Тэргэнцэртэй иргэдэд ээлтэй орчин бүрдүүлсэн эсэхийг асуух (yes or no)',
          'Тэргэнцэртэй орох боломж буюу хаалганы өргөн нь 120 см, тусгай зам, ариун цэврийн өрөө, довжоо, тайлбар бичлэг, харааны бэрхшээлтэй хүмүүст товчлуур болон текстийг стандартын дагуу тодоор харуулна → 🎧 icon',
        ],
      },
      { text: 'Pin, Event санал болгон нэмэх', muted: '(User-тэй адил эрх)' },
      'Suggest хэсэгт нэмэх эрхгүй — зөвхөн үзэж, save хийх боломжтой',
      'Нэмсэн бүх контент Pending төлөвтэй эхлэх, Admin баталгаажуулснаар live болно',
      'Статусаа (хүлээгдэж буй / баталгаажсан / татгалзсан) хянах',
      'Venue / Event-ээ featured / sponsored болгуулах хүсэлт гаргах',
      { text: 'Имэйл нэмж бүртгүүлэх', muted: '(нэмэлт баталгаажуулалт)' },
    ],
  },
  {
    name: 'Admin',
    tag: 'gatekeeper',
    headerBg: 'rgba(232,183,125,.16)',
    items: [
      { text: 'User / Host-оос ирсэн Venue / Pin / Event-г хянаж баталгаажуулах эсвэл татгалзах', muted: '(gatekeeper)' },
      'Venue-ийн хандалтын мэдээллийн үнэн зөв эсэхийг шалгаж баталгаажуулах',
      'Suggest (кино / тоглоом) контентыг өөрөө шууд нэмэх',
      { text: 'Host-ыг баталгаажуулах', muted: '(verified status)' },
      'Ангилал, дэд төрөл, audience tag зэрэг таксономи удирдах',
      'Ad / sponsorship хүсэлтийг хянаж баталгаажуулах',
      'Report / гомдол хүлээн авч контент устгах эсвэл түдгэлзүүлэх',
      'Платформ даяарх тайлан, статистик харах',
    ],
  },
];

function ItemLi({ item }: { item: Item }) {
  if (typeof item === 'string') return <li>{item}</li>;
  return (
    <li>
      {item.text} {item.muted && <span className="text-cream/50">{item.muted}</span>}
      {item.sub && (
        <ul className="mt-2 flex flex-col gap-2 text-cream/[.78]">
          {item.sub.map((s, i) => (
            <ItemLi key={i} item={s} />
          ))}
        </ul>
      )}
    </li>
  );
}

function SpecCard({ card }: { card: Card }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[.12] bg-white/[.03]">
      <div className="border-b border-white/10 bg-accent/[.14] px-[18px] py-[11px] text-[14px] font-extrabold">
        {card.title}
      </div>
      <div className="px-[18px] py-[14px] text-[13px] text-cream/[.88]">
        <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-accent/70">
          {card.items.map((it, i) => (
            <ItemLi key={i} item={it} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function RoleCard({ role }: { role: Role }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[.12] bg-white/[.03]">
      <div
        className="flex items-center gap-[10px] border-b border-white/10 px-[18px] py-[13px]"
        style={{ background: role.headerBg }}
      >
        <span className="text-[15px] font-extrabold">{role.name}</span>
        <span className="text-[10.5px] font-bold text-cream/50">{role.tag}</span>
      </div>
      <div className="px-[18px] py-[14px] text-[12.5px] text-cream/[.88]">
        <ul className="flex list-disc flex-col gap-[9px] pl-5 marker:text-accent/70">
          {role.items.map((it, i) => (
            <ItemLi key={i} item={it} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Requirements() {
  return (
    <div className="min-h-screen bg-ink-2">
      <div className="mx-auto max-w-[1180px] px-10 pb-[90px] pt-14 text-cream">
        <div className="font-mono text-[11px] uppercase tracking-[.22em] text-cream/[.45]">
          big bang · product spec
        </div>
        <h1 className="mb-[6px] mt-[10px] text-[34px] font-extrabold tracking-[-0.03em]">
          Шаардлага ба хэрэглэгчийн урсгал
        </h1>
        <p className="mb-10 mt-0 max-w-[660px] text-[13.5px] text-cream/[.55]">
          Болзооны газрын платформын хэрэглэгчийн урсгал, функцын шаардлага, User / Host / Admin гурван
          эрхийн хүрээ.
        </p>

        <h2 className="mb-[18px] text-[20px] font-extrabold tracking-[-0.02em] text-accent">
          1 · User Flow
        </h2>
        <div className="mb-[52px] grid items-start gap-5 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
          {userFlow.map((c, i) => (
            <SpecCard key={i} card={c} />
          ))}
        </div>

        <h2 className="mb-[18px] text-[20px] font-extrabold tracking-[-0.02em] text-accent">
          2 · Functional Requirements
        </h2>
        <div className="mb-[52px] grid items-start gap-5 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
          {functional.map((c, i) => (
            <SpecCard key={i} card={c} />
          ))}
        </div>

        <h2 className="mb-[18px] text-[20px] font-extrabold tracking-[-0.02em] text-accent">
          3 · Roles — эрхийн хүрээ
        </h2>
        <div className="grid items-start gap-5 [grid-template-columns:repeat(auto-fit,minmax(330px,1fr))]">
          {roles.map((r, i) => (
            <RoleCard key={i} role={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
