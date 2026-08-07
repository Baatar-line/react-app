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
  // Full photo set (up to 4) — `img` above stays the single cover photo used
  // by cards/markers; only the detail page's gallery needs the rest.
  images?: string[];
  cat?: string; idx?: number; hours?: string; phone?: string; mapUrl?: string; access?: boolean;
  lat?: number; lng?: number; px?: number; py?: number; addedBy?: string;
}

// Real scenic pins now come from the ScenicPin table (see /api/scenic-pins),
// fetched and shaped into Pin[] by BigBangLayout.fetchLiveContent — nothing
// hardcoded here anymore.

// [name, role (mn), role (en), slug]. The slug is the stable key the admin
// panel stores each member's uploaded photo under (SiteSettings.teamImages,
// a slug→url JSON map) — kept separate from the display name so renaming a
// person doesn't orphan their photo.
export const TEAM: [string, string, string, string][] = [
  ['Азаа', 'Багийн ахлагч · Бүтээгдэхүүн', 'Team lead · Product', 'azaa'],
  ['Баска', 'Хөгжүүлэгч · Backend', 'Developer · Backend', 'baska'],
  ['Чинзо', 'Хөгжүүлэгч · Frontend', 'Developer · Frontend', 'chinzo'],
  ['Номио', 'Дизайнер · UI/UX', 'Designer · UI/UX', 'nomio'],
  ['Нямка', 'Контент · Газрын судалгаа', 'Content · Place research', 'nyamka'],
  ['Магнай', 'Маркетинг · Хамтын ажиллагаа', 'Marketing · Partnerships', 'magnai'],
];

