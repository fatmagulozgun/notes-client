import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckSquare,
  LayoutGrid,
  List,
  ListChecks,
  Pin,
  Trash2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import NoteCard from "../components/note/NoteCard";
import SearchBar from "../components/note/SearchBar";
import { downloadNotesJson, downloadNotesMarkdown } from "../utils/export";
import {
  duplicateNote,
  moveToTrash,
  updateNote,
} from "../features/notes/notesSlice";
import { setViewMode } from "../features/ui/uiSlice";

const sortOptions = {
  newest: (a, b) =>
    new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf(),
  oldest: (a, b) =>
    new Date(a.updatedAt).valueOf() - new Date(b.updatedAt).valueOf(),
  title: (a, b) => (a.title || "").localeCompare(b.title || "", "tr"),
  longest: (a, b) => (b.content || "").length - (a.content || "").length,
};

function NotesPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.notes);
  const { viewMode } = useSelector((state) => state.ui);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterMode, setFilterMode] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const searchInputRef = useRef(null);
  const [recentThreshold] = useState(
    () => Date.now() - 1000 * 60 * 60 * 24 * 3,
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeItems = useMemo(
    () => items.filter((item) => !item.isDeleted),
    [items],
  );

  const visible = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const selectedTag = tagFilter.trim().toLowerCase();
    return activeItems
      .filter((item) => {
        if (filterMode === "pinned") return item.pinned;
        if (filterMode === "untagged") return !item.tags?.length;
        if (filterMode === "recent")
          return (
            new Date(item.lastEditedAt || item.updatedAt).valueOf() >=
            recentThreshold
          );
        return true;
      })
      .filter((item) =>
        colorFilter === "all" ? true : item.color === colorFilter,
      )
      .filter((item) => {
        if (!selectedTag) return true;
        return item.tags?.some((tag) => tag.toLowerCase() === selectedTag);
      })
      .filter((item) => {
        if (!searchText) return true;
        const haystack = [item.title, item.content, item.tags?.join(" ")]
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchText);
      })
      .slice()
      .sort((a, b) => {
        if (filterMode !== "pinned" && a.pinned !== b.pinned) {
          return Number(b.pinned) - Number(a.pinned);
        }
        return (sortOptions[sortBy] || sortOptions.newest)(a, b);
      });
  }, [
    activeItems,
    colorFilter,
    filterMode,
    recentThreshold,
    search,
    sortBy,
    tagFilter,
  ]);

  const tagOptions = useMemo(() => {
    const map = new Map();
    activeItems.forEach((item) => {
      (item.tags || []).forEach((tag) => {
        const key = tag.toLowerCase();
        if (!key) return;
        const prev = map.get(key);
        if (prev) {
          prev.count += 1;
        } else {
          map.set(key, { label: tag, count: 1 });
        }
      });
    });

    return Array.from(map.entries())
      .map(([value, meta]) => ({ value, label: meta.label, count: meta.count }))
      .sort(
        (a, b) => b.count - a.count || a.label.localeCompare(b.label, "tr"),
      );
  }, [activeItems]);

  const colorOptions = useMemo(() => {
    const map = new Map();
    activeItems.forEach((item) => {
      map.set(item.color || "slate", (map.get(item.color || "slate") || 0) + 1);
    });

    return Array.from(map.entries()).map(([value, count]) => ({
      value,
      count,
    }));
  }, [activeItems]);

  const counts = useMemo(
    () => ({
      all: activeItems.length,
      pinned: activeItems.filter((item) => item.pinned).length,
      untagged: activeItems.filter((item) => !item.tags?.length).length,
      recent: activeItems.filter(
        (item) =>
          new Date(item.lastEditedAt || item.updatedAt).valueOf() >=
          recentThreshold,
      ).length,
    }),
    [activeItems, recentThreshold],
  );

  const visibleWordCount = useMemo(
    () =>
      visible.reduce((sum, note) => {
        const plain = (note.content || "").replace(/<[^>]+>/g, " ");
        return (
          sum +
          plain
            .split(/\s+/)
            .map((word) => word.trim())
            .filter(Boolean).length
        );
      }, 0),
    [visible],
  );

  const handleTogglePin = async (note) => {
    try {
      await dispatch(
        updateNote({ id: note._id, payload: { pinned: !note.pinned } }),
      ).unwrap();
      toast.success(
        note.pinned ? "Not sabitlemeden cikarildi" : "Not sabitlendi",
      );
    } catch {
      toast.error("Sabitleme islemi basarisiz");
    }
  };

  const handleDuplicate = async (note) => {
    try {
      const created = await dispatch(duplicateNote(note)).unwrap();
      toast.success("Not kopyalandi");
      navigate(`/notes/${created._id}`);
    } catch {
      toast.error("Not kopyalanamadi");
    }
  };

  const handleTrash = async (noteId) => {
    try {
      await dispatch(moveToTrash(noteId)).unwrap();
      toast.success("Not cop kutusuna tasindi");
    } catch {
      toast.error("Not tasinamadi");
    }
  };

  const toggleSelected = (noteId) => {
    setSelectedIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId],
    );
  };

  const handleBulkPin = async () => {
    const selectedNotes = activeItems.filter((note) =>
      selectedIds.includes(note._id),
    );
    try {
      await Promise.all(
        selectedNotes.map((note) =>
          dispatch(
            updateNote({ id: note._id, payload: { pinned: true } }),
          ).unwrap(),
        ),
      );
      toast.success("Secilen notlar sabitlendi");
    } catch {
      toast.error("Toplu sabitleme basarisiz");
    }
  };

  const handleBulkTrash = async () => {
    try {
      await Promise.all(
        selectedIds.map((noteId) => dispatch(moveToTrash(noteId)).unwrap()),
      );
      setSelectedIds([]);
      setSelectionMode(false);
      toast.success("Secilen notlar cop kutusuna tasindi");
    } catch {
      toast.error("Toplu tasima basarisiz");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Notlarim</h2>
            <p className="text-sm text-slate-400">
              Ctrl/Cmd + K ile aramaya odaklan, filtreleri birlestir ve toplu
              aksiyonlar calistir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
              <button
                className={`px-3 py-2 text-sm transition ${
                  viewMode === "grid"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-300 hover:bg-slate-900"
                }`}
                onClick={() => dispatch(setViewMode("grid"))}
                title="Grid gorunumu"
              >
                <span className="flex items-center gap-1.5">
                  <LayoutGrid size={16} />
                  Kartlar
                </span>
              </button>
              <button
                className={`px-3 py-2 text-sm transition ${
                  viewMode === "list"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-300 hover:bg-slate-900"
                }`}
                onClick={() => dispatch(setViewMode("list"))}
                title="Liste gorunumu"
              >
                <span className="flex items-center gap-1.5">
                  <List size={16} />
                  Liste
                </span>
              </button>
            </div>

            <button
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                selectionMode
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
              onClick={() =>
                setSelectionMode((prev) => {
                  const next = !prev;
                  if (!next) setSelectedIds([]);
                  return next;
                })
              }
            >
              <CheckSquare size={16} />
              Coklu secim
            </button>

            <button
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
              onClick={() => navigate("/notes/new")}
            >
              Yeni not olustur
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px]">
          <SearchBar
            ref={searchInputRef}
            value={search}
            onChange={setSearch}
            placeholder="Baslik, icerik veya etiket ara... (Ctrl/Cmd + K)"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none"
          >
            <option value="newest">En yeni</option>
            <option value="oldest">En eski</option>
            <option value="title">Basliga gore</option>
            <option value="longest">En uzun icerik</option>
          </select>
          <select
            value={colorFilter}
            onChange={(event) => setColorFilter(event.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none"
          >
            <option value="all">Tum renkler</option>
            {colorOptions.map((color) => (
              <option key={color.value} value={color.value}>
                {color.value} ({color.count})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["all", `Tum notlar (${counts.all})`],
            ["pinned", `Sabitlenenler (${counts.pinned})`],
            ["untagged", `Etiketsiz (${counts.untagged})`],
            ["recent", `Son 3 gun (${counts.recent})`],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                filterMode === value
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              onClick={() => setFilterMode(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {tagOptions.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Etiket
            </span>
            {tagOptions.slice(0, 10).map((tag) => (
              <button
                key={tag.value}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  tagFilter === tag.value
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                onClick={() =>
                  setTagFilter((prev) => (prev === tag.value ? "" : tag.value))
                }
              >
                #{tag.label} ({tag.count})
              </button>
            ))}
            {tagFilter ? (
              <button
                className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800"
                onClick={() => setTagFilter("")}
              >
                Etiket filtresini temizle
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {selectionMode && selectedIds.length > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
              <span className="text-sm text-amber-100">
                {selectedIds.length} not secildi
              </span>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
                onClick={handleBulkPin}
              >
                <Pin size={16} />
                Toplu sabitle
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm text-white transition hover:bg-rose-500"
                onClick={handleBulkTrash}
              >
                <Trash2 size={16} />
                Cop kutusuna tasi
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="animate-pulse rounded-xl bg-slate-800 p-6">
              Yukleniyor...
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
              Bu filtreye uyan not bulunamadi.
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-3 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-3"
              }
            >
              {visible.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  viewMode={viewMode}
                  selected={selectedIds.includes(note._id)}
                  selectionMode={selectionMode}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelected(note._id);
                      return;
                    }
                    navigate(`/notes/${note._id}`);
                  }}
                  onTrash={() => handleTrash(note._id)}
                  onDuplicate={() => handleDuplicate(note)}
                  onTogglePin={() => handleTogglePin(note)}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2">
              <ListChecks size={18} className="text-sky-300" />
              <h3 className="text-lg font-semibold text-white">
                Liste istatistikleri
              </h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Gorunen not</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {visible.length}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Toplam kelime</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {visibleWordCount}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Secili not</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {selectedIds.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-lg font-semibold text-white">Dışa Aktar</h3>
            <p className="mt-2 text-sm text-slate-400">
              Filtrelenmiş notları JSON veya Markdown olarak indir.
            </p>
            <div className="mt-4 grid gap-2">
              <button
                className="rounded-2xl bg-slate-950/60 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-950"
                onClick={() =>
                  downloadNotesJson(visible, `notes-${filterMode}-${sortBy}`)
                }
              >
                Görünenleri JSON indir ({visible.length})
              </button>
              <button
                className="rounded-2xl bg-slate-950/60 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-950"
                onClick={() =>
                  downloadNotesMarkdown(visible, `notes-${filterMode}-${sortBy}`)
                }
              >
                Görünenleri Markdown indir ({visible.length})
              </button>
              {selectionMode && selectedIds.length > 0 ? (
                <>
                  <button
                    className="rounded-2xl bg-indigo-500 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-indigo-400"
                    onClick={() => {
                      const selected = activeItems.filter((note) =>
                        selectedIds.includes(note._id),
                      );
                      downloadNotesJson(selected, "notes-selected");
                    }}
                  >
                    Seçilenleri JSON indir ({selectedIds.length})
                  </button>
                  <button
                    className="rounded-2xl bg-indigo-500 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-indigo-400"
                    onClick={() => {
                      const selected = activeItems.filter((note) =>
                        selectedIds.includes(note._id),
                      );
                      downloadNotesMarkdown(selected, "notes-selected");
                    }}
                  >
                    Seçilenleri Markdown indir ({selectedIds.length})
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-lg font-semibold text-white">
              Akilli ipuclari
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-slate-950/60 p-4">
                Uzun notlari bulmak icin "En uzun icerik" siralamasini kullan.
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4">
                Coklu secim ile birden fazla notu tek seferde sabitleyebilir
                veya cop kutusuna tasiyabilirsin.
              </div>
              <div className="rounded-2xl bg-slate-950/60 p-4">
                Renk ve etiket filtrelerini birlestirerek konu bazli mini board
                gibi calis.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default NotesPage;
