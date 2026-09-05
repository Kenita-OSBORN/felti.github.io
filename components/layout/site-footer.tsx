export function SiteFooter() {
  const links = ['About Felti', 'Gallery', 'Shop', 'VIP', 'Terms'];
  return (
    <footer className="dotti-footer border-t border-[var(--dotti-border)] bg-white/70">
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-xl font-black text-[var(--dotti-ink)]">Felti</p>
          <p className="mt-1 text-sm text-[var(--dotti-muted)]">Handmade accessories, shaped by you.</p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm font-bold text-[var(--dotti-muted)]" aria-label="Footer">
          {links.map((link) => (
            <a key={link} href={link === 'About Felti' ? '/about' : link === 'Gallery' ? '/gallery' : link === 'Shop' ? '/shop' : link === 'VIP' ? '/vip' : '#'} className="hover:text-[var(--dotti-berry)]">{link}</a>
          ))}
        </nav>
        <div className="text-sm font-bold text-[var(--dotti-muted)]">
          <p className="font-black text-[var(--dotti-ink)]">Contact Us</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[var(--dotti-berry)]">
            <a href="mailto:yuexi_h@cmu.ac.th">yuexi_h@cmu.ac.th</a>
            <a href="mailto:lan_s@cmu.ac.th">lan_s@cmu.ac.th</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
