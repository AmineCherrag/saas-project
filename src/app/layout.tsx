import type { Metadata } from "next";
import "@/styles/globals.css";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://saas-project-gamma-two.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "TradePulse | Institutional-Grade Trading Journal & Quantitative Performance Analytics",
  description:
    "Master your edge and eliminate emotional leakage. TradePulse delivers 7-dimensional quantitative analytics, automated broker CSV ingestion (Tradovate, TOS, NT8, MT4/5, IBKR), strategy playbooks, and discipline habit tracking.",
  keywords: [
    "trading journal",
    "TradeZella alternative",
    "trading analytics",
    "futures trading journal",
    "prop firm trade tracker",
    "Tradovate CSV import",
    "quant performance analytics",
    "r-multiple calculator",
    "mistake leakage tracker",
  ],
  authors: [{ name: "TradePulse Technologies Inc." }],
  openGraph: {
    title: "TradePulse — Institutional-Grade Trading Journal & Analytics SaaS",
    description:
      "Transform your trading discipline. Deep quant reports, automated multi-broker execution syncing, and emotional mistake cost ledgers.",
    url: appUrl,
    siteName: "TradePulse",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradePulse | Institutional Trading Journal & Analytics",
    description:
      "Master your edge. Quantitative analytics, broker CSV import, and disciplined habit tracking for serious traders.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TradePulse",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "29.00",
    priceCurrency: "USD",
  },
  description:
    "Institutional-grade trading performance analytics and multi-account journal for equities, futures, and forex traders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
