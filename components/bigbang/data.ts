// Big Bang — static data, i18n strings and pure helpers.
// Ported verbatim from Big Bang.dc.html logic class.
import { Map, Compass, Wind, CloudRain, Car, Route, type LucideIcon } from 'lucide-react';

// Placeholder shown wherever content has no real, user-uploaded photo — this app
// ships with no stock imagery of its own. Self-contained (no network request).
//
// Every call site paints this with `background-size: cover`, and containers range
// from tall cards to ultra-wide hero banners. A single centered icon on a fixed
// canvas gets blown up into an unrecognizable crop under those extremes, so this
// tiles a small icon across a repeating pattern instead — cover-cropping a uniform
// tile always still looks like the same tile, regardless of aspect ratio.
export const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">' +
  '<defs>' +
  '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#161616"/><stop offset="1" stop-color="#0a0a0a"/>' +
  '</linearGradient>' +
  '<pattern id="p" width="160" height="160" patternUnits="userSpaceOnUse">' +
  '<g fill="none" stroke="#E8B84B" stroke-width="2.5" opacity=".1" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="56" y="60" width="48" height="36" rx="4"/>' +
  '<circle cx="70" cy="74" r="5"/>' +
  '<path d="M56 90 L74 78 L86 87 L96 76 L104 90"/>' +
  '</g>' +
  '</pattern>' +
  '</defs>' +
  '<rect width="640" height="480" fill="url(#g)"/>' +
  '<rect width="640" height="480" fill="url(#p)"/>' +
  '</svg>'
);

// Kept as a real image source everywhere in this file expects one (thumbOf, catBgOf,
// event/team/travel pools, etc.) — all of that art is stock imagery, not anything the
// user uploaded, so it's replaced by the placeholder above instead of an Unsplash id.
export const U = (_id: string, _w: number) => PLACEHOLDER_IMG;

// deterministic rating 3.8–4.9 from a name
export function ratingOf(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 9973;
  return ((38 + (h % 12)) / 10).toFixed(1);
}

export const FCRIT = [
  'Тэргэнцэртэй орох боломж — хаалганы өргөн ≥ 120 см',
  'Тусгай зам (налуу зам)',
  'Тэргэнцэрт зориулсан ариун цэврийн өрөө',
  'Довжоо / налуу гарц',
  'Тайлбар бичлэг (дүрс, дууны тайлбар)',
];

export const ACCESS_NAMES: Record<string, number> = {
  'UB Shooting Club': 1, 'Indoor Golf UB': 1, 'Aroma Spa': 1, 'Zen Massage': 1,
  'Quiet Loft': 1, 'Ember Rooftop': 1, "Chef's Table UB": 1, 'Wine Tasting Room': 1,
  'Meeple Cafe': 1, 'VR Zone': 1, 'Strike Bowling': 1, 'Cat Cafe UB': 1,
  'Жаз клуб 46': 1, 'Арт Галерей': 1, 'Science Cafe UB': 1, 'Планетари': 1,
  'Shine Yoga': 1, 'Mystery Room': 1,
};
export const isAccessible = (name: string) => !!ACCESS_NAMES[name];

export const GEO_MN: Record<string, string> = {
  'Darhan-Uul': 'Дархан-Уул', 'Ulaanbaatar': 'Улаанбаатар', 'Hövsgöl': 'Хөвсгөл', 'Uvs': 'Увс',
  'Dornogovi': 'Дорноговь', 'Ömnögovi': 'Өмнөговь', 'Hentiy': 'Хэнтий', 'Bayanhongor': 'Баянхонгор',
  'Arhangay': 'Архангай', 'Dzavhan': 'Завхан', 'Govi-Altay': 'Говь-Алтай', 'Hovd': 'Ховд',
  'Bayan-Ölgiy': 'Баян-Өлгий', 'Bulgan': 'Булган', 'Orhon': 'Орхон', 'Selenge': 'Сэлэнгэ',
  'Övörhangay': 'Өвөрхангай', 'Dundgovi': 'Дундговь', 'Töv': 'Төв', 'Gowisümber': 'Говьсүмбэр',
  'Dornod': 'Дорнод', 'Sühbaatar': 'Сүхбаатар',
};

export const LABEL_OFF: Record<string, [number, number]> = { 'Orhon': [0, -8], 'Gowisümber': [4, 0] };

export const AIMAG_BG: Record<string, string> = {
  'Улаанбаатар': '1477959858617-67f85cf4f1df', 'Архангай': '1500534314209-a25ddb2bd429',
  'Баян-Өлгий': '1506905925346-21bda4d32df4', 'Баянхонгор': '1469854523086-cc02fe5d8800',
  'Булган': '1441974231531-c6227db76b6e', 'Говь-Алтай': '1464822759023-fed622ff2c3b',
  'Говьсүмбэр': '1472214103451-9374bd1c798e', 'Дархан-Уул': '1470071459604-3b5ec3a7fe05',
  'Дорноговь': '1504280390367-361c6d9f38f4', 'Дорнод': '1553284965-83fd3e82fa5a',
  'Дундговь': '1426604966848-d7adac402bff', 'Завхан': '1439066615861-d1af74d74000',
  'Орхон': '1447752875215-b2761acb3c5d', 'Өвөрхангай': '1433086966358-54859d0ed716',
  'Өмнөговь': '1419242902214-272b3f66ee7a', 'Сүхбаатар': '1465146344425-f00d5f5c8f07',
  'Сэлэнгэ': '1454496522488-7a8e488e8606', 'Төв': '1519681393784-d120267933ba',
  'Увс': '1501785888041-af3ef285b470', 'Ховд': '1458668383970-8ddd3927deed',
  'Хөвсгөл': '1470770841072-f978cf4d019e', 'Хэнтий': '1476480862126-209bfaa8edc8',
};

