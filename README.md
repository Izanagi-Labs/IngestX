# IngestX

The fastest way to import and validate large CSV & Excel files in JavaScript.

Ingestx is designed to handle massive files smoothly by parsing in chunks, offering built-in data validation, schema mapping, and execution control (pause, resume, cancel). Since it's completely headless, you bring your own UI and we handle the heavy lifting!

Demo:- [ingestx.vercel.app](https://ingestx.vercel.app/)

## Features

- **📊 Format Support:** Seamlessly process CSV and Excel (`.xlsx`, `.xls`) files.
- **⚡ Chunk-based Processing:** Prevents browser freezes and memory limits by processing huge files in manageable chunks.
- **🔍 Robust Validation:** Define schemas with strict types (string, number, boolean), regex rules, min/max limits, and custom validation logic.
- **🔀 Smart Column Mapping:** Automatically map variations of column headers (e.g., `email`, `Email Address`, `User_Email`) to a single key.
- **⏯️ Execution Control:** Pause, resume, and cancel the ingestion process on the fly.
- **⚛️ React Ready:** Comes with a built-in `useIngestion` hook for effortless React integration.

## Installation

```bash
npm install @parallelbytes/ingestx
# or
yarn add @parallelbytes/ingestx
```

## Quick Start (React)

Using the `useIngestion` hook is the fastest way to get started in a React application.

```tsx
import { useIngestion } from 'ingestx/react';
import type { ColumnConfig } from 'ingestx';

const columnConfigs: ColumnConfig[] = [
  {
    key: 'id',
    displayNames: ['id', 'user id'],
    type: 'number',
    validationRequired: true,
  },
  {
    key: 'email',
    displayNames: ['email', 'email address'],
    type: 'string',
    validationRequired: true,
  },
  {
    key: 'isActive',
    displayNames: ['active', 'is active'],
    type: 'boolean',
    trueValues: ['yes', 'true'],
    falseValues: ['no', 'false'],
  },
];

export default function Uploader() {
  const {
    isProcessing,
    progress,
    result,
    startIngestion,
    pause,
    resume,
    cancel,
  } = useIngestion({
    columnConfigs,
    chunkSize: 1000,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startIngestion(file);
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} accept=".csv, .xlsx" />

      {isProcessing && <p>Processing... {progress.toFixed(0)}%</p>}

      {result && (
        <div>
          <p>✅ Valid Rows: {result.validRowsCount}</p>
          <p>❌ Invalid Rows: {result.invalidRowsCount}</p>
        </div>
      )}
    </div>
  );
}
```

## Core Configuration

### `ColumnConfig`

The heart of Ingestx is the schema definition. You define exactly what your data should look like.

| Property             | Type                                | Description                                                                    |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `key`                | `string`                            | The final key the data will be mapped to in the resulting object.              |
| `displayNames`       | `string[]`                          | Possible header names in the uploaded file to match against.                   |
| `type`               | `'string' \| 'number' \| 'boolean'` | Expected data type. Ingestx will attempt to coerce and validate.               |
| `validationRequired` | `boolean`                           | If true, the row becomes invalid if this field is missing or fails validation. |
| `defaultValue`       | `any`                               | Value to use if the field is empty.                                            |

#### Type-Specific Options:

- **String:** `regex`, `allowedValues`
- **Number:** `min`, `max`, `allowedValues`
- **Boolean:** `trueValues`, `falseValues` (Strictly maps specific strings to booleans).

### Global Options

You can configure global behavior when initializing the ingestion:

```ts
const options = {
  trimValues: true, // Trims whitespace from all cell values
  trimHeaders: true, // Trims whitespace from column headers
  caseInsensitiveHeaders: true, // Matches headers ignoring case
  shouldAccumulateResult: true, // If false, results are flushed per chunk (useful for massive datasets to save memory)
};
```

## The Output Result

When ingestion completes (or pauses), the `result` object contains:

- `validRows`: Array of cleanly parsed and mapped objects.
- `invalidRows`: Array of raw objects that failed validation.
- `errorsData`: Detailed row-wise and column-wise error messages indicating exactly _why_ a row failed.

## License

MIT
