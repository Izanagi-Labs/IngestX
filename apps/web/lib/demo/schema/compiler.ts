import * as acorn from "acorn";
import { ix } from "@parallelbytes/ingestx";
import type { ColumnConfig } from "@parallelbytes/ingestx";

export class PlaygroundSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaygroundSchemaError";
  }
}

// ---------------------------------------------------------
// Supported subset definitions
// ---------------------------------------------------------

const SUPPORTED_ROOTS = ["string", "number", "boolean"];

const SUPPORTED_RULES: Record<string, string[]> = {
  string: ["min", "max", "allowedValues", "regex", "caseSensitive", "optional", "default", "trim"],
  number: ["min", "max", "allowedValues", "optional", "default"],
  boolean: ["truthy", "falsy", "caseSensitive", "optional", "default"],
};

// ---------------------------------------------------------
// AST Parsers
// ---------------------------------------------------------

function assertLiteralValue(node: any, paramName: string): string | number | boolean | RegExp {
  if (node.type !== "Literal") {
    throw new PlaygroundSchemaError(`Argument for \${paramName} must be a literal (string, number, boolean, or regex), got \${node.type}`);
  }
  return node.value;
}

function parseArrayElements(elements: any[], paramName: string): any[] {
  return elements.map(el => {
    if (el.type !== "Literal") {
      throw new PlaygroundSchemaError(`Elements in array for \${paramName} must be literals`);
    }
    return el.value;
  });
}

function parseArgument(node: any, methodName: string): any {
  if (node.type === "Literal") {
    if (node.regex) {
      // Safe parsing of regex literal, not executing it as code
      return new RegExp(node.regex.pattern, node.regex.flags);
    }
    return node.value;
  }
  if (node.type === "ArrayExpression") {
    return parseArrayElements(node.elements, methodName);
  }
  throw new PlaygroundSchemaError(`Argument for \${methodName}() must be a literal or array of literals. Execution of dynamic expressions is not allowed in the playground.`);
}

function compileSchemaChain(node: any): any {
  if (node.type !== "CallExpression") {
    throw new PlaygroundSchemaError(`Expected schema definition to be a function call, got \${node.type}`);
  }

  const callee = node.callee;
  if (callee.type !== "MemberExpression") {
    throw new PlaygroundSchemaError(`Expected schema method call, got \${callee.type}`);
  }

  if (callee.computed) {
    throw new PlaygroundSchemaError("Computed property access (e.g., ix['string']) is not permitted in the playground.");
  }

  const propertyName = callee.property.name;
  
  // Base case: ix.string() / ix.number() / ix.boolean()
  if (callee.object.type === "Identifier" && callee.object.name === "ix") {
    if (!SUPPORTED_ROOTS.includes(propertyName)) {
      throw new PlaygroundSchemaError(`Unsupported schema type 'ix.\${propertyName}()'. The playground supports: \${SUPPORTED_ROOTS.join(", ")}`);
    }
    if (node.arguments.length !== 0) {
      throw new PlaygroundSchemaError(`'ix.\${propertyName}()' does not take arguments in this context.`);
    }
    
    // Create the actual real IngestX schema
    switch (propertyName) {
      case "string": return ix.string();
      case "number": return ix.number();
      case "boolean": return ix.boolean();
      default: throw new PlaygroundSchemaError(`Unexpected root type: \${propertyName}`);
    }
  }

  // Recursive case: chained rule e.g. ix.string().min(2)
  // callee.object is the inner call e.g. ix.string()
  const baseSchema = compileSchemaChain(callee.object);
  
  // At this point we don't know the exact base type of baseSchema easily, 
  // but we can check if the method exists on it safely since we only allow verified safe methods.
  // Actually, we can check constructor name or just safely apply if it's in our global supported list.
  
  // Explicitly deny transform/custom as a hard boundary
  if (propertyName === "transform" || propertyName === "custom") {
    throw new PlaygroundSchemaError(`'${propertyName}()' callbacks are not supported in the online playground.`);
  }

  const allSupportedRules = new Set(Object.values(SUPPORTED_RULES).flat());
  if (!allSupportedRules.has(propertyName)) {
    throw new PlaygroundSchemaError(`Unsupported schema rule '.${propertyName}()'.`);
  }
  
  if (typeof baseSchema[propertyName] !== "function") {
    throw new PlaygroundSchemaError(`Rule '.\${propertyName}()' is not valid for this schema type.`);
  }

  const args = node.arguments.map((arg: any) => parseArgument(arg, propertyName));
  
  try {
    return baseSchema[propertyName](...args);
  } catch (err: any) {
    throw new PlaygroundSchemaError(`Error applying '.\${propertyName}()': \${err.message || String(err)}`);
  }
}

function parseColumnObject(node: any): ColumnConfig {
  if (node.type !== "ObjectExpression") {
    throw new PlaygroundSchemaError(`Expected object for column definition, got \${node.type}`);
  }

  const col: any = {};
  const allowedKeys = ["key", "name", "schema", "duplicatesAllowed"];

  for (const prop of node.properties) {
    if (prop.type !== "Property" || prop.computed || prop.key.type !== "Identifier") {
      throw new PlaygroundSchemaError("Column properties must be simple identifiers.");
    }
    
    const propName = prop.key.name;
    if (!allowedKeys.includes(propName)) {
      throw new PlaygroundSchemaError(`Unsupported column property '\${propName}'. The playground supports: \${allowedKeys.join(", ")}`);
    }

    if (propName === "key" || propName === "name") {
      col[propName] = assertLiteralValue(prop.value, propName);
    } else if (propName === "duplicatesAllowed") {
      col[propName] = assertLiteralValue(prop.value, propName);
    } else if (propName === "schema") {
      col[propName] = compileSchemaChain(prop.value);
    }
  }

  if (!col.key) throw new PlaygroundSchemaError("Column is missing required property 'key'");
  if (!col.name) throw new PlaygroundSchemaError("Column is missing required property 'name'");
  if (!col.schema) throw new PlaygroundSchemaError("Column is missing required property 'schema'");

  return col as ColumnConfig;
}

export function compilePlaygroundSchema(code: string): ColumnConfig[] {
  let ast: any;
  try {
    ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: "module" });
  } catch (err: any) {
    throw new PlaygroundSchemaError(`Syntax error: \${err.message}`);
  }

  if (ast.type !== "Program") {
    throw new PlaygroundSchemaError("Invalid script format");
  }

  // Look for: const columns = [...]
  let columnsNode = null;
  for (const stmt of ast.body) {
    if (stmt.type === "VariableDeclaration") {
      for (const decl of stmt.declarations) {
        if (decl.id.type === "Identifier" && decl.id.name === "columns") {
          columnsNode = decl.init;
          break;
        }
      }
    }
  }

  if (!columnsNode) {
    throw new PlaygroundSchemaError("Could not find 'const columns = [...]' declaration");
  }

  if (columnsNode.type !== "ArrayExpression") {
    throw new PlaygroundSchemaError(`Expected 'columns' to be an array, got \${columnsNode.type}`);
  }

  const columns: ColumnConfig[] = [];
  const seenKeys = new Set<string>();

  for (const element of columnsNode.elements) {
    const col = parseColumnObject(element);
    if (seenKeys.has(col.key)) {
      throw new PlaygroundSchemaError(`Duplicate column key found: '\${col.key}'`);
    }
    seenKeys.add(col.key);
    columns.push(col);
  }

  return columns;
}
