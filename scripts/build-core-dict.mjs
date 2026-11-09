import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DICT = path.join(ROOT, 'public', 'dict', 'ecdict.json');
const ARTICLE_DIR = path.join(ROOT, 'article');
const OUT = path.join(ROOT, 'src', 'data', 'core-dict.json');

if (!fs.existsSync(DICT)) {
  console.error('public/dict/ecdict.json not found');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(DICT, 'utf8'));
const vocab = new Set();

for (const file of fs.readdirSync(ARTICLE_DIR).filter((f) => f.endsWith('.md'))) {
  const text = fs.readFileSync(path.join(ARTICLE_DIR, file), 'utf8');
  for (const m of text.matchAll(/[A-Za-z][A-Za-z'’\-]*/g)) {
    const word = m[0]
      .toLowerCase()
      .replace(/’/g, "'")
      .replace(/^[^a-z]+|[^a-z]+$/g, '');
    if (word.length >= 2) vocab.add(word);
  }
}

// Core: every word that appears in the bundled articles, so the first click
// never has to wait for a network chunk. Imported articles fall back to chunks.
const words = {};
for (const word of vocab) {
  const entry = db.words[word];
  if (!entry) continue;
  words[word] = {
    ...entry,
    t: entry.t.length > 160 ? entry.t.slice(0, 160) + '…' : entry.t,
  };
}

const forms = {};
for (const [form, base] of Object.entries(db.forms || {})) {
  if (words[form] || words[base]) forms[form] = base;
}

fs.writeFileSync(
  OUT,
  JSON.stringify({ version: 1, count: Object.keys(words).length, words, forms }),
  'utf8',
);

const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`✓ core dictionary: ${Object.keys(words).length} words, ${Object.keys(forms).length} forms, ${kb} KB`);
