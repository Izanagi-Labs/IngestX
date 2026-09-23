import React, { useRef } from "react";
import { generateValidCsv, generateInvalidCsv, downloadFile } from "../utils/generateSampleCsv";

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  selectedFile: File | null;
  onClear: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelect, disabled, selectedFile, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !selectedFile) {
      e.currentTarget.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if (disabled || selectedFile) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div 
        className={`upload-surface ${disabled ? 'disabled' : ''}`}
        style={{ flexGrow: 1 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !selectedFile && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".csv,.xlsx" 
          onChange={handleFileChange}
          disabled={disabled || selectedFile !== null}
        />
        
        {selectedFile ? (
          <div className="file-selected">
            <div className="file-name">{selectedFile.name}</div>
            <div className="file-meta">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.name.endsWith('.csv') ? 'CSV' : 'Excel'}
            </div>
            {!disabled && (
              <button className="file-remove" onClick={(e) => { e.stopPropagation(); onClear(); }}>
                Remove file
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div className="upload-title">Drop a file</div>
            <div className="upload-subtitle">CSV or XLSX</div>
            <button className="upload-browse-btn" onClick={(e) => { 
              e.stopPropagation(); 
              if (!disabled) fileInputRef.current?.click(); 
            }}>Browse files</button>
          </div>
        )}
      </div>

      <div className="sample-files">
        <span style={{ color: 'var(--text-secondary)' }}>Try a sample:</span>
        <button className="sample-link" onClick={() => downloadFile(generateValidCsv(), "valid_customers.csv")}>
          Valid CSV
        </button>
        <button className="sample-link" onClick={() => downloadFile(generateInvalidCsv(), "invalid_customers.csv")}>
          Invalid CSV
        </button>
      </div>
    </div>
  );
};
