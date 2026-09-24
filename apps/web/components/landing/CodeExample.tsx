import { Container } from "../layout/Container";
import { Check } from "lucide-react";

export function CodeExample() {
  return (
    <section className="py-24 border-b border-border bg-background">
      <Container variant="wide">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Developer-first API
            </h2>
            <p className="text-lg text-foreground-muted">
              IngestX handles the ingestion pipeline so you don't have to repeatedly wire together parsing, validation, and result accumulation.
            </p>
            <ul className="space-y-3 mt-4">
              {['Schema-first architecture', 'Fully typed in TypeScript', 'Headless implementation', 'Lightweight footprint'].map((item, idx) => (
                <li key={idx} className="flex items-center text-foreground-muted">
                  <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="lg:col-span-3 w-full rounded-xl overflow-hidden border border-border bg-[#0d1117] shadow-xl text-[13px] sm:text-sm">
            <div className="flex items-center px-4 py-2 border-b border-white/10 bg-[#161b22]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="ml-4 text-xs text-white/50 font-mono">ingestion.ts</div>
            </div>
            <div className="p-4 sm:p-6 overflow-x-auto">
              <pre className="font-mono text-white/90 leading-relaxed">
                <code>
                  <span className="text-[#ff7b72]">import</span> &#123; ingest, ix &#125; <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">"@parallelbytes/ingestx"</span>;<br/>
                  <br/>
                  <span className="text-[#8b949e]">{"// Define exactly what your data should look like"}</span><br/>
                  <span className="text-[#ff7b72]">const</span> columns = [<br/>
                  {"  "}&#123;<br/>
                  {"    "}key: <span className="text-[#a5d6ff]">"email"</span>,<br/>
                  {"    "}name: <span className="text-[#a5d6ff]">"Email Address"</span>,<br/>
                  {"    "}<span className="text-[#d2a8ff]">matchHeader</span>: (header) =&gt; header.<span className="text-[#d2a8ff]">toLowerCase</span>().<span className="text-[#d2a8ff]">includes</span>(<span className="text-[#a5d6ff]">"email"</span>),<br/>
                  {"    "}schema: ix.<span className="text-[#d2a8ff]">string</span>().<span className="text-[#d2a8ff]">regex</span>(<span className="text-[#79c0ff]">/@/</span>),<br/>
                  {"  "}&#125;<br/>
                  ];<br/>
                  <br/>
                  <span className="text-[#ff7b72]">const</span> ingestion = <span className="text-[#d2a8ff]">ingest</span>(&#123;<br/>
                  {"  "}file,<br/>
                  {"  "}columns,<br/>
                  {"  "}<span className="text-[#d2a8ff]">onProgress</span>: (progress) =&gt; &#123;<br/>
                  {"    "}console.<span className="text-[#d2a8ff]">log</span>(<span className="text-[#a5d6ff]">\`Processing... $&#123;</span>(progress.percentage * <span className="text-[#79c0ff]">100</span>).<span className="text-[#d2a8ff]">toFixed</span>(<span className="text-[#79c0ff]">0</span>)<span className="text-[#a5d6ff]">&#125;%\`</span>);<br/>
                  {"  "}&#125;<br/>
                  &#125;);<br/>
                  <br/>
                  <span className="text-[#ff7b72]">const</span> &#123; data, error &#125; = <span className="text-[#ff7b72]">await</span> ingestion.result;<br/>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
