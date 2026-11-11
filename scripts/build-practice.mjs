// 单选练习内容管线：
// 解析 article/专升本词汇语法试题_单选题.md → 合并 src/data/answers/danxuan.json（答案/分类/解析）
// → 生成 public/data/practice.json（运行时按需 fetch，不进主 bundle）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'article', '专升本词汇语法试题_单选题.md');
const ANSWERS = path.join(ROOT, 'src', 'data', 'answers', 'danxuan.json');
const OUT = path.join(ROOT, 'public', 'data', 'practice.json');

const CATEGORIES = ['六大词性', '两个态', '三大从句', '五大句型', '四个重点', '其他'];

const clean = (l) =>
  l
    .replace(/\r$/, '')
    .replace(/^\s*>\s*/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\\([.\\\-!()_*#[\]{}`>+~|])/g, '$1')
    .replace(/^\s*[-*•]\s+/, '')
    .trim();

const isPart = (l) => /^##\s+/.test(l);
const isSection = (l) => /^###\s+/.test(l);
const isQ = (l) => /^\d{1,3}\s*[.．、]\s*/.test(l);
const isOpt = (l) => /^[A-DＡ-Ｄ]\s*[.．、)）:：]\s*/.test(l);

function parseMd() {
  const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);
  const sections = [];
  let part = '';
  let cur = null;
  let curQ = null;

  const flushQ = () => {
    if (!curQ) return;
    if (!cur) return;
    cur.questions.push(curQ);
    curQ = null;
  };

  for (const orig of lines) {
    const line = clean(orig);
    if (!line) continue;
    if (isPart(line)) {
      flushQ();
      cur = null;
      part = line.replace(/^##\s+/, '').trim();
      continue;
    }
    if (isSection(line)) {
      flushQ();
      cur = { id: `danxuan-${String(sections.length + 1).padStart(2, '0')}`, part, title: line.replace(/^###\s+/, '').trim(), questions: [] };
      sections.push(cur);
      continue;
    }
    if (!cur) continue;
    if (isQ(line)) {
      flushQ();
      const m = line.match(/^(\d{1,3})\s*[.．、]\s*(.*)$/);
      curQ = { num: Number(m[1]), stem: m[2].trim(), options: [], answer: '' };
      continue;
    }
    if (!curQ) continue;
    if (isOpt(line)) {
      curQ.options.push(line.replace(/^[A-DＡ-Ｄ]\s*[.．、)）:：]\s*/, '').trim());
      continue;
    }
    const ans = line.match(/^(?:✅\s*)?答案\s*[:：]\s*\**\s*([A-DＡ-Ｄ])/);
    if (ans) {
      curQ.answer = ans[1].toUpperCase().replace('Ａ', 'A').replace('Ｂ', 'B').replace('Ｃ', 'C').replace('Ｄ', 'D');
      continue;
    }
    curQ.stem += ' ' + line;
  }
  flushQ();
  return sections;
}

function main() {
  const sections = parseMd();
  const answers = JSON.parse(fs.readFileSync(ANSWERS, 'utf8'));

  const questions = [];
  const warnings = [];
  let mdAnswerWins = 0;

  for (const sec of sections) {
    const secAnswers = answers[sec.id] || {};
    let idx = 0;
    for (const q of sec.questions) {
      idx++;
      const key = secAnswers[String(idx)];
      const answer = key?.answer || q.answer || '';
      if (!answer) warnings.push(`${sec.id} 第${idx}题(号${q.num}) 无答案`);
      if (!key) warnings.push(`${sec.id} 第${idx}题(号${q.num}) 无分类/解析数据`);
      if (key?.answer && q.answer && key.answer !== q.answer) mdAnswerWins++;
      if (q.options.length !== 4) warnings.push(`${sec.id} 第${idx}题(号${q.num}) 选项数 ${q.options.length}`);
      questions.push({
        id: `${sec.id}-${String(idx).padStart(3, '0')}`,
        num: q.num,
        section: sec.id,
        sectionTitle: sec.title,
        part: sec.part,
        stem: q.stem,
        options: q.options,
        answer,
        category: key?.category || '其他',
        sub: key?.sub || '未分类',
        explanation: key?.explanation || '',
      });
    }
  }

  const subcategories = {};
  for (const q of questions) {
    (subcategories[q.category] = subcategories[q.category] || []);
    if (!subcategories[q.category].includes(q.sub)) subcategories[q.category].push(q.sub);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    total: questions.length,
    categories: CATEGORIES.filter((c) => questions.some((q) => q.category === c)),
    subcategories,
    sections: sections.map((s) => ({ id: s.id, part: s.part, title: s.title, count: s.questions.length })),
    questions,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload), 'utf8');

  console.log(`✓ 生成单选练习 ${questions.length} 题 / ${sections.length} 个练习组 → public/data/practice.json`);
  const withExp = questions.filter((q) => q.explanation).length;
  console.log(`  含解析: ${withExp} 题 · 分类覆盖: ${questions.filter((q) => q.category !== '其他' || q.sub !== '未分类').length} 题`);
  for (const c of payload.categories) {
    console.log(`  - ${c}: ${questions.filter((q) => q.category === c).length} 题`);
  }
  if (mdAnswerWins) console.log(`  注: ${mdAnswerWins} 题 JSON 答案与源文件不同，以 JSON（校订后）为准`);
  if (warnings.length) {
    console.log('\n⚠ 警告:');
    for (const w of warnings.slice(0, 30)) console.log('  ' + w);
    if (warnings.length > 30) console.log(`  ... 共 ${warnings.length} 条`);
  }
}

main();
