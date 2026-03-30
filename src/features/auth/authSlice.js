import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../../services/api';

const mapApiError = (error) => ({
  status: error?.response?.status || 500,
  message: error?.response?.data?.message || 'Kimlik doğrulama başarısız',
});

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/auth/register', payload);
      return data;
    } catch (error) {
      return rejectWithValue(mapApiError(error));
    }
  },
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/auth/login', payload);
      return data;
    } catch (error) {
      return rejectWithValue(mapApiError(error));
    }
  },
);

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/auth/me');
    return data;
  } catch (error) {
    return rejectWithValue(mapApiError(error));
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await API.post('/auth/logout');
});

export const refreshAccessToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/auth/refresh');
      return data;
    } catch (error) {
      return rejectWithValue(mapApiError(error));
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    loading: false,
    initialized: false,
  },
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.initialized = true;
      })
      .addCase(registerUser.rejected, (state) => {
        state.loading = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.initialized = true;
      })
      .addCase(loginUser.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.initialized = true;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.initialized = true;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.initialized = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.initialized = true;
      });
  },
});

export const { setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
