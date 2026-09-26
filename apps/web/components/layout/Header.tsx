import Link from "next/link";
import { ThemeToggle } from "../theme/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold inline-block text-lg text-foreground">IngestX</span>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6">
              <Link
                href="/docs"
                className="flex items-center text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
              >
                Docs
              </Link>
              <Link
                href="/demo"
                className="flex items-center text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
              >
                Demo
              </Link>
              <a
                href="https://github.com/Izanagi-Labs/IngestX"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
              >
                GitHub
              </a>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
