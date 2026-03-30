import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotes } from '../../features/notes/notesSlice';

function MainLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { accessToken } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);

  useEffect(() => {
    if (!accessToken) return;
    dispatch(fetchNotes());
  }, [dispatch, accessToken]);

  const showHeader = location.pathname === '/';
  const isDark = theme === 'dark';

  return (
    <div className={isDark ? 'min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-900'}>
      <Sidebar />
      <div className="ml-64">
        {showHeader ? <Header /> : null}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
