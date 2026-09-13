import { test, expect } from 'vitest';
import ExcelWorker from "./src/core/parser/ExcelParser/excel.worker.ts?worker&inline";

test('what is ExcelWorker', () => {
    console.log("ExcelWorker is:", ExcelWorker);
    console.log("ExcelWorker.toString() is:", ExcelWorker.toString());
    
    // what happens if we instantiate it without global.Worker?
    try {
      const w = new ExcelWorker();
      console.log("Instantiated:", w);
    } catch(e) {
      console.log("Error instantiating:", e.message);
    }
});
