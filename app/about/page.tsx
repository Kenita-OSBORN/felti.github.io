import { PageShell } from '@/components/common/page-shell';

export default function AboutPage() {
  return (
    <PageShell title="About Felti" eyebrow="Our Story">
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
          <h2 className="text-2xl font-black">Our Story</h2>
          <p className="mt-3 text-lg leading-8 text-[var(--dotti-muted)]">
            Felti helps people express personality through handmade and customizable felt accessories. Every design starts as a small idea, then becomes a soft piece that can live on a cardigan, tote, hat, or gift box.
          </p>
        </section>
        <section className="rounded-[32px] bg-[var(--dotti-blush)] p-8">
          <h2 className="text-2xl font-black">Our Idea</h2>
          <div className="mt-4 grid gap-3">
            {['Handmade products', 'DIY creativity', 'Fashion customization', 'Online interactive design'].map((item) => (
              <div key={item} className="rounded-full bg-white/75 px-5 py-3 font-bold">{item}</div>
            ))}
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[var(--dotti-border)]">
        <h2 className="text-2xl font-black">Why Felti</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-5">
          {['Personalization', 'Creativity', 'Handmade feeling', 'Easy online design', 'Unique accessories'].map((item) => (
            <div key={item} className="rounded-3xl bg-[var(--dotti-bg)] p-5 text-center font-black">{item}</div>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-[32px] bg-[var(--dotti-ink)] p-8 text-white">
        <h2 className="text-2xl font-black">How It Works</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {['Design', 'Save', 'Order', 'Handmade', 'Delivery'].map((item, index) => (
            <div key={item} className="rounded-3xl bg-white/10 p-5">
              <p className="text-sm font-black text-white/60">0{index + 1}</p>
              <p className="mt-2 text-xl font-black">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
