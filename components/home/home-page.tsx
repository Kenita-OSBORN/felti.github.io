import { Heart, LockKeyhole, Sparkles } from 'lucide-react';

import { AccessoryPreview } from '@/components/home/accessory-preview';
import { SiteHeader } from '@/components/layout/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { featuredDesigns, featuredProducts } from '@/data/assets';

export function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--dotti-bg)] text-[var(--dotti-ink)]">
      <SiteHeader />

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8 lg:py-16">
        <div className="space-y-7">
          <Badge className="rounded-full bg-[var(--dotti-cream)] px-4 py-1.5 text-[var(--dotti-brown)] hover:bg-[var(--dotti-cream)]">
            Handmade felt accessories
          </Badge>
          <div className="max-w-3xl space-y-5">
            <h1 className="text-5xl font-black leading-[1.03] tracking-normal sm:text-6xl lg:text-7xl">
              Create something that feels like you.
            </h1>
            <p className="max-w-xl text-xl leading-8 text-[var(--dotti-muted)]">
              Design your own cute felt accessory with Dotti.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button render={<a href="/diy" />} size="lg" className="rounded-full bg-[var(--dotti-berry)] px-6 text-white hover:bg-[var(--dotti-berry-dark)]">
              <Sparkles className="size-5" />
              Start Designing
            </Button>
            <Button render={<a href="/gallery" />} size="lg" variant="outline" className="rounded-full border-[var(--dotti-border)] bg-white px-6">
              Explore Designs
            </Button>
          </div>
        </div>

        <div className="relative min-h-[420px] rounded-[32px] border border-[var(--dotti-border)] bg-white p-8 shadow-[var(--dotti-shadow)]">
          <div className="absolute right-8 top-8 rounded-full bg-[var(--dotti-mint)] px-4 py-2 text-sm font-bold text-[var(--dotti-ink)]">
            Brooch draft
          </div>
          <div className="grid h-full place-items-center">
            <div className="relative aspect-square w-full max-w-[360px] rounded-full bg-[var(--dotti-felt)] shadow-inner">
              <img src="/hero-daisy.svg" alt="Felt flower brooch mockup" className="absolute left-[18%] top-[15%] w-[38%] rotate-[-12deg] drop-shadow-md" />
              <img src="/hero-heart.svg" alt="" className="absolute right-[16%] top-[33%] w-[34%] rotate-[13deg] drop-shadow-md" />
              <img src="/hero-leaf.svg" alt="" className="absolute bottom-[15%] left-[30%] w-[38%] rotate-[20deg] drop-shadow-md" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black">Featured Designs</h2>
            <p className="mt-2 text-[var(--dotti-muted)]">Soft little ideas from the Dotti table.</p>
          </div>
          <Button render={<a href="/gallery" />} variant="ghost" className="rounded-full">
            View all
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featuredDesigns.map((design) => (
            <Card key={design.name} className="overflow-hidden rounded-3xl border-[var(--dotti-border)] bg-white shadow-sm">
              <CardContent className="p-5">
                <AccessoryPreview assetIds={design.assetIds} />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{design.name}</h3>
                    <p className="text-sm text-[var(--dotti-muted)]">by {design.creator}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label={`Favorite ${design.name}`}>
                    <Heart className="size-5" />
                  </Button>
                </div>
                <Button variant="outline" className="mt-4 w-full rounded-full border-[var(--dotti-border)]">View</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-[var(--dotti-blush)] py-12">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            ['Choose', 'Choose cute decorations.'],
            ['Create', 'Arrange them freely in your own design.'],
            ['Make It Yours', 'Save or order your personalized accessory.'],
          ].map(([title, text], index) => (
            <div key={title} className="rounded-3xl bg-white/75 p-7 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--dotti-berry)] font-black text-white">
                {index + 1}
              </span>
              <h3 className="mt-5 text-2xl font-black">{title}</h3>
              <p className="mt-2 text-[var(--dotti-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black">Featured Products</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <Card key={product.name} className="rounded-3xl border-[var(--dotti-border)] bg-white shadow-sm">
              <CardContent className="p-5">
                <AccessoryPreview assetIds={product.assetIds} />
                <h3 className="mt-4 font-black">{product.name}</h3>
                <p className="mt-1 text-sm font-bold text-[var(--dotti-berry)]">{product.price}</p>
                <Button variant="outline" className="mt-4 w-full rounded-full border-[var(--dotti-border)]">View</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 rounded-[32px] bg-[var(--dotti-ink)] p-8 text-white sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-bold">
              <LockKeyhole className="size-4" />
              VIP
            </div>
            <h2 className="text-3xl font-black">Unlock more ways to create.</h2>
            <p className="mt-2 text-white/72">VIP members will be able to access exclusive decorations and design resources.</p>
          </div>
          <Button render={<a href="/vip" />} className="rounded-full bg-white px-6 text-[var(--dotti-ink)] hover:bg-[var(--dotti-cream)]">
            Explore VIP
          </Button>
        </div>
      </section>
    </main>
  );
}
