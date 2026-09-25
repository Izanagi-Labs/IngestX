"use client";

import { useDemoStore } from "../../store/demoStore";
import { ResultsTabs } from "./ResultsTabs";
import { ResultsToolbar } from "./ResultsToolbar";
import { ResultsTable } from "./ResultsTable";
import { useMemo, useDeferredValue } from "react";

export function ResultsPanel() {
  const result = useDemoStore((state) => state.result);
  const status = useDemoStore((state) => state.status);
  const configuration = useDemoStore((state) => state.configuration);
  const activeTab = useDemoStore((state) => state.activeResultTab);
  const searchQueryRaw = useDemoStore((state) => state.searchQuery);
  const errorFilterRaw = useDemoStore((state) => state.errorFilter);
  
  const searchQuery = useDeferredValue(searchQueryRaw);
  const errorFilter = useDeferredValue(errorFilterRaw);
  
  const filteredData = useMemo(() => {
    if (!result) return [];
    
    let baseData: any[] = [];
    if (activeTab === "all") {
      baseData = [...result.validRows, ...result.invalidRows].sort((a, b) => (Number(a._ixRowIndex) || 0) - (Number(b._ixRowIndex) || 0));
    } else if (activeTab === "valid") {
      baseData = result.validRows;
    } else {
      baseData = result.invalidRows;
    }

    let filtered = baseData;

    if (errorFilter && (activeTab === "invalid" || activeTab === "all")) {
      filtered = filtered.filter(row => row.errors && row.errors[errorFilter]);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(row => {
        const rowData = row.data ?? row;
        return result.columns.some(c => {
          const val = rowData[c.key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(lowerQuery);
        });
      });
    }

    return filtered;
  }, [result, activeTab, searchQuery, errorFilter]);

  if (!result) {
    if (status === "error") return null;
    return (
      <div className="border border-border rounded-lg p-12 bg-background flex flex-col items-center justify-center text-center">
        <p className="text-foreground font-medium mb-1">
          {status === "running" ? "Processing..." : "No results yet"}
        </p>
        <p className="text-sm text-foreground-muted">
          {status === "running" ? "Please wait while ingestion completes." : "Choose a file and run ingestion to inspect the output."}
        </p>
      </div>
    );
  }

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
      <div className="flex justify-between items-center bg-foreground/5 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Results Explorer</span>
        {configuration.maxCollectedRows < (result.validRows.length + result.invalidRows.length) && (
          <span className="text-xs text-amber-500 font-medium">Partial results shown (collection limit reached)</span>
        )}
      </div>
      <ResultsTabs />
      <ResultsToolbar />
      <ResultsTable data={filteredData} schemaColumns={result.columns} activeTab={activeTab} />
    </div>
  );
}

