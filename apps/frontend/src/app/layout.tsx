import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

// Space Grotesk for headings — technical, slightly mechanical geometry that
// suits equipment/engineering software without tipping into novelty.
// Inter for body copy — neutral, highly legible at small sizes for data-dense tables.
// JetBrains Mono for equipment tags/serial numbers/status codes.
const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'] });
const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body' });
const monoFont = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'Lift Management SaaS',
  description: 'Enterprise Lift Installation & AMC Management Platform'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
