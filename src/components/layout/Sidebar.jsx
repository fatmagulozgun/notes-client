import { CalendarDays, ChevronDown, FilePlus, Home, NotebookText, Sparkles, Trash2, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { logoutUser } from '../../features/auth/authSlice';

const navItems = [
  { path: '/', label: 'Ana Sayfa', icon: Home },
  { path: '/notes/new', label: 'Yeni Not', icon: FilePlus },
  { path: '/notes', label: 'Notlarim', icon: NotebookText },
  { path: '/calendar', label: 'Takvim', icon: CalendarDays },
  { path: '/productivity', label: 'Productivity Hub', icon: Sparkles },
  { path: '/trash', label: 'Cop Kutusu', icon: Trash2 },
];

function Sidebar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onDoc = (event) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) setOpen(false);
    };

    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const isItemActive = (path) => {
    const current = location.pathname;
    if (path === '/') return current === '/';
    if (path === '/notes/new') return current === '/notes/new';
    if (path === '/notes') return current.startsWith('/notes') && current !== '/notes/new';
    return current.startsWith(path);
  };

  return (
    <aside
      className={`fixed left-0 top-0 flex h-screen w-64 flex-col border-r p-4 ${
        isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
      }`}
    >
      <h1 className={`mb-8 text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        Notes Client Pro
      </h1>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const { path, label } = item;
          const active = isItemActive(path);
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                active
                  ? isDark
                    ? 'bg-slate-800 text-slate-100'
                    : 'bg-slate-100 text-slate-900'
                  : isDark
                    ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="relative" ref={dropdownRef}>
        <button
          className={`mt-4 flex w-full items-center justify-between rounded-lg border px-3 py-2 transition ${
            isDark
              ? 'border-slate-800 bg-slate-900/50 text-slate-100 hover:bg-slate-900'
              : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
          }`}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'
              }`}
              title={user?.name || 'Kullanici'}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.name ? `${user.name} avatar` : 'Kullanici avatar'}
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User size={16} />
              )}
            </span>
            <span className="truncate text-sm font-medium">{user?.name || 'Hesabim'}</span>
          </span>
          <ChevronDown size={18} className={open ? 'rotate-180 transition' : 'transition'} />
        </button>

        {open ? (
          <div
            className={`absolute bottom-14 left-0 w-full rounded-lg border p-2 shadow-lg ${
              isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
            }`}
          >
            <button
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                isDark ? 'text-slate-200 hover:bg-slate-900' : 'text-slate-700 hover:bg-slate-100'
              }`}
              onClick={() => {
                setOpen(false);
                dispatch(logoutUser());
              }}
            >
              Cikis Yap
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export default Sidebar;
