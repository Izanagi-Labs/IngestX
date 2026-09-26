"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { useTheme } from "next-themes";
import { useDemoStore, defaultSchemaCode } from "../../store/demoStore";
import { useEffect, useState } from "react";

export function SchemaEditor() {
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  
  const schemaCode = useDemoStore((state) => state.schemaCode);
  const setSchemaCode = useDemoStore((state) => state.setSchemaCode);
  const status = useDemoStore((state) => state.status);
  
  const isRunning = status === "running" || status === "paused";
  
  const handleReset = () => {
    setSchemaCode(defaultSchemaCode);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-foreground/5">
        <span className="text-sm font-semibold text-foreground-muted">Schema Configuration</span>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-foreground-muted hidden sm:inline">Uses a safe subset of the API.</span>
          <button 
            onClick={handleReset}
            disabled={isRunning}
            className="text-xs text-primary hover:underline disabled:opacity-50 disabled:hover:no-underline"
          >
            Reset Example
          </button>
        </div>
      </div>
      
      {isRunning && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 text-xs text-primary font-medium flex items-center justify-center">
          Schema is locked while ingestion is active.
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {mounted ? (
          <CodeMirror
            value={schemaCode}
            height="100%"
            extensions={[javascript({ typescript: true })]}
            theme={currentTheme === "dark" ? "dark" : "light"}
            onChange={(value) => setSchemaCode(value)}
            editable={!isRunning}
            className={`h-full [&>.cm-editor]:h-full ${isRunning ? "opacity-70" : ""}`}
          />
        ) : (
          <div className="h-full w-full bg-background/50"></div>
        )}
      </div>
    </div>
  );
}
