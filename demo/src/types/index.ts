import type { ColumnConfig } from "@parallelbytes/ingestx";

export type DemoConfig = {
  chunkSize: number;
  options: {
    trimValues: boolean;
    trimHeaders: boolean;
    caseInsensitiveHeaders: boolean;
    shouldAccumulateResult: boolean;
  };
  columnConfigs: ColumnConfig[];
};
