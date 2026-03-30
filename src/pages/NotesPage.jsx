import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NoteCard from '../components/note/NoteCard';
import { duplicateNote, moveToTrash, updateNote } from '../features/notes/notesSlice';

const sortOptions = {
  newest: (a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf(),
  oldest: (a, b) => new Date(a.updatedAt).valueOf() - new Date(b.updatedAt).valueOf(),
  title: (a, b) => (a.title || '').localeCompare(b.title || '', 'tr'),
};

function NotesPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.notes);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterMode, setFilterMode] = useState('all');

  const visible = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return items
      .filter((item) => !item.isDeleted)
      .filter((item) => {
        if (filterMode === 'pinned') return item.pinned;
        if (filterMode === 'untagged') return !item.tags?.length;
        return true;
      })
      .filter((item) => {
        if (!searchText) return true;
        const haystack = [item.title, item.content, item.tags?.join(' ')].join(' ').toLowerCase();
        return haystack.includes(searchText);
      })
      .slice()
      .sort((a, b) => {
        if (filterMode !== 'pinned' && a.pinned !== b.pinned) {
          return Number(b.pinned) - Number(a.pinned);
        }
        return (sortOptions[sortBy] || sortOptions.newest)(a, b);
      });
  }, [filterMode, items, search, sortBy]);

  const counts = useMemo(
    () => ({
      all: items.filter((item) => !item.isDeleted).length,
      pinned: items.filter((item) => !item.isDeleted && item.pinned).length,
      untagged: items.filter((item) => !item.isDeleted && !item.tags?.length).length,
    }),
    [items],
  );

  const handleTogglePin = async (note) => {
    try {
      await dispatch(updateNote({ id: note._id, payload: { pinned: !note.pinned } })).unwrap();
      toast.success(note.pinned ? 'Not sabitlemeden cikarildi' : 'Not sabitlendi');
    } catch {
      toast.error('Sabitleme islemi basarisiz');
    }
  };

  const handleDuplicate = async (note) => {
    try {
      const created = await dispatch(duplicateNote(note)).unwrap();
      toast.success('Not kopyalandi');
      navigate(`/notes/${created._id}`);
    } catch {
      toast.error('Not kopyalanamadi');
    }
  };

  const handleTrash = async (noteId) => {
    try {
      await dispatch(moveToTrash(noteId)).unwrap();
      toast.success('Not cop kutusuna tasindi');
    } catch {
      toast.error('Not tasinamadi');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Notlarim</h2>
            <p className="text-sm text-slate-400">Arama, filtreleme ve hizli kart aksiyonlari eklendi.</p>
          </div>
          <button
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
            onClick={() => navigate('/notes/new')}
          >
            Yeni not olustur
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500"
            placeholder="Baslik, icerik veya etiket ara..."
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none"
          >
            <option value="newest">En yeni</option>
            <option value="oldest">En eski</option>
            <option value="title">Basliga gore</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['all', `Tum notlar (${counts.all})`],
            ['pinned', `Sabitlenenler (${counts.pinned})`],
            ['untagged', `Etiketsiz (${counts.untagged})`],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                filterMode === value ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              onClick={() => setFilterMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse rounded-xl bg-slate-800 p-6">Yukleniyor...</div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          Bu filtreye uyan not bulunamadi.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onClick={() => navigate(`/notes/${note._id}`)}
              onTrash={() => handleTrash(note._id)}
              onDuplicate={() => handleDuplicate(note)}
              onTogglePin={() => handleTogglePin(note)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NotesPage;
