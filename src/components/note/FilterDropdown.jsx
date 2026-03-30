function FilterDropdown({ value, onChange }) {
  return (
    <select
      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="all">Hepsi</option>
      <option value="pinned">Sabitlenmiş</option>
      <option value="deleted">Silinen</option>
    </select>
  );
}

export default FilterDropdown;
