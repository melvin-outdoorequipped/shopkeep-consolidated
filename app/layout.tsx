import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TARA | Listing Ops Tools",
  description: "Advanced tools for Amazon listing operations",
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
      suppressHydrationWarning // Prevents flicker during hydration
    >
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
        {/* We keep the layout shell here */}
        {children}
      </body>
    </html>
  );
}