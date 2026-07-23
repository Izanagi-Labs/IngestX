import { BaseSchema } from '../schema/BaseSchema';
import { ColumnConfig } from '../types/Column';

export class Column<TValue> {
  readonly key: string;
  readonly name: string;
  readonly schema: BaseSchema<TValue>;
  readonly duplicatesAllowed: boolean;
  readonly matchHeader?: (header: string) => boolean;

  constructor(config: ColumnConfig<TValue>) {
    this.key = config.key;
    this.name = config.name;
    this.schema = config.schema;
    this.duplicatesAllowed = config.duplicatesAllowed ?? true;
    this.matchHeader = config.matchHeader;
  }
}
