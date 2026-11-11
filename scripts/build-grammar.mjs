// 语法知识点内容管线：
// 直接读取 article/语法框架/*.md（用户提供的 23456 框架原文）
// → 生成 src/data/grammar.generated.json，页面原样渲染，不做增删。
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

function main() {
  const sections = SECTIONS.map((meta) => {
    const full = path.join(SRC_DIR, meta.file);
    if (!fs.existsSync(full)) {
      throw new Error(`缺少语法框架文件：${full}`);
    }
    const content = fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, '');
    return { ...meta, content };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    sections,
  };

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`✓ 生成语法框架 ${sections.length} 个分区（原文照搬）`);
  for (const s of sections) {
    console.log(`  - ${s.order} ${s.title}: ${s.content.split('\n').length} 行`);
  }
}

main();
