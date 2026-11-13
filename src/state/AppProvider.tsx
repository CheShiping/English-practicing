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
  Settings,
  TimerState,
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

const DEFAULT_TIMER: TimerState = {
  status: 'idle',
  mode: 'up',
  totalMs: 0,
  accumulated: 0,
  startedAt: null,
  hidden: false,
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

  timer: TimerState;
  timerElapsed: number;
  timerRemaining: number;
  startTimer: (mode: 'up' | 'down', totalMs: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  hideTimer: (hidden: boolean) => void;

  toasts: ToastItem[];
  toast: (message: string, kind?: ToastItem['kind']) => void;
  dismissToast: (id: string) => void;

  clearAll: () => void;
  refreshFromStorage: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadAll() {
  const savedTimer = { ...DEFAULT_TIMER, ...readJson<Partial<TimerState>>(KEYS.timer, {}) };
  // A page reload must not turn a running timer into hours of "reading time".
  // Keep the accumulated value and pause it; the user can resume deliberately.
  if (savedTimer.status === 'running' && savedTimer.startedAt) {
    savedTimer.accumulated += Math.min(Date.now() - savedTimer.startedAt, 60000);
    savedTimer.status = 'paused';
    savedTimer.startedAt = null;
  }

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
    timer: savedTimer,
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
  const [timer, setTimer] = useState<TimerState>(DEFAULT_TIMER);
  const [now, setNow] = useState(Date.now());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerAlerted = useRef(false);

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
    setTimer(d.timer);
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
  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.timer, timer);
  }, [timer, hydrated]);

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

  // Timer tick
  useEffect(() => {
    if (timer.status !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 400);
    return () => window.clearInterval(id);
  }, [timer.status]);

  const timerElapsed = useMemo(() => {
    if (timer.status === 'running' && timer.startedAt) {
      return timer.accumulated + Math.max(0, now - timer.startedAt);
    }
    return timer.accumulated;
  }, [timer, now]);

  const timerRemaining = useMemo(
    () =>
      timer.mode === 'down' && timer.totalMs > 0
        ? Math.max(0, timer.totalMs - timerElapsed)
        : timerElapsed,
    [timer.mode, timer.totalMs, timerElapsed],
  );

  // Countdown completion
  useEffect(() => {
    if (timer.status !== 'running' || timer.mode !== 'down') return;
    if (timerElapsed >= timer.totalMs && timer.totalMs > 0) {
      setTimer((t) => ({ ...t, status: 'done', accumulated: t.totalMs, startedAt: null }));
      if (!timerAlerted.current) {
        timerAlerted.current = true;
        setToasts((list) => [
          ...list,
          { id: uid('toast'), message: '倒计时结束，休息一下吧', kind: 'success' },
        ]);
        try {
          if ('vibrate' in navigator) navigator.vibrate?.([120, 60, 120]);
        } catch {
          /* ignore */
        }
      }
    }
  }, [timerElapsed, timer.status, timer.mode, timer.totalMs]);

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

  const startTimer = useCallback((mode: 'up' | 'down', totalMs: number) => {
    timerAlerted.current = false;
    setNow(Date.now());
    setTimer({
      status: 'running',
      mode,
      totalMs,
      accumulated: 0,
      startedAt: Date.now(),
      hidden: false,
    });
  }, []);
  const pauseTimer = useCallback(() => {
    setTimer((t) => {
      if (t.status !== 'running' || !t.startedAt) return t;
      return { ...t, status: 'paused', accumulated: t.accumulated + (Date.now() - t.startedAt), startedAt: null };
    });
  }, []);
  const resumeTimer = useCallback(() => {
    setNow(Date.now());
    setTimer((t) => (t.status === 'paused' ? { ...t, status: 'running', startedAt: Date.now() } : t));
  }, []);
  const resetTimer = useCallback(() => setTimer(DEFAULT_TIMER), []);
  const hideTimer = useCallback((hidden: boolean) => setTimer((t) => ({ ...t, hidden })), []);

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
    setTimer(DEFAULT_TIMER);
  }, []);

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
    timer,
    timerElapsed,
    timerRemaining,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    hideTimer,
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
