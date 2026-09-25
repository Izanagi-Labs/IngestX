import { Container } from "../layout/Container";
import { CheckCircle2, FileSpreadsheet, PlayCircle, Settings2 } from "lucide-react";

const capabilities = [
  {
    title: "Schema Validation",
    description: "Define exactly what valid data looks like using the built-in, fully typed ix schema builder.",
    icon: CheckCircle2,
  },
  {
    title: "Streaming & Chunking",
    description: "Process massive datasets without freezing the browser or treating everything as one giant result.",
    icon: PlayCircle,
  },
  {
    title: "CSV + Excel",
    description: "Use a single unified ingestion pipeline across common tabular formats (CSV, XLSX, XLS).",
    icon: FileSpreadsheet,
  },
  {
    title: "Lifecycle Control",
    description: "Start, pause, resume, and cancel ingestion on the fly, with precise progress tracking.",
    icon: Settings2,
  }
];

export function Capabilities() {
  return (
    <section className="py-24 border-b border-border bg-surface-muted/30">
      <Container variant="standard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {capabilities.map((capability, idx) => (
            <div key={idx} className="flex flex-col space-y-3">
              <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-primary mb-2 shadow-sm">
                <capability.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{capability.title}</h3>
              <p className="text-foreground-muted text-sm leading-relaxed">
                {capability.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
