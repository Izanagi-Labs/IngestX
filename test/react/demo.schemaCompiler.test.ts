import { describe, it, expect } from "vitest";
import { compilePlaygroundSchema, PlaygroundSchemaError } from "../../apps/web/lib/demo/schema/compiler";

describe("Demo Schema Compiler (Security & Validation)", () => {
  it("should successfully compile the default safe schema", () => {
    const defaultSchemaCode = `const columns = [
      {
        key: "name",
        name: "Name",
        schema: ix.string().min(2),
      },
      {
        key: "age",
        name: "Age",
        schema: ix.number(),
      },
      {
        key: "email",
        name: "Email",
        schema: ix.string(),
        duplicatesAllowed: false,
      },
    ];`;

    const columns = compilePlaygroundSchema(defaultSchemaCode);
    expect(columns).toHaveLength(3);
    expect(columns[0].key).toBe("name");
    expect(columns[1].key).toBe("age");
    expect(columns[2].key).toBe("email");
    expect(columns[2].duplicatesAllowed).toBe(false);
  });

  it("should successfully parse regex literals", () => {
    const code = `const columns = [
      {
        key: "id",
        name: "ID",
        schema: ix.string().regex(/^[A-Z]+$/i),
      }
    ];`;

    const columns = compilePlaygroundSchema(code);
    expect(columns).toHaveLength(1);
    expect(columns[0].key).toBe("id");
  });

  describe("Security: Rejection of arbitrary execution", () => {
    it("rejects dynamic property access (ix['string'])", () => {
      const malicious = `const columns = [{ key: "a", name: "A", schema: ix["string"]() }];`;
      expect(() => compilePlaygroundSchema(malicious)).toThrow(PlaygroundSchemaError);
      expect(() => compilePlaygroundSchema(malicious)).toThrow("Computed property access");
    });

    it("rejects transforms and callbacks", () => {
      const malicious = `const columns = [{ key: "a", name: "A", schema: ix.string().transform(v => v.toLowerCase()) }];`;
      expect(() => compilePlaygroundSchema(malicious)).toThrow(PlaygroundSchemaError);
      expect(() => compilePlaygroundSchema(malicious)).toThrow("callbacks are not supported");
    });
    
    it("rejects custom validation callbacks", () => {
      const malicious = `const columns = [{ key: "a", name: "A", schema: ix.string().custom(v => v === "test") }];`;
      expect(() => compilePlaygroundSchema(malicious)).toThrow(PlaygroundSchemaError);
      expect(() => compilePlaygroundSchema(malicious)).toThrow("callbacks are not supported");
    });

    it("rejects arbitrary arguments like function calls inside min()", () => {
      const malicious = `const columns = [{ key: "a", name: "A", schema: ix.string().min(Math.max(1, 2)) }];`;
      expect(() => compilePlaygroundSchema(malicious)).toThrow(PlaygroundSchemaError);
      expect(() => compilePlaygroundSchema(malicious)).toThrow("literal");
    });

    it("rejects non-literal array elements", () => {
      const malicious = `const columns = [{ key: "a", name: "A", schema: ix.string().allowedValues(["a", window.name]) }];`;
      expect(() => compilePlaygroundSchema(malicious)).toThrow(PlaygroundSchemaError);
    });

    it("rejects completely malformed files", () => {
      const malicious = `while(true) { alert('hacked') }`;
      expect(() => compilePlaygroundSchema(malicious)).toThrow(PlaygroundSchemaError);
    });

    it("rejects missing key property", () => {
      const code = `const columns = [{ name: "A", schema: ix.string() }];`;
      expect(() => compilePlaygroundSchema(code)).toThrow(/missing required property 'key'/);
    });

    it("rejects duplicate column keys", () => {
      const code = `const columns = [
        { key: "a", name: "A", schema: ix.string() },
        { key: "a", name: "B", schema: ix.number() }
      ];`;
      expect(() => compilePlaygroundSchema(code)).toThrow(/Duplicate column key found/);
    });

    it("rejects unknown ix schema roots", () => {
      const code = `const columns = [{ key: "a", name: "A", schema: ix.date() }];`;
      expect(() => compilePlaygroundSchema(code)).toThrow(/Unsupported schema type/);
    });

    it("rejects unknown rules", () => {
      const code = `const columns = [{ key: "a", name: "A", schema: ix.string().unknownRule() }];`;
      expect(() => compilePlaygroundSchema(code)).toThrow(/Unsupported schema rule/);
    });
  });
});