export const AIMAGS: [string, string][] = [
  ['Улаанбаатар', 'Ulaanbaatar'], ['Архангай', 'Arkhangai'], ['Баян-Өлгий', 'Bayan-Ulgii'],
  ['Баянхонгор', 'Bayankhongor'], ['Булган', 'Bulgan'], ['Говь-Алтай', 'Govi-Altai'],
  ['Говьсүмбэр', 'Govisumber'], ['Дархан-Уул', 'Darkhan-Uul'], ['Дорноговь', 'Dornogovi'],
  ['Дорнод', 'Dornod'], ['Дундговь', 'Dundgovi'], ['Завхан', 'Zavkhan'],
  ['Орхон', 'Orkhon'], ['Өвөрхангай', 'Uvurkhangai'], ['Өмнөговь', 'Umnugovi'],
  ['Сүхбаатар', 'Sukhbaatar'], ['Сэлэнгэ', 'Selenge'], ['Төв', 'Tuv'],
  ['Увс', 'Uvs'], ['Ховд', 'Khovd'], ['Хөвсгөл', 'Khuvsgul'], ['Хэнтий', 'Khentii'],
];

// Traditional (vertical) Mongolian script for each aimag name — an AI
// best-effort transliteration, not verified by a native reader. Place names
// have more settled classical spellings than everyday prose, so confidence is
// higher than for regular sentences, but still get this checked before launch.
export const AIMAG_MN_SCRIPT: Record<string, string> = {
  'Улаанбаатар': 'ᠤᠯᠠᠭᠠᠨᠪᠠᠭᠠᠲᠤᠷ', 'Архангай': 'ᠠᠷᠬᠠᠩᠭᠠᠢ', 'Баян-Өлгий': 'ᠪᠠᠶᠠᠨ ᠥᠯᠥᠭᠡᠢ',
  'Баянхонгор': 'ᠪᠠᠶᠠᠨᠬᠣᠩᠭᠣᠷ', 'Булган': 'ᠪᠤᠯᠠᠭᠠᠨ', 'Говь-Алтай': 'ᠭᠣᠪᠢ ᠠᠯᠲᠠᠢ',
  'Говьсүмбэр': 'ᠭᠣᠪᠢᠰᠦᠮᠪᠡᠷ', 'Дархан-Уул': 'ᠳᠠᠷᠬᠠᠨ ᠠᠭᠤᠯᠠ', 'Дорноговь': 'ᠳᠣᠷᠣᠨᠠᠭᠣᠪᠢ',
  'Дорнод': 'ᠳᠣᠷᠣᠨᠠᠲᠤ', 'Дундговь': 'ᠳᠤᠮᠳᠠᠭᠣᠪᠢ', 'Завхан': 'ᠵᠠᠪᠬᠠᠨ',
  'Орхон': 'ᠣᠷᠬᠣᠨ', 'Өвөрхангай': 'ᠡᠪᠦᠷᠬᠠᠩᠭᠠᠢ', 'Өмнөговь': 'ᠡᠮᠦᠨᠡᠭᠣᠪᠢ',
  'Сүхбаатар': 'ᠰᠦᠬᠡᠪᠠᠭᠠᠲᠤᠷ', 'Сэлэнгэ': 'ᠰᠡᠯᠡᠩᠭᠡ', 'Төв': 'ᠲᠥᠪ',
  'Увс': 'ᠤᠪᠰᠤ', 'Ховд': 'ᠬᠣᠪᠳᠣ', 'Хөвсгөл': 'ᠬᠥᠪᠰᠦᠭᠥᠯ', 'Хэнтий': 'ᠬᠡᠨᠲᠡᠢ',
};

export interface Pin {
  id?: number; name: string; type: string; aimag: string; x?: string; y?: string; img: string; desc: string;
  cat?: string; idx?: number; hours?: string; phone?: string; mapUrl?: string; access?: boolean;
  lat?: number; lng?: number; px?: number; py?: number; addedBy?: string;
}

// Real scenic pins now come from the ScenicPin table (see /api/scenic-pins),
// fetched and shaped into Pin[] by BigBangLayout.fetchLiveContent — nothing
// hardcoded here anymore.

export const TEAM: [string, string, string][] = [
  ['Азаа', 'Багийн ахлагч · Бүтээгдэхүүн', 'Team lead · Product'],
  ['Баска', 'Хөгжүүлэгч · Backend', 'Developer · Backend'],
  ['Чинзо', 'Хөгжүүлэгч · Frontend', 'Developer · Frontend'],
  ['Номио', 'Дизайнер · UI/UX', 'Designer · UI/UX'],
  ['Нямка', 'Контент · Газрын судалгаа', 'Content · Place research'],
  ['Магнай', 'Маркетинг · Хамтын ажиллагаа', 'Marketing · Partnerships'],
];

// Real events now come from the Event table (see /api/events), fetched and
// shaped into EventItem[] by BigBangLayout.fetchLiveContent. The "featured"
// banner picks whichever fetched event has `featured: true` instead of a
// hardcoded FEATURED_EVENT.
export interface EventItem { day: string; mon: string; name: string; meta: string; tag: string; img: string; aimag?: string; thumb?: string; featured?: boolean; }

export const SUGGESTS = [
  { slug: 'games', title: '2 хүний хурдан тоглоомууд', count: '6 тоглоом', tag: 'Тоглоом', img: '1550745165-9bc0b252726f' },
  { slug: 'movies', title: 'Хосоор үзэх 10 кино', count: '10 кино', tag: 'Кино', img: '1489599849927-2ee91cede3ba' },
  { slug: 'boardgame', title: 'Гэр бүлээрээ тоглох board game', count: '7 тоглоом', tag: 'Тоглоом', img: '1529699211952-734e80c4d42b' },
];

