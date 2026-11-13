import type { PracticeData, PracticeQuestion, PracticeSessionRecord, PracticeWrongEntry } from '@/lib/types';
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

// ---------- 练习进度续答 ----------

export interface PracticeResume {
  ids: string[]; // 试卷题目 id 顺序
  picks: Record<string, string>; // 已作答 id -> 选项字母
  marks: string[]; // 已标记 id
  label: string;
  source: 'pool' | 'wrong';
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
