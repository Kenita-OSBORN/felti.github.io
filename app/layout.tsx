import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Felti',
  description: 'Create cute handmade felt accessory designs with Felti.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
