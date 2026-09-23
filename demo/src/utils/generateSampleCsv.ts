export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateValidCsv() {
  const header = "id,name,email,age,active,country\n";
  const rows = [
    "1,Alice Smith,alice@example.com,28,true,US",
    "2,Bob Johnson,bob@example.com,34,yes,CA",
    "3,Charlie Brown,charlie@example.com,,1,UK",
    "4,Diana Prince,diana@example.com,45,false,AU"
  ];
  return header + rows.join("\n");
}

export function generateInvalidCsv() {
  const header = "id,name,email,age,active,country\n";
  const rows = [
    "1,Alice Smith,alice@example.com,28,true,US", // valid
    "-5,Bad ID,bad@example.com,28,true,US", // invalid id
    "2,,missing.name@example.com,34,yes,CA", // invalid name (min 2)
    "3,Charlie Brown,not-an-email,30,1,UK", // invalid email
    "4,Diana Prince,diana@example.com,15,false,AU", // invalid age (min 18)
    "5,Eve,eve@example.com,130,false,AU", // invalid age (max 120)
    "6,Frank,frank@example.com,30,maybe,AU", // invalid active (boolean)
    "7,Grace,grace@example.com,30,true,FR", // invalid country (allowed values)
  ];
  return header + rows.join("\n");
}

export function generateMismatchCsv() {
  const header = "user_id,full_name,email_address,country\n";
  const rows = [
    "1,Alice Smith,alice@example.com,US",
  ];
  return header + rows.join("\n");
}
