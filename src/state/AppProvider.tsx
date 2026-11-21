'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  Annotation,
  AnswerState,
  Article,
  DayStat,
  HighlightColor,
  ReadingProgress,
  SessionKind,
  SessionRecap,
  Settings,
  StudySession,
  VocabWord,
} from '@/lib/types';
import { KEYS, readJson, writeJson } from '@/lib/storage';
import { todayKey, uid } from '@/lib/utils';

const DEFAULT_SETTINGS: Settings = {
  theme: 'paper',
  fontSize: 18,
  lineHeight: 1.85,
  fontFamily: 'serif',
  contentWidth: 720,
  justify: false,
  guardMode: false,
  highlightVocab: true,
  autoSpeak: false,
  showTranslation: false,
};

export type ReviewRating = 'again' | 'good' | 'easy';

interface ToastItem {
  id: string;
  message: string;
  kind: 'info' | 'success' | 'error';
  closing?: boolean;
}

interface AppContextValue {
  hydrated: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;

  vocab: VocabWord[];
  addWord: (w: Omit<VocabWord, 'createdAt' | 'mastery' | 'reviewCount'> & { createdAt?: number }) => boolean;
  removeWord: (word: string) => void;
  updateWord: (word: string, patch: Partial<VocabWord>) => void;
  reviewWord: (word: string, rating: ReviewRating) => void;
  clearVocab: () => void;

