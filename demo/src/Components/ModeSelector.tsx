import React from "react";

export type ProcessingMode = "standard" | "streaming";

interface ModeSelectorProps {
  mode: ProcessingMode;
  onChange: (mode: ProcessingMode) => void;
  disabled: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onChange, disabled }) => {
  return (
    <div style={{ marginBottom: '3rem', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div className="playground-heading">Processing Mode</div>
      <div className="mode-selector">
        <div 
          className={`mode-card ${mode === "standard" ? 'selected' : ''}`}
          onClick={() => onChange("standard")}
        >
          <div className="mode-radio" />
          <div>
            <div className="mode-title">Standard</div>
            <div className="mode-desc">
              Collect validated rows for inspection.
            </div>
          </div>
        </div>

        <div 
          className={`mode-card ${mode === "streaming" ? 'selected' : ''}`}
          onClick={() => onChange("streaming")}
        >
          <div className="mode-radio" />
          <div>
            <div className="mode-title">Streaming</div>
            <div className="mode-desc">
              Process chunks without retaining the full dataset.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
