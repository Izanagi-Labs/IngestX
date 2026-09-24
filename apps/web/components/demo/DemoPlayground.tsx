"use client";

import { SchemaEditor } from "./SchemaEditor";
import { FileDropzone } from "./FileDropzone";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { RunControls } from "./RunControls";
import { ResultSummary } from "./ResultSummary";
import { ResultsPanel } from "./ResultsPanel";
import { useDemoStore } from "../../store/demoStore";
import { useEffect } from "react";

export function DemoPlayground() {
  const reset = useDemoStore((state) => state.reset);

  // Clean up mock timeouts when unmounting
  useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      
      {/* Playground Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">IngestX Playground</h1>
          <p className="text-sm text-foreground-muted">Test schemas against CSV and Excel files. (Phase 5 UI Shell)</p>
        </div>
        <button 
          onClick={reset}
          className="mt-4 sm:mt-0 px-4 py-2 text-sm font-medium rounded border border-border hover:bg-foreground/5 transition-colors"
        >
          Reset Session
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left: Schema Editor */}
        <div className="flex-1 lg:max-w-[55%] xl:max-w-[60%] min-h-[450px]">
          <SchemaEditor />
        </div>

        {/* Right: Controls & Configuration */}
        <div className="flex-1 flex flex-col gap-4">
          <FileDropzone />
          <ConfigurationPanel />
          <RunControls />
        </div>

      </div>

      {/* Lower section: Results */}
      <div className="flex flex-col gap-4">
        <ResultSummary />
        <ResultsPanel />
      </div>

    </div>
  );
}
