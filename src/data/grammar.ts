import generated from './grammar.generated.json';

export interface GrammarSection {
  id: string;
  order: string;
  title: string;
  en: string;
  file: string;
  content: string;
}

// 内容来自 article/语法框架/*.md，由 scripts/build-grammar.mjs 原样生成。
export const GRAMMAR_SECTIONS = generated.sections as GrammarSection[];
