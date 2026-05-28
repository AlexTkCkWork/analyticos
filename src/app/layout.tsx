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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    template: "%s | AnalyticOS",
    default: "AnalyticOS — Privacy-first web analytics",
  },
  description:
    "Lightweight, cookie-free web analytics. Track pageviews, visitors, top pages, and referrers without compromising visitor privacy.",
  applicationName: "AnalyticOS",
  authors: [{ name: "Oleksii Tkachenko", url: "https://github.com/AlexTkCkWork" }],
  keywords: [
    "web analytics",
    "privacy",
    "cookieless",
    "open source",
    "self-hosted",
    "GDPR",
    "Plausible alternative",
  ],
  openGraph: {
    type: "website",
    siteName: "AnalyticOS",
    title: "AnalyticOS — Privacy-first web analytics",
    description:
      "Lightweight, cookie-free web analytics. Self-hostable, open-source.",
    url: APP_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AnalyticOS — Privacy-first web analytics",
    description:
      "Lightweight, cookie-free web analytics. Self-hostable, open-source.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
          lang="en"
          style={{ colorScheme: 'light' }}
          className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
          <body className="min-h-full flex flex-col">{children}</body>
      </html>
  );
}
