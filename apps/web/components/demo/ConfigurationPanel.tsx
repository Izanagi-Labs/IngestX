"use client";

import { useDemoStore } from "../../store/demoStore";

export function ConfigurationPanel() {
  const configuration = useDemoStore((state) => state.configuration);
  const updateConfiguration = useDemoStore((state) => state.updateConfiguration);
  const status = useDemoStore((state) => state.status);
  
  const disabled = status === "running" || status === "paused";

  return (
    <div className="border border-border rounded-lg p-4 bg-background">
      <h3 className="text-sm font-semibold text-foreground-muted mb-3">Configuration</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rowChunkSize" className="text-xs font-medium">rowChunkSize</label>
          <input
            id="rowChunkSize"
            type="number"
            min={1}
            value={configuration.rowChunkSize}
            onChange={(e) => updateConfiguration({ rowChunkSize: parseInt(e.target.value) || 1 })}
            disabled={disabled}
            className="px-2 py-1.5 text-sm border border-border rounded bg-foreground/5 disabled:opacity-50"
          />
          <p className="text-[10px] text-foreground-muted">Rows parsed per chunk</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="byteChunkSize" className="text-xs font-medium">byteChunkSize (bytes)</label>
          <input
            id="byteChunkSize"
            type="number"
            min={1}
            value={configuration.byteChunkSize}
            onChange={(e) => updateConfiguration({ byteChunkSize: parseInt(e.target.value) || 1 })}
            disabled={disabled}
            className="px-2 py-1.5 text-sm border border-border rounded bg-foreground/5 disabled:opacity-50"
          />
          <p className="text-[10px] text-foreground-muted">Bytes read at a time (CSV)</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={configuration.collectResults}
              onChange={(e) => updateConfiguration({ collectResults: e.target.checked })}
              disabled={disabled}
              className="rounded border-border disabled:opacity-50"
            />
            collectResults
          </label>
          <p className="text-[10px] text-foreground-muted">Retain rows in memory</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="maxCollectedRows" className={`text-xs font-medium ${!configuration.collectResults && 'opacity-50'}`}>
            maxCollectedRows
          </label>
          <input
            id="maxCollectedRows"
            type="number"
            min={1}
            value={configuration.maxCollectedRows}
            onChange={(e) => updateConfiguration({ maxCollectedRows: parseInt(e.target.value) || 1 })}
            disabled={disabled || !configuration.collectResults}
            className="px-2 py-1.5 text-sm border border-border rounded bg-foreground/5 disabled:opacity-50"
          />
          <p className={`text-[10px] text-foreground-muted ${!configuration.collectResults && 'opacity-50'}`}>
            Aborts if limit exceeded
          </p>
        </div>

      </div>
    </div>
  );
}
