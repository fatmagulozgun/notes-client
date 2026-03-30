import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchNotes = createAsyncThunk('notes/fetch', async (query = '') => {
  const { data } = await API.get(`/notes${query ? `?${query}` : ''}`);
  return data;
});

export const createNote = createAsyncThunk('notes/create', async (payload) => {
  const { data } = await API.post('/notes', payload);
  return data.note;
});

export const duplicateNote = createAsyncThunk('notes/duplicate', async (note) => {
  const { _id, createdAt, updatedAt, lastEditedAt, deletedAt, user, isDeleted, ...copyable } = note;
  const payload = {
    ...copyable,
    title: note.title ? `${note.title} (Kopya)` : 'Basliksiz (Kopya)',
    pinned: false,
  };
  const { data } = await API.post('/notes', payload);
  return data.note;
});

export const updateNote = createAsyncThunk('notes/update', async ({ id, payload }) => {
  const { data } = await API.patch(`/notes/${id}`, payload);
  return data.note;
});

export const moveToTrash = createAsyncThunk('notes/trash', async (id) => {
  const { data } = await API.patch(`/notes/${id}/delete`);
  return data.note;
});

export const restoreNote = createAsyncThunk('notes/restore', async (id) => {
  const { data } = await API.patch(`/notes/${id}/restore`);
  return data.note;
});

export const deleteForever = createAsyncThunk('notes/deleteForever', async (id) => {
  await API.delete(`/notes/${id}`);
  return id;
});

const upsertNote = (state, note) => {
  const index = state.items.findIndex((item) => item._id === note._id);
  if (index === -1) {
    state.items.unshift(note);
  } else {
    state.items[index] = note;
  }
};

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    items: [],
    selectedNoteId: null,
    loading: false,
  },
  reducers: {
    selectNote: (state, action) => {
      state.selectedNoteId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.notes;
        if (!state.selectedNoteId && action.payload.notes.length > 0) {
          state.selectedNoteId = action.payload.notes[0]._id;
        }
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.selectedNoteId = action.payload._id;
      })
      .addCase(duplicateNote.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.selectedNoteId = action.payload._id;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        upsertNote(state, action.payload);
      })
      .addCase(moveToTrash.fulfilled, (state, action) => {
        upsertNote(state, action.payload);
      })
      .addCase(restoreNote.fulfilled, (state, action) => {
        upsertNote(state, action.payload);
      })
      .addCase(deleteForever.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
      });
  },
});

export const { selectNote } = notesSlice.actions;
export default notesSlice.reducer;
