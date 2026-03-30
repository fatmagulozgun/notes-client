import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteForever, fetchNotes, restoreNote } from '../features/notes/notesSlice';
import toast from 'react-hot-toast';

function TrashPage() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.notes);
  const trash = useMemo(() => items.filter((item) => item.isDeleted), [items]);

  useEffect(() => {
    dispatch(fetchNotes('deleted=true'));
  }, [dispatch]);

  if (trash.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        {loading ? 'Yükleniyor...' : 'Çöp Kutusu boş.'}
      </div>
    );
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(trash.map((note) => dispatch(deleteForever(note._id)).unwrap()));
      toast.success('Çöp Kutusu temizlendi');
    } catch (e) {
      toast.error('Toplu silme başarısız');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Çöp Kutusu</h2>
        <button
          className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
          onClick={handleBulkDelete}
        >
          Toplu sil
        </button>
      </div>
      {trash.map((note) => (
        <div key={note._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div>
            <p className="font-medium">{note.title || 'Başlıksız'}</p>
            <p className="text-sm text-slate-400">
              Silinme zamanı: {new Date(note.deletedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded bg-slate-700 px-3 py-2 text-sm" onClick={() => dispatch(restoreNote(note._id))}>
              Geri al
            </button>
            <button className="rounded bg-rose-700 px-3 py-2 text-sm" onClick={() => dispatch(deleteForever(note._id))}>
              Kalıcı sil
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TrashPage;
