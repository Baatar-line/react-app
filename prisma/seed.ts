// Seeds Aimag + Category with the same real-world data already used on the
// frontend (src/screens/bigbang/data.ts — AIMAGS/AIMAG_BG/CATS), so the two
// sides agree on names/slugs instead of drifting apart. No image/backgroundImage
// is seeded — those stay null until a host/admin uploads a real photo through
// the app (Cloudinary), so the frontend falls back to its placeholder graphic
// instead of showing stock imagery nobody actually uploaded.
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/password';

// Dev-only seeded admin account so AdminPanel (a local tool, not a public login
// page) can authenticate itself without a real login form yet. Change/rotate
// this before any real deployment — it's a placeholder, not a secret.
export const SEED_ADMIN_EMAIL = 'admin@bigbang.mn';
export const SEED_ADMIN_PASSWORD = 'bigbang-admin-dev';

const AIMAGS: [string, string][] = [
  ['Улаанбаатар', 'Ulaanbaatar'],
  ['Архангай', 'Arkhangai'],
  ['Баян-Өлгий', 'Bayan-Ulgii'],
  ['Баянхонгор', 'Bayankhongor'],
  ['Булган', 'Bulgan'],
  ['Говь-Алтай', 'Govi-Altai'],
  ['Говьсүмбэр', 'Govisumber'],
  ['Дархан-Уул', 'Darkhan-Uul'],
  ['Дорноговь', 'Dornogovi'],
  ['Дорнод', 'Dornod'],
  ['Дундговь', 'Dundgovi'],
  ['Завхан', 'Zavkhan'],
  ['Орхон', 'Orkhon'],
  ['Өвөрхангай', 'Uvurkhangai'],
  ['Өмнөговь', 'Umnugovi'],
  ['Сүхбаатар', 'Sukhbaatar'],
  ['Сэлэнгэ', 'Selenge'],
  ['Төв', 'Tuv'],
  ['Увс', 'Uvs'],
  ['Ховд', 'Khovd'],
  ['Хөвсгөл', 'Khuvsgul'],
  ['Хэнтий', 'Khentii'],
];

const CATEGORIES: { slug: string; name: string; nameEn: string; subs: string[] }[] = [
  { slug: 'adrenalin', name: 'Адреналин & Спорт', nameEn: 'Adrenaline & Sports',
    subs: ['Буудлага', 'Нум сум', 'Шүхрээр буух', 'Авиралт', 'Off-road', 'Цана / мотор', 'Паддл', 'Гольф симулятор', 'Мөсний гулгуур'] },
  { slug: 'wellness', name: 'Амралт & Wellness', nameEn: 'Rest & Wellness',
    subs: ['Спа / сауна', 'Йог / бясалгал', 'Массаж', 'Уламжлалт эмчилгээ', 'Орон зай түрээс', 'Муурны кафе'] },
  { slug: 'ayalal', name: 'Аялал & Байгаль', nameEn: 'Travel & Nature',
    subs: ['Морин аялал', 'Нохой чарга', 'Явган аялал', 'Glamping', 'Од ажиглах', 'Рашаан', 'Усан спорт', 'Завь'] },
  { slug: 'hool', name: 'Хоол & Ундаа', nameEn: 'Food & Drinks',
    subs: ['Speakeasy бар', 'Дээвэр лоунж', "Chef's table", 'Гэрийн зоог', 'Supper club', 'Дарс таних'] },
  { slug: 'zugaa', name: 'Өрсөлдөөн & Хөгжилтэй', nameEn: 'Competition & Fun',
    subs: ['Escape room', 'Board game кафе', 'VR arcade', 'Боулинг', 'Бильярд', 'Дартс бар', 'KTV', 'Шатрын кафе'] },
  { slug: 'soyol', name: 'Соёл & Урлаг', nameEn: 'Culture & Arts',
    subs: ['Андеграунд концерт', 'Амьд жаз', 'Open mic', 'Drive-in кино', 'Морин хуур / хөөмий', 'DJ үдэш', 'Зурагчийн студи', 'Галерей'] },
  { slug: 'horizon', name: 'Горизон', nameEn: 'Horizon',
    subs: ['Science cafe', 'Одон дурандах төв', 'Планетари', 'Шинжлэх ухааны лекц', 'Сансрын ажиглалт', 'Лаборатори тур'] },
];

