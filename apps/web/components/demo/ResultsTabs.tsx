"use client";

import { useDemoStore } from "../../store/demoStore";
import { CheckCircle2, XCircle } from "lucide-react";

export function ResultsTabs() {
  const result = useDemoStore((state) => state.result);
  const activeTab = useDemoStore((state) => state.activeResultTab);
  const setActiveTab = useDemoStore((state) => state.setActiveResultTab);

  if (!result) return null;

  const validCount = result.validRows.length;
  const invalidCount = result.invalidRows.length;
  const allCount = validCount + invalidCount;

  return (
    <div className="flex border-b border-border bg-foreground/5 overflow-x-auto">
      <button
        className={`flex-1 flex items-center justify-center gap-2 min-w-[120px] py-3 px-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
          activeTab === "all" ? "border-primary text-primary" : "border-transparent text-foreground-muted hover:text-foreground"
        }`}
        onClick={() => setActiveTab("all")}
      >
        All ({allCount.toLocaleString()})
      </button>
      <button
        className={`flex-1 flex items-center justify-center gap-2 min-w-[120px] py-3 px-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
          activeTab === "valid" ? "border-primary text-primary" : "border-transparent text-foreground-muted hover:text-foreground"
        }`}
        onClick={() => setActiveTab("valid")}
      >
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        Valid ({validCount.toLocaleString()})
      </button>
      <button
        className={`flex-1 flex items-center justify-center gap-2 min-w-[120px] py-3 px-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
          activeTab === "invalid" ? "border-red-500 text-red-500" : "border-transparent text-foreground-muted hover:text-foreground"
        }`}
        onClick={() => setActiveTab("invalid")}
      >
        <XCircle className="w-4 h-4 text-red-500" />
        Invalid ({invalidCount.toLocaleString()})
      </button>
    </div>
  );
}
