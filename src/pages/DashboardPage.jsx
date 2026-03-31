import { useMemo } from 'react';
import { ArrowUpRight, Clock3, Flame, Sparkles, Target } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectNote } from '../features/notes/notesSlice';

function DashboardPage() {
  const { items } = useSelector((state) => state.notes);
  const { user } = useSelector((state) => state.auth);
  const { goals, totalFocusSessions } = useSelector((state) => state.productivity);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activeNotes = useMemo(() => items.filter((item) => !item.isDeleted), [items]);

  const stats = useMemo(() => {
    const topTagMap = new Map();
    let totalWords = 0;
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
        count: 0,
      };
    });

    activeNotes.forEach((note) => {
      const plain = (note.content || '').replace(/<[^>]+>/g, ' ');
      totalWords += plain
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean).length;

      (note.tags || []).forEach((tag) => {
        const key = tag.toLowerCase();
        topTagMap.set(key, { label: tag, count: (topTagMap.get(key)?.count || 0) + 1 });
      });

      const updatedKey = new Date(note.lastEditedAt || note.updatedAt).toISOString().slice(0, 10);
      const bucket = weeklyActivity.find((day) => day.key === updatedKey);
      if (bucket) bucket.count += 1;
    });

    const topTag = Array.from(topTagMap.values()).sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'tr'),
    )[0];

    return {
      total: activeNotes.length,
      pinned: activeNotes.filter((item) => item.pinned).length,
      trash: items.filter((item) => item.isDeleted).length,
      totalWords,
      averageWords: activeNotes.length ? Math.round(totalWords / activeNotes.length) : 0,
      currentStreak: weeklyActivity.reduce((count, day) => (day.count > 0 ? count + 1 : 0), 0),
      topTag,
      weeklyActivity,
    };
  }, [activeNotes, items]);

  const completedGoals = goals.filter((goal) => goal.done).length;
  const quickStats = [
    { key: 'total', label: 'Aktif Not', value: stats.total },
    { key: 'pinned', label: 'Sabitlenen', value: stats.pinned },
    { key: 'words', label: 'Toplam Kelime', value: stats.totalWords },
    { key: 'focus', label: 'Odak Seansi', value: totalFocusSessions },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.22),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(2,6,23,1))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Gösterge Paneli</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Merhaba {user?.name || 'kullanici'}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Not yonetimi, aktivite takibi ve odak aliskanliklarini tek panelde izleyebilirsin.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            onClick={() => navigate('/productivity')}
          >
            Üretkenlik Merkezi
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {quickStats.map((item) => (
            <div key={item.key} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Haftalik aktivite</p>
              <h2 className="text-xl font-semibold text-white">Son 7 gunde not hareketi</h2>
            </div>
            <div className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">
              streak {stats.currentStreak}
            </div>
          </div>

          <div className="grid h-60 grid-cols-7 items-end gap-3">
            {stats.weeklyActivity.map((day) => {
              const height = Math.max(14, day.count * 26);
              return (
                <div key={day.key} className="flex h-full flex-col justify-end">
                  <div className="rounded-t-2xl bg-gradient-to-t from-sky-500 to-indigo-500" style={{ height }} />
                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-slate-200">{day.count}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{day.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-amber-300" />
              <h2 className="text-lg font-semibold text-white">Akilli ozet</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Ortalama not uzunlugu</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stats.averageWords} kelime</p>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">En populer etiket</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {stats.topTag ? `#${stats.topTag.label}` : 'Henuz etiket yok'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Tamamlanan hedef</p>
                <p className="mt-2 text-2xl font-semibold text-white">{completedGoals} / {goals.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-emerald-300" />
              <h2 className="text-lg font-semibold text-white">Hizli aksiyonlar</h2>
            </div>
            <div className="mt-4 grid gap-2">
              <button
                className="rounded-2xl bg-slate-950/60 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-950"
                onClick={() => navigate('/notes/new')}
              >
                Yeni zengin metin notu olustur
              </button>
              <button
                className="rounded-2xl bg-slate-950/60 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-950"
                onClick={() => navigate('/calendar')}
              >
                Takvimden son guncellemeleri incele
              </button>
              <button
                className="rounded-2xl bg-slate-950/60 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-950"
                onClick={() => navigate('/productivity')}
              >
                Odak sayacı ve şablonları aç
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock3 size={18} className="text-indigo-300" />
          <h2 className="text-lg font-semibold text-white">Son notlar</h2>
        </div>
        <div className="space-y-2">
          {activeNotes
            .slice()
            .sort((a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf())
            .slice(0, 6)
            .map((note) => (
              <button
                key={note._id}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-left transition hover:bg-slate-950"
                onClick={() => {
                  dispatch(selectNote(note._id));
                  navigate('/notes');
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-sky-300">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <span className="block font-medium text-white">{note.title || 'Basliksiz'}</span>
                    <span className="text-xs text-slate-400">
                      {(note.tags || []).length > 0 ? `${note.tags.length} etiket` : 'Etiket yok'}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(note.lastEditedAt || note.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          {activeNotes.length === 0 ? <div className="text-sm text-slate-400">Henuz not yok.</div> : null}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
