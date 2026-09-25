import { describe, it, expect } from "vitest";
import { Column } from "@/src/model/column/Column";
import { StringSchema } from "@/src/model/schema/StringSchema";
import { NumberSchema } from "@/src/model/schema/NumberSchema";
import { BooleanSchema } from "@/src/model/schema/BooleanSchema";
import type { ColumnConfig } from "@/src/model/column/types";

describe("Column", () => {
  const schemas = [
    { name: "StringSchema", instance: new StringSchema() },
    { name: "NumberSchema", instance: new NumberSchema() },
    { name: "BooleanSchema", instance: new BooleanSchema() },
  ];

  describe("1. Constructor", () => {
    it("Creates a Column instance successfully", () => {
      const config: ColumnConfig = {
        key: "test",
        name: "Test",
        schema: new NumberSchema(),
      };
      const column = new Column(config);
      expect(column).toBeInstanceOf(Column);
    });

    it("Correctly assigns every provided property", () => {
      const schema = new StringSchema();
      const matchHeader = () => true;
      const config: ColumnConfig = {
        key: "id",
        name: "Identifier",
        schema,
        duplicatesAllowed: false,
        matchHeader,
      };

      const column = new Column(config);

      expect(column.key).toBe("id");
      expect(column.name).toBe("Identifier");
      expect(column.schema).toBe(schema);
      expect(column.duplicatesAllowed).toBe(false);
      expect(column.matchHeader).toBe(matchHeader);
    });

    it("Stores the exact schema instance (reference equality)", () => {
      const schema = new BooleanSchema();
      const column = new Column({ key: "b", name: "B", schema });
      expect(column.schema).toBe(schema);
    });

    it("Does not clone the schema", () => {
      const schema = new NumberSchema();
      const column = new Column({ key: "n", name: "N", schema });
      expect(column.schema).toBe(schema);
    });

    it("Preserves generic type compatibility", () => {
      const schema = new StringSchema();
      const column: Column = new Column({
        key: "s",
        name: "S",
        schema,
      });
      expect(column).toBeDefined();
    });
  });

  describe("2. key", () => {
    const createWithKey = (key: string) =>
      new Column({ key, name: "n", schema: new StringSchema() });

    it("Stores the provided key", () => {
      expect(createWithKey("myKey").key).toBe("myKey");
    });

    it("Supports arbitrary strings", () => {
      const key = "!@#$%^&*()_+";
      expect(createWithKey(key).key).toBe(key);
    });

    it("Preserves whitespace", () => {
      const key = "  key with space  ";
      expect(createWithKey(key).key).toBe(key);
    });

    it("Preserves case", () => {
      const key = "MixedCASEkey";
      expect(createWithKey(key).key).toBe(key);
    });
  });

  describe("3. name", () => {
    const createWithName = (name: string) =>
      new Column({ key: "k", name, schema: new StringSchema() });

    it("Stores the provided name", () => {
      expect(createWithName("myName").name).toBe("myName");
    });

    it("Supports arbitrary strings", () => {
      const name = "!@#$%^&*()_+";
      expect(createWithName(name).name).toBe(name);
    });

    it("Preserves whitespace", () => {
      const name = "  name with space  ";
      expect(createWithName(name).name).toBe(name);
    });

    it("Preserves case", () => {
      const name = "MixedCASEname";
      expect(createWithName(name).name).toBe(name);
    });
  });

  describe("4. schema", () => {
    describe.each(schemas)("with $name", ({ instance }) => {
      it("Accepts each schema type", () => {
        const column = new Column({ key: "k", name: "n", schema: instance });
        expect(column.schema).toBeDefined();
      });

      it("Stores the exact schema instance", () => {
        const column = new Column({ key: "k", name: "n", schema: instance });
        expect(column.schema).toBe(instance);
      });

      it("Does not modify schema rules", () => {
        const originalRulesCount = (instance as any)._getRules?.()?.length ?? 0;
        new Column({ key: "k", name: "n", schema: instance });
        const currentRulesCount = (instance as any)._getRules?.()?.length ?? 0;
        expect(currentRulesCount).toBe(originalRulesCount);
      });

      it("Does not mutate the schema", () => {
        const schemaSnapshot = { ...instance };
        new Column({ key: "k", name: "n", schema: instance });
        expect(instance).toEqual(schemaSnapshot);
      });

      it("Multiple columns may reference the same schema instance", () => {
        const column1 = new Column({ key: "k1", name: "n1", schema: instance });
        const column2 = new Column({ key: "k2", name: "n2", schema: instance });

        expect(column1.schema).toBe(instance);
        expect(column2.schema).toBe(instance);
        expect(column1.schema).toBe(column2.schema);
      });
    });
  });

  describe("5. duplicatesAllowed", () => {
    const schema = new StringSchema();

    it("Defaults to true when omitted", () => {
      const column = new Column({ key: "k", name: "n", schema });
      expect(column.duplicatesAllowed).toBe(true);
    });

    it("Stores true correctly", () => {
      const column = new Column({
        key: "k",
        name: "n",
        schema,
        duplicatesAllowed: true,
      });
      expect(column.duplicatesAllowed).toBe(true);
    });

    it("Stores false correctly", () => {
      const column = new Column({
        key: "k",
        name: "n",
        schema,
        duplicatesAllowed: false,
      });
      expect(column.duplicatesAllowed).toBe(false);
    });

    it("Does not affect any other properties", () => {
      const column = new Column({
        key: "k",
        name: "n",
        schema,
        duplicatesAllowed: false,
      });
      expect(column.key).toBe("k");
      expect(column.name).toBe("n");
      expect(column.schema).toBe(schema);
    });
  });

  describe("6. matchHeader", () => {
    const schema = new StringSchema();

    it("Is undefined when omitted", () => {
      const column = new Column({ key: "k", name: "n", schema });
      expect(column.matchHeader).toBeUndefined();
    });

    it("Stores the provided callback", () => {
      const matchHeader = () => true;
      const column = new Column({ key: "k", name: "n", schema, matchHeader });
      expect(column.matchHeader).toBeDefined();
    });

    it("Preserves reference equality", () => {
      const matchHeader = () => true;
      const column = new Column({ key: "k", name: "n", schema, matchHeader });
      expect(column.matchHeader).toBe(matchHeader);
    });

    it("Callback can be invoked correctly", () => {
      const matchHeader = (h: string) => h === "Header";
      const column = new Column({ key: "k", name: "n", schema, matchHeader });
      expect(column.matchHeader?.("Header")).toBe(true);
      expect(column.matchHeader?.("Other")).toBe(false);
    });

    it("Multiple Column instances can use different callbacks", () => {
      const cb1 = () => true;
      const cb2 = () => false;
      const col1 = new Column({
        key: "1",
        name: "1",
        schema,
        matchHeader: cb1,
      });
      const col2 = new Column({
        key: "2",
        name: "2",
        schema,
        matchHeader: cb2,
      });

      expect(col1.matchHeader).toBe(cb1);
      expect(col2.matchHeader).toBe(cb2);
      expect(col1.matchHeader).not.toBe(col2.matchHeader);
    });
  });

  describe("7. Immutability", () => {
    it("Constructor never mutates the provided config object", () => {
      const schema = new StringSchema();
      const config: ColumnConfig = {
        key: "k",
        name: "n",
        schema,
      };
      const configSnapshot = { ...config };

      new Column(config);

      expect(config).toEqual(configSnapshot);
    });

    it("Schema instance remains unchanged", () => {
      const schema = new StringSchema();
      schema.min(5);
      const originalRules = [...schema._getRules()];

      new Column({ key: "k", name: "n", schema });

      expect(schema._getRules()).toEqual(originalRules);
    });

    it("Callback reference remains unchanged", () => {
      const cb = () => true;
      const config = {
        key: "k",
        name: "n",
        schema: new StringSchema(),
        matchHeader: cb,
      };
      const column = new Column(config);
      expect(column.matchHeader).toBe(cb);
    });
  });

  describe("8. Internal Consistency", () => {
    it("Verify every readonly property contains the expected value after construction", () => {
      const schema = new NumberSchema();
      const matchHeader = () => false;

      const column = new Column({
        key: "age",
        name: "User Age",
        schema,
        duplicatesAllowed: false,
        matchHeader,
      });

      expect(column.key).toBe("age");
      expect(column.name).toBe("User Age");
      expect(column.schema).toBe(schema);
      expect(column.duplicatesAllowed).toBe(false);
      expect(column.matchHeader).toBe(matchHeader);

      expect(Object.keys(column).sort()).toEqual(
        ["duplicatesAllowed", "key", "name", "schema", "matchHeader"].sort(),
      );
    });
  });

  describe("9. Regression Tests", () => {
    it("incorrect default value for duplicatesAllowed", () => {
      const column = new Column({
        key: "k",
        name: "n",
        schema: new StringSchema(),
      });
      expect(column.duplicatesAllowed).toBe(true);
    });

    it("assigning the wrong property", () => {
      const column = new Column({
        key: "realKey",
        name: "realName",
        schema: new StringSchema(),
      });
      expect(column.key).toBe("realKey");
      expect(column.name).toBe("realName");
      expect(column.key).not.toBe(column.name);
    });

    it("accidentally cloning the schema", () => {
      const schema = new BooleanSchema();
      const column = new Column({ key: "k", name: "n", schema });
      expect(column.schema).toBe(schema);
    });

    it("accidentally cloning the callback", () => {
      const cb = () => true;
      const column = new Column({
        key: "k",
        name: "n",
        schema: new StringSchema(),
        matchHeader: cb,
      });
      expect(column.matchHeader).toBe(cb);
    });

    it("accidentally mutating the config object", () => {
      const config = { key: "k", name: "n", schema: new StringSchema() };
      const originalKeys = Object.keys(config);
      new Column(config);
      expect(Object.keys(config)).toEqual(originalKeys);
    });

    it("incorrect property mapping", () => {
      const config = {
        key: "my_key",
        name: "my_name",
        schema: new StringSchema(),
        duplicatesAllowed: false,
        matchHeader: () => true,
      };
      const column = new Column(config);

      expect(column.key).toBe(config.key);
      expect(column.name).toBe(config.name);
      expect(column.duplicatesAllowed).toBe(config.duplicatesAllowed);
      expect(column.matchHeader).toBe(config.matchHeader);
    });

    it("shared mutable state between Column instances", () => {
      const config = { key: "k", name: "n", schema: new StringSchema() };
      const column1 = new Column(config);
      const column2 = new Column(config);

      expect(column1).not.toBe(column2);

      (column1 as any).key = "mutated";
      expect(column2.key).toBe("k");
    });
  });
});
