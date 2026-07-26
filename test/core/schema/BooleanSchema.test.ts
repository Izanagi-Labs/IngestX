import { describe, it, expect } from 'vitest';
import { BooleanSchema } from '../../../src/core/schema/BooleanSchema';
import { BooleanRuleType } from '../../../src/core/types/RuleType';

describe('BooleanSchema', () => {
  describe('1. Rule Registration', () => {
    describe('truthy', () => {
      it('registers the correct rule type and value', () => {
        const schema = new BooleanSchema();
        schema.truthy(['yes', '1']);
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: BooleanRuleType.Truthy,
          value: ['yes', '1'],
          message: undefined,
        });
      });

      it('stores the optional custom message', () => {
        const schema = new BooleanSchema();
        schema.truthy(['yes'], 'Must be truthy');
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: BooleanRuleType.Truthy,
          value: ['yes'],
          message: 'Must be truthy',
        });
      });

      it('works correctly without a custom message', () => {
        const schema = new BooleanSchema();
        schema.truthy(['yes']);
        const rules = schema._getRules();
        expect(rules[0].message).toBeUndefined();
      });
    });

    describe('falsy', () => {
      it('registers the correct rule type and value', () => {
        const schema = new BooleanSchema();
        schema.falsy(['no', '0']);
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: BooleanRuleType.Falsy,
          value: ['no', '0'],
          message: undefined,
        });
      });

      it('stores the optional custom message', () => {
        const schema = new BooleanSchema();
        schema.falsy(['no'], 'Must be falsy');
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: BooleanRuleType.Falsy,
          value: ['no'],
          message: 'Must be falsy',
        });
      });

      it('works correctly without a custom message', () => {
        const schema = new BooleanSchema();
        schema.falsy(['no']);
        const rules = schema._getRules();
        expect(rules[0].message).toBeUndefined();
      });
    });

    describe('caseSensitive', () => {
      it('registers the correct rule type and value', () => {
        const schema = new BooleanSchema();
        schema.caseSensitive();
        const rules = schema._getRules();
        expect(rules).toHaveLength(1);
        expect(rules[0]).toEqual({
          type: BooleanRuleType.CaseSensitive,
          value: true,
          message: undefined,
        });
      });

      it('works correctly (does not accept custom message)', () => {
        const schema = new BooleanSchema();
        schema.caseSensitive();
        const rules = schema._getRules();
        expect(rules[0].message).toBeUndefined();
      });
    });
  });

  describe('2. Fluent API', () => {
    it('returns the same schema instance', () => {
      const schema = new BooleanSchema();
      expect(schema.truthy(['yes'])).toBe(schema);
      expect(schema.falsy(['no'])).toBe(schema);
      expect(schema.caseSensitive()).toBe(schema);
    });

    it('supports chaining with all other methods', () => {
      const schema = new BooleanSchema()
        .truthy(['yes'])
        .falsy(['no'])
        .caseSensitive();

      expect(schema._getRules()).toHaveLength(3);
    });

    it('preserves chain order', () => {
      const schema = new BooleanSchema()
        .truthy(['yes'])
        .caseSensitive()
        .falsy(['no']);

      const rules = schema._getRules();
      expect(rules[0].type).toBe(BooleanRuleType.Truthy);
      expect(rules[1].type).toBe(BooleanRuleType.CaseSensitive);
      expect(rules[2].type).toBe(BooleanRuleType.Falsy);
    });
  });

  describe('3. Rule Ordering', () => {
    it('stores rules in insertion order', () => {
      const schema = new BooleanSchema().falsy(['no']).truthy(['yes']);
      const rules = schema._getRules();
      expect(rules[0].type).toBe(BooleanRuleType.Falsy);
      expect(rules[1].type).toBe(BooleanRuleType.Truthy);
    });

    it('preserves order for multiple calls to the same method', () => {
      const schema = new BooleanSchema().truthy(['yes']).truthy(['1']);
      const rules = schema._getRules();
      expect(rules[0]).toEqual({
        type: BooleanRuleType.Truthy,
        value: ['yes'],
        message: undefined,
      });
      expect(rules[1]).toEqual({
        type: BooleanRuleType.Truthy,
        value: ['1'],
        message: undefined,
      });
    });

    it('preserves insertion order for different rule types', () => {
      const schema = new BooleanSchema()
        .caseSensitive()
        .falsy(['no'])
        .truthy(['yes']);
      const rules = schema._getRules();
      expect(rules.map((r) => r.type)).toEqual([
        BooleanRuleType.CaseSensitive,
        BooleanRuleType.Falsy,
        BooleanRuleType.Truthy,
      ]);
    });
  });

  describe('4. Multiple Rules', () => {
    it('allows multiple different rules to coexist correctly', () => {
      const schema = new BooleanSchema().truthy(['yes']).falsy(['no']);
      const rules = schema._getRules();
      expect(rules).toHaveLength(2);
      expect(rules[0].type).toBe(BooleanRuleType.Truthy);
      expect(rules[1].type).toBe(BooleanRuleType.Falsy);
    });

    it('never modifies previous rules when adding a new rule', () => {
      const schema = new BooleanSchema();
      schema.truthy(['yes']);
      const firstRuleSnapshot = { ...schema._getRules()[0] };
      schema.falsy(['no']);
      expect(schema._getRules()[0]).toEqual(firstRuleSnapshot);
    });

    it('stores duplicate rule types independently', () => {
      const schema = new BooleanSchema().truthy(['yes']).truthy(['1']);
      const rules = schema._getRules();
      expect(rules).toHaveLength(2);
      expect(rules[0].value).toEqual(['yes']);
      expect(rules[1].value).toEqual(['1']);
    });
  });

  describe('5. Edge Cases', () => {
    describe('truthy', () => {
      it('handles empty array', () => {
        const schema = new BooleanSchema().truthy([]);
        expect(schema._getRules()[0].value).toEqual([]);
      });

      it('handles single value', () => {
        const schema = new BooleanSchema().truthy(['yes']);
        expect(schema._getRules()[0].value).toEqual(['yes']);
      });

      it('handles multiple values', () => {
        const schema = new BooleanSchema().truthy(['yes', '1', 'on']);
        expect(schema._getRules()[0].value).toEqual(['yes', '1', 'on']);
      });

      it('handles duplicate values', () => {
        const schema = new BooleanSchema().truthy(['yes', 'yes', 'on']);
        expect(schema._getRules()[0].value).toEqual(['yes', 'yes', 'on']);
      });

      it('handles mixed casing', () => {
        const schema = new BooleanSchema().truthy(['YeS', 'TrUe']);
        expect(schema._getRules()[0].value).toEqual(['YeS', 'TrUe']);
      });

      it('handles values containing whitespace', () => {
        const schema = new BooleanSchema().truthy([' yes ', '\t', '\n']);
        expect(schema._getRules()[0].value).toEqual([' yes ', '\t', '\n']);
      });

      it('handles Unicode strings', () => {
        const schema = new BooleanSchema().truthy(['はい', '是的']);
        expect(schema._getRules()[0].value).toEqual(['はい', '是的']);
      });

      it('handles Emoji strings', () => {
        const schema = new BooleanSchema().truthy(['✅', '👍']);
        expect(schema._getRules()[0].value).toEqual(['✅', '👍']);
      });
    });

    describe('falsy', () => {
      it('handles empty array', () => {
        const schema = new BooleanSchema().falsy([]);
        expect(schema._getRules()[0].value).toEqual([]);
      });

      it('handles single value', () => {
        const schema = new BooleanSchema().falsy(['no']);
        expect(schema._getRules()[0].value).toEqual(['no']);
      });

      it('handles multiple values', () => {
        const schema = new BooleanSchema().falsy(['no', '0', 'off']);
        expect(schema._getRules()[0].value).toEqual(['no', '0', 'off']);
      });

      it('handles duplicate values', () => {
        const schema = new BooleanSchema().falsy(['no', 'no', 'off']);
        expect(schema._getRules()[0].value).toEqual(['no', 'no', 'off']);
      });

      it('handles mixed casing', () => {
        const schema = new BooleanSchema().falsy(['nO', 'FaLsE']);
        expect(schema._getRules()[0].value).toEqual(['nO', 'FaLsE']);
      });

      it('handles values containing whitespace', () => {
        const schema = new BooleanSchema().falsy([' no ', '\t', '\n']);
        expect(schema._getRules()[0].value).toEqual([' no ', '\t', '\n']);
      });

      it('handles Unicode strings', () => {
        const schema = new BooleanSchema().falsy(['いいえ', '不是']);
        expect(schema._getRules()[0].value).toEqual(['いいえ', '不是']);
      });

      it('handles Emoji strings', () => {
        const schema = new BooleanSchema().falsy(['❌', '👎']);
        expect(schema._getRules()[0].value).toEqual(['❌', '👎']);
      });
    });

    describe('caseSensitive', () => {
      it('registers the rule with value true', () => {
        const schema = new BooleanSchema().caseSensitive();
        expect(schema._getRules()[0].value).toBe(true);
      });

      it('can coexist with truthy and falsy rules', () => {
        const schema = new BooleanSchema()
          .truthy(['yes'])
          .caseSensitive()
          .falsy(['no']);

        const rules = schema._getRules();
        expect(rules).toHaveLength(3);
        expect(rules[0].type).toBe(BooleanRuleType.Truthy);
        expect(rules[1].type).toBe(BooleanRuleType.CaseSensitive);
        expect(rules[2].type).toBe(BooleanRuleType.Falsy);
      });

      it('multiple calls preserve insertion order', () => {
        const schema = new BooleanSchema()
          .caseSensitive()
          .truthy(['yes'])
          .caseSensitive();

        const rules = schema._getRules();
        expect(rules[0].type).toBe(BooleanRuleType.CaseSensitive);
        expect(rules[1].type).toBe(BooleanRuleType.Truthy);
        expect(rules[2].type).toBe(BooleanRuleType.CaseSensitive);
      });
    });
  });

  describe('6. Immutability', () => {
    it('truthy array is not mutated', () => {
      const originalArray = ['yes', '1'];
      const arrayCopy = [...originalArray];
      const schema = new BooleanSchema().truthy(originalArray);

      expect(originalArray).toEqual(arrayCopy);
      expect(schema._getRules()[0].value).toBe(originalArray);
    });

    it('falsy array is not mutated', () => {
      const originalArray = ['no', '0'];
      const arrayCopy = [...originalArray];
      const schema = new BooleanSchema().falsy(originalArray);

      expect(originalArray).toEqual(arrayCopy);
      expect(schema._getRules()[0].value).toBe(originalArray);
    });

    it('previously registered rules remain unchanged after adding more rules', () => {
      const schema = new BooleanSchema().truthy(['yes']);
      const rulesFirstSnapshot = [...schema._getRules()];

      schema.falsy(['no']).caseSensitive();
      const rulesSecondSnapshot = schema._getRules();

      expect(rulesSecondSnapshot[0]).toEqual(rulesFirstSnapshot[0]);
      expect(rulesSecondSnapshot[0]).toBe(rulesFirstSnapshot[0]);
    });
  });

  describe('7. Internal Consistency', () => {
    it('_getRules() returns every registered rule', () => {
      const schema = new BooleanSchema()
        .truthy(['yes'])
        .falsy(['no'])
        .caseSensitive();

      expect(schema._getRules()).toHaveLength(3);
    });

    it('Rule objects have the expected shape', () => {
      const schema = new BooleanSchema().truthy(['yes'], 'msg');
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
      const schema = new BooleanSchema()
        .truthy(['yes'])
        .falsy(['no'])
        .caseSensitive();

      const rules = schema._getRules();
      expect(rules[0].value).toEqual(['yes']);
      expect(rules[1].value).toEqual(['no']);
      expect(rules[2].value).toBe(true);
    });

    it('Rule messages are correct', () => {
      const schema = new BooleanSchema()
        .truthy(['yes'], 'truthy msg')
        .falsy(['no'], 'falsy msg')
        .caseSensitive();

      const rules = schema._getRules();
      expect(rules[0].message).toBe('truthy msg');
      expect(rules[1].message).toBe('falsy msg');
      expect(rules[2].message).toBeUndefined();
    });

    it('Rule types are correct', () => {
      const schema = new BooleanSchema()
        .truthy(['yes'])
        .falsy(['no'])
        .caseSensitive();

      const rules = schema._getRules();
      expect(rules[0].type).toBe(BooleanRuleType.Truthy);
      expect(rules[1].type).toBe(BooleanRuleType.Falsy);
      expect(rules[2].type).toBe(BooleanRuleType.CaseSensitive);
    });
  });

  describe('8. Regression Tests', () => {
    it('accidental rule overwriting does not occur', () => {
      const schema = new BooleanSchema();
      schema.truthy(['yes']).truthy(['1']);
      const rules = schema._getRules();

      expect(rules).toHaveLength(2);
      expect(rules[0].value).toEqual(['yes']);
      expect(rules[1].value).toEqual(['1']);
    });

    it('incorrect rule order does not occur', () => {
      const schema = new BooleanSchema().falsy(['no']).truthy(['yes']);
      const rules = schema._getRules();

      expect(rules[0].type).toBe(BooleanRuleType.Falsy);
      expect(rules[1].type).toBe(BooleanRuleType.Truthy);
    });

    it('incorrect message assignment does not occur', () => {
      const schema = new BooleanSchema()
        .truthy(['yes'], 'has message')
        .falsy(['no']);
      const rules = schema._getRules();

      expect(rules[0].message).toBe('has message');
      expect(rules[1].message).toBeUndefined();
    });

    it('incorrect rule type does not occur', () => {
      const schema = new BooleanSchema()
        .truthy(['yes'])
        .falsy(['no'])
        .caseSensitive();

      const ruleTypes = schema._getRules().map((r) => r.type);

      const expectedTypes = [
        BooleanRuleType.Truthy,
        BooleanRuleType.Falsy,
        BooleanRuleType.CaseSensitive,
      ];

      expect(ruleTypes).toEqual(expectedTypes);
    });

    it('accidental mutation of stored arrays does not leak across instances', () => {
      const schema1 = new BooleanSchema().truthy(['yes']);
      const schema2 = new BooleanSchema().truthy(['1']);

      expect(schema1._getRules()[0].value).toEqual(['yes']);
      expect(schema2._getRules()[0].value).toEqual(['1']);
    });

    it('accidental sharing of mutable references between rules does not occur incorrectly', () => {
      const sharedArray = ['yes', 'no'];
      const schema = new BooleanSchema().truthy(sharedArray).falsy(sharedArray);

      const rules = schema._getRules();

      // Both point to the same array reference, which is expected based on implementation,
      // but ensure that they are treated as separate rules logically.
      expect(rules[0].value).toBe(sharedArray);
      expect(rules[1].value).toBe(sharedArray);
      expect(rules[0].type).not.toBe(rules[1].type);
    });
  });
});
