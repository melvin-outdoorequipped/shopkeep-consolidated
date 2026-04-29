import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TARA | Listing Ops Tools',
    template: '%s | TARA',
  },
  description: 'Advanced tools for Amazon listing operations.',
  applicationName: 'TARA',
  keywords: [
    'TARA',
    'Listing Ops',
    'Amazon listing tools',
    'SKU processor',
    'ASIN checker',
    'operations dashboard',
  ],
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: '#f9fafb',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#0f172a',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}