  annotations: Annotation[];
  addAnnotation: (a: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;

  answers: Record<string, AnswerState>;
  setAnswer: (articleId: string, qnum: number, letter: string) => void;
  toggleMark: (articleId: string, qnum: number) => void;
  submitAnswers: (articleId: string, correct: number, timeSpent: number) => void;
  resetAnswers: (articleId: string) => void;
  getAnswerState: (articleId: string) => AnswerState;

  progress: Record<string, ReadingProgress>;
  updateProgress: (articleId: string, percent: number, scroll?: number) => void;
  addReadingTime: (articleId: string, ms: number) => void;
  markComplete: (articleId: string) => void;

  stats: Record<string, DayStat>;
  recordActivity: (patch: Partial<Omit<DayStat, 'date'>>) => void;
  readingStreak: number;

  imported: Article[];
  addImported: (articles: Article[]) => void;
  removeImported: (id: string) => void;

  bookmarks: string[];
  toggleBookmark: (id: string) => void;

  recent: string[];
  pushRecent: (id: string) => void;
  lastRead: string;
  setLastRead: (id: string) => void;

  /** 自动计时会话：进入阅读 / 完型即开始，离开时结算 */
  session: StudySession | null;
  sessionRecap: SessionRecap | null;
  startSession: (
    kind: SessionKind,
    meta: { refId: string; label: string; answered?: number; total?: number },
  ) => void;
  syncSession: (patch: { answered?: number; total?: number }) => void;
  endSession: (opts?: {
    completed?: boolean;
    answered?: number;
    total?: number;
    silent?: boolean;
  }) => number;
  dismissSessionRecap: () => void;

  toasts: ToastItem[];
  toast: (message: string, kind?: ToastItem['kind']) => void;
  dismissToast: (id: string) => void;

  clearAll: () => void;
  refreshFromStorage: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadAll() {
  return {
    settings: { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>(KEYS.settings, {}) },
    vocab: readJson<VocabWord[]>(KEYS.vocab, []),
    annotations: readJson<Annotation[]>(KEYS.annotations, []),
    answers: readJson<Record<string, AnswerState>>(KEYS.answers, {}),
    progress: readJson<Record<string, ReadingProgress>>(KEYS.progress, {}),
    stats: readJson<Record<string, DayStat>>(KEYS.stats, {}),
    imported: readJson<Article[]>(KEYS.imported, []),
    bookmarks: readJson<string[]>(KEYS.bookmarks, []),
    recent: readJson<string[]>(KEYS.recent, []),
    lastRead: readJson<string>(KEYS.lastRead, ''),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [vocab, setVocab] = useState<VocabWord[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>({});
  const [stats, setStats] = useState<Record<string, DayStat>>({});
  const [imported, setImported] = useState<Article[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [lastRead, setLastReadState] = useState('');
  const [session, setSession] = useState<StudySession | null>(null);
  const [sessionRecap, setSessionRecap] = useState<SessionRecap | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // 结算发生在组件卸载时，用 ref 拿最新一版会话，避免闭包里的旧值
  const sessionRef = useRef<StudySession | null>(null);

  const refreshFromStorage = useCallback(() => {
    const d = loadAll();
    setSettings(d.settings);
    setVocab(d.vocab);
    setAnnotations(d.annotations);
    setAnswers(d.answers);
    setProgress(d.progress);
    setStats(d.stats);
    setImported(d.imported);
    setBookmarks(d.bookmarks);
    setRecent(d.recent);
    setLastReadState(d.lastRead);
    setHydrated(true);
  }, []);

  useEffect(() => {
    refreshFromStorage();
  }, [refreshFromStorage]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.settings, settings);
  }, [settings, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.vocab, vocab);
  }, [vocab, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.annotations, annotations);
  }, [annotations, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.answers, answers);
  }, [answers, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.progress, progress);
  }, [progress, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.stats, stats);
  }, [stats, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.imported, imported);
  }, [imported, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.bookmarks, bookmarks);
  }, [bookmarks, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.recent, recent);
  }, [recent, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.lastRead, lastRead);
  }, [lastRead, hydrated]);

  // Apply reading preferences to the document so every screen benefits.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.style.setProperty('--reader-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--reader-line-height', String(settings.lineHeight));
    root.style.setProperty('--reader-width', `${settings.contentWidth}px`);
    root.style.setProperty('--reader-font', settings.fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)');
    root.style.setProperty('--reader-justify', settings.justify ? 'justify' : 'left');
  }, [settings]);

  const applySession = useCallback((next: StudySession | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  // 切到后台就把计时挂起，回来接着走，避免把挂机时间算进「本次耗时」
  useEffect(() => {
    const onVisibility = () => {
      const cur = sessionRef.current;
      if (!cur) return;
      const t = Date.now();
      if (document.visibilityState === 'hidden') {
        if (cur.startedAt == null) return;
        applySession({
          ...cur,
          accumulated: cur.accumulated + Math.max(0, t - cur.startedAt),
          startedAt: null,
        });
      } else if (cur.startedAt == null) {
        applySession({ ...cur, startedAt: t });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [applySession]);

  // 退场先给节点打 closing 标记，等 CSS 过渡走完（180ms）再摘掉，避免原地消失
  const dismissToast = useCallback((id: string) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    window.setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 180);
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastItem['kind'] = 'info') => {
      const id = uid('toast');
      setToasts((list) => [...list.slice(-2), { id, message, kind }]);
      window.setTimeout(() => dismissToast(id), 3000);
    },
    [dismissToast],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);
  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const addWord: AppContextValue['addWord'] = useCallback(
    (w) => {
      const key = w.word.trim().toLowerCase();
      if (!key) return false;
      if (vocab.some((x) => x.word === key)) return false;
      setVocab((list) => {
        if (list.some((x) => x.word === key)) return list;
        return [
          {
            ...w,
            word: key,
            createdAt: w.createdAt || Date.now(),
            mastery: 0,
            reviewCount: 0,
            nextReviewAt: Date.now(),
          },
          ...list,
        ];
      });
      return true;
    },
    [vocab],
  );

  const removeWord = useCallback((word: string) => {
    setVocab((list) => list.filter((w) => w.word !== word));
  }, []);

  const updateWord = useCallback((word: string, patch: Partial<VocabWord>) => {
    setVocab((list) => list.map((w) => (w.word === word ? { ...w, ...patch } : w)));
  }, []);

  const reviewWord = useCallback((word: string, rating: ReviewRating) => {
    setVocab((list) =>
      list.map((w) => {
        if (w.word !== word) return w;
        const mastery = Math.min(5, Math.max(0, w.mastery + (rating === 'again' ? -1 : 1)));
        const days = rating === 'again' ? 0 : rating === 'good' ? Math.max(1, mastery) : Math.max(3, mastery * 2);
        const next = rating === 'again' ? Date.now() + 10 * 60 * 1000 : Date.now() + days * 86400000;
        return {
          ...w,
          mastery,
          reviewCount: w.reviewCount + 1,
          lastReviewedAt: Date.now(),
          nextReviewAt: next,
        };
      }),
    );
  }, []);

  const clearVocab = useCallback(() => setVocab([]), []);

  const addAnnotation = useCallback<AppContextValue['addAnnotation']>((a) => {
    const id = uid('ann');
    const ts = Date.now();
    setAnnotations((list) => [...list, { ...a, id, createdAt: ts, updatedAt: ts }]);
    return id;
  }, []);
  const updateAnnotation = useCallback((id: string, patch: Partial<Annotation>) => {
    setAnnotations((list) => list.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a)));
  }, []);
  const removeAnnotation = useCallback((id: string) => {
    setAnnotations((list) => list.filter((a) => a.id !== id));
  }, []);

  const getAnswerState = useCallback<AppContextValue['getAnswerState']>(
    (articleId) =>
      answers[articleId] || {
        answers: {},
        marked: [],
        submitted: false,
      },
    [answers],
  );

  const setAnswer = useCallback((articleId: string, qnum: number, letter: string) => {
    setAnswers((all) => {
      const cur = all[articleId] || { answers: {}, marked: [], submitted: false };
      return { ...all, [articleId]: { ...cur, answers: { ...cur.answers, [qnum]: letter } } };
    });
  }, []);

  const toggleMark = useCallback((articleId: string, qnum: number) => {
    setAnswers((all) => {
      const cur = all[articleId] || { answers: {}, marked: [], submitted: false };
      const marked = cur.marked.includes(qnum) ? cur.marked.filter((n) => n !== qnum) : [...cur.marked, qnum];
      return { ...all, [articleId]: { ...cur, marked } };
    });
  }, []);

  const submitAnswers = useCallback((articleId: string, correct: number, timeSpent: number) => {
    setAnswers((all) => {
      const cur = all[articleId] || { answers: {}, marked: [], submitted: false };
      return {
        ...all,
        [articleId]: { ...cur, submitted: true, submittedAt: Date.now(), correctCount: correct, timeSpent },
      };
    });
  }, []);

  const resetAnswers = useCallback((articleId: string) => {
    setAnswers((all) => {
      const cur = all[articleId];
      if (!cur) return all;
      return { ...all, [articleId]: { answers: {}, marked: cur.marked, submitted: false } };
    });
  }, []);

  const updateProgress = useCallback((articleId: string, percent: number, scroll = 0) => {
    setProgress((all) => {
      const cur = all[articleId];
      const nextPercent = Math.max(cur?.percent || 0, Math.round(percent));
      return {
        ...all,
        [articleId]: {
          articleId,
          scroll,
          percent: Math.min(100, nextPercent),
          updatedAt: Date.now(),
          completed: cur?.completed || false,
          timeSpent: cur?.timeSpent || 0,
        },
      };
    });
  }, []);

  const addReadingTime = useCallback((articleId: string, ms: number) => {
    if (ms <= 0) return;
    setProgress((all) => {
      const cur = all[articleId];
      return {
        ...all,
        [articleId]: {
          articleId,
          scroll: cur?.scroll || 0,
          percent: cur?.percent || 0,
          updatedAt: Date.now(),
          completed: cur?.completed || false,
          timeSpent: (cur?.timeSpent || 0) + ms,
        },
      };
    });
    setStats((s) => {
      const key = todayKey();
      const day = s[key] || { date: key, minutes: 0, words: 0, questions: 0, correct: 0, articles: 0 };
      return { ...s, [key]: { ...day, minutes: day.minutes + ms / 60000 } };
    });
  }, []);

  const markComplete = useCallback((articleId: string) => {
    setProgress((all) => {
      const cur = all[articleId];
      return {
        ...all,
        [articleId]: {
          articleId,
          scroll: cur?.scroll || 0,
          percent: 100,
          updatedAt: Date.now(),
          completed: true,
          timeSpent: cur?.timeSpent || 0,
        },
      };
    });
  }, []);

  const recordActivity = useCallback((patch: Partial<Omit<DayStat, 'date'>>) => {
    setStats((s) => {
      const key = todayKey();
      const day = s[key] || { date: key, minutes: 0, words: 0, questions: 0, correct: 0, articles: 0 };
      return {
        ...s,
        [key]: {
          ...day,
          minutes: day.minutes + (patch.minutes || 0),
          words: day.words + (patch.words || 0),
          questions: day.questions + (patch.questions || 0),
          correct: day.correct + (patch.correct || 0),
          articles: day.articles + (patch.articles || 0),
        },
      };
    });
  }, []);

  const readingStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 400; i++) {
      const key = todayKey(d);
      const day = stats[key];
      if (day && (day.minutes > 0.5 || day.questions > 0 || day.articles > 0)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (i === 0) {
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [stats]);

  const addImported = useCallback((articles: Article[]) => {
    setImported((list) => [...articles, ...list]);
  }, []);
  const removeImported = useCallback((id: string) => {
    setImported((list) => list.filter((a) => a.id !== id));
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((list) => (list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]));
  }, []);

  const pushRecent = useCallback((id: string) => {
    setRecent((list) => [id, ...list.filter((x) => x !== id)].slice(0, 24));
  }, []);
  const setLastRead = useCallback((id: string) => setLastReadState(id), []);

  // 进入阅读 / 完型时调用；阅读换篇不重置，完型换篇重开一局
  const startSession = useCallback<AppContextValue['startSession']>(
    (kind, meta) => {
      const cur = sessionRef.current;
      const t = Date.now();
      // 后台标签页里开的新会话先挂起，等页面可见再走表
      const startAt =
        typeof document !== 'undefined' && document.visibilityState === 'hidden' ? null : t;
      // 新一段学习开始时，上一段的结算框就该退场了
      setSessionRecap(null);
      if (cur && cur.kind === kind) {
        if (cur.refId === meta.refId) {
          const next: StudySession = {
            ...cur,
            label: meta.label,
            answered: meta.answered ?? cur.answered,
            total: meta.total ?? cur.total,
          };
          if (
            next.label === cur.label &&
            next.answered === cur.answered &&
            next.total === cur.total
          ) {
            return;
          }
          applySession(next);
          return;
        }
        if (kind === 'reading') {
          // 上一篇 / 下一篇还是一次阅读，时钟继续走
          applySession({
            ...cur,
            refId: meta.refId,
            label: meta.label,
            passages: cur.passages + 1,
            startedAt: cur.startedAt ?? startAt,
          });
          return;
        }
        // 完型一次只做一篇：换篇就是新的一局
        applySession({
          kind,
          refId: meta.refId,
          label: meta.label,
          startedAt: startAt,
          accumulated: 0,
          passages: 1,
          answered: meta.answered ?? 0,
          total: meta.total ?? 0,
        });
        return;
      }
      applySession({
        kind,
        refId: meta.refId,
        label: meta.label,
        startedAt: startAt,
        accumulated: 0,
        passages: 1,
        answered: meta.answered ?? 0,
        total: meta.total ?? 0,
      });
    },
    [applySession],
  );

  const syncSession = useCallback<AppContextValue['syncSession']>(
    (patch) => {
      const cur = sessionRef.current;
      if (!cur) return;
      const answered = patch.answered ?? cur.answered;
      const total = patch.total ?? cur.total;
      if (answered === cur.answered && total === cur.total) return;
      applySession({ ...cur, answered, total });
    },
    [applySession],
  );

  const endSession = useCallback<AppContextValue['endSession']>(
    (opts) => {
      const cur = sessionRef.current;
      if (!cur) return 0;
      const t = Date.now();
      const ms = cur.accumulated + (cur.startedAt != null ? Math.max(0, t - cur.startedAt) : 0);
      applySession(null);
      // 停留太短多半是误点进来，不值得弹结算框
      if (!opts?.silent && ms >= 3000) {
        setSessionRecap({
          kind: cur.kind,
          ms,
          label: cur.label,
          passages: cur.passages,
          answered: opts?.answered ?? cur.answered,
          total: opts?.total ?? cur.total,
          completed: Boolean(opts?.completed),
        });
      }
      return ms;
    },
    [applySession],
  );

  const dismissSessionRecap = useCallback(() => setSessionRecap(null), []);

  const clearAll = useCallback(() => {
    setVocab([]);
    setAnnotations([]);
    setAnswers({});
    setProgress({});
    setStats({});
    setImported([]);
    setBookmarks([]);
    setRecent([]);
    setLastReadState('');
    applySession(null);
    setSessionRecap(null);
  }, [applySession]);

  const value: AppContextValue = {
    hydrated,
    settings,
    updateSettings,
    resetSettings,
    vocab,
    addWord,
    removeWord,
    updateWord,
    reviewWord,
    clearVocab,
    annotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    answers,
    setAnswer,
    toggleMark,
    submitAnswers,
    resetAnswers,
    getAnswerState,
    progress,
    updateProgress,
    addReadingTime,
    markComplete,
    stats,
    recordActivity,
    readingStreak,
    imported,
    addImported,
    removeImported,
    bookmarks,
    toggleBookmark,
    recent,
    pushRecent,
    lastRead,
    setLastRead,
    session,
    sessionRecap,
    startSession,
    syncSession,
    endSession,
    dismissSessionRecap,
    toasts,
    toast,
    dismissToast,
    clearAll,
    refreshFromStorage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
