import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme/ThemeProvider";
import { RootProvider } from "fumadocs-ui/provider/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ingestx.vercel.app"),
  title: {
    template: "%s | IngestX",
    default: "IngestX - Headless CSV & Excel Ingestion",
  },
  description: "Headless, type-safe CSV and Excel ingestion for TypeScript, React, and Node.js. High-performance, chunked validation for large files.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "IngestX",
    description: "Headless, type-safe CSV and Excel ingestion for TypeScript, React, and Node.js.",
    url: "https://ingestx.vercel.app",
    siteName: "IngestX",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IngestX",
    description: "Headless, type-safe CSV and Excel ingestion for TypeScript.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RootProvider theme={{ enabled: false }}>
            {children}
          </RootProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
