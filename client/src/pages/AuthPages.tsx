import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../auth/AuthContext';
import { api, errorMessage } from '../lib/api';

const email = z.string().trim().email('Enter a valid email');
// This is the ACCOUNT password (sent to the server over HTTPS and hashed with Argon2id),
// unlike passwords typed into the analyzer, which never leave the browser.
const newPassword = z.string().min(12, 'Use at least 12 characters').max(128);

export const registerSchema = z.object({ name: z.string().trim().min(2, 'Enter your name').max(60), email, password: newPassword, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });
const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password') });
const forgotSchema = z.object({ email });
const resetSchema = z.object({ password: newPassword, confirm: z.string() }).refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

function Shell({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return <div className="card mx-auto max-w-md space-y-4"><h1 className="text-2xl font-bold">{title}</h1>{children}{footer && <p className="muted">{footer}</p>}</div>;
}
function Field({ id, label, error, ...p }: { id: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <div><label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label><input id={id} className="input" aria-invalid={!!error} {...p} />{error && <p className="err" role="alert">{error}</p>}</div>;
}

export function Register() {
  const { register: signUp } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const f = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema) });
  const submit = f.handleSubmit(async (d) => {
    setErr('');
    try { await signUp(d.name, d.email, d.password); nav('/dashboard'); } catch (e) { setErr(errorMessage(e)); }
  });
  return (
    <Shell title="Create your account" footer={<>Already registered? <Link className="underline" to="/login">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field id="name" label="Name" autoComplete="name" error={f.formState.errors.name?.message} {...f.register('name')} />
        <Field id="email" label="Email" type="email" autoComplete="email" error={f.formState.errors.email?.message} {...f.register('email')} />
        <Field id="password" label="Password (12+ characters)" type="password" autoComplete="new-password" error={f.formState.errors.password?.message} {...f.register('password')} />
        <Field id="confirm" label="Confirm password" type="password" autoComplete="new-password" error={f.formState.errors.confirm?.message} {...f.register('confirm')} />
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn w-full" disabled={f.formState.isSubmitting}>Create account</button>
      </form>
    </Shell>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const f = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const submit = f.handleSubmit(async (d) => {
    setErr('');
    try { await login(d.email, d.password); nav('/dashboard'); } catch (e) { setErr(errorMessage(e)); }
  });
  return (
    <Shell title="Log in" footer={<><Link className="underline" to="/forgot-password">Forgot password?</Link> · <Link className="underline" to="/register">Create account</Link></>}>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field id="email" label="Email" type="email" autoComplete="email" error={f.formState.errors.email?.message} {...f.register('email')} />
        <Field id="password" label="Password" type="password" autoComplete="current-password" error={f.formState.errors.password?.message} {...f.register('password')} />
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn w-full" disabled={f.formState.isSubmitting}>Log in</button>
      </form>
    </Shell>
  );
}

export function Forgot() {
  const [msg, setMsg] = useState('');
  const f = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });
  const submit = f.handleSubmit(async (d) => {
    try { setMsg((await api.post('/auth/forgot-password', d)).data.message); } catch (e) { setMsg(errorMessage(e)); }
  });
  return (
    <Shell title="Reset your password">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field id="email" label="Email" type="email" error={f.formState.errors.email?.message} {...f.register('email')} />
        <button className="btn w-full" disabled={f.formState.isSubmitting}>Send reset link</button>
      </form>
      {msg && <p className="muted" role="status">{msg}</p>}
    </Shell>
  );
}

export function Reset() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [msg, setMsg] = useState('');
  const f = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  const submit = f.handleSubmit(async (d) => {
    try { await api.post('/auth/reset-password', { token: params.get('token') ?? '', password: d.password }); nav('/login'); } catch (e) { setMsg(errorMessage(e)); }
  });
  return (
    <Shell title="Choose a new password">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field id="password" label="New password (12+ characters)" type="password" autoComplete="new-password" error={f.formState.errors.password?.message} {...f.register('password')} />
        <Field id="confirm" label="Confirm password" type="password" autoComplete="new-password" error={f.formState.errors.confirm?.message} {...f.register('confirm')} />
        {msg && <p className="err" role="alert">{msg}</p>}
        <button className="btn w-full" disabled={f.formState.isSubmitting}>Update password</button>
      </form>
    </Shell>
  );
}
