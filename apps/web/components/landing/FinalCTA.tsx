import { Container } from "../layout/Container";
import { Button } from "../ui/Button";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="py-24 bg-surface-muted/30">
      <Container variant="content" className="text-center space-y-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Ready to ingest?
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/docs">
            <Button variant="primary" size="md" className="min-w-[140px]">
              Read the docs
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="secondary" size="md" className="min-w-[140px]">
              Try the demo
            </Button>
          </Link>
        </div>
        <div className="mt-8 pt-8">
          <code className="text-foreground-muted text-sm font-mono">
            pnpm add @izanagi-labs/ingestx
          </code>
        </div>
      </Container>
    </section>
  );
}
