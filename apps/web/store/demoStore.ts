import { create } from "zustand";

export type DemoStatus = "idle" | "ready" | "running" | "paused" | "completed" | "error";

export interface DemoConfiguration {
  rowChunkSize: number;
  byteChunkSize: number;
  collectResults: boolean;
  maxCollectedRows: number;
}

export interface DemoProgress {
  processed: number;
  valid: number;
  invalid: number;
  progressPercentage: number;
}

export interface DemoResult {
  validRows: any[];
  invalidRows: any[];
}

export interface DemoState {
  file: File | null;
  schemaCode: string;
  configuration: DemoConfiguration;
  status: DemoStatus;
  progress: DemoProgress;
  result: DemoResult | null;
  error: string | null;
  activeResultTab: "valid" | "invalid";

  // Actions
  setFile: (file: File | null) => void;
  setSchemaCode: (code: string) => void;
  updateConfiguration: (updates: Partial<DemoConfiguration>) => void;
  setStatus: (status: DemoStatus) => void;
  setProgress: (progress: Partial<DemoProgress>) => void;
  setResult: (result: DemoResult | null) => void;
  setError: (error: string | null) => void;
  setActiveResultTab: (tab: "valid" | "invalid") => void;
  reset: () => void;
}

export const defaultSchemaCode = `const columns = [
  {
    key: "name",
    name: "Name",
    schema: ix.string().min(2),
  },
  {
    key: "age",
    name: "Age",
    schema: ix.number(),
  },
  {
    key: "email",
    name: "Email",
    schema: ix.string(),
    duplicatesAllowed: false,
  },
];`;

const initialState = {
  file: null,
  schemaCode: defaultSchemaCode,
  configuration: {
    rowChunkSize: 10000,
    byteChunkSize: 10 * 1024 * 1024, // 10MB
    collectResults: true,
    maxCollectedRows: 50000,
  },
  status: "idle" as DemoStatus,
  progress: { processed: 0, valid: 0, invalid: 0, progressPercentage: 0 },
  result: null,
  error: null,
  activeResultTab: "valid" as "valid" | "invalid",
};

export const useDemoStore = create<DemoState>((set) => ({
  ...initialState,
  
  setFile: (file) => set({ file, status: file ? "ready" : "idle", result: null, progress: initialState.progress }),
  setSchemaCode: (schemaCode) => set({ schemaCode }),
  updateConfiguration: (updates) => set((state) => ({ configuration: { ...state.configuration, ...updates } })),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set((state) => ({ progress: { ...state.progress, ...progress } })),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error, status: "error" }),
  setActiveResultTab: (activeResultTab) => set({ activeResultTab }),
  reset: () => set(initialState),
}));
