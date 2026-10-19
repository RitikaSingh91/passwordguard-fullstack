import { LogOut, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('pg-theme') !== 'light'; } catch { return true; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('pg-theme', dark ? 'dark' : 'light'); } catch { /* theme is a non-sensitive preference */ }
  }, [dark]);
  const link = ({ isActive }: { isActive: boolean }) => `px-2 py-2 text-sm font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="text-emerald-500" aria-hidden="true" /> PasswordGuard</Link>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Main">
            <NavLink to="/analyze" className={link}>Analyzer</NavLink>
            {user && <NavLink to="/dashboard" className={link}>Dashboard</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" className={link}>Admin</NavLink>}
            <button className="btn-ghost !min-h-[40px] !px-3" onClick={() => setDark(!dark)} aria-label="Toggle light and dark theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <button className="btn-ghost !min-h-[40px]" onClick={async () => { await logout(); nav('/'); }}><LogOut size={16} aria-hidden="true" /> Log out</button>
            ) : (
              <><Link to="/login" className="btn-ghost !min-h-[40px]">Log in</Link><Link to="/register" className="btn !min-h-[40px]">Sign up</Link></>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><Outlet /></main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        © 2026 PasswordGuard. Built with security and privacy in mind.
        </footer>
    </div>
  );
}
