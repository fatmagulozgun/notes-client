import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { logout, setAccessToken } from './features/auth/authSlice';
import './index.css';
import { initializeApiInterceptors } from './services/api';
import { store } from './store';

initializeApiInterceptors(store, { logout, setAccessToken });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster position="top-right" />
    </Provider>
  </StrictMode>,
);
