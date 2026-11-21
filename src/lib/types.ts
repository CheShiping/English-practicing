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

export interface PracticeQuestion {
  id: string;
  num: number;
  section: string;
  sectionTitle: string;
  part: string;
  stem: string;
  options: string[];
  answer: string;
  category: string;
  sub: string;
  explanation: string;
}

export interface PracticeData {
  generatedAt: string;
  total: number;
  categories: string[];
  subcategories: Record<string, string[]>;
  sections: { id: string; part: string; title: string; count: number }[];
  questions: PracticeQuestion[];
}

// ---------- 完型填空 ----------

export interface ClozeBlank {
  num: number;
  options: string[];
  answer: string;
  note?: string;
  evidence?: string;
}

export interface ClozePassage {
  id: string;
  no: number;
  bank: '基础' | '进阶' | string;
  label: string;
  title: string;
  zh: string;
  blocks: string[];
  blanks: ClozeBlank[];
  translations?: string[];
  wordCount: number;
}

export interface ClozeData {
  generatedAt: string;
  total: number;
  blankTotal: number;
  banks: { name: string; count: number; blanks: number }[];
  passages: ClozePassage[];
}

export interface ClozeRecord {
  picks: Record<number, string>;
  updatedAt: number;
  finishedAt?: number;
  /** 交卷时本次用时（毫秒） */
  timeSpent?: number;
}

export interface PracticeWrongEntry {
  id: string;
  wrongCount: number;
  lastWrongAt: number;
  myAnswer?: string;
}

export interface PracticeMarkEntry {
  id: string;
  markedAt: number;
}

export interface PracticeSessionRecord {
  at: number;
  total: number;
  correct: number;
  label: string;
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

// ---------- 自动计时会话 ----------

export type SessionKind = 'reading' | 'cloze';

export interface StudySession {
  kind: SessionKind;
  /** 当前文章 id / 完型篇 id */
  refId: string;
  label: string;
  /** null = 页面切到后台，计时挂起 */
  startedAt: number | null;
  accumulated: number;
  /** 阅读：本次连续读了几篇；完型固定 1 */
  passages: number;
  /** 完型：已答空数 / 总空数 */
  answered: number;
  total: number;
}

export interface SessionRecap {
  kind: SessionKind;
  ms: number;
  label: string;
  passages: number;
  answered: number;
  total: number;
  completed: boolean;
}

export interface DictEntry {
  p?: string;
  t: string;
  g?: string;
  f?: number;
}
