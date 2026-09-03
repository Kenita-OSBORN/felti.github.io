import { SiteHeader } from '@/components/layout/site-header';
import { Button } from '@/components/ui/button';

export function PlaceholderPage({ title, text }: { title: string; text: string }) {
  return (
    <main className="min-h-screen bg-[var(--dotti-bg)] text-[var(--dotti-ink)]">
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-3xl place-items-center px-4 text-center">
        <div>
          <h1 className="text-5xl font-black tracking-normal">{title}</h1>
          <p className="mt-4 text-lg text-[var(--dotti-muted)]">{text}</p>
          <div className="mt-7 flex justify-center gap-3">
            <Button render={<a href="/diy" />} className="rounded-full bg-[var(--dotti-berry)] text-white hover:bg-[var(--dotti-berry-dark)]">
              Start Designing
            </Button>
            <Button render={<a href="/" />} variant="outline" className="rounded-full border-[var(--dotti-border)] bg-white">
              Home
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
