import { useMemo, useState } from 'react';

function TagSelector({ tags = [], onChange }) {
  const [input, setInput] = useState('');
  const normalized = useMemo(
    () => tags.map((tag) => tag.trim()).filter(Boolean),
    [tags],
  );

  const addTag = () => {
    const value = input.trim().toLowerCase();
    if (!value || normalized.includes(value)) return;
    onChange([...normalized, value]);
    setInput('');
  };

  const removeTag = (tag) => {
    onChange(normalized.filter((item) => item !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Etiket ekle"
        />
        <button onClick={addTag} className="rounded-lg bg-slate-800 px-3 text-sm">
          Ekle
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {normalized.map((tag) => (
          <button
            key={tag}
            onClick={() => removeTag(tag)}
            className="rounded bg-slate-800 px-2 py-1 text-xs"
          >
            #{tag} sil
          </button>
        ))}
      </div>
    </div>
  );
}

export default TagSelector;
