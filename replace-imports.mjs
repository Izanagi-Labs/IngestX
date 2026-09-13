import fs from "fs";
import path from "path";

const targetDirs = ["src", "test", "benchmarks", "."];

function processFile(filePath) {
  if (filePath.endsWith("replace-imports.mjs")) return;
  const content = fs.readFileSync(filePath, "utf8");
  // Regex to match from "../../../src/..." or "../../src/..." or "../src/..."
  const regex = /from\s+["'](\.\.\/)+src\/(.*)["']/g;
  const newContent = content.replace(regex, 'from "@/src/$2"');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, "utf8");
    console.log(`Updated ${filePath}`);
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== "node_modules" && file !== "dist") {
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx") || fullPath.endsWith(".js") || fullPath.endsWith(".jsx")) {
      processFile(fullPath);
    }
  }
}

for (const dir of targetDirs) {
  if (dir === ".") {
    // just process files in root
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (fs.statSync(file).isFile() && (file.endsWith(".ts") || file.endsWith(".js"))) {
        processFile(file);
      }
    }
  } else if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
}
