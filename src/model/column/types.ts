import type { BaseSchema } from '../schema/BaseSchema';
import { RuleType } from '../schema/types/RuleType';

export interface ColumnConfig {
  key: string;
  name: string;
  schema: BaseSchema<RuleType>;
  duplicatesAllowed?: boolean;
  matchHeader?: (header: string) => boolean;
}
