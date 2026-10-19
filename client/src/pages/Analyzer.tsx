import { Eye, EyeOff, Loader2, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Gauge } from '../components/Gauge';
import { analyzePassword } from '../lib/analyzer';
import { BreachResult, checkBreach } from '../lib/analyzer/breach';
import { api, errorMessage } from '../lib/api';

const breachErrors = { 'rate-limited': 'The breach service is rate-limiting requests. Try again shortly.', offline: 'You appear to be offline.', unavailable: 'The breach service is unavailable right now.', cancelled: 'Check cancelled.' } as const;

export default function Analyzer() {
  const { user } = useAuth();
  // The password lives ONLY in this component's state. It is never persisted or sent to our API.
  const [pw, setPw] = useState('');
  const [debounced, setDebounced] = useState('');
  const [show, setShow] = useState(false);
  const [personal, setPersonal] = useState('');
  const [consent, setConsent] = useState(false);
  const [breach, setBreach] = useState<BreachResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [label, setLabel] = useState('');
  const [saved, setSaved] = useState('');
  const abort = useRef<AbortController | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(pw), 150); return () => clearTimeout(t); }, [pw]);
  useEffect(() => () => abort.current?.abort(), []); // cancel on navigate away; state is discarded on unmount
  useEffect(() => { setBreach(null); setSaved(''); }, [pw]);

  const words = useMemo(() => personal.split(',').map((w) => w.trim()).filter(Boolean), [personal]);
  const r = useMemo(() => analyzePassword(debounced, words), [debounced, words]);

  const clear = () => { setPw(''); setDebounced(''); setBreach(null); setShow(false); abort.current?.abort(); };
  const runBreach = async () => {
    abort.current?.abort();
    abort.current = new AbortController();
    setChecking(true);
    setBreach(await checkBreach(pw, { signal: abort.current.signal }));
    setChecking(false);
  };
  const save = async () => {
    try {
      // Metadata only: the password and its hash are never included.
      await api.post('/analyses', {
        label: label || undefined, score: r.score, category: r.category, guessesLog10: Math.min(400, r.guessesLog10),
        length: r.length, patterns: r.patterns.map((p) => p.type), breachChecked: breach?.status === 'breached' || breach?.status === 'safe',
        breached: breach?.status === 'breached' ? true : breach?.status === 'safe' ? false : null,
      });
      setSaved('Saved to your history (metadata only, not the password).');
    } catch (e) { setSaved(errorMessage(e)); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card space-y-4" aria-labelledby="a-h">
        <h1 id="a-h" className="text-2xl font-bold">Password analyzer</h1>
        <div>
          <label htmlFor="pw" className="mb-1 block text-sm font-medium">Password to analyze</label>
          <div className="flex gap-2">
            <input id="pw" className="input" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" spellCheck={false} placeholder="Type a password to test" />
            <button className="btn-ghost" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            <button className="btn-ghost" onClick={clear} aria-label="Clear password"><Trash2 size={18} /></button>
          </div>
          <p className="muted mt-1">Analyzed locally. Never sent, stored or logged.</p>
        </div>
        <Gauge score={r.score} category={pw ? r.category : 'Enter a password'} />
        {r.attackTimes.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {r.attackTimes.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800" title={t.note}>
                <div className="muted">{t.label}</div><div className="font-semibold">{t.human}</div>
              </div>
            ))}
          </div>
        )}
        <p className="muted">Illustrative estimates only. Real cracking time depends on attacker hardware, strategy, the hashing algorithm and rate limits.</p>
        <details><summary className="muted cursor-pointer">Optional: add personal words to check (stays in your browser)</summary>
          <label htmlFor="pers" className="sr-only">Personal words, comma separated</label>
          <input id="pers" className="input mt-2" value={personal} onChange={(e) => setPersonal(e.target.value)} placeholder="e.g. your name, pet, city" autoComplete="off" />
        </details>
      </section>

      <section className="space-y-4">
        <div className="card">
          <h2 className="mb-2 font-semibold">Detected patterns</h2>
          {r.patterns.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{r.patterns.map((p, i) => <li key={i}>{p.label}</li>)}</ul> : <p className="muted">{pw ? 'No common patterns found.' : 'None yet.'}</p>}
          {r.warning && <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">{r.warning}</p>}
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">Security checklist</h2>
          <ul className="space-y-1 text-sm">{r.checklist.map((c) => <li key={c.label}><span aria-hidden="true" className={c.pass ? 'text-emerald-500' : 'text-red-500'}>{c.pass ? '✓' : '✗'}</span> {c.label}<span className="sr-only">: {c.pass ? 'pass' : 'fail'}</span></li>)}</ul>
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold">Suggestions</h2>
          {pw ? <ul className="list-disc space-y-1 pl-5 text-sm">{r.suggestions.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="muted">Start typing to see tips.</p>}
        </div>
        <div className="card space-y-3">
          <h2 className="font-semibold">Breach check (optional)</h2>
          <p className="muted">Uses the Have I Been Pwned range API. Your browser hashes the password with SHA-1 (required by the protocol, not a storage method) and sends only the first 5 characters of the hash. K-anonymity reduces disclosure but does not eliminate every privacy risk. Nothing is sent unless you click the button.</p>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I understand and want to run the breach check.</label>
          <button className="btn" disabled={!consent || !pw || checking} onClick={runBreach}>{checking && <Loader2 className="animate-spin" size={16} aria-hidden="true" />} Check breach exposure</button>
          <div role="status" aria-live="polite" className="text-sm">
            {breach?.status === 'breached' && <p className="font-semibold text-red-600 dark:text-red-400">Found in {breach.count.toLocaleString()} known breaches. Do not use this password.</p>}
            {breach?.status === 'safe' && <p className="text-emerald-700 dark:text-emerald-400">Not found in known breaches. That doesn’t guarantee it’s strong.</p>}
            {breach?.status === 'error' && <p className="text-amber-700 dark:text-amber-400">{breachErrors[breach.reason]}</p>}
          </div>
        </div>
        {user && pw && (
          <div className="card space-y-2">
            <h2 className="font-semibold">Save to history</h2>
            <label htmlFor="lab" className="muted block">Optional label (never type the password here)</label>
            <input id="lab" className="input" maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Email account test" />
            <button className="btn" onClick={save}><Save size={16} aria-hidden="true" /> Save result</button>
            {saved && <p className="muted" role="status">{saved}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
