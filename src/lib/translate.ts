import { KEYS, readJson, writeJson } from '@/lib/storage';
import { lookupWord } from '@/lib/dict';
import { normalizeWord } from '@/lib/utils';

interface CacheItem {
  t: string;
  ts: number;
}

const MAX_CACHE = 500;

function loadCache(): Record<string, CacheItem> {
  return readJson<Record<string, CacheItem>>(KEYS.translationCache, {});
}

function saveCache(cache: Record<string, CacheItem>) {
  const entries = Object.entries(cache).sort((a, b) => b[1].ts - a[1].ts).slice(0, MAX_CACHE);
  writeJson(KEYS.translationCache, Object.fromEntries(entries));
}

function hash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function decodeEntities(s: string): string {
  if (typeof document === 'undefined') return s;
  const el = document.createElement('textarea');
  el.innerHTML = s;
  return el.value;
}

function splitChunks(text: string, max = 480): string[] {
  if (text.length <= max) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+["”']?|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      chunks.push(cur.trim());
      cur = '';
    }
    if (s.length > max) {
      // Very long sentence: split on commas / spaces.
      const parts = s.split(/(?<=[,;:])\s+/);
      for (const p of parts) {
        if ((cur + p).length > max && cur) {
          chunks.push(cur.trim());
          cur = '';
        }
        cur += p;
      }
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length ? chunks : [text];
}

export interface TranslateResult {
  text: string;
  cached?: boolean;
  error?: string;
}

export async function translateText(text: string, target = 'zh-CN'): Promise<TranslateResult> {
  const clean = text.trim();
  if (!clean) return { text: '' };
  const key = `${target}:${hash(clean)}`;
  const cache = loadCache();
  if (cache[key]) return { text: cache[key].t, cached: true };

  try {
    const chunks = splitChunks(clean);
    const results: string[] = [];
    for (const chunk of chunks) {
      const url =
        'https://api.mymemory.translated.net/get?q=' +
        encodeURIComponent(chunk) +
        `&langpair=en|${encodeURIComponent(target)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status === 429 ? '翻译请求过于频繁，请稍后再试' : `翻译服务不可用（${res.status}）`);
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (!translated || typeof translated !== 'string') {
        throw new Error(data?.responseDetails || '翻译失败');
      }
      results.push(decodeEntities(translated));
    }
    const out = results.join(' ');
    cache[key] = { t: out, ts: Date.now() };
    saveCache(cache);
    return { text: out };
  } catch (e) {
    return { text: '', error: e instanceof Error ? e.message : '翻译失败，请检查网络' };
  }
}

export interface SentenceWord {
  word: string;
  meaning: string;
}

export interface SentenceAnalysis {
  translation: string;
  translationError?: string;
  words: SentenceWord[];
  structures: string[];
  clauses: number;
}

const STRUCTURE_RULES: Array<{ re: RegExp; label: string }> = [
  { re: /\b(although|though|even though|even if)\b/i, label: '让步状语从句（although / though）' },
  { re: /\b(because|since|as)\b/i, label: '原因状语从句（because / since / as）' },
  { re: /\b(if|unless|provided that|as long as)\b/i, label: '条件状语从句（if / unless）' },
  { re: /\b(when|while|before|after|until|as soon as|once)\b/i, label: '时间状语从句' },
  { re: /\b(so that|in order that|in order to|so as to)\b/i, label: '目的状语（so that / in order to）' },
  { re: /\b(that|which|who|whom|whose|where|when)\b/i, label: '含关系词，注意定语从句或名词性从句' },
  { re: /\bnot only\b[\s\S]*\bbut also\b/i, label: 'not only ... but also 并列递进' },
  { re: /\b(rather than|instead of)\b/i, label: 'rather than / instead of 对比取舍' },
  { re: /\b(be|is|are|was|were|been|being)\s+\w+(ed|en)\b/i, label: '被动语态（be + 过去分词）' },
  { re: /\bIt\s+(is|was)\b[\s\S]*\bthat\b/i, label: '可能是 it is ... that 强调句' },
  { re: /\b(however|therefore|moreover|furthermore|nevertheless|in contrast|as a result)\b/i, label: '逻辑连接词，注意句间关系' },
  { re: /[,;]\s*(and|but|or|so|yet)\b/i, label: '并列句连接' },
];

const STOPWORDS = new Set(
  `the and for with from this that these those there their them they then than when while what where which who whom whose why how
  have has had been being are was were will would can could shall should may might must not but nor yet so too very just also only
  more most some any all each every other another such into over under about after before because although though since until
  your yours our ours its it's i'm you're we're they're he's she's is are was were do does did done doing make makes made
  one two three four five first second third next last new old good bad big small long short high low early late right left
  same own few many much less least well back even still ever never always often sometimes usually really quite rather almost
  enough something anything nothing everything someone anyone everyone nobody people person thing things time times day days
  year years way ways part parts place places case cases fact facts`
    .split(/\s+/)
    .filter(Boolean),
);

export async function analyzeSentence(text: string): Promise<SentenceAnalysis> {
  const clean = text.replace(/\s+/g, ' ').trim();
  const [trans, dictWords] = await Promise.all([
    translateText(clean),
    (async () => {
      const tokens = clean.match(/[A-Za-z][A-Za-z'’\-]{2,}/g) || [];
      const seen = new Set<string>();
      const picked: string[] = [];
      for (const t of tokens) {
        const w = normalizeWord(t);
        if (w.length < 4 || seen.has(w) || STOPWORDS.has(w)) continue;
        seen.add(w);
        picked.push(w);
        if (picked.length >= 30) break;
      }
      const results = await Promise.all(picked.map((w) => lookupWord(w)));
      const seenBase = new Set<string>();
      return results
        .filter((r) => {
          if (!r.meaning || /(人名|地名)/.test(r.meaning)) return false;
          if (STOPWORDS.has(r.base) || seenBase.has(r.base)) return false;
          seenBase.add(r.base);
          return true;
        })
        .map((r) => ({
          r,
          score:
            (r.base.length >= 7 ? 3 : 0) +
            (r.rank && r.rank > 2500 ? 2 : 0) +
            (r.rank ? 0 : 2) +
            (/(?:n\.|v\.|adj\.|adv\.)/.test(r.meaning || '') ? 1 : 0),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(({ r }) => ({
          word: r.base,
          meaning: (r.meaning || '').split('\n')[0].slice(0, 60),
        }));
    })(),
  ]);

  const structures: string[] = [];
  for (const rule of STRUCTURE_RULES) {
    if (rule.re.test(clean) && !structures.includes(rule.label)) structures.push(rule.label);
  }
  const clauseCount = (clean.match(/,|;|\b(that|which|who|because|although|if|when|while)\b/gi) || []).length + 1;

  return {
    translation: trans.text,
    translationError: trans.error,
    words: dictWords,
    structures: structures.slice(0, 5),
    clauses: clauseCount,
  };
}