// Sub-cards shown when a suggest card is opened now live in the database
// (see the SuggestCard Prisma model + /api/suggest-cards) — managed from
// Admin Panel, fetched live by app/(bigbang)/suggest/[slug]/page.tsx.

export const FAMOUS_SITES: Record<string, [string, string][]> = {
  'Mongolia': [['Говь цөл', 'nature'], ['Хөвсгөл нуур', 'nature'], ['Эрдэнэ Зуу хийд', 'sacred']],
  'United States of America': [['Grand Canyon', 'wonder'], ['New York City', 'city'], ['Yellowstone', 'nature']],
  'Brazil': [['Christ the Redeemer', 'wonder'], ['Amazon Rainforest', 'nature'], ['Iguaçu Falls', 'nature']],
  'France': [['Eiffel Tower', 'city'], ['Louvre Museum', 'culture'], ['Mont-Saint-Michel', 'history']],
  'Egypt': [['Pyramids of Giza', 'wonder'], ['Luxor Temples', 'history'], ['Nile River', 'nature']],
  'Japan': [['Mount Fuji', 'nature'], ['Kyoto Temples', 'sacred'], ['Tokyo', 'city']],
  'India': [['Taj Mahal', 'wonder'], ['Varanasi', 'sacred'], ['Jaipur', 'culture']],
  'South Africa': [['Table Mountain', 'nature'], ['Kruger Park', 'nature'], ['Cape of Good Hope', 'coast']],
  'Australia': [['Sydney Opera House', 'city'], ['Uluru', 'sacred'], ['Great Barrier Reef', 'nature']],
  'Iceland': [['Blue Lagoon', 'nature'], ['Golden Circle', 'nature'], ['Vatnajökull', 'nature']],
  'Morocco': [['Marrakech Medina', 'culture'], ['Sahara Dunes', 'nature'], ['Chefchaouen', 'city']],
  'Mexico': [['Chichén Itzá', 'wonder'], ['Teotihuacán', 'history'], ['Cancún', 'coast']],
  'Germany': [['Neuschwanstein', 'history'], ['Brandenburg Gate', 'city'], ['Black Forest', 'nature']],
  'Kenya': [['Maasai Mara', 'nature'], ['Mount Kenya', 'nature'], ['Amboseli', 'nature']],
  'Peru': [['Machu Picchu', 'wonder'], ['Cusco', 'history'], ['Lake Titicaca', 'nature']],
  'United Kingdom': [['Big Ben', 'city'], ['Stonehenge', 'history'], ['Tower of London', 'history']],
  'Italy': [['Colosseum', 'history'], ['Venice', 'city'], ['Florence', 'culture']],
  'Spain': [['Sagrada Família', 'sacred'], ['Alhambra', 'history'], ['Park Güell', 'culture']],
  'China': [['Great Wall', 'wonder'], ['Forbidden City', 'history'], ['Terracotta Army', 'history']],
  'Russia': [['Red Square', 'city'], ['Hermitage Museum', 'culture'], ['Lake Baikal', 'nature']],
  'Canada': [['Niagara Falls', 'nature'], ['Banff', 'nature'], ['CN Tower', 'city']],
  'Greece': [['Acropolis', 'history'], ['Santorini', 'coast'], ['Delphi', 'history']],
  'Turkey': [['Hagia Sophia', 'sacred'], ['Cappadocia', 'nature'], ['Ephesus', 'history']],
  'Thailand': [['Grand Palace', 'sacred'], ['Phi Phi Islands', 'coast'], ['Ayutthaya', 'history']],
};

export function sitesFor(gc: any, lang: string) {
  const T: Record<string, string> = lang === 'en'
    ? { nature: 'Nature', city: 'City', culture: 'Culture', history: 'History', sacred: 'Sacred', wonder: 'Wonder', coast: 'Coast', collection: 'Collection' }
    : { nature: 'Байгаль', city: 'Хот', culture: 'Соёл', history: 'Түүх', sacred: 'Сүсэг', wonder: 'Гайхамшиг', coast: 'Далайн эрэг', collection: 'Цуглуулга' };
  const PH: Record<string, string[]> = {
    nature: ['1470071459604-3b5ec3a7fe05', '1454496522488-7a8e488e8606', '1506905925346-21bda4d32df4', '1441974231531-c6227db76b6e'],
    city: ['1502602898657-3e91760cbb34', '1480714378408-67cf0d13bc1b', '1449824913935-59a10b8d2000', '1514924013411-cbf25faa35bb'],
    culture: ['1467269204594-9661b134dd2b', '1524492412937-b28074a5d7da', '1513635269975-59663e0ac1ad', '1531058020387-3be344556be6'],
    history: ['1552832230-c0197dd311b5', '1539650116574-8efeb43e2750', '1526481280693-3bfa7568e0f3', '1548013146-72479768bada'],
    sacred: ['1545126178-862cdb469409', '1493780474015-ba834fd0ce2f', '1528181304800-259b08848526', '1524413840807-0c3cb6fa808d'],
    wonder: ['1526392060635-9d6019884377', '1543349689-9a4d426bee8e', '1470004914212-05527e49370b', '1500759285222-a95626b934cb'],
    coast: ['1507525428034-b723cf961d3e', '1519046904884-53103b34b206', '1505228395891-9a51e7e86bf6', '1502680390469-be75c86b636f'],
    collection: ['1516815231560-8f41ec531527', '1524492412937-b28074a5d7da', '1493655161922-ef98929de9d8', '1490750967868-88aa4486c946'],
  };
  const raw = FAMOUS_SITES[gc.name];
  const list: [string, string][] = raw || (gc.categories || ['culture', 'memory', 'audio']).map((c: string) => [c.charAt(0).toUpperCase() + c.slice(1), 'collection']);
  return list.slice(0, 3).map((s, i) => {
    const key = PH[s[1]] ? s[1] : 'collection';
    const pool = PH[key];
    let h = 0; for (let k = 0; k < s[0].length; k++) h = (h * 31 + s[0].charCodeAt(k)) >>> 0;
    const id = pool[h % pool.length];
    return {
      n: String(i + 1).padStart(2, '0'), name: s[0], tag: T[s[1]] || s[1],
      cover: 'linear-gradient(rgba(11,10,8,.12), rgba(11,10,8,.28)), url("' + U(id, 600) + '")',
    };
  });
}

