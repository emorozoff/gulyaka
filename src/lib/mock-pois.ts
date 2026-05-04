/**
 * MOCK POI fixture — used during UI development before the real content
 * pipeline runs. Replace with Supabase-backed data once `pnpm content:fetch`
 * + content writing produce real POIs.
 *
 * Coordinates are approximate (~10m precision). Photographs use inline SVG
 * placeholders so the UI works offline and in the sandbox.
 *
 * Texts are short demo content — accurate to the best of training-time
 * knowledge but NOT a substitute for the real Stage 3 sub-agent output.
 */

import type { POIType, POIRow } from "@/lib/supabase/types";

export type MockPOI = Omit<POIRow, "geom" | "created_at" | "updated_at"> & {
  lng: number;
  lat: number;
};

const PALETTE: Record<POIType, [string, string]> = {
  monument: ["#7a4324", "#c98a64"],
  church: ["#3a4f5e", "#8aa6b6"],
  mansion: ["#5a3b6c", "#a584b8"],
  soviet: ["#6e3b3b", "#b27575"],
  modernism: ["#2f4d4a", "#7ba29d"],
  building: ["#a8442a", "#d56644"],
  bridge: ["#3b5a72", "#86a4bd"],
  park: ["#3d5a3a", "#85a37a"],
  other: ["#5a4f3b", "#a3937a"],
};

