/**
 * Replaces the "2 хүний хурдан тоглоомууд" (slug `games`) suggest collection
 * with a hand-picked list of co-op titles, each linking to its Steam store
 * page. Run once with `bun run seed:coop-games`. Replacing the collection
 * (and what that deletes) is handled by ./replace-suggest-collection.
 *
 * Cover art is hotlinked from Steam's own CDN rather than uploaded to
 * Cloudinary — imgUrl() passes an absolute http(s) URL straight through (see
 * components/bigbang/data.ts). These URLs come from Steam's appdetails API,
 * and the ones with a hash segment are per-release assets: if a game ships a
 * new store banner its old URL can 404, at which point the card falls back to
 * the placeholder graphic and the image needs re-fetching or replacing by
 * hand in the admin panel.
 */
import { prisma } from '../lib/prisma';
import { replaceSuggestCollection, type SuggestItem } from './replace-suggest-collection';

const COLLECTION_SLUG = 'games';

const GAMES: SuggestItem[] = [
  {
    name: 'It Takes Two',
    description: 'Заавал хоёулаа тоглох адал явдал — Friend’s Pass-аар найз чинь үнэгүй нэгдэнэ',
    link: 'https://store.steampowered.com/app/1426210/It_Takes_Two/',
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1426210/header.jpg',
  },
  {
    name: 'Overcooked! All You Can Eat',
    description: 'Гал тогооны эмх замбараагүй байдлыг хамтдаа даван туулж, захиалгаа амжуул',
    link: 'https://store.steampowered.com/app/1243830/Overcooked_All_You_Can_Eat/',
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1243830/header.jpg',
  },
  {
    name: 'Party Animals',
    description: 'Гөлөг, зулзага болоод найзтайгаа наргиантай зодолдох party тоглоом',
    link: 'https://store.steampowered.com/app/1260320/Party_Animals/',
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1260320/8ecff3f10af08073061e46ad7001700e046200ce/header_alt_assets_9.jpg',
  },
  {
    name: 'Ultimate Chicken Horse',
    description: 'Талбайгаа өөрсдөө барьж, бие биенээ урхиддаг платформ тоглоом',
    link: 'https://store.steampowered.com/app/386940/Ultimate_Chicken_Horse/',
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/386940/header.jpg',
  },
  {
    name: 'Move or Die',
    description: '20 секунд тутамд дүрэм нь солигддог, нөхөрлөл сорьсон хурдан тоглоом',
    link: 'https://store.steampowered.com/app/323850/Move_or_Die/',
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/323850/header.jpg',
  },
  {
    name: 'Unrailed 2: Back on Track',
    description: 'Хамтдаа төмөр зам барьж, зогсдоггүй галт тэргээ урагш нь гүйлгэ',
    link: 'https://store.steampowered.com/app/2211170/Unrailed_2_Back_on_Track/',
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2211170/e13148cadb42b138b5edce3e475045d4870ec263/header_alt_assets_6.jpg',
  },
  {
    name: 'Bread & Fred',
    description: 'Уяатай хоёр оцон шувуу — үсрэлтээ тааруулж цасан оргилд хамт гарна',
    link: 'https://store.steampowered.com/app/1607680/Bread__Fred/',
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1607680/header.jpg',
  },
  {
    name: 'Pummel Party',
    description: 'Самбар дээр найзаа хөнөөж, нөхөрлөлөө сорих 4-8 хүний party тоглоом',
    link: 'https://store.steampowered.com/app/880940/Pummel_Party/',
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/880940/header.jpg',
  },
  {
    name: 'Garfield Kart - Furious Racing',
    description: 'Гарфилд болон найзуудтайгаа өрсөлдөх хөгжилтэй карт уралдаан',
    link: 'https://store.steampowered.com/app/1085510/Garfield_Kart__Furious_Racing/',
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1085510/b124a0dbf4fdc5b984268f92921f246ecba04c9c/header.jpg',
  },
  {
    name: 'Cat Chess',
    description: 'Муурнуудаар тоглох шатар — тайван мэт харагдаад тархи сорьдог',
    link: 'https://store.steampowered.com/app/4163030/Cat_Chess/',
    image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4163030/20c4d944cbe1e07e0fb0ba64950b96b453fd8923/header.jpg',
  },
];

replaceSuggestCollection(COLLECTION_SLUG, GAMES).catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
