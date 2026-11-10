'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  CheckCircle2,
  Languages,
  ListChecks,
  MoreHorizontal,
  Settings2,
  Timer as TimerIcon,
  X,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { useAllArticles } from '@/lib/use-articles';
import { getNeighbors } from '@/lib/data';
import { hrefFor, navigate } from '@/lib/router';
import { cn, normalizeWord } from '@/lib/utils';
import { speakWord } from '@/lib/dict';
import type { Annotation, HighlightColor } from '@/lib/types';
import ArticleBody, { type TextSelection } from '@/components/reader/ArticleBody';
import WordPopover from '@/components/reader/WordPopover';
import {
  SelectionAnalysisModal,
  SelectionToolbar,
  type SelectionInfo,
} from '@/components/reader/SelectionTools';
import NoteModal from '@/components/reader/NoteModal';
import ReaderBar from '@/components/reader/ReaderBar';
import ReaderRail, { type RailTab } from '@/components/reader/ReaderRail';
import { TimerModal, TimerWidget } from '@/components/reader/Timer';
import TranslationDrawer from '@/components/reader/TranslationDrawer';
import ReaderSettings from '@/components/reader/ReaderSettings';

interface SelState extends TextSelection {
  isWord: boolean;
}

export default function ReaderPage({ articleId }: { articleId: string }) {
  const articles = useAllArticles();
  const article = articles.find((a) => a.id === articleId);
  const {
    settings,
    annotations,
    vocab,
    progress,
    updateProgress,
    addReadingTime,
    addAnnotation,
    submitAnswers,
    resetAnswers,
    setAnswer,
    toggleMark,
    getAnswerState,
    markComplete,
    recordActivity,
    pushRecent,
    setLastRead,
    bookmarks,
    toggleBookmark,
    toast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<RailTab>('questions');
  const [mobileSheet, setMobileSheet] = useState<RailTab | null>(null);
  const [mobileMore, setMobileMore] = useState(false);
  const [wordPop, setWordPop] = useState<{ word: string; rect: DOMRect } | null>(null);
  const [sel, setSel] = useState<SelState | null>(null);
  const [noteDraft, setNoteDraft] = useState<{
    blockIndex: number;
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [noteAnnotation, setNoteAnnotation] = useState<Annotation | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisFallback, setAnalysisFallback] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [quizStartedAt, setQuizStartedAt] = useState<number | null>(null);

  const articleBodyRef = useRef<HTMLDivElement>(null);
  const lastSaveRef = useRef(0);
  const flashRef = useRef<number | null>(null);

  const answerState = article ? getAnswerState(article.id) : { answers: {}, marked: [], submitted: false };
  const articleAnns = useMemo(
    () => annotations.filter((a) => a.articleId === articleId),
    [annotations, articleId],
  );
  const vocabSet = useMemo(() => new Set(vocab.map((v) => v.word)), [vocab]);
  const neighbors = article ? getNeighbors(articles, article.id) : {};

  // Reset local UI when the article changes.
  useEffect(() => {
    setWordPop(null);
    setSel(null);
    setNoteDraft(null);
    setNoteAnnotation(null);
    setAnalysisText(null);
    setAnalysisFallback('');
    setShowTranslation(false);
    setQuizStartedAt(null);
    setMobileSheet(null);
    setMobileMore(false);
    if (article) {
      pushRecent(article.id);
      setLastRead(article.id);
      setActiveTab('questions');
      setScrollPct(progress[article.id]?.percent || 0);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  // Reading clock: count visible time and flush every ~15s.
  useEffect(() => {
    if (!article) return;
    let last = Date.now();
    let pending = 0;
    const tick = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible') {
        pending += now - last;
      }
      last = now;
      if (pending >= 15000) {
        addReadingTime(article.id, pending);
        pending = 0;
      }
    };
    const id = window.setInterval(tick, 5000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') last = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      if (document.visibilityState === 'visible') pending += Date.now() - last;
      if (pending > 0) addReadingTime(article.id, pending);
    };
  }, [article?.id, addReadingTime]);

  // Scroll progress.
  useEffect(() => {
    if (!article) return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      const el = articleBodyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const height = Math.max(1, el.offsetHeight);
      const seen = window.scrollY + window.innerHeight * 0.72 - top;
      const pct = Math.max(0, Math.min(100, Math.round((seen / height) * 100)));
      setScrollPct((prev) => (Math.abs(prev - pct) >= 1 ? pct : prev));
      const now = Date.now();
      if (now - lastSaveRef.current > 900) {
        lastSaveRef.current = now;
        updateProgress(article.id, pct, window.scrollY);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [article?.id, updateProgress]);

  // Dismiss popovers on outside click / escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.word-pop') || target.closest('.sel-toolbar')) return;
      setWordPop(null);
      if (!target.closest('.article-body')) {
        setSel(null);
        window.getSelection()?.removeAllRanges();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWordPop(null);
        setSel(null);
        setAnalysisText(null);
        setMobileMore(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleWordClick = useCallback(
    (raw: string, el: HTMLElement) => {
      const norm = normalizeWord(raw);
      if (!norm || (norm.length < 2 && norm !== 'i')) return;
      setSel(null);
      setWordPop({ word: norm, rect: el.getBoundingClientRect() });
      if (settings.autoSpeak) speakWord(norm);
    },
    [settings.autoSpeak],
  );

  const handleSelect = useCallback((s: TextSelection | null) => {
    if (!s) {
      setSel(null);
      return;
    }
    setWordPop(null);
    const clean = s.text.trim();
    setSel({ ...s, isWord: /^[A-Za-z][A-Za-z'’\-]*$/.test(clean) });
  }, []);

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSel(null);
  };

  const highlight = (color: HighlightColor) => {
    if (!article || !sel) return;
    addAnnotation({
      articleId: article.id,
      blockIndex: sel.blockIndex,
      start: sel.start,
      end: sel.end,
      text: sel.text.trim(),
      color,
      note: '',
    });
    toast('已高亮，可继续添加批注', 'success');
    clearSelection();
  };

  const openNote = () => {
    if (!sel) return;
    setNoteDraft({ blockIndex: sel.blockIndex, start: sel.start, end: sel.end, text: sel.text.trim() });
    clearSelection();
  };

  const copySelection = async () => {
    if (!sel) return;
    try {
      await navigator.clipboard.writeText(sel.text);
      toast('已复制选中内容', 'success');
    } catch {
      toast('复制失败', 'error');
    }
    clearSelection();
  };

  const addSelectedWord = () => {
    if (!sel) return;
    const w = normalizeWord(sel.text);
    if (!w) return;
    setWordPop({ word: w, rect: sel.rect });
    clearSelection();
  };

  const flashBlock = (index: number) => {
    const el = document.querySelector(`[data-block-index="${index}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flash');
    if (flashRef.current) window.clearTimeout(flashRef.current);
    flashRef.current = window.setTimeout(() => el.classList.remove('flash'), 1800);
  };

  const locateAnnotation = (ann: Annotation) => {
    flashBlock(ann.blockIndex);
    setActiveTab('notes');
  };

  const locateEvidence = (evidence: string) => {
    if (!article) return;
    const needle = evidence.replace(/[“”"']/g, '').toLowerCase().slice(0, 50);
    const idx = article.blocks.findIndex((b) => b.text.toLowerCase().replace(/[“”"']/g, '').includes(needle));
    if (idx >= 0) {
      flashBlock(idx);
      toast('已定位到原文依据');
    } else {
      toast('没有在正文中找到完全匹配的句子', 'error');
    }
  };

  const handleSelectAnswer = (qnum: number, letter: string) => {
    if (!article) return;
    if (!quizStartedAt) setQuizStartedAt(Date.now());
    setAnswer(article.id, qnum, letter);
    setActiveTab('questions');
  };

  const handleSubmit = (correct: number, timeMs: number) => {
    if (!article) return;
    submitAnswers(article.id, correct, timeMs);
    const answered = Object.keys(answerState.answers).length;
    recordActivity({ questions: answered, correct });
    toast('已提交，查看每道题的答案与解析', 'success');
  };

  const handleReset = () => {
    if (!article) return;
    resetAnswers(article.id);
    setQuizStartedAt(null);
  };

  if (!article) {
    return (
      <div className="page" style={{ padding: '100px 0', textAlign: 'center' }}>
        <BookOpen size={30} style={{ margin: '0 auto 14px', color: 'var(--muted)' }} />
        <h1 className="section-title">没有找到这篇文章</h1>
        <p className="section-sub" style={{ margin: '10px auto 24px' }}>
          它可能来自一次已删除的导入，回到文章库重新选择一篇吧。
        </p>
        <a className="btn primary" href={hrefFor('/library')}>
          返回文章库 <ArrowRight size={15} />
        </a>
      </div>
    );
  }

  const railProps = {
    article,
    activeTab,
    onTab: (t: RailTab) => setActiveTab(t),
    answerState,
    quizStartedAt,
    onSelect: handleSelectAnswer,
    onMark: (n: number) => toggleMark(article.id, n),
    onSubmit: handleSubmit,
    onReset: handleReset,
    onLocateEvidence: locateEvidence,
    onLocateAnnotation: locateAnnotation,
  };

  return (
    <div className="reader">
      <ReaderBar
        article={article}
        percent={scrollPct}
        hasPrev={!!neighbors.prev}
        hasNext={!!neighbors.next}
        onPrev={() => neighbors.prev && navigate(`/read/${neighbors.prev.id}`)}
        onNext={() => neighbors.next && navigate(`/read/${neighbors.next.id}`)}
        onTimer={() => setShowTimer(true)}
        onTranslate={() => setShowTranslation(true)}
        onSettings={() => setShowSettings(true)}
      />

      <div className="reader-layout">
        <article className="article-paper">
          <header className="article-head">
            <div className="article-kicker">
              <span className="article-cat">{article.catName}</span>
              <span className="divider-dot" />
              <span>Passage {String(article.number).padStart(2, '0')}</span>
              <span className="divider-dot" />
              <span className="article-diff">{article.difficulty}</span>
            </div>
            <h1 className="article-title">{article.title}</h1>
            {article.subtitle && <div className="article-subtitle">{article.subtitle}</div>}
            <div className="article-meta">
              <span>{article.wordCount} words</span>
              <span className="divider-dot" />
              <span>{article.questions.length} questions</span>
              <span className="divider-dot" />
              <span>约 {Math.max(3, Math.round(article.wordCount / 150))} 分钟</span>
              {article.tags?.slice(0, 2).map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </header>

          <div ref={articleBodyRef}>
            <ArticleBody
              article={article}
              annotations={articleAnns}
              vocabSet={vocabSet}
              highlightVocab={settings.highlightVocab}
              guardMode={settings.guardMode}
              showTranslation={settings.showTranslation}
              onWordClick={handleWordClick}
              onAnnotationClick={(ann) => {
                setNoteAnnotation(ann);
                setWordPop(null);
              }}
              onSelect={handleSelect}
            />
          </div>

          <footer className="article-foot">
            <div className="article-foot-note">
              <span className="eyebrow" style={{ fontSize: 10 }}>End of passage</span>
              <p>读完了？打开题目面板完成练习，或选中不理解的句子查看翻译与句法提示。</p>
            </div>
            <div className="article-foot-actions">
              <button
                className="btn small"
                onClick={() => {
                  markComplete(article.id);
                  toast('已标记为完成', 'success');
                }}
              >
                <CheckCircle2 size={14} /> 标记完成
              </button>
              {neighbors.next ? (
                <button
                  className="btn small primary"
                  onClick={() => neighbors.next && navigate(`/read/${neighbors.next.id}`)}
                >
                  下一篇 <ArrowRight size={14} />
                </button>
              ) : (
                <a className="btn small primary" href={hrefFor('/library')}>
                  回到文章库 <ArrowRight size={14} />
                </a>
              )}
            </div>
          </footer>
        </article>

        <aside className="rail-wrap">
          <ReaderRail {...railProps} />
        </aside>
      </div>

      <div className="reader-mobile-bar">
        <button
          className={!mobileSheet && !mobileMore ? 'active' : ''}
          onClick={() => {
            setMobileSheet(null);
            setMobileMore(false);
          }}
        >
          <BookOpen size={18} />
          <span>阅读</span>
        </button>
        <button
          className={mobileSheet === 'questions' ? 'active' : ''}
          onClick={() => {
            setMobileMore(false);
            setActiveTab('questions');
            setMobileSheet('questions');
          }}
        >
          <ListChecks size={18} />
          <span>题目</span>
        </button>
        <button
          className={mobileSheet === 'vocab' ? 'active' : ''}
          onClick={() => {
            setMobileMore(false);
            setActiveTab('vocab');
            setMobileSheet('vocab');
          }}
        >
          <BookMarked size={18} />
          <span>生词</span>
        </button>
        <button
          className={mobileMore ? 'active' : ''}
          onClick={() => {
            setMobileSheet(null);
            setMobileMore((v) => !v);
          }}
        >
          <MoreHorizontal size={18} />
          <span>更多</span>
        </button>
      </div>

      {mobileSheet && (
        <div className="mobile-sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setMobileSheet(null)}>
          <div className="mobile-sheet">
            <div className="mobile-sheet-grip" />
            <ReaderRail
              {...railProps}
              onTab={(t) => {
                setActiveTab(t);
                setMobileSheet(t);
              }}
            />
          </div>
        </div>
      )}

      {mobileMore && (
        <div className="mobile-sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setMobileMore(false)}>
          <div className="mobile-more-sheet">
            <div className="mobile-sheet-grip" />
            <div className="mobile-more-title">更多操作</div>
            <div className="mobile-more-grid">
              <button onClick={() => { setShowTimer(true); setMobileMore(false); }}>
                <TimerIcon size={18} /> 计时
              </button>
              <button onClick={() => { setShowTranslation(true); setMobileMore(false); }}>
                <Languages size={18} /> 全文翻译
              </button>
              <button onClick={() => { setShowSettings(true); setMobileMore(false); }}>
                <Settings2 size={18} /> 阅读排版
              </button>
              <button onClick={() => { markComplete(article.id); setMobileMore(false); toast('已标记完成', 'success'); }}>
                <CheckCircle2 size={18} /> 标记完成
              </button>
              <button
                onClick={() => {
                  const on = !bookmarks.includes(article.id);
                  toggleBookmark(article.id);
                  toast(on ? '已收藏这篇' : '已取消收藏', 'success');
                  setMobileMore(false);
                }}
              >
                {bookmarks.includes(article.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />} 收藏
              </button>
              <button onClick={() => { setMobileMore(false); neighbors.prev && navigate(`/read/${neighbors.prev.id}`); }} disabled={!neighbors.prev}>
                <ArrowLeft size={18} /> 上一篇
              </button>
              <button onClick={() => { setMobileMore(false); neighbors.next && navigate(`/read/${neighbors.next.id}`); }} disabled={!neighbors.next}>
                <ArrowRight size={18} /> 下一篇
              </button>
              <a href={hrefFor('/import')}>
                <BookOpen size={18} /> 导入文章
              </a>
              <a href={hrefFor('/settings')}>
                <Settings2 size={18} /> 数据设置
              </a>
            </div>
            <button className="mobile-more-close" onClick={() => setMobileMore(false)}>
              <X size={15} /> 关闭
            </button>
          </div>
        </div>
      )}

      <TimerWidget onOpen={() => setShowTimer(true)} />

      {wordPop && (
        <WordPopover
          key={wordPop.word}
          word={wordPop.word}
          anchor={wordPop.rect}
          article={article}
          onClose={() => setWordPop(null)}
        />
      )}

      {sel && (
        <SelectionToolbar
          selection={{ text: sel.text, rect: sel.rect, isWord: sel.isWord }}
          onHighlight={highlight}
          onNote={openNote}
          onTranslate={() => {
            setAnalysisFallback(article.blocks[sel.blockIndex]?.translation || '');
            setAnalysisText(sel.text.trim());
            clearSelection();
          }}
          onCopy={copySelection}
          onAddWord={addSelectedWord}
        />
      )}

      {analysisText && (
        <SelectionAnalysisModal
          text={analysisText}
          fallbackTranslation={analysisFallback}
          onClose={() => {
            setAnalysisText(null);
            setAnalysisFallback('');
          }}
        />
      )}

      {(noteDraft || noteAnnotation) && (
        <NoteModal
          article={article}
          annotation={noteAnnotation || undefined}
          draft={noteDraft || undefined}
          onClose={() => {
            setNoteDraft(null);
            setNoteAnnotation(null);
          }}
        />
      )}

      {showSettings && <ReaderSettings onClose={() => setShowSettings(false)} />}
      {showTimer && <TimerModal onClose={() => setShowTimer(false)} />}
      {showTranslation && (
        <TranslationDrawer article={article} onClose={() => setShowTranslation(false)} />
      )}
    </div>
  );
}
