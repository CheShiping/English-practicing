// 语法知识点内容管线：
// 读取 article/语法框架/*.md（用户提供的 23456 框架原文）
// → 生成 src/data/grammar.generated.json，页面原样渲染，不增删文字。
//
// 笔记软件有时会把整个分区导出成「一行」：标题、段落与表格全部挤在一起，
// 用两个以上空格表示块边界。渲染器按行解析，需要先还原结构。
// 还原只插入换行、压缩空白，不改动任何文字，末尾带保真校验。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'article', '语法框架');
const OUT = path.join(ROOT, 'src', 'data', 'grammar.generated.json');

const SECTIONS = [
  { id: 'grammar-2', order: '02', title: '两个态', en: 'Tense & Voice', file: '两个态（时态语态）.md' },
  { id: 'grammar-3', order: '03', title: '三大从句', en: 'Three Clauses', file: '三大从句.md' },
  { id: 'grammar-4', order: '04', title: '四个重点', en: 'Four Keys', file: '四个重点.md' },
  { id: 'grammar-5', order: '05', title: '五大句型', en: 'Five Patterns', file: '五大句型.md' },
  { id: 'grammar-6', order: '06', title: '六大词性', en: 'Six Word Classes', file: '六大词性.md' },
];

const stripWhitespace = (text) => text.replace(/\s+/g, '');

// 只有「单个超长非空行 + 多个内联标题或内联表格」才判定为压平导出，
// 其他已经是结构化 Markdown 的分区原样放行。
function isFlattenedExport(content) {
  const nonEmpty = content.split('\n').filter((line) => line.trim());
  if (nonEmpty.length !== 1 || nonEmpty[0].length < 600) return false;
  const headings = (nonEmpty[0].match(/(?:^|\s)#\s+(?!<)/g) || []).length;
  const inlineTable = /\|[^|]*\|\s*\|\s*[^|]*\|/.test(nonEmpty[0]);
  return headings >= 2 || inlineTable;
}

// 表格被压成 "| 表头 | ... | | --- | ... | | 行 | ... |"，
// 相邻两行以 "| |" 相接，在交界处补换行即可还原成标准 Markdown 表格。
function splitInlineTable(line) {
  const first = line.indexOf('|');
  const last = line.lastIndexOf('|');
  if (first < 0 || last <= first) return line;
  const rows = line.slice(first, last + 1).replace(/\|\s+(?=\|)/g, '|\n');
  return `${line.slice(0, first)}\n\n${rows}\n\n${line.slice(last + 1)}`;
}

// 两个以上空格是笔记里的块分隔符；但 <font>/<u> 标签内部的空格只是排版空白，
// 断在这里会产生孤立的闭合标签，所以用标签栈跳过未闭合区间。
function splitParagraphs(text) {
  const tokens = /<\/?(?:font|u)\b[^>]*>| {2,}/gi;
  let out = '';
  let depth = 0;
  let last = 0;
  let match;
  while ((match = tokens.exec(text))) {
    out += text.slice(last, match.index);
    const token = match[0];
    if (token.startsWith('<')) {
      depth = /^<\//i.test(token) ? Math.max(0, depth - 1) : depth + 1;
      out += token;
    } else {
      out += depth > 0 ? ' ' : '\n';
    }
    last = tokens.lastIndex;
  }
  return out + text.slice(last);
}

// 压平后标题与正文只隔一个空格（"# 名词考点 1，名词的数…"），
// 把标题单独成行，正文另起一段；<font> 包裹的标题保持原样。
function splitHeadingFromBody(line) {
  return line.replace(/^(#\s+(?:<font[^>]*>)?[^\s<>]+(?:<\/font>)?)\s+(?=\S)/, '$1\n');
}

function restoreFlattenedMarkdown(content) {
  if (!isFlattenedExport(content)) return { content, restored: false };

  const source = content.split('\n').find((line) => line.trim()) || '';
  const lines = [];
  for (const raw of splitParagraphs(splitInlineTable(source)).split('\n')) {
    const text = raw.trim();
    if (!text) continue;
    for (const part of splitHeadingFromBody(text).split('\n')) {
      const value = part.trim();
      if (!value) continue;
      // "****" 之类的空标记不单独成段，接回上一段，避免渲染出空段落。
      if (/^[*\s]+$/.test(value) && lines.length) lines[lines.length - 1] += value;
      else lines.push(value);
    }
  }

  // 段落之间空一行；但表格的各行必须紧挨着，否则渲染器不会把它们收成一张表。
  let restored = '';
  lines.forEach((line, index) => {
    if (index === 0) {
      restored = line;
      return;
    }
    const continuousTable = lines[index - 1].startsWith('|') && line.startsWith('|');
    restored += `${continuousTable ? '\n' : '\n\n'}${line}`;
  });
  if (stripWhitespace(restored) !== stripWhitespace(content)) {
    throw new Error('语法原文还原后文字不一致，已中止生成');
  }
  return { content: restored, restored: true };
}

function main() {
  const sections = SECTIONS.map((meta) => {
    const full = path.join(SRC_DIR, meta.file);
    if (!fs.existsSync(full)) {
      throw new Error(`缺少语法框架文件：${full}`);
    }
    const raw = fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, '');
    const { content, restored } = restoreFlattenedMarkdown(raw);
    return { ...meta, content, restored };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    sections: sections.map(({ restored: _restored, ...section }) => section),
  };

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`✓ 生成语法框架 ${sections.length} 个分区（文字原样）`);
  for (const s of sections) {
    const note = s.restored ? ' · 已还原压平导出' : '';
    console.log(`  - ${s.order} ${s.title}: ${s.content.split('\n').length} 行${note}`);
  }
}

main();
