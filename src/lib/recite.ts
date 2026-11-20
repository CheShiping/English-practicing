// 背题数据层：记录每道题 / 每个空的「记住了 / 没记住」自评
// 单选题用 scope='practice'、ref=题目 id；完型空用 scope='cloze'、ref=`篇id#空号`
import { KEYS, readJson, writeJson } from '@/lib/storage';

export type ReciteScope = 'practice' | 'cloze';
export type ReciteStatus = 'known' | 'unknown';

export interface ReciteEntry {
  id: string; // 唯一键：scope:ref
  scope: ReciteScope;
  ref: string;
  status: ReciteStatus;
  at: number;
}

type Book = Record<string, ReciteEntry>;

function readBook(): Book {
  return readJson<Book>(KEYS.recite, {});
}

export function reciteId(scope: ReciteScope, ref: string): string {
  return `${scope}:${ref}`;
}

export function getReciteBook(): Book {
  return readBook();
}

export function getReciteEntry(scope: ReciteScope, ref: string): ReciteEntry | null {
  return readBook()[reciteId(scope, ref)] || null;
}

/** 写自评：记住了 / 没记住；同一项重复自评覆盖旧结果并刷新时间 */
export function setReciteStatus(
  scope: ReciteScope,
  ref: string,
  status: ReciteStatus,
): ReciteEntry {
  const book = readBook();
  const id = reciteId(scope, ref);
  const entry: ReciteEntry = { id, scope, ref, status, at: Date.now() };
  book[id] = entry;
  writeJson(KEYS.recite, book);
  return entry;
}

export function removeRecite(scope: ReciteScope, ref: string): void {
  const book = readBook();
  delete book[reciteId(scope, ref)];
  writeJson(KEYS.recite, book);
}

export function clearReciteBook(): void {
  writeJson(KEYS.recite, {});
}

export interface ReciteSummary {
  known: number;
  unknown: number;
  total: number;
}

/** 统计某一类自评结果；传 ids 时只统计给定范围 */
export function reciteSummary(scope: ReciteScope, ids?: string[]): ReciteSummary {
  const book = readBook();
  let known = 0;
  let unknown = 0;
  for (const entry of Object.values(book)) {
    if (entry.scope !== scope) continue;
    if (ids && !ids.includes(entry.ref)) continue;
    if (entry.status === 'known') known += 1;
    else unknown += 1;
  }
  return { known, unknown, total: known + unknown };
}

/** 没记住的条目（背题本），最近自评的排前面 */
export function getUnknownEntries(scope?: ReciteScope): ReciteEntry[] {
  return Object.values(readBook())
    .filter((e) => (!scope || e.scope === scope) && e.status === 'unknown')
    .sort((a, b) => b.at - a.at);
}

/** 完型按篇统计：ref 形如 `b01#3` */
export function clozeProgress(passageId: string): {
  known: number;
  unknown: number;
  total: number;
} {
  const prefix = `${passageId}#`;
  let known = 0;
  let unknown = 0;
  for (const entry of Object.values(readBook())) {
    if (entry.scope !== 'cloze' || !entry.ref.startsWith(prefix)) continue;
    if (entry.status === 'known') known += 1;
    else unknown += 1;
  }
  return { known, unknown, total: known + unknown };
}

/** 单选按题目 id 统计 */
export function practiceProgress(questionIds: string[]): {
  known: number;
  unknown: number;
  total: number;
} {
  const book = readBook();
  let known = 0;
  let unknown = 0;
  for (const id of questionIds) {
    const entry = book[reciteId('practice', id)];
    if (!entry) continue;
    if (entry.status === 'known') known += 1;
    else unknown += 1;
  }
  return { known, unknown, total: known + unknown };
}
