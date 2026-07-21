// Seeds Aimag + Category with the same real-world data already used on the
// frontend (src/screens/bigbang/data.ts — AIMAGS/AIMAG_BG/CATS), so the two
// sides agree on names/slugs instead of drifting apart. No image/backgroundImage
// is seeded — those stay null until a host/admin uploads a real photo through
// the app (Cloudinary), so the frontend falls back to its placeholder graphic
// instead of showing stock imagery nobody actually uploaded.
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

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
    subs: ['Спа / сауна', 'Йог / бясалгал', 'Массаж', 'Уламжлалт эмчилгээ', 'Орон зай түрээс'] },
  { slug: 'ayalal', name: 'Аялал & Байгаль', nameEn: 'Travel & Nature',
    subs: ['Морин аялал', 'Нохой чарга', 'Явган аялал', 'Glamping', 'Од ажиглах', 'Рашаан', 'Усан спорт', 'Завь'] },
  { slug: 'hool', name: 'Хоол & Ундаа', nameEn: 'Food & Drinks',
    subs: ['Speakeasy бар', 'Дээвэр лоунж', "Chef's table", 'Гэрийн зоог', 'Supper club', 'Дарс таних'] },
  { slug: 'zugaa', name: 'Зугаа цэнгэл', nameEn: 'Entertainment',
    subs: ['Escape room', 'Board game кафе', 'VR arcade', 'Боулинг', 'Бильярд', 'Дартс бар', 'KTV', 'Муурны кафе', 'Шатрын кафе'] },
  { slug: 'soyol', name: 'Соёл & Урлаг', nameEn: 'Culture & Arts',
    subs: ['Андеграунд концерт', 'Амьд жаз', 'Open mic', 'Drive-in кино', 'Морин хуур / хөөмий', 'DJ үдэш', 'Зурагчийн студи', 'Галерей'] },
  { slug: 'horizon', name: 'Горизон', nameEn: 'Horizon',
    subs: ['Science cafe', 'Одон дурандах төв', 'Планетари', 'Шинжлэх ухааны лекц', 'Сансрын ажиглалт', 'Лаборатори тур'] },
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

  await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: { role: 'admin' },
    create: { email: SEED_ADMIN_EMAIL, username: 'admin', role: 'admin', password: await hashPassword(SEED_ADMIN_PASSWORD) },
  });

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  console.log(`Seeded ${AIMAGS.length} aimags, ${CATEGORIES.length} categories, 1 admin user, site settings.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
