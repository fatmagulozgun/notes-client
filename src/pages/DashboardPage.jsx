import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectNote } from '../features/notes/notesSlice';

function DashboardPage() {
  const { items } = useSelector((state) => state.notes);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const stats = useMemo(
    () => ({
      total: items.filter((item) => !item.isDeleted).length,
      pinned: items.filter((item) => item.pinned && !item.isDeleted).length,
      trash: items.filter((item) => item.isDeleted).length,
    }),
    [items],
  );

  const labels = {
    total: 'Toplam',
    pinned: 'Sabitlenmiş',
    trash: 'Çöp Kutusu',
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-sm text-slate-400">Kullanıcı</p>
        <p className="mt-1 text-xl font-semibold">{user?.name || '—'}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">{labels[key] || key}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-lg font-semibold">Son notlar</h2>
        <div className="space-y-2">
          {items
            .filter((n) => !n.isDeleted)
            .sort((a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf())
            .slice(0, 5)
            .map((note) => (
              <button
                key={note._id}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-left transition hover:bg-slate-950"
                onClick={() => {
                  dispatch(selectNote(note._id));
                  navigate('/notes');
                }}
              >
                <span className="line-clamp-1 font-medium">{note.title || 'Başlıksız'}</span>
                <span className="text-xs text-slate-400">
                  {new Date(note.lastEditedAt || note.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          {items.filter((n) => !n.isDeleted).length === 0 && (
            <div className="text-sm text-slate-400">Henüz not yok.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
