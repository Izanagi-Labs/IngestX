"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { useTheme } from "next-themes";
import { useDemoStore, defaultSchemaCode } from "../../store/demoStore";

export function SchemaEditor() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  
  const schemaCode = useDemoStore((state) => state.schemaCode);
  const setSchemaCode = useDemoStore((state) => state.setSchemaCode);
  
  const handleReset = () => {
    setSchemaCode(defaultSchemaCode);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-foreground/5">
        <span className="text-sm font-semibold text-foreground-muted">Schema Configuration</span>
        <button 
          onClick={handleReset}
          className="text-xs text-primary hover:underline"
        >
          Reset Example
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={schemaCode}
          height="100%"
          extensions={[javascript({ typescript: true })]}
          theme={currentTheme === "dark" ? "dark" : "light"}
          onChange={(value) => setSchemaCode(value)}
          className="h-full [&>.cm-editor]:h-full"
        />
      </div>
    </div>
  );
}
