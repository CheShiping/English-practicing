import type { Article, Block, Question } from '@/lib/types';

export interface ParsedArticle extends Article {
  warnings: string[];
  source: 'imported';
}

function unescapeMd(s: string): string {
  return s
    .replace(/\\([.\\\-!()_*#\[\]{}`>+~|])/g, '$1')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function stripInlineMd(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s*/, '')
    .trim();
}

function cleanLine(line: string): string {
  return stripInlineMd(unescapeMd(line.replace(/\r$/, '')));
}

function isPassageMarker(line: string): boolean {
  return /^#{0,3}\s*Passage\s+\d+\s*$/i.test(line.trim());
}

function passageNumber(line: string): number | null {
  const m = line.match(/Passage\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

function isQuestionStart(line: string): boolean {
  return /^\s*\d{1,2}\s*[.．、]\s+/.test(line);
}

function isOption(line: string): boolean {
  return /^\s*[A-DＡ-Ｄ]\s*[.．、)）:：]\s*/.test(line);
}

function stripOptionPrefix(line: string): string {
  return line.replace(/^\s*[A-DＡ-Ｄ]\s*[.．、)）:：]\s*/, '').trim();
}

function stripQuestionPrefix(line: string): string {
  return line.replace(/^\s*\d{1,2}\s*[.．、]\s+/, '').trim();
}

function inferCategory(name: string): { id: string; name: string } {
  if (/科普/.test(name)) return { id: 'kepu', name: '科普类' };
  if (/经历|记叙|叙事/.test(name)) return { id: 'jingli', name: '经历记叙类' };
  if (/应用文|通知|合同/.test(name)) return { id: 'yingyong', name: '应用文类' };
  if (/经济|商业|商务/.test(name)) return { id: 'jingji', name: '经济商业类' };
  return { id: 'custom', name: name || '自定义' };
}

function buildBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];

  const flushPara = () => {
    const text = para.join(' ').replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ type: 'p', text });
    para = [];
  };

  for (const raw of lines) {
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
      if (!/[.!?。！？:：;；”"']$/.test(prev)) para.push(line);
      else {
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

function splitInlineOptions(stem: string): { stem: string; options: string[] } {
  // Support "1. Stem. A. xxx B. xxx C. xxx D. xxx" on one line.
  const m = stem.match(/^(.*?)(?=\s+[A-D][.．、)）:：]\s*)/);
  if (!m) return { stem, options: [] };
  const rest = stem.slice(m[1].length);
  const parts = rest.split(/\s+(?=[A-D][.．、)）:：]\s*)/);
  if (parts.length < 3) return { stem, options: [] };
  const options = parts.map((p) => stripOptionPrefix(p.trim())).filter(Boolean);
  if (options.length < 3) return { stem, options: [] };
  return { stem: m[1].trim(), options };
}

function parseQuestions(lines: string[]): Question[] {
  const questions: Question[] = [];
  let cur: (Question & { stemParts: string[] }) | null = null;
  let lastOption = false;

  const flush = () => {
    if (!cur) return;
    const stem = cur.stemParts.join(' ').replace(/\s+/g, ' ').trim();
    if (!stem && !cur.options.length) {
      cur = null;
      return;
    }
    const inline = splitInlineOptions(stem);
    const options = cur.options.length ? cur.options : inline.options;
    questions.push({
      num: cur.num,
      stem: inline.stem || stem,
      options,
      answer: cur.answer || '',
      explanation: cur.explanation || '',
      evidence: cur.evidence || '',
    });
    cur = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const ansMatch = line.match(/^(?:答案|参考答案|Answer)\s*[:：]\s*([A-DＡ-Ｄ])\b/i);
    if (ansMatch && cur) {
      cur.answer = ansMatch[1].toUpperCase().replace('Ａ', 'A').replace('Ｂ', 'B').replace('Ｃ', 'C').replace('Ｄ', 'D');
      continue;
    }
    const expMatch = line.match(/^(?:解析|详解|Explanation)\s*[:：]\s*(.+)$/i);
    if (expMatch && cur) {
      cur.explanation = expMatch[1].trim();
      continue;
    }
    const evMatch = line.match(/^(?:定位|原文|Evidence)\s*[:：]\s*(.+)$/i);
    if (evMatch && cur) {
      cur.evidence = evMatch[1].trim();
      continue;
    }

    if (isQuestionStart(line)) {
      flush();
      const num = Number(line.match(/^\s*(\d{1,2})/)?.[1] || questions.length + 1);
      cur = { num, stem: '', stemParts: [stripQuestionPrefix(line)], options: [], answer: '', explanation: '' };
      lastOption = false;
      continue;
    }
    if (!cur) continue;
    if (isOption(line)) {
      cur.options.push(stripOptionPrefix(line));
      lastOption = true;
      continue;
    }
    if (lastOption && cur.options.length) {
      cur.options[cur.options.length - 1] += ' ' + line;
    } else {
      cur.stemParts.push(line);
    }
  }
  flush();
  return questions;
}

function estimateDifficulty(words: number): string {
  if (words < 180) return '基础';
  if (words < 300) return '进阶';
  return '挑战';
}

export interface ParseOptions {
  fileName?: string;
  categoryId?: string;
  categoryName?: string;
}

export function parseMarkdownArticles(text: string, opts: ParseOptions = {}): ParsedArticle[] {
  const rawLines = text.split(/\r?\n/);
  const warnings: string[] = [];
  let docTitle = '';
  let heading = '';

  type Chunk = { number: number; heading: string; lines: string[] };
  const chunks: Chunk[] = [];
  let cur: Chunk | null = null;

  const startChunk = (num: number, h = ''): Chunk => {
    if (cur) chunks.push(cur);
    const next: Chunk = { number: num, heading: h, lines: [] };
    cur = next;
    return next;
  };

  for (const original of rawLines) {
    const line = cleanLine(original);
    if (!line) {
      if (cur) cur.lines.push('');
      continue;
    }
    if (!docTitle && /^#\s+/.test(original)) {
      docTitle = line.replace(/^#\s+/, '').trim();
      continue;
    }
    if (isPassageMarker(line)) {
      startChunk(passageNumber(line) || chunks.length + 1);
      continue;
    }
    const h = line.match(/^#{2,4}\s+(.+)$/);
    if (h) {
      if (!cur) {
        startChunk(1, h[1].trim());
      } else if (!cur.heading && !cur.lines.some((l) => l.trim()) && !cur.lines.some((l) => isQuestionStart(l))) {
        cur.heading = h[1].trim();
      } else {
        cur.lines.push(h[1].trim());
      }
      continue;
    }
    if (/^-{3,}$/.test(line.trim())) {
      if (cur) {
        chunks.push(cur);
        cur = null;
      }
      continue;
    }
    if (!cur) cur = startChunk(1);
    cur.lines.push(line);
  }
  if (cur) chunks.push(cur);

  const cat = opts.categoryId
    ? { id: opts.categoryId, name: opts.categoryName || opts.categoryId }
    : inferCategory(opts.fileName || docTitle || '自定义');

  const articles: ParsedArticle[] = [];
  const stamp = Date.now().toString(36);

  chunks.forEach((chunk, idx) => {
    const bodyLines: string[] = [];
    const qLines: string[] = [];
    let inQ = false;
    for (const l of chunk.lines) {
      if (isQuestionStart(l)) inQ = true;
      if (inQ) qLines.push(l);
      else bodyLines.push(l);
    }
    const blocks = buildBlocks(bodyLines);
    const questions = parseQuestions(qLines);
    const bodyText = blocks.map((b) => b.text).join(' ');
    const words = (bodyText.match(/[A-Za-z][A-Za-z'’\-]*/g) || []).length;
    if (!blocks.length) {
      warnings.push(`第 ${idx + 1} 段没有正文，已跳过`);
      return;
    }
    if (!questions.length) warnings.push(`第 ${idx + 1} 篇没有识别到题目，将以“纯阅读”模式导入`);
    const firstSentence = (blocks.find((b) => b.type === 'p')?.text || '').split(/(?<=[.!?])\s+/)[0] || '';
    articles.push({
      id: `user-${stamp}-${idx + 1}`,
      catId: cat.id,
      catName: opts.categoryName || cat.name,
      number: chunk.number || idx + 1,
      heading: chunk.heading,
      title: chunk.heading || firstSentence.slice(0, 90) || `导入文章 ${idx + 1}`,
      fallbackTitle: firstSentence.slice(0, 90),
      blocks,
      paragraphs: blocks.filter((b) => b.type === 'p').map((b) => b.text),
      questions,
      wordCount: words,
      difficulty: estimateDifficulty(words),
      source: 'imported',
      addedAt: Date.now(),
      warnings,
    });
  });

  if (!articles.length) warnings.push('没有解析出可导入的文章，请检查格式');
  return articles;
}
