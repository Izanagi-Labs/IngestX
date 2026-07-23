import type { BaseSchema } from '../schema/BaseSchema';

export interface ColumnConfig<TValue> {
  key: string;
  name: string;
  schema: BaseSchema<TValue>;
  duplicatesAllowed?: boolean;
  matchHeader?: (header: string) => boolean;
}
