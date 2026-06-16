/* DiLibris — sample library data (plain JS, attaches to window) */
(function () {
  // Generative cover palettes — muted, literary, slightly desaturated
  const C = {
    plum:   { bg: '#5E4A63', ink: '#F4EEF1', rule: '#B59CBA' },
    forest: { bg: '#3D5244', ink: '#ECF1EB', rule: '#9DB69B' },
    rust:   { bg: '#9A5A41', ink: '#F8EFE8', rule: '#DEB199' },
    navy:   { bg: '#33455A', ink: '#E9EEF4', rule: '#9AAEC4' },
    mustard:{ bg: '#B68C39', ink: '#2C2410', rule: '#7C611C' },
    teal:   { bg: '#326562', ink: '#E7F0EF', rule: '#97C0BC' },
    clay:   { bg: '#A95E47', ink: '#F8EDE7', rule: '#E0A98F' },
    ink:    { bg: '#2E2D31', ink: '#EFEBE5', rule: '#928C84' },
    rose:   { bg: '#8F5060', ink: '#F6E9EC', rule: '#CFA0AD' },
    sage:   { bg: '#76825A', ink: '#F2F3E8', rule: '#BBC499' },
    cocoa:  { bg: '#5A4634', ink: '#F2E8DA', rule: '#BBA088' },
  };

  // statuses match brief copy exactly
  const STATUS = {
    want:    { key: 'want',    label: 'Хочу прочитати', cssVar: 'want' },
    reading: { key: 'reading', label: 'Читаю зараз',    cssVar: 'reading' },
    done:    { key: 'done',    label: 'Прочитано',      cssVar: 'done' },
    dnf:     { key: 'dnf',     label: 'Не дочитала',    cssVar: 'dnf' },
    reread:  { key: 'reread',  label: 'Перечитую',      cssVar: 'reread' },
  };

  let id = 0;
  const RTO = [1.46, 1.52, 1.58, 1.42, 1.55, 1.48, 1.6, 1.5];
  const SCL = [1, 0.96, 1.04, 0.94, 1, 1.02, 0.98, 1];
  const ART = ['split', 'band', 'arc', 'type', 'frame', 'band', 'split', 'arc'];
  const b = (o) => {
    const i = id++;
    return { id: 'bk' + id, pages: 320, ratio: RTO[i % RTO.length], scale: SCL[i % SCL.length], art: ART[i % ART.length], ...o };
  };

  const books = [
    b({ title: 'Тигролови', author: 'Іван Багряний', cover: C.forest, status: 'reading', progress: 64, rating: 4.5, pagesRead: 205, days: 11, minutes: 740, format: 'Паперова', placeholder: false }),
    b({ title: 'Польові дослідження', author: 'Оксана Забужко', cover: C.rose, status: 'reading', progress: 38, rating: 4, pagesRead: 122, days: 6, minutes: 410, format: 'Електронна' }),
    b({ title: 'Місто', author: 'Валер’ян Підмогильний', cover: C.mustard, status: 'reading', progress: 80, rating: 5, pagesRead: 256, days: 14, minutes: 980, format: 'Паперова' }),
    b({ title: 'Кобзар', author: 'Тарас Шевченко', cover: C.cocoa, status: 'reading', progress: 22, rating: 5, pagesRead: 70, days: 4, minutes: 210, format: 'Паперова', placeholder: true, pages: 704 }),
    b({ title: 'Фелікс Австрія', author: 'Софія Андрухович', cover: C.rose, status: 'reading', progress: 51, rating: 4, pagesRead: 144, days: 7, minutes: 520, format: 'Паперова', pages: 288 }),
    b({ title: 'Доця', author: 'Горіха Зерня', cover: C.ink, status: 'reading', progress: 12, rating: 0, pagesRead: 40, days: 2, minutes: 95, format: 'Електронна', pages: 336 }),

    b({ title: 'Лісова пісня', author: 'Леся Українка', cover: C.teal, status: 'done', progress: 100, rating: 5, pagesRead: 180, days: 5, minutes: 320, format: 'Паперова' }),
    b({ title: 'Маруся Чурай', author: 'Ліна Костенко', cover: C.plum, status: 'done', progress: 100, rating: 4.5, pagesRead: 224, days: 8, minutes: 460, format: 'Електронна' }),
    b({ title: 'Інтернат', author: 'Сергій Жадан', cover: C.ink, status: 'done', progress: 100, rating: 4, pagesRead: 336, days: 12, minutes: 690, format: 'Паперова' }),
    b({ title: 'Записки українського самашедшого', author: 'Ліна Костенко', cover: C.clay, status: 'done', progress: 100, rating: 4, pagesRead: 416, days: 19, minutes: 1120, format: 'Паперова' }),
    b({ title: 'Солодка Даруся', author: 'Марія Матіос', cover: C.rust, status: 'done', progress: 100, rating: 5, pagesRead: 188, days: 6, minutes: 350, format: 'Паперова', pages: 188 }),
    b({ title: 'Ворошиловград', author: 'Сергій Жадан', cover: C.teal, status: 'done', progress: 100, rating: 4.5, pagesRead: 442, days: 16, minutes: 940, format: 'Паперова', pages: 442 }),
    b({ title: 'Музей покинутих секретів', author: 'Оксана Забужко', cover: C.plum, status: 'done', progress: 100, rating: 5, pagesRead: 832, days: 31, minutes: 2100, format: 'Паперова', pages: 832 }),
    b({ title: 'Земля', author: 'Ольга Кобилянська', cover: C.cocoa, status: 'done', progress: 100, rating: 4, pagesRead: 352, days: 12, minutes: 700, format: 'Паперова', pages: 352 }),
    b({ title: 'Камінний хрест', author: 'Василь Стефаник', cover: C.ink, status: 'done', progress: 100, rating: 4.5, pagesRead: 160, days: 4, minutes: 260, format: 'Паперова', pages: 160 }),
    b({ title: 'Майже ніколи не навпаки', author: 'Марія Матіос', cover: C.rust, status: 'done', progress: 100, rating: 4.5, pagesRead: 176, days: 5, minutes: 300, format: 'Електронна', pages: 176 }),
    b({ title: 'Дім для Дома', author: 'Вікторія Амеліна', cover: C.sage, status: 'done', progress: 100, rating: 4, pagesRead: 384, days: 13, minutes: 720, format: 'Паперова', pages: 384 }),
    b({ title: 'Московіада', author: 'Юрій Андрухович', cover: C.navy, status: 'done', progress: 100, rating: 4, pagesRead: 256, days: 9, minutes: 480, format: 'Паперова', pages: 256 }),

    b({ title: 'Хіба ревуть воли', author: 'Панас Мирний', cover: C.sage, status: 'want', progress: 0, rating: 0, pagesRead: 0, days: 0, minutes: 0, format: 'Паперова' }),
    b({ title: 'Чорна рада', author: 'Пантелеймон Куліш', cover: C.navy, status: 'want', progress: 0, rating: 0, pagesRead: 0, days: 0, minutes: 0, format: 'Електронна' }),
    b({ title: 'Тіні забутих предків', author: 'Михайло Коцюбинський', cover: C.forest, status: 'want', progress: 0, rating: 0, pagesRead: 0, days: 0, minutes: 0, format: 'Паперова', placeholder: true, pages: 224 }),
    b({ title: 'Кайдашева сім’я', author: 'Іван Нечуй-Левицький', cover: C.mustard, status: 'want', progress: 0, rating: 0, pagesRead: 0, days: 0, minutes: 0, format: 'Паперова', pages: 280 }),
    b({ title: 'Захар Беркут', author: 'Іван Франко', cover: C.forest, status: 'want', progress: 0, rating: 0, pagesRead: 0, days: 0, minutes: 0, format: 'Паперова', pages: 304 }),
    b({ title: 'Сад Гетсиманський', author: 'Іван Багряний', cover: C.clay, status: 'want', progress: 0, rating: 0, pagesRead: 0, days: 0, minutes: 0, format: 'Паперова', pages: 548 }),
    b({ title: 'Амадока', author: 'Софія Андрухович', cover: C.plum, status: 'want', progress: 0, rating: 0, pagesRead: 0, days: 0, minutes: 0, format: 'Паперова', pages: 832 }),
    b({ title: 'Я (Романтика)', author: 'Микола Хвильовий', cover: C.ink, status: 'want', progress: 0, rating: 0, pagesRead: 0, days: 0, minutes: 0, format: 'Електронна', pages: 144 }),

    b({ title: 'Депеш Мод', author: 'Сергій Жадан', cover: C.rust, status: 'reread', progress: 45, rating: 4.5, pagesRead: 130, days: 3, minutes: 180, format: 'Паперова', pages: 230 }),
    b({ title: 'Енеїда', author: 'Іван Котляревський', cover: C.mustard, status: 'reread', progress: 70, rating: 5, pagesRead: 258, days: 9, minutes: 540, format: 'Паперова', pages: 368 }),
    b({ title: 'Тореадори з Васюківки', author: 'Всеволод Нестайко', cover: C.sage, status: 'reread', progress: 28, rating: 5, pagesRead: 130, days: 4, minutes: 220, format: 'Паперова', pages: 464 }),
    b({ title: 'Перехресні стежки', author: 'Іван Франко', cover: C.navy, status: 'reread', progress: 55, rating: 4.5, pagesRead: 238, days: 8, minutes: 470, format: 'Електронна', pages: 432 }),
  ];

  const byStatus = (s) => books.filter((x) => x.status === s).map((x) => x.id);

  // Shelves are user-created furniture; each MAY map to a status.
  const shelves = [
    { id: 'sh1', label: 'Читаю зараз', status: 'reading', bookIds: byStatus('reading') },
    { id: 'sh2', label: 'Прочитано',   status: 'done',    bookIds: byStatus('done') },
    { id: 'sh3', label: 'Хочу прочитати', status: 'want', bookIds: byStatus('want') },
    { id: 'sh4', label: 'Знову на серце', status: 'reread', bookIds: byStatus('reread') },
    { id: 'sh5', label: 'Подаровані', status: null, bookIds: [] }, // empty shelf demo
  ];

  // notes / sessions for the detail card demo (keyed to first reading book)
  const notes = {
    bk1: [
      { id: 'n1', type: 'Цитата', vis: 'Публічна', text: '«Воля! Воля! Воля!» — і степ, і небо, і та воля, що в грудях.' },
      { id: 'n2', type: 'Думка', vis: 'Особиста', text: 'Григорій тікає не від когось, а до себе. Дуже сучасно як на 1944-й.' },
    ],
    bk3: [
      { id: 'n3', type: 'Думка', vis: 'Публічна', text: 'Підмогильний пише місто як живу істоту — воно дихає, спокушає й зраджує.' },
      { id: 'n4', type: 'Цитата', vis: 'Особиста', text: '«Степан ішов здобувати місто» — а виходить, що місто здобуло його.' },
    ],
    bk7: [
      { id: 'n5', type: 'Цитата', vis: 'Публічна', text: '«Не зневажай душі своєї цвіту» — рядок, який хочеться вишити на стіні.' },
    ],
    bk11: [
      { id: 'n6', type: 'Думка', vis: 'Особиста', text: 'Матіос вміє так стиснути біль у кілька речень, що аж дихати важко.' },
      { id: 'n7', type: 'Загальна', vis: 'Особиста', text: 'Перечитати навесні — здається, тоді зайде інакше.' },
    ],
    bk13: [
      { id: 'n8', type: 'Цитата', vis: 'Публічна', text: '«Кожна людина — це таємниця, яку не варто поспішати розгадувати».' },
    ],
  };
  const sessions = {
    bk1: [
      { id: 's1', date: '8 чер', pages: 24, minutes: 55, note: 'Перевал, ніч у лісі' },
      { id: 's2', date: '6 чер', pages: 31, minutes: 70, note: '' },
      { id: 's3', date: '3 чер', pages: 18, minutes: 40, note: 'Перша зустріч з Наталкою' },
    ],
    bk3: [
      { id: 's4', date: '9 чер', pages: 28, minutes: 60, note: '' },
      { id: 's5', date: '7 чер', pages: 22, minutes: 50, note: 'Степан у редакції' },
    ],
  };

  window.DILIBRIS = { books, shelves, STATUS, notes, sessions, palettes: C };
})();
