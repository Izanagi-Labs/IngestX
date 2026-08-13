import { BaseSchema } from "../schema/BaseSchema";
import { ColumnConfig } from "./types";
import { RuleType } from "../schema/types";

export class Column {
  readonly key: string;
  readonly name: string;
  readonly schema: BaseSchema<RuleType>;
  readonly duplicatesAllowed: boolean;
  readonly matchHeader?: (header: string) => boolean;

  constructor(config: ColumnConfig) {
    this.key = config.key;
    this.name = config.name;
    this.schema = config.schema;
    this.duplicatesAllowed = config.duplicatesAllowed ?? true;
    this.matchHeader = config.matchHeader;
  }
}
