import { StringSchema } from "./schema/StringSchema";
import { NumberSchema } from "./schema/NumberSchema";
import { BooleanSchema } from "./schema/BooleanSchema";

export const ix = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
};
