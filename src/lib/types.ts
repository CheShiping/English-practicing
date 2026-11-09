export interface Block {
  type: 'p' | 'li' | 'table';
  text: string;
  rows?: string[][];
  translation?: string;
}

export interface Question {
  num: number;
  stem: string;
  options: string[];
  answer?: string;
  explanation?: string;
  evidence?: string;
}

export interface Article {
  id: string;
  catId: string;
  catName: string;
  number: number;
  heading?: string;
  title?: string;
  fallbackTitle: string;
  blocks: Block[];
  paragraphs: string[];
  translations?: string[];
  questions: Question[];
  wordCount: number;
  difficulty: '基础' | '进阶' | '挑战' | string;
  file?: string;
  source?: 'bundled' | 'imported';
  addedAt?: number;
  subtitle?: string;
  tags?: string[];
  summary?: string;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  file: string;
  count: number;
  description?: string;
  color?: string;
  icon?: string;
}

export interface ArticleData {
  generatedAt: string;
  categories: Category[];
  articles: Article[];
  stats: {
    articles: number;
    questions: number;
    words: number;
    withAnswers: number;
    withTranslations: number;
  };
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface Annotation {
  id: string;
  articleId: string;
  blockIndex: number;
  start: number;
  end: number;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VocabWord {
  word: string;
  phonetic?: string;
  meaning?: string;
  tag?: string;
  articleId?: string;
  articleTitle?: string;
  createdAt: number;
  mastery: number; // 0-5
  reviewCount: number;
  lastReviewedAt?: number;
  nextReviewAt?: number;
}

export interface AnswerState {
  answers: Record<number, string>;
  marked: number[];
  submitted: boolean;
  submittedAt?: number;
  correctCount?: number;
  timeSpent?: number;
}

export interface ReadingProgress {
  articleId: string;
  scroll: number;
  percent: number;
  updatedAt: number;
  completed: boolean;
  timeSpent: number;
}

export interface DayStat {
  date: string; // YYYY-MM-DD
  minutes: number;
  words: number;
  questions: number;
  correct: number;
  articles: number;
}

export interface Settings {
  theme: 'paper' | 'white' | 'dark';
  fontSize: number;
  lineHeight: number;
  fontFamily: 'serif' | 'sans';
  contentWidth: number;
  justify: boolean;
  guardMode: boolean;
  highlightVocab: boolean;
  autoSpeak: boolean;
  showTranslation: boolean;
}

export interface TimerSettings {
  mode: 'up' | 'down';
  totalMs: number;
}

export interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'done';
  mode: 'up' | 'down';
  totalMs: number;
  accumulated: number;
  startedAt: number | null;
  hidden: boolean;
}

export interface DictEntry {
  p?: string;
  t: string;
  g?: string;
  f?: number;
}
