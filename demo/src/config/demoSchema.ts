import { ix } from "@parallelbytes/ingestx";

export const demoColumns = [
  {
    key: "id", name: "ID",
    matchHeader: (header: string) => header.toLowerCase().trim() === "id",
    schema: ix.number().min(1, "ID must be a positive integer")
  },
  {
    key: "name", name: "Name",
    matchHeader: (header: string) => header.toLowerCase().trim() === "name",
    schema: ix.string().trim().min(2, "Name is required and must be at least 2 characters long")
  },
  {
    key: "email", name: "Email",
    matchHeader: (header: string) => header.toLowerCase().trim() === "email",
    schema: ix.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
  },
  {
    key: "age", name: "Age",
    matchHeader: (header: string) => header.toLowerCase().trim() === "age",
    schema: ix.number().min(18, "Must be at least 18").max(120, "Age is unrealistic").optional()
  },
  {
    key: "active", name: "Active",
    matchHeader: (header: string) => header.toLowerCase().trim() === "active",
    schema: ix.boolean().truthy(["true", "yes", "1", "Y"]).falsy(["false", "no", "0", "N"])
  },
  {
    key: "country", name: "Country",
    matchHeader: (header: string) => header.toLowerCase().trim() === "country",
    schema: ix.string().trim().allowedValues(["US", "CA", "UK", "AU"], "Country code must be US, CA, UK, or AU").optional()
  }
];

export const demoSchemaSnippet = `const columns = [
  {
    key: "id", name: "ID",
    matchHeader: (header) => header.toLowerCase() === "id",
    schema: ix.number().min(1, "ID must be positive")
  },
  {
    key: "name", name: "Name",
    matchHeader: (header) => header.toLowerCase() === "name",
    schema: ix.string().trim().min(2, "Name required")
  },
  {
    key: "email", name: "Email",
    matchHeader: (header) => header.toLowerCase() === "email",
    schema: ix.string().trim().regex(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)
  },
  {
    key: "age", name: "Age",
    matchHeader: (header) => header.toLowerCase() === "age",
    schema: ix.number().min(18).max(120).optional()
  },
  {
    key: "active", name: "Active",
    matchHeader: (header) => header.toLowerCase() === "active",
    schema: ix.boolean()
      .truthy(["true", "yes", "1", "Y"])
      .falsy(["false", "no", "0", "N"])
  },
  {
    key: "country", name: "Country",
    matchHeader: (header) => header.toLowerCase() === "country",
    schema: ix.string().trim()
      .allowedValues(["US", "CA", "UK", "AU"])
      .optional()
  }
];`;
