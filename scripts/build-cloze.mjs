// 完型填空内容管线：
// 解析 article/完型/ 下的两份 markdown 源（基础篇 30 篇 + PDF 提取的进阶篇）
// → 合并 src/data/answers/cloze*.json 的答案与解析
// → 生成 public/data/cloze.json（运行时按需 fetch，不进主 bundle）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_BASIC = path.join(ROOT, 'article', '完型', '完形填空_题目提取.md');
const SRC_ADV = path.join(ROOT, 'article', '完型', '完型填空_PDF提取.md');
const ANSWERS_DIR = path.join(ROOT, 'src', 'data', 'answers');
const META = path.join(ROOT, 'src', 'data', 'cloze-meta.ts');
const OUT = path.join(ROOT, 'public', 'data', 'cloze.json');

// 答案按批分文件，合并时以先出现的为准
function loadAnswers() {
  if (!fs.existsSync(ANSWERS_DIR)) return {};
  const merged = {};
  const files = fs
    .readdirSync(ANSWERS_DIR)
    .filter((f) => /^cloze.*\.json$/i.test(f))
    .sort();
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(ANSWERS_DIR, file), 'utf8'));
    for (const [id, blanks] of Object.entries(data)) {
      merged[id] = { ...(merged[id] || {}), ...blanks };
    }
  }
  return merged;
}

const clean = (l) => l.replace(/\r$/, '').trim();

