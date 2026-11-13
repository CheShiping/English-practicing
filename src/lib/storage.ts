const PREFIX = 'moread.';

export const KEYS = {
  settings: PREFIX + 'settings.v1',
  vocab: PREFIX + 'vocab.v1',
  annotations: PREFIX + 'annotations.v1',
  answers: PREFIX + 'answers.v1',
  progress: PREFIX + 'progress.v1',
  stats: PREFIX + 'stats.v1',
  imported: PREFIX + 'imported.v1',
  timer: PREFIX + 'timer.v1',
  bookmarks: PREFIX + 'bookmarks.v1',
  lastRead: PREFIX + 'lastRead.v1',
  recent: PREFIX + 'recent.v1',
  translationCache: PREFIX + 'transCache.v1',
  welcome: PREFIX + 'welcome.v1',
  practiceWrong: PREFIX + 'practice.wrong.v1',
  practiceMark: PREFIX + 'practice.mark.v1',
  practiceHistory: PREFIX + 'practice.history.v1',
  practiceResume: PREFIX + 'practice.resume.v1',
  practiceResumes: PREFIX + 'practice.resumes.v2',
} as const;

const memory = new Map<string, string>();

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key) ?? memory.get(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    try {
      memory.set(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded: keep an in-memory copy so the session still works.
    try {
      memory.set(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }
}

export function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readString(key: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeString(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function exportAll(): string {
  const out: Record<string, unknown> = { app: 'moread', version: 1, exportedAt: new Date().toISOString() };
  for (const key of Object.values(KEYS)) {
    const short = key.replace(PREFIX, '');
    out[short] = readJson(key, null);
  }
  return JSON.stringify(out, null, 2);
}

export function importAll(json: string): { ok: boolean; error?: string } {
  try {
    const data = JSON.parse(json) as Record<string, unknown>;
    if (!data || data.app !== 'moread') return { ok: false, error: '不是墨读英语的备份文件' };
    for (const key of Object.values(KEYS)) {
      const short = key.replace(PREFIX, '');
      if (short in data && data[short] != null) {
        writeJson(key, data[short]);
      }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '备份文件格式有误' };
  }
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  for (const key of Object.values(KEYS)) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
