#!/usr/bin/env node
/**
 * Sync docs/copy-inventory.csv → docs/copy-inventory.json (text column only)
 * Usage: node scripts/sync-copy-inventory-from-csv.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = join(root, 'docs/copy-inventory.json');
const csvPath = join(root, 'docs/copy-inventory.csv');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((c) => c.length)) rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const csvRaw = readFileSync(csvPath, 'utf8');
const [header, ...dataRows] = parseCsv(csvRaw);
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
for (const col of ['id', 'text']) {
  if (idx[col] === undefined) {
    console.error(`CSV missing column: ${col}`);
    process.exit(1);
  }
}

const byId = new Map(
  dataRows.map((r) => [r[idx.id], r[idx.text] ?? '']),
);

const doc = JSON.parse(readFileSync(jsonPath, 'utf8'));
let updated = 0;
for (const entry of doc.entries) {
  const next = byId.get(entry.id);
  if (next === undefined) {
    console.warn(`⚠ CSV missing id: ${entry.id}`);
    continue;
  }
  if (entry.text !== next) {
    entry.text = next;
    updated++;
  }
}

writeFileSync(jsonPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
console.log(`Synced ${updated} text value(s) from CSV → JSON`);
