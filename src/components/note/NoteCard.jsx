import { Copy, Pin, PinOff, Trash2 } from "lucide-react";

const colorMap = {
  slate: "bg-slate-900",
  rose: "bg-rose-950",
  amber: "bg-amber-950",
  emerald: "bg-emerald-950",
  sky: "bg-sky-950",
  violet: "bg-violet-950",
};

const toPreviewText = (html) => {
  if (!html) return "";

  const container = document.createElement("div");
  container.innerHTML = html;

  return (container.textContent || container.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
};

const stopClick = (event, callback) => {
  event.preventDefault();
  event.stopPropagation();
  callback();
};

function NoteCard({
  note,
  active = false,
  viewMode = "grid",
  onClick,
  onTrash,
  onDuplicate,
  onTogglePin,
  selectionMode = false,
  selected = false,
}) {
  const previewText = toPreviewText(note.content);

  return (
    <div className="relative">
      <button
        className={`w-full rounded-xl border p-4 pr-28 text-left transition hover:scale-[1.01] ${
          active || selected
            ? "border-indigo-400 ring-2 ring-indigo-500/40"
            : "border-slate-800"
        } ${viewMode === "list" ? "min-h-36" : ""} ${colorMap[note.color] || colorMap.slate}`}
        onClick={onClick}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 font-medium text-slate-100">
            {note.title || "Basliksiz"}
          </h3>
          {note.pinned ? <Pin size={16} className="text-amber-300" /> : null}
        </div>
        <p
          className={`${viewMode === "list" ? "line-clamp-3 min-h-14" : "line-clamp-2 min-h-10"} text-sm text-slate-300`}
        >
          {previewText || "Henuz icerik yok..."}
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {note.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300"
            >
              #{tag}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Son guncelleme:{" "}
          {new Date(note.lastEditedAt || note.updatedAt).toLocaleString()}
        </p>
        {selectionMode ? (
          <div className="mt-3 inline-flex rounded-full bg-slate-950/60 px-3 py-1 text-xs text-slate-200">
            {selected ? "Secili" : "Secmek icin tikla"}
          </div>
        ) : null}
      </button>

      <div className="absolute right-2 top-2 flex gap-1">
        {onTogglePin ? (
          <button
            title={note.pinned ? "Sabitlemeyi kaldir" : "Sabitle"}
            className="rounded-md bg-slate-950/40 p-2 text-slate-200 backdrop-blur transition hover:bg-slate-950/70"
            onClick={(event) => stopClick(event, onTogglePin)}
          >
            {note.pinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
        ) : null}
        {onDuplicate ? (
          <button
            title="Kopyala"
            className="rounded-md bg-slate-950/40 p-2 text-slate-200 backdrop-blur transition hover:bg-slate-950/70"
            onClick={(event) => stopClick(event, onDuplicate)}
          >
            <Copy size={16} />
          </button>
        ) : null}
        {onTrash ? (
          <button
            title="Cop Kutusuna tasi"
            className="rounded-md bg-slate-950/40 p-2 text-slate-200 backdrop-blur transition hover:bg-slate-950/70"
            onClick={(event) => stopClick(event, onTrash)}
          >
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default NoteCard;
