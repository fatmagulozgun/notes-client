import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function CalendarPage() {
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.notes);

  const grouped = useMemo(() => {
    const groups = items
      .filter((note) => !note.isDeleted)
      .reduce((acc, note) => {
        const key = new Date(note.updatedAt).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
        if (!acc[key]) acc[key] = [];
        acc[key].push(note);
        return acc;
      }, {});

    return Object.entries(groups).sort(
      (a, b) => new Date(b[1][0].updatedAt).valueOf() - new Date(a[1][0].updatedAt).valueOf(),
    );
  }, [items]);

  if (grouped.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-300">
        Takvimde gosterecek not henuz yok.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([date, notes]) => (
        <div key={date} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold">{date}</h3>
            <span className="text-xs text-slate-400">{notes.length} not</span>
          </div>
          <div className="space-y-2">
            {notes.map((note) => (
              <button
                key={note._id}
                className="flex w-full items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2 text-left transition hover:bg-slate-950"
                onClick={() => navigate(`/notes/${note._id}`)}
              >
                <span className="line-clamp-1 text-sm text-slate-200">{note.title || 'Basliksiz'}</span>
                <span className="text-xs text-slate-400">
                  {new Date(note.updatedAt).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CalendarPage;
