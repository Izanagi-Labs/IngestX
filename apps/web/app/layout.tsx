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
  title: "IngestX",
  description: "Headless CSV & Excel ingestion for TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b border-gray-200 p-4 flex gap-4 items-center bg-gray-50 text-gray-900">
          <h1 className="font-bold text-xl"><a href="/">IngestX</a></h1>
          <nav className="flex gap-6 ml-8 font-medium">
            <a href="/demo" className="hover:text-blue-600 transition-colors">Demo</a>
            <a href="/docs" className="hover:text-blue-600 transition-colors">Docs</a>
            <a href="https://github.com/ParallelBytes/IngestX" className="hover:text-blue-600 transition-colors" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </header>
        <main className="min-h-[80vh] p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <footer className="border-t border-gray-200 p-6 mt-12 text-center text-sm text-gray-500 bg-gray-50">
          © {new Date().getFullYear()} IngestX - High performance headless ingestion.
        </footer>
      </body>
    </html>
  );
}
