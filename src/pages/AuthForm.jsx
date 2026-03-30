import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser } from '../features/auth/authSlice';
import toast from 'react-hot-toast';
import API from '../services/api';

function AuthForm({ type }) {
  const isLogin = type === 'login';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    rememberMe: false,
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      const action = isLogin ? loginUser : registerUser;
      await dispatch(action(form)).unwrap();
      toast.success(isLogin ? 'Tekrar hos geldin' : 'Hesap olusturuldu');
      navigate('/');
    } catch (error) {
      const status = error?.status;
      const message = error?.message;

      if (status === 409) {
        setErrorMessage('Bu e-posta zaten kayitli. Giris yapabilir veya baska e-posta deneyebilirsin.');
      } else if (status === 401) {
        setErrorMessage('E-posta veya sifre hatali.');
      } else if (status === 400) {
        setErrorMessage(message || 'Lutfen form alanlarini kontrol et.');
      } else {
        setErrorMessage('Islem sirasinda bir hata olustu. Lutfen tekrar dene.');
      }

      toast.error(message || 'Kimlik dogrulama basarisiz');
    }
  };

  const onGoogleLogin = () => {
    // Tam sayfa yönlendirme: OAuth callback backend tarafında çalışıyor.
    window.location.href = `${API.defaults.baseURL}/auth/google`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold text-slate-100">{isLogin ? 'Giris' : 'Kayit'}</h1>
        {errorMessage ? (
          <p className="rounded-lg border border-rose-700/60 bg-rose-900/30 px-3 py-2 text-sm text-rose-200">
            {errorMessage}
          </p>
        ) : null}
        {!isLogin ? (
          <input
            placeholder="Ad"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        ) : null}
        <input
          placeholder="E-posta"
          type="email"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
        <input
          placeholder="Sifre"
          type="password"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.rememberMe}
            onChange={(event) => setForm((prev) => ({ ...prev, rememberMe: event.target.checked }))}
          />
          Beni hatirla
        </label>
        <button
          disabled={loading}
          className="w-full rounded-lg bg-indigo-500 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Lutfen bekle...' : isLogin ? 'Giris yap' : 'Hesap olustur'}
        </button>
        {isLogin ? (
          <button
            type="button"
            onClick={onGoogleLogin}
            className="w-full rounded-lg bg-white py-2 font-medium text-black transition hover:bg-indigo-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Google ile giriş
          </button>
        ) : null}
        <p className="text-sm text-slate-400">
          {isLogin ? 'Hesabin yok mu?' : 'Hesabin var mi?'}{' '}
          <Link className="text-indigo-400" to={isLogin ? '/register' : '/login'}>
            {isLogin ? 'Kayit ol' : 'Giris yap'}
          </Link>
        </p>
      </form>
    </div>
  );
}

export default AuthForm;
