import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SCHEMAS_DIR = path.join(ROOT, 'schemas');

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const schemaFiles = fs.readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith('.schema.json')).sort();
if (schemaFiles.length === 0) {
  console.error('❌ No schema files found in schemas/');
  process.exit(1);
}

let hasError = false;
for (const file of schemaFiles) {
  const fullPath = path.join(SCHEMAS_DIR, file);
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const schema = JSON.parse(raw);
    ajv.compile(schema);
    console.log(`✅ Schema valid: schemas/${file}`);
  } catch (err) {
    console.error(`❌ Schema invalid: schemas/${file} -> ${err.message}`);
    hasError = true;
  }
}

if (hasError) process.exit(1);
console.log(`\nAll ${schemaFiles.length} schemas compiled successfully.`);