function placeholderImage(label: string, type: POIType): string {
  const [c1, c2] = PALETTE[type];
  const safeLabel = label.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' preserveAspectRatio='xMidYMid slice'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='${c1}'/>
        <stop offset='1' stop-color='${c2}'/>
      </linearGradient>
      <pattern id='p' width='40' height='40' patternUnits='userSpaceOnUse' patternTransform='rotate(35)'>
        <line x1='0' y1='0' x2='0' y2='40' stroke='rgba(255,255,255,0.04)' stroke-width='30'/>
      </pattern>
    </defs>
    <rect width='800' height='600' fill='url(#g)'/>
    <rect width='800' height='600' fill='url(#p)'/>
    <text x='40' y='540' font-family='Georgia, serif' font-size='34' fill='rgba(255,255,255,0.92)' font-style='italic'>${safeLabel}</text>
    <text x='40' y='576' font-family='system-ui, sans-serif' font-size='14' fill='rgba(255,255,255,0.6)' letter-spacing='3'>MOCK</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MOCK_POIS: MockPOI[] = [
  {
    id: "mock-menshikov-tower",
    slug: "menshikova-bashnya",
    name: "Меньшикова башня",
    address: "Архангельский переулок, 15А",
    lat: 55.7625,
    lng: 37.6378,
    type: "church",
    built_year: 1707,
    architect: "Иван Зарудный",
    short_blurb: "Выше Ивана Великого — и тут же сожжена молнией",
    long_text: `Меньшикова башня — церковь Архангела Гавриила, которую Александр Меншиков задумал в 1701 году как личную колокольню рядом со своим домом. Архитектор Иван Зарудный построил здание выше колокольни Ивана Великого в Кремле — такого Москва не видела с 16 века.

Победа была недолгой. В 1723 году в башню ударила молния, верхняя часть выгорела, а тридцать пудовых колоколов рухнули в трапезную. Меншиков к тому моменту уже был в опале, и башню так и не восстановил — до 1773-го она стояла обгорелым обрубком.

Восстановили её совсем в другой стилистике: вместо барочного шпиля появился сдержанный купол. Внутри сохранилась лепнина начала 18 века — редчайшая для Москвы петровская барочная скульптура с латинскими надписями.

Сегодня тут подворье Антиохийского патриархата, и на службе можно услышать арабский — единственное место такого рода в центре Москвы.`,
    fact_cards: [
      { title: "Год", body: "1707, перестроена 1773" },
      { title: "Архитектор", body: "Иван Зарудный" },
      { title: "Высота", body: "84,3 м — рекорд Москвы 1707-1731" },
    ],
    cover_image_url: placeholderImage("Меньшикова башня", "church"),
    cover_image_credit: "MOCK · placeholder",
    sources: {
      wikipedia_url: "https://ru.wikipedia.org/wiki/Меншикова_башня",
      wikidata_id: "Q1330554",
    },
    status: "published",
  },
  {
    id: "mock-sovremennik",
    slug: "teatr-sovremennik",
    name: "Театр «Современник»",
    address: "Чистопрудный бульвар, 19А",
    lat: 55.7626,
    lng: 37.6457,
    type: "building",
    built_year: 1914,
    architect: "Роман Клейн",
    short_blurb: "Бывший «Колизей» — первый московский кинотеатр в стиле классицизма",
    long_text: `В 1914 году архитектор Роман Клейн (тот самый, что построил ЦУМ и Музей изящных искусств) спроектировал на Чистопрудном бульваре кинотеатр в духе классицизма. Его назвали «Колизеем» — с колоннами, мраморными лестницами и зрительным залом на 1300 мест.

Звуковым он стал только в начале 1930-х. К тому времени Клейн уже умер, а его сложный фасад партийные комиссии каждые несколько лет грозились снести как «буржуазный».

В 1974 году в здание въехал театр «Современник», который до этого десять лет скитался по съёмным площадкам. Под Олега Ефремова и Галину Волчек сцену перестроили, но мраморные лестницы сохранили — на них до сих пор сидят зрители в антракте.`,
    fact_cards: [
      { title: "Год", body: "1914" },
      { title: "Архитектор", body: "Роман Клейн" },
      { title: "Бывшее имя", body: "Кинотеатр «Колизей»" },
    ],
    cover_image_url: placeholderImage("Театр «Современник»", "building"),
    cover_image_credit: "MOCK · placeholder",
    sources: {
      wikipedia_url: "https://ru.wikipedia.org/wiki/Современник_(театр)",
      wikidata_id: "Q1426881",
    },
    status: "published",
  },
  {
    id: "mock-perlov",
    slug: "chajnyj-dom-perlova",
    name: "Чайный дом Перлова",
    address: "Мясницкая, 19",
    lat: 55.7607,
    lng: 37.6336,
    type: "mansion",
    built_year: 1893,
    architect: "Карл Гиппиус",
    short_blurb: "Китайский фасад появился за полгода — чтобы понравиться Ли Хунчжану",
    long_text: `В 1893-м Сергей Перлов, наследник чайной империи, открыл на Мясницкой магазин с двумя верхними этажами доходного дома. Архитектор Карл Гиппиус сделал лаконичный фасад в стиле эклектики — ничего необычного.

Через три года в Москву на коронацию Николая II приехал китайский сановник Ли Хунчжан. Перлов и его двоюродный брат Сергей Васильевич Перлов соревновались за то, чтобы поселить китайца у себя — победителю достался бы выгодный контракт на поставку чая.

Сергей Перлов решил действовать наверняка: за полгода переделал фасад в «китайском» стиле — пагодные крыши, дракончики, зонтики. Ли Хунчжан в итоге остановился у его брата (тот был старшим), но магазин с тех пор всё равно стал главной чайной лавкой Москвы — и работает до сих пор.

Внутри сохранились кассовый зал с китайским декором и оригинальные чайницы 19 века.`,
    fact_cards: [
      { title: "Год", body: "1893, фасад 1896" },
      { title: "Архитектор", body: "Карл Гиппиус" },
      { title: "Стиль", body: "Эклектика с китайскими мотивами" },
    ],
    cover_image_url: placeholderImage("Чайный дом Перлова", "mansion"),
    cover_image_credit: "MOCK · placeholder",
    sources: {
      wikipedia_url: "https://ru.wikipedia.org/wiki/Чайный_дом_на_Мясницкой",
      wikidata_id: "Q4508165",
    },
    status: "published",
  },
  {
    id: "mock-house-with-beasts",
    slug: "dom-so-zveryami",
    name: "Дом со зверями",
    address: "Чистопрудный бульвар, 14",
    lat: 55.7635,
    lng: 37.6444,
    type: "building",
    built_year: 1909,
    architect: "Лев Кравецкий, Сергей Вашков",
    short_blurb: "Доходный дом церкви Троицы — фасад покрыт сказочными животными",
    long_text: `В 1908 году церковь Троицы на Грязех решила построить доходный дом — арендная плата шла на содержание прихода. Архитектор Лев Кравецкий сделал обычный пятиэтажный объём, но фасад поручили скульптору Сергею Вашкову, ученику Виктора Васнецова.

Вашков три года изучал владимиро-суздальскую белокаменную резьбу 12 века — Дмитриевский собор, Георгиевский в Юрьеве-Польском. Потом перенёс мотивы на четвёртый и пятый этаж: львы, грифоны, павлины, древо жизни. Это не цитата, а оригинальный бестиарий — такого нет нигде ни в Москве, ни в Петербурге.

Здание называют по-разному: «дом-сказка», «дом со зверями», «дом церкви Троицы». На бульварной стороне фриз идёт сплошной полосой почти на сорок метров — лучший вид с южной стороны бульвара днём, когда солнце подсвечивает рельеф сбоку.`,
    fact_cards: [
      { title: "Год", body: "1908-1909" },
      { title: "Скульптор", body: "Сергей Вашков" },
      { title: "Стиль", body: "Неорусский, мотивы 12 века" },
    ],
    cover_image_url: placeholderImage("Дом со зверями", "building"),
    cover_image_credit: "MOCK · placeholder",
    sources: {
      wikipedia_url:
        "https://ru.wikipedia.org/wiki/Доходный_дом_церкви_Троицы_на_Грязях",
      wikidata_id: "Q4174303",
    },
    status: "published",
  },
  {
    id: "mock-dom-komod",
    slug: "dom-komod",
    name: "Дом-комод",
    address: "Покровка, 22",
    lat: 55.7591,
    lng: 37.6469,
    type: "mansion",
    built_year: 1769,
    architect: "Неизвестен (круг Растрелли)",
    short_blurb: "Самый большой жилой дом 18 века в Москве — у Толстого это дом Ростовых",
    long_text: `Усадьба графов Апраксиных, построенная около 1769 года, единственная в Москве уцелевшая застройка такого размера в стиле растреллиевского барокко — пышного, с колоннами и лепниной, как в петербургских дворцах.

Народное прозвище «дом-комод» появилось из-за изогнутого плана: фасад идёт уступами, как ящики у комода. Снести его при Сталине хотели несколько раз — спасло то, что дом упоминается в «Войне и мире»: Лев Толстой описал именно его как московский дом семьи Ростовых.

В 1772 году Апраксины продали особняк Трубецким, в советское время здание сначала отдали под коммуналки, потом под школу. На втором этаже до сих пор работает 4-я гимназия имени Александра Невского.`,
    fact_cards: [
      { title: "Год", body: "≈1769" },
      { title: "Стиль", body: "Растреллиевское барокко" },
      { title: "Литература", body: "Дом Ростовых в «Войне и мире»" },
    ],
    cover_image_url: placeholderImage("Дом-комод", "mansion"),
    cover_image_credit: "MOCK · placeholder",
    sources: {
      wikipedia_url:
        "https://ru.wikipedia.org/wiki/Усадьба_Апраксиных_—_Трубецких",
      wikidata_id: "Q4477625",
    },
    status: "published",
  },
  {
    id: "mock-griboyedov",
    slug: "pamyatnik-griboyedovu",
    name: "Памятник Грибоедову",
    address: "Чистопрудный бульвар, у Мясницких ворот",
    lat: 55.7641,
    lng: 37.6374,
    type: "monument",
    built_year: 1959,
    architect: "Аполлон Мануилов, Александр Заварзин",
    short_blurb: "Установлен в 1959-м к 130-летию убийства поэта в Тегеране",
    long_text: `Памятник Александру Грибоедову появился в 1959 году — к 130-летию его убийства в Тегеране. Скульптор Аполлон Мануилов и архитектор Александр Заварзин выбрали место в начале Чистопрудного бульвара, у Мясницких ворот.

Грибоедов изображён в полный рост, у его ног рельеф с персонажами «Горя от ума»: Чацкий, Софья, Фамусов, Молчалин. Узнаваемые позы — скульптор хотел, чтобы школьник, проходящий мимо, мог проверить, кого изучали по программе.

Грибоедов жил неподалёку, в Мясницкой усадьбе Бегичевых (не сохранилась). Для Москвы это второй памятник дипломату-писателю — первый, у Никитских ворот, был утрачен ещё в 19 веке.`,
    fact_cards: [
      { title: "Год", body: "1959" },
      { title: "Скульптор", body: "Аполлон Мануилов" },
      { title: "Высота", body: "≈5 м с постаментом" },
    ],
    cover_image_url: placeholderImage("Памятник Грибоедову", "monument"),
    cover_image_credit: "MOCK · placeholder",
    sources: {
      wikipedia_url:
        "https://ru.wikipedia.org/wiki/Памятник_Грибоедову_(Москва)",
      wikidata_id: "Q4344108",
    },
    status: "published",
  },
];

export function findMockPOI(slug: string): MockPOI | undefined {
  return MOCK_POIS.find((p) => p.slug === slug);
}
