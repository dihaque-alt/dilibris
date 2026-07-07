#!/usr/bin/env node
/**
 * Apply copy edits from docs/copy-inventory.json
 * Usage: node scripts/apply-copy-inventory.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const doc = JSON.parse(readFileSync(join(root, 'docs/copy-inventory.json'), 'utf8'));

const changes = doc.entries.filter((e) => e.text !== e.original_text);
if (!changes.length) {
  console.log('No changes (text === original_text for all entries).');
  process.exit(0);
}

console.log(`${dryRun ? '[dry-run] ' : ''}Applying ${changes.length} change(s)…`);

const fileCache = new Map();
function read(file) {
  const rel = file.replace(/^src\//, 'src/');
  const path = join(root, rel);
  if (!fileCache.has(path)) fileCache.set(path, readFileSync(path, 'utf8'));
  return fileCache.get(path);
}
function write(file, content) {
  const rel = file.replace(/^src\//, 'src/');
  const path = join(root, rel);
  fileCache.set(path, content);
}

function applyLabels(ref, text) {
  const [, kind, key] = ref.split(':');
  if (kind === 'status') {
    const path = join(root, 'src/lib/labels.ts');
    let src = read('src/lib/labels.ts');
    const re = new RegExp(`(${key.replace(/_/g, '_')}:\\s*')([^']*)(')`, 'm');
    // key is like want_to_read
    const re2 = new RegExp(`(${key}:\\s*')([^']*)(')`);
    if (!re2.test(src)) throw new Error(`labels status key not found: ${key}`);
    src = src.replace(re2, `$1${text}$3`);
    write('src/lib/labels.ts', src);
    return;
  }
  if (kind === 'note_type') {
    let src = read('src/lib/labels.ts');
    const re = new RegExp(`(${key}:\\s*')([^']*)(')`);
    if (!re.test(src)) throw new Error(`note_type not found: ${key}`);
    src = src.replace(re, `$1${text}$3`);
    write('src/lib/labels.ts', src);
    return;
  }
  if (kind === 'note_visibility') {
    let src = read('src/lib/labels.ts');
    const re = new RegExp(`(${key}:\\s*')([^']*)(')`);
    if (!re.test(src)) throw new Error(`note_visibility not found: ${key}`);
    src = src.replace(re, `$1${text}$3`);
    write('src/lib/labels.ts', src);
    return;
  }
  if (kind === 'unknown_author') {
    let src = read('src/lib/labels.ts');
    src = src.replace(/(return ')([^']*)(';)/, `$1${text}$3`, 1);
    write('src/lib/labels.ts', src);
    return;
  }
  if (kind === 'book_size') {
    let src = read('src/lib/libraryDisplayPrefs.ts');
    const re = new RegExp(`(${key}:\\s*')([^']*)(')`);
    src = src.replace(re, `$1${text}$3`);
    write('src/lib/libraryDisplayPrefs.ts', src);
    return;
  }
  if (kind === 'language') {
    let src = read('src/lib/language.ts');
    const re = new RegExp(`(code: '${key}', label: ')([^']*)(')`);
    src = src.replace(re, `$1${text}$3`);
    write('src/lib/language.ts', src);
    return;
  }
  if (kind === 'language_unknown') {
    let src = read('src/lib/language.ts');
    src = src.replace(/return 'Мова не вказана'/, `return '${text}'`);
    write('src/lib/language.ts', src);
    return;
  }
  if (kind === 'format') {
    let src = read('src/components/BookDetailModal.tsx');
    const re = new RegExp(`(${key}:\\s*')([^']*)(')`);
    src = src.replace(re, `$1${text}$3`);
    write('src/components/BookDetailModal.tsx', src);
    return;
  }
  if (kind === 'unspecified') {
    let src = read('src/components/BookDetailModal.tsx');
    src = src.replace('Не вказано', text);
    write('src/components/BookDetailModal.tsx', src);
    return;
  }
  if (kind === 'progress_mode') {
    let src = read('src/components/BookDetailModal.tsx');
    const re = new RegExp(`(${key}:\\s*')([^']*)(')`);
    src = src.replace(re, `$1${text}$3`);
    write('src/components/BookDetailModal.tsx', src);
    return;
  }
  if (kind === 'month') {
    let src = read('src/lib/stats.ts');
    const idx = Number(key) - 1;
    const re = /export const MONTH_NAMES_UK = \[([\s\S]*?)\];/;
    const m = src.match(re);
    if (!m) throw new Error('MONTH_NAMES_UK not found');
    const items = [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]);
    items[idx] = text;
    const body = items.map((t) => `  '${t}'`).join(',\n');
    src = src.replace(re, `export const MONTH_NAMES_UK = [\n${body},\n];`);
    write('src/lib/stats.ts', src);
    return;
  }
  throw new Error(`Unknown labels ref: ${ref}`);
}

let applied = 0;
let skipped = 0;

for (const entry of changes) {
  const { id, original_text, text, apply_ref, file } = entry;
  try {
    if (apply_ref.startsWith('labels:')) {
      applyLabels(apply_ref, text);
      console.log(`✓ ${id} labels → ${text}`);
      applied++;
      continue;
    }
    if (apply_ref.startsWith('replace:')) {
      const rel = apply_ref.slice('replace:'.length);
      let src = read(rel);
      const count = src.split(original_text).length - 1;
      if (count === 0) {
        console.warn(`⚠ ${id} not found in ${rel}: "${original_text}"`);
        skipped++;
        continue;
      }
      if (count > 1) {
        console.warn(`⚠ ${id} multiple (${count}) matches in ${rel} — replacing all`);
      }
      src = src.split(original_text).join(text);
      write(rel, src);
      console.log(`✓ ${id} ${rel}`);
      applied++;
      continue;
    }
    console.warn(`⚠ ${id} unknown apply_ref: ${apply_ref}`);
    skipped++;
  } catch (err) {
    console.error(`✗ ${id}: ${err.message}`);
    skipped++;
  }
}

if (!dryRun) {
  for (const [path, content] of fileCache) {
    writeFileSync(path, content, 'utf8');
  }
}

console.log(`Done: ${applied} applied, ${skipped} skipped.`);
