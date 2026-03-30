import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let apiStore;
let authActions;

const initializeApiInterceptors = (store, actions) => {
  apiStore = store;
  authActions = actions;
};

API.interceptors.request.use((req) => {
  const token = apiStore?.getState()?.auth?.accessToken;

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

let isRefreshing = false;
let requestQueue = [];

const processQueue = (token) => {
  requestQueue.forEach((promise) => promise.resolve(token));
  requestQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          requestQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(API(originalRequest));
            },
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await API.post('/auth/refresh');
        apiStore?.dispatch(authActions.setAccessToken(data.accessToken));
        processQueue(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        apiStore?.dispatch(authActions.logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default API;
export { initializeApiInterceptors };