// `logo` is an optional real brand-icon URL (PNG/SVG) — when present it's shown
// instead of the generic lucide `icon`. None are wired up yet since we don't have
// rights to any official app logos bundled in the repo; drop a URL in here (or an
// uploaded asset path) per app once one is sourced.
export interface TravelApp { slug: string; icon: LucideIcon; name: string; mn: string; en: string; tint: string; ring: string; url: string; logo?: string; }
export const TRAVEL_APPS: TravelApp[] = [
  { slug: 'organic-maps', icon: Map, name: 'Organic Maps', mn: 'Offline газрын зураг & навигаци', en: 'Offline maps & navigation', tint: 'rgba(66,133,244,.22)', ring: 'rgba(120,170,255,.5)', url: 'https://organicmaps.app/' },
  { slug: 'osmand', icon: Compass, name: 'OsmAnd', mn: 'Offline маршрут & GPS', en: 'Offline routes & GPS', tint: 'rgba(52,168,83,.22)', ring: 'rgba(120,220,150,.5)', url: 'https://osmand.net/' },
  { slug: 'windy', icon: Wind, name: 'Windy', mn: 'Салхи & цаг агаарын урьдчилсан мэдээ', en: 'Wind & weather forecast', tint: 'rgba(120,200,220,.22)', ring: 'rgba(150,220,240,.5)', url: 'https://www.windy.com/-Temperature-temp?temp,39.270,87.989,3' },
  { slug: 'ventusky', icon: CloudRain, name: 'Ventusky', mn: 'Хур тунадас & температурын зураг', en: 'Rainfall & temperature maps', tint: 'rgba(180,120,220,.22)', ring: 'rgba(200,150,240,.5)', url: 'https://www.ventusky.com/#p=31;89;2' },
  { slug: 'avis-mongolia', icon: Car, name: 'Avis Mongolia', mn: 'Машин түрээслэх', en: 'Rent a car', tint: 'rgba(224,122,95,.22)', ring: 'rgba(240,150,120,.5)', url: 'https://avis-mongolia.com/car-rental?ssid=nVfrblZ014TB' },
  { slug: 'drive-mongolia', icon: Route, name: 'Drive Mongolia', mn: 'Өөрөө жолоодох & хөтөчтэй аялал', en: 'Self-drive & guided tours', tint: 'rgba(232,183,125,.24)', ring: 'rgba(232,183,125,.6)', url: 'https://www.drivemongolia.com/?utm_source=chatgpt.com' },
];

export interface CatItem { name: string; meta: string; sub: string; aimag?: string; hours?: string; phone?: string; desc?: string; access?: boolean; img?: string; id?: number; lat?: number; lng?: number; mapUrl?: string; }
export interface Cat {
  slug: string; num: string; name: string; nameEn: string; desc: string; descEn: string;
  glow: string; hero: string; pool: string[]; subs: string[];
  previews: { name: string; meta: string }[]; items: CatItem[];
}

