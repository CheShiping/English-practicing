import type { DictEntry } from '@/lib/types';
import { normalizeWord } from '@/lib/utils';

interface DictChunk {
  words: Record<string, DictEntry>;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const chunkCache = new Map<string, Promise<DictChunk | null>>();
let formsPromise: Promise<Record<string, string>> | null = null;

function firstLetter(word: string): string {
  const c = word.charAt(0);
  return /[a-z]/.test(c) ? c : 'misc';
}

function loadChunk(letter: string): Promise<DictChunk | null> {
  const cached = chunkCache.get(letter);
  if (cached) return cached;
  const p = fetch(`${BASE_PATH}/dict/words/${letter}.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { words?: Record<string, DictEntry> } | null) =>
      data?.words ? { words: data.words } : null,
    )
    .catch(() => null);
  chunkCache.set(letter, p);
  return p;
}

function loadForms(): Promise<Record<string, string>> {
  if (!formsPromise) {
    formsPromise = fetch(`${BASE_PATH}/dict/forms.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { forms?: Record<string, string> } | null) => data?.forms || {})
      .catch(() => ({}));
  }
  return formsPromise;
}

function makeResult(word: string, base: string, entry: DictEntry): LookupResult {
  return {
    word,
    base,
    entry,
    phonetic: entry.p,
    meaning: entry.t,
    tag: entry.g,
    rank: entry.f,
    isBaseForm: base === word,
  };
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
  if (!word) return { word, base: word, isBaseForm: true };

  const [chunk, forms] = await Promise.all([loadChunk(firstLetter(word)), loadForms()]);
  if (!chunk) return { word, base: word, isBaseForm: true };

  const direct = chunk.words[word];
  if (direct) return makeResult(word, word, direct);

  const formBase = forms[word];
  if (formBase && formBase !== word) {
    const baseChunk = await loadChunk(firstLetter(formBase));
    const entry = baseChunk?.words[formBase];
    if (entry) return makeResult(word, formBase, entry);
  }

  for (const cand of candidateForms(word)) {
    const entry = chunk.words[cand];
    if (entry) return makeResult(word, cand, entry);

    const mapped = forms[cand];
    if (mapped) {
      const mappedChunk = await loadChunk(firstLetter(mapped));
      const me = mappedChunk?.words[mapped];
      if (me) return makeResult(word, mapped, me);
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
