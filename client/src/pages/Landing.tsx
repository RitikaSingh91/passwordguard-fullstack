import { EyeOff, Fingerprint, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: EyeOff, title: 'Local analysis', text: 'Your password is analyzed in your browser and never sent to our server.' },
  { icon: Fingerprint, title: 'Pattern detection', text: 'Dictionary words, keyboard walks, dates, repeats and leetspeak.' },
  { icon: Globe, title: 'Private breach check', text: 'Optional k-anonymity lookup: only a 5-character hash prefix is sent.' },
];
const faq = [
  ['Is my password sent anywhere?', 'No. Scoring happens locally. Only if you opt in to the breach check is a 5-character hash prefix sent to Have I Been Pwned.'],
  ['How accurate are the crack times?', 'They are rough illustrations under assumed attack speeds, not predictions or guarantees.'],
  ['Should I test my real password?', 'A safer habit is to test a similar password with the same structure.'],
];

export default function Landing() {
  return (
    <div className="space-y-16">
      <section className="max-w-3xl">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Understand How Secure Your Password Really Is.</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Discover predictable patterns, estimate password guessability, and check known breach exposure with a privacy-first security analyzer.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link to="/analyze" className="btn">Analyze Password</Link><a href="#how" className="btn-ghost">Learn More</a></div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {features.map(({ icon: I, title, text }) => (
          <div key={title} className="card"><I className="mb-2 text-emerald-500" aria-hidden="true" /><h2 className="font-semibold">{title}</h2><p className="muted mt-1">{text}</p></div>
        ))}
      </section>
      <section id="how">
        <h2 className="mb-4 text-2xl font-bold">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {['Type locally', 'See the weaknesses', 'Improve it'].map((t, i) => (
            <div key={t} className="card"><div className="text-3xl font-bold text-emerald-500">{i + 1}</div><div className="font-semibold">{t}</div></div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2 className="mb-2 text-2xl font-bold">Privacy &amp; security</h2>
        <p className="muted">The password is analyzed entirely in your browser. It is never stored in cookies, storage or URLs. The optional breach check hashes it locally with SHA-1 (required by the lookup protocol, not a storage method) and sends only the first 5 hex characters. K-anonymity reduces disclosure but does not eliminate every privacy risk. No certifications or guarantees are claimed.</p>
      </section>
      <section>
        <h2 className="mb-2 text-2xl font-bold">FAQ</h2>
        {faq.map(([q, a]) => (
          <details key={q} className="border-b border-slate-200 py-3 dark:border-slate-800"><summary className="cursor-pointer font-semibold">{q}</summary><p className="muted mt-2">{a}</p></details>
        ))}
      </section>
    </div>
  );
}
