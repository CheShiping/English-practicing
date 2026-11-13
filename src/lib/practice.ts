import type {
  PracticeData,
  PracticeMarkEntry,
  PracticeQuestion,
  PracticeSessionRecord,
  PracticeWrongEntry,
} from '@/lib/types';
import { KEYS, readJson, removeKey, writeJson } from '@/lib/storage';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

let cache: Promise<PracticeData> | null = null;

export function loadPractice(): Promise<PracticeData> {
  if (!cache) {
    cache = fetch(`${BASE_PATH}/data/practice.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`加载练习数据失败（${r.status}）`);
        return r.json() as Promise<PracticeData>;
      })
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

export const CATEGORY_ORDER = ['六大词性', '两个态', '三大从句', '五大句型', '四个重点', '其他'];

export function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

// ---------- 错题本 ----------

export function getWrongBook(): Record<string, PracticeWrongEntry> {
  return readJson<Record<string, PracticeWrongEntry>>(KEYS.practiceWrong, {});
}

export function addWrong(id: string, myAnswer: string): void {
  const book = getWrongBook();
  const cur = book[id];
  book[id] = {
    id,
    wrongCount: (cur?.wrongCount || 0) + 1,
    lastWrongAt: Date.now(),
    myAnswer,
  };
  writeJson(KEYS.practiceWrong, book);
}

export function removeWrong(id: string): void {
  const book = getWrongBook();
  delete book[id];
  writeJson(KEYS.practiceWrong, book);
}

export function clearWrongBook(): void {
  writeJson(KEYS.practiceWrong, {});
}

export function getWrongIds(): string[] {
  return Object.values(getWrongBook())
    .sort((a, b) => b.lastWrongAt - a.lastWrongAt)
    .map((e) => e.id);
}

// ---------- 标记本 ----------
// 标记独立于单次练习存档：退出练习、换一组题、刷新页面后依然保留

export function getMarkBook(): Record<string, PracticeMarkEntry> {
  return readJson<Record<string, PracticeMarkEntry>>(KEYS.practiceMark, {});
}

export function getMarkedIds(): string[] {
  return Object.values(getMarkBook())
    .sort((a, b) => b.markedAt - a.markedAt)
    .map((e) => e.id);
}

export function markQuestion(id: string): void {
  const book = getMarkBook();
  if (book[id]) return; // 已标记则保留原始时间
  book[id] = { id, markedAt: Date.now() };
  writeJson(KEYS.practiceMark, book);
}

export function removeMark(id: string): void {
  const book = getMarkBook();
  if (!book[id]) return;
  delete book[id];
  writeJson(KEYS.practiceMark, book);
}

// 返回切换后的状态：true 表示现在已标记
export function toggleMarkQuestion(id: string): boolean {
  const on = Boolean(getMarkBook()[id]);
  if (on) removeMark(id);
  else markQuestion(id);
  return !on;
}

export function clearMarkBook(): void {
  writeJson(KEYS.practiceMark, {});
}

// ---------- 练习进度续答 ----------

export type PracticeSource = 'pool' | 'wrong' | 'marked';

export interface PracticeResume {
  ids: string[]; // 试卷题目 id 顺序
  picks: Record<string, string>; // 已作答 id -> 选项字母
  marks: string[]; // 已标记 id
  label: string;
  source: PracticeSource;
  updatedAt: number;
}

export function getPracticeResume(): PracticeResume | null {
  return readJson<PracticeResume | null>(KEYS.practiceResume, null);
}

export function savePracticeResume(resume: PracticeResume): void {
  writeJson(KEYS.practiceResume, resume);
}

export function clearPracticeResume(): void {
  removeKey(KEYS.practiceResume);
}

// ---------- 练习记录 ----------

export function getHistory(): PracticeSessionRecord[] {
  return readJson<PracticeSessionRecord[]>(KEYS.practiceHistory, []);
}

export function addHistory(rec: PracticeSessionRecord): void {
  const list = [rec, ...getHistory()].slice(0, 50);
  writeJson(KEYS.practiceHistory, list);
}

// ---------- 组卷 ----------

export type PracticeMode = 'ordered' | 'random';

export function buildPaper(
  pool: PracticeQuestion[],
  count: number,
  mode: PracticeMode,
): PracticeQuestion[] {
  let list = [...pool];
  if (mode === 'random') {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  return count > 0 ? list.slice(0, count) : list;
}
