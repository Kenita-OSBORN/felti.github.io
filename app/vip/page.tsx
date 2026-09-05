'use client';

import { Crown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PageShell } from '@/components/common/page-shell';
import { Button } from '@/components/ui/button';
import { membershipPlan } from '@/data/mock-commerce';
import { dottiApi } from '@/lib/dotti-api';
import type { DottiUser } from '@/types/commerce';

export default function VIPPage() {
  const [user, setUser] = useState<DottiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dottiApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const joinVip = async () => {
    setError('');
    if (!user) {
      window.location.href = '/login?returnTo=/vip';
      return;
    }
    setJoining(true);
    try {
      const { order } = await dottiApi.createVipOrder();
      window.location.href = `/payment?order=${order.id}&purpose=vip`;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'VIP checkout could not be started. Please try again.');
    } finally {
      setJoining(false);
    }
  };
  const isVipActive = user?.membershipStatus === 'Active' && (user.role === 'vip' || user.role === 'admin');

  return (
    <PageShell title="Felti VIP Membership" eyebrow="Membership">
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <h2 className="text-3xl font-black">Free Account</h2>
          <ul className="mt-5 space-y-3 text-[var(--dotti-muted)]">
            {['Basic DIY tools', 'Free decorations', 'Save designs', 'Purchase products'].map((item) => <li key={item} className="rounded-2xl bg-[var(--dotti-bg)] px-4 py-3">{item}</li>)}
          </ul>
        </section>
        <section className="rounded-[32px] bg-[var(--dotti-ink)] p-8 text-white shadow-[var(--dotti-shadow)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--dotti-gold)] px-4 py-2 text-sm font-black text-[var(--dotti-brown)]">
            <Crown className="size-4" />
            {membershipPlan.priceLabel}
          </div>
          <h2 className="mt-5 text-3xl font-black">{membershipPlan.name}</h2>
          <p className="mt-2 text-white/70">{membershipPlan.duration}</p>
          <ul className="mt-5 space-y-3">
            {membershipPlan.benefits.map((item) => <li key={item} className="rounded-2xl bg-white/10 px-4 py-3">{item}</li>)}
          </ul>
          <Button disabled={loading || joining || isVipActive} onClick={() => void joinVip()} className="mt-6 rounded-full bg-white px-6 text-[var(--dotti-ink)] hover:bg-[var(--dotti-cream)]">
            {loading ? 'Checking...' : joining ? 'Opening payment...' : isVipActive ? 'VIP Active' : 'Join VIP'}
          </Button>
          {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
        </section>
      </div>
    </PageShell>
  );
}
