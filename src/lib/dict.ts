import type { DictEntry } from '@/lib/types';
import { normalizeWord } from '@/lib/utils';

export interface DictDB {
  version: number;
  count: number;
  words: Record<string, DictEntry>;
  forms: Record<string, string>;
}

let dbPromise: Promise<DictDB | null> | null = null;
let db: DictDB | null = null;

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function loadDictionary(): Promise<DictDB | null> {
  if (db) return Promise.resolve(db);
  if (dbPromise) return dbPromise;
  dbPromise = fetch(`${BASE_PATH}/dict/ecdict.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data: DictDB | null) => {
      db = data;
      return data;
    })
    .catch(() => null);
  return dbPromise;
}

export interface LookupResult {
  word: string;
  base: string;
  entry?: DictEntry;
  phonetic?: string;
  meaning?: string;
  tag?: string;
  rank?: number;
  isBaseForm: boolean;
}

function candidateForms(word: string): string[] {
  const out: string[] = [word];
  if (word.endsWith("'s")) out.push(word.slice(0, -2));
  if (word.endsWith("s'")) out.push(word.slice(0, -1));
  if (word.endsWith('ies')) out.push(word.slice(0, -3) + 'y');
  if (word.endsWith('ves')) out.push(word.slice(0, -3) + 'f', word.slice(0, -3) + 'fe');
  if (word.endsWith('es')) out.push(word.slice(0, -2));
  if (word.endsWith('s')) out.push(word.slice(0, -1));
  if (word.endsWith('ied')) out.push(word.slice(0, -3) + 'y');
  if (word.endsWith('ed')) out.push(word.slice(0, -2), word.slice(0, -1));
  if (word.endsWith('ing')) out.push(word.slice(0, -3), word.slice(0, -3) + 'e');
  if (word.endsWith('er')) out.push(word.slice(0, -2), word.slice(0, -1));
  if (word.endsWith('est')) out.push(word.slice(0, -3), word.slice(0, -2));
  if (word.endsWith('ly')) out.push(word.slice(0, -2));
  return [...new Set(out)].filter((w) => w.length >= 2);
}

export async function lookupWord(raw: string): Promise<LookupResult> {
  const word = normalizeWord(raw);
  const data = await loadDictionary();
  if (!data) return { word, base: word, isBaseForm: true };

  const direct = data.words[word];
  if (direct) {
    return {
      word,
      base: word,
      entry: direct,
      phonetic: direct.p,
      meaning: direct.t,
      tag: direct.g,
      rank: direct.f,
      isBaseForm: true,
    };
  }

  const formBase = data.forms[word];
  if (formBase && data.words[formBase]) {
    const e = data.words[formBase];
    return {
      word,
      base: formBase,
      entry: e,
      phonetic: e.p,
      meaning: e.t,
      tag: e.g,
      rank: e.f,
      isBaseForm: false,
    };
  }

  for (const cand of candidateForms(word)) {
    const e = data.words[cand];
    if (e) {
      return {
        word,
        base: cand,
        entry: e,
        phonetic: e.p,
        meaning: e.t,
        tag: e.g,
        rank: e.f,
        isBaseForm: cand === word,
      };
    }
    const mapped = data.forms[cand];
    if (mapped && data.words[mapped]) {
      const me = data.words[mapped];
      return {
        word,
        base: mapped,
        entry: me,
        phonetic: me.p,
        meaning: me.t,
        tag: me.g,
        rank: me.f,
        isBaseForm: false,
      };
    }
  }

  return { word, base: word, isBaseForm: true };
}

const TAG_LABELS: Record<string, string> = {
  zk: '中考',
  gk: '高考',
  cet4: 'CET-4',
  cet6: 'CET-6',
  ky: '考研',
  toefl: '托福',
  ielts: '雅思',
  gre: 'GRE',
};

export function parseTags(tag?: string): string[] {
  if (!tag) return [];
  return tag
    .split(/\s+/)
    .map((t) => TAG_LABELS[t] || t.toUpperCase())
    .slice(0, 4);
}

let voiceCache: SpeechSynthesisVoice[] = [];

export function speakWord(word: string, accent: 'us' | 'uk' = 'us'): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = accent === 'uk' ? 'en-GB' : 'en-US';
  utter.rate = 0.9;
  if (!voiceCache.length) voiceCache = synth.getVoices();
  const lang = accent === 'uk' ? 'en-GB' : 'en-US';
  const voice =
    voiceCache.find((v) => v.lang === lang && /Google|Microsoft|Samantha|Daniel/i.test(v.name)) ||
    voiceCache.find((v) => v.lang === lang) ||
    voiceCache.find((v) => v.lang.startsWith('en'));
  if (voice) utter.voice = voice;
  synth.speak(utter);
}
