import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, errorMessage } from '../lib/api';

interface AdminStats { users: number; analyses: number; byCategory: { category: string; count: number }[]; daily: { date: string; count: number }[]; breachChecks: { breached: boolean; count: number }[] }
interface U { _id: string; name: string; email: string; role: string; createdAt: string }

export default function Admin() {
  const [s, setS] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<U[]>([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/users')]).then(([a, b]) => { setS(a.data); setUsers(b.data.users); }).catch((e) => setErr(errorMessage(e)));
  }, []);
  if (err) return <p className="err" role="alert">{err}</p>;
  if (!s) return <p className="muted">Loading…</p>;
  const breached = s.breachChecks.find((b) => b.breached)?.count ?? 0;
  const clean = s.breachChecks.find((b) => !b.breached)?.count ?? 0;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin analytics</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        {[['Users', s.users], ['Analyses saved', s.analyses], ['Breach checks: found', breached], ['Breach checks: clean', clean]].map(([l, v]) => (
          <div key={l} className="card"><div className="muted">{l}</div><div className="text-3xl font-bold">{v}</div></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card" style={{ height: 280 }}><h2 className="mb-2 font-semibold">By strength category</h2><ResponsiveContainer width="100%" height="85%"><BarChart data={s.byCategory}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="category" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#10b981" /></BarChart></ResponsiveContainer></div>
        <div className="card" style={{ height: 280 }}><h2 className="mb-2 font-semibold">Analyses per day (30 days)</h2><ResponsiveContainer width="100%" height="85%"><LineChart data={s.daily}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Line dataKey="count" stroke="#10b981" /></LineChart></ResponsiveContainer></div>
      </div>
      <div className="card overflow-x-auto"><h2 className="mb-2 font-semibold">Recent users</h2><table className="w-full text-left text-sm"><thead><tr className="muted"><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>{users.map((u) => <tr key={u._id} className="border-t border-slate-200 dark:border-slate-800"><td className="py-2">{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>
    </div>
  );
}
