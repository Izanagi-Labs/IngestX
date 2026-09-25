import { Container } from "../layout/Container";
import { Server, Globe, Braces } from "lucide-react";

const runtimes = [
  {
    title: "Browser",
    description: "Headless ingestion directly in browser applications using standard File objects.",
    icon: Globe,
  },
  {
    title: "React",
    description: "Seamless integration via the useIngest hook, managing reactive lifecycle state automatically.",
    icon: Braces,
  },
  {
    title: "Node",
    description: "File-path based ingestion for server-side workflows and background processing.",
    icon: Server,
  }
];

export function RuntimeSupport() {
  return (
    <section className="py-24 border-b border-border bg-background">
      <Container variant="standard">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Universal Runtime Support
          </h2>
          <p className="text-lg text-foreground-muted">
            Designed to run wherever your application does, with specialized adapters for optimal ergonomics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {runtimes.map((runtime, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-4 p-6">
              <div className="w-12 h-12 rounded-full bg-surface-muted border border-border flex items-center justify-center text-foreground mb-2">
                <runtime.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{runtime.title}</h3>
              <p className="text-foreground-muted text-sm leading-relaxed max-w-[250px]">
                {runtime.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
