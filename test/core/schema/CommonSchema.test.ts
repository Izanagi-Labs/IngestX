import { describe, it, expect, beforeEach } from 'vitest';
import { CommonSchema, CommonRuleType } from '../../../src/model';

class TestSchema extends CommonSchema<any, any> {}

describe('CommonSchema', () => {
  let schema: TestSchema;

  beforeEach(() => {
    schema = new TestSchema();
  });

  describe('custom()', () => {
    it('appends exactly one rule, stores validator and custom message, and returns same schema instance', () => {
      const validator = (value: any) => true;
      const message = 'Custom validation failed';

      const result = schema.custom(validator, message);

      expect(result).toBe(schema);

      const rules = schema._getRules();
      expect(rules).toHaveLength(1);

      expect(rules[0]).toStrictEqual({
        type: CommonRuleType.Custom,
        value: validator,
        message: message,
      });
    });
  });

  describe('optional()', () => {
    it('appends one optional rule, stores true as value, and returns this', () => {
      const result = schema.optional();

      expect(result).toBe(schema);

      const rules = schema._getRules();
      expect(rules).toHaveLength(1);

      expect(rules[0]).toStrictEqual({
        type: CommonRuleType.Optional,
        value: true,
      });
    });
  });

  describe('default()', () => {
    it('stores the provided value, supports primitive values, and returns this', () => {
      const result = schema.default('test_value');

      expect(result).toBe(schema);

      let rules = schema._getRules();
      expect(rules).toHaveLength(1);

      expect(rules[0]).toStrictEqual({
        type: CommonRuleType.Default,
        value: 'test_value',
      });

      // Support for other primitives
      schema.default(42);
      schema.default(true);
      schema.default(null);

      rules = schema._getRules();
      expect(rules).toHaveLength(4);

      expect(rules[1]).toStrictEqual({
        type: CommonRuleType.Default,
        value: 42,
      });

      expect(rules[2]).toStrictEqual({
        type: CommonRuleType.Default,
        value: true,
      });

      expect(rules[3]).toStrictEqual({
        type: CommonRuleType.Default,
        value: null,
      });
    });
  });

  describe('transform()', () => {
    it('stores the transform function reference and returns this', () => {
      const transformer = (value: any) => String(value);

      const result = schema.transform(transformer);

      expect(result).toBe(schema);

      const rules = schema._getRules();
      expect(rules).toHaveLength(1);

      expect(rules[0]).toStrictEqual({
        type: CommonRuleType.Transform,
        value: transformer,
      });
    });
  });

  describe('Chaining', () => {
    it('preserves insertion order, appends every rule, and returns original schema instance', () => {
      const validator = (val: any) => true;
      const transformer = (val: any) => val;

      const result = schema
        .optional()
        .default('default_val')
        .custom(validator, 'custom_msg')
        .transform(transformer);

      expect(result).toBe(schema);

      const rules = schema._getRules();
      expect(rules).toHaveLength(4);

      expect(rules[0]).toStrictEqual({
        type: CommonRuleType.Optional,
        value: true,
      });

      expect(rules[1]).toStrictEqual({
        type: CommonRuleType.Default,
        value: 'default_val',
      });

      expect(rules[2]).toStrictEqual({
        type: CommonRuleType.Custom,
        value: validator,
        message: 'custom_msg',
      });

      expect(rules[3]).toStrictEqual({
        type: CommonRuleType.Transform,
        value: transformer,
      });
    });
  });

  describe('Empty schema', () => {
    it('initially contains zero rules', () => {
      const emptySchema = new TestSchema();
      expect(emptySchema._getRules()).toHaveLength(0);
    });
  });

  describe('Multiple custom() calls', () => {
    it('all rules are preserved', () => {
      const validator1 = () => true;
      const validator2 = () => false;

      schema.custom(validator1, 'msg1').custom(validator2, 'msg2');

      const rules = schema._getRules();
      expect(rules).toHaveLength(2);

      expect(rules[0]).toStrictEqual({
        type: CommonRuleType.Custom,
        value: validator1,
        message: 'msg1',
      });

      expect(rules[1]).toStrictEqual({
        type: CommonRuleType.Custom,
        value: validator2,
        message: 'msg2',
      });
    });
  });

  describe('Multiple transform() calls', () => {
    it('all rules are preserved', () => {
      const transform1 = (v: any) => v;
      const transform2 = (v: any) => v;

      schema.transform(transform1).transform(transform2);

      const rules = schema._getRules();
      expect(rules).toHaveLength(2);

      expect(rules[0]).toStrictEqual({
        type: CommonRuleType.Transform,
        value: transform1,
      });

      expect(rules[1]).toStrictEqual({
        type: CommonRuleType.Transform,
        value: transform2,
      });
    });
  });

  describe('Internal rules', () => {
    it('rule type is correct, value is correct, message is preserved, no existing rule is mutated after adding another rule', () => {
      const validator = (val: any) => true;

      schema.custom(validator, 'initial_msg');

      const rulesAfterFirstCall = schema._getRules();
      const firstRuleCopy = { ...rulesAfterFirstCall[0] };

      schema.optional();

      const currentRules = schema._getRules();

      expect(currentRules).toHaveLength(2);

      // The original reference shouldn't be mutated
      expect(currentRules[0]).toStrictEqual(firstRuleCopy);

      expect(currentRules[1]).toStrictEqual({
        type: CommonRuleType.Optional,
        value: true,
      });
    });
  });
});