export const CATS: Cat[] = [
  {
    slug: 'zugaa', num: '01', name: 'Өрсөлдөөн & Хөгжилтэй', nameEn: 'Competition & Fun',
    desc: 'Инээд, өрсөлдөөн, тоглоом — хамтдаа хөгжилтэй үдэш.',
    descEn: 'Laughter, games and friendly competition.',
    glow: 'rgba(230,90,160,.36)', hero: '1511882150382-421056c89033',
    pool: ['1511882150382-421056c89033', '1550745165-9bc0b252726f', '1493711662062-fa541adb3fc8'],
    subs: ['Escape room', 'Board game кафе', 'VR arcade', 'Боулинг', 'Бильярд', 'Дартс бар', 'KTV', 'Шатрын кафе'],
    // Real businesses in this category come from the Place table (see
    // /api/places), fetched and grouped by BigBangLayout.fetchLiveContent.
    previews: [],
    items: [],
  },
  {
    slug: 'adrenalin', num: '02', name: 'Адреналин & Спорт', nameEn: 'Adrenaline & Sports',
    desc: 'Зүрх дэлсүүлэх адал явдал — мөс хайлуулах хамгийн хурдан арга.',
    descEn: 'Heart-racing adventures — the fastest way to break the ice.',
    glow: 'rgba(235,110,60,.38)', hero: '1517649763962-0c623066013b',
    pool: ['1461896836934-ffe607ba8211', '1476480862126-209bfaa8edc8', '1517649763962-0c623066013b'],
    subs: ['Буудлага', 'Нум сум', 'Шүхрээр буух', 'Авиралт', 'Off-road', 'Цана / мотор', 'Паддл', 'Гольф симулятор', 'Мөсний гулгуур'],
    previews: [],
    items: [],
  },
  {
    slug: 'hool', num: '03', name: 'Хоол & Ундаа', nameEn: 'Food & Drinks',
    desc: 'Оройн хоол, нэг аяга кофе, чимээгүй яриа — сонгодог болзоо.',
    descEn: 'Dinner, coffee, quiet conversation — the classic date.',
    glow: 'rgba(232,160,90,.4)', hero: '1414235077428-338989a2e8c0',
    pool: ['1514933651103-005eec06c04b', '1470337458703-46ad1756a187', '1510812431401-41d2bd2722f3'],
    subs: ['Speakeasy бар', 'Дээвэр лоунж', "Chef's table", 'Гэрийн зоог', 'Supper club', 'Дарс таних'],
    previews: [],
    items: [],
  },
  {
    slug: 'horizon', num: '04', name: 'Горизон', nameEn: 'Horizon',
    desc: 'Одод, шинжлэх ухаан, сониуч зан — ердийн бус болзоо.',
    descEn: 'Stars, science and curiosity — an unusual date.',
    glow: 'rgba(90,140,235,.36)', hero: '1419242902214-272b3f66ee7a',
    pool: ['1419242902214-272b3f66ee7a', '1462331940025-496dfbfc7564', '1532094349884-543bc11b234d'],
    subs: ['Science cafe', 'Одон дурандах төв', 'Планетари', 'Шинжлэх ухааны лекц', 'Сансрын ажиглалт', 'Лаборатори тур'],
    previews: [],
    items: [],
  },
  {
    slug: 'wellness', num: '05', name: 'Амралт & Wellness', nameEn: 'Rest & Wellness',
    desc: 'Удаашрах, амрах, хамтдаа тайвшрах — яриа өөрөө урсана.',
    descEn: 'Slow down, relax, unwind together.',
    glow: 'rgba(120,200,170,.32)', hero: '1544161515-4ab6ce6db874',
    pool: ['1544161515-4ab6ce6db874', '1506126613408-eca07ce68773', '1540555700478-4be289fbecef'],
    subs: ['Спа / сауна', 'Йог / бясалгал', 'Массаж', 'Уламжлалт эмчилгээ', 'Орон зай түрээс', 'Муурны кафе'],
    previews: [],
    items: [],
  },
  {
    slug: 'soyol', num: '06', name: 'Соёл & Урлаг', nameEn: 'Culture & Arts',
    desc: 'Хөгжим, тайз, урлаг — ярих сэдэв өөрөө олдоно.',
    descEn: 'Music, stage and art — conversation finds itself.',
    glow: 'rgba(150,110,230,.36)', hero: '1470229722913-7c0e2dbbafd3',
    pool: ['1470229722913-7c0e2dbbafd3', '1507924538820-ede94a04019d', '1513364776144-60967b0f800f'],
    subs: ['Андеграунд концерт', 'Амьд жаз', 'Open mic', 'Drive-in кино', 'Морин хуур / хөөмий', 'DJ үдэш', 'Зурагчийн студи', 'Галерей'],
    previews: [],
    items: [],
  },
  {
    slug: 'ayalal', num: '07', name: 'Аялал & Байгаль', nameEn: 'Travel & Nature',
    desc: 'Хотоос гарч, цэвэр агаарт — хамгийн энгийн атлаа мартагдашгүй.',
    descEn: 'Out of the city, into fresh air — simple yet unforgettable.',
    glow: 'rgba(90,190,120,.34)', hero: '1501785888041-af3ef285b470',
    pool: ['1441974231531-c6227db76b6e', '1504280390367-361c6d9f38f4', '1553284965-83fd3e82fa5a'],
    subs: ['Морин аялал', 'Нохой чарга', 'Явган аялал', 'Glamping', 'Од ажиглах', 'Рашаан', 'Усан спорт', 'Завь'],
    previews: [],
    items: [],
  },
];

