import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateNote } from '../../features/notes/notesSlice';
import TagSelector from './TagSelector';

const colors = ['slate', 'rose', 'amber', 'emerald', 'sky', 'violet'];
const colorHex = {
  slate: '#334155',
  rose: '#e11d48',
  amber: '#f59e0b',
  emerald: '#10b981',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
};

function Editor({ note }) {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(note ?? {});

  const payload = useMemo(
    () => ({
      title: draft?.title || '',
      content: draft?.content || '',
      tags: draft?.tags || [],
      color: draft?.color || 'slate',
      pinned: Boolean(draft?.pinned),
    }),
    [draft],
  );

  useEffect(() => {
    if (!note?._id) return;
    const timeout = setTimeout(() => {
      dispatch(updateNote({ id: note._id, payload }));
    }, 700);
    return () => clearTimeout(timeout);
  }, [dispatch, note?._id, payload]);

  if (!note) {
    return <div className="rounded-xl border border-slate-800 p-6">Bir not secin</div>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <input
        value={draft?.title || ''}
        onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
        className="w-full bg-transparent text-2xl font-semibold outline-none"
        placeholder="Not basligi"
      />
      <textarea
        value={draft?.content || ''}
        onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
        className="min-h-56 w-full resize-y rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm outline-none"
        placeholder="Notunu yaz..."
      />
      <div className="flex items-center gap-2">
        {colors.map((color) => (
          <button
            key={color}
            style={{ backgroundColor: colorHex[color] }}
            className={`h-6 w-6 rounded-full border-2 ${draft?.color === color ? 'border-white' : 'border-transparent'}`}
            onClick={() => setDraft((prev) => ({ ...prev, color }))}
          />
        ))}
      </div>
      <TagSelector tags={draft.tags} onChange={(tags) => setDraft((prev) => ({ ...prev, tags }))} />
      <p className="text-xs text-slate-400">
        Son duzenleme: {new Date(note.lastEditedAt || note.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}

export default Editor;
