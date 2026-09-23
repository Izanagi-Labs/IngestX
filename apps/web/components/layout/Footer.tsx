import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background text-foreground-subtle py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm">
          &copy; {new Date().getFullYear()} IngestX. Open source under the MIT License.
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
          <a href="https://github.com/ParallelBytes/IngestX" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          <a href="https://www.npmjs.com/package/@parallelbytes/ingestx" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">npm</a>
        </div>
      </div>
    </footer>
  );
}
