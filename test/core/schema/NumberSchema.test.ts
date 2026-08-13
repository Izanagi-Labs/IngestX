import { describe, expect, it } from "vitest";
import { NumberSchema, NumberRuleType } from "../../../src/model";

describe("NumberSchema", () => {
  describe("Rule Creation", () => {
    it("min() adds the correct rule with value", () => {
      const schema = new NumberSchema();
      schema.min(5);
      const rules = schema._getRules();
      expect(rules).toHaveLength(1);
      expect(rules[0]).toEqual({
        type: NumberRuleType.Min,
        value: 5,
        message: undefined,
      });
    });

    it("min() adds the correct rule with value and custom message", () => {
      const schema = new NumberSchema();
      schema.min(5, "Must be at least 5");
      const rules = schema._getRules();
      expect(rules[0]).toEqual({
        type: NumberRuleType.Min,
        value: 5,
        message: "Must be at least 5",
      });
    });

    it("max() adds the correct rule with value", () => {
      const schema = new NumberSchema();
      schema.max(10);
      const rules = schema._getRules();
      expect(rules[0]).toEqual({
        type: NumberRuleType.Max,
        value: 10,
        message: undefined,
      });
    });

    it("max() adds the correct rule with value and custom message", () => {
      const schema = new NumberSchema();
      schema.max(10, "Must be at most 10");
      const rules = schema._getRules();
      expect(rules[0]).toEqual({
        type: NumberRuleType.Max,
        value: 10,
        message: "Must be at most 10",
      });
    });

    it("allowedValues() adds the correct rule with value", () => {
      const schema = new NumberSchema();
      schema.allowedValues([1, 2, 3]);
      const rules = schema._getRules();
      expect(rules[0]).toEqual({
        type: NumberRuleType.AllowedValues,
        value: [1, 2, 3],
        message: undefined,
      });
    });

    it("allowedValues() adds the correct rule with value and custom message", () => {
      const schema = new NumberSchema();
      schema.allowedValues([1, 2, 3], "Must be 1, 2, or 3");
      const rules = schema._getRules();
      expect(rules[0]).toEqual({
        type: NumberRuleType.AllowedValues,
        value: [1, 2, 3],
        message: "Must be 1, 2, or 3",
      });
    });
  });

  describe("Chaining", () => {
    it("returns the same schema instance", () => {
      const schema = new NumberSchema();
      const returnedSchema1 = schema.min(5);
      const returnedSchema2 = returnedSchema1.max(10);
      const returnedSchema3 = returnedSchema2.allowedValues([
        5, 6, 7, 8, 9, 10,
      ]);

      expect(returnedSchema1).toBe(schema);
      expect(returnedSchema2).toBe(schema);
      expect(returnedSchema3).toBe(schema);
    });

    it("supports fluent chaining with other methods", () => {
      const schema = new NumberSchema()
        .min(0)
        .max(100)
        .allowedValues([0, 50, 100]);
      const rules = schema._getRules();
      expect(rules).toHaveLength(3);
    });
  });

  describe("Rule Ordering", () => {
    it("stores rules in the order they were added", () => {
      const schema = new NumberSchema().max(10).min(0).allowedValues([5]);
      const rules = schema._getRules();

      expect(rules[0].type).toBe(NumberRuleType.Max);
      expect(rules[1].type).toBe(NumberRuleType.Min);
      expect(rules[2].type).toBe(NumberRuleType.AllowedValues);
    });

    it("preserves insertion order when multiple calls to the same method are made", () => {
      const schema = new NumberSchema().min(5).min(10).min(15);
      const rules = schema._getRules();

      expect(rules).toHaveLength(3);
      expect(rules[0]).toEqual({
        type: NumberRuleType.Min,
        value: 5,
        message: undefined,
      });
      expect(rules[1]).toEqual({
        type: NumberRuleType.Min,
        value: 10,
        message: undefined,
      });
      expect(rules[2]).toEqual({
        type: NumberRuleType.Min,
        value: 15,
        message: undefined,
      });
    });
  });

  describe("Multiple Rules", () => {
    it("allows multiple different rules to coexist correctly", () => {
      const schema = new NumberSchema()
        .min(1)
        .max(10)
        .allowedValues([1, 5, 10]);
      const rules = schema._getRules();

      expect(rules).toHaveLength(3);
      expect(rules.map((r) => r.type)).toEqual([
        NumberRuleType.Min,
        NumberRuleType.Max,
        NumberRuleType.AllowedValues,
      ]);
    });

    it("ensures adding one rule does not modify previous rules", () => {
      const schema = new NumberSchema().min(5, "min msg");
      const rulesAfterMin = [...schema._getRules()];

      schema.max(10, "max msg");
      const rulesAfterMax = schema._getRules();

      expect(rulesAfterMax[0]).toEqual(rulesAfterMin[0]);
      expect(rulesAfterMax[0]).toEqual({
        type: NumberRuleType.Min,
        value: 5,
        message: "min msg",
      });
      expect(rulesAfterMax[1]).toEqual({
        type: NumberRuleType.Max,
        value: 10,
        message: "max msg",
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles zero correctly", () => {
      const schema = new NumberSchema().min(0).max(0).allowedValues([0]);
      const rules = schema._getRules();
      expect(rules[0].value).toBe(0);
      expect(rules[1].value).toBe(0);
      expect(rules[2].value).toEqual([0]);
    });

    it("handles negative numbers correctly", () => {
      const schema = new NumberSchema()
        .min(-10)
        .max(-5)
        .allowedValues([-7, -8]);
      const rules = schema._getRules();
      expect(rules[0].value).toBe(-10);
      expect(rules[1].value).toBe(-5);
      expect(rules[2].value).toEqual([-7, -8]);
    });

    it("handles decimal numbers correctly", () => {
      const schema = new NumberSchema().min(1.5).max(3.14).allowedValues([2.5]);
      const rules = schema._getRules();
      expect(rules[0].value).toBe(1.5);
      expect(rules[1].value).toBe(3.14);
      expect(rules[2].value).toEqual([2.5]);
    });

    it("handles Infinity correctly", () => {
      const schema = new NumberSchema()
        .min(Infinity)
        .max(Infinity)
        .allowedValues([Infinity]);
      const rules = schema._getRules();
      expect(rules[0].value).toBe(Infinity);
      expect(rules[1].value).toBe(Infinity);
      expect(rules[2].value).toEqual([Infinity]);
    });

    it("handles -Infinity correctly", () => {
      const schema = new NumberSchema()
        .min(-Infinity)
        .max(-Infinity)
        .allowedValues([-Infinity]);
      const rules = schema._getRules();
      expect(rules[0].value).toBe(-Infinity);
      expect(rules[1].value).toBe(-Infinity);
      expect(rules[2].value).toEqual([-Infinity]);
    });

    it("handles Number.MAX_SAFE_INTEGER correctly", () => {
      const schema = new NumberSchema()
        .min(Number.MAX_SAFE_INTEGER)
        .max(Number.MAX_SAFE_INTEGER)
        .allowedValues([Number.MAX_SAFE_INTEGER]);
      const rules = schema._getRules();
      expect(rules[0].value).toBe(Number.MAX_SAFE_INTEGER);
      expect(rules[1].value).toBe(Number.MAX_SAFE_INTEGER);
      expect(rules[2].value).toEqual([Number.MAX_SAFE_INTEGER]);
    });

    it("handles Number.MIN_SAFE_INTEGER correctly", () => {
      const schema = new NumberSchema()
        .min(Number.MIN_SAFE_INTEGER)
        .max(Number.MIN_SAFE_INTEGER)
        .allowedValues([Number.MIN_SAFE_INTEGER]);
      const rules = schema._getRules();
      expect(rules[0].value).toBe(Number.MIN_SAFE_INTEGER);
      expect(rules[1].value).toBe(Number.MIN_SAFE_INTEGER);
      expect(rules[2].value).toEqual([Number.MIN_SAFE_INTEGER]);
    });

    it("handles duplicate values in allowedValues", () => {
      const schema = new NumberSchema().allowedValues([1, 1, 2, 2, 3]);
      const rules = schema._getRules();
      expect(rules[0].value).toEqual([1, 1, 2, 2, 3]);
    });

    it("handles empty allowedValues array", () => {
      const schema = new NumberSchema().allowedValues([]);
      const rules = schema._getRules();
      expect(rules[0].value).toEqual([]);
    });
  });

  describe("Immutability", () => {
    it("ensures values passed into allowedValues are not mutated by the schema", () => {
      const schema = new NumberSchema();
      const originalArray = Object.freeze([1, 2, 3]);

      // Should not throw when passing frozen array
      schema.allowedValues(originalArray);

      const rules = schema._getRules();
      // Verify the reference is kept and not mutated
      expect(rules[0].value).toBe(originalArray);
    });
  });

  describe("Internal Consistency", () => {
    it("_getRules() returns all rules correctly", () => {
      const schema = new NumberSchema().min(1).max(2);
      const rules = schema._getRules();
      expect(rules).toHaveLength(2);
      expect(rules[0].type).toBe(NumberRuleType.Min);
      expect(rules[1].type).toBe(NumberRuleType.Max);
    });

    it("Rule objects have the expected shape", () => {
      const schema = new NumberSchema().min(1, "message");
      const rules = schema._getRules();
      expect(rules[0]).toHaveProperty("type");
      expect(rules[0]).toHaveProperty("value");
      expect(rules[0]).toHaveProperty("message");
      expect(Object.keys(rules[0]).length).toBe(3);
    });

    it("Rule types are correct", () => {
      const schema = new NumberSchema().min(1).max(2).allowedValues([3]);
      const rules = schema._getRules();
      expect(rules[0].type).toBe(NumberRuleType.Min);
      expect(rules[1].type).toBe(NumberRuleType.Max);
      expect(rules[2].type).toBe(NumberRuleType.AllowedValues);
    });
  });

  describe("Regression Tests", () => {
    it("preserves rule integrity if multiple schemas are instantiated", () => {
      const schema1 = new NumberSchema().min(1);
      const schema2 = new NumberSchema().min(2);

      expect(schema1._getRules()[0].value).toBe(1);
      expect(schema2._getRules()[0].value).toBe(2);
    });

    it("can handle chained methods without state bleed", () => {
      const schema1 = new NumberSchema();
      const schema2 = new NumberSchema();

      schema1.min(10);
      schema2.max(20);

      expect(schema1._getRules()).toHaveLength(1);
      expect(schema2._getRules()).toHaveLength(1);

      expect(schema1._getRules()[0].type).toBe(NumberRuleType.Min);
      expect(schema2._getRules()[0].type).toBe(NumberRuleType.Max);
    });

    it("does not incorrectly share array references between rules", () => {
      const schema = new NumberSchema();
      const arr1 = [1, 2];
      const arr2 = [3, 4];

      schema.allowedValues(arr1).allowedValues(arr2);

      const rules = schema._getRules();
      expect(rules[0].value).toBe(arr1);
      expect(rules[1].value).toBe(arr2);
      expect(rules[0].value).not.toBe(rules[1].value);
    });
  });
});
