import { useState } from "react";
import { useIngest } from "@parallelbytes/ingestx/react";
import { IngestionStatus } from "@parallelbytes/ingestx";
import { demoColumns } from "./config/demoSchema";
import { SchemaViewer } from "./Components/SchemaViewer";
import { UploadSection } from "./Components/UploadSection";
import { ModeSelector, type ProcessingMode } from "./Components/ModeSelector";
import { ProcessingControls } from "./Components/ProcessingControls";
import { ResultsView } from "./Components/ResultsView";
import "./index.css";

export default function App() {
  const { ingest, pause, resume, cancel, reset, status, progress, result, error } = useIngest<Record<string, unknown>>();
  const [mode, setMode] = useState<ProcessingMode>("standard");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Reset any previous ingestion state when a new file is chosen
    if (status !== IngestionStatus.Idle) {
      reset();
    }
  };

  const handleStartIngestion = () => {
    if (!selectedFile) return;
    
    ingest({
      file: selectedFile,
      columns: demoColumns,
      collectResults: mode === "standard",
      onChunkProcessed: mode === "streaming" ? () => {
        // We purposely do NOT accumulate rows here to demonstrate streaming memory safety
      } : undefined
    }).catch((err) => {
      console.error("Ingestion error:", err);
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    reset();
  };

  const isIdle = status === IngestionStatus.Idle;

  return (
    <div className="app-container">
      <header className="demo-header">
        <div className="demo-header-brand">
          IngestX
          <span className="demo-header-version">v1.0</span>
        </div>
        <div className="demo-header-links">
          <a href="https://github.com/ParallelBytes/ingestx" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.npmjs.com/package/@parallelbytes/ingestx" target="_blank" rel="noreferrer">npm</a>
        </div>
      </header>

      <section className="hero-section">
        <h1 className="hero-title">CSV & Excel ingestion without the mess.</h1>
        <p className="hero-subtitle">
          Parse, validate and process large datasets with a schema-driven,
          framework-agnostic ingestion engine.
        </p>
        <div className="hero-tech-labels">
          <span className="tech-label">TypeScript</span>
          <span className="tech-label">Browser</span>
          <span className="tech-label">React</span>
          <span className="tech-label">Node</span>
        </div>
      </section>

      <main>
        <div className="playground-heading">TRY INGESTX</div>
        
        <div className="grid-2col">
          <div>
            <UploadSection 
              onFileSelect={handleFileSelect} 
              disabled={!isIdle}
              selectedFile={selectedFile}
              onClear={handleReset}
            />
          </div>
          <div>
            <SchemaViewer />
          </div>
        </div>

        <ModeSelector 
          mode={mode} 
          onChange={setMode} 
          disabled={!isIdle} 
        />

        {isIdle && (
          <div className="primary-action-bar">
            <button 
              className="btn-start" 
              onClick={handleStartIngestion}
              disabled={!selectedFile}
            >
              Process file
            </button>
          </div>
        )}

        <ProcessingControls 
          status={status}
          progress={progress}
          onPause={pause}
          onResume={resume}
          onCancel={cancel}
        />

        <ResultsView 
          status={status}
          result={result}
          error={error}
          mode={mode}
          onReset={handleReset}
        />
      </main>
    </div>
  );
}
