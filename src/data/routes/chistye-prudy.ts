import type { Route } from '../types';

export const chistyePrudyRoute: Route = {
  id: 'chistye-prudy',
  title: 'Чистые пруды',
  subtitle: 'Прогулка по бульвару от Грибоедова до Меньшиковой башни',
  description:
    'Маленький круг по самому уютному бульвару Москвы — с историями про то, как из «Поганых» прудов сделали Чистые, кто рисовал зверей на доме номер 14, и почему «Современник» когда-то назывался «Колизеем».',
  distanceMeters: 1500,
  durationMinutes: 50,
  startHint: 'От метро «Чистые пруды», у памятника Грибоедову',
  pois: [
    {
      id: 'griboedov',
      title: 'Памятник А.С. Грибоедову',
      tag: 'Памятник · 1959',
      coords: [55.7626, 37.639],
      paragraphs: [
        'Заглушка для проверки макета. Настоящий текст появится после ресёрча.',
      ],
      facts: [],
    },
    {
      id: 'menshikova-tower',
      title: 'Меньшикова башня',
      tag: 'Архитектура · XVIII век',
      coords: [55.7651, 37.6363],
      paragraphs: ['Заглушка.'],
      facts: [],
    },
    {
      id: 'house-with-animals',
      title: 'Дом со зверями',
      tag: 'Архитектура · 1908',
      coords: [55.7637, 37.6447],
      paragraphs: ['Заглушка.'],
      facts: [],
    },
    {
      id: 'sovremennik',
      title: 'Театр «Современник»',
      tag: 'Архитектура · 1914',
      coords: [55.7634, 37.6411],
      paragraphs: ['Заглушка.'],
      facts: [],
    },
    {
      id: 'pond',
      title: 'Сами Чистые пруды',
      tag: 'Место · XV–XVIII век',
      coords: [55.7635, 37.6428],
      paragraphs: ['Заглушка.'],
      facts: [],
    },
    {
      id: 'abay',
      title: 'Памятник Абаю Кунанбаеву',
      tag: 'Памятник · 2006',
      coords: [55.7634, 37.6403],
      paragraphs: ['Заглушка.'],
      facts: [],
    },
    {
      id: 'perlov',
      title: 'Чайный дом Перлова',
      tag: 'Архитектура · 1893',
      coords: [55.7654, 37.6378],
      paragraphs: ['Заглушка.'],
      facts: [],
    },
  ],
};
