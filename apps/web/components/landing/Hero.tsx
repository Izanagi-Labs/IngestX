import { Container } from "../layout/Container";
import { Button } from "../ui/Button";
import { CopyButton } from "../ui/CopyButton";
import Link from "next/link";
import { IngestionPipeline } from "./IngestionPipeline";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background pt-24 pb-16 md:pt-32 md:pb-24">
      <Container variant="wide" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="flex flex-col items-start space-y-8 text-left">
            <div className="inline-flex items-center rounded-full border border-border bg-surface-muted px-3 py-1 text-sm font-medium text-foreground-muted">
              v1.0.4 Now Available
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Type-safe CSV & Excel <br className="hidden lg:inline" />
                ingestion for TypeScript.
              </h1>
              <p className="text-xl text-foreground-muted max-w-[600px] leading-relaxed">
                Parse, validate, and process massive datasets through one headless pipeline. Bring your own UI, we handle the heavy lifting.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/docs" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full">
                  Get Started
                </Button>
              </Link>
              <Link href="/demo" className="w-full sm:w-auto">
                <Button variant="secondary" size="md" className="w-full">
                  Try Demo
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4 text-sm mt-4">
              <code className="relative rounded-md bg-code-background border border-code-border px-4 py-2.5 font-mono text-sm text-foreground flex items-center justify-between min-w-[280px]">
                <span>pnpm add @izanagi-labs/ingestx</span>
                <CopyButton value="pnpm add @izanagi-labs/ingestx" className="ml-4 -mr-2" />
              </code>
            </div>
          </div>
          
          <div className="relative w-full h-[400px] lg:h-[500px] max-w-[600px] mx-auto lg:ml-auto flex items-center justify-center">
            <IngestionPipeline />
          </div>
        </div>
      </Container>
    </section>
  );
}
