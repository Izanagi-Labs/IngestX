import { ColumnConfig } from "../../model";

export interface ResolvedColumn {
  header: string;
  column: ColumnConfig;
}

export interface HeadersMismatch {
  expected: string[];
  missing: string[];
  unexpected: string[];
}
