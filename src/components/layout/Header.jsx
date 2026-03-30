import { Bell, Moon, Plus, Sun } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleTheme } from '../../features/ui/uiSlice';

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 backdrop-blur ${
        isDark ? 'border-slate-800 bg-slate-950/90' : 'border-slate-200 bg-white/80'
      }`}
    >
      <div>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tekrar hoş geldin</p>
        <p className={isDark ? 'text-slate-100' : 'text-slate-900'}>{user?.name}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            isDark
              ? 'bg-indigo-500 text-white hover:bg-indigo-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
          onClick={() => navigate('/notes/new')}
        >
          <span className="flex items-center gap-2">
            <Plus size={18} />
            Yeni Not
          </span>
        </button>

        <button
          className={`rounded-lg p-2 transition ${
            isDark
              ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title="Bildirimler"
          onClick={() => {}}
        >
          <Bell size={18} />
        </button>

      </div>
    </header>
  );
}

export default Header;
