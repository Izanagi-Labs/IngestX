"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileIcon, X, Download, Beaker } from "lucide-react";
import { useDemoStore } from "../../store/demoStore";
import { createSampleFile, downloadSampleCsv } from "../../lib/demo/sampleData";

export function FileDropzone() {
  const file = useDemoStore((state) => state.file);
  const setFile = useDemoStore((state) => state.setFile);
  const status = useDemoStore((state) => state.status);
  
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const disabled = status === "running" || status === "paused";

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndSetFile = (f: File) => {
    setError(null);
    const validTypes = [".csv", ".xlsx"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!validTypes.includes(ext)) {
      setError("Please select a .csv or .xlsx file.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  if (file) {
    return (
      <div className="border border-border rounded-lg p-4 bg-background">
        <h3 className="text-sm font-semibold text-foreground-muted mb-2">Input File</h3>
        <div className="flex items-center justify-between p-3 border border-border rounded bg-foreground/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileIcon className="text-primary w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{file.name}</span>
              <span className="text-xs text-foreground-muted">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
          {!disabled && (
            <button 
              onClick={handleRemove}
              className="p-1 hover:bg-foreground/10 rounded-full transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4 text-foreground-muted hover:text-foreground" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-background">
      <h3 className="text-sm font-semibold text-foreground-muted mb-2">Input File</h3>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center text-center transition-colors cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed border-border" :
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept=".csv,.xlsx" 
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        <UploadCloud className="w-8 h-8 text-foreground-muted mb-2" />
        <span className="text-sm font-medium">Click to select or drag and drop</span>
        <span className="text-xs text-foreground-muted mt-1">CSV or XLSX · processed locally</span>
        {error && <span className="text-xs text-destructive mt-2">{error}</span>}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-foreground/5 rounded-lg border border-border">
        <div className="text-xs text-foreground-muted text-center sm:text-left">
          No file handy? Try the demo with a prepared CSV.
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => !disabled && setFile(createSampleFile())}
            disabled={disabled}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Beaker className="w-3.5 h-3.5" />
            Use sample
          </button>
          <button 
            onClick={() => !disabled && downloadSampleCsv()}
            disabled={disabled}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border bg-background hover:bg-foreground/5 text-foreground transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
