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
// 每份试卷一个存档位（考点 + 细分考点），换分类答题不会覆盖别的记录

export type PracticeSource = 'pool' | 'wrong' | 'marked';

export interface PracticeResume {
  key: string; // 存档位：pool:大类:细分 / wrong / marked
  ids: string[]; // 试卷题目 id 顺序
  picks: Record<string, string>; // 已作答 id -> 选项字母
  marks: string[]; // 已标记 id
  label: string;
  source: PracticeSource;
  cursor: number; // 上次停留的题目下标
  updatedAt: number;
}

// 同时保留几份未完成练习
const MAX_RESUMES = 20;

export function practiceResumeKey(source: PracticeSource, category = '', sub = ''): string {
  return source === 'pool' ? `pool:${category}:${sub}` : source;
}

function readResumeMap(): Record<string, PracticeResume> {
  return readJson<Record<string, PracticeResume>>(KEYS.practiceResumes, {});
}

// 读取全部未完成练习；旧版单条存档会在首次读取时迁移进来
export function getPracticeResumes(): PracticeResume[] {
  let map = readResumeMap();
  if (!Object.keys(map).length) {
    const legacy = readJson<PracticeResume | null>(KEYS.practiceResume, null);
    if (legacy && Array.isArray(legacy.ids) && legacy.ids.length) {
      const key = legacy.key || `legacy:${legacy.updatedAt || 0}`;
      const migrated: PracticeResume = { ...legacy, key, cursor: legacy.cursor || 0 };
      map = { [key]: migrated };
      writeJson(KEYS.practiceResumes, map);
      removeKey(KEYS.practiceResume);
    }
  }
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPracticeResume(key: string): PracticeResume | null {
  return getPracticeResumes().find((r) => r.key === key) || null;
}

export function savePracticeResume(resume: PracticeResume): void {
  const map = readResumeMap();
  map[resume.key] = resume;
  const kept = Object.entries(map)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, MAX_RESUMES);
  writeJson(KEYS.practiceResumes, Object.fromEntries(kept));
}

export function clearPracticeResume(key: string): void {
  const map = readResumeMap();
  if (!map[key]) return;
  delete map[key];
  writeJson(KEYS.practiceResumes, map);
}

export function clearAllPracticeResumes(): void {
  writeJson(KEYS.practiceResumes, {});
  removeKey(KEYS.practiceResume);
}

// 已作答数量，用于列表展示与按钮文案
export function answeredCount(resume: PracticeResume): number {
  return Object.keys(resume.picks || {}).filter(Boolean).length;
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