export const STR: Record<'mn' | 'en', Record<string, string>> = {
  mn: { home: 'Нүүр', about: 'Бидний тухай', signin: 'Нэвтрэх', catLabel: 'Ангилал',
    hint: 'Ангилал дээр хулганаа аваачиж үзээрэй', places: 'газар', all: 'Бүгд',
    mapHint: 'Газрын зураг дээр аймгаа дарж шүүнэ үү', pinsLabel: 'пин',
    back: '← Нүүр хуудас', tag: 'болзооны санаануудын орон зай', location: 'Байршил',
    empty: 'Энэ аймагт одоогоор газар алга', reset: 'Бүгдийг харах',
    pin: 'Maps', event: 'Эвент', suggest: 'Санал болгох', globe: 'Дэлхий', travel: 'Аялал',
    locTitle: 'Аймгууд', locSub: 'Газруудыг аймгаар нь шүүж үзээрэй',
    pinTitle: 'Пин', pinSub: 'Үзэсгэлэнтэй харагдацтай газрууд — газрын зураг дээр. Пин дээр дарж дэлгэрэнгүйг үзээрэй.',
    mapNote: '[газрын зураг — интеграцийн байрлал]', close: 'Хаах',
    resetMap: 'Бүх Монгол', detail: 'Дэлгэрэнгүй', panelHint: 'Пин дээр дарж дэлгэрэнгүй үзээрэй',
    openMaps: 'Google Map-аар харах',
    profile: 'Профайл', profileName: 'Миний профайл', profileMeta: 'big bang хэрэглэгч · Улаанбаатар', settings: 'Тохиргоо',
    a11yEyeTitle: 'Харааны бэрхшээлтэй горим', a11yEyeSub: 'Товчлуур болон текстийг том, тодоор харуулна',
    a11yWheelTitle: 'Тусгай хэрэгцээт горим', a11yWheelSub: 'Ээлтэй газруудыг эхэнд эрэмбэлж харуулна', addContent: 'Контент нэмэх',
    addPlaceTitle: 'Газар нэмэх', addPlaceDesc: 'Ресторан, клуб, амралтын газар',
    addPlaceApproval: 'Админ баталгаажуулсны дараа идэвхжинэ',
    addScenicTitle: 'Үзэсгэлэнт газар', addScenicDesc: 'Байгалийн үзэсгэлэнт цэг нэмэх',
    addEventTitle: 'Эвент нэмэх', addEventDesc: 'Тодорхой огноо, цагтай арга хэмжээ',
    addInstantNote: 'Шууд нийтлэгдэнэ',
    myPlacesTitle: 'Миний нэмсэн газрууд',
    myScenicTitle: 'Миний нэмсэн үзэсгэлэнт газрууд', myEventsTitle: 'Миний нэмсэн эвентүүд',
    scModalTitle: 'Үзэсгэлэнт газар нэмэх', scName: 'Газрын нэр', scNamePh: 'Ж: Тэрхийн цагаан нуур',
    scDesc: 'Тайлбар', scDescPh: 'Юугаараа онцлог вэ...', scSave: 'Нэмэх',
    evModalTitle: 'Эвент нэмэх', evName: 'Уулзалтын нэр', evNamePh: 'Ж: UB Jazz Night',
    evDate: 'Огноо', evTime: 'Цаг', evTag: 'Төрөл', evTagPh: 'Концерт / Кино / Спорт',
    evDescPh: 'Байршил, дэлгэрэнгүй...', evSave: 'Нэмэх', eMonFallback: '7-р сар', eTagFallback: 'Эвент',
    eventTitle: 'Эвент', eventSub: 'Тодорхой огноо, цаг, байршилтай арга хэмжээнүүд', featured: 'Онцлох',
    suggestTitle: 'Санал болгох', suggestSub: 'big bang багийн бэлтгэсэн кино болон тоглоомын жагсаалтууд',
    appsTitle: 'Аялахад хэрэгтэй апп-ууд', appsSub: 'Монголд аялахад тусалдаг апп-ууд — гарахаасаа өмнө татаж аваарай', appsBadge: 'Аяллын багц', appsCta: 'Бүгдийг татах',
    topRowTitle: 'Хамгийн өндөр үнэлгээтэй', save: 'Хадгалах', savedLabel: 'Хадгалсан ✓',
    brandsTitle: 'Алдартай брэндээс санал болгож байна', brandsSub: 'Big Bang-ийн хамтрагч брэндүүд',
    evJoin: 'Нэгдэх', evJoined: 'Нэгдсэн ✓',
    fav: 'Дуртай', favTitle: 'Дуртай газрууд', favSub: 'Таны ♥ дарж хадгалсан газрууд — төрлөөрөө ангилагдсан',
    favPlaces: 'Газрууд', favScenic: 'Үзэсгэлэнт газрууд',
    favEmpty: 'Одоогоор хоосон байна — газрын карт дээрх ♡ товчийг дарж нэмээрэй',
    favEmptyScenic: 'Одоогоор хоосон байна — Пин хуудаснаас үзэсгэлэнт газрын ♡ товчийг дарж нэмээрэй',
    eventsEmpty: 'Одоогоор идэвхтэй эвент алга — удахгүй шинэ арга хэмжээнүүд нэмэгдэнэ',
    abHero: 'Болзооны санаануудын орон зай',
    abIntro: 'Big Bang бол Монголын нуугдсан, сонирхолтой газруудыг нээж, хүмүүст илүү амархан олоход туслах платформ юм. Бид хэрэглэгчдэд аймаг, бүс нутгаар нь газрууд, эвент, байршил, мэдээллийг нэг дор харах боломжийг бүрдүүлнэ.',
    abMissionT: 'Зорилго', abMission: 'Монгол орныг илүү ойлгомжтой, хүртээмжтэй, сонирхолтой байдлаар танилцуулж, хамтдаа өнгөрүүлэх цаг мөч бүрийг мартагдашгүй болгох.',
    abWhoT: 'Хэнд зориулсан', abWho: 'Болзоонд явах хосууд, найзуудтайгаа шинэ газар хайж буй хүмүүс, аялагчид болон өөрийн газраа танилцуулахыг хүссэн эзэд, хостууд.',
    abEdgeT: 'Давуу тал', abEdge: '21 аймгийг хамарсан газрын зураг, ангилалтай хайлт, рейтинг ба дуртай газрын жагсаалт — бүгд нэг дор.',
    abTeamT: 'Манай баг', abVisionT: 'Алсын хараа',
    abVision: 'Монголын өнцөг булан бүрийн гоё газрууд хүн бүрт нээлттэй, олдоход хялбар байх ертөнцийг бид бүтээнэ.',
    abReachHead: 'Гадаад жуулчдыг Монгол руу татах — бидний зорилт.',
    abReachBody: 'Big Bang нь зөвхөн дотоодын хосуудад зориулсан биш, Монголын нуугдсан үзэсгэлэнт газруудыг дэлхийд харуулах цонх юм. Доорх улаан зураас бүр Монгол руу ирж буй жуулчны урсгалыг илэрхийлнэ. Бидний алсын хараа — энэ зураасуудыг олшруулж, улам олон улс оронд Монголоо сурталчлах.',
    abReachCaption: 'Улаан зураас бүр = Монгол руу ирж буй жуулчны урсгал',
    abContact: 'Холбоо барих', abPhil: 'Философи', abStages: 'Ангилал үзэх', abBig: 'BIG', abBang: 'BANG',
    abStatement: 'Хайх шаардлагагүй. Чи зүгээр л мэдэрч, амтархан аялахад л хангалттай.',
    abResKicker: 'Нөөц', abResHead: 'Хамтдаа өнгөрүүлэх мөч бүрд зориулсан орон зай.',
    abResBody: 'Аймаг бүрийн газар, эвент, санал болголтыг нэг дороос — ангилал, рейтинг, дуртай жагсаалттайгаар.', abResBtn: 'Газрууд үзэх',
    pdAccess: 'Хүртээмжтэй', pdRating: 'Үнэлгээ', pdHours: 'Цагийн хуваарь', pdPhone: 'Утас',
    pdAbout: 'Тухай', pdInfo: 'Мэдээлэл', pdA11yTitle: 'Тусгай хэрэгцээт хүнд ээлтэй',
    pdCat: 'Ангилал', pdSub: 'Дэд ангилал', pdLoc: 'Байршил', pdAccessRow: 'Хүртээмж', pdYes: 'Тийм ✓', pdNo: 'Мэдээлэлгүй',
    pdRateTitle: 'Үнэлгээ өгөх', pdRateThanks: 'Баярлалаа! Таны үнэлгээ', pdRateHint: 'Одоор дарж үнэлнэ үү' },
  en: { home: 'Home', about: 'About', signin: 'Sign in', catLabel: 'Categories',
    hint: 'Hover over a category', places: 'places', all: 'All', back: '← Home', tag: 'a space of date ideas', location: 'Location',
    mapHint: 'Click the map to filter by province', pinsLabel: 'pins',
    empty: 'No places in this province yet', reset: 'Show all',
    pin: 'Maps', event: 'Event', suggest: 'Suggest', globe: 'World', travel: 'Travel',
    locTitle: 'Provinces', locSub: 'Browse places by province',
    pinTitle: 'Pin', pinSub: 'Beautiful, remarkable spots on the map. Click a pin for details.',
    mapNote: '[map — integration placeholder]', close: 'Close', resetMap: 'Full map', detail: 'Details',
    panelHint: 'Click a pin for details', openMaps: 'Open in Google Maps',
    profile: 'Profile', profileName: 'My profile', profileMeta: 'big bang user · Ulaanbaatar', settings: 'Settings',
    a11yEyeTitle: 'Low-vision mode', a11yEyeSub: 'Larger, bolder buttons and text',
    a11yWheelTitle: 'Accessibility mode', a11yWheelSub: 'Sort wheelchair-friendly places first', addContent: 'Add content',
    addPlaceTitle: 'Add place', addPlaceDesc: 'Restaurant, club, getaway',
    addPlaceApproval: 'Goes live after admin approval',
    addScenicTitle: 'Scenic spot', addScenicDesc: 'Add a natural scenic place',
    addEventTitle: 'Add event', addEventDesc: 'A happening with a date and time',
    addInstantNote: 'Publishes instantly',
    myPlacesTitle: 'My submitted places',
    myScenicTitle: 'My scenic spots', myEventsTitle: 'My events',
    scModalTitle: 'Add scenic spot', scName: 'Name', scNamePh: 'e.g. Terkhiin Tsagaan Lake',
    scDesc: 'Description', scDescPh: 'What makes it special...', scSave: 'Add',
    evModalTitle: 'Add event', evName: 'Event name', evNamePh: 'e.g. UB Jazz Night',
    evDate: 'Date', evTime: 'Time', evTag: 'Type', evTagPh: 'Concert / Movie / Sport',
    evDescPh: 'Location, details...', evSave: 'Add', eMonFallback: 'Jul', eTagFallback: 'Event',
    eventTitle: 'Events', eventSub: 'Time-bound happenings with a date, time and place', featured: 'Featured',
    suggestTitle: 'Suggest', suggestSub: 'Curated movie & game lists by the big bang team',
    appsTitle: 'Apps you need for the trip', appsSub: 'Handy apps for traveling in Mongolia — download before you go', appsBadge: 'Travel kit', appsCta: 'Get them all',
    topRowTitle: 'Top rated', save: 'Save', savedLabel: 'Saved ✓',
    brandsTitle: 'Recommended from top brands', brandsSub: 'Big Bang partner brands',
    evJoin: 'Join', evJoined: 'Joined ✓',
    fav: 'Favorites', favTitle: 'Favorite places', favSub: 'Places you saved with ♥ — grouped by type',
    favPlaces: 'Places', favScenic: 'Scenic spots',
    favEmpty: 'Nothing here yet — tap ♡ on a place card to add',
    favEmptyScenic: 'Nothing here yet — tap ♡ on a scenic spot from the Pin page',
    eventsEmpty: 'No active events yet — new happenings will be added soon',
    abHero: 'A space of date ideas',
    abIntro: "Big Bang is a platform that uncovers Mongolia's hidden, interesting places and makes them easy to find. We bring places, events, locations and info together in one view, browsable by province and region.",
    abMissionT: 'Mission', abMission: 'Present Mongolia in a clearer, more accessible and exciting way — and make every moment spent together unforgettable.',
    abWhoT: "Who it's for", abWho: 'Couples planning a date, friends looking for something new, travelers, and place owners or hosts who want to showcase their spot.',
    abEdgeT: 'What makes us different', abEdge: 'A map covering all 21 provinces, categorized search, ratings and a favorites list — all in one place.',
    abTeamT: 'Our team', abVisionT: 'Vision',
    abVision: "We're building a world where the beautiful places in every corner of Mongolia are open and easy for everyone to find.",
    abReachHead: 'Attracting foreign travelers to Mongolia — our mission.',
    abReachBody: "Big Bang isn't only for local couples — it's a window that shows Mongolia's hidden, beautiful places to the world. Every red line below is a flow of tourists arriving in Mongolia. Our vision: to multiply these lines and promote Mongolia to ever more countries.",
    abReachCaption: 'Each red line = a flow of tourists to Mongolia',
    abContact: 'Contact', abPhil: 'Philosophy', abStages: 'Browse places', abBig: 'BIG', abBang: 'BANG',
    abStatement: "You don't have to search. Just feel it, and enjoy the journey.",
    abResKicker: 'Resources', abResHead: 'A space for every moment you spend together.',
    abResBody: 'Places, events and picks from every province in one place — with categories, ratings and a favorites list.', abResBtn: 'Browse places',
    pdAccess: 'Accessible', pdRating: 'Rating', pdHours: 'Opening hours', pdPhone: 'Phone',
    pdAbout: 'About', pdInfo: 'Information', pdA11yTitle: 'Accessible for people with special needs',
    pdCat: 'Category', pdSub: 'Sub-category', pdLoc: 'Location', pdAccessRow: 'Accessibility', pdYes: 'Yes ✓', pdNo: 'Not specified',
    pdRateTitle: 'Leave a rating', pdRateThanks: 'Thanks! Your rating', pdRateHint: 'Click a star to rate' },
};

