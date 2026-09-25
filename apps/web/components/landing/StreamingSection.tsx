import { Container } from "../layout/Container";
import { Database, Zap, HardDrive } from "lucide-react";

export function StreamingSection() {
  return (
    <section className="py-24 border-b border-border bg-surface-muted/30">
      <Container variant="standard">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Built for Serious Workloads
          </h2>
          <p className="text-lg text-foreground-muted">
            IngestX is engineered to process massive datasets efficiently, bypassing typical browser memory limitations through chunked execution.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-surface border border-border rounded-xl shadow-sm">
            <Zap className="w-8 h-8 text-warning mb-4" />
            <h3 className="font-semibold text-foreground text-lg mb-2">Chunked Processing</h3>
            <p className="text-foreground-muted text-sm">
              Files are processed in manageable chunks, ensuring the main thread remains unblocked and responsive during ingestion.
            </p>
          </div>
          
          <div className="p-6 bg-surface border border-border rounded-xl shadow-sm">
            <HardDrive className="w-8 h-8 text-info mb-4" />
            <h3 className="font-semibold text-foreground text-lg mb-2">Memory Conscious</h3>
            <p className="text-foreground-muted text-sm">
              CSV ingestion scales incrementally, avoiding the need to load the entire dataset into memory at once.
            </p>
          </div>
          
          <div className="p-6 bg-surface border border-border rounded-xl shadow-sm">
            <Database className="w-8 h-8 text-success mb-4" />
            <h3 className="font-semibold text-foreground text-lg mb-2">Bounded Collection</h3>
            <p className="text-foreground-muted text-sm">
              Supports bounded result accumulation or external flushing, allowing you to process multi-gigabyte files securely.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
