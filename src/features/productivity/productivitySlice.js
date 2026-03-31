import { createSlice } from '@reduxjs/toolkit';

const storageKey = 'notesProductivity';

const defaultState = {
  focusPreset: 'focus',
  focusDurations: {
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
  },
  totalFocusSessions: 0,
  goals: [
    { id: 'goal-inbox-zero', label: 'Inbox notlarini duzenle', done: false },
    { id: 'goal-review', label: 'Haftalik review notu hazirla', done: false },
    { id: 'goal-tags', label: 'En az 3 notu etiketle', done: true },
  ],
  templates: [
    {
      id: 'tpl-meeting',
      name: 'Toplanti Notu',
      description: 'Gundem, kararlar ve aksiyon maddeleriyle hazir gelir.',
      title: 'Toplanti Ozeti',
      content:
        '<h2>Gundem</h2><ul><li>Basliklar</li></ul><h2>Kararlar</h2><ul><li>Aksiyon</li></ul><h2>Takip</h2><ul><li>Sorumlu / tarih</li></ul>',
      color: 'sky',
      tags: ['toplanti', 'aksiyon'],
    },
    {
      id: 'tpl-sprint',
      name: 'Sprint Plan',
      description: 'Hedefler, blockerlar ve teslimler icin ideal.',
      title: 'Sprint Planlama',
      content:
        '<h2>Hedefler</h2><ul><li>Sprint hedefi</li></ul><h2>Blockerlar</h2><ul><li>Risk / bagimlilik</li></ul><h2>Teslimler</h2><ul><li>Owner</li></ul>',
      color: 'violet',
      tags: ['sprint', 'planlama'],
    },
    {
      id: 'tpl-journal',
      name: 'Gunluk Journal',
      description: 'Gun sonu review ve ogrenim notlari icin.',
      title: 'Gunluk Journal',
      content:
        '<h2>Bugun ne oldu?</h2><p></p><h2>Ogrenimler</h2><ul><li></li></ul><h2>Yarin</h2><ul><li></li></ul>',
      color: 'amber',
      tags: ['journal', 'gunluk'],
    },
  ],
};

const loadInitialState = () => {
  if (typeof window === 'undefined') return defaultState;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      focusDurations: {
        ...defaultState.focusDurations,
        ...(parsed.focusDurations || {}),
      },
      goals: Array.isArray(parsed.goals) && parsed.goals.length > 0 ? parsed.goals : defaultState.goals,
      templates:
        Array.isArray(parsed.templates) && parsed.templates.length > 0 ? parsed.templates : defaultState.templates,
    };
  } catch {
    return defaultState;
  }
};

const persistState = (state) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
};

const productivitySlice = createSlice({
  name: 'productivity',
  initialState: loadInitialState(),
  reducers: {
    setFocusPreset: (state, action) => {
      state.focusPreset = action.payload;
      persistState(state);
    },
    updateFocusDuration: (state, action) => {
      const { key, value } = action.payload;
      if (!['focus', 'shortBreak', 'longBreak'].includes(key)) return;
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 90) return;
      state.focusDurations[key] = parsed;
      persistState(state);
    },
    completeFocusSession: (state) => {
      state.totalFocusSessions += 1;
      persistState(state);
    },
    toggleGoal: (state, action) => {
      const goal = state.goals.find((item) => item.id === action.payload);
      if (!goal) return;
      goal.done = !goal.done;
      persistState(state);
    },
    addGoal: (state, action) => {
      const label = action.payload?.trim();
      if (!label) return;
      state.goals.unshift({
        id: `goal-${Date.now()}`,
        label,
        done: false,
      });
      persistState(state);
    },
    removeGoal: (state, action) => {
      state.goals = state.goals.filter((goal) => goal.id !== action.payload);
      persistState(state);
    },
  },
});

export const {
  addGoal,
  completeFocusSession,
  removeGoal,
  setFocusPreset,
  toggleGoal,
  updateFocusDuration,
} = productivitySlice.actions;

export default productivitySlice.reducer;
