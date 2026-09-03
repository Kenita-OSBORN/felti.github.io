import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dotti',
  description: 'Create cute handmade felt accessory designs with Dotti.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
