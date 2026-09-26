/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, vi } from "vitest";
import { downloadValidCsv, downloadInvalidCsv } from "../exportCsv";
import Papa from "papaparse";

test("downloadValidCsv strips internal fields and unparses to CSV", () => {
  const result: any = {
    validRows: [
      { _ixRowIndex: 0, name: "Alice", age: 30 },
      { _ixRowIndex: 1, name: "Bob", age: 25 },
    ],
    invalidRows: [],
    columns: []
  };

  const unparseSpy = vi.spyOn(Papa, "unparse").mockReturnValue("csv_data");
  
  // mock document functions
  global.URL.createObjectURL = vi.fn();
  global.URL.revokeObjectURL = vi.fn();
  const clickMock = vi.fn();
  const appendMock = vi.fn();
  const removeMock = vi.fn();
  const setAttributeMock = vi.fn();
  const styleMock = {};

  vi.spyOn(document, "createElement").mockReturnValue({
    click: clickMock,
    setAttribute: setAttributeMock,
    style: styleMock
  } as any);

  vi.spyOn(document.body, "appendChild").mockImplementation(appendMock as any);
  vi.spyOn(document.body, "removeChild").mockImplementation(removeMock as any);

  downloadValidCsv(result, "test.csv");

  expect(unparseSpy).toHaveBeenCalledWith([
    { name: "Alice", age: 30 },
    { name: "Bob", age: 25 },
  ]);
  
  expect(clickMock).toHaveBeenCalled();
});

test("downloadInvalidCsv appends __errors and preserves data", () => {
  const result: any = {
    validRows: [],
    invalidRows: [
      {
        _ixRowIndex: 2,
        data: { name: "Charlie", age: "thirty" },
        errors: {
          age: [{ message: "Expected number" }]
        }
      }
    ],
    columns: []
  };

  const unparseSpy = vi.spyOn(Papa, "unparse").mockReturnValue("csv_data");

  downloadInvalidCsv(result, "test_invalid.csv");

  expect(unparseSpy).toHaveBeenCalledWith([
    { name: "Charlie", age: "thirty", __errors: "age: Expected number" }
  ]);
});
