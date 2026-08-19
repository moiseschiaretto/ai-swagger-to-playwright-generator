// src/utils/files.js
import fs from 'fs';
import path from 'path';

export function loadJsonSchema(resource, operation, status) {
  const schemaPath = path.resolve(process.cwd(), `src/fixtures/${resource}/${operation}_${status}.json`);
  if (fs.existsSync(schemaPath)) {
    const rawData = fs.readFileSync(schemaPath, 'utf-8');
    return JSON.parse(rawData);
  }
  return null;
}