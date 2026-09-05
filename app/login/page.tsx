'use client';

import { useEffect, useState } from 'react';

import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dottiApi } from '@/lib/dotti-api';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mode') === 'register') {
      setMode('register');
    }
  }, []);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') {
        await dottiApi.register({ name, email, password, confirmPassword });
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
    <PageShell title={mode === 'login' ? 'Log in' : 'Register'} eyebrow="Account">
      <div className="mt-8 max-w-xl rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
        {mode === 'register' && (
          <label className="block text-sm font-bold">
            Display Name
            <Input className="mt-2 rounded-full" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        )}
        <label className="mt-4 block text-sm font-bold">
          Email
          <Input className="mt-2 rounded-full" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="mt-4 block text-sm font-bold">
          Password
          <Input className="mt-2 rounded-full" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
        </label>
        {mode === 'register' && (
          <label className="mt-4 block text-sm font-bold">
            Confirm Password
            <Input className="mt-2 rounded-full" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" />
          </label>
        )}
        {error && <p className="mt-4 rounded-3xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
        <Button disabled={busy} onClick={submit} className="mt-6 w-full rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">
          {busy ? (mode === 'login' ? 'Logging in...' : 'Creating account...') : mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
        <button className="mt-4 text-sm font-bold text-[var(--dotti-berry)]" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Register account' : 'I already have an account'}
        </button>
        <p className="mt-5 text-xs leading-5 text-[var(--dotti-muted)]">
          VIP test account: register or log in with vip@felti.test to see VIP-only upload features.
        </p>
      </div>
    </PageShell>
  );
}