// FAQ accordion at the bottom of the Profile page — [question, answer] in
// Mongolian then English, same tuple-per-language shape as TEAM above. These
// answer the questions the app's own rules actually raise (why a place waits
// on approval, why the profile gate exists, why every submission re-verifies
// by OTP), so they need updating whenever those rules change.
export const FAQ: [string, string, string, string][] = [
  [
    'Нэмсэн газар маань яагаад шууд харагдахгүй байна вэ?',
    'Газар нь админ баталгаажуулсны дараа бүх хэрэглэгчид харагддаг. Үзэсгэлэнт газар болон эвент шууд нийтлэгддэг. Илгээсэн газрынхаа явцыг профайлаасаа "Миний нэмсэн газрууд" хэсгээс харна.',
    'Why is the place I added not visible yet?',
    'A place goes live for everyone only after an admin approves it. Scenic spots and events publish instantly. You can follow your submission under "My submitted places" on this page.',
  ],
  [
    'Контент нэмэхийн тулд яагаад профайлаа бүрэн бөглөх ёстой вэ?',
    'Нэр, утасны дугаар, Instagram/Facebook, и-мэйл — эдгээр нь админ болон бусад хэрэглэгч тантай холбогдох цорын ганц зам. Тиймээс газар, үзэсгэлэнт газар, эвент нэмэхээс өмнө эдгээрийг бөглөсөн байх шаардлагатай.',
    'Why do I have to complete my profile before adding content?',
    'Your name, phone, Instagram/Facebook and email are the only way an admin or another user can reach you. That is why they are required before you can add a place, scenic spot or event.',
  ],
  [
    'Илгээх болгонд яагаад дахин код авах шаардлагатай вэ?',
    'Илгээлт бүр дээр таны бүртгэлтэй утас эсвэл и-мэйл рүү нэг удаагийн код очиж баталгаажуулдаг. Ингэснээр бусдын нэрийн өмнөөс контент нэмэх боломжгүй болно.',
    'Why do I need a code every time I submit?',
    'Every submission sends a one-time code to the phone or email on your account. It is what stops anyone from posting content in someone else’s name.',
  ],
  [
    'Утас, и-мэйлээ яагаад өөрчилж болохгүй байна вэ?',
    'Нэвтрэхдээ болон илгээлт бүр дээр яг тэр утас/и-мэйлээр баталгаажуулдаг тул тэдгээр талбар түгжигдсэн байдаг. Өөрчлөх шаардлагатай бол бидэнтэй холбогдоно уу.',
    'Why can’t I change my phone or email?',
    'Those exact values are what your sign-in and every submission verify against, so the fields stay locked. Contact us if one of them genuinely needs to change.',
  ],
  [
    '"Энэ и-мэйл өөр бүртгэлд ашиглагдсан байна" гэж гарвал яах вэ?',
    'Та өмнө нь тэр и-мэйлээр тусдаа бүртгэл үүсгэсэн байна. Тэр бүртгэлээрээ нэвтэрч орох, эсвэл одоогийн бүртгэлдээ өөр и-мэйл оруулна уу. Утсаар нэвтрэх, и-мэйлээр нэвтрэх нь тус тусдаа бүртгэл үүсгэдэг.',
    'What if it says this email belongs to another account?',
    'You created a separate account with that email earlier. Either sign in with that account, or use a different email here — signing in by phone and by email create two separate accounts.',
  ],
  [
    'Байршлаа хэрхэн зөв тэмдэглэх вэ?',
    'Хайлтын талбарт газрын нэрээ бичихэд санал гарч ирнэ (латин үсгээр бичсэн ч болно). Мөн Google Maps-ийн холбоос эсвэл what3words хаяг буулгаж, эсвэл газрын зураг дээр шууд дарж тэмдэглэж болно.',
    'How do I set the location correctly?',
    'Type the place name in the search box and pick from the suggestions (Latin spelling works too). You can also paste a Google Maps link or a what3words address, or simply click straight on the map.',
  ],
  [
    '"Очно" товч юу хийдэг вэ?',
    'Тухайн эвентэд очих гэж байгаагаа тэмдэглэнэ. Хэдэн хүн очихоор тэмдэглэснийг эвентийн дэлгэрэнгүй хуудсанд харуулах бөгөөд эвент зохион байгуулагч профайлаасаа мөн хардаг.',
    'What does the "Going" button do?',
    'It marks that you plan to attend. The total number of people going shows on the event page, and the organiser also sees it on their profile.',
  ],
  [
    'Хэдэн зураг оруулах боломжтой вэ?',
    'Нэг контентод дор хаяж 1, хамгийн ихдээ 4 зураг оруулна.',
    'How many photos can I upload?',
    'At least 1 and at most 4 photos per submission.',
  ],
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

// Each country now carries exactly 6 entries in a fixed template — [0] the
// capital city's most beautiful scene, [1]-[2] two culture/history landmarks
// that set the country apart, [3]-[5] three natural scenic wonders. The globe
// page renders [0]-[2] on the right panel and [3]-[5] on the left (see
// gcSitesLabel/gcNatureLabel in BigBangLayout.tsx). Third tuple slot is a real
// photo of that specific landmark (Wikimedia Commons, via Wikipedia's
// pageimages API) — not a generic stock photo for the category.
export const FAMOUS_SITES: Record<string, [string, string, string][]> = {
  'Mongolia': [
    ['Улаанбаатар', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/UB_downtown.jpg/960px-UB_downtown.jpg'],
    ['Чингис хаан хөшөө цогцолбор', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Genghis_Khan_Equestrian_Statue%2C_photo_by_Vaiz_Ha.jpg/960px-Genghis_Khan_Equestrian_Statue%2C_photo_by_Vaiz_Ha.jpg'],
    ['Эрдэнэ Зуу хийд', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/%C5%9Awi%C4%85tynia_Zachodnia_w_klasztorze_Erdene_Dzuu_01.jpg/960px-%C5%9Awi%C4%85tynia_Zachodnia_w_klasztorze_Erdene_Dzuu_01.jpg'],
    ['Говь цөл', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Gobi_Desert.jpg/960px-Gobi_Desert.jpg'],
    ['Хөвсгөл нуур', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/ISS067-E-879_-_View_of_Earth.jpg/960px-ISS067-E-879_-_View_of_Earth.jpg'],
    ['Алтайн нуруу', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Tavan_Bogd_Mountain.jpg/960px-Tavan_Bogd_Mountain.jpg'],
  ],
  'United States of America': [
    ['Washington, D.C.', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/12-07-13-washington-by-RalfR-08.jpg/960px-12-07-13-washington-by-RalfR-08.jpg'],
    ['New York City', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg/960px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg'],
    ['Mount Rushmore', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Mount_Rushmore_detail_view_%28100MP%29.jpg/960px-Mount_Rushmore_detail_view_%28100MP%29.jpg'],
    ['Grand Canyon', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Canyon_River_Tree_%28165872763%29.jpeg/960px-Canyon_River_Tree_%28165872763%29.jpeg'],
    ['Yellowstone', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Grand_Canyon_of_the_Yellowstone_Lower_Falls_%2895819p%29.jpg/960px-Grand_Canyon_of_the_Yellowstone_Lower_Falls_%2895819p%29.jpg'],
    ['Yosemite National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Half_Dome_with_Eastern_Yosemite_Valley_%2850MP%29.jpg/960px-Half_Dome_with_Eastern_Yosemite_Valley_%2850MP%29.jpg'],
  ],
  'Brazil': [
    ['Brasília', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Planalto_Central_%28cropped%29.jpg/960px-Planalto_Central_%28cropped%29.jpg'],
    ['Christ the Redeemer', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Christ_the_Redeemer_-_Cristo_Redentor.jpg/960px-Christ_the_Redeemer_-_Cristo_Redentor.jpg'],
    ['Historic Centre of Salvador', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Centro_Hist%C3%B3rico_Salvador_Vista_A%C3%A9rea_2021-0933.jpg/960px-Centro_Hist%C3%B3rico_Salvador_Vista_A%C3%A9rea_2021-0933.jpg'],
    ['Amazon Rainforest', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Amazon17_%285641020319%29.jpg/960px-Amazon17_%285641020319%29.jpg'],
    ['Iguaçu Falls', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Aerial_Foz_de_Igua%C3%A7u_26_Nov_2005.jpg/960px-Aerial_Foz_de_Igua%C3%A7u_26_Nov_2005.jpg'],
    ['Pantanal', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Pantanal%2C_south-central_South_America_5170.jpg/960px-Pantanal%2C_south-central_South_America_5170.jpg'],
  ],
  'France': [
    ['Eiffel Tower', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/960px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg'],
    ['Louvre Museum', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/960px-Louvre_Museum_Wikimedia_Commons.jpg'],
    ['Mont-Saint-Michel', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mont-Saint-Michel_vu_du_ciel.jpg/960px-Mont-Saint-Michel_vu_du_ciel.jpg'],
    ['French Riviera', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/%C3%88ze_und_Cap_Ferrat-Grande_Corniche.jpg/960px-%C3%88ze_und_Cap_Ferrat-Grande_Corniche.jpg'],
    ['French Alps', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Chamonix_valley_from_la_Fl%C3%A9g%C3%A8re%2C2010_07.JPG/960px-Chamonix_valley_from_la_Fl%C3%A9g%C3%A8re%2C2010_07.JPG'],
    ['Verdon Gorge', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Verdon_Gorge_1.jpg/960px-Verdon_Gorge_1.jpg'],
  ],
  'Egypt': [
    ['Cairo', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg/960px-Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg'],
    ['Pyramids of Giza', 'wonder', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg/960px-Great_Pyramid_of_Giza_-_Pyramid_of_Khufu.jpg'],
    ['Luxor Temples', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/1550_bis_1070_v._Chr._ca._wurde_der_Tempel_von_Luxor_erbaut._01.jpg/960px-1550_bis_1070_v._Chr._ca._wurde_der_Tempel_von_Luxor_erbaut._01.jpg'],
    ['Nile River', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Beautiful_nature_along_Nile_River_01.jpg/960px-Beautiful_nature_along_Nile_River_01.jpg'],
    ['Red Sea Coral Reefs', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Red_sea_coral_reef.jpg'],
    ['White Desert', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/White_Desert%2C_Rock_formations_in_desert_landscape_2%2C_Egypt.jpg/960px-White_Desert%2C_Rock_formations_in_desert_landscape_2%2C_Egypt.jpg'],
  ],
  'Japan': [
    ['Tokyo', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg/960px-Skyscrapers_of_Shinjuku_2009_January.jpg'],
    ['Kyoto Temples', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Kiyomizu.jpg/960px-Kiyomizu.jpg'],
    ['Himeji Castle', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Himeji_castle_in_may_2015.jpg/960px-Himeji_castle_in_may_2015.jpg'],
    ['Mount Fuji', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg/960px-View_of_Mount_Fuji_from_%C5%8Cwakudani_20211202.jpg'],
    ['Japanese Alps', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Akaishi_Mountains_2006-11-13.jpg/960px-Akaishi_Mountains_2006-11-13.jpg'],
    ['Okinawa Islands', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Naha_Okinawa_Japan_Shuri-Castle-01.jpg/960px-Naha_Okinawa_Japan_Shuri-Castle-01.jpg'],
  ],
  'India': [
    ['New Delhi', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Forecourt%2C_Rashtrapati_Bhavan_-_1.jpg/960px-Forecourt%2C_Rashtrapati_Bhavan_-_1.jpg'],
    ['Taj Mahal', 'wonder', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/960px-Taj_Mahal_%28Edited%29.jpeg'],
    ['Varanasi', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Ahilya_Ghat_by_the_Ganges%2C_Varanasi.jpg/960px-Ahilya_Ghat_by_the_Ganges%2C_Varanasi.jpg'],
    ['Kerala Backwaters', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/House_Boat_DSW.jpg/960px-House_Boat_DSW.jpg'],
    ['Himalayas (Ladakh)', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Road_Padum_Zanskar_Range_Jun24_A7CR_00818.jpg/960px-Road_Padum_Zanskar_Range_Jun24_A7CR_00818.jpg'],
    ['Western Ghats', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/AnaimudiPeak_DSC_4834.jpg/960px-AnaimudiPeak_DSC_4834.jpg'],
  ],
  'South Africa': [
    ['Table Mountain', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Table_Mountain_DanieVDM.jpg/960px-Table_Mountain_DanieVDM.jpg'],
    ['Robben Island', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Robben_Island_-_Cape_Town%2C_South_Africa_%283883849594%29.jpg/960px-Robben_Island_-_Cape_Town%2C_South_Africa_%283883849594%29.jpg'],
    ['Cradle of Humankind', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/4/40/SterkfonteinCave.jpg'],
    ['Kruger Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Kruger_Zebra.JPG/960px-Kruger_Zebra.JPG'],
    ['Cape of Good Hope', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Playa_Dias%2C_Cape_Point%2C_Sud%C3%A1frica%2C_2018-07-23%2C_DD_103.jpg/960px-Playa_Dias%2C_Cape_Point%2C_Sud%C3%A1frica%2C_2018-07-23%2C_DD_103.jpg'],
    ['Drakensberg Mountains', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/South_Africa_-_Drakensberg_%2816261357780%29.jpg/960px-South_Africa_-_Drakensberg_%2816261357780%29.jpg'],
  ],
  'Australia': [
    ['Canberra', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Parliament_House_at_dusk%2C_Canberra_ACT.jpg/960px-Parliament_House_at_dusk%2C_Canberra_ACT.jpg'],
    ['Sydney Opera House', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sydney_Australia._%2821339175489%29.jpg/960px-Sydney_Australia._%2821339175489%29.jpg'],
    ['Melbourne', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Melbourne_skyline_sor.jpg/960px-Melbourne_skyline_sor.jpg'],
    ['Uluru', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/ULURU.jpg/960px-ULURU.jpg'],
    ['Great Barrier Reef', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg/960px-ISS-45_StoryOfWater%2C_Great_Barrier_Reef%2C_Australia.jpg'],
    ['Great Ocean Road', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/The_Twelve_Apostles_2011.jpg/960px-The_Twelve_Apostles_2011.jpg'],
  ],
  'Iceland': [
    ['Reykjavík', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Reykjav%C3%ADk%2C_view_from_Hallgr%C3%ADmskirkja_%282%29.jpg/960px-Reykjav%C3%ADk%2C_view_from_Hallgr%C3%ADmskirkja_%282%29.jpg'],
    ['Þingvellir National Park', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/%C3%9Eingvellir_from_the_information_centre.JPG/960px-%C3%9Eingvellir_from_the_information_centre.JPG'],
    ['Hallgrímskirkja Church', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Hallgrimskirkja_mai_2026.jpg/960px-Hallgrimskirkja_mai_2026.jpg'],
    ['Blue Lagoon', 'nature', 'https://upload.wikimedia.org/wikipedia/en/thumb/0/00/Blue_Lagoon_Main_Building.JPG/960px-Blue_Lagoon_Main_Building.JPG'],
    ['Vatnajökull', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Vatnaj%C3%B6kull.jpeg'],
    ['Jökulsárlón Glacier Lagoon', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/J%C3%B6kuls%C3%A1rl%C3%B3n_lagoon_in_southeastern_Iceland.jpg/960px-J%C3%B6kuls%C3%A1rl%C3%B3n_lagoon_in_southeastern_Iceland.jpg'],
  ],
  'Morocco': [
    ['Rabat', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/%22Eine_beeindruckende_Festung%22._09.jpg/960px-%22Eine_beeindruckende_Festung%22._09.jpg'],
    ['Marrakech Medina', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Djemaa_el_Fna.jpg/960px-Djemaa_el_Fna.jpg'],
    ['Fez el Bali', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Fes_Bab_Bou_Jeloud_2011.jpg/960px-Fes_Bab_Bou_Jeloud_2011.jpg'],
    ['Sahara Dunes', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Merzouga_Dunes_2011.jpg/960px-Merzouga_Dunes_2011.jpg'],
    ['Atlas Mountains', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Plateau_Yagour%2C_Agdal%2C_Morocco.jpg/960px-Plateau_Yagour%2C_Agdal%2C_Morocco.jpg'],
    ['Ouzoud Falls', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Cascades_d%27Ouzoud.jpg/960px-Cascades_d%27Ouzoud.jpg'],
  ],
  'Mexico': [
    ['Mexico City', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg/960px-Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg'],
    ['Chichén Itzá', 'wonder', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Chichen_Itza_3.jpg/960px-Chichen_Itza_3.jpg'],
    ['Teotihuacán', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/ZA77_Teotihuac%C3%A1n_edo_de_mex_Herberto_de_la_rosa.jpg/960px-ZA77_Teotihuac%C3%A1n_edo_de_mex_Herberto_de_la_rosa.jpg'],
    ['Copper Canyon', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Barranca_del_cobre_2.jpg/960px-Barranca_del_cobre_2.jpg'],
    ['Cenotes of Yucatán', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Cenote_2.jpg/960px-Cenote_2.jpg'],
    ['Cancún', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Cancun_Strand_Luftbild_%2822143397586%29.jpg/960px-Cancun_Strand_Luftbild_%2822143397586%29.jpg'],
  ],
  'Germany': [
    ['Brandenburg Gate', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brandenburger_Tor_abends.jpg/960px-Brandenburger_Tor_abends.jpg'],
    ['Neuschwanstein', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Schloss_Neuschwanstein_2013.jpg/960px-Schloss_Neuschwanstein_2013.jpg'],
    ['Cologne Cathedral', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/K%C3%B6lner_Dom_-_Westfassade_2022_ohne_Ger%C3%BCst-0968_b.jpg/960px-K%C3%B6lner_Dom_-_Westfassade_2022_ohne_Ger%C3%BCst-0968_b.jpg'],
    ['Black Forest', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Blick_vom_Hohfelsen.jpg/960px-Blick_vom_Hohfelsen.jpg'],
    ['Bavarian Alps', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Zugspitze_2.JPG/960px-Zugspitze_2.JPG'],
    ['Rhine Valley', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Aerial_image_of_the_Upper_Middle_Rhine_Valley.jpg/960px-Aerial_image_of_the_Upper_Middle_Rhine_Valley.jpg'],
  ],
  'Kenya': [
    ['Nairobi', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Nairobi_skyline_from_Gem_Hotel.jpg/960px-Nairobi_skyline_from_Gem_Hotel.jpg'],
    ['Fort Jesus, Mombasa', 'history', 'https://upload.wikimedia.org/wikipedia/commons/4/41/Fort_Jesus_at_the_Mombasa_Island.jpg'],
    ['Lamu Old Town', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/2/29/Lamu_Old_Town.jpg'],
    ['Maasai Mara', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Masai_Mara_at_Sunset.jpg/960px-Masai_Mara_at_Sunset.jpg'],
    ['Mount Kenya', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/MtKenya.jpg/960px-MtKenya.jpg'],
    ['Amboseli', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Elephants_at_Amboseli_national_park_against_Mount_Kilimanjaro.jpg'],
  ],
  'Peru': [
    ['Lima', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bas%C3%ADlica_Catedral_Metropolitana_de_Lima_%28cropped%29.jpg/960px-Bas%C3%ADlica_Catedral_Metropolitana_de_Lima_%28cropped%29.jpg'],
    ['Machu Picchu', 'wonder', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Machu_Picchu%2C_2023_%28012%29.jpg/960px-Machu_Picchu%2C_2023_%28012%29.jpg'],
    ['Cusco', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Vista_Calle_Suecia.jpg/960px-Vista_Calle_Suecia.jpg'],
    ['Lake Titicaca', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lake_Titicaca_ESA22522896.jpeg/960px-Lake_Titicaca_ESA22522896.jpeg'],
    ['Rainbow Mountain', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Monta%C3%B1aarcoirisperuabanto.jpg/960px-Monta%C3%B1aarcoirisperuabanto.jpg'],
    ['Peruvian Amazon', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Manu_riverbank.jpg/960px-Manu_riverbank.jpg'],
  ],
  'United Kingdom': [
    ['Big Ben', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Elizabeth_Tower%2C_June_2022.jpg/960px-Elizabeth_Tower%2C_June_2022.jpg'],
    ['Tower of London', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Tower_of_London_from_the_Shard_%288515883950%29.jpg/960px-Tower_of_London_from_the_Shard_%288515883950%29.jpg'],
    ['Stonehenge', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Stonehenge2007_07_30.jpg/960px-Stonehenge2007_07_30.jpg'],
    ['Scottish Highlands', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Eilean_Donan_Castle%2C_Scotland_-_Jan_2011.jpg/960px-Eilean_Donan_Castle%2C_Scotland_-_Jan_2011.jpg'],
    ['Lake District', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Derwent_Water%2C_Lake_District%2C_Cumbria_-_June_2009.jpg/960px-Derwent_Water%2C_Lake_District%2C_Cumbria_-_June_2009.jpg'],
    ['White Cliffs of Dover', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/White_Cliffs_of_Dover_02.JPG/960px-White_Cliffs_of_Dover_02.JPG'],
  ],
  'Italy': [
    ['Colosseum', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/960px-Colosseo_2020.jpg'],
    ['Florence', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Firenze_-_Piazzale_Michelangelo%2C_Firenze%2C_Italy_-_April_6%2C_2015_02.jpg/960px-Firenze_-_Piazzale_Michelangelo%2C_Firenze%2C_Italy_-_April_6%2C_2015_02.jpg'],
    ['Venice', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Venezia_aerial_view.jpg/960px-Venezia_aerial_view.jpg'],
    ['Amalfi Coast', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Amalfi_Coast_%28Italy%2C_October_2020%29_-_75_%2850558355441%29.jpg/960px-Amalfi_Coast_%28Italy%2C_October_2020%29_-_75_%2850558355441%29.jpg'],
    ['Dolomites', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Faloria_Cortina_d%27Ampezzo_10.jpg/960px-Faloria_Cortina_d%27Ampezzo_10.jpg'],
    ['Lake Como', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Sentiero_del_Viandante_DSC_6340_%2814020554463%29.jpg/960px-Sentiero_del_Viandante_DSC_6340_%2814020554463%29.jpg'],
  ],
  'Spain': [
    ['Madrid', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg/960px-Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg'],
    ['Sagrada Família', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/SF_maig_2_cropped.jpg/960px-SF_maig_2_cropped.jpg'],
    ['Alhambra', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Dawn_Charles_V_Palace_Alhambra_Granada_Andalusia_Spain.jpg/960px-Dawn_Charles_V_Palace_Alhambra_Granada_Andalusia_Spain.jpg'],
    ['Teide National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Teide_Canadas.jpg/960px-Teide_Canadas.jpg'],
    ['Picos de Europa', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Picu_Urriellu.jpg/960px-Picu_Urriellu.jpg'],
    ['Costa Brava', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Costa_Brava_Calas.JPG/960px-Costa_Brava_Calas.JPG'],
  ],
  'China': [
    ['Forbidden City', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/The_Forbidden_City_-_View_from_Coal_Hill.jpg/960px-The_Forbidden_City_-_View_from_Coal_Hill.jpg'],
    ['Great Wall', 'wonder', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg/960px-The_Great_Wall_of_China_at_Jinshanling-edit.jpg'],
    ['Terracotta Army', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/51714-Terracota-Army.jpg/960px-51714-Terracota-Army.jpg'],
    ['Zhangjiajie National Forest Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/1_tianzishan_wulingyuan_zhangjiajie_2012.jpg/960px-1_tianzishan_wulingyuan_zhangjiajie_2012.jpg'],
    ['Guilin', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/87318-Li-River.jpg/960px-87318-Li-River.jpg'],
    ['Jiuzhaigou Valley', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/1_jiuzhaigou_valley_wu_hua_hai_2011b.jpg/960px-1_jiuzhaigou_valley_wu_hua_hai_2011b.jpg'],
  ],
  'Russia': [
    ['Red Square', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Kremlin_and_Red_Square.1.jpg/960px-Kremlin_and_Red_Square.1.jpg'],
    ['Hermitage Museum', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Winter_Palace_Panorama_3.jpg/960px-Winter_Palace_Panorama_3.jpg'],
    ['Suzdal', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/SuzdalPanoramaC_9345.jpg/960px-SuzdalPanoramaC_9345.jpg'],
    ['Lake Baikal', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Baikal.A2001296.0420.250m-NASA.jpg/960px-Baikal.A2001296.0420.250m-NASA.jpg'],
    ['Kamchatka Peninsula', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Klju%C4%8Devskaja_za_v%C3%BDchodu_slunce.jpg/960px-Klju%C4%8Devskaja_za_v%C3%BDchodu_slunce.jpg'],
    ['Caucasus Mountains', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Mount_Elbrus_%28cropped%29.jpg/960px-Mount_Elbrus_%28cropped%29.jpg'],
  ],
  'Canada': [
    ['Ottawa', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Parliament-Ottawa.jpg/960px-Parliament-Ottawa.jpg'],
    ['Quebec City', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Le_tourisme_dans_le_vieux_Qu%C3%A9bec.jpg/960px-Le_tourisme_dans_le_vieux_Qu%C3%A9bec.jpg'],
    ['CN Tower', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/CN_Tower_from_Puente_de_Luz%2C_Toronto%2C_Ontario%2C_2025-08-25_01.jpg/960px-CN_Tower_from_Puente_de_Luz%2C_Toronto%2C_Ontario%2C_2025-08-25_01.jpg'],
    ['Niagara Falls', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/3Falls_Niagara.jpg/960px-3Falls_Niagara.jpg'],
    ['Banff', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Moraine_Lake_17092005.jpg/960px-Moraine_Lake_17092005.jpg'],
    ['Bay of Fundy', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Sandstone_in_Canada_-_IMG_0791_%2811385934064%29.jpg/960px-Sandstone_in_Canada_-_IMG_0791_%2811385934064%29.jpg'],
  ],
  'Greece': [
    ['Acropolis', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/1029_Acropolis_of_Athens_in_Greece_at_night_Photo_by_Giles_Laurent.jpg/960px-1029_Acropolis_of_Athens_in_Greece_at_night_Photo_by_Giles_Laurent.jpg'],
    ['Delphi', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Delphi%2C_Greece_-_panoramio.jpg/960px-Delphi%2C_Greece_-_panoramio.jpg'],
    ['Meteora Monasteries', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Meteora%27s_monastery_2.jpg/960px-Meteora%27s_monastery_2.jpg'],
    ['Santorini', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Blue-dome-Santorini.JPG/960px-Blue-dome-Santorini.JPG'],
    ['Navagio Beach', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Navagio%2C_Zante_01.jpg/960px-Navagio%2C_Zante_01.jpg'],
    ['Samaria Gorge', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Samaria_Gorge_-_Crete%2C_Greece_%281%29.jpg/960px-Samaria_Gorge_-_Crete%2C_Greece_%281%29.jpg'],
  ],
  'Turkey': [
    ['Ankara', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Ataturk%27s_Mausoleum_%286225341313%29.jpg/960px-Ataturk%27s_Mausoleum_%286225341313%29.jpg'],
    ['Hagia Sophia', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Hagia_Sophia_%28228968325%29.jpeg/960px-Hagia_Sophia_%28228968325%29.jpeg'],
    ['Ephesus', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Ephesus_Celsus_Library_Fa%C3%A7ade.jpg/960px-Ephesus_Celsus_Library_Fa%C3%A7ade.jpg'],
    ['Cappadocia', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Cappadocia_balloon_trip%2C_Ortahisar_Castle_%2811893715185%29.jpg/960px-Cappadocia_balloon_trip%2C_Ortahisar_Castle_%2811893715185%29.jpg'],
    ['Pamukkale', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Pamukkale%2C_Denizli_2026_68.jpg/960px-Pamukkale%2C_Denizli_2026_68.jpg'],
    ['Turquoise Coast', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Paragliding_view_oludeniz_-_panoramio_%282%29.jpg/960px-Paragliding_view_oludeniz_-_panoramio_%282%29.jpg'],
  ],
  'Thailand': [
    ['Grand Palace', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/0005574_-_Wat_Phra_Kaew_006.jpg/960px-0005574_-_Wat_Phra_Kaew_006.jpg'],
    ['Ayutthaya', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/%E0%B9%80%E0%B8%A8%E0%B8%B5%E0%B8%A2%E0%B8%A3%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%9E%E0%B8%B8%E0%B8%97%E0%B8%98%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B9%83%E0%B8%99%E0%B8%A3%E0%B8%B2%E0%B8%81%E0%B9%82%E0%B8%9E%E0%B8%98%E0%B8%B4%E0%B9%8C.jpg/960px-%E0%B9%80%E0%B8%A8%E0%B8%B5%E0%B8%A2%E0%B8%A3%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%9E%E0%B8%B8%E0%B8%97%E0%B8%98%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B9%83%E0%B8%99%E0%B8%A3%E0%B8%B2%E0%B8%81%E0%B9%82%E0%B8%9E%E0%B8%98%E0%B8%B4%E0%B9%8C.jpg'],
    ['Chiang Mai Old City', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Wat_Phra_That_Doi_Suthep_-_Chiang_Mai.jpg/960px-Wat_Phra_That_Doi_Suthep_-_Chiang_Mai.jpg'],
    ['Phi Phi Islands', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/KohPhiPhi.JPG/960px-KohPhiPhi.JPG'],
    ['Khao Sok National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/1022_KhaoSokNationalPark_2.jpg/960px-1022_KhaoSokNationalPark_2.jpg'],
    ['Railay Beach, Krabi', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Railay_Beach_5.jpg/960px-Railay_Beach_5.jpg'],
  ],
  'Laos': [
    ['Vientiane', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Pha_That_Luang%2C_July_2023.jpg/960px-Pha_That_Luang%2C_July_2023.jpg'],
    ['Luang Prabang', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Phou_si_Luang_Prabang_Laos_%E3%83%97%E3%83%BC%E3%82%B7%E3%83%BC%E3%81%AE%E4%B8%98_%E3%83%A9%E3%82%AA%E3%82%B9%E3%83%BB%E3%83%AB%E3%82%A2%E3%83%B3%E3%83%97%E3%83%A9%E3%83%90%E3%83%BC%E3%83%B3_DSCF6777.jpg/960px-Phou_si_Luang_Prabang_Laos_%E3%83%97%E3%83%BC%E3%82%B7%E3%83%BC%E3%81%AE%E4%B8%98_%E3%83%A9%E3%82%AA%E3%82%B9%E3%83%BB%E3%83%AB%E3%82%A2%E3%83%B3%E3%83%97%E3%83%A9%E3%83%90%E3%83%BC%E3%83%B3_DSCF6777.jpg'],
    ['Plain of Jars', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Plainofjars_2.jpg/960px-Plainofjars_2.jpg'],
    ['Kuang Si Falls', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/The_river_of_Kuang_si_waterfalls.jpg/960px-The_river_of_Kuang_si_waterfalls.jpg'],
    ['Nong Khiaw', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Nong_Khiaw_pano%284%29.jpg/960px-Nong_Khiaw_pano%284%29.jpg'],
    ['4000 Islands (Si Phan Don)', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Houses_and_guesthouses_on_the_bank_of_Don_Det.jpg/960px-Houses_and_guesthouses_on_the_bank_of_Don_Det.jpg'],
  ],
  'Vietnam': [
    ['Hanoi', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Hanoi_skyline_with_Ba_Vi_Mountain.jpg/960px-Hanoi_skyline_with_Ba_Vi_Mountain.jpg'],
    ['Hue Imperial City', 'history', 'https://upload.wikimedia.org/wikipedia/commons/b/b9/%C4%90%E1%BA%A1i_n%E1%BB%99i.jpg'],
    ['Hoi An Ancient Town', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/10549-Hoi-An_%2837621348460%29.jpg/960px-10549-Hoi-An_%2837621348460%29.jpg'],
    ['Ha Long Bay', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Ha_Long_Bay_in_2019.jpg/960px-Ha_Long_Bay_in_2019.jpg'],
    ['Sapa Rice Terraces', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Fansipan_cable_car_aerial_view_terraced_rice_fields_Sa_Pa_Viet_Nam.jpg/960px-Fansipan_cable_car_aerial_view_terraced_rice_fields_Sa_Pa_Viet_Nam.jpg'],
    ['Phong Nha-Ke Bang Caves', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Phongnhakebang6.jpg/960px-Phongnhakebang6.jpg'],
  ],
  'Cambodia': [
    ['Phnom Penh', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Le_Palais_Royal_%28Phnom_Penh%29_%286997773481%29.jpg/960px-Le_Palais_Royal_%28Phnom_Penh%29_%286997773481%29.jpg'],
    ['Angkor Wat', 'wonder', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Angkor_Wat.jpg/960px-Angkor_Wat.jpg'],
    ['Bayon Temple', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Bayon%2C_Angkor_Thom%2C_Camboya%2C_2013-08-17%2C_DD_37.JPG/960px-Bayon%2C_Angkor_Thom%2C_Camboya%2C_2013-08-17%2C_DD_37.JPG'],
    ['Tonlé Sap Lake', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Cambodia%2C_Tonle_Sap_IMG_3285.JPG/960px-Cambodia%2C_Tonle_Sap_IMG_3285.JPG'],
    ['Cardamom Mountains', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Cardamom_sunset.jpg/960px-Cardamom_sunset.jpg'],
    ['Koh Rong Island', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/2/23/Sok_San_Bungalows_koh_Rong_island_Cambodia.jpg'],
  ],
  'Indonesia': [
    ['Jakarta', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/The_National_Monument_%28Monas%29%2C_Jakarta_from_afar.jpg/960px-The_National_Monument_%28Monas%29%2C_Jakarta_from_afar.jpg'],
    ['Borobudur Temple', 'wonder', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Pradaksina.jpg/960px-Pradaksina.jpg'],
    ['Prambanan Temple', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Prambanan_Temple_Yogyakarta_Indonesia.jpg/960px-Prambanan_Temple_Yogyakarta_Indonesia.jpg'],
    ['Mount Bromo', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Bromo-Semeru-Batok-Widodaren.jpg/960px-Bromo-Semeru-Batok-Widodaren.jpg'],
    ['Raja Ampat Islands', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Raja_Ampat%2C_West_Papua%2C_Indonesia.jpg/960px-Raja_Ampat%2C_West_Papua%2C_Indonesia.jpg'],
    ['Ubud Rice Terraces, Bali', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Rice_terraces_in_Tegallalang_1.jpg/960px-Rice_terraces_in_Tegallalang_1.jpg'],
  ],
  'Philippines': [
    ['Manila', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Baluartillo_de_San_Jos%C3%A9%2C_Manila%2C_Filipinas%2C_2023-08-26%2C_DD_41.jpg/960px-Baluartillo_de_San_Jos%C3%A9%2C_Manila%2C_Filipinas%2C_2023-08-26%2C_DD_41.jpg'],
    ['Banaue Rice Terraces', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Banaue-terrace.JPG/960px-Banaue-terrace.JPG'],
    ['Vigan', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Allan_Jay_Quesada_-_Vigan_Cathedral_001.jpg/960px-Allan_Jay_Quesada_-_Vigan_Cathedral_001.jpg'],
    ['Chocolate Hills, Bohol', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Chocolate_Hills_Bohol.JPG/960px-Chocolate_Hills_Bohol.JPG'],
    ['Palawan (El Nido)', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/El_Nido_Bay_December_2018.jpg/960px-El_Nido_Bay_December_2018.jpg'],
    ['Mayon Volcano', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Mount_Mayon_Cagsawa_field_view_close-up_%28Busay%2C_Daraga%2C_Albay%3B_04-21-2023%29.jpg/960px-Mount_Mayon_Cagsawa_field_view_close-up_%28Busay%2C_Daraga%2C_Albay%3B_04-21-2023%29.jpg'],
  ],
  'Malaysia': [
    ['Kuala Lumpur', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/The_Petronas_Twin_Towers_%26_KLCC_Park.jpg/960px-The_Petronas_Twin_Towers_%26_KLCC_Park.jpg'],
    ['George Town, Penang', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Skyline_of_George_Town%2C_Penang_at_night_Nov2024-29-17.jpg/960px-Skyline_of_George_Town%2C_Penang_at_night_Nov2024-29-17.jpg'],
    ['Malacca', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Melaka_View.jpg/960px-Melaka_View.jpg'],
    ['Mount Kinabalu', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Kinabalu_Sabah_Borneo_Kampong_Kundasang_panorama_2.jpg/960px-Kinabalu_Sabah_Borneo_Kampong_Kundasang_panorama_2.jpg'],
    ['Langkawi Islands', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Eagle_square_at_Kuah_Langkawi.jpg/960px-Eagle_square_at_Kuah_Langkawi.jpg'],
    ['Taman Negara', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Taman_Negara_Sungai_Tembeling.JPG/960px-Taman_Negara_Sungai_Tembeling.JPG'],
  ],
  'South Korea': [
    ['Seoul', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/%EA%B4%91%ED%99%94%EB%AC%B8_%EC%9B%94%EB%8C%80.jpg/960px-%EA%B4%91%ED%99%94%EB%AC%B8_%EC%9B%94%EB%8C%80.jpg'],
    ['Bulguksa Temple', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Lotus_Flower_Bridge_and_Seven_Treasure_Bridge_at_Bulguksa_in_Gyeongju%2C_Korea.jpg/960px-Lotus_Flower_Bridge_and_Seven_Treasure_Bridge_at_Bulguksa_in_Gyeongju%2C_Korea.jpg'],
    ['Hwaseong Fortress', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Hwaseong_Fortress%2C_Suwon%2C_Gyeonggi-do%2C_Republic_of_Korea_%282%29.jpg/960px-Hwaseong_Fortress%2C_Suwon%2C_Gyeonggi-do%2C_Republic_of_Korea_%282%29.jpg'],
    ['Jeju Island', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Hallasan_Above.jpg/960px-Hallasan_Above.jpg'],
    ['Seoraksan National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Dinosaur_Ridge_of_Seoraksan.jpg/960px-Dinosaur_Ridge_of_Seoraksan.jpg'],
    ['Boseong Green Tea Fields', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Boseong_Green_Tea_Field_in_summer_2017.jpg/960px-Boseong_Green_Tea_Field_in_summer_2017.jpg'],
  ],
  'Nepal': [
    ['Kathmandu', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Basantapurpalace.JPG/960px-Basantapurpalace.JPG'],
    ['Boudhanath Stupa', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Boudhanath_stupa_%2C_Kathmandu%2C_Nepal.jpg/960px-Boudhanath_stupa_%2C_Kathmandu%2C_Nepal.jpg'],
    ['Pashupatinath Temple', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Pashupatinath_Temple-2020.jpg/960px-Pashupatinath_Temple-2020.jpg'],
    ['Mount Everest', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Mt._Everest_from_Gokyo_Ri_November_5%2C_2012.jpg/960px-Mt._Everest_from_Gokyo_Ri_November_5%2C_2012.jpg'],
    ['Annapurna Range', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Pokhara_Valley.jpg/960px-Pokhara_Valley.jpg'],
    ['Chitwan National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Chitwan_swamp.jpg/960px-Chitwan_swamp.jpg'],
  ],
  'Sri Lanka': [
    ['Colombo', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Colombo_city_skyline_at_night.png/960px-Colombo_city_skyline_at_night.png'],
    ['Sigiriya', 'wonder', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Sigiriya_%28141688197%29.jpeg/960px-Sigiriya_%28141688197%29.jpeg'],
    ['Temple of the Sacred Tooth Relic, Kandy', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/SL_Kandy_asv2020-01_img33_Sacred_Tooth_Temple.jpg/960px-SL_Kandy_asv2020-01_img33_Sacred_Tooth_Temple.jpg'],
    ['Ella (Nine Arches Bridge)', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/NineArchesBridge.JPG/960px-NineArchesBridge.JPG'],
    ['Yala National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Leopard_on_stone_in_Yala_National_Park.jpg/960px-Leopard_on_stone_in_Yala_National_Park.jpg'],
    ['Mirissa Beach', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Mirissa-Plage_%283%29.jpg/960px-Mirissa-Plage_%283%29.jpg'],
  ],
  'United Arab Emirates': [
    ['Abu Dhabi', 'city', 'https://upload.wikimedia.org/wikipedia/en/7/7d/Sheikh_Zayed_Mosque_view.jpg'],
    ['Dubai (Burj Khalifa)', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Burj_Khalifa_%28worlds_tallest_building%29_and_the_Dubai_skyline_%2825781049892%29.jpg/960px-Burj_Khalifa_%28worlds_tallest_building%29_and_the_Dubai_skyline_%2825781049892%29.jpg'],
    ['Al Fahidi Historic District', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Al_Bastakiya_of_Dubai.jpg/960px-Al_Bastakiya_of_Dubai.jpg'],
    ['Liwa Desert', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Moreeb_dunes.jpg/960px-Moreeb_dunes.jpg'],
    ['Hajar Mountains', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/View_from_Jebel_Jais_-_panoramio.jpg/960px-View_from_Jebel_Jais_-_panoramio.jpg'],
    ['Sir Bani Yas Island', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Sir_Bani_Yas_Island%2C_United_Arab_Emirates.jpg/960px-Sir_Bani_Yas_Island%2C_United_Arab_Emirates.jpg'],
  ],
  'Israel': [
    ['Jerusalem', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Westernwall2.jpg/960px-Westernwall2.jpg'],
    ['Masada', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Israel-2013-Aerial_21-Masada.jpg/960px-Israel-2013-Aerial_21-Masada.jpg'],
    ['Bahá\'í Gardens, Haifa', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/6/6e/TerracesBenGurion2.jpg'],
    ['Dead Sea', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Dead_Sea_beach_00.JPG/960px-Dead_Sea_beach_00.JPG'],
    ['Negev Desert', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/MakhteshRamonMar262022_01.jpg/960px-MakhteshRamonMar262022_01.jpg'],
    ['Sea of Galilee', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Kinneret_cropped.jpg/960px-Kinneret_cropped.jpg'],
  ],
  'Portugal': [
    ['Lisbon', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Bel%C3%A9m_Tower_in_Lisbon%2C_Portugal.jpg/960px-Bel%C3%A9m_Tower_in_Lisbon%2C_Portugal.jpg'],
    ['Porto', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Porto_July_2014-34a.jpg/960px-Porto_July_2014-34a.jpg'],
    ['Sintra (Pena Palace)', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Sintra_Portugal_Pal%C3%A1cio_da_Pena-01.jpg/960px-Sintra_Portugal_Pal%C3%A1cio_da_Pena-01.jpg'],
    ['Algarve Coast', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Benagil_Cave_seen_by_above.jpg/960px-Benagil_Cave_seen_by_above.jpg'],
    ['Douro Valley', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Rio_Douro_-_Portugal_%2832615481975%29_%28cropped%29.jpg/960px-Rio_Douro_-_Portugal_%2832615481975%29_%28cropped%29.jpg'],
    ['Madeira Island', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Madeira_-_Funchal_-_Coastline_%286198192877%29.jpg/960px-Madeira_-_Funchal_-_Coastline_%286198192877%29.jpg'],
  ],
  'Netherlands': [
    ['Amsterdam', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Colorful_canal_houses_at_golden_hour_in_Damrak_avenue_Amsterdam_the_Netherlands.jpg/960px-Colorful_canal_houses_at_golden_hour_in_Damrak_avenue_Amsterdam_the_Netherlands.jpg'],
    ['Tulip Fields, Keukenhof', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/26Y_1599_2.jpg/960px-26Y_1599_2.jpg'],
    ['Kinderdijk Windmills', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/KinderdijkMolens02.jpg/960px-KinderdijkMolens02.jpg'],
    ['Hoge Veluwe National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Sand_Area_Hoge_Veluwe.jpg/960px-Sand_Area_Hoge_Veluwe.jpg'],
    ['Wadden Sea', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/13-09-29-nordfriesisches-wattenmeer-RalfR-19.jpg/960px-13-09-29-nordfriesisches-wattenmeer-RalfR-19.jpg'],
    ['Zandvoort Dunes', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Beach_along_the_North_Sea_in_Zandvoort%2C_the_Netherlands_%2847980163402%29.jpg/960px-Beach_along_the_North_Sea_in_Zandvoort%2C_the_Netherlands_%2847980163402%29.jpg'],
  ],
  'Switzerland': [
    ['Bern', 'city', 'https://upload.wikimedia.org/wikipedia/commons/7/75/Bern_luftaufnahme.png'],
    ['Château de Chillon', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/001_Chateau_de_Chillon_and_Dents_du_Midi_Photo_by_Giles_Laurent.jpg/960px-001_Chateau_de_Chillon_and_Dents_du_Midi_Photo_by_Giles_Laurent.jpg'],
    ['Lucerne Chapel Bridge', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Kapellbruecke.JPG/960px-Kapellbruecke.JPG'],
    ['Matterhorn', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Matterhorn_from_Domh%C3%BCtte_-_2.jpg/960px-Matterhorn_from_Domh%C3%BCtte_-_2.jpg'],
    ['Jungfrau Region', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Goldswil-Viadukt_Panorama_mit_Interlaken_im_Hintergrund_2.jpg/960px-Goldswil-Viadukt_Panorama_mit_Interlaken_im_Hintergrund_2.jpg'],
    ['Lake Geneva', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Lac_L%C3%A9man.jpg/960px-Lac_L%C3%A9man.jpg'],
  ],
  'Austria': [
    ['Vienna', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Schoenbrunn_philharmoniker_2012.jpg/960px-Schoenbrunn_philharmoniker_2012.jpg'],
    ['Salzburg', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Salzburg_%2848489551981%29.jpg/960px-Salzburg_%2848489551981%29.jpg'],
    ['Hallstatt', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Hallstatt_-_Zentrum_.JPG/960px-Hallstatt_-_Zentrum_.JPG'],
    ['Austrian Alps (Grossglockner)', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Gro%C3%9Fglockner_from_behind_the_glass_panorama_tower.JPG/960px-Gro%C3%9Fglockner_from_behind_the_glass_panorama_tower.JPG'],
    ['Salzkammergut Lakes', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/St._Wolfgang_im_Salzkammergut_-_Ortsansicht.JPG/960px-St._Wolfgang_im_Salzkammergut_-_Ortsansicht.JPG'],
    ['Krimml Waterfalls', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Austrian.waterfall.at.krimml.arp.jpg/960px-Austrian.waterfall.at.krimml.arp.jpg'],
  ],
  'Norway': [
    ['Oslo', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Nationaltheatret_evening.jpg/960px-Nationaltheatret_evening.jpg'],
    ['Bryggen, Bergen', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Bryggen%2C_Bergen%2C_Noruega%2C_2019-09-08%2C_DD_115-117_PAN.jpg/960px-Bryggen%2C_Bergen%2C_Noruega%2C_2019-09-08%2C_DD_115-117_PAN.jpg'],
    ['Nidaros Cathedral, Trondheim', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Nidaros_Cathedral%2C_Trondheim%2C_West_view_20150605_1.jpg/960px-Nidaros_Cathedral%2C_Trondheim%2C_West_view_20150605_1.jpg'],
    ['Geirangerfjord', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Geirangerfjord_.jpg/960px-Geirangerfjord_.jpg'],
    ['Lofoten Islands', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Moskenes_Reinebringen_lub_2025-07-21_img09_Aussicht.jpg/960px-Moskenes_Reinebringen_lub_2025-07-21_img09_Aussicht.jpg'],
    ['Northern Lights, Tromsø', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/d/df/Aurora_Borealis_Troms%C3%B8_Norway.jpg'],
  ],
  'Sweden': [
    ['Stockholm', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Gamla_stan_September_2014_01.jpg/960px-Gamla_stan_September_2014_01.jpg'],
    ['Visby, Gotland', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/0522Visby_domkyrka.jpg/960px-0522Visby_domkyrka.jpg'],
    ['Drottningholm Palace', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Drottningholms_slott.jpg/960px-Drottningholms_slott.jpg'],
    ['Swedish Lapland', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Suorvajaure_in_stora_sjofallet_park.jpg/960px-Suorvajaure_in_stora_sjofallet_park.jpg'],
    ['Stockholm Archipelago', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Vaxholm_21_2010.jpg/960px-Vaxholm_21_2010.jpg'],
    ['Fulufjället National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Fulufj%C3%A4llet_1.JPG/960px-Fulufj%C3%A4llet_1.JPG'],
  ],
  'Finland': [
    ['Helsinki', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Helsinki_Senate_Square%2C_2019_%2801%29.jpg/960px-Helsinki_Senate_Square%2C_2019_%2801%29.jpg'],
    ['Suomenlinna Fortress', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Suomenlinna_aerial.JPG/960px-Suomenlinna_aerial.JPG'],
    ['Turku Castle', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Turkucastle_edit.jpg/960px-Turkucastle_edit.jpg'],
    ['Finnish Lapland', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Paratiisikuru_waterfall.JPG/960px-Paratiisikuru_waterfall.JPG'],
    ['Lakeland (Saimaa)', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Lake_Saimaa_aerial.jpg/960px-Lake_Saimaa_aerial.jpg'],
    ['Koli National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Koli_hill_view.jpg/960px-Koli_hill_view.jpg'],
  ],
  'Ireland': [
    ['Dublin', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Temple_Bar_street_scenes%2C_Dublin.jpg/960px-Temple_Bar_street_scenes%2C_Dublin.jpg'],
    ['Rock of Cashel', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Rock_of_Cashel_%2849163525453%29.jpg/960px-Rock_of_Cashel_%2849163525453%29.jpg'],
    ['Newgrange', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Irelands_history.jpg/960px-Irelands_history.jpg'],
    ['Cliffs of Moher', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Cliffs-Of-Moher-OBriens-From-South.JPG/960px-Cliffs-Of-Moher-OBriens-From-South.JPG'],
    ['Ring of Kerry', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Atlantic_Ocean%2C_Ring_of_Kerry_%28506559%29_%2827964189752%29.jpg/960px-Atlantic_Ocean%2C_Ring_of_Kerry_%28506559%29_%2827964189752%29.jpg'],
    ['Connemara National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Connemara12Bens.jpg/960px-Connemara12Bens.jpg'],
  ],
  'Czechia': [
    ['Prague', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Prague_07-2016_view_from_Lesser_Town_Tower_of_Charles_Bridge_img3.jpg/960px-Prague_07-2016_view_from_Lesser_Town_Tower_of_Charles_Bridge_img3.jpg'],
    ['Český Krumlov', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Blick_auf_das_Stadtzentrum_von_Krumau_%282026%29.jpg/960px-Blick_auf_das_Stadtzentrum_von_Krumau_%282026%29.jpg'],
    ['Kutná Hora', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Kostnice_Sedlec.JPG/960px-Kostnice_Sedlec.JPG'],
    ['Bohemian Switzerland National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Pravcicka_brana_001.jpg/960px-Pravcicka_brana_001.jpg'],
    ['Moravian Karst', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Punkevn%C3%AD_jeskyn%C4%9B12.jpg/960px-Punkevn%C3%AD_jeskyn%C4%9B12.jpg'],
    ['Šumava Forest', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ple%C5%A1n%C3%A9_jezero.jpg/960px-Ple%C5%A1n%C3%A9_jezero.jpg'],
  ],
  'Croatia': [
    ['Zagreb', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Zagreb_Gornji_grad.jpg/960px-Zagreb_Gornji_grad.jpg'],
    ['Dubrovnik Old Town', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/The_walls_of_the_fortress_and_View_of_the_old_city._panorama.jpg/960px-The_walls_of_the_fortress_and_View_of_the_old_city._panorama.jpg'],
    ['Diocletian\'s Palace, Split', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Croatia-01239_-_The_Peristil_%289551533404%29.jpg/960px-Croatia-01239_-_The_Peristil_%289551533404%29.jpg'],
    ['Plitvice Lakes National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/View_in_Plitvice_Lakes_National_Park.jpg/960px-View_in_Plitvice_Lakes_National_Park.jpg'],
    ['Krka National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Krkawatervallen.jpg/960px-Krkawatervallen.jpg'],
    ['Hvar Island', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/View_of_Hvar_02.jpg/960px-View_of_Hvar_02.jpg'],
  ],
  'Hungary': [
    ['Budapest', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Hungarian_Parliament_Building_from_across_the_Danube%2C_2025-01-11.jpg/960px-Hungarian_Parliament_Building_from_across_the_Danube%2C_2025-01-11.jpg'],
    ['Fisherman\'s Bastion', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Hal%C3%A1szb%C3%A1stya_2017.jpg/960px-Hal%C3%A1szb%C3%A1stya_2017.jpg'],
    ['Eger Castle', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Er%C5%91drendszer_romjai_%2817237._sz%C3%A1m%C3%BA_m%C5%B1eml%C3%A9k%29.jpg/960px-Er%C5%91drendszer_romjai_%2817237._sz%C3%A1m%C3%BA_m%C5%B1eml%C3%A9k%29.jpg'],
    ['Lake Balaton', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Balaton_Hungary_Landscape.jpg/960px-Balaton_Hungary_Landscape.jpg'],
    ['Hortobágy National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Hortobagy-ziehbrunnen.jpg'],
    ['Aggtelek Caves', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Hungary_Baradla.jpg/960px-Hungary_Baradla.jpg'],
  ],
  'Argentina': [
    ['Buenos Aires', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Buenos_Aires_%2820234294752%29.jpg/960px-Buenos_Aires_%2820234294752%29.jpg'],
    ['Recoleta Cemetery', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/La_Recoleta_Cemetery_%2841054043562%29.jpg/960px-La_Recoleta_Cemetery_%2841054043562%29.jpg'],
    ['Jesuit Missions of San Ignacio Miní', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Ruins_of_San_Ignacio_Min%C3%AD.jpg/960px-Ruins_of_San_Ignacio_Min%C3%AD.jpg'],
    ['Perito Moreno Glacier', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Perito_Moreno_Glacier_2023.jpg/960px-Perito_Moreno_Glacier_2023.jpg'],
    ['Iguazú Falls (Argentina)', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Aerial_Foz_de_Igua%C3%A7u_26_Nov_2005.jpg/960px-Aerial_Foz_de_Igua%C3%A7u_26_Nov_2005.jpg'],
    ['Patagonia (Fitz Roy)', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/d/df/Fitz_Roy_massif_2015_1.JPG'],
  ],
  'Chile': [
    ['Santiago', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Palacio_de_La_Moneda_-_miguelreflex.jpg/960px-Palacio_de_La_Moneda_-_miguelreflex.jpg'],
    ['Valparaíso', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Historic_Quarter_of_the_Seaport_City_of_Valpara%C3%ADso_04.jpg/960px-Historic_Quarter_of_the_Seaport_City_of_Valpara%C3%ADso_04.jpg'],
    ['Rapa Nui (Easter Island) Moai', 'history', 'https://upload.wikimedia.org/wikipedia/commons/5/50/AhuTongariki.JPG'],
    ['Atacama Desert', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/San_Pedro_de_Atacama_oasis.jpg/960px-San_Pedro_de_Atacama_oasis.jpg'],
    ['Torres del Paine National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Torres_del_Paine_National_Park_%285484299567%29.jpg'],
    ['Marble Caves', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Cuevas_de_M%C3%A1rmol_-_Marble_Caves%2C_Blue_Water%2C_Patagonia%2C_Chile.jpg'],
  ],
  'Colombia': [
    ['Bogotá', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/BOG_La_Candelaria_alta.JPG/960px-BOG_La_Candelaria_alta.JPG'],
    ['Cartagena Old Town', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Museo_Naval_del_Caribe.JPG/960px-Museo_Naval_del_Caribe.JPG'],
    ['Ciudad Perdida', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/CIUDAD_PERDIDA_2.jpg/960px-CIUDAD_PERDIDA_2.jpg'],
    ['Cocora Valley', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Valle_del_cocora_-_general_view.jpg/960px-Valle_del_cocora_-_general_view.jpg'],
    ['Caño Cristales', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Ca%C3%B1o_Cristales_01.jpg/960px-Ca%C3%B1o_Cristales_01.jpg'],
    ['Tayrona National Park', 'coast', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Arrecifes.jpg/960px-Arrecifes.jpg'],
  ],
  'Ethiopia': [
    ['Addis Ababa', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Addis_in_night.jpg/960px-Addis_in_night.jpg'],
    ['Lalibela', 'sacred', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Lalibela%2C_san_giorgio%2C_esterno_24.jpg/960px-Lalibela%2C_san_giorgio%2C_esterno_24.jpg'],
    ['Aksum Obelisks', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Rome_Stele.jpg/960px-Rome_Stele.jpg'],
    ['Simien Mountains National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Semien_Mountains_9.jpg/960px-Semien_Mountains_9.jpg'],
    ['Danakil Depression', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/ET_Afar_asv2018-01_img48_Dallol.jpg/960px-ET_Afar_asv2018-01_img48_Dallol.jpg'],
    ['Blue Nile Falls', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Blue_Nile_Falls-03%2C_by_CT_Snow.jpg/960px-Blue_Nile_Falls-03%2C_by_CT_Snow.jpg'],
  ],
  'Tanzania': [
    ['Dar es Salaam', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/St_Joseph%27s_Catholic_Cathedral_%2834895613805%29.jpg/960px-St_Joseph%27s_Catholic_Cathedral_%2834895613805%29.jpg'],
    ['Stone Town, Zanzibar', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Zanzibar_sultan_palace.jpg/960px-Zanzibar_sultan_palace.jpg'],
    ['Olduvai Gorge', 'history', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Oldupai-3.jpg/960px-Oldupai-3.jpg'],
    ['Serengeti National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Serengeti-Landscape-2012.JPG/960px-Serengeti-Landscape-2012.JPG'],
    ['Mount Kilimanjaro', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Kilimanjaro_from_Amboseli.jpg/960px-Kilimanjaro_from_Amboseli.jpg'],
    ['Ngorongoro Crater', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Ngorongoro-1001-2.jpg/960px-Ngorongoro-1001-2.jpg'],
  ],
  'New Zealand': [
    ['Wellington', 'city', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Seddon_Statue_in_Parliament_Grounds.jpg/960px-Seddon_Statue_in_Parliament_Grounds.jpg'],
    ['Waitangi Treaty Grounds', 'history', 'https://upload.wikimedia.org/wikipedia/commons/2/25/Treaty_House_at_Waitangi_Treaty_Grounds.jpg'],
    ['Rotorua (Te Puia)', 'culture', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Government_Gardens_in_Rotorua_01.jpg/960px-Government_Gardens_in_Rotorua_01.jpg'],
    ['Milford Sound', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Milford_Sound_%28New_Zealand%29.JPG/960px-Milford_Sound_%28New_Zealand%29.JPG'],
    ['Tongariro National Park', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Tongariro_Mahuia_River_n.jpg'],
    ['Franz Josef Glacier', 'nature', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Franz_josef_Glacier_LC0250.jpg/960px-Franz_josef_Glacier_LC0250.jpg'],
  ],
};

export interface CountrySiteRow { country: string; countryId: string; position: number; name: string; kind: string; imageUrl: string; sourceUrl?: string | null; latitude?: number | null; longitude?: number | null }

export function sitesFor(gc: any, lang: string, databaseSites?: CountrySiteRow[]) {
  const T: Record<string, string> = lang === 'en'
    ? { nature: 'Nature', city: 'City', culture: 'Culture', history: 'History', sacred: 'Sacred', wonder: 'Wonder', coast: 'Coast', collection: 'Collection' }
    : { nature: 'Байгаль', city: 'Хот', culture: 'Соёл', history: 'Түүх', sacred: 'Сүсэг', wonder: 'Гайхамшиг', coast: 'Далайн эрэг', collection: 'Цуглуулга' };
  const remote = databaseSites?.filter((s) => s.country.toLowerCase() === gc.name.toLowerCase()).sort((a, b) => a.position - b.position);
  const raw: [string, string, string][] | undefined = remote?.length === 6
    ? remote.map((s) => [s.name, s.kind, s.imageUrl])
    : FAMOUS_SITES[gc.name];
  if (raw) {
    return raw.slice(0, 6).map((s, i) => ({
      n: String(i + 1).padStart(2, '0'), name: s[0], tag: T[s[1]] || s[1],
      cover: 'linear-gradient(rgba(11,10,8,.12), rgba(11,10,8,.28)), url("' + imgUrl(s[2], 600) + '")',
    }));
  }
  // No curated landmarks for this country — fall back to a generic photo per
  // its archive category (this app ships no bundled stock imagery, see PLACEHOLDER_IMG).
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
  const list: [string, string][] = (gc.categories || ['culture', 'memory', 'audio']).map((c: string) => [c.charAt(0).toUpperCase() + c.slice(1), 'collection']);
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

export interface CatItem { name: string; meta: string; sub: string; aimag?: string; hours?: string; phone?: string; desc?: string; access?: boolean; img?: string; images?: string[]; id?: number; lat?: number; lng?: number; mapUrl?: string; }
export interface Cat {
  slug: string; num: string; name: string; nameEn: string; desc: string; descEn: string;
  glow: string; hero: string; pool: string[]; subs: string[];
  previews: { name: string; meta: string }[]; items: CatItem[];
}

export const CATS: Cat[] = [
  {
    slug: 'food', num: '01', name: 'Хоол', nameEn: 'Food',
    desc: 'Оройн хоол, нэг аяга кофе, чимээгүй яриа — сонгодог болзоо.',
    descEn: 'Dinner, coffee, quiet conversation — the classic date.',
    glow: 'rgba(232,160,90,.4)', hero: '1414235077428-338989a2e8c0',
    pool: ['1514933651103-005eec06c04b', '1470337458703-46ad1756a187', '1510812431401-41d2bd2722f3'],
    subs: ['Ресторан', 'Кафе', 'Түргэн хоол', 'Дээд зэрэглэлийн ресторан', 'Бэйкери', 'Лоунж'],
    // Real businesses in this category come from the Place table (see
    // /api/places), fetched and grouped by BigBangLayout.fetchLiveContent.
    previews: [],
    items: [],
  },
  {
    slug: 'entertainment', num: '02', name: 'Зугаа цэнгэл', nameEn: 'Entertainment',
    desc: 'Хөгжим, кино, тайз — хамтдаа зугаацах цаг.',
    descEn: 'Music, movies and shows — time to have fun together.',
    glow: 'rgba(150,110,230,.36)', hero: '1470229722913-7c0e2dbbafd3',
    pool: ['1470229722913-7c0e2dbbafd3', '1507924538820-ede94a04019d', '1513364776144-60967b0f800f'],
    subs: ['Кино театр', 'Амьд хөгжим', 'Студи'],
    previews: [],
    items: [],
  },
  {
    slug: 'relaxation', num: '03', name: 'Амралт', nameEn: 'Relaxation',
    desc: 'Удаашрах, амрах, хамтдаа тайвшрах — яриа өөрөө урсана.',
    descEn: 'Slow down, relax, unwind together.',
    glow: 'rgba(120,200,170,.32)', hero: '1544161515-4ab6ce6db874',
    pool: ['1544161515-4ab6ce6db874', '1506126613408-eca07ce68773', '1540555700478-4be289fbecef'],
    subs: ['Массаж', 'Сауна', 'Гоо сайхан', 'Амралтын газар'],
    previews: [],
    items: [],
  },
  {
    slug: 'activities', num: '04', name: 'Идэвхтэй амралт', nameEn: 'Activities',
    desc: 'Зүрх дэлсүүлэх адал явдал — мөс хайлуулах хамгийн хурдан арга.',
    descEn: 'Heart-racing adventures — the fastest way to break the ice.',
    glow: 'rgba(235,110,60,.38)', hero: '1517649763962-0c623066013b',
    pool: ['1461896836934-ffe607ba8211', '1476480862126-209bfaa8edc8', '1517649763962-0c623066013b'],
    subs: ['Явган аялал', 'Спорт', 'Кемп', 'Тоглоом', 'Адреналин'],
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
    profile: 'Профайл', profileName: 'Миний профайл', profileMeta: 'Atlas хэрэглэгч · Улаанбаатар', settings: 'Тохиргоо',
    a11yEyeTitle: 'Харааны бэрхшээлтэй горим', a11yEyeSub: 'Товчлуур болон текстийг том, тодоор харуулна',
    a11yWheelTitle: 'Тусгай хэрэгцээт горим', a11yWheelSub: 'Ээлтэй газруудыг эхэнд эрэмбэлж харуулна', addContent: 'Контент нэмэх',
    addPlaceTitle: 'Газар нэмэх', addPlaceDesc: 'Ресторан, клуб, амралтын газар',
    addPlaceApproval: 'Админ баталгаажуулсны дараа идэвхжинэ',
    addScenicTitle: 'Үзэсгэлэнт газар', addScenicDesc: 'Байгалийн үзэсгэлэнт цэг нэмэх',
    addEventTitle: 'Эвент нэмэх', addEventDesc: 'Тодорхой огноо, цагтай арга хэмжээ',
    addInstantNote: 'Шууд нийтлэгдэнэ',
    // Success card shown right after a place/scenic/event clears its final
    // OTP confirm — see CreateSuccessCard.
    createdPlaceTitle: 'Газар амжилттай үүслээ',
    createdScenicTitle: 'Үзэсгэлэнт газар амжилттай үүслээ',
    createdEventTitle: 'Эвент амжилттай үүслээ',
    createdPlaceNote: 'Админ баталгаажуулсны дараа бүх хэрэглэгчид харагдана. Профайлаасаа явцыг харж болно.',
    createdInstantNote: 'Шууд нийтлэгдлээ — профайлаасаа харж болно.',
    createdGoProfile: 'Профайл руу очих →',
    createdClose: 'Хаах',
    myPlacesTitle: 'Миний нэмсэн газрууд',
    myScenicTitle: 'Миний нэмсэн үзэсгэлэнт газрууд', myEventsTitle: 'Миний нэмсэн эвентүүд',
    scModalTitle: 'Үзэсгэлэнт газар нэмэх', scName: 'Газрын нэр', scNamePh: 'Ж: Тэрхийн цагаан нуур',
    scDesc: 'Тайлбар', scDescPh: 'Юугаараа онцлог вэ...', scSave: 'Нэмэх',
    evModalTitle: 'Эвент нэмэх', evName: 'Уулзалтын нэр', evNamePh: 'Ж: UB Jazz Night',
    evDate: 'Огноо', evTime: 'Цаг', evTag: 'Төрөл', evTagPh: 'Концерт / Кино / Спорт',
    evDescPh: 'Байршил, дэлгэрэнгүй...', evSave: 'Нэмэх', eMonFallback: '7-р сар', eTagFallback: 'Эвент',
    eventTitle: 'Эвент', eventSub: 'Тодорхой огноо, цаг, байршилтай арга хэмжээнүүд', featured: 'Онцлох',
    suggestTitle: 'Санал болгох', suggestSub: 'Atlas багийн бэлтгэсэн кино болон тоглоомын жагсаалтууд',
    appsTitle: 'Аялахад хэрэгтэй апп-ууд', appsSub: 'Монголд аялахад тусалдаг апп-ууд — гарахаасаа өмнө татаж аваарай', appsBadge: 'Аяллын багц', appsCta: 'Бүгдийг татах',
    topRowTitle: 'Хамгийн өндөр үнэлгээтэй', save: 'Хадгалах', savedLabel: 'Хадгалсан ✓',
    brandsTitle: 'Алдартай брэндээс санал болгож байна', brandsSub: 'Atlas-ийн хамтрагч брэндүүд',
    evJoin: 'Очно', evJoined: 'Очно ✓',
    // Follows the headcount: "12 хүн очно".
    evAttendSuffix: 'хүн очно',
    faqTitle: 'Түгээмэл асуулт хариулт',
    faqSub: 'Хэрэглэгчээс хамгийн их асуудаг зүйлс',
    fav: 'Дуртай', favTitle: 'Дуртай газрууд', favSub: 'Таны ♥ дарж хадгалсан газрууд — төрлөөрөө ангилагдсан',
    favPlaces: 'Газрууд', favScenic: 'Үзэсгэлэнт газрууд',
    favEmpty: 'Одоогоор хоосон байна — газрын карт дээрх ♡ товчийг дарж нэмээрэй',
    favEmptyScenic: 'Одоогоор хоосон байна — Пин хуудаснаас үзэсгэлэнт газрын ♡ товчийг дарж нэмээрэй',
    eventsEmpty: 'Одоогоор идэвхтэй эвент алга — удахгүй шинэ арга хэмжээнүүд нэмэгдэнэ',
    abHero: 'Болзооны санаануудын орон зай',
    abIntro: 'Atlas бол Монголын нуугдсан, сонирхолтой газруудыг нээж, хүмүүст илүү амархан олоход туслах платформ юм. Бид хэрэглэгчдэд аймаг, бүс нутгаар нь газрууд, эвент, байршил, мэдээллийг нэг дор харах боломжийг бүрдүүлнэ.',
    abMissionT: 'Зорилго', abMission: 'Монгол орныг илүү ойлгомжтой, хүртээмжтэй, сонирхолтой байдлаар танилцуулж, хамтдаа өнгөрүүлэх цаг мөч бүрийг мартагдашгүй болгох.',
    abWhoT: 'Хэнд зориулсан', abWho: 'Болзоонд явах хосууд, найзуудтайгаа шинэ газар хайж буй хүмүүс, аялагчид болон өөрийн газраа танилцуулахыг хүссэн эзэд, хостууд.',
    abEdgeT: 'Давуу тал', abEdge: '21 аймгийг хамарсан газрын зураг, ангилалтай хайлт, рейтинг ба дуртай газрын жагсаалт — бүгд нэг дор.',
    abTeamT: 'Манай баг', abVisionT: 'Алсын хараа',
    abVision: 'Монголын өнцөг булан бүрийн гоё газрууд хүн бүрт нээлттэй, олдоход хялбар байх ертөнцийг бид бүтээнэ.',
    abReachHead: 'Гадаад жуулчдыг Монгол руу татах — бидний зорилт.',
    abReachBody: 'Atlas нь зөвхөн дотоодын хосуудад зориулсан биш, Монголын нуугдсан үзэсгэлэнт газруудыг дэлхийд харуулах цонх юм. Доорх улаан зураас бүр Монгол руу ирж буй жуулчны урсгалыг илэрхийлнэ. Бидний алсын хараа — энэ зураасуудыг олшруулж, улам олон улс оронд Монголоо сурталчлах.',
    abReachCaption: 'Улаан зураас бүр = Монгол руу ирж буй жуулчны урсгал',
    abContact: 'Холбоо барих', abPhil: 'Философи', abStages: 'Ангилал үзэх', abBig: 'ATLAS',
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
    profile: 'Profile', profileName: 'My profile', profileMeta: 'Atlas user · Ulaanbaatar', settings: 'Settings',
    a11yEyeTitle: 'Low-vision mode', a11yEyeSub: 'Larger, bolder buttons and text',
    a11yWheelTitle: 'Accessibility mode', a11yWheelSub: 'Sort wheelchair-friendly places first', addContent: 'Add content',
    addPlaceTitle: 'Add place', addPlaceDesc: 'Restaurant, club, getaway',
    addPlaceApproval: 'Goes live after admin approval',
    addScenicTitle: 'Scenic spot', addScenicDesc: 'Add a natural scenic place',
    addEventTitle: 'Add event', addEventDesc: 'A happening with a date and time',
    addInstantNote: 'Publishes instantly',
    createdPlaceTitle: 'Place created',
    createdScenicTitle: 'Scenic spot created',
    createdEventTitle: 'Event created',
    createdPlaceNote: 'It goes live for everyone once an admin approves it. You can follow that from your profile.',
    createdInstantNote: 'It is live already — you can see it on your profile.',
    createdGoProfile: 'Go to profile →',
    createdClose: 'Close',
    myPlacesTitle: 'My submitted places',
    myScenicTitle: 'My scenic spots', myEventsTitle: 'My events',
    scModalTitle: 'Add scenic spot', scName: 'Name', scNamePh: 'e.g. Terkhiin Tsagaan Lake',
    scDesc: 'Description', scDescPh: 'What makes it special...', scSave: 'Add',
    evModalTitle: 'Add event', evName: 'Event name', evNamePh: 'e.g. UB Jazz Night',
    evDate: 'Date', evTime: 'Time', evTag: 'Type', evTagPh: 'Concert / Movie / Sport',
    evDescPh: 'Location, details...', evSave: 'Add', eMonFallback: 'Jul', eTagFallback: 'Event',
    eventTitle: 'Events', eventSub: 'Time-bound happenings with a date, time and place', featured: 'Featured',
    suggestTitle: 'Suggest', suggestSub: 'Curated movie & game lists by the Atlas team',
    appsTitle: 'Apps you need for the trip', appsSub: 'Handy apps for traveling in Mongolia — download before you go', appsBadge: 'Travel kit', appsCta: 'Get them all',
    topRowTitle: 'Top rated', save: 'Save', savedLabel: 'Saved ✓',
    brandsTitle: 'Recommended from top brands', brandsSub: 'Atlas partner brands',
    evJoin: 'Join', evJoined: 'Joined ✓',
    evAttendSuffix: 'going',
    faqTitle: 'Frequently asked questions',
    faqSub: 'What users ask us most',
    fav: 'Favorites', favTitle: 'Favorite places', favSub: 'Places you saved with ♥ — grouped by type',
    favPlaces: 'Places', favScenic: 'Scenic spots',
    favEmpty: 'Nothing here yet — tap ♡ on a place card to add',
    favEmptyScenic: 'Nothing here yet — tap ♡ on a scenic spot from the Pin page',
    eventsEmpty: 'No active events yet — new happenings will be added soon',
    abHero: 'A space of date ideas',
    abIntro: "Atlas is a platform that uncovers Mongolia's hidden, interesting places and makes them easy to find. We bring places, events, locations and info together in one view, browsable by province and region.",
    abMissionT: 'Mission', abMission: 'Present Mongolia in a clearer, more accessible and exciting way — and make every moment spent together unforgettable.',
    abWhoT: "Who it's for", abWho: 'Couples planning a date, friends looking for something new, travelers, and place owners or hosts who want to showcase their spot.',
    abEdgeT: 'What makes us different', abEdge: 'A map covering all 21 provinces, categorized search, ratings and a favorites list — all in one place.',
    abTeamT: 'Our team', abVisionT: 'Vision',
    abVision: "We're building a world where the beautiful places in every corner of Mongolia are open and easy for everyone to find.",
    abReachHead: 'Attracting foreign travelers to Mongolia — our mission.',
    abReachBody: "Atlas isn't only for local couples — it's a window that shows Mongolia's hidden, beautiful places to the world. Every red line below is a flow of tourists arriving in Mongolia. Our vision: to multiply these lines and promote Mongolia to ever more countries.",
    abReachCaption: 'Each red line = a flow of tourists to Mongolia',
    abContact: 'Contact', abPhil: 'Philosophy', abStages: 'Browse places', abBig: 'ATLAS',
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
