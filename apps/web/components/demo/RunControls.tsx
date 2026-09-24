"use client";

import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { useDemoStore } from "../../store/demoStore";
import { runIngestion, pauseIngestion, resumeIngestion, cancelIngestion } from "../../lib/demo/realIngestion";

export function RunControls() {
  const status = useDemoStore((state) => state.status);
  const file = useDemoStore((state) => state.file);
  const progress = useDemoStore((state) => state.progress);
  const error = useDemoStore((state) => state.error);
  
  if (status === "idle") {
    return (
      <div className="border border-border rounded-lg p-4 bg-background">
        <button disabled className="w-full py-2 px-4 rounded bg-foreground/10 text-foreground-muted cursor-not-allowed font-medium">
          Select a file to run
        </button>
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className="border border-border rounded-lg p-4 bg-background">
        <button 
          onClick={runIngestion} 
          className="w-full py-2 px-4 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Run Ingestion
        </button>
      </div>
    );
  }
  
  if (status === "running" || status === "paused") {
    return (
      <div className="border border-border rounded-lg p-4 bg-background">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-foreground">{status === "running" ? "Processing..." : "Paused"}</span>
            <span className="text-foreground-muted">{progress.progressPercentage}%</span>
          </div>
          
          <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress.progressPercentage}%` }}
            />
          </div>

          <div className="flex gap-2 mt-2">
            {status === "running" ? (
              <button onClick={pauseIngestion} className="flex-1 py-1.5 px-3 rounded bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                <Pause className="w-4 h-4" /> Pause
              </button>
            ) : (
              <button onClick={resumeIngestion} className="flex-1 py-1.5 px-3 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                <Play className="w-4 h-4" /> Resume
              </button>
            )}
            <button onClick={cancelIngestion} className="flex-1 py-1.5 px-3 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center gap-2 text-sm font-medium transition-colors">
              <Square className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="border border-border rounded-lg p-4 bg-background">
        <button 
          onClick={runIngestion} 
          className="w-full py-2 px-4 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Run Again
        </button>
      </div>
    );
  }
  
  if (status === "error") {
    return (
      <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-4">
        <div className="flex flex-col gap-3">
          <div className="font-semibold text-destructive">Ingestion Error</div>
          <pre className="text-sm text-foreground/80 whitespace-pre-wrap overflow-auto max-h-40 bg-background/50 p-2 rounded border border-border/50">
            {error || "An unknown error occurred"}
          </pre>
          <button 
            onClick={runIngestion} 
            className="w-full py-2 px-4 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return null;
}
