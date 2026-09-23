import React from "react";
import { IngestionStatus } from "@parallelbytes/ingestx";
import type { useIngest } from "@parallelbytes/ingestx/react";

interface ProcessingControlsProps {
  status: IngestionStatus;
  progress: ReturnType<typeof useIngest>["progress"];
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export const ProcessingControls: React.FC<ProcessingControlsProps> = ({ 
  status, progress, onPause, onResume, onCancel 
}) => {
  if (status === IngestionStatus.Idle || status === IngestionStatus.Completed || status === IngestionStatus.Failed || status === IngestionStatus.Cancelled) {
    return null; 
  }

  const isRunning = status === IngestionStatus.Running;
  const isPaused = status === IngestionStatus.Paused;

  const percent = progress?.phase === "completed" ? 100 : (progress as unknown as Record<string, unknown>)?.progressPercentage as number ?? 0;
  const processed = progress?.processedRows ?? 0;

  // Simulate bounded chunk visualization based on progress percentage
  // We want 15 chunks visually
  const totalVisChunks = 15;
  const completedVisChunks = Math.floor((percent / 100) * totalVisChunks);
  
  const chunkElements = Array.from({ length: totalVisChunks }).map((_, i) => {
    let stateClass = "";
    if (i < completedVisChunks) stateClass = "completed";
    else if (i === completedVisChunks && isRunning) stateClass = "current";
    return <div key={i} className={`chunk-box ${stateClass}`} />;
  });
  
  return (
    <div className="processing-panel">
      <div className="playground-heading" style={{ border: 'none', padding: 0, marginBottom: '1rem' }}>Processing</div>
      
      <div className="processing-header">
        <div className="processing-title">{isPaused ? 'Paused' : 'Processing'}</div>
        <div className="processing-percent">{percent.toFixed(0)}%</div>
      </div>
      
      <div className="progress-track">
        <div className={`progress-bar ${isPaused ? 'paused' : ''}`} style={{ width: `${percent}%` }} />
      </div>

      <div className="processing-metrics">
        <strong>{processed.toLocaleString()}</strong> rows processed
      </div>

      <div className="chunk-visualization">
        <span>Chunks</span>
        <div className="chunk-boxes">
          {chunkElements}
        </div>
      </div>

      <div className="processing-controls">
        {isRunning && (
          <button className="btn-control" onClick={onPause}>Pause</button>
        )}
        {isPaused && (
          <button className="btn-control" onClick={onResume}>Resume</button>
        )}
        <button className="btn-control" onClick={onCancel} style={{ color: 'var(--color-error)' }}>Cancel</button>
      </div>
    </div>
  );
};
