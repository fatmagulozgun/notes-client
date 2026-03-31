import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { deleteForever, fetchNotes, restoreNote } from '../features/notes/notesSlice';

function TrashPage() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.notes);
  const trash = useMemo(() => items.filter((item) => item.isDeleted), [items]);

  useEffect(() => {
    dispatch(fetchNotes('deleted=true'));
  }, [dispatch]);

  if (trash.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cop Kutusu</h2>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-300">
          {loading ? 'Yukleniyor...' : 'Cop Kutusu bos.'}
        </div>
      </div>
    );
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(trash.map((note) => dispatch(deleteForever(note._id)).unwrap()));
      toast.success('Cop Kutusu temizlendi');
    } catch {
      toast.error('Toplu silme basarisiz');
    }
  };

  const handleBulkRestore = async () => {
    try {
      await Promise.all(trash.map((note) => dispatch(restoreNote(note._id)).unwrap()));
      toast.success('Tum notlar geri yuklendi');
    } catch {
      toast.error('Toplu geri yukleme basarisiz');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cop Kutusu</h2>
        <div className="flex gap-2">
          <button
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
            onClick={handleBulkRestore}
          >
            Toplu geri al
          </button>
          <button
            className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
            onClick={handleBulkDelete}
          >
            Toplu sil
          </button>
        </div>
      </div>

      {trash.map((note) => (
        <div key={note._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div>
            <p className="font-medium">{note.title || 'Basliksiz'}</p>
            <p className="text-sm text-slate-400">Silinme zamani: {new Date(note.deletedAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded bg-slate-700 px-3 py-2 text-sm" onClick={() => dispatch(restoreNote(note._id))}>
              Geri al
            </button>
            <button className="rounded bg-rose-700 px-3 py-2 text-sm" onClick={() => dispatch(deleteForever(note._id))}>
              Kalici sil
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TrashPage;
