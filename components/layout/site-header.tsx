'use client';

import { useEffect, useState } from 'react';
import { Crown, LogOut, Search, ShoppingCart, UserRound } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dottiApi } from '@/lib/dotti-api';
import type { DottiUser } from '@/types/commerce';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'DIY Studio', href: '/diy' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'VIP', href: '/vip' },
];

const accountItems = [
  { label: 'My Profile' },
  { label: 'My Designs' },
  { label: 'My Orders' },
  { label: 'My Uploads' },
  { label: 'VIP Membership' },
];

const cachedUserKey = 'felti-header-user-v1';

export function SiteHeader() {
  const [pathname, setPathname] = useState('/');
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<DottiUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    try {
      const cachedUser = sessionStorage.getItem(cachedUserKey);
      if (cachedUser) {
        setUser(JSON.parse(cachedUser) as DottiUser);
        setAuthReady(true);
      }
    } catch {
      sessionStorage.removeItem(cachedUserKey);
    }

    const sync = async () => {
      setPathname(window.location.pathname);
      try {
        const [{ user }, { items }] = await Promise.all([dottiApi.me(), dottiApi.getCart()]);
        setUser(user);
        if (user) sessionStorage.setItem(cachedUserKey, JSON.stringify(user));
        else sessionStorage.removeItem(cachedUserKey);
        setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        setUser(null);
        sessionStorage.removeItem(cachedUserKey);
        setCartCount(0);
      } finally {
        setAuthReady(true);
      }
    };
    void sync();
    const listener = () => void sync();
    window.addEventListener('dotti-storage', listener);
    return () => window.removeEventListener('dotti-storage', listener);
  }, []);

  const logout = async () => {
    await dottiApi.logout();
    sessionStorage.removeItem(cachedUserKey);
    window.location.href = '/';
  };
  const isVipActive = user?.membershipStatus === 'Active' && (user.role === 'vip' || user.role === 'admin');

  return (
    <header className="sticky top-0 z-40 h-[var(--header-height)] border-b border-[var(--dotti-border)] bg-[rgba(255,251,246,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition-transform duration-200 hover:scale-105 active:scale-100" aria-label="Felti home">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--dotti-pink)] text-xl font-black text-white shadow-[var(--dotti-shadow)]">
            F
          </span>
          <span className="text-2xl font-black tracking-normal text-[var(--dotti-ink)]">
            Felti
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setPathname(item.href)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-100 ${
                  isActive
                    ? 'bg-white text-[var(--dotti-berry)] shadow-sm'
                    : 'text-[var(--dotti-muted)] hover:bg-white/80 hover:text-[var(--dotti-ink)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full transition-transform duration-200 hover:scale-110 active:scale-100" aria-label="Search">
            <Search className="size-5" />
          </Button>
          <Button render={<Link href="/cart" />} variant="ghost" size="icon" className="relative rounded-full transition-transform duration-200 hover:scale-110 active:scale-100" aria-label="Cart">
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--dotti-berry)] px-1 text-[10px] font-black text-white">
                {cartCount}
              </span>
            )}
          </Button>
          {!authReady ? (
            <div className="flex items-center gap-2">
              <span className="hidden h-9 w-20 rounded-full bg-white/70 sm:block" />
              <span className="h-9 w-9 rounded-full bg-[var(--dotti-blush)]" />
            </div>
          ) : !user ? (
            <>
            <Button render={<Link href="/login" />} variant="ghost" size="icon" className="rounded-full transition-transform duration-200 hover:scale-110 active:scale-100 sm:hidden" aria-label="Log In">
              <UserRound className="size-5" />
            </Button>
            <div className="hidden items-center gap-2 sm:flex">
              <Button render={<Link href="/login" />} variant="ghost" className="rounded-full transition-transform duration-200 hover:scale-105 active:scale-100">
                Log In
              </Button>
              <Button render={<Link href="/login?mode=register" />} className="rounded-full bg-[var(--dotti-berry)] text-white transition-transform duration-200 hover:scale-105 hover:bg-[var(--dotti-berry-dark)] active:scale-100">
                Sign Up
              </Button>
            </div>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="rounded-full px-2 transition-transform duration-200 hover:scale-105 active:scale-100" aria-label="User account" />}>
                <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[var(--dotti-blush)] text-sm font-black text-[var(--dotti-berry)]">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}
                </span>
                {isVipActive && <Crown className="size-4 text-[var(--dotti-gold)]" />}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-3xl border-[var(--dotti-border)] bg-white p-2">
                {accountItems.map((item) => (
                  <DropdownMenuItem key={item.label} className="rounded-2xl transition-transform duration-200 hover:scale-[1.02]" render={<Link href={`/account?tab=${encodeURIComponent(item.label)}`} />}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-2xl text-red-600" onClick={logout}>
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
