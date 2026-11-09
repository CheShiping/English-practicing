import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'dict', 'ecdict.json');
const OUT_DIR = path.join(ROOT, 'public', 'dict');
const WORDS_DIR = path.join(OUT_DIR, 'words');

if (!fs.existsSync(SRC)) {
  console.error('public/dict/ecdict.json not found. Run scripts/build-dict.py first.');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const groups = {};

for (const [word, entry] of Object.entries(db.words)) {
  const first = word[0] || '';
  const key = /[a-z]/.test(first) ? first : 'misc';
  if (!groups[key]) groups[key] = {};
  groups[key][word] = entry;
}

fs.mkdirSync(WORDS_DIR, { recursive: true });
let total = 0;
let size = 0;
for (const [key, words] of Object.entries(groups)) {
  const payload = JSON.stringify({ words });
  const file = path.join(WORDS_DIR, `${key}.json`);
  fs.writeFileSync(file, payload, 'utf8');
  total += Object.keys(words).length;
  size += Buffer.byteLength(payload);
}

const forms = JSON.stringify({ forms: db.forms || {} });
fs.writeFileSync(path.join(OUT_DIR, 'forms.json'), forms, 'utf8');
size += Buffer.byteLength(forms);

console.log(`✓ split ${total} words into ${Object.keys(groups).length} letter chunks + forms.json (${(size / 1024 / 1024).toFixed(2)} MB)`);
for (const key of Object.keys(groups).sort()) {
  const bytes = fs.statSync(path.join(WORDS_DIR, `${key}.json`)).size;
  console.log(`  ${key}.json: ${(bytes / 1024).toFixed(0)} KB`);
}
