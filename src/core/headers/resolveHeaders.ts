import { ColumnConfig } from "../../model";
import { HeadersMismatch, ResolvedColumn } from "./types";

export function resolveHeaders(
  headers: string[],
  columns: readonly ColumnConfig[],
): {
  columns: ResolvedColumn[];
  mismatch?: HeadersMismatch;
} {
  const resolvedColumns: ResolvedColumn[] = [];

  const missing: string[] = [];
  const expected = new Set(columns.map((column) => column.name));

  for (const column of columns) {
    const header = headers.find((header) => {
      if (column.matchHeader) {
        return column.matchHeader(header);
      }

      return header === column.name;
    });

    if (!header) {
      missing.push(column.name);
      continue;
    }

    resolvedColumns.push({
      header,
      column,
    });
  }

  const resolvedHeaderNames = new Set(resolvedColumns.map(rc => rc.header));
  const unexpected = headers.filter((header) => !resolvedHeaderNames.has(header));

  if (missing.length || unexpected.length) {
    return {
      columns: [],
      mismatch: {
        expected: Array.from(expected),
        missing,
        unexpected,
      },
    };
  }

  return {
    columns: resolvedColumns,
  };
}
