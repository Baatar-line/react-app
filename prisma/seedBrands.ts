// One-off content seed for Brand — the admin panel's "Брэндийн сурталчилгаа"
// tab was empty ("Одоогоор брэнд алга"), so the public Suggest page's brand
// rail (gated by V.brands.length > 0, see app/(bigbang)/suggest/page.tsx)
// never rendered. Adds 15 mock partner brands. Names are fictional (not real
// companies) since these render as "Atlas-ийн хамтрагч брэндүүд" — inventing
// names avoids implying a false real-world partnership or using a real
// company's trademarked logo. `logo` is left unset on purpose so the card
// falls back to its existing first-letter-avatar UI instead of needing a
// fabricated logo per brand. `image` values are full Wikimedia Commons URLs
// (verified to resolve) — bare Unsplash-style ids don't render for this app
// anymore (see U()/imgUrl() in components/bigbang/data.ts, the unsplash-id
// expansion is disabled and always falls back to a placeholder). `link`
// points at a real, relevant internal route (a category or suggest-collection
// page) rather than an external URL, since these aren't real companies with
// real websites.
import { prisma } from '../lib/prisma';

const SEED_ADMIN_EMAIL = 'admin@bigbang.mn';

const WM = (file: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1200`;

const BRANDS: { name: string; category: string; image: string; link: string }[] = [
  { name: 'Altai Gear', category: 'Спорт хэрэглэл', image: 'Woman lifting dumbbells in a modern gym during a workout session focused on strength training and fitness.jpg', link: '/category/activities' },
  { name: 'peak9 Спорт', category: 'Спорт хэрэглэл', image: 'Outdoor rock climbing 150709-F-WT808-259.jpg', link: '/category/activities' },
  { name: 'Steppe Runner', category: 'Спорт хэрэглэл', image: 'Runners celebrate after finishing a race in a city street during a summer event.jpg', link: '/category/activities' },
  { name: 'IronYak Fitness', category: 'Спорт хэрэглэл', image: "Group Hiking on Munch's Coulee National Hiking Trail (5220995838).jpg", link: '/category/activities' },
  { name: 'Board & Batar', category: 'Ширээний тоглоом', image: 'Chess game in a cozy living room with a wooden board and blurred decor.jpg', link: '/suggest/boardgame' },
  { name: 'Tavan Tug Games', category: 'Ширээний тоглоом', image: 'Table Taft Board Game Café interior.jpg', link: '/suggest/boardgame' },
  { name: "Khan's Table", category: 'Ширээний тоглоом', image: 'Chess game in a cozy living room with a wooden board and blurred decor.jpg', link: '/suggest/boardgame' },
  { name: 'Nomad Reels', category: 'Кино, контент', image: '16 mm Film camera.JPG', link: '/suggest/movies' },
  { name: 'Orkhon Audio', category: 'Дуу хөгжмийн хэрэглэл', image: 'Recording-Studio-In-Atlanta-Studio-A-Best-1030x535.jpg', link: '/suggest' },
  { name: 'Deel & Co', category: 'Хувцас загвар', image: 'DFC 1570, a woman shopping for clothes at an outdoor market - Flickr - PattayaPatrol.jpg', link: '/suggest' },
  { name: 'Nutag Beauty', category: 'Гоо сайхан', image: 'Couple walks by a clear pool in a resort wearing bathrobes and preparing for a relaxing day at the spa.jpg', link: '/category/relaxation' },
  { name: 'Tengri Roast', category: 'Кофе, ундаа', image: 'Macro close up look of roasted coffee beans.jpg', link: '/category/food' },
  { name: 'Orkhon Tech', category: 'Технологи', image: 'Laptop on a desk (Unsplash).jpg', link: '/suggest' },
  { name: 'GerCamp Supply', category: 'Кемп хэрэглэл', image: 'Steppe Nomads Eco Camp.jpg', link: '/category/activities' },
  { name: 'SkyBridge Travel Gear', category: 'Аялалын хэрэглэл', image: "Group Hiking on Munch's Coulee National Hiking Trail (5220995838).jpg", link: '/category/activities' },
];

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
  if (!admin) throw new Error('Seed admin not found — run `prisma/seed.ts` first.');

  const seeded = await prisma.brand.findFirst({ where: { name: BRANDS[0].name } });
  if (!seeded) {
    await prisma.brand.createMany({
      data: BRANDS.map((b) => ({
        name: b.name, category: b.category,
        image: WM(b.image), link: b.link,
        addedBy: admin.id,
      })),
    });
  }

  console.log(`Seeded ${seeded ? 0 : BRANDS.length} brands.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
