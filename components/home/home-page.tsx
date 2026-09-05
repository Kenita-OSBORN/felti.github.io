'use client';

import { Heart, Paintbrush, PackageCheck, Shapes, Sparkles } from 'lucide-react';

import { AccessoryPreview } from '@/components/home/accessory-preview';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { galleryDesigns, products } from '@/data/mock-commerce';

export function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--dotti-bg)] text-[var(--dotti-ink)]">
      <SiteHeader />

      <div className="snap-page">
        <section className="home-snap-section">
          <div className="mx-auto grid h-full w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="flex items-end pb-[9vh] pt-10 lg:pb-[12vh]">
              <div className="max-w-3xl space-y-8">
                <div className="space-y-6">
                  <h1 className="max-w-[780px] text-6xl font-black leading-[1.1] tracking-normal sm:text-7xl xl:text-8xl">
                    <span className="block">Create something</span>
                    <span className="block">that feels</span>
                    <span className="block">like you.</span>
                  </h1>
                  <p className="max-w-lg text-xl leading-8 text-[var(--dotti-muted)] sm:text-2xl">
                    Design your own cute felt accessory with Felti.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button render={<a href="/diy" />} size="lg" className="rounded-full bg-[var(--dotti-berry)] px-7 text-white hover:bg-[var(--dotti-berry-dark)]">
                    <Sparkles className="size-5" />
                    Start Designing
                  </Button>
                  <Button render={<a href="/gallery" />} size="lg" variant="outline" className="rounded-full border-[var(--dotti-border)] bg-white px-7">
                    Explore Designs
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative flex min-h-[520px] items-center justify-center py-10">
              <div className="felt-surface absolute right-[4%] top-[12%] h-[64%] w-[78%] rounded-[48%_52%_46%_54%/56%_44%_58%_42%] bg-[var(--dotti-felt)] shadow-[var(--dotti-shadow)]" />
              <img src="/hero-daisy.svg" alt="Felt flower brooch mockup" className="felt-asset absolute left-[18%] top-[16%] w-[34%] max-w-[260px] rotate-[-13deg]" />
              <img src="/hero-heart.svg" alt="" className="felt-asset absolute right-[16%] top-[34%] w-[30%] max-w-[220px] rotate-[12deg]" />
              <img src="/hero-leaf.svg" alt="" className="felt-asset absolute bottom-[14%] left-[32%] w-[32%] max-w-[240px] rotate-[18deg]" />
            </div>
          </div>
        </section>

        <section className="home-snap-section">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-black sm:text-5xl">Featured Designs</h2>
              <p className="mt-3 text-lg text-[var(--dotti-muted)]">Soft little ideas from the Felti table.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {galleryDesigns.slice(0, 3).map((design) => (
                <Card key={design.id} className="overflow-hidden rounded-[28px] border-[var(--dotti-border)] bg-white shadow-sm">
                  <CardContent className="p-5">
                    <AccessoryPreview assetIds={design.assetIds} className="max-w-[240px]" assetClassName="h-[78px] w-[78px]" />
                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">{design.title}</h3>
                        <p className="mt-1 text-sm text-[var(--dotti-muted)]">by {design.creator}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full" aria-label={`Favorite ${design.title}`}>
                        <Heart className="size-5" />
                      </Button>
                    </div>
                    <Button render={<a href={`/gallery/${design.id}`} />} variant="outline" className="mt-4 w-full rounded-full border-[var(--dotti-border)]">View Design</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button render={<a href="/gallery" />} variant="ghost" className="rounded-full text-[var(--dotti-berry)]">
                Explore All Designs →
              </Button>
            </div>
          </div>
        </section>

        <section className="home-snap-section bg-[var(--dotti-blush)]">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
            <div className="mb-14 text-center">
              <h2 className="text-4xl font-black sm:text-5xl">How Felti Works</h2>
            </div>
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {[
                { title: 'Choose', text: 'Choose your felt base and decorations.', icon: Shapes },
                { title: 'Create', text: 'Arrange, move, resize, and personalize your design.', icon: Paintbrush },
                { title: 'Make It Yours', text: 'Order your finished handmade Felti accessory.', icon: PackageCheck },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="contents">
                    <div className="rounded-[28px] bg-white/78 p-8 text-center shadow-sm">
                      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[var(--dotti-felt)] shadow-inner ring-1 ring-[var(--dotti-border)]">
                        <Icon className="size-9 text-[var(--dotti-berry)]" />
                      </div>
                      <p className="mt-7 text-sm font-black uppercase tracking-[0.24em] text-[var(--dotti-berry)]">0{index + 1}</p>
                      <h3 className="mt-3 text-2xl font-black">{step.title}</h3>
                      <p className="mx-auto mt-3 max-w-[260px] text-[var(--dotti-muted)]">{step.text}</p>
                    </div>
                    {index < 2 ? <div className="hidden text-3xl font-black text-[var(--dotti-berry)]/45 md:block">→</div> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="home-snap-section">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black sm:text-5xl">Featured Products</h2>
              </div>
              <Button render={<a href="/shop" />} variant="ghost" className="rounded-full text-[var(--dotti-berry)]">Shop All →</Button>
            </div>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 4).map((product) => (
                <Card key={product.id} className="rounded-[28px] border-[var(--dotti-border)] bg-white shadow-sm">
                  <CardContent className="p-6">
                    <AccessoryPreview assetIds={product.assetIds} className="max-w-[250px]" assetClassName="h-[78px] w-[78px]" />
                    <h3 className="mt-6 text-lg font-black">{product.name}</h3>
                    <p className="mt-2 text-base font-black text-[var(--dotti-berry)]">฿{product.price}</p>
                    <div className="mt-5">
                      <Button render={<a href={`/shop/${product.id}`} />} variant="outline" className="w-full rounded-full border-[var(--dotti-border)]">View Product</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="snap-footer">
          <SiteFooter />
        </section>
      </div>
    </main>
  );
}
