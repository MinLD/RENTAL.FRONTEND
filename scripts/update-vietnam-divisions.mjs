import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const source = "https://provinces.open-api.vn/api/v2/?depth=2";
const target = fileURLToPath(new URL("../src/data/vietnam-divisions.json", import.meta.url));
// An optional downloaded response lets this run without network access.
const inputPath = process.argv[2];
const response = inputPath
  ? JSON.parse(await readFile(resolve(inputPath), "utf8"))
  : await fetch(source, { signal: AbortSignal.timeout(45_000) }).then(async (result) => {
      if (!result.ok) throw new Error(`Source returned HTTP ${result.status}`);
      return result.json();
    });

if (!Array.isArray(response) || !response.length) {
  throw new Error("Missing provinces in the source response.");
}

const provinceCodes = new Set();
const provinceNames = new Set();
const wardCodes = new Set();
function normalizeDivision(row, width) {
  if (!Number.isInteger(row?.code) || row.code < 1 || row.code >= 10 ** width ||
      typeof row.name !== "string" || !row.name.trim() || row.name.length > 100) {
    throw new Error("Invalid administrative division in the source response.");
  }
  return { code: String(row.code).padStart(width, "0"), name: row.name.trim() };
}

const provinces = response.map((row) => {
  const province = normalizeDivision(row, 2);
  if (provinceCodes.has(province.code) || provinceNames.has(province.name) ||
      !Array.isArray(row.wards) || !row.wards.length) {
    throw new Error(`Duplicate province or missing wards: ${province.name}`);
  }
  provinceCodes.add(province.code);
  provinceNames.add(province.name);
  const wardNames = new Set();
  const wards = row.wards.map((item) => {
    const ward = normalizeDivision(item, 5);
    if (wardCodes.has(ward.code) || wardNames.has(ward.name)) {
      throw new Error(`Duplicate ward: ${ward.name}`);
    }
    wardCodes.add(ward.code);
    wardNames.add(ward.name);
    return ward;
  });
  return { ...province, wards };
});

await mkdir(fileURLToPath(new URL("../src/data/", import.meta.url)), { recursive: true });
await writeFile(target, JSON.stringify({ source, retrievedAt: new Date().toISOString(), provinces }, null, 2) + "\n");
console.log(`Updated ${provinces.length} provinces and ${wardCodes.size} wards.`);
