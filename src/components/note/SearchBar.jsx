function SearchBar({ value, onChange }) {
  return (
    <input
      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-indigo-400"
      placeholder="Başlık veya içerikte ara..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default SearchBar;
