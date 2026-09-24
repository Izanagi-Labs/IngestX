import { useDemoStore } from "../../store/demoStore";

let timeoutId: NodeJS.Timeout | null = null;
let currentStep = 0;
const totalSteps = 20;
const timePerStep = 50;

const mockValidRows = [
  { _ixRowIndex: 1, name: "Alice", age: 28, email: "alice@example.com" },
  { _ixRowIndex: 2, name: "Bob", age: 34, email: "bob@example.com" },
  { _ixRowIndex: 3, name: "Charlie", age: 22, email: "charlie@example.com" },
];

const mockInvalidRows = [
  {
    _ixRowIndex: 4,
    data: { name: "David", age: -5, email: "david@example.com" },
    errors: {
      age: [{ message: "Number must be greater than or equal to 0" }],
    }
  },
  {
    _ixRowIndex: 5,
    data: { name: "Eve", age: 29, email: "alice@example.com" },
    errors: {
      email: [{ message: "Value must be unique." }]
    }
  },
];

function step() {
  const store = useDemoStore.getState();
  if (store.status !== "running") return; // abort if not running

  currentStep++;
  
  store.setProgress({
    progressPercentage: Math.floor((currentStep / totalSteps) * 100),
    processed: Math.floor((currentStep / totalSteps) * 1250),
    valid: Math.floor((currentStep / totalSteps) * 1210),
    invalid: Math.floor((currentStep / totalSteps) * 40),
  });

  if (currentStep >= totalSteps) {
    store.setStatus("completed");
    store.setResult({
      validRows: mockValidRows,
      invalidRows: mockInvalidRows,
    });
    timeoutId = null;
  } else {
    timeoutId = setTimeout(step, timePerStep);
  }
}

export function runMockIngestion() {
  const store = useDemoStore.getState();
  if (!store.file) return;

  if (timeoutId) clearTimeout(timeoutId);
  currentStep = 0;

  store.setStatus("running");
  store.setProgress({ processed: 0, valid: 0, invalid: 0, progressPercentage: 0 });
  store.setResult(null);

  timeoutId = setTimeout(step, timePerStep);
}

export function pauseMockIngestion() {
  const store = useDemoStore.getState();
  if (store.status === "running") {
    if (timeoutId) clearTimeout(timeoutId);
    store.setStatus("paused");
  }
}

export function resumeMockIngestion() {
  const store = useDemoStore.getState();
  if (store.status === "paused") {
    store.setStatus("running");
    timeoutId = setTimeout(step, timePerStep);
  }
}

export function cancelMockIngestion() {
  if (timeoutId) clearTimeout(timeoutId);
  currentStep = 0;
  
  const store = useDemoStore.getState();
  store.setStatus("ready"); // revert back to ready instead of error
  store.setProgress({ processed: 0, valid: 0, invalid: 0, progressPercentage: 0 });
}
