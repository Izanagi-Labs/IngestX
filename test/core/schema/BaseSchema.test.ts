import { describe, it, expect } from 'vitest';
import { BaseSchema } from '../../../src/core/schema/BaseSchema';

// Dummy rule types for testing
enum TestRuleType {
  RuleA = 'rule_a',
  RuleB = 'rule_b',
  RuleC = 'rule_c',
}

// Test implementation of the abstract BaseSchema
class TestSchema extends BaseSchema<TestRuleType> {
  public addTestRule(
    type: TestRuleType,
    value?: unknown,
    message?: string,
  ): this {
    return this.addRule({ type, value, message });
  }
}

describe('BaseSchema', () => {
  it('should contain zero rules when empty', () => {
    const schema = new TestSchema();
    expect(schema._getRules()).toHaveLength(0);
  });

  it('should store a rule using addRule()', () => {
    const schema = new TestSchema();
    schema.addTestRule(TestRuleType.RuleA);

    const rules = schema._getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].type).toBe(TestRuleType.RuleA);
  });

  it('should return this from addRule() for fluent chaining', () => {
    const schema = new TestSchema();
    const result = schema.addTestRule(TestRuleType.RuleA);
    expect(result).toBe(schema);

    // Test actual chaining
    schema.addTestRule(TestRuleType.RuleB).addTestRule(TestRuleType.RuleC);
    expect(schema._getRules()).toHaveLength(3);
  });

  it('should preserve type, value, and message exactly', () => {
    const schema = new TestSchema();

    const objValue = { foo: 'bar' };
    schema.addTestRule(TestRuleType.RuleA, 'test-value', 'Custom message');
    schema.addTestRule(TestRuleType.RuleB, objValue); // no message
    schema.addTestRule(TestRuleType.RuleC); // no value or message

    const rules = schema._getRules();

    expect(rules[0]).toEqual({
      type: TestRuleType.RuleA,
      value: 'test-value',
      message: 'Custom message',
    });

    expect(rules[1]).toEqual({
      type: TestRuleType.RuleB,
      value: objValue,
      message: undefined, // undefined because it was not provided
    });

    expect(rules[2]).toEqual({
      type: TestRuleType.RuleC,
      value: undefined,
      message: undefined,
    });
  });

  it('should not overwrite previous rules on multiple calls', () => {
    const schema = new TestSchema();

    schema.addTestRule(TestRuleType.RuleA, 1);
    schema.addTestRule(TestRuleType.RuleA, 2);

    const rules = schema._getRules();
    expect(rules).toHaveLength(2);
    expect(rules[0].value).toBe(1);
    expect(rules[1].value).toBe(2);
  });

  it('should preserve insertion order', () => {
    const schema = new TestSchema();

    schema.addTestRule(TestRuleType.RuleB);
    schema.addTestRule(TestRuleType.RuleA);
    schema.addTestRule(TestRuleType.RuleC);

    const rules = schema._getRules();
    expect(rules).toHaveLength(3);
    expect(rules[0].type).toBe(TestRuleType.RuleB);
    expect(rules[1].type).toBe(TestRuleType.RuleA);
    expect(rules[2].type).toBe(TestRuleType.RuleC);
  });

  it('should return every stored rule via _getRules()', () => {
    const schema = new TestSchema();

    schema.addTestRule(TestRuleType.RuleA);
    schema.addTestRule(TestRuleType.RuleB);

    const rules = schema._getRules();
    expect(rules).toHaveLength(2);
    expect(rules[0].type).toBe(TestRuleType.RuleA);
    expect(rules[1].type).toBe(TestRuleType.RuleB);
  });
});
