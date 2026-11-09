import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTICLE_DIR = path.join(ROOT, 'article');
const OUT_DIR = path.join(ROOT, 'src', 'data');

const CATEGORY_MAP = {
  '科普类专项训练': { catId: 'kepu', catName: '科普类', order: 1 },
  '经历记叙类专项训练': { catId: 'jingli', catName: '经历记叙类', order: 2 },
  '应用文类专项训练': { catId: 'yingyong', catName: '应用文类', order: 3 },
  '经济商业类专项训练': { catId: 'jingji', catName: '经济商业类', order: 4 },
  '历史人文类专项训练': { catId: 'lishi', catName: '历史人文类', order: 5 },
  '社会生活类专项训': { catId: 'shehui', catName: '社会生活类', order: 6 },
  '社会生活类专项训练': { catId: 'shehui', catName: '社会生活类', order: 6 },
};

function unescapeMd(s) {
  return String(s)
    .replace(/\\([.\\\-!()_*#\[\]{}`>+~|])/g, '$1')
    .replace(/\\$/g, '')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function cleanLine(line) {
  return unescapeMd(line.replace(/\r$/, ''))
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/[ \t]+$/g, '');
}

function isPassageMarker(line) {
  return /^#{0,3}\s*Passage\s+\d+\s*$/i.test(line.trim());
}

function passageNumber(line) {
  const m = line.trim().match(/Passage\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

function isQuestionStart(line) {
  return /^\s*\d{1,2}\s*[.．、]\s+/.test(line);
}

function isOption(line) {
  return /^\s*[A-DＡ-Ｄ]\s*[.．、)）:：]\s*/.test(line);
}

function stripOptionPrefix(line) {
  return line.replace(/^\s*[A-DＡ-Ｄ]\s*[.．、)）:：]\s*/, '').trim();
}

function stripQuestionPrefix(line) {
  return line.replace(/^\s*\d{1,2}\s*[.．、]\s+/, '').trim();
}

function parseFile(filePath, category) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  // File-level title
  let fileTitle = '';
  const passages = [];
  let current = null;
  let sawQuestions = false;

  const flush = () => {
    if (!current) return;
    // Trim trailing empty blocks
    while (current.rawLines.length && !current.rawLines[current.rawLines.length - 1].trim()) current.rawLines.pop();
    passages.push(current);
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    const line = cleanLine(original);

    if (!current) {
      if (!fileTitle) {
        const h = line.match(/^#\s+(.+)$/);
        if (h) { fileTitle = h[1].trim(); continue; }
      }
      if (isPassageMarker(line)) {
        current = {
          number: passageNumber(line),
          heading: '',
          rawLines: [],
        };
        sawQuestions = false;
        // Look ahead: a "### Title" may immediately follow the Passage marker? Usually not.
        continue;
      }
      const h = line.match(/^#{2,4}\s+(.+)$/);
      if (h && !line.startsWith('# ')) {
        // A heading without a passage marker starts a passage (e.g. files that use only ### titles)
        current = { number: passages.length + 1, heading: h[1].trim(), rawLines: [] };
        sawQuestions = false;
        continue;
      }
      continue;
    }

    if (isPassageMarker(line)) {
      flush();
      current = { number: passageNumber(line), heading: '', rawLines: [] };
      sawQuestions = false;
      continue;
    }

    // A sub-heading inside a passage (e.g. ### Terms and Conditions of Employment)
    const h = line.match(/^#{2,4}\s+(.+)$/);
    if (h) {
      if (!current.heading && !current.rawLines.some((x) => x.trim()) && !sawQuestions) {
        current.heading = h[1].trim();
        continue;
      }
      // Other headings are content (e.g. section labels) — keep as paragraph text
      current.rawLines.push(h[1].trim());
      continue;
    }

    if (/^-{3,}$/.test(line.trim())) {
      // Document separator: end current passage
      flush();
      continue;
    }

    if (isQuestionStart(line)) {
      sawQuestions = true;
      current.rawLines.push('@@Q@@' + line);
      continue;
    }

    if (sawQuestions && isOption(line)) {
      current.rawLines.push('@@O@@' + line);
      continue;
    }

    current.rawLines.push(line);
  }
  flush();

  return { fileTitle, passages };
}

function splitBodyAndQuestions(rawLines) {
  const bodyLines = [];
  const qLines = [];
  let inQuestions = false;
  for (const l of rawLines) {
    if (l.startsWith('@@Q@@')) { inQuestions = true; qLines.push(l.slice(5)); continue; }
    if (inQuestions) qLines.push(l); else bodyLines.push(l);
  }
  return { bodyLines, qLines };
}

function buildBlocks(bodyLines) {
  const blocks = [];
  let para = [];

  const flushPara = () => {
    const text = para.join(' ').replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ type: 'p', text });
    para = [];
  };

  for (const raw of bodyLines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      continue;
    }
    const li = line.match(/^[*\-•]\s*(.+)$/);
    if (li) {
      flushPara();
      blocks.push({ type: 'li', text: li[1].trim() });
      continue;
    }
    if (para.length) {
      const prev = para[para.length - 1];
      if (!/[.!?。！？:：;；”"']$/.test(prev)) {
        para.push(line);
      } else {
        flushPara();
        para.push(line);
      }
    } else {
      para.push(line);
    }
  }
  flushPara();
  return blocks;
}

function parseQuestions(qLines) {
  const questions = [];
  let current = null;
  let optionIndex = 0;

  const flush = () => {
    if (!current) return;
    const stem = current.stemParts.join(' ').replace(/\s+/g, ' ').trim();
    if (stem || current.options.length) {
      questions.push({
        num: current.num,
        stem,
        options: current.options,
        answer: current.answer || '',
        explanation: current.explanation || '',
        evidence: current.evidence || '',
      });
    }
    current = null;
  };

  for (const raw of qLines) {
    let line = raw.trim();
    if (!line) continue;
    if (line.startsWith('@@O@@')) {
      line = line.slice(5).trim();
      if (current && line) {
        current.options.push(stripOptionPrefix(line));
        optionIndex++;
      }
      continue;
    }
    if (isQuestionStart(line)) {
      flush();
      current = {
        num: Number(line.match(/^\s*(\d{1,2})/)[1]),
        stemParts: [stripQuestionPrefix(line)],
        options: [],
        answer: '',
        explanation: '',
        evidence: '',
      };
      optionIndex = 0;
      continue;
    }
    if (!current) continue;

    const ans = line.match(/^(?:答案|参考答案|Answer)\s*[:：]\s*([A-DＡ-Ｄ])\b/i);
    if (ans) {
      current.answer = ans[1].toUpperCase().replace('Ａ', 'A').replace('Ｂ', 'B').replace('Ｃ', 'C').replace('Ｄ', 'D');
      continue;
    }
    const exp = line.match(/^(?:解析|详解|Explanation)\s*[:：]\s*(.+)$/i);
    if (exp) {
      current.explanation = exp[1].trim();
      continue;
    }
    const ev = line.match(/^(?:定位|原文|Evidence)\s*[:：]\s*(.+)$/i);
    if (ev) {
      current.evidence = ev[1].trim();
      continue;
    }

    if (isOption(line)) {
      current.options.push(stripOptionPrefix(line));
      optionIndex++;
      continue;
    }
    // Continuation of the stem or an option
    if (optionIndex > 0 && current.options.length) {
      current.options[current.options.length - 1] += ' ' + line;
    } else {
      current.stemParts.push(line);
    }
  }
  flush();
  return questions;
}

function shortHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function estimateDifficulty(words, questions) {
  if (words < 180) return '基础';
  if (words < 300) return '进阶';
  return '挑战';
}

function main() {
  if (!fs.existsSync(ARTICLE_DIR)) {
    console.error(`Article directory not found: ${ARTICLE_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(ARTICLE_DIR).filter((f) => f.endsWith('.md'));
  const articles = [];
  const categories = [];
  const warnings = [];

  for (const file of files) {
    const base = path.basename(file, '.md');
    let cat = CATEGORY_MAP[base];
    if (!cat) {
      const name = base.replace(/专项训练$/, '') || base;
      cat = { catId: `custom-${shortHash(base)}`, catName: name, order: 99 };
      warnings.push(`未注册分类「${name}」：已自动归入「${name}」，可在 article-meta.ts 中补充配色与图标`);
    }
    const parsed = parseFile(path.join(ARTICLE_DIR, file), cat);
    const catArticles = [];
    for (const p of parsed.passages) {
      const { bodyLines, qLines } = splitBodyAndQuestions(p.rawLines);
      const blocks = buildBlocks(bodyLines);
      const questions = parseQuestions(qLines);
      const text = blocks.map((b) => b.text).join(' ');
      const words = (text.match(/[A-Za-z][A-Za-z'’\-]*/g) || []).length;
      if (!blocks.length) { warnings.push(`${file} Passage ${p.number}: 正文为空，已跳过`); continue; }
      if (!questions.length) { warnings.push(`${file} Passage ${p.number}: 未解析到题目（可能原文被截断）`); }

      // Skip clearly truncated passages: too little body, or a body that ends mid-instruction.
      const lastText = (blocks[blocks.length - 1]?.text || '').trim();
      if (words < 60) { warnings.push(`${file} Passage ${p.number}: 正文过短（${words} 词），疑似截断，已跳过`); continue; }
      if (!questions.length && (/[:：]$/.test(lastText) || !/[.!?。！？"”']$/.test(lastText))) {
        warnings.push(`${file} Passage ${p.number}: 正文在“${lastText}”处截断且无题目，已跳过`);
        continue;
      }

      const id = `${cat.catId}-${String(p.number).padStart(2, '0')}`;
      const firstSentence = (blocks.find((b) => b.type === 'p')?.text || '').split(/(?<=[.!?])\s+/)[0] || '';
      const fallbackTitle = firstSentence.replace(/[.!?]+$/, '').slice(0, 90);
      catArticles.push({
        id,
        catId: cat.catId,
        catName: cat.catName,
        number: p.number,
        heading: p.heading || '',
        title: p.heading || fallbackTitle,
        fallbackTitle,
        blocks,
        paragraphs: blocks.filter((b) => b.type === 'p').map((b) => b.text),
        questions,
        wordCount: words,
        difficulty: estimateDifficulty(words, questions.length),
        file,
      });
    }
    catArticles.sort((a, b) => a.number - b.number);
    articles.push(...catArticles);
    if (catArticles.length) {
      categories.push({
        id: cat.catId,
        name: cat.catName,
        order: cat.order,
        file,
        count: catArticles.length,
      });
    }
  }

  categories.sort((a, b) => a.order - b.order);
  articles.sort((a, b) => {
    const ca = categories.findIndex((c) => c.id === a.catId);
    const cb = categories.findIndex((c) => c.id === b.catId);
    return ca - cb || a.number - b.number;
  });

  // Merge optional translations (translations.json + translations-part*.json)
  const translations = {};
  for (const f of fs.readdirSync(OUT_DIR).filter((x) => /^translations.*\.json$/.test(x))) {
    Object.assign(translations, JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8')));
  }
  // Merge optional answer keys (supports both answers.json and answers/*.json)
  const answers = {};
  const ansPath = path.join(OUT_DIR, 'answers.json');
  if (fs.existsSync(ansPath)) Object.assign(answers, JSON.parse(fs.readFileSync(ansPath, 'utf8')));
  const ansDir = path.join(OUT_DIR, 'answers');
  if (fs.existsSync(ansDir)) {
    for (const f of fs.readdirSync(ansDir).filter((x) => x.endsWith('.json'))) {
      Object.assign(answers, JSON.parse(fs.readFileSync(path.join(ansDir, f), 'utf8')));
    }
  }

  for (const a of articles) {
    const t = translations[a.id] || [];
    a.translations = a.blocks.map((_, i) => t[i] || '');
    a.blocks.forEach((b, i) => {
      b.translation = t[i] || '';
    });
    const key = answers[a.id] || {};
    for (const q of a.questions) {
      const k = key[String(q.num)];
      if (k) {
        q.answer = k.answer || '';
        q.explanation = k.explanation || '';
        q.evidence = k.evidence || '';
      }
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    categories,
    articles,
    stats: {
      articles: articles.length,
      questions: articles.reduce((s, a) => s + a.questions.length, 0),
      words: articles.reduce((s, a) => s + a.wordCount, 0),
      withAnswers: articles.reduce((s, a) => s + a.questions.filter((q) => q.answer).length, 0),
      withTranslations: articles.filter((a) => a.translations.some(Boolean)).length,
    },
  };

  fs.writeFileSync(path.join(OUT_DIR, 'articles.generated.json'), JSON.stringify(payload, null, 2) + '\n', 'utf8');

  console.log(`✓ 生成 ${articles.length} 篇文章 / ${payload.stats.questions} 道题 / ${payload.stats.words} 词`);
  console.log(`  含答案: ${payload.stats.withAnswers} 题 · 含译文: ${payload.stats.withTranslations} 篇`);
  for (const c of categories) console.log(`  - ${c.name}: ${c.count} 篇`);
  if (warnings.length) {
    console.log('\n⚠ 警告:');
    for (const w of warnings) console.log('  ' + w);
  }
}

main();
