#!/usr/bin/env node
/**
 * Regenerates docs/copy-inventory.csv from docs/copy-inventory.json
 * (run after editing JSON, or to refresh CSV export)
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = join(root, 'docs/copy-inventory.json');
const csvPath = join(root, 'docs/copy-inventory.csv');

const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
const entries = data.entries;

function esc(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const header = ['id', 'category', 'original_text', 'text', 'where', 'file', 'apply_ref', 'notes'];
const lines = [header.join(',')];
for (const e of entries) {
  lines.push(
    [
      e.id,
      e.category,
      e.original_text,
      e.text,
      e.where,
      e.file,
      e.apply_ref,
      e.notes ?? '',
    ]
      .map(esc)
      .join(','),
  );
}

writeFileSync(csvPath, '\uFEFF' + lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${entries.length} rows → ${csvPath}`);
