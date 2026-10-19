import { Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../auth/AuthContext';
import { api, errorMessage } from '../lib/api';

const CATS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
interface Item { _id: string; label: string; score: number; category: string; length: number; patterns: string[]; breachChecked: boolean; breached: boolean | null; createdAt: string }
interface Stats { total: number; avgScore: number; byCategory: { category: string; count: number }[] }

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([
        api.get('/analyses', { params: { q: q || undefined, category: category || undefined, page, limit: 8 } }),
        api.get('/analyses/stats'),
      ]);
      setItems(l.data.items); setPages(l.data.pages); setStats(s.data); setErr('');
    } catch (e) { setErr(errorMessage(e)); }
  }, [q, category, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const remove = async (id: string) => { await api.delete(`/analyses/${id}`); load(); };
  const removeAll = async () => { if (confirm('Delete your entire analysis history?')) { await api.delete('/analyses'); setPage(1); load(); } };
  const chart = CATS.map((c) => ({ category: c, count: stats?.byCategory.find((b) => b.category === c)?.count ?? 0 }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><div className="muted">Saved analyses</div><div className="text-3xl font-bold">{stats?.total ?? 0}</div></div>
        <div className="card"><div className="muted">Average score</div><div className="text-3xl font-bold">{stats?.avgScore ?? 0}</div></div>
        <div className="card sm:col-span-1"><div className="muted">Privacy</div><div className="text-sm">History stores scores and patterns only, never passwords.</div></div>
      </div>
      <div className="card" style={{ height: 260 }}>
        <h2 className="mb-2 font-semibold">Strength distribution</h2>
        <ResponsiveContainer width="100%" height="85%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="category" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#10b981" /></BarChart></ResponsiveContainer>
      </div>
      <div className="card space-y-3">
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="q">Search by label</label>
          <input id="q" className="input max-w-xs" placeholder="Search labels" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <label className="sr-only" htmlFor="cat">Filter by category</label>
          <select id="cat" className="input max-w-[180px]" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">All categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <button className="btn-ghost ml-auto" onClick={removeAll}>Delete all</button>
        </div>
        {err && <p className="err" role="alert">{err}</p>}
        {items.length === 0 ? <p className="muted">No saved analyses yet. Run one in the analyzer and click “Save result”.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="muted"><th className="py-2">Label</th><th>Score</th><th>Category</th><th>Length</th><th>Breach</th><th>Date</th><th><span className="sr-only">Delete</span></th></tr></thead>
            <tbody>{items.map((i) => (
              <tr key={i._id} className="border-t border-slate-200 dark:border-slate-800"><td className="py-2">{i.label || '—'}</td><td>{i.score}</td><td>{i.category}</td><td>{i.length}</td><td>{i.breachChecked ? (i.breached ? 'Breached' : 'Not found') : 'Not checked'}</td><td>{new Date(i.createdAt).toLocaleDateString()}</td>
                <td><button className="btn-ghost !min-h-[36px] !px-2" onClick={() => remove(i._id)} aria-label={`Delete analysis ${i.label || i.score}`}><Trash2 size={16} /></button></td></tr>
            ))}</tbody></table></div>
        )}
        <div className="flex items-center justify-between"><button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="muted">Page {page} of {pages}</span><button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>
      </div>
    </div>
  );
}
