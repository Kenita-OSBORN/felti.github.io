'use client';

import { useEffect, useState } from 'react';

import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dottiApi } from '@/lib/dotti-api';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mode') === 'register') {
      setMode('register');
    }
  }, []);

  const submit = async () => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'register') {
        await dottiApi.register({ name, email, password, confirmPassword });
      } else if (mode === 'forgot') {
        await dottiApi.resetPassword({ email });
        setMessage('If this email exists, a password reset link has been sent.');
        return;
      } else {
        await dottiApi.login({ email, password });
      }
      const next = new URLSearchParams(window.location.search).get('returnTo') || '/account';
      window.location.href = next;
    } catch (event) {
      setError(event instanceof Error ? event.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title={mode === 'login' ? 'Log in' : mode === 'register' ? 'Register' : 'Reset password'} eyebrow="Account">
      <div className="mt-8 max-w-xl rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
        <div className="grid grid-cols-2 gap-2 rounded-full bg-[var(--dotti-bg)] p-1">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-black transition ${mode === 'login' ? 'bg-white text-[var(--dotti-ink)] shadow-sm' : 'text-[var(--dotti-muted)]'}`}
            onClick={() => {
              setMode('login');
              setError('');
              setMessage('');
            }}
          >
            Log in
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-black transition ${mode === 'register' ? 'bg-white text-[var(--dotti-ink)] shadow-sm' : 'text-[var(--dotti-muted)]'}`}
            onClick={() => {
              setMode('register');
              setError('');
              setMessage('');
            }}
          >
            Sign up
          </button>
        </div>

        {mode === 'register' && (
          <label className="mt-6 block text-sm font-bold">
            Display Name
            <Input className="mt-2 rounded-full" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        )}
        <label className="mt-4 block text-sm font-bold">
          Email
          <Input className="mt-2 rounded-full" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {mode !== 'forgot' && (
          <label className="mt-4 block text-sm font-bold">
            Password
            <Input className="mt-2 rounded-full" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
          </label>
        )}
        {mode === 'register' && (
          <label className="mt-4 block text-sm font-bold">
            Confirm Password
            <Input className="mt-2 rounded-full" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" />
          </label>
        )}
        {error && <p className="mt-4 rounded-3xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
        {message && <p className="mt-4 rounded-3xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p>}
        <Button disabled={busy} onClick={submit} className="mt-6 w-full rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">
          {busy
            ? mode === 'login'
              ? 'Logging in...'
              : mode === 'register'
                ? 'Creating account...'
                : 'Sending reset link...'
            : mode === 'login'
              ? 'Log in'
              : mode === 'register'
                ? 'Create account'
                : 'Send reset link'}
        </Button>
        <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm font-bold text-[var(--dotti-berry)]">
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Create a new account' : 'Back to log in'}
          </button>
          {mode === 'login' && (
            <button type="button" onClick={() => setMode('forgot')}>
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </PageShell>
  );
}
