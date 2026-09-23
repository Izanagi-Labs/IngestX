import React, { useState } from "react";
import { IngestionStatus } from "@parallelbytes/ingestx";
import type { useIngest } from "@parallelbytes/ingestx/react";
import type { ProcessingMode } from "./ModeSelector";

interface ResultsViewProps {
  status: IngestionStatus;
  result: ReturnType<typeof useIngest>["result"];
  error: ReturnType<typeof useIngest>["error"];
  mode: ProcessingMode;
  onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ status, result, error, mode, onReset }) => {
  const [userSelectedTab, setUserSelectedTab] = useState<"valid" | "invalid" | null>(null);
  
  const defaultTab = result?.invalidRowsCount ? "invalid" : "valid";
  const activeTab = userSelectedTab || defaultTab;

  if (status === IngestionStatus.Idle || status === IngestionStatus.Running || status === IngestionStatus.Paused) {
    return null;
  }

  const renderError = () => {
    if (!error) return null;

    if (error.type === "HEADER_MISMATCH") {
      const details = error.details as { expected: string[]; missing: string[]; unexpected: string[] };
      return (
        <div className="state-panel error">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Header mismatch</div>
          <div className="state-desc">IngestX couldn't match this file to the configured schema.</div>
          
          <div className="mismatch-grid">
            <div className="mismatch-col">
              <h5>Missing</h5>
              <div className="mismatch-list">
                {details?.missing?.length > 0 ? details.missing.map(m => <div key={m}>{m}</div>) : "None"}
              </div>
            </div>
            <div className="mismatch-col">
              <h5>Unexpected</h5>
              <div className="mismatch-list">
                {details?.unexpected?.length > 0 ? details.unexpected.map(u => <div key={u}>{u}</div>) : "None"}
              </div>
            </div>
          </div>
          
          <div className="mismatch-expected">
            <h5>Expected</h5>
            <div className="mismatch-expected-tokens">
              {details?.expected?.join(" · ")}
            </div>
          </div>
          
          <button className="btn-control" onClick={onReset}>Choose another file</button>
        </div>
      );
    }

    return (
      <div className="state-panel error">
        <div className="state-icon">⚠️</div>
        <div className="state-title">Error ({error.type})</div>
        <div className="state-desc">{error.message}</div>
        <button className="btn-control" onClick={onReset}>Choose another file</button>
      </div>
    );
  };

  if (error) {
    return <div className="results-summary">{renderError()}</div>;
  }

  const isCompleted = status === IngestionStatus.Completed;
  const isCancelled = status === IngestionStatus.Cancelled;

  const validRows = (result?.validRows as Record<string, unknown>[]) || [];
  const invalidRows = (result?.invalidRows as Record<string, unknown>[]) || [];

  return (
    <div className="results-summary">
      <div className="playground-heading">Processing / Results</div>

      {isCancelled && (
        <div className="state-panel">
          <div className="state-icon">⏹️</div>
          <div className="state-title">Processing cancelled</div>
          <div className="state-desc">Ingestion was intentionally stopped.</div>
          <button className="btn-control" onClick={onReset}>Process another file</button>
        </div>
      )}

      {mode === "streaming" && isCompleted && (
        <div className="state-panel">
          <div className="state-icon" style={{ color: 'var(--color-success)' }}>✓</div>
          <div className="state-title">Streaming complete</div>
          <div className="state-desc">Rows were processed chunk-by-chunk without retaining the complete dataset in memory.</div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '2rem' }}>
            <div className="kpi" style={{ alignItems: 'center' }}>
              <div className="kpi-value">{(result?.validRowsCount || 0) + (result?.invalidRowsCount || 0)}</div>
              <div className="kpi-label">rows processed</div>
            </div>
            <div className="kpi" style={{ alignItems: 'center' }}>
              <div className="kpi-value">0</div>
              <div className="kpi-label">rows retained</div>
            </div>
          </div>
          
          <button className="btn-control" onClick={onReset}>Process another file</button>
        </div>
      )}

      {mode === "standard" && isCompleted && result && (
        <>
          <div className="results-summary-header">
            ✓ Import completed
          </div>
          
          <div className="results-kpis">
            <div className="kpi">
              <div className="kpi-value">{(result.validRowsCount + result.invalidRowsCount).toLocaleString()}</div>
              <div className="kpi-label">Processed</div>
            </div>
            <div className="kpi">
              <div className="kpi-value">{result.validRowsCount.toLocaleString()}</div>
              <div className="kpi-label">Valid</div>
            </div>
            <div className="kpi">
              <div className="kpi-value">{result.invalidRowsCount.toLocaleString()}</div>
              <div className="kpi-label">Invalid</div>
            </div>
          </div>

          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'valid' ? 'active' : ''}`}
              onClick={() => setUserSelectedTab('valid')}
            >
              Valid rows {result.validRowsCount.toLocaleString()}
            </button>
            <button 
              className={`tab ${activeTab === 'invalid' ? 'active' : ''}`}
              onClick={() => setUserSelectedTab('invalid')}
            >
              Invalid rows {result.invalidRowsCount.toLocaleString()}
            </button>
          </div>

          <div className="table-container">
            {activeTab === 'valid' && (
              validRows.length > 0 ? (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Age</th>
                        <th>Active</th>
                        <th>Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.slice(0, 50).map((row: Record<string, unknown>, i: number) => (
                        <tr key={i}>
                          <td>{String(row.id ?? "")}</td>
                          <td>{String(row.name ?? "")}</td>
                          <td>{String(row.email ?? "")}</td>
                          <td>{String(row.age ?? "")}</td>
                          <td>{row.active ? "true" : "false"}</td>
                          <td>{String(row.country || "-")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="table-footer">
                    Showing {Math.min(50, validRows.length)} of {result.validRowsCount.toLocaleString()} valid rows
                  </div>
                </>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No valid rows found.
                </div>
              )
            )}

            {activeTab === 'invalid' && (
              invalidRows.length > 0 ? (
                <>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Field</th>
                        <th>Value</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invalidRows.slice(0, 50).map((invalidRow: Record<string, unknown>, i: number) => (
                        <React.Fragment key={i}>
                          {(invalidRow.errors as Record<string, unknown>[] || []).map((err: Record<string, unknown>, j: number) => (
                            <tr key={`${i}-${j}`} className="table-error-row">
                              <td>{String(invalidRow.index ?? "")}</td>
                              <td>{String(err.key ?? "")}</td>
                              <td><span className="error-value">{String((invalidRow.raw as Record<string, unknown>)[String(err.key)] ?? "")}</span></td>
                              <td className="error-reason">{String(err.message ?? "")}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  <div className="table-footer">
                    Showing {Math.min(50, invalidRows.length)} of {result.invalidRowsCount.toLocaleString()} invalid rows
                  </div>
                </>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No invalid rows found.
                </div>
              )
            )}
          </div>

          <div className="mt-4">
            <button className="btn-control" onClick={onReset}>Process another file</button>
          </div>
        </>
      )}
    </div>
  );
};
