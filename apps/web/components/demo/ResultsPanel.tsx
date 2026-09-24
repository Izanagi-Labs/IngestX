"use client";

import { useDemoStore } from "../../store/demoStore";

export function ResultsPanel() {
  const result = useDemoStore((state) => state.result);
  const status = useDemoStore((state) => state.status);
  const configuration = useDemoStore((state) => state.configuration);
  const activeTab = useDemoStore((state) => state.activeResultTab);
  const setActiveTab = useDemoStore((state) => state.setActiveResultTab);
  
  if (status !== "completed" || !result) {
    if (status === "idle" || status === "ready") {
      return (
        <div className="border border-border rounded-lg p-12 bg-background flex flex-col items-center justify-center text-center">
          <p className="text-foreground font-medium mb-1">No results yet</p>
          <p className="text-sm text-foreground-muted">Choose a file and run ingestion to inspect the output.</p>
        </div>
      );
    }
    return null; // Don't show anything while running/paused, as Summary handles it
  }

  const validCount = result.validRows.length;
  const invalidCount = result.invalidRows.length;

  if (!configuration.collectResults) {
    return (
      <div className="border border-border rounded-lg p-12 bg-background flex flex-col items-center justify-center text-center">
        <p className="text-foreground font-medium mb-1">Result Collection Disabled</p>
        <p className="text-sm text-foreground-muted">Rows were processed but not retained for the results table because 'collectResults' is false.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-background overflow-hidden flex flex-col">
      <div className="flex border-b border-border bg-foreground/5">
        <button
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "valid" ? "border-primary text-primary" : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
          onClick={() => setActiveTab("valid")}
        >
          Valid Rows ({validCount})
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "invalid" ? "border-destructive text-destructive" : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
          onClick={() => setActiveTab("invalid")}
        >
          Invalid Rows ({invalidCount})
        </button>
      </div>

      <div className="p-0 overflow-x-auto">
        {activeTab === "valid" && (
          validCount > 0 ? (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-foreground-muted uppercase bg-foreground/5 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Row</th>
                  {result.columns.map(c => (
                    <th key={c.key} className="px-4 py-3 font-medium">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.validRows.map((row, i) => (
                  <tr key={i} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-4 py-3 text-foreground-muted">{row._ixRowIndex ?? i}</td>
                    {result.columns.map(c => (
                      <td key={c.key} className="px-4 py-3 font-medium">{row[c.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-foreground-muted text-sm">No valid rows</div>
          )
        )}

        {activeTab === "invalid" && (
          invalidCount > 0 ? (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-foreground-muted uppercase bg-foreground/5 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Row</th>
                  {result.columns.map(c => (
                    <th key={c.key} className="px-4 py-3 font-medium">{c.name}</th>
                  ))}
                  <th className="px-4 py-3 font-medium">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.invalidRows.map((row, i) => (
                  <tr key={i} className="hover:bg-foreground/5 transition-colors align-top">
                    <td className="px-4 py-3 text-foreground-muted">{row._ixRowIndex}</td>
                    {result.columns.map(c => (
                      <td key={c.key} className="px-4 py-3 font-medium">{row.data?.[c.key]}</td>
                    ))}
                    <td className="px-4 py-3 text-wrap max-w-sm">
                      <div className="flex flex-col gap-2">
                        {Object.entries(row.errors || {}).map(([key, errors]: [string, any]) => (
                          <div key={key} className="bg-destructive/10 border border-destructive/20 rounded p-2 text-xs">
                            <span className="font-bold text-destructive mr-2">{key}:</span>
                            <span className="text-foreground">{errors[0]?.message}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-foreground-muted text-sm">No validation errors</div>
          )
        )}
      </div>
    </div>
  );
}
