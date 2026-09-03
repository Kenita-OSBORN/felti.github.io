'use client';

import { useEffect, useState } from 'react';
import { Search, ShoppingCart, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'DIY Studio', href: '/diy' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'VIP', href: '/vip' },
];

export function SiteHeader() {
  const [pathname, setPathname] = useState('/');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--dotti-border)] bg-[rgba(255,251,246,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3" aria-label="Dotti home">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--dotti-pink)] text-xl font-black text-white shadow-[var(--dotti-shadow)]">
            D
          </span>
          <span className="text-2xl font-black tracking-normal text-[var(--dotti-ink)]">
            Dotti
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white text-[var(--dotti-berry)] shadow-sm'
                    : 'text-[var(--dotti-muted)] hover:bg-white/80 hover:text-[var(--dotti-ink)]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Search">
            <Search className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Cart">
            <ShoppingCart className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Profile">
            <UserRound className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
