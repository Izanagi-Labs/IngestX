# IngestX

A library to import and validate CSV & Excel files in JavaScript.

Ingestx is designed to handle large files incrementally by parsing in chunks, offering data validation, schema mapping, and execution control. Since it's headless, you bring your own UI and we handle the heavy lifting!

Demo:- [ingestx.vercel.app](https://ingestx.vercel.app/)

## Features

- **📊 Format Support:** Seamlessly process CSV and Excel (`.xlsx`, `.xls`) files.
- **⚡ Chunk-based Processing:** Helps avoid browser tab crashes and memory limits by evaluating datasets in chunks.

| Format | Parsing Model                                                             | Memory Characteristics                | Large File Guarantee          |
| ------ | ------------------------------------------------------------------------- | ------------------------------------- | ----------------------------- |
| CSV    | Incremental                                                               | Bounded by parser/chunk configuration | Designed for very large files |
| Excel  | Workbook materialization followed by incremental row extraction in Worker | O(workbook representation)            | Memory constrained            |

- **🔍 Robust Validation:** Define schemas with strict types (string, number, boolean), regex rules, min/max limits, and custom validation logic.
- **🔀 Smart Column Mapping:** Automatically map variations of column headers (e.g., `email`, `Email Address`, `User_Email`) to a single key.
- **⏯️ Execution Control:** Pause, resume, and cancel the ingestion process on the fly.

## Installation

```bash
npm install @izanagi-labs/ingestx
# or
yarn add @izanagi-labs/ingestx
```

## Quick Start

```ts
import { ingest, ix } from "ingestx";
import type { ColumnConfig } from "ingestx";

const columns: ColumnConfig[] = [
  {
    key: "id",
    name: "User ID",
    matchHeader: (header) =>
      header.toLowerCase() === "id" || header.toLowerCase() === "user id",
    schema: ix.number().optional(),
  },
  {
    key: "email",
    name: "Email Address",
    matchHeader: (header) => header.toLowerCase().includes("email"),
    schema: ix.string().regex(/@/),
  },
];

const fileInput =
  document.querySelector<HTMLInputElement>('input[type="file"]');

fileInput?.addEventListener("change", async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const ingestion = ingest({
    file,
    columns,
    onProgress: (progress) => {
      if (progress.percentage !== undefined) {
        console.log(`Processing... ${(progress.percentage * 100).toFixed(0)}%`);
      }
    },
  });

  const { data, error } = await ingestion.result;

  if (error) {
    console.error("Ingestion failed:", error.message);
    return;
  }

  console.log(`✅ Valid Rows: ${data.validRowsCount}`);
  console.log(`❌ Invalid Rows: ${data.invalidRowsCount}`);
});
```

### Quick Start (Node.js)

```ts
import { ingest, ix } from "@izanagi-labs/ingestx/node";
import type { ColumnConfig } from "@izanagi-labs/ingestx";

const columns: ColumnConfig[] = [
  {
    key: "email",
    name: "Email Address",
    matchHeader: (header) => header.toLowerCase().includes("email"),
    schema: ix.string().regex(/@/),
  },
];

async function run() {
  const ingestion = ingest({
    filePath: "./data.csv",
    columns,
    onProgress: (progress) => {
      console.log(`Phase: ${progress.phase}`);
    },
  });

  const { data, error } = await ingestion.result;

  if (error) {
    console.error("Ingestion failed:", error.message);
    return;
  }

  console.log(`✅ Valid Rows: ${data.validRowsCount}`);
}

run();
```

## Core Configuration

### `ColumnConfig`

The heart of Ingestx is the schema definition. You define exactly what your data should look like.

| Property      | Type                          | Description                                                       |
| ------------- | ----------------------------- | ----------------------------------------------------------------- |
| `key`         | `string`                      | The final key the data will be mapped to in the resulting object. |
| `name`        | `string`                      | A user-friendly name for this column.                             |
| `schema`      | `BaseSchema`                  | A schema instance (e.g. `ix.string()`, `ix.number()`)             |
| `matchHeader` | `(header: string) => boolean` | Function to match variations of column headers.                   |

#### Schema-Specific Options:

- **ix.string():** `regex`, `allowedValues`, `min`, `max`
- **ix.number():** `min`, `max`, `allowedValues`
- **ix.boolean():** (Strictly maps boolean shapes).
- **Common:** `optional()`, `default(val)`, `transform(fn)`

### Global Options

You can configure global behavior when initializing the ingestion:

```ts
const options = {
  trimValues: true, // Trims whitespace from cell values
  trimHeaders: true, // Trims whitespace from column headers
  caseInsensitiveHeaders: true, // Matches headers ignoring case
  shouldAccumulateResult: true, // If false, results are flushed per chunk (useful for large datasets to save memory)
};
```

## Progress Tracking

For core ingestion, you can track progress synchronously using the `onProgress` callback:

```ts
import { ingest } from "ingestx";

const ingestion = ingest({
  file,
  columns,
  onProgress: (progress) => {
    // Note: CSV exposes byte-based progress (`basis: "bytes"`), while Excel exposes row-based progress (`basis: "rows"`).
    // CSV ingestion does not expose total row count because determining it would require an additional full-file pass and would undermine the streaming model.
    console.log(`Phase: ${progress.phase}`);
    if (progress.percentage !== undefined) {
      console.log(`Progress: ${(progress.percentage * 100).toFixed(2)}%`);
    }
  },
});
```

## The Output Result

When ingestion completes (or pauses), the `result` object contains:

- `validRows`: Array of cleanly parsed and mapped objects.
- `invalidRows`: Array of raw objects that failed validation.
- `errorsData`: Detailed row-wise and column-wise error messages indicating exactly _why_ a row failed.

## License

MIT
