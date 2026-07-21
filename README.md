# Minii Bolzoo — Big Bang (React + TypeScript + Tailwind)

Болзооны газрын платформ **Big Bang**-ийн React хувилбар. Анхны `.dc.html` дизайныг
**Vite + React 18 + TypeScript + Tailwind CSS** төсөл болгон хөрвүүлсэн.

## Ажиллуулах

```bash
cd react-app
npm install
npm run dev      # http://localhost:5173
npm run build    # production build (dist/)
npm run preview  # build-ийг үзэх
```

## Бүтэц

```
react-app/
├─ index.html                 # Google Fonts + Leaflet/Three/D3/topojson + engine script-ууд
├─ tailwind.config.js         # brand өнгө (ink / cream / accent), keyframes
├─ src/
│  ├─ main.tsx                # entry + react-router
│  ├─ App.tsx                 # route-ууд
│  ├─ index.css               # Tailwind + reset + .bb-hc (том текст) + .bb-hscroll
│  ├─ globals.d.ts            # window.L / THREE / GlobeEngine ... типүүд
│  └─ screens/
│     ├─ Requirements.tsx     # ✅ шаардлага / user flow / roles (Tailwind)
│     ├─ Login.tsx            # ✅ OTP нэвтрэх + Host бүртгэл (Tailwind + hooks)
│     ├─ BigBang.tsx          # ✅ үндсэн апп (Home/Pin/Event/Travel/Globe/Suggest/Place/Profile/About/Category)
│     ├─ AdminPanel.tsx       # ✅ админ хяналтын самбар (dash/газар/эвент/санал/фон/зар)
│     ├─ HostProfile.tsx      # ✅ host профайл (мэдээлэл, миний газрууд, санал хүсэлт)
│     ├─ bigbang/
│     │  ├─ data.ts           # CATS/PINS/EVENTS/STR i18n/AIMAGS ... + цэвэр helper-ууд
│     │  └─ ui.tsx            # css() (string→style object) + <Hover> (style-hover дүйцэл)
│     └─ shared/
│        └─ CreateForm.tsx    # AdminPanel болон HostProfile-ийн хооронд хуваалцдаг газар/үзэсгэлэнт/эвент нэмэх form
└─ public/assets/             # globe-engine.js, travel-map.js, mn-aimags.json, mongolia-map.png
```

## Route-ууд

| Path | Дэлгэц |
|------|--------|
| `/big-bang` | Үндсэн апп (нүүр хуудас) |
| `/login` | Нэвтрэх / бүртгүүлэх |
| `/requirements` | Бүтээгдэхүүний спек |
| `/admin` | Админ панел |
| `/host` | Host профайл |

## Хөрвүүлэлтийн тэмдэглэл

- **Requirements** ба **Login** — бүрэн Tailwind utility class ашигласан.
- **BigBang** — маш том, олон динамик загвартай тул анхны inline загваруудыг
  `css()` helper-ээр (string → React style object) хадгалж, `style-hover`-ийг
  `<Hover>` компонентоор дүйцүүлсэн. Ингэснээр дизайн 1:1 хадгалагдана; Tailwind нь
  brand token (ink/cream/accent) болон энгийн дэлгэцүүдэд ашиглагдаж байна.
- Газрын зураг / глоб / аялалын engine-үүд (Leaflet, Three.js, D3) нь анхны vanilla
  script хэвээрээ `index.html`-д ачаалагдаж, `window`-оор дамжина.
- DC логик класс → React class component (state / setState / renderVals → render).

## Хийгдэж дуусаагүй (дараагийн алхам)

`API & Database` дэлгэцийг мөн адил `src/screens/` дор `.tsx` болгож нэмэх
бөгөөд `App.tsx`-д route холбоно.
