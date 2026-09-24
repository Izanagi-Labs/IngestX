// WARNING: This sample CSV and the default schema in `demoStore.ts` form a DEMO CONTRACT.
// If the default schema changes, this sample MUST be updated to remain aligned.

export const SAMPLE_FILENAME = "ingestx-sample.csv";

export const DEFAULT_SAMPLE_CSV = `Name,Age,Email
Alice,28,alice@example.com
Bob,34,bob@example.com
Charlie,22,charlie@example.com
David,31,david@example.com
Eve,29,eve@example.com
Frank,45,frank@example.com
Grace,26,grace@example.com
Hank,38,hank@example.com
Ivy,21,ivy@example.com
Jack,33,jack@example.com
Karen,41,karen@example.com
Leo,27,leo@example.com
Mia,30,mia@example.com
Noah,24,noah@example.com
Olivia,35,olivia@example.com
Paul,40,paul@example.com
Quinn,23,quinn@example.com
Ryan,32,ryan@example.com
Sophia,25,sophia@example.com
Tom,39,tom@example.com
A,30,short@example.com
Victor,abc,victor@example.com
Wendy,,wendy@example.com
Xavier,34,alice@example.com
Y,29,yara@example.com
Zane,31,bob@example.com
,50,empty-name@example.com
Unknown,NaN,unknown@example.com`;

export function createSampleFile(): File {
  return new File([DEFAULT_SAMPLE_CSV], SAMPLE_FILENAME, { type: "text/csv" });
}

export function downloadSampleCsv() {
  const blob = new Blob([DEFAULT_SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = SAMPLE_FILENAME;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
