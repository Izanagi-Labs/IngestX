"use client";

import { useDemoStore } from "../../store/demoStore";

export function ResultSummary() {
  const status = useDemoStore((state) => state.status);
  const progress = useDemoStore((state) => state.progress);
  const result = useDemoStore((state) => state.result);
  
  if (status === "idle" || status === "ready") return null;

  const successRate = progress.processed > 0 
    ? ((progress.valid / progress.processed) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="border border-border rounded-lg bg-background overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <span className="text-xs text-foreground-muted font-semibold uppercase tracking-wider mb-1">Processed</span>
        <span className="text-2xl font-bold">{progress.processed.toLocaleString()}</span>
      </div>
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <span className="text-xs text-foreground-muted font-semibold uppercase tracking-wider mb-1">Valid</span>
        <span className="text-2xl font-bold text-green-600 dark:text-green-500">{progress.valid.toLocaleString()}</span>
      </div>
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <span className="text-xs text-foreground-muted font-semibold uppercase tracking-wider mb-1">Invalid</span>
        <span className="text-2xl font-bold text-red-500">{progress.invalid.toLocaleString()}</span>
      </div>
      {result && (
        <>
          <div className="flex-1 p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-foreground-muted font-semibold uppercase tracking-wider mb-1">Success Rate</span>
            <span className="text-2xl font-bold">{successRate}%</span>
          </div>
          <div className="flex-1 p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-foreground-muted font-semibold uppercase tracking-wider mb-1">Duration</span>
            <span className="text-2xl font-bold">{result.durationMs}ms</span>
          </div>
        </>
      )}
    </div>
  );
}