// 把 “9 ______” / “__3__” / 独立数字行统一成 ___N___
function normalizeBlanks(text) {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/_{1,4}\s*(\d{1,2})\s*_{1,4}/g, ' ___$1___ ')
    .replace(/(?<![\w_>])(\d{1,2})\s*_{2,}/g, ' ___$1___ ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// 选项区可能写成 “1. A. x B. y” 单行，也可能 A/B 与 C/D 分成两行，甚至 “1. A.x” 连排。
// 统一按“题号 + A选项”切块，再在块内按 A-D 标记取文本。
function parseOptions(optionText) {
  const buf = optionText.replace(/\s+/g, ' ').trim();
  const heads = [...buf.matchAll(/(?<![\w.])(\d{1,2})\s*[.．、]\s*A\s*[.．、]/g)];
  const out = {};
  heads.forEach((head, i) => {
    const num = Number(head[1]);
    // 切块时把 A 选项的标记一起吃掉了，补回来才能凑满四项
    const body =
      'A. ' +
      buf.slice(head.index + head[0].length, i + 1 < heads.length ? heads[i + 1].index : buf.length);
    const marks = [...body.matchAll(/(?<![A-Za-z])([A-D])\s*[.．、]\s*/g)];
    if (marks.length < 3) return;
    const options = ['A', 'B', 'C', 'D'].map((letter, j) => {
      const mark = marks.find((m) => m[1] === letter);
      if (!mark) return '';
      const from = mark.index + mark[0].length;
      const next = marks.filter((m) => m.index > mark.index).sort((a, b) => a.index - b.index)[0];
      return body.slice(from, next ? next.index : body.length).trim();
    });
    if (options.filter(Boolean).length >= 4) out[num] = options;
  });
  return out;
}

function collectBasic() {
  if (!fs.existsSync(SRC_BASIC)) return [];
  const lines = fs.readFileSync(SRC_BASIC, 'utf8').split(/\r?\n/);
  const out = [];
  let cur = null;
  let exercise = 0;
  let optionLines = [];
  const flush = () => {
    if (!cur) return;
    cur.options = parseOptions(optionLines.join(' '));
    out.push(cur);
    cur = null;
    optionLines = [];
  };
  for (const raw of lines) {
    const line = clean(raw);
    const ex = line.match(/^##\s+Exercise\s+(\d+)/i);
    if (ex) {
      flush();
      exercise = Number(ex[1]);
      continue;
    }
    const cz = line.match(/^###\s+Cloze\s+(\d+)/i);
    if (cz) {
      flush();
      cur = { id: `b${String(out.length + 1).padStart(2, '0')}`, bank: '基础', label: `Exercise ${exercise} · Cloze ${cz[1]}`, paras: [] };
      continue;
    }
    if (!cur) continue;
    if (!line) {
      cur.paras.push('');
      continue;
    }
    if (/^\d{1,2}\s*[.．、]\s*A\s*[.．、]/.test(normalizeBlanks(line))) {
      optionLines.push(line);
      continue;
    }
    if (optionLines.length) {
      optionLines.push(line); // 选项的续行（C/D 单独一行等）
      continue;
    }
    cur.paras.push(normalizeBlanks(line));
  }
  flush();
  return out;
}

function collectAdvanced() {
  if (!fs.existsSync(SRC_ADV)) return [];
  const lines = fs.readFileSync(SRC_ADV, 'utf8').split(/\r?\n/);
  const out = [];
  let cur = null;
  let optionLines = [];
  const flush = () => {
    if (!cur) return;
    cur.options = parseOptions(optionLines.join(' '));
    out.push(cur);
    cur = null;
    optionLines = [];
  };
  for (const raw of lines) {
    const line = clean(raw);
    const head = line.match(/^##\s+第\s*(\d+)\s*篇/);
    if (head) {
      flush();
      cur = {
        id: `j${String(Number(head[1])).padStart(2, '0')}`,
        bank: '进阶',
        label: `第 ${head[1]} 篇`,
        paras: [],
      };
      continue;
    }
    if (!cur) continue;
    if (!line || line.startsWith('<!--')) {
      if (!line) cur.paras.push('');
      continue;
    }
    if (/^\d{1,2}\s*[.．、]\s*A\s*[.．、]/.test(line)) {
      optionLines.push(line);
      continue;
    }
    if (optionLines.length) continue; // 选项区的续行忽略
    cur.paras.push(line);
  }
  flush();
  return out;
}

function readMeta() {
  if (!fs.existsSync(META)) return {};
  const text = fs.readFileSync(META, 'utf8');
  const out = {};
  for (const m of text.matchAll(/'?([bj]\d{2})'?:\s*\{\s*zh:\s*'((?:[^'\\]|\\.)*)'/g)) {
    out[m[1]] = { zh: m[2].replace(/\\'/g, "'") };
  }
  return out;
}

// 取首句作为英文标题（列表与答题页都用 CSS 截断，数据保留完整句子）
function autoTitle(text) {
  const first = text.split(/(?<=[.!?])\s/)[0] || text;
  return first
    .replace(/_{3}\d+_{3}/g, ' ______ ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function sentenceAround(block, num) {
  const marker = `___${num}___`;
  const i = block.indexOf(marker);
  if (i < 0) return '';
  const bounds = (s, from, step) => {
    let p = from;
    while (p >= 0 && p < s.length) {
      if ('.!?'.includes(s[p]) && (p + 1 >= s.length || /\s/.test(s[p + 1]))) return p;
      p += step;
    }
    return step > 0 ? s.length : 0;
  };
  const start = bounds(block, i, -1) + 1;
  const end = bounds(block, i, 1) + 1;
  return block.slice(start, end).trim();
}

function main() {
  const sources = [...collectBasic(), ...collectAdvanced()];
  const answers = loadAnswers();
  const meta = readMeta();

  const warnings = [];
  const passages = [];
  let remapped = 0;

  sources.forEach((p, index) => {
    const blocks = p.paras
      .join('\n')
      .split(/\n{2,}/)
      .map((s) => s.replace(/\s*\n\s*/g, ' ').trim())
      .filter(Boolean);
    let text = blocks.join('\n');
    const rawNums = [...new Set([...text.matchAll(/___(\d{1,2})___/g)].map((m) => Number(m[1])))].sort(
      (a, b) => a - b,
    );
    if (!rawNums.length) {
      warnings.push(`${p.id} 未解析到空格`);
      return;
    }

    // 有些篇目沿用上一套题的题号（21-35），统一重排成 1..N，保证答题卡与进度一致
    const map = new Map(rawNums.map((n, i) => [n, i + 1]));
    if (rawNums.some((n, i) => n !== i + 1)) remapped += 1;
    text = text.replace(/___(\d{1,2})___/g, (_, d) => `___${map.get(Number(d))}___`);
    const blocksFixed = text.split('\n');
    const options = {};
    for (const [num, opts] of Object.entries(p.options)) {
      const to = map.get(Number(num));
      if (to) options[to] = opts;
    }

    const key = answers[p.id] || {};
    const blanks = [];
    for (let num = 1; num <= rawNums.length; num++) {
      const opts = (options[num] || []).map((o) => (o === '/' ? '（不填）' : o));
      const rec = key[String(num)] || {};
      const answer = String(rec.a || '').toUpperCase();
      if (opts.length !== 4) warnings.push(`${p.id} 第${num}空 选项数 ${opts.length}`);
      if (!answer) warnings.push(`${p.id} 第${num}空 无答案`);
      else if (!'ABCD'.includes(answer)) warnings.push(`${p.id} 第${num}空 答案非法：${answer}`);
      blanks.push({
        num,
        options: opts,
        answer,
        note: rec.n || '',
        evidence: blocksFixed.map((b) => sentenceAround(b, num)).find(Boolean) || '',
      });
    }

    const wordCount = text
      .replace(/_{3}\d+_{3}/g, ' ')
      .split(/\s+/)
      .filter((w) => /[A-Za-z]/.test(w)).length;

    passages.push({
      id: p.id,
      no: index + 1,
      bank: p.bank,
      label: p.label,
      title: autoTitle(blocksFixed[0] || ''),
      zh: meta[p.id]?.zh || '',
      blocks: blocksFixed,
      blanks,
      wordCount,
    });
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    total: passages.length,
    blankTotal: passages.reduce((n, p) => n + p.blanks.length, 0),
    banks: ['基础', '进阶']
      .map((name) => {
        const list = passages.filter((p) => p.bank === name);
        return { name, count: list.length, blanks: list.reduce((n, p) => n + p.blanks.length, 0) };
      })
      .filter((b) => b.count > 0),
    passages,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload), 'utf8');

  console.log(`✓ 生成完型填空 ${payload.total} 篇 / ${payload.blankTotal} 空 → public/data/cloze.json`);
  for (const b of payload.banks) console.log(`  - ${b.name}: ${b.count} 篇 / ${b.blanks} 空`);
  if (remapped) console.log(`  注: ${remapped} 篇沿用上一套题号，已重排为 1..N`);
  const withNotes = passages.reduce((n, p) => n + p.blanks.filter((b) => b.note).length, 0);
  console.log(`  含解析: ${withNotes} 空`);
  if (warnings.length) {
    console.log('\n⚠ 警告:');
    for (const w of warnings.slice(0, 40)) console.log('  ' + w);
    if (warnings.length > 40) console.log(`  ... 共 ${warnings.length} 条`);
  }
}

main();
