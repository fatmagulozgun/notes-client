import { createSlice } from "@reduxjs/toolkit";

const storageKey = "notesClientUi";

const loadPersistedUi = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const persistUi = (state) => {
  if (typeof window === "undefined") return;
  const payload = { theme: state.theme, viewMode: state.viewMode };
  window.localStorage.setItem(storageKey, JSON.stringify(payload));
};

const getInitialViewMode = () => {
  if (typeof window === "undefined") return "grid";
  const saved = window.localStorage.getItem("notesViewMode");
  return saved === "grid" || saved === "list" ? saved : "grid";
};

const getInitialTheme = () => {
  if (typeof window === "undefined") return "dark";
  const persisted = loadPersistedUi();
  const saved = persisted.theme ?? window.localStorage.getItem("notesTheme");
  return saved === "light" || saved === "dark" ? saved : "dark";
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    theme: getInitialTheme(),
    viewMode: loadPersistedUi().viewMode === "list" ? "list" : getInitialViewMode(),
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      persistUi(state);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("notesTheme", state.theme);
      }
    },
    toggleViewMode: (state) => {
      state.viewMode = state.viewMode === "grid" ? "list" : "grid";
      persistUi(state);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("notesViewMode", state.viewMode);
      }
    },
    setViewMode: (state, action) => {
      const nextMode = action.payload;
      if (nextMode === "grid" || nextMode === "list") {
        state.viewMode = nextMode;
        persistUi(state);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("notesViewMode", state.viewMode);
        }
      }
    },
  },
});

export const { toggleTheme, toggleViewMode, setViewMode } = uiSlice.actions;
export default uiSlice.reducer;
