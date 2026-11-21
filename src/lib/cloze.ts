import type { ClozeData, ClozePassage, ClozeRecord } from '@/lib/types';
import { KEYS, readJson, writeJson } from '@/lib/storage';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

let cache: Promise<ClozeData> | null = null;

export function loadCloze(): Promise<ClozeData> {
  if (!cache) {
    cache = fetch(`${BASE_PATH}/data/cloze.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`加载完型题库失败（${r.status}）`);
        return r.json() as Promise<ClozeData>;
      })
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

// ---------- 作答进度 ----------
// 按“篇”存：每题的选择 + 更新时间；全部答对/答完时不额外标记，正确率由 picks 推出

type Book = Record<string, ClozeRecord>;

function readBook(): Book {
  return readJson<Book>(KEYS.cloze, {});
}

export function getClozeBook(): Book {
  return readBook();
}

export function getClozeRecord(id: string): ClozeRecord | null {
  return readBook()[id] || null;
}

export function saveClozePick(id: string, num: number, letter: string): void {
  const book = readBook();
  const rec = book[id] || { picks: {}, updatedAt: Date.now() };
  rec.picks = { ...rec.picks, [num]: letter };
  rec.updatedAt = Date.now();
  book[id] = rec;
  writeJson(KEYS.cloze, book);
}

export function finishCloze(id: string, timeSpent = 0): void {
  const book = readBook();
  const rec = book[id];
  if (!rec) return;
  rec.finishedAt = Date.now();
  rec.updatedAt = Date.now();
  if (timeSpent > 0) rec.timeSpent = timeSpent;
  writeJson(KEYS.cloze, book);
}

export function clearClozeRecord(id: string): void {
  const book = readBook();
  if (!book[id]) return;
  delete book[id];
  writeJson(KEYS.cloze, book);
}

export function clearClozeBook(): void {
  writeJson(KEYS.cloze, {});
}

export interface ClozeStat {
  answered: number;
  correct: number;
  total: number;
  percent: number;
  done: boolean;
}

export function clozeStat(p: ClozePassage, rec?: ClozeRecord | null): ClozeStat {
  const picks = rec?.picks || {};
  const answered = p.blanks.filter((b) => picks[b.num]).length;
  const correct = p.blanks.filter((b) => picks[b.num] && picks[b.num] === b.answer).length;
  const percent = answered ? Math.round((correct / answered) * 100) : 0;
  return { answered, correct, total: p.blanks.length, percent, done: answered === p.blanks.length };
}