// Same starter content the frontend used to hardcode in bigbang/data.ts's
// SUGGEST_COLLECTIONS before Suggest cards moved to the database (see
// SuggestCard model) — seeded once so the public /suggest/[slug] page isn't
// empty on a fresh database; admin panel manages real rows from here on.
const SUGGEST_CARDS: { collectionSlug: string; name: string; description: string; image: string }[] = [
  { collectionSlug: 'games', name: 'PC тоглоом', description: 'Компьютер дээр хамт тоглох тоглоомууд', image: '1550745165-9bc0b252726f' },
  { collectionSlug: 'games', name: 'Утасны тоглоом', description: 'Гар утсаараа хамт тоглох хурдан тоглоомууд', image: '1511512578047-dfb367046420' },
  { collectionSlug: 'games', name: 'Хамгийн хөгжилтэй тоглоомнууд', description: 'Хамтдаа наргиж тоглох шилдэг сонголтууд', image: '1493711662062-fa541adb3fc8' },
  { collectionSlug: 'movies', name: 'Хосоороо үзэх кино', description: 'Хайр дурлалын сэдэвтэй шилдэг кинонууд', image: '1489599849927-2ee91cede3ba' },
  { collectionSlug: 'movies', name: 'Найзуудтайгаа үзэх кино', description: 'Инээдтэй, адал явдалт кинонууд', image: '1517604931442-7e0c8ed2963c' },
  { collectionSlug: 'movies', name: 'Гэр бүлээрээ үзэх кино', description: 'Насны ялгаагүй хамт үзэх кинонууд', image: '1489599849927-2ee91cede3ba' },
  { collectionSlug: 'boardgame', name: 'Хосоороо тоглох board game', description: '2 хүнд тохирсон ширээний тоглоом', image: '1529699211952-734e80c4d42b' },
  { collectionSlug: 'boardgame', name: 'Найзуудтайгаа тоглох board game', description: 'Олон хүний зугаа цэнгэлийн тоглоом', image: '1610890716171-6b1bb98ffd09' },
  { collectionSlug: 'boardgame', name: 'Тоглоомын дүрэм', description: 'Тоглоом бүрийн заавар, дүрмийн товч тайлбар', image: '1529699211952-734e80c4d42b' },
];

async function main() {
  for (const [name, nameEn] of AIMAGS) {
    await prisma.aimag.upsert({
      where: { name },
      update: { nameEn },
      create: { name, nameEn },
    });
  }

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameEn: c.nameEn, subCategories: c.subs },
      create: { slug: c.slug, name: c.name, nameEn: c.nameEn, subCategories: c.subs },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: { role: 'admin' },
    create: { email: SEED_ADMIN_EMAIL, username: 'admin', role: 'admin', password: await hashPassword(SEED_ADMIN_PASSWORD) },
  });

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  // No natural unique key on SuggestCard — only seed the starter set once,
  // on a database that has none yet, so re-running this script never
  // duplicates or clobbers cards an admin has since created/edited.
  const suggestCardCount = await prisma.suggestCard.count();
  if (suggestCardCount === 0) {
    await prisma.suggestCard.createMany({
      data: SUGGEST_CARDS.map((c) => ({ ...c, addedBy: admin.id })),
    });
  }

  console.log(`Seeded ${AIMAGS.length} aimags, ${CATEGORIES.length} categories, 1 admin user, site settings, ${suggestCardCount === 0 ? SUGGEST_CARDS.length : 0} suggest cards.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
