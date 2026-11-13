import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

describe("ZERO-EMOJI POLICY Verification (AGENT_RULES.md & TECH_SPEC.md §14)", () => {
  const emojiRegex = /\p{Extended_Pictographic}/u;

  it("memastikan src/ bebas dari seluruh karakter emoji Unicode", () => {
    const srcDir = path.resolve(process.cwd(), "src");
    const allSrcFiles = getAllFiles(srcDir);
    const violations: { file: string; line: number; match: string }[] = [];

    for (const filePath of allSrcFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((lineText, index) => {
        const match = lineText.match(emojiRegex);
        if (match) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            line: index + 1,
            match: match[0],
          });
        }
      });
    }

    expect(
      violations,
      `Ditemukan karakter emoji Unicode yang melanggar ZERO-EMOJI POLICY:\n${violations
        .map((v) => `  - ${v.file}:${v.line} -> "${v.match}"`)
        .join("\n")}`
    ).toEqual([]);
  });

  it("memastikan tests/fixtures/ bebas dari seluruh karakter emoji Unicode", () => {
    const fixturesDir = path.resolve(process.cwd(), "tests/fixtures");
    const fixtureFiles = getAllFiles(fixturesDir);
    const violations: { file: string; line: number; match: string }[] = [];

    for (const filePath of fixtureFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((lineText, index) => {
        const match = lineText.match(emojiRegex);
        if (match) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            line: index + 1,
            match: match[0],
          });
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
