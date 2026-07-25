import { describe, it, expect } from 'vitest';
import { StringSchema } from '../../../src/core/schema/StringSchema';
import { StringRuleType } from '../../../src/core/types/RuleType';

describe('StringSchema', () => {
  describe('1. Rule Registration', () => {
    describe('min', () => {
      it('registers the correct rule type and value', () => {
        const schema = new StringSchema();
        schema.min(5);
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: StringRuleType.Min,
          value: 5,
          message: undefined,
        });
      });

      it('stores the optional custom message', () => {
        const schema = new StringSchema();
        schema.min(5, 'Minimum is 5');
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: StringRuleType.Min,
          value: 5,
          message: 'Minimum is 5',
        });
      });

      it('works correctly without a custom message', () => {
        const schema = new StringSchema();
        schema.min(5);
        const rules = schema._getRules();
        expect(rules[0].message).toBeUndefined();
      });
    });

    describe('max', () => {
      it('registers the correct rule type and value', () => {
        const schema = new StringSchema();
        schema.max(10);
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: StringRuleType.Max,
          value: 10,
          message: undefined,
        });
      });

      it('stores the optional custom message', () => {
        const schema = new StringSchema();
        schema.max(10, 'Maximum is 10');
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: StringRuleType.Max,
          value: 10,
          message: 'Maximum is 10',
        });
      });

      it('works correctly without a custom message', () => {
        const schema = new StringSchema();
        schema.max(10);
        const rules = schema._getRules();
        expect(rules[0].message).toBeUndefined();
      });
    });

    describe('allowedValues', () => {
      it('registers the correct rule type and value', () => {
        const schema = new StringSchema();
        schema.allowedValues([1, 2]);
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: StringRuleType.AllowedValues,
          value: [1, 2],
          message: undefined,
        });
      });

      it('stores the optional custom message', () => {
        const schema = new StringSchema();
        schema.allowedValues([1, 2], 'Must be 1 or 2');
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: StringRuleType.AllowedValues,
          value: [1, 2],
          message: 'Must be 1 or 2',
        });
      });

      it('works correctly without a custom message', () => {
        const schema = new StringSchema();
        schema.allowedValues([1, 2]);
        const rules = schema._getRules();
        expect(rules[0].message).toBeUndefined();
      });
    });

    describe('regex', () => {
      it('registers the correct rule type and value', () => {
        const schema = new StringSchema();
        const pattern = /test/;
        schema.regex(pattern);
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: StringRuleType.Regex,
          value: pattern,
          message: undefined,
        });
      });

      it('stores the optional custom message', () => {
        const schema = new StringSchema();
        const pattern = /test/;
        schema.regex(pattern, 'Must match test');
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: StringRuleType.Regex,
          value: pattern,
          message: 'Must match test',
        });
      });

      it('works correctly without a custom message', () => {
        const schema = new StringSchema();
        schema.regex(/test/);
        const rules = schema._getRules();
        expect(rules[0].message).toBeUndefined();
      });
    });

    describe('caseSensitive', () => {
      it('registers the correct rule type and value', () => {
        const schema = new StringSchema();
        schema.caseSensitive();
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: StringRuleType.CaseSensitive,
          value: true,
          message: undefined,
        });
      });

      it('works correctly (does not accept custom message)', () => {
        const schema = new StringSchema();
        schema.caseSensitive();
        const rules = schema._getRules();
        expect(rules[0].message).toBeUndefined();
      });
    });
  });

  describe('2. Fluent API', () => {
    it('returns the same schema instance', () => {
      const schema = new StringSchema();
      expect(schema.min(5)).toBe(schema);
      expect(schema.max(10)).toBe(schema);
      expect(schema.allowedValues([1])).toBe(schema);
      expect(schema.regex(/a/)).toBe(schema);
      expect(schema.caseSensitive()).toBe(schema);
    });

    it('supports chaining with all other methods', () => {
      const schema = new StringSchema();
      schema.min(1).max(10).allowedValues([1, 2]).regex(/test/).caseSensitive();

      expect(schema._getRules()).toHaveLength(5);
    });

    it('preserves chain order', () => {
      const schema = new StringSchema()
        .min(1)
        .max(10)
        .allowedValues([1, 2])
        .regex(/test/)
        .caseSensitive();

      const rules = schema._getRules();
      expect(rules[0].type).toBe(StringRuleType.Min);
      expect(rules[1].type).toBe(StringRuleType.Max);
      expect(rules[2].type).toBe(StringRuleType.AllowedValues);
      expect(rules[3].type).toBe(StringRuleType.Regex);
      expect(rules[4].type).toBe(StringRuleType.CaseSensitive);
    });
  });

  describe('3. Rule Ordering', () => {
    it('stores rules in insertion order', () => {
      const schema = new StringSchema().max(10).min(5);
      const rules = schema._getRules();
      expect(rules[0].type).toBe(StringRuleType.Max);
      expect(rules[1].type).toBe(StringRuleType.Min);
    });

    it('preserves order for multiple calls to the same method', () => {
      const schema = new StringSchema().min(5).min(10);
      const rules = schema._getRules();
      expect(rules[0]).toEqual({
        type: StringRuleType.Min,
        value: 5,
        message: undefined,
      });
      expect(rules[1]).toEqual({
        type: StringRuleType.Min,
        value: 10,
        message: undefined,
      });
    });

    it('preserves insertion order for different rule types', () => {
      const schema = new StringSchema()
        .caseSensitive()
        .regex(/a/)
        .allowedValues([1])
        .max(2)
        .min(1);
      const rules = schema._getRules();
      expect(rules.map((r) => r.type)).toEqual([
        StringRuleType.CaseSensitive,
        StringRuleType.Regex,
        StringRuleType.AllowedValues,
        StringRuleType.Max,
        StringRuleType.Min,
      ]);
    });
  });

  describe('4. Multiple Rules', () => {
    it('allows multiple different rules to coexist correctly', () => {
      const schema = new StringSchema().min(1).max(10);
      const rules = schema._getRules();
      expect(rules).toHaveLength(2);
      expect(rules[0].type).toBe(StringRuleType.Min);
      expect(rules[1].type).toBe(StringRuleType.Max);
    });

    it('never modifies previous rules when adding a new rule', () => {
      const schema = new StringSchema();
      schema.min(5);
      const firstRuleSnapshot = { ...schema._getRules()[0] };
      schema.max(10);
      expect(schema._getRules()[0]).toEqual(firstRuleSnapshot);
    });

    it('stores duplicate rule types independently', () => {
      const schema = new StringSchema().regex(/a/).regex(/b/);
      const rules = schema._getRules();
      expect(rules).toHaveLength(2);
      expect(rules[0].value).toEqual(/a/);
      expect(rules[1].value).toEqual(/b/);
    });
  });

  describe('5. Edge Cases', () => {
    describe('min / max', () => {
      it('handles 0 correctly', () => {
        const schema = new StringSchema().min(0).max(0);
        const rules = schema._getRules();
        expect(rules[0].value).toBe(0);
        expect(rules[1].value).toBe(0);
      });

      it('handles 1 correctly', () => {
        const schema = new StringSchema().min(1).max(1);
        const rules = schema._getRules();
        expect(rules[0].value).toBe(1);
        expect(rules[1].value).toBe(1);
      });

      it('handles negative values correctly', () => {
        const schema = new StringSchema().min(-5).max(-1);
        const rules = schema._getRules();
        expect(rules[0].value).toBe(-5);
        expect(rules[1].value).toBe(-1);
      });

      it('handles large values correctly', () => {
        const schema = new StringSchema()
          .min(Number.MAX_SAFE_INTEGER)
          .max(Number.MAX_VALUE);
        const rules = schema._getRules();
        expect(rules[0].value).toBe(Number.MAX_SAFE_INTEGER);
        expect(rules[1].value).toBe(Number.MAX_VALUE);
      });
    });

    describe('allowedValues', () => {
      it('handles empty array', () => {
        const schema = new StringSchema().allowedValues([]);
        expect(schema._getRules()[0].value).toEqual([]);
      });

      it('handles single value', () => {
        const schema = new StringSchema().allowedValues([1]);
        expect(schema._getRules()[0].value).toEqual([1]);
      });

      it('handles multiple values', () => {
        const schema = new StringSchema().allowedValues([1, 2, 3]);
        expect(schema._getRules()[0].value).toEqual([1, 2, 3]);
      });

      it('handles duplicate values', () => {
        const schema = new StringSchema().allowedValues([1, 1, 2]);
        expect(schema._getRules()[0].value).toEqual([1, 1, 2]);
      });

      it('handles values containing different casing', () => {
        const values = ['aBc', 'AbC'] as unknown as number[];
        const schema = new StringSchema().allowedValues(values);
        expect(schema._getRules()[0].value).toEqual(values);
      });

      it('handles values containing whitespace', () => {
        const values = [' a ', '\t', '\n'] as unknown as number[];
        const schema = new StringSchema().allowedValues(values);
        expect(schema._getRules()[0].value).toEqual(values);
      });

      it('handles Unicode strings', () => {
        const values = ['こんにちは', '你好'] as unknown as number[];
        const schema = new StringSchema().allowedValues(values);
        expect(schema._getRules()[0].value).toEqual(values);
      });

      it('handles Emoji strings', () => {
        const values = ['🔥', '👍🏻'] as unknown as number[];
        const schema = new StringSchema().allowedValues(values);
        expect(schema._getRules()[0].value).toEqual(values);
      });
    });

    describe('regex', () => {
      it('handles simple regex', () => {
        const pattern = /abc/;
        const schema = new StringSchema().regex(pattern);
        expect(schema._getRules()[0].value).toBe(pattern);
      });

      it('handles regex with flags', () => {
        const pattern = /abc/gi;
        const schema = new StringSchema().regex(pattern);
        expect(schema._getRules()[0].value).toBe(pattern);
      });

      it('handles empty regex', () => {
        const pattern = /(?:)/;
        const schema = new StringSchema().regex(pattern);
        expect(schema._getRules()[0].value).toBe(pattern);
      });

      it('handles complex regex', () => {
        const pattern = /^(?:\d{3}|\(\d{3}\))([-\/\.])\d{3}\1\d{4}$/;
        const schema = new StringSchema().regex(pattern);
        expect(schema._getRules()[0].value).toBe(pattern);
      });

      it('ensures the exact RegExp instance is stored', () => {
        const pattern = /abc/;
        const schema = new StringSchema().regex(pattern);
        expect(schema._getRules()[0].value).toBe(pattern);
      });
    });

    describe('caseSensitive', () => {
      it('registers the rule with value true', () => {
        const schema = new StringSchema().caseSensitive();
        expect(schema._getRules()[0].value).toBe(true);
      });

      it('can coexist with regex and allowedValues', () => {
        const schema = new StringSchema()
          .regex(/a/)
          .caseSensitive()
          .allowedValues([1]);

        const rules = schema._getRules();
        expect(rules).toHaveLength(3);
        expect(rules[0].type).toBe(StringRuleType.Regex);
        expect(rules[1].type).toBe(StringRuleType.CaseSensitive);
        expect(rules[2].type).toBe(StringRuleType.AllowedValues);
      });

      it('multiple calls preserve insertion order', () => {
        const schema = new StringSchema()
          .caseSensitive()
          .min(1)
          .caseSensitive();

        const rules = schema._getRules();
        expect(rules[0].type).toBe(StringRuleType.CaseSensitive);
        expect(rules[1].type).toBe(StringRuleType.Min);
        expect(rules[2].type).toBe(StringRuleType.CaseSensitive);
      });
    });
  });

  describe('6. Immutability', () => {
    it('allowedValues array is not mutated', () => {
      const originalArray = [1, 2, 3];
      const arrayCopy = [...originalArray];
      const schema = new StringSchema().allowedValues(originalArray);

      expect(originalArray).toEqual(arrayCopy);
      expect(schema._getRules()[0].value).toBe(originalArray);
    });

    it('RegExp instance is not modified', () => {
      const pattern = /test/g;
      const lastIndex = pattern.lastIndex;
      const schema = new StringSchema().regex(pattern);

      expect(pattern.lastIndex).toBe(lastIndex);
      expect(schema._getRules()[0].value).toBe(pattern);
    });

    it('previously registered rules remain unchanged after adding more rules', () => {
      const schema = new StringSchema().min(5);
      const rulesFirstSnapshot = [...schema._getRules()];

      schema.max(10).caseSensitive();
      const rulesSecondSnapshot = schema._getRules();

      expect(rulesSecondSnapshot[0]).toEqual(rulesFirstSnapshot[0]);
      expect(rulesSecondSnapshot[0]).toBe(rulesFirstSnapshot[0]);
    });
  });

  describe('7. Internal Consistency', () => {
    it('_getRules() returns every registered rule', () => {
      const schema = new StringSchema()
        .min(1)
        .max(2)
        .allowedValues([3])
        .regex(/a/)
        .caseSensitive();

      expect(schema._getRules()).toHaveLength(5);
    });

    it('Rule objects have the expected shape', () => {
      const schema = new StringSchema().min(5, 'msg');
      const rule = schema._getRules()[0];

      expect(rule).toHaveProperty('type');
      expect(rule).toHaveProperty('value');
      expect(rule).toHaveProperty('message');

      const keys = Object.keys(rule);
      expect(keys.includes('type')).toBe(true);
      expect(keys.includes('value')).toBe(true);
      expect(keys.includes('message')).toBe(true);
    });

    it('Rule values are correct', () => {
      const pattern = /test/;
      const schema = new StringSchema()
        .min(1)
        .max(2)
        .regex(pattern)
        .allowedValues([4])
        .caseSensitive();

      const rules = schema._getRules();
      expect(rules[0].value).toBe(1);
      expect(rules[1].value).toBe(2);
      expect(rules[2].value).toBe(pattern);
      expect(rules[3].value).toEqual([4]);
      expect(rules[4].value).toBe(true);
    });

    it('Rule messages are correct', () => {
      const schema = new StringSchema()
        .min(1, 'min msg')
        .max(2, 'max msg')
        .regex(/a/, 'regex msg')
        .allowedValues([4], 'allowed msg')
        .caseSensitive();

      const rules = schema._getRules();
      expect(rules[0].message).toBe('min msg');
      expect(rules[1].message).toBe('max msg');
      expect(rules[2].message).toBe('regex msg');
      expect(rules[3].message).toBe('allowed msg');
      expect(rules[4].message).toBeUndefined();
    });

    it('Rule types are correct', () => {
      const schema = new StringSchema()
        .min(1)
        .max(2)
        .regex(/a/)
        .allowedValues([4])
        .caseSensitive();

      const rules = schema._getRules();
      expect(rules[0].type).toBe(StringRuleType.Min);
      expect(rules[1].type).toBe(StringRuleType.Max);
      expect(rules[2].type).toBe(StringRuleType.Regex);
      expect(rules[3].type).toBe(StringRuleType.AllowedValues);
      expect(rules[4].type).toBe(StringRuleType.CaseSensitive);
    });
  });

  describe('8. Regression Tests', () => {
    it('accidental rule overwriting does not occur', () => {
      const schema = new StringSchema();
      schema.min(1).min(2);
      const rules = schema._getRules();

      expect(rules).toHaveLength(2);
      expect(rules[0].value).toBe(1);
      expect(rules[1].value).toBe(2);
    });

    it('incorrect rule order does not occur', () => {
      const schema = new StringSchema().max(10).min(5);
      const rules = schema._getRules();

      expect(rules[0].type).toBe(StringRuleType.Max);
      expect(rules[1].type).toBe(StringRuleType.Min);
    });

    it('incorrect message assignment does not occur', () => {
      const schema = new StringSchema().min(5, 'has message').max(10);
      const rules = schema._getRules();

      expect(rules[0].message).toBe('has message');
      expect(rules[1].message).toBeUndefined();
    });

    it('incorrect rule type does not occur', () => {
      const schema = new StringSchema()
        .min(1)
        .max(1)
        .regex(/a/)
        .allowedValues([1])
        .caseSensitive();

      const ruleTypes = schema._getRules().map((r) => r.type);

      const expectedTypes = [
        StringRuleType.Min,
        StringRuleType.Max,
        StringRuleType.Regex,
        StringRuleType.AllowedValues,
        StringRuleType.CaseSensitive,
      ];

      expect(ruleTypes).toEqual(expectedTypes);
    });

    it('accidental mutation of stored values does not leak across instances', () => {
      const schema1 = new StringSchema().min(1);
      const schema2 = new StringSchema().min(2);

      expect(schema1._getRules()[0].value).toBe(1);
      expect(schema2._getRules()[0].value).toBe(2);
    });
  });
});
