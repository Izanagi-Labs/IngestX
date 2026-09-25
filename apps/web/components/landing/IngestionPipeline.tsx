export function IngestionPipeline() {
  return (
    <div className="relative flex flex-col md:flex-row items-center justify-center w-full h-full p-4 font-mono text-xs select-none">
      {/* Input Group */}
      <div className="flex md:flex-col gap-4 mb-12 md:mb-0 md:mr-16 z-10">
        <div className="flex items-center justify-center w-24 h-24 border border-border bg-surface shadow-sm rounded-md relative pipeline-input-csv">
          <span className="font-bold text-foreground">CSV</span>
          <div className="absolute top-1/2 -right-16 w-16 h-px bg-border hidden md:block -translate-y-1/2"></div>
          <div className="absolute -bottom-12 left-1/2 w-px h-12 bg-border md:hidden -translate-x-1/2"></div>
        </div>
        <div className="flex items-center justify-center w-24 h-24 border border-border bg-surface shadow-sm rounded-md relative pipeline-input-xlsx">
          <span className="font-bold text-foreground">XLSX</span>
          <div className="absolute top-1/2 -right-16 w-16 h-px bg-border hidden md:block -translate-y-1/2"></div>
          <div className="absolute -bottom-12 left-1/2 w-px h-12 bg-border md:hidden -translate-x-1/2"></div>
        </div>
      </div>

      {/* Main Processor */}
      <div className="relative z-10 border-2 border-primary bg-background shadow-lg rounded-xl p-6 w-48 text-center flex flex-col items-center gap-4 pipeline-processor">
        <div className="font-bold text-lg text-foreground mb-2">IngestX</div>
        
        <div className="w-full flex items-center justify-between px-2 py-1.5 border border-border bg-surface-muted rounded text-[10px] text-foreground-muted">
          <span>Parse</span>
        </div>
        <div className="w-full flex items-center justify-between px-2 py-1.5 border border-primary-subtle bg-primary/10 rounded text-[10px] text-primary">
          <span>Schema Validation</span>
        </div>
        <div className="w-full flex items-center justify-between px-2 py-1.5 border border-border bg-surface-muted rounded text-[10px] text-foreground-muted">
          <span>Stream Chunk</span>
        </div>
      </div>

      {/* Output Group */}
      <div className="flex md:flex-col gap-4 mt-12 md:mt-0 md:ml-16 z-10">
        <div className="flex flex-col items-center justify-center w-24 h-16 border border-success/30 bg-success/5 shadow-sm rounded-md relative pipeline-output-valid text-success">
          <span className="font-bold">✓ Valid</span>
          <div className="absolute top-1/2 -left-16 w-16 h-px bg-border hidden md:block -translate-y-1/2"></div>
          <div className="absolute -top-12 left-1/2 w-px h-12 bg-border md:hidden -translate-x-1/2"></div>
        </div>
        <div className="flex flex-col items-center justify-center w-24 h-16 border border-error/30 bg-error/5 shadow-sm rounded-md relative pipeline-output-invalid text-error">
          <span className="font-bold">✕ Invalid</span>
          <div className="absolute top-1/2 -left-16 w-16 h-px bg-border hidden md:block -translate-y-1/2"></div>
          <div className="absolute -top-12 left-1/2 w-px h-12 bg-border md:hidden -translate-x-1/2"></div>
        </div>
      </div>

      {/* Particles (Desktop) */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        <div className="pipeline-particle particle-1" style={{ top: 'calc(50% - 3.5rem)', transform: 'translateY(-50%)' }} />
        <div className="pipeline-particle particle-2" style={{ top: 'calc(50% + 3.5rem)', transform: 'translateY(-50%)' }} />
        <div className="pipeline-particle particle-3 bg-success" style={{ top: 'calc(50% - 2.5rem)', transform: 'translateY(-50%)' }} />
        <div className="pipeline-particle particle-4 bg-error" style={{ top: 'calc(50% + 2.5rem)', transform: 'translateY(-50%)' }} />
      </div>
    </div>
  );
}
