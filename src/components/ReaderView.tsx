import { useCallback, useEffect, useRef, useState } from 'react';
import { formatAuthors } from '../lib/labels';
import { useIsMobile } from '../hooks/useIsMobile';
import type { UserBookEntry } from '../types/database';

const READER_PROSE = [
  'Вечір опускався на місто повільно, наче хтось притишував світло долонею. Вона відклала ложку, прислухалась до того, як унизу хтось наспівує, і подумала, що тиша теж буває різна.',
  'Дорога вела попід горою, і кожен крок віддавав у грудях глухим стуком. Він не поспішав. Поспіх — це коли тікаєш; а він просто йшов туди, де його ще пам\'ятали.',
  'У кімнаті пахло яблуками й старим папером. Книжки стояли так щільно, що між ними не пролізла б і думка, та все одно знаходилося місце для ще однієї.',
  'Зранку випав перший сніг, тонкий, як цукрова пудра. Діти вибігли надвір без шапок, і матері кричали їм услід щось ласкаве й безнадійне.',
  'Лист лежав на столі три дні. Вона знала кожне слово напам\'ять, ще не розгорнувши конверта, — так буває, коли довго на щось чекаєш і боїшся водночас.',
  'Поїзд рушив без попередження, м\'яко, ніби й не їхав, а лише місто почало відсуватися назад. За вікном пропливали садки, паркани, чиєсь життя, в яке вже не зайти.',
  'Старий мовчав довго, потім сказав тільки: «Море нічого не забирає назад». І більше про це не говорили — кожен залишився при своєму морі.',
  'Кав\'ярня на розі відчинялася о сьомій. До восьмої тут було тихо, як у бібліотеці, і саме за цю годину він платив усім своїм ранкам.',
];

const TOTAL = 14;

function pagesFor(totalPages: number) {
  return Math.max(1, Math.round(totalPages / TOTAL));
}

interface ReaderViewProps {
  entry: UserBookEntry;
  onClose: () => void;
  onFinish: (payload: { minutes: number; pages: number }) => void;
}

export function ReaderView({ entry, onClose, onFinish }: ReaderViewProps) {
  const mobile = useIsMobile();
  const book = entry.book;
  const totalPages = entry.total_pages ?? book?.page_count ?? 320;
  const progressPct =
    totalPages > 0 ? Math.min(100, Math.round((entry.current_page / totalPages) * 100)) : 0;
  const startScreen = Math.min(TOTAL - 1, Math.floor((progressPct / 100) * TOTAL));

  const [screen, setScreen] = useState(startScreen);
  const [maxReached, setMaxReached] = useState(startScreen);
  const [fs, setFs] = useState(mobile ? 1.12 : 1.22);
  const startRef = useRef(Date.now());
  const perScreen = pagesFor(totalPages);

  const go = useCallback((d: number) => {
    setScreen((s) => {
      const n = Math.max(0, Math.min(TOTAL - 1, s + d));
      setMaxReached((m) => Math.max(m, n));
      return n;
    });
  }, []);

  const finish = useCallback(() => {
    const minutes = Math.max(1, Math.round((Date.now() - startRef.current) / 60000));
    const screensRead = Math.max(0, maxReached - startScreen);
    const pages = screensRead * perScreen;
    onFinish({ minutes, pages });
    onClose();
  }, [maxReached, onClose, onFinish, perScreen, startScreen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish, go]);

  const paras = Array.from({ length: 3 }, (_, i) => READER_PROSE[(screen * 3 + i) % READER_PROSE.length]);
  const pageNum = (screen + 1) * perScreen;
  const progress = Math.round(((screen + 1) / TOTAL) * 100);

  return (
    <div className="reader-view">
      <header className="reader-top">
        <button type="button" className="dl-ghost" onClick={finish}>
          ‹ Назад
        </button>
        <div className="reader-top-center">
          <div className="reader-title">{book?.title ?? 'Книга'}</div>
          <div className="reader-author">{formatAuthors(book?.authors)}</div>
        </div>
        <div className="reader-font-btns">
          <button type="button" className="dl-close" onClick={() => setFs((v) => Math.max(0.9, v - 0.08))}>
            A−
          </button>
          <button type="button" className="dl-close" onClick={() => setFs((v) => Math.min(1.6, v + 0.08))}>
            A+
          </button>
        </div>
      </header>

      <div className="reader-page">
        <div className="reader-page-inner">
          <div className="reader-chapter">Розділ {Math.floor(screen / 4) + 1}</div>
          {paras.map((p, i) => (
            <p key={i} className="reader-prose" style={{ fontSize: `${fs}rem` }}>
              {p}
            </p>
          ))}
        </div>
      </div>

      <button type="button" className="reader-tap reader-tap--left" aria-label="Попередня" onClick={() => go(-1)} />
      <button type="button" className="reader-tap reader-tap--right" aria-label="Наступна" onClick={() => go(1)} />

      <footer className="reader-foot">
        <button type="button" className="dl-ghost" disabled={screen === 0} onClick={() => go(-1)}>
          ‹
        </button>
        <div className="reader-progress-wrap">
          <div className="reader-progress-track">
            <div className="reader-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="reader-progress-labels">
            <span>
              с. {Math.min(pageNum, totalPages)} з {totalPages}
            </span>
            <span>{progress}%</span>
          </div>
        </div>
        <button type="button" className="dl-ghost" disabled={screen === TOTAL - 1} onClick={() => go(1)}>
          ›
        </button>
      </footer>
    </div>
  );
}
