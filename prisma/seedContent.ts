// One-off content seed for ScenicPin/Place/Event — these three tables were
// still empty after prisma/seed.ts (which only seeds Aimag/Category/admin/
// SuggestCard/Ad). Adds 20 rows to each so the map, /suggest and /event
// pages have real content to show instead of an empty state. Every scenic
// pin points at a real, named Mongolian landmark with real coordinates
// (verified against Wikimedia Commons + general geography) so its "view on
// Google Maps" pin actually lands on the right spot; Place/Event rows are
// fictional businesses/events but are still placed at the real aimag
// capital they claim to be in. Images are Wikimedia Commons photos chosen
// to match each entry's subject (Special:FilePath so no thumb-hash path
// needs to be guessed) — safe to re-run since it no-ops once each table is
// non-empty (see the `count()` guards in main(), same pattern as seed.ts's
// SuggestCard/Ad guards).
import { prisma } from '../lib/prisma';

// Duplicated from prisma/seed.ts rather than imported — that file runs its
// own main() as a top-level side effect on import, which would re-run the
// whole aimag/category/admin seed every time this script does.
const SEED_ADMIN_EMAIL = 'admin@bigbang.mn';

const WM = (file: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1200`;

const SCENIC_PINS: { name: string; type: string; description: string; aimag: string; lat: number; lng: number; image: string }[] = [
  { name: 'Хөвсгөл нуур', type: 'Нуурын эрэг', description: 'Монголын цэнхэр сувд хэмээн алдаршсан гүн, цэвэр усны нуур — уулаар хүрээлэгдсэн.', aimag: 'Хөвсгөл', lat: 50.4333, lng: 100.1500, image: 'The frozen Khuvsgul Lake in Mongolia (iss074e0247458).jpg' },
  { name: 'Хонгорын Элс', type: 'Элсэн манхан', description: '«Дуут манхан» хэмээх говийн хамгийн алдартай, өндөр элсэн манхан.', aimag: 'Өмнөговь', lat: 43.7500, lng: 102.1667, image: 'Khongoryn Els 04.jpg' },
  { name: 'Эрдэнэ Зуу хийд', type: 'Шашны дурсгал', description: 'Монголын анхны буддын хийдүүдийн нэг — эртний Хархорин хотын дэргэд.', aimag: 'Өвөрхангай', lat: 47.1975, lng: 102.8317, image: 'Erdene Zuu Monastery 08.jpg' },
  { name: 'Хархорин (эртний нийслэл)', type: 'Түүхэн дурсгал', description: 'Их Монгол Улсын эртний нийслэл байсан түүхэн газар.', aimag: 'Өвөрхангай', lat: 47.1975, lng: 102.8167, image: 'Kharkhorin Mongolia (Photo by Kirill Burtasovsky).jpg' },
  { name: 'Мэлхий хад', type: 'Байгалийн дурсгал', description: 'Мэлхий шиг хэлбэртэй гайхамшигт хад чулуу — Горхи-Тэрэлжийн цогцолборт.', aimag: 'Төв', lat: 47.9667, lng: 107.4167, image: 'Turtle rock, Gorkhi-Terelj National Park.jpg' },
  { name: 'Таван Богд', type: 'Уулын харагдац', description: 'Монголын хамгийн өндөр уулс, мөнхийн цасан оргилууд.', aimag: 'Баян-Өлгий', lat: 49.1333, lng: 87.7500, image: 'Tavan Bogd Mountain.jpg' },
  { name: 'Ёлын Ам', type: 'Хавцал', description: 'Зуны цагт ч мөс хайлдаггүй гүн, нарийн хавцал.', aimag: 'Өмнөговь', lat: 43.1667, lng: 104.0500, image: 'Yolyn Am 02.jpg' },
  { name: 'Цагаан Суварга', type: 'Байгалийн дурсгал', description: 'Устай далайн ёроолоос үүссэн, цайвар шаварлаг хадан цуваа.', aimag: 'Дундговь', lat: 45.4667, lng: 105.1500, image: 'Tsagaan Suvarga Limestone Cliffs, Mongolia.jpg' },
  { name: 'Баянзаг', type: 'Байгалийн дурсгал', description: '«Шатсан хад» — үлэг гүрвэлийн өндөг олдсон алдартай улаан хадархаг газар.', aimag: 'Өмнөговь', lat: 44.1667, lng: 103.7333, image: 'Bayanzag 09.jpg' },
  { name: 'Хустайн нуруу', type: 'Байгалийн цогцолбор', description: 'Тахь (Пржевальскийн адуу) байгаль дээрээ амьдардаг тусгай хамгаалалттай газар.', aimag: 'Төв', lat: 47.8167, lng: 105.9333, image: 'Khustain Nuruu National Park (7).JPG' },
  { name: 'Улаан Цутгалан', type: 'Хүрхрээ', description: 'Орхон голын хүрхрээ — Монголын хамгийн үзэсгэлэнтэй усан оргилуурын нэг.', aimag: 'Өвөрхангай', lat: 46.7833, lng: 101.6667, image: 'Ulaan Tsutgalan Waterfall.jpg' },
  { name: 'Амарбаясгалант хийд', type: 'Шашны дурсгал', description: 'Хятад-Түвдийн хийцтэй, Монголын хамгийн сайхан хадгалагдсан хийдүүдийн нэг.', aimag: 'Сэлэнгэ', lat: 49.4833, lng: 105.0667, image: 'Amarbayasgalant Monastery.JPG' },
  { name: 'Тэрхийн Цагаан нуур', type: 'Нуур', description: 'Галт уулын дэргэдэх цэнхэр нуур — Хорго уулын галт уулын цогцолборт.', aimag: 'Архангай', lat: 48.1833, lng: 99.8667, image: 'Khorgo-Terkhiin Tsagaan Nuur National Park.jpg' },
  { name: 'Увс нуур', type: 'Нуур', description: 'Төв Азийн хамгийн том давстай нуур, ЮНЕСКО-гийн биосферийн нөөц газар.', aimag: 'Увс', lat: 50.3667, lng: 92.7500, image: 'Mongolian beautiful Uvs Lake.jpg' },
  { name: 'Хамарын хийд', type: 'Шашны дурсгал', description: 'Данзанравжаа гүн бишрэлт хуврагийн байгуулсан түүхэн хийд, говийн дунд.', aimag: 'Дорноговь', lat: 44.8833, lng: 110.1167, image: 'Khamar Monastery.jpg' },
  { name: 'Онгийн хийд', type: 'Түүхэн дурсгал', description: 'Хуучин үедээ мянга гаруй хуврагтай байсан, эвдэрсэн хийдийн туурь.', aimag: 'Дундговь', lat: 45.3167, lng: 103.4333, image: 'OngiinKhiid2.jpg' },
  { name: 'Найман нуур', type: 'Нуурын цогцолбор', description: 'Уулархаг ландшафт дунд оршдог найман тунгалаг нуурын гинж.', aimag: 'Өвөрхангай', lat: 46.4667, lng: 101.4667, image: 'Trekking around Naiman Nuur Lakes (26100696848).jpg' },
  { name: 'Хар-Ус нуур', type: 'Нуур', description: 'Их нууруудын хотгорт орших дэлхийн чухал шувуу нүүдлийн бүс.', aimag: 'Ховд', lat: 48.1667, lng: 92.2000, image: 'Khar-Us-Nuur lake, Mongolia, ESC large ISS006 ISS006-E-7827.JPG' },
  { name: 'Цамбагарав уул', type: 'Уулын харагдац', description: 'Мөнх цастай, мөстөлтэй сүрлэг уул — Алтайн нурууны нэг хэсэг.', aimag: 'Баян-Өлгий', lat: 48.9000, lng: 90.8500, image: 'Tsambagarav Mountain.JPG' },
  { name: 'Дарьганга', type: 'Байгалийн цогцолбор', description: 'Унтарсан галт уулс, элсэн манхантай өвөрмөц дүрст нутаг.', aimag: 'Сүхбаатар', lat: 45.3167, lng: 113.9167, image: 'Dariganga (35579176371).jpg' },
];

const PLACES: { name: string; description: string; category: string; sub: string; aimag: string; lat: number; lng: number; image: string; openTime: string; closeTime: string; accessible: boolean }[] = [
  { name: 'Тэнгэр Ресторан', description: 'Монгол үндэсний хоол, орчин үеийн тавилгатай тав тухтай ресторан.', category: 'food', sub: 'Ресторан', aimag: 'Улаанбаатар', lat: 47.9184, lng: 106.9177, image: 'St. Lawrence restaurant interior dining area view.jpg', openTime: '11:00', closeTime: '23:00', accessible: true },
  { name: 'Наран Гурил Бэйкери', description: 'Өдөр бүр шинэ жигнэмэг, талх, кофи санал болгодог бэйкери.', category: 'food', sub: 'Бэйкери', aimag: 'Улаанбаатар', lat: 47.9143, lng: 106.9200, image: 'Corrado Bakery at 90th Street and Lexington Avenue, Upper East Side, Manhattan.jpg', openTime: '07:00', closeTime: '21:00', accessible: true },
  { name: 'Latte Lane Кафе', description: 'Латтэ арт, тухтай суудал, ажлын өдрийн эрч хий сэргээх кафе.', category: 'food', sub: 'Кафе', aimag: 'Улаанбаатар', lat: 47.9205, lng: 106.9150, image: 'Café latte - French Coffee Shop, Dieppe 2026-05-11.jpg', openTime: '08:00', closeTime: '22:00', accessible: false },
  { name: 'Талын Гуанз', description: 'Хурдан, амтат, эрсдэлгүй үнэтэй өдөр тутмын гуанз.', category: 'food', sub: 'Түргэн хоол', aimag: 'Улаанбаатар', lat: 47.9100, lng: 106.9230, image: 'Minced Meat Rice Bowl - Noodles Street 2025-11-01.jpg', openTime: '09:00', closeTime: '22:00', accessible: true },
  { name: 'Golden Deel Fine Dining', description: 'Тансаг тохижилттой, шеф-хоолны цэстэй дээд зэрэглэлийн ресторан.', category: 'food', sub: 'Дээд зэрэглэлийн ресторан', aimag: 'Улаанбаатар', lat: 47.9220, lng: 106.9110, image: 'Thana fine dining interior dining 2.png', openTime: '18:00', closeTime: '00:00', accessible: true },
  { name: 'Sky Lounge 27', description: 'Хотын өндөрлөгөөс харагддаг дэлгэц, коктейлийн цэстэй лоунж бар.', category: 'food', sub: 'Лоунж', aimag: 'Улаанбаатар', lat: 47.9160, lng: 106.9260, image: 'Bartender preparing a blue blazer cocktail03.jpg', openTime: '17:00', closeTime: '02:00', accessible: false },
  { name: 'Эрдэнэт Кафе Хаус', description: 'Орон нутгийн залуучуудын цуглах дуртай тайван кафе.', category: 'food', sub: 'Кафе', aimag: 'Орхон', lat: 49.0333, lng: 104.0833, image: 'Coffeehouse, coffee shop, or café, IRAN, Mashhad 19.jpg', openTime: '08:00', closeTime: '21:00', accessible: true },
  { name: 'Tengis Cinema Palace', description: '4К дэлгэц, тав тухтай суудалтай орчин үеийн кино театр.', category: 'entertainment', sub: 'Кино театр', aimag: 'Улаанбаатар', lat: 47.9188, lng: 106.9170, image: 'RZ Metro Movie Theater interior 2023-03 (2).jpg', openTime: '10:00', closeTime: '23:30', accessible: true },
  { name: 'Live Stage', description: 'Орон нутгийн хамтлагууд тогтмол тоглодог амьд хөгжмийн клуб.', category: 'entertainment', sub: 'Амьд хөгжим', aimag: 'Улаанбаатар', lat: 47.9130, lng: 106.9195, image: 'LAKE playing at The Hideout in Chicago, Illinois, USA (2025-04-20).jpg', openTime: '19:00', closeTime: '02:00', accessible: false },
  { name: 'SoundWave Студи', description: 'Дуу бичлэг, подкаст, хөгжмийн бүтээл хийх мэргэжлийн студи.', category: 'entertainment', sub: 'Студи', aimag: 'Улаанбаатар', lat: 47.9240, lng: 106.9080, image: 'Recording-Studio-In-Atlanta-Studio-A-Best-1030x535.jpg', openTime: '10:00', closeTime: '20:00', accessible: true },
  { name: 'Зэн Массаж төв', description: 'Уламжлалт болон орчин үеийн массажийн аргаар ядрал тайлдаг төв.', category: 'relaxation', sub: 'Массаж', aimag: 'Улаанбаатар', lat: 47.9175, lng: 106.9220, image: 'Couple walks by a clear pool in a resort wearing bathrobes and preparing for a relaxing day at the spa.jpg', openTime: '09:00', closeTime: '21:00', accessible: true },
  { name: 'Уужим Сауна', description: 'Уур амьсгал тайлах модон интерьертэй уламжлалт сауна.', category: 'relaxation', sub: 'Сауна', aimag: 'Дархан-Уул', lat: 49.4867, lng: 105.9228, image: 'Stained Glass, Fordyce Bathhouse, Hot Springs NP.JPG', openTime: '10:00', closeTime: '22:00', accessible: false },
  { name: 'Belle Beauty Studio', description: 'Үс, гоо сайхны иж бүрэн үзлэг, засал өнгөлгөө хийдэг студи.', category: 'relaxation', sub: 'Гоо сайхан', aimag: 'Улаанбаатар', lat: 47.9155, lng: 106.9145, image: 'Couple walks by a clear pool in a resort wearing bathrobes and preparing for a relaxing day at the spa.jpg', openTime: '09:00', closeTime: '20:00', accessible: true },
  { name: 'Тэрэлж Амралтын газар', description: 'Байгальд ойр амарч, тайван орчинд амрах жуулчны бааз.', category: 'relaxation', sub: 'Амралтын газар', aimag: 'Төв', lat: 47.9700, lng: 107.4200, image: 'Couple walks by a clear pool in a resort wearing bathrobes and preparing for a relaxing day at the spa.jpg', openTime: '00:00', closeTime: '23:59', accessible: true },
  { name: 'TrailMasters Явган аялалын клуб', description: 'Амралтын өдрүүдэд бүлгээр явган аялал зохион байгуулдаг клуб.', category: 'activities', sub: 'Явган аялал', aimag: 'Улаанбаатар', lat: 47.9250, lng: 106.9300, image: "Group Hiking on Munch's Coulee National Hiking Trail (5220995838).jpg", openTime: '08:00', closeTime: '18:00', accessible: false },
  { name: 'FitZone Спорт төв', description: 'Хүчний бэлтгэл, бүлгийн хичээлүүдтэй орчин үеийн фитнес төв.', category: 'activities', sub: 'Спорт', aimag: 'Улаанбаатар', lat: 47.9110, lng: 106.9060, image: 'Woman lifting dumbbells in a modern gym during a workout session focused on strength training and fitness.jpg', openTime: '06:00', closeTime: '23:00', accessible: true },
  { name: 'Nomad Ger Кемп', description: 'Уулын хормойд байрлах жуулчны гэр бааз — од харах, морь унах боломжтой.', category: 'activities', sub: 'Кемп', aimag: 'Төв', lat: 47.9600, lng: 107.4500, image: 'Steppe Nomads Eco Camp.jpg', openTime: '00:00', closeTime: '23:59', accessible: false },
  { name: 'BoardHouse Тоглоомын кафе', description: '200 гаруй ширээний тоглоомтой, найз нөхөдтэйгээ цуглах кафе.', category: 'activities', sub: 'Тоглоом', aimag: 'Улаанбаатар', lat: 47.9195, lng: 106.9245, image: 'Table Taft Board Game Café interior.jpg', openTime: '12:00', closeTime: '23:00', accessible: true },
  { name: 'Adrenaline Rock Climbing', description: 'Дотор болон гадаа авирга хана бүхий адреналин спортын төв.', category: 'activities', sub: 'Адреналин', aimag: 'Улаанбаатар', lat: 47.9270, lng: 106.9020, image: 'Outdoor rock climbing 150709-F-WT808-259.jpg', openTime: '10:00', closeTime: '22:00', accessible: false },
  { name: 'Ховд Спорт Клуб', description: 'Орон нутгийн залуучуудад зориулсан иж бүрэн спорт заал.', category: 'activities', sub: 'Спорт', aimag: 'Ховд', lat: 48.0056, lng: 91.6419, image: 'Woman lifting dumbbells in a modern gym during a workout session focused on strength training and fitness.jpg', openTime: '07:00', closeTime: '22:00', accessible: true },
];

const EVENTS: { name: string; tag: string; meta: string; aimag: string; lat: number; lng: number; image: string; startDate: string; featured?: boolean }[] = [
  { name: 'UB Jazz Night', tag: 'Концерт', meta: '20:00 · Жаз клуб 46', aimag: 'Улаанбаатар', lat: 47.9184, lng: 106.9177, image: 'A large crowd enjoys a music concert illuminated by colorful lights and a stunning stage display.jpg', startDate: '2026-08-15T20:00:00+08:00' },
  { name: 'Орчин үеийн урлагийн үзэсгэлэн', tag: 'Үзэсгэлэн', meta: '10:00–20:00 · Урлагийн галерей', aimag: 'Улаанбаатар', lat: 47.9200, lng: 106.9160, image: 'The Radical Textiles Exhibition at the Art Gallery of South Australia during the opening in November 2024 21.jpg', startDate: '2026-08-22T10:00:00+08:00' },
  { name: 'Pop-up дарсны үдэш', tag: 'Pop-up', meta: '19:00 · Noir Speakeasy', aimag: 'Улаанбаатар', lat: 47.9160, lng: 106.9260, image: 'DFC 2094 Evening buzz at a busy night market - food stalls colorful lights and people strolling through the crowded aisle.jpg', startDate: '2026-08-29T19:00:00+08:00' },
  { name: 'Улаанбаатар марафон 2026', tag: 'Спорт', meta: '07:00 · Сүхбаатарын талбай', aimag: 'Улаанбаатар', lat: 47.9186, lng: 106.9176, image: 'Runners celebrate after finishing a race in a city street during a summer event.jpg', startDate: '2026-09-06T07:00:00+08:00', featured: true },
  { name: 'Kino Under Stars', tag: 'Кино', meta: '21:00 · Тэнгис дээвэр', aimag: 'Улаанбаатар', lat: 47.9188, lng: 106.9170, image: 'RZ Metro Movie Theater interior 2023-03 (2).jpg', startDate: '2026-09-12T21:00:00+08:00' },
  { name: 'Rock Fest UB', tag: 'Концерт', meta: '18:00 · Соёлын төв цэнгэлдэх', aimag: 'Улаанбаатар', lat: 47.9150, lng: 106.9300, image: 'Live rock band performance at outdoor music festival with vibrant lights and energetic crowd.jpg', startDate: '2026-09-19T18:00:00+08:00' },
  { name: 'Гар урлалын зах', tag: 'Pop-up', meta: '11:00–19:00 · Зайсан талбай', aimag: 'Улаанбаатар', lat: 47.8980, lng: 106.9350, image: 'DFC 2094 Evening buzz at a busy night market - food stalls colorful lights and people strolling through the crowded aisle.jpg', startDate: '2026-09-26T11:00:00+08:00' },
  { name: 'Орхоны хөндийн наадам', tag: 'Цугларалт', meta: '09:00 · Хархорин', aimag: 'Өвөрхангай', lat: 47.1975, lng: 102.8317, image: 'Musicians perform at an outdoor music festival, captivating the crowd with energetic guitar riffs and dynamic stage presence.jpg', startDate: '2026-10-03T09:00:00+08:00' },
  { name: 'Фото үзэсгэлэн: Монгол орон дээрээс', tag: 'Үзэсгэлэн', meta: '10:00–18:00 · Соёлын ордон', aimag: 'Улаанбаатар', lat: 47.9210, lng: 106.9180, image: 'The Radical Textiles Exhibition at the Art Gallery of South Australia during the opening in November 2024 21.jpg', startDate: '2026-10-10T10:00:00+08:00' },
  { name: 'Хүүхдийн номын фестиваль', tag: 'Фестиваль', meta: '10:00–17:00 · Төв номын сан', aimag: 'Улаанбаатар', lat: 47.9166, lng: 106.9200, image: 'Musicians perform at an outdoor music festival, captivating the crowd with energetic guitar riffs and dynamic stage presence.jpg', startDate: '2026-10-17T10:00:00+08:00' },
  { name: 'Стенд-ап комедийн үдэш', tag: 'Цугларалт', meta: '20:00 · Comedy Club UB', aimag: 'Улаанбаатар', lat: 47.9140, lng: 106.9210, image: 'LAKE playing at The Hideout in Chicago, Illinois, USA (2025-04-20).jpg', startDate: '2026-10-24T20:00:00+08:00' },
  { name: 'Эрдэнэт хотын өдөр', tag: 'Фестиваль', meta: '12:00 · Төв талбай', aimag: 'Орхон', lat: 49.0333, lng: 104.0833, image: 'Live rock band performance at outdoor music festival with vibrant lights and energetic crowd.jpg', startDate: '2026-10-31T12:00:00+08:00' },
  { name: 'Зимний зах: Гар бүтээл', tag: 'Pop-up', meta: '11:00–18:00 · Blue Sky талбай', aimag: 'Улаанбаатар', lat: 47.9195, lng: 106.9145, image: 'DFC 2094 Evening buzz at a busy night market - food stalls colorful lights and people strolling through the crowded aisle.jpg', startDate: '2026-11-07T11:00:00+08:00' },
  { name: 'Дархан хотын спорт наадам', tag: 'Спорт', meta: '09:00 · Спорт ордон', aimag: 'Дархан-Уул', lat: 49.4867, lng: 105.9228, image: 'Runners celebrate after finishing a race in a city street during a summer event.jpg', startDate: '2026-11-14T09:00:00+08:00' },
  { name: 'Winter Sessions: Жазын үдэш', tag: 'Концерт', meta: '19:30 · Жаз клуб 46', aimag: 'Улаанбаатар', lat: 47.9184, lng: 106.9177, image: 'A large crowd enjoys a music concert illuminated by colorful lights and a stunning stage display.jpg', startDate: '2026-11-21T19:30:00+08:00' },
  { name: 'Орчин үеийн бүжгийн шоу', tag: 'Цугларалт', meta: '19:00 · Урлагийн академи', aimag: 'Улаанбаатар', lat: 47.9225, lng: 106.9100, image: 'Musicians perform at an outdoor music festival, captivating the crowd with energetic guitar riffs and dynamic stage presence.jpg', startDate: '2026-11-28T19:00:00+08:00' },
  { name: 'Шинэ жилийн зочны зах', tag: 'Pop-up', meta: '11:00–20:00 · Скай Шоппинг төв', aimag: 'Улаанбаатар', lat: 47.9130, lng: 106.9260, image: 'DFC 2094 Evening buzz at a busy night market - food stalls colorful lights and people strolling through the crowded aisle.jpg', startDate: '2026-12-05T11:00:00+08:00' },
  { name: 'Мөстэй наадам', tag: 'Фестиваль', meta: '10:00 · Хөвсгөл нуур', aimag: 'Хөвсгөл', lat: 50.4333, lng: 100.1500, image: 'Live rock band performance at outdoor music festival with vibrant lights and energetic crowd.jpg', startDate: '2026-12-19T10:00:00+08:00' },
  { name: 'Ховд хотын соёлын өдрүүд', tag: 'Цугларалт', meta: '12:00 · Төв талбай', aimag: 'Ховд', lat: 48.0056, lng: 91.6419, image: 'Musicians perform at an outdoor music festival, captivating the crowd with energetic guitar riffs and dynamic stage presence.jpg', startDate: '2027-01-09T12:00:00+08:00' },
  { name: 'UB Winter Art Walk', tag: 'Үзэсгэлэн', meta: '10:00–19:00 · Урлагийн буудал', aimag: 'Улаанбаатар', lat: 47.9200, lng: 106.9190, image: 'The Radical Textiles Exhibition at the Art Gallery of South Australia during the opening in November 2024 21.jpg', startDate: '2027-01-23T10:00:00+08:00' },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'atlas';
}

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
  if (!admin) throw new Error('Seed admin not found — run `prisma/seed.ts` first.');

  const aimags = await prisma.aimag.findMany();
  const aimagIdByName = new Map(aimags.map((a) => [a.name, a.id]));
  const idFor = (name: string) => {
    const id = aimagIdByName.get(name);
    if (!id) throw new Error(`Aimag not found: ${name}`);
    return id;
  };

  const categories = await prisma.category.findMany();
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const catIdFor = (slug: string) => {
    const id = categoryIdBySlug.get(slug);
    if (!id) throw new Error(`Category not found: ${slug}`);
    return id;
  };

  // Guard on a marker row instead of `count() === 0` — unlike SuggestCard/Ad
  // in seed.ts, this table can already hold real rows a user created through
  // the app (CreateForm), which this script must never duplicate/clobber.
  const scenicSeeded = await prisma.scenicPin.findFirst({ where: { name: SCENIC_PINS[0].name } });
  if (!scenicSeeded) {
    await prisma.scenicPin.createMany({
      data: SCENIC_PINS.map((p) => ({
        name: p.name, type: p.type, description: p.description,
        images: [WM(p.image)],
        aimagId: idFor(p.aimag),
        lat: p.lat, lng: p.lng,
        addedBy: admin.id,
      })),
    });
  }

  const placeSeeded = await prisma.place.findFirst({ where: { name: PLACES[0].name } });
  if (!placeSeeded) {
    await prisma.place.createMany({
      data: PLACES.map((p, i) => {
        const slug = slugify(p.name);
        return {
          name: p.name, description: p.description,
          images: [WM(p.image)],
          categoryId: catIdFor(p.category), subCategory: p.sub,
          aimagId: idFor(p.aimag),
          lat: p.lat, lng: p.lng,
          openTime: p.openTime, closeTime: p.closeTime,
          phone: String(90000000 + i),
          instagramUrl: `instagram.com/${slug}`,
          facebookUrl: `facebook.com/${slug}`,
          contactEmail: `${slug}@email.mn`,
          accessible: p.accessible,
          addedBy: admin.id,
          status: 'approved' as const,
        };
      }),
    });
  }

  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    await prisma.event.createMany({
      data: EVENTS.map((e, i) => {
        const slug = slugify(e.name);
        return {
          name: e.name, tag: e.tag, meta: e.meta,
          images: [WM(e.image)],
          startDate: new Date(e.startDate),
          aimagId: idFor(e.aimag),
          lat: e.lat, lng: e.lng,
          featured: !!e.featured,
          instagram: `instagram.com/${slug}`,
          phone: String(91000000 + i),
          addedBy: admin.id,
        };
      }),
    });
  }

  console.log(`Seeded ${scenicSeeded ? 0 : SCENIC_PINS.length} scenic pins, ${placeSeeded ? 0 : PLACES.length} places, ${eventCount === 0 ? EVENTS.length : 0} events.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
