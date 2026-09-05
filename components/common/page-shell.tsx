import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export function PageShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--dotti-bg)] text-[var(--dotti-ink)]">
      <SiteHeader />
      <section className="page-screen mx-auto flex w-full max-w-7xl flex-col justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div>
          {eyebrow && <p className="text-sm font-black uppercase text-[var(--dotti-berry)]">{eyebrow}</p>}
          <h1 className="mt-2 text-4xl font-black tracking-normal sm:text-5xl">{title}</h1>
          {children}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
