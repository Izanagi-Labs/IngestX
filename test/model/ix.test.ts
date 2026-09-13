import { describe, it, expect } from "vitest";
import { ix } from "@/src/model/ix";
import { StringSchema, NumberSchema, BooleanSchema } from "@/src/model/schema";
import type { ColumnConfig } from "@/src/model/column/types";

describe("ix Schema Factory", () => {
  it("creates a StringSchema", () => {
    const schema = ix.string();
    expect(schema).toBeInstanceOf(StringSchema);
  });

  it("creates a NumberSchema", () => {
    const schema = ix.number();
    expect(schema).toBeInstanceOf(NumberSchema);
  });

  it("creates a BooleanSchema", () => {
    const schema = ix.boolean();
    expect(schema).toBeInstanceOf(BooleanSchema);
  });

  it("preserves fluent chaining for StringSchema", () => {
    const schema = ix.string().min(2).max(10).regex(/test/);
    const rules = schema._getRules();
    expect(rules).toHaveLength(3);
  });

  it("preserves fluent chaining for NumberSchema", () => {
    const schema = ix.number().min(18).max(120);
    const rules = schema._getRules();
    expect(rules).toHaveLength(2);
  });

  it("satisfies the ColumnConfig type constraint", () => {
    // This is purely a type check; it will fail to compile if incompatible
    const _stringCol: ColumnConfig = {
      key: "name",
      name: "Name",
      schema: ix.string().min(2),
    };

    const _numberCol: ColumnConfig = {
      key: "age",
      name: "Age",
      schema: ix.number().min(18),
    };

    const _booleanCol: ColumnConfig = {
      key: "active",
      name: "Active",
      schema: ix.boolean(),
    };
    
    expect(true).toBe(true);
  });
});
