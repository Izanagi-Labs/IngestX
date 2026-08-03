type TypeStringConfig = {
  type: 'string';
  allowedValues?: string[];
  regex?: string;
};

type TypeNumberConfig = {
  type: 'number';
  min?: number;
  max?: number;
  allowedValues?: number[];
};

type TypeBooleanConfig = {
  type: 'boolean';
  trueValues?: string[];
  falseValues?: string[];
};

type Transformer<T = any> = (value: T, row?: Record<string, any>) => T;

type Validator<T = any> = (
  value: T,
  row?: Record<string, any>,
) => [boolean, string?];

type BaseColumnConfig = {
  displayNames: string[]; // (csv header can be NAME, Name, fullname)
  key: string; // key in the final json
  validationRequired: boolean;
  defaultValue?: string | number | boolean;
  isDuplicatesAllowed?: boolean;
  fallbackToDefaultValue?: boolean; // if true and value validation fails use default value
  transform?: Transformer;
  customValidation?: Validator; // if false record will be rejected
};

export type ColumnConfig =
  | (BaseColumnConfig & TypeStringConfig)
  | (BaseColumnConfig & TypeNumberConfig)
  | (BaseColumnConfig & TypeBooleanConfig);

export type IngestionController = {
  isPaused: boolean;
  isCancelled: boolean;
};

export type RowValidationError = {
  rowIndex: number;
  columnKey: string;
  receivedValue: unknown;
  errorMessage: string;
};

export type HeadersMismatch = {
  headersRequired: string[];
  headersSent: string[];
};

export type ErrorsData = {
  headersMismatch?: HeadersMismatch;
  rowWiseErrors: RowValidationError[];
};

export type FinalOutput<TRow = Record<string, any>> = {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  validRows: TRow[];
  invalidRows: TRow[];
  errorsData: ErrorsData;
};

export type IngestionOptions = {
  shouldAccumulateResult?: boolean;
  trimValues?: boolean;
  trimHeaders?: boolean;
  caseInsensitiveHeaders?: boolean;
};

export type ProcessRowsInChunksOptions<TRow = Record<string, any>> = {
  rows: TRow[];
  columnConfigs: ColumnConfig[];
  chunkSize: number;
  onChunkProcessed: (result: FinalOutput<TRow>) => Promise<void>;
  ingestionController: IngestionController;
  options?: IngestionOptions;
};
