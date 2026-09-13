import Papa from "papaparse";

class MockFile {
  name: string;
  size: number;
  type: string;
  _content: string;

  constructor(parts: any[], name: string, options: any = {}) {
    this.name = name;
    this.type = options.type || "";
    this._content = parts.join("");
    this.size = this._content.length;
  }
}

const file = new MockFile(["id,name\n1,test\n"], "test.csv");

console.log("Starting papa parse...");
Papa.parse(file as any, {
  header: true,
  chunk: (results) => console.log("Chunk", results.data),
  complete: () => console.log("Complete"),
  error: (err) => console.error("Error", err)
});
