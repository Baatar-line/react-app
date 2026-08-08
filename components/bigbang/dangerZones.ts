// Traveller safety layer: which aimags carry which wildlife hazard.
//
// Zones by aimag, not points. Two reasons, and both matter:
//
//   - Occurrence records (GBIF has 49 wolf sightings for the whole country)
//     describe where a researcher stood, not where an animal lives. Drawing
//     those 49 dots would tell a traveller that wolves are in 49 places and
//     nowhere else, which is the opposite of true.
//   - Publishing precise locations of rare animals is a poaching risk. Snow
//     leopard and mazaalai are deliberately absent from this file: neither has
//     a record of attacking people in Mongolia, so they do not belong in a
//     danger layer at all, and pinning them on a public map would do harm for
//     no safety benefit.
//
// What this is really about is the hazards that actually injure travellers
// here — and the two most serious ones are not predators. Marmot-borne plague
// is diagnosed in Mongolia most years, and tick-borne encephalitis runs
// through the northern forest every spring.
//
// The aimag lists are a starting proposal assembled from general range
// knowledge, NOT from an authoritative dataset. They need checking against the
// Mongolian Red Book / NCDC advisories before anyone relies on them. Rendering
// treats this as guidance, not fact.

export interface DangerZone {
  key: string;
  /** Shown on the toggle and the legend. */
  label: string;
  /** Aimag names exactly as they appear in mn-aimags.json / the Aimag table. */
  aimags: string[];
  color: string;
  /** One line a traveller can act on. */
  advice: string;
  /** Months the hazard is worth worrying about, if it is seasonal. */
  season?: string;
}

const ALL_AIMAGS = [
  'Улаанбаатар', 'Архангай', 'Баян-Өлгий', 'Баянхонгор', 'Булган', 'Говь-Алтай',
  'Говьсүмбэр', 'Дархан-Уул', 'Дорноговь', 'Дорнод', 'Дундговь', 'Завхан',
  'Орхон', 'Өвөрхангай', 'Өмнөговь', 'Сүхбаатар', 'Сэлэнгэ', 'Төв', 'Увс',
  'Ховд', 'Хөвсгөл', 'Хэнтий',
];

export const DANGER_ZONES: DangerZone[] = [
  {
    key: 'plague',
    label: 'Тарвага — тахлын эрсдэл',
    // Listed first because it is the hazard most likely to actually kill a
    // traveller here, and the one most often not taken seriously.
    aimags: ['Баян-Өлгий', 'Ховд', 'Увс', 'Завхан', 'Говь-Алтай', 'Баянхонгор', 'Сүхбаатар', 'Дорнод', 'Хөвсгөл'],
    color: '#FF4D4D',
    advice: 'Тарвага бүү бариарай, бүү идээрэй. Боовормол тахал жил бүр бүртгэгддэг.',
    season: '5–9 сар',
  },
  {
    key: 'tick',
    label: 'Хачиг — тархины үрэвсэл',
    aimags: ['Сэлэнгэ', 'Булган', 'Хөвсгөл', 'Төв', 'Дархан-Уул', 'Орхон', 'Хэнтий'],
    color: '#FF8A3D',
    // Worded harder than the others on purpose. Mongolia carries both the
    // Siberian subtype (6-8% case fatality) and the Far-Eastern one (20-40%),
    // and a published case series found 28.6% mortality in Bulgan — a
    // hospitalised-cases figure, so not the rate across all infections, but
    // nowhere near the "mild European tick illness" this is often assumed to
    // be. The vaccine is the only protection that actually works; checking for
    // ticks reduces exposure but does not make it safe.
    advice: 'Вакцин хийлгээрэй — үхэлд хүргэж болзошгүй. Ойд урт ханцуйтай яваарай, өдөрт хоёр удаа хачиг шалгаарай.',
    season: '4–7 сар',
  },
  {
    key: 'bear',
    label: 'Хүрэн баавгай',
    aimags: ['Хөвсгөл', 'Хэнтий', 'Булган', 'Сэлэнгэ', 'Архангай', 'Завхан', 'Баян-Өлгий', 'Ховд', 'Увс'],
    color: '#C77DFF',
    advice: 'Ойд ганцаараа бүү яваарай. Хоол хүнсээ майхнаас хол, өндөрт хадгалаарай.',
  },
  {
    key: 'wolf',
    label: 'Чоно',
    // Nationwide, and that is the point: a wolf layer covering seven aimags
    // would imply the rest are wolf-free.
    aimags: ALL_AIMAGS,
    color: '#8AB4F8',
    advice: 'Хүн рүү дайрах нь ховор. Шөнө ганцаараа бүү яваарай, малын хашаанаас хол буудаллаарай.',
  },
  {
    key: 'boar',
    label: 'Зэрлэг гахай',
    aimags: ['Хэнтий', 'Хөвсгөл', 'Булган', 'Сэлэнгэ', 'Төв', 'Архангай', 'Дорнод'],
    color: '#FFD23F',
    advice: 'Зулзагатай эм нь хамгийн аюултай. Ойн зах, голын татам дагуу болгоомжтой.',
  },
  {
    key: 'snake',
    label: 'Хорт могой',
    aimags: ['Дорноговь', 'Өмнөговь', 'Дундговь', 'Говь-Алтай', 'Баянхонгор', 'Сүхбаатар', 'Дорнод', 'Говьсүмбэр'],
    color: '#5BE37A',
    advice: 'Чулуу, хонхорхой руу гараа бүү хийгээрэй. Өндөр түрийтэй гутал өмсөөрэй.',
    season: '5–9 сар',
  },
];