// ── pure helpers ──
// `overrideImg` is a real photo URL saved via Admin Panel → Фон зураг; falls back to
// the built-in hero id (→ placeholder, since that's never a real uploaded photo).
export const catBgOf = (c: Cat, overrideImg?: string | null) =>
  'linear-gradient(rgba(11,10,8,.58), rgba(11,10,8,.78)), url("' + imgUrl(overrideImg || c.hero, 1800) + '")';

export const thumbOf = (c: Cat, i: number) =>
  'linear-gradient(rgba(11,10,8,.12), rgba(11,10,8,.42)), url("' + U(c.pool[i % c.pool.length], 640) + '")';

// Same gradient as thumbOf, but for a real place's own uploaded photo
// (falls back to the placeholder graphic via imgUrl when none was uploaded)
// instead of cycling through the category's decorative stock-photo pool.
export const itemThumbOf = (img?: string) =>
  'linear-gradient(rgba(11,10,8,.12), rgba(11,10,8,.42)), url("' + imgUrl(img || '', 640) + '")';

export function aimagName(mn: string, lang: 'mn' | 'en'): string {
  if (mn === 'Бүгд') return STR[lang].all;
  const f = AIMAGS.find((a) => a[0] === mn);
  return f ? (lang === 'en' ? f[1] : f[0]) : mn;
}

