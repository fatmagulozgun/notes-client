import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'dark',
    viewMode: 'grid',
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    toggleViewMode: (state) => {
      state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
    },
  },
});

export const { toggleTheme, toggleViewMode } = uiSlice.actions;
export default uiSlice.reducer;
