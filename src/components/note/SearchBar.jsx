import { forwardRef } from "react";

const SearchBar = forwardRef(function SearchBar(
  { value, onChange, placeholder = "Başlık veya içerikte ara...", className = "" },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-indigo-400 ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
});

export default SearchBar;
