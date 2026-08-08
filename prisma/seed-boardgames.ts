/**
 * Replaces the "Гэр бүлээрээ тоглох board game" (slug `boardgame`) suggest
 * collection with 12 titles, each linking to its BoardGameGeek page. Run once
 * with `bun run seed:boardgames`. Replacing the collection (and what that
 * deletes) is handled by ./replace-suggest-collection.
 *
 * The BGG ids were confirmed one at a time rather than derived from the name —
 * several of these have same-titled siblings (there are five different games
 * called Moonshine) and a wrong id links to an entirely different game.
 *
 * Cover art is BGG's own wide header banner, hotlinked rather than uploaded to
 * Cloudinary — imgUrl() passes an absolute http(s) URL straight through (see
 * components/bigbang/data.ts). The wide banner is deliberate: it matches the
 * card's landscape shape, where the portrait box-art image BGG also offers
 * would be cropped to pieces.
 *
 * Specifically the banner's `large` variant (fit-in/1024x1024, no_upscale), not
 * the 800x450 one the game endpoint hands out — that one bakes `quality(30)`
 * into its signed URL, so it can't be sharpened by editing the address, and it
 * looked it. Same picture, 2-8x the bytes. Reached by taking the pic id out of
 * the game's topimageurl and asking api.geekdo.com/api/images/<picid> for it.
 */
import { prisma } from '../lib/prisma';
import { replaceSuggestCollection, type SuggestItem } from './replace-suggest-collection';

const COLLECTION_SLUG = 'boardgame';

const bgg = (id: number, slug: string) => `https://boardgamegeek.com/boardgame/${id}/${slug}`;

const BOARD_GAMES: SuggestItem[] = [
  {
    name: 'UNO',
    description: 'Өнгө, тоогоо тааруулж картаа эхэлж дуусга — "Uno" гэж хэлэхээ бүү мартаарай',
    link: bgg(2223, 'uno'),
    image: 'https://cf.geekdo-images.com/C3AF2YuatLrpxoAHiQ5U5w__large/img/GcrKMyzJcNr2tPCRbmjfxuoyDP4=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic214248.jpg',
  },
  {
    name: 'Catan',
    description: 'Арал дээр суурьшиж, нөөцөө солилцон зам, хот босгодог сонгодог тоглоом',
    link: bgg(13, 'catan'),
    image: 'https://cf.geekdo-images.com/4Zr2B1zIgCM9qZfKhZoisQ__large/img/Ax9gbBD_Ce6xgNRKWv7LFLC_Ssw=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic133885.jpg',
  },
  {
    name: 'Looot',
    description: 'Викингүүдээ илгээж нөөц булаан авч, фьордоо бүтээх орон зайн оньсого',
    link: bgg(410991, 'looot'),
    image: 'https://cf.geekdo-images.com/NeTuKDelF3mP6R8XFrOdRw__large/img/BlLO2V9p4wvjSUri-nQMHt0sCBo=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic8401800.jpg',
  },
  {
    name: 'Marco Polo II: In the Service of the Khan',
    description: 'Торгоны замаар аялж, хааны алба гүйцэтгэн худалдаагаа өргөжүүл',
    link: bgg(283948, 'marco-polo-ii-in-the-service-of-the-khan'),
    image: 'https://cf.geekdo-images.com/EY4UcT2pQqxeS_X76FPDRQ__large/img/F3v9QRyyFdX921WE0pt8La7xCRk=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic4970012.jpg',
  },
  {
    name: 'Skara Brae',
    description: 'Неолитын Шотландын суурин — нөөцөө хуваарилж, ард түмнээ хоолж орон байраар хангa',
    link: bgg(408636, 'skara-brae'),
    image: 'https://cf.geekdo-images.com/jxvwlYw9uuW7tANqSzQAew__large/img/nrO-Yzs5J_O_pbKi4eRB7zvUNOc=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic8266496.png',
  },
  {
    name: 'Moonshine',
    description: 'Хоригийн үеийн нууц баараа өргөжүүлж, 12 нэр хүндийн оноог түрүүлж цуглуул',
    link: bgg(440843, 'moonshine'),
    image: 'https://cf.geekdo-images.com/wsP-aRgNMhkZgiHzwYhCcw__large/img/BYi-zQgYPs8SUaSJzc2_xJXqtO4=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic9138307.jpg',
  },
  {
    name: 'Exploding Kittens',
    description: 'Дэлбэрдэг муур сугалахаас зайлсхий — Skip, Nope, Shuffle картаараа найзаа тавь',
    link: bgg(172225, 'exploding-kittens'),
    image: 'https://cf.geekdo-images.com/itIQIBZ2jxI_JEHo_Ngu8w__large/img/bCraH4qi_AizHGYlSvpIhjeAFYI=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic2390331.png',
  },
  {
    name: 'Ticket to Ride',
    description: 'Төмөр замын маршрутаа холбож, хотуудыг хооронд нь залгах гэр бүлийн сонгодог',
    link: bgg(9209, 'ticket-to-ride'),
    image: 'https://cf.geekdo-images.com/U2eaeOCVGYFDhPgaIY6CmQ__large/img/6CxdJVky1rjIJvoQ8UgjXoo3TXM=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic38674.jpg',
  },
  {
    name: 'Carcassonne',
    description: 'Хавтангаа тавьж хот, зам, талбай байгуулаад газраа өөрийн болго',
    link: bgg(822, 'carcassonne'),
    image: 'https://cf.geekdo-images.com/rwhw-HHc4JPb6UiXNmoAvQ__large/img/7rsfBvMDKavWEhxCh1O9N3QdQ0M=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic517613.jpg',
  },
  {
    name: 'Codenames',
    description: 'Ганц үгээр сэжүүр өгч, багийнхандаа зөв агентуудаа таниулах үгийн тоглоом',
    link: bgg(178900, 'codenames'),
    image: 'https://cf.geekdo-images.com/-bGefxkmKuOSKinBGyCowg__large/img/RAbR-SQYGNCS1OFrkpZ3JxXR2BY=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic3473355.jpg',
  },
  {
    name: 'Azul',
    description: 'Өнгөт хавтангаа сонгон авч, ордны ханыг хамгийн сайхнаар нь чимэглэ',
    link: bgg(230802, 'azul'),
    image: 'https://cf.geekdo-images.com/zB_s21bFGCqUeMj0us7xwA__large/img/3jp0w94ohF1_UhbArTyhtPcoVuk=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic3721303.png',
  },
  {
    name: 'Dixit',
    description: 'Зурган карт руу сэжүүр хэл — хэт амархан ч биш, хэт хэцүү ч биш байх нь урлаг',
    link: bgg(39856, 'dixit'),
    image: 'https://cf.geekdo-images.com/4ifc-exz9EWwhNEagsZ60Q__large/img/jyVNV5QG8K8BYAOroa1zw2t2hw0=/fit-in/1024x1024/filters:no_upscale():strip_icc()/pic518540.jpg',
  },
];

replaceSuggestCollection(COLLECTION_SLUG, BOARD_GAMES).catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