// Real uploads go straight to Cloudinary with no resizing (see uploadImage in lib/api.ts),
// so a photo taken on a phone can be a 50MP+, multi-second-to-load original. Requesting
// it through here inserts an on-the-fly Cloudinary transform (auto format/quality, capped
// to the width actually needed) instead of shipping the raw file to every background slot.
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

// Background slots (home/aimag/category/about hero) can hold an uploaded video —
// those come back from Cloudinary as .../video/upload/... and must be rendered
// with a <video> tag instead of a CSS background-image (which can't show video).
export const isVideoUrl = (src: string) => /\/video\/upload\//.test(src) || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);

export const imgUrl = (img: string, w: number) => {
  if (/^data:/.test(img)) return img;
  const cld = img.match(CLOUDINARY_UPLOAD);
  if (cld) return cld[1] + 'f_auto,q_auto,w_' + w + ',c_limit/' + cld[2];
  if (/^https?:\/\//.test(img)) return img;
  return U(img, w);
};

export function lonLatToXY(lng: number, lat: number): [number, number] {
  const my = (l: number) => Math.log(Math.tan(Math.PI / 4 + (l * Math.PI) / 360));
  const top = my(52.16), bot = my(41.56);
  return [((lng - 87.73) / (119.93 - 87.73)) * 1000, ((top - my(lat)) / (top - bot)) * 483];
}

// Inverse of lonLatToXY — recovers real-world [lat, lng] from a point in the
// mn-aimags.json projected coordinate space (that geometry is itself a Mercator
// projection of the real aimag borders — see lonLatToXY — so this lets the
// real map reuse the exact same borders/anchors the old SVG map drew, instead
// of a second, hand-guessed set of coordinates).
export function xyToLonLat(x: number, y: number): [number, number] {
  const my = (l: number) => Math.log(Math.tan(Math.PI / 4 + (l * Math.PI) / 360));
  const myInv = (v: number) => (Math.atan(Math.exp(v)) - Math.PI / 4) * (360 / Math.PI);
  const top = my(52.16), bot = my(41.56);
  const lng = 87.73 + (x / 1000) * (119.93 - 87.73);
  const lat = myInv(top - (y / 483) * (top - bot));
  return [lat, lng];
}

export function embedUrlFor(p: { name: string; aimag: string; lat?: number; lng?: number }) {
  const q = p.lat != null ? p.lat.toFixed(5) + ',' + p.lng!.toFixed(5) : encodeURIComponent(p.name + ', ' + p.aimag + ', Mongolia');
  return 'https://maps.google.com/maps?q=' + q + '&z=13&t=k&hl=mn&output=embed';
}

export function mapsUrlFor(p: { name: string; aimag: string; lat?: number; lng?: number; mapUrl?: string }) {
  if (p.mapUrl) return p.mapUrl;
  if (p.lat != null) return 'https://www.google.com/maps/search/?api=1&query=' + p.lat.toFixed(5) + '%2C' + p.lng!.toFixed(5);
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.name + ', ' + p.aimag + ', Mongolia');
}
