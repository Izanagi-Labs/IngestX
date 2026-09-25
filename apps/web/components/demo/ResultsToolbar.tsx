"use client";

import { Search, Download, Filter } from "lucide-react";
import { useDemoStore } from "../../store/demoStore";
import { downloadValidCsv, downloadInvalidCsv } from "../../lib/demo/exportCsv";
import { useEffect, useState, useMemo } from "react";

export function ResultsToolbar() {
  const store = useDemoStore();
  const [localSearch, setLocalSearch] = useState(store.searchQuery);
  const result = store.result;

  useEffect(() => {
    const timer = setTimeout(() => {
      store.setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    setLocalSearch(store.searchQuery);
  }, [store.searchQuery]);

  const errorFields = useMemo(() => {
    if (!result || !result.invalidRows) return [];
    const fields = new Set<string>();
    for (const row of result.invalidRows) {
      if (row.errors) {
        Object.keys(row.errors).forEach((k) => fields.add(k));
      }
    }
    return Array.from(fields).sort();
  }, [result]);

  if (!result) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border-b border-border bg-background gap-3">
      <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search results..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-md border border-border bg-foreground/5 focus:bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {store.activeResultTab === "invalid" && errorFields.length > 0 && (
          <div className="relative flex items-center">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
            <select
              value={store.errorFilter}
              onChange={(e) => store.setErrorFilter(e.target.value)}
              className="pl-8 pr-8 py-1.5 text-sm rounded-md border border-border bg-foreground/5 hover:bg-foreground/10 focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
            >
              <option value="">All Errors</option>
              {errorFields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={() => downloadValidCsv(result)}
          disabled={result.validRows.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border border-border bg-background hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Valid CSV
        </button>
        <button
          onClick={() => downloadInvalidCsv(result)}
          disabled={result.invalidRows.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Invalid CSV
        </button>
      </div>
    </div>
  );
}
