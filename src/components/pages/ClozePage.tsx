'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookX,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Languages,
  LayoutGrid,
  Play,
  RotateCcw,
  StickyNote,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { hrefFor, navigate } from '@/lib/router';
import ChipScroller from '@/components/ChipScroller';
import WordText from '@/components/WordText';
import WordPopover from '@/components/reader/WordPopover';
import NoteModal from '@/components/reader/NoteModal';
import { SelectionAnalysisModal, SelectionToolbar } from '@/components/reader/SelectionTools';
import { normalizeWord } from '@/lib/utils';
import {
  clearClozeRecord,
  clozeStat,
  finishCloze,
  getClozeBook,
  loadCloze,
  saveClozePick,
} from '@/lib/cloze';
import type { Annotation, Article, ClozeBlank, ClozeData, ClozePassage, HighlightColor } from '@/lib/types';

const LETTERS = ['A', 'B', 'C', 'D'];
const BLANK_RE = /___(\d{1,2})___/g;

type Phase = 'loading' | 'list' | 'quiz' | 'result' | 'error';

export default function ClozePage({ passageId }: { passageId?: string }) {
  const { recordActivity, toast, annotations, addAnnotation, removeAnnotation } = useApp();
  const [data, setData] = useState<ClozeData | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [bank, setBank] = useState('全部');
  const [version, setVersion] = useState(0);
  const [paper, setPaper] = useState<ClozePassage | null>(null);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [showSheet, setShowSheet] = useState(false);
  const [wordPop, setWordPop] = useState<{ word: string; rect: DOMRect } | null>(null);
  const [active, setActive] = useState(1);
  // 手机端：点正文空格后用底部弹层答题；桌面端答在右侧固定面板
  const [answerSheet, setAnswerSheet] = useState(false);
  const [trOpen, setTrOpen] = useState(false);
  const [notePanel, setNotePanel] = useState(false);
  // 划线标注与划词翻译
  const [sel, setSel] = useState<{
    text: string;
    rect: DOMRect;
    blockIndex: number;
    start: number;
    end: number;
  } | null>(null);
  const [noteDraft, setNoteDraft] = useState<{
    blockIndex: number;
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [noteEdit, setNoteEdit] = useState<Annotation | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const paraRefs = useRef<Record<number, HTMLParagraphElement | null>>({});
  // 记录已经从路由进入过哪一篇，避免状态更新触发路由副作用把页面打回题库
  const enteredRef = useRef('');

  useEffect(() => {
    let alive = true;
    loadCloze()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setPhase('list');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : '完型题库加载失败');
        setPhase('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  const book = useMemo(() => {
    void version;
    return getClozeBook();
  }, [version]);

  const passages = data?.passages || [];
  const banks = useMemo(() => ['全部', ...(data?.banks.map((b) => b.name) || [])], [data]);

  const shown = useMemo(
    () => (bank === '全部' ? passages : passages.filter((p) => p.bank === bank)),
    [passages, bank],
  );

  const summary = useMemo(() => {
    let done = 0;
    let answered = 0;
    let correct = 0;
    for (const p of passages) {
      const s = clozeStat(p, book[p.id]);
      if (s.done) done += 1;
      answered += s.answered;
      correct += s.correct;
    }
    return { done, answered, correct, percent: answered ? Math.round((correct / answered) * 100) : 0 };
  }, [passages, book]);

  // 打开某一篇：带上次作答进入
  const openPassage = useCallback((p: ClozePassage) => {
    const rec = getClozeBook()[p.id];
    enteredRef.current = p.id;
    setPaper(p);
    setPicks(rec?.picks || {});
    setActive(nextUnanswered(p, rec?.picks || {}));
    setPhase('quiz');
    setShowSheet(false);
    setAnswerSheet(false);
    setTrOpen(false);
    setNotePanel(false);
    setWordPop(null);
    navigate(`/cloze/${p.id}`);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // 路由变化时同步：直接访问 #/cloze/xxx 也能进入；回到 #/cloze 则回题库
  useEffect(() => {
    if (!data) return;
    if (!passageId) {
      enteredRef.current = '';
      setPhase('list');
      return;
    }
    if (enteredRef.current === passageId) return;
    const target = data.passages.find((p) => p.id === passageId);
    if (!target) {
      setPhase('list');
      return;
    }
    enteredRef.current = target.id;
    const saved = getClozeBook()[target.id]?.picks || {};
    setPaper(target);
    setPicks(saved);
    setActive(nextUnanswered(target, saved));
    setPhase('quiz');
  }, [passageId, data]);

  const handlePick = useCallback(
    (blank: ClozeBlank, letter: string) => {
      if (!paper) return;
      if (picks[blank.num]) return;
      setPicks((prev) => ({ ...prev, [blank.num]: letter }));
      saveClozePick(paper.id, blank.num, letter);
      const ok = letter === blank.answer;
      recordActivity({ questions: 1, correct: ok ? 1 : 0 });
      setVersion((v) => v + 1);
    },
    [paper, picks, recordActivity],
  );

  // 点正文空格：桌面端切到右侧面板；手机端拉起底部答题弹层
  const focusBlank = useCallback((num: number) => {
    setActive(num);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 980px)').matches) {
      setAnswerSheet(true);
    }
  }, []);

  const stepBlank = useCallback(
    (delta: number) => {
      if (!paper) return;
      const i = paper.blanks.findIndex((b) => b.num === active);
      const next = paper.blanks[Math.min(paper.blanks.length - 1, Math.max(0, i + delta))];
      if (next) setActive(next.num);
    },
    [paper, active],
  );

  const finish = useCallback(() => {
    if (!paper) return;
    finishCloze(paper.id);
    setVersion((v) => v + 1);
    setAnswerSheet(false);
    setPhase('result');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [paper]);

  const reset = useCallback(() => {
    if (!paper) return;
    clearClozeRecord(paper.id);
    setPicks({});
    setActive(1);
    setVersion((v) => v + 1);
    setPhase('quiz');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [paper]);

  const handleWord = useCallback((raw: string, el: HTMLElement) => {
    const norm = normalizeWord(raw);
    if (!norm || (norm.length < 2 && norm !== 'i')) return;
    setWordPop({ word: norm, rect: el.getBoundingClientRect() });
  }, []);

  const clozeKey = paper ? `cloze:${paper.id}` : '';
  const anns = useMemo(
    () => (clozeKey ? annotations.filter((a) => a.articleId === clozeKey) : []),
    [annotations, clozeKey],
  );

  // 选区落在哪个正文段落、对应块内偏移多少（空格按 ___N___ 的字符宽度计，答案变了偏移也不变）
  const captureSelection = useCallback(() => {
    const s = window.getSelection();
    if (!s || s.isCollapsed || s.rangeCount === 0) {
      setSel(null);
      return;
    }
    const range = s.getRangeAt(0);
    // 选区可能跨越多个 span / 甚至以段落容器为 commonAncestor，直接找包含起点的段落
    const host = Array.from(document.querySelectorAll<HTMLElement>('.cloze-para')).find((el) =>
      el.contains(range.startContainer),
    );
    if (!host) {
      setSel(null);
      return;
    }
    const blockIndex = Number(host.dataset.block);
    if (Number.isNaN(blockIndex) || !paper) return;
    const blockText = paper.blocks[blockIndex] || '';
    const raw = s.toString();
    const lead = raw.length - raw.trimStart().length;
    const trail = raw.length - raw.trimEnd().length;
    const start = Math.max(
      0,
      Math.min(offsetInBlock(host, range.startContainer, range.startOffset) + lead, blockText.length),
    );
    const end = Math.max(
      start,
      Math.min(offsetInBlock(host, range.endContainer, range.endOffset) - trail, blockText.length),
    );
    if (end <= start) {
      setSel(null);
      return;
    }
    // 用正文原文取选区文本，空格按正确答案补全（和全文翻译一致，避免把「4」「5」这种题号带进译文）
    const text = blockText
      .slice(start, end)
      .replace(/___(\d{1,2})___/g, (_, d) => {
        const blank = paper.blanks.find((b) => b.num === Number(d));
        return blank ? blank.options[LETTERS.indexOf(blank.answer)] || '______' : '______';
      })
      .replace(/\s+/g, ' ')
      .trim();
    if (!text || text.length < 2 || text.length > 2000) {
      setSel(null);
      return;
    }
    setWordPop(null);
    setSel({ text, rect: range.getBoundingClientRect(), blockIndex, start, end });
  }, [paper]);

  const addHighlight = useCallback(
    (color: HighlightColor) => {
      if (!sel || !paper) return;
      addAnnotation({
        articleId: `cloze:${paper.id}`,
        blockIndex: sel.blockIndex,
        start: sel.start,
        end: sel.end,
        text: sel.text,
        color,
        note: '',
      });
      toast('已添加标注', 'success');
      window.getSelection()?.removeAllRanges();
      setSel(null);
    },
    [sel, paper, addAnnotation, toast],
  );

  // 点别处 / Esc 收起划词工具条
  useEffect(() => {
    if (!sel) return;
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.sel-toolbar')) return;
      setSel(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSel(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [sel]);

  // 底部答题弹层：锁背景滚动，Esc 关闭
  useEffect(() => {
    if (!answerSheet || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAnswerSheet(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [answerSheet]);

  if (phase === 'loading') {
    return (
      <div className="page cloze-page">
        <div className="practice-loading">
          <BookOpen size={22} />
          <span>正在展开完型题册…</span>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="page cloze-page">
        <div className="practice-loading">
          <BookX size={22} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ---------- 作答中 ----------
  if (phase === 'quiz' && paper) {
    const stat = clozeStat(paper, { picks, updatedAt: Date.now() });
    const allDone = stat.answered === stat.total;
    const remain = stat.total - stat.answered;
    const activeBlank = paper.blanks.find((b) => b.num === active) || paper.blanks[0];
    const activeIndex = paper.blanks.findIndex((b) => b.num === activeBlank.num);

    const blankCard = (b: ClozeBlank, index: number) => {
      const mine = picks[b.num];
      const revealed = Boolean(mine);
      const right = revealed && mine === b.answer;
      return (
        <>
          <div className="cloze-q-head">
            <span className="cloze-q-num">{b.num}</span>
            <span className="cloze-q-state">
              {revealed ? (
                right ? (
                  <>
                    <CheckCircle2 size={14} /> 正确
                  </>
                ) : (
                  <>
                    <XCircle size={14} /> 选错，正确 {b.answer}
                  </>
                )
              ) : (
                `第 ${index + 1} 空 · 待作答`
              )}
            </span>
          </div>
          <div className="cloze-options">
            {b.options.map((opt, oi) => {
              const letter = LETTERS[oi];
              const isRight = revealed && letter === b.answer;
              const isMine = revealed && mine === letter;
              return (
                <button
                  key={letter}
                  className={`cloze-option ${isRight ? 'reveal-right' : ''} ${isMine && !isRight ? 'reveal-wrong' : ''} ${revealed && !isRight && !isMine ? 'dimmed' : ''}`}
                  onClick={() => handlePick(b, letter)}
                  disabled={revealed}
                >
                  <span className="cloze-option-letter">{letter}</span>
                  <span>{opt || '（选项缺失）'}</span>
                </button>
              );
            })}
          </div>
          {revealed && (b.note || b.evidence) && (
            <div className={`cloze-note ${right ? 'right' : 'wrong'}`}>
              {b.note && <p>{b.note}</p>}
              {b.evidence && (
                <p className="cloze-evidence">
                  原句：{b.evidence.replace(`___${b.num}___`, `【${b.answer.toLowerCase()}】`)}
                </p>
              )}
            </div>
          )}
        </>
      );
    };

    return (
      <div className="page cloze-page cloze-quiz">
        <div className="practice-quiz-top">
          <button
            className="practice-back"
            onClick={() => {
              enteredRef.current = '';
              setPhase('list');
              navigate('/cloze');
            }}
          >
            <ArrowLeft size={16} /> 题库
          </button>
          <div className="practice-progress">
            <span className="practice-progress-text">
              {paper.bank} · {paper.label} · 已答 {stat.answered} / {stat.total} · 对 {stat.correct}
            </span>
            <div className="practice-progress-bar">
              <span style={{ width: `${(stat.answered / stat.total) * 100}%` }} />
            </div>
          </div>
          <button className="practice-mark" onClick={() => setShowSheet(true)}>
            <LayoutGrid size={15} /> 答题卡
          </button>
          <button
            className="practice-mark"
            onClick={finish}
            title={allDone ? '查看本篇结果' : `还剩 ${remain} 空未答`}
          >
            <CheckCircle2 size={15} /> 交卷
          </button>
        </div>

        <div className="cloze-quiz-grid">
          <div className="cloze-main">
            <div className="cloze-paper">
              <div className="cloze-paper-head">
                <p className="cloze-paper-kicker">
                  <span className="cloze-badge">{paper.bank}</span>
                  {paper.label} · {paper.blanks.length} 空 · {paper.wordCount} 词
                </p>
                <h1 className="cloze-paper-title">{paper.title}</h1>
                {paper.zh && <p className="cloze-paper-zh">{paper.zh}</p>}
                <div className="cloze-paper-hint-row">
                  <p className="cloze-paper-hint">
                    先通读全文，再点文中的空格作答（<span className="cloze-hint-mobile">选项从底部弹出</span>
                    <span className="cloze-hint-desktop">选项在右侧面板</span>）；选中文字可高亮、批注或翻译。
                  </p>
                  <div className="cloze-paper-tools">
                    <button
                      className="cloze-tr-open"
                      onClick={() => setNotePanel(true)}
                      title="查看本篇的高亮与批注"
                    >
                      <StickyNote size={14} /> 批注{anns.length ? `（${anns.length}）` : ''}
                    </button>
                    <button
                      className="cloze-tr-open"
                      onClick={() => setTrOpen(true)}
                      title="查看按正确答案补全的全文翻译"
                    >
                      <Languages size={14} /> 全文翻译
                    </button>
                  </div>
                </div>
              </div>
              <div
                className="cloze-text"
                onMouseUp={() => window.setTimeout(captureSelection, 0)}
                onTouchEnd={() => window.setTimeout(captureSelection, 60)}
              >
                {paper.blocks.map((block, bi) => (
                  <p
                    key={bi}
                    className="cloze-para"
                    data-block={bi}
                    ref={(el) => {
                      paraRefs.current[bi] = el;
                    }}
                  >
                    {renderBlock(
                      block,
                      picks,
                      paper.blanks,
                      (num) => focusBlank(num),
                      handleWord,
                      active,
                      anns.filter((a) => a.blockIndex === bi),
                      (ann, el) => setNoteEdit(ann),
                    )}
                  </p>
                ))}
              </div>
            </div>

            <div className="cloze-endbar">
              <span>
                已答 {stat.answered} / {stat.total}
                {allDone ? ' · 全部完成' : ` · 还剩 ${remain} 空`}
              </span>
              {allDone ? (
                <button className="btn primary" onClick={finish}>
                  查看结果 <ArrowRight size={15} />
                </button>
              ) : (
                <button className="btn ghost" onClick={() => focusBlank(nextUnanswered(paper, picks))}>
                  跳到下一空 <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>

          {/* 桌面端：右侧固定答题面板 */}
          <aside className="cloze-side" aria-label="答题面板">
            <div className="cloze-side-head">
              <p className="cloze-side-title">答题</p>
              <span className="cloze-side-count">
                {activeIndex + 1} / {paper.blanks.length} 空
              </span>
            </div>

            <div className={`cloze-q cloze-side-card ${picks[activeBlank.num] ? (picks[activeBlank.num] === activeBlank.answer ? 'right' : 'wrong') : ''}`}>
              {blankCard(activeBlank, activeIndex)}
            </div>

            <div className="cloze-side-nav">
              <button className="btn ghost" disabled={activeIndex === 0} onClick={() => stepBlank(-1)}>
                <ChevronLeft size={15} /> 上一空
              </button>
              <button
                className="btn primary"
                disabled={activeIndex >= paper.blanks.length - 1}
                onClick={() => stepBlank(1)}
              >
                下一空 <ChevronRight size={15} />
              </button>
            </div>

            <div className="cloze-side-grid" aria-label="空号一览">
              {paper.blanks.map((b) => {
                const mine = picks[b.num];
                const ok = mine === b.answer;
                return (
                  <button
                    key={b.num}
                    className={`cloze-cell ${active === b.num ? 'cur' : ''} ${mine ? (ok ? 'ok' : 'bad') : ''}`}
                    onClick={() => setActive(b.num)}
                    title={`第 ${b.num} 空${mine ? '：已选 ' + mine : ''}`}
                  >
                    {b.num}
                  </button>
                );
              })}
            </div>

            <p className="cloze-side-tip">绿色对 · 红色错 · 金框当前；点空号可切换
            </p>
          </aside>
        </div>

        {/* 移动端：底部进度条 + 答题弹层 */}
        <div className="cloze-mobile-bar">
          <span>
            已答 {stat.answered} / {stat.total} · 对 {stat.correct}
          </span>
          {allDone ? (
            <button className="btn primary" onClick={finish}>
              查看结果
            </button>
          ) : (
            <button className="btn primary" onClick={() => focusBlank(nextUnanswered(paper, picks))}>
              继续作答
            </button>
          )}
        </div>

        {answerSheet && (
          <div className="cloze-sheet-mask" onClick={() => setAnswerSheet(false)}>
            <div
              className="cloze-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={`第 ${activeBlank.num} 空`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cloze-sheet-grip" />
              <div className="cloze-sheet-head">
                <span className="cloze-sheet-kicker">
                  第 {activeBlank.num} 空 · {activeIndex + 1} / {paper.blanks.length}
                </span>
                <button className="cloze-sheet-close" onClick={() => setAnswerSheet(false)} aria-label="收起">
                  <X size={16} />
                </button>
              </div>
              <div className={`cloze-q cloze-sheet-card ${picks[activeBlank.num] ? (picks[activeBlank.num] === activeBlank.answer ? 'right' : 'wrong') : ''}`}>
                {blankCard(activeBlank, activeIndex)}
              </div>
              <div className="cloze-sheet-nav">
                <button className="btn ghost" disabled={activeIndex === 0} onClick={() => stepBlank(-1)}>
                  <ChevronLeft size={15} /> 上一空
                </button>
                {activeIndex < paper.blanks.length - 1 ? (
                  <button className="btn primary" onClick={() => stepBlank(1)}>
                    下一空 <ChevronRight size={15} />
                  </button>
                ) : (
                  <button className="btn primary" onClick={finish}>
                    查看结果
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showSheet && (
          <div className="practice-sheet-mask" onClick={() => setShowSheet(false)}>
            <div
              className="practice-sheet-panel"
              role="dialog"
              aria-modal="true"
              aria-label="答题卡"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="practice-sheet-grip" />
              <div className="practice-sheet-head">
                <p className="practice-sheet-title">答题卡（{paper.blanks.length} 空）</p>
                <span className="practice-sheet-legend">绿 对 · 红 错 · 金框 当前</span>
              </div>
              <div className="practice-sheet-grid">
                {paper.blanks.map((b) => {
                  const mine = picks[b.num];
                  const ok = mine === b.answer;
                  return (
                    <button
                      key={b.num}
                      className={`practice-sheet-cell ${active === b.num ? 'cur' : ''} ${mine ? (ok ? 'ok' : 'bad') : ''}`}
                      onClick={() => {
                        setActive(b.num);
                        setShowSheet(false);
                        if (window.matchMedia('(max-width: 980px)').matches) setAnswerSheet(true);
                      }}
                    >
                      {b.num}
                    </button>
                  );
                })}
              </div>
              <button className="btn ghost practice-sheet-close" onClick={() => setShowSheet(false)}>
                收起答题卡
              </button>
            </div>
          </div>
        )}

        {notePanel && (
          <div className="cloze-tr-mask" onClick={() => setNotePanel(false)}>
            <aside
              className="cloze-tr-panel"
              role="dialog"
              aria-modal="true"
              aria-label="批注"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cloze-tr-head">
                <div>
                  <p className="cloze-tr-title">批注（{anns.length}）</p>
                  <p className="cloze-tr-sub">点条目标题旁的圆点可改颜色、改笔记或删除；点「定位」跳回原文</p>
                </div>
                <button className="cloze-tr-close" onClick={() => setNotePanel(false)} aria-label="关闭">
                  <X size={16} />
                </button>
              </div>
              <div className="cloze-tr-body">
                {anns.length === 0 ? (
                  <div className="cloze-note-empty">
                    <StickyNote size={22} />
                    <p>还没有批注。选中正文里的文字，点工具条上的高亮色或「批注」即可。</p>
                  </div>
                ) : (
                  <div className="cloze-note-list">
                    {[...anns]
                      .sort((a, b) => a.blockIndex - b.blockIndex || a.start - b.start)
                      .map((a) => (
                        <div key={a.id} className="cloze-note-item">
                          <span className={`cloze-note-dot c-${a.color}`} aria-hidden="true" />
                          <div className="cloze-note-main">
                            <p className="cloze-note-quote">“{a.text}”</p>
                            {a.note && <p className="cloze-note-text">{a.note}</p>}
                            <p className="cloze-note-meta">
                              第 {a.blockIndex + 1} 段 ·{' '}
                              {new Date(a.createdAt).toLocaleString('zh-CN', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <div className="cloze-note-actions">
                              <button
                                className="btn small ghost"
                                onClick={() => {
                                  setNotePanel(false);
                                  setNoteEdit(a);
                                }}
                              >
                                编辑
                              </button>
                              <button
                                className="btn small ghost"
                                onClick={() => {
                                  const el = document.querySelector<HTMLElement>(`[data-ann="${a.id}"]`);
                                  setNotePanel(false);
                                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                              >
                                定位
                              </button>
                              <button
                                className="btn small ghost danger-text"
                                onClick={() => {
                                  removeAnnotation(a.id);
                                  toast('批注已删除');
                                }}
                              >
                                <Trash2 size={13} /> 删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {trOpen && (
          <div className="cloze-tr-mask" onClick={() => setTrOpen(false)}>
            <aside
              className="cloze-tr-panel"
              role="dialog"
              aria-modal="true"
              aria-label="全文翻译"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cloze-tr-head">
                <div>
                  <p className="cloze-tr-title">全文翻译</p>
                  <p className="cloze-tr-sub">空格已按正确答案补全，英文行里标绿的就是所填词</p>
                </div>
                <button className="cloze-tr-close" onClick={() => setTrOpen(false)} aria-label="关闭">
                  <X size={16} />
                </button>
              </div>
              <div className="cloze-tr-body">
                {paper.blocks.map((block, bi) => (
                  <div key={bi} className="cloze-tr-block">
                    <p className="cloze-tr-en">{renderTranslated(block, paper.blanks)}</p>
                    <p className="cloze-tr-zh">
                      {(paper.translations && paper.translations[bi]) || '这一段译文待补。'}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}

        {sel && (
          <SelectionToolbar
            selection={{ text: sel.text, rect: sel.rect, isWord: false }}
            onHighlight={addHighlight}
            onNote={() => {
              setNoteDraft({ blockIndex: sel.blockIndex, start: sel.start, end: sel.end, text: sel.text });
              setSel(null);
              window.getSelection()?.removeAllRanges();
            }}
            onTranslate={() => {
              setAnalysisText(sel.text);
              setSel(null);
              window.getSelection()?.removeAllRanges();
            }}
            onCopy={async () => {
              try {
                await navigator.clipboard.writeText(sel.text);
                toast('已复制选中内容', 'success');
              } catch {
                toast('复制失败，请手动选择', 'error');
              }
              setSel(null);
              window.getSelection()?.removeAllRanges();
            }}
            onAddWord={() => undefined}
          />
        )}

        {noteDraft && (
          <NoteModal
            article={{ id: clozeKey } as Article}
            draft={noteDraft}
            onClose={() => setNoteDraft(null)}
          />
        )}

        {noteEdit && (
          <NoteModal
            article={{ id: clozeKey } as Article}
            annotation={noteEdit}
            onClose={() => setNoteEdit(null)}
          />
        )}

        {analysisText && (
          <SelectionAnalysisModal text={analysisText} onClose={() => setAnalysisText(null)} />
        )}

        {wordPop && (
          <WordPopover
            key={wordPop.word}
            word={wordPop.word}
            anchor={wordPop.rect}
            onClose={() => setWordPop(null)}
          />
        )}
      </div>
    );
  }

  // ---------- 结果 ----------
  if (phase === 'result' && paper) {
    const stat = clozeStat(paper, { picks, updatedAt: Date.now() });
    const wrongList = paper.blanks.filter((b) => picks[b.num] && picks[b.num] !== b.answer);
    const emptyList = paper.blanks.filter((b) => !picks[b.num]);
    return (
      <div className="page cloze-page">
        <div className="practice-score-card">
          <p className="practice-score-label">
            {paper.bank} · {paper.label} · 本篇结果
          </p>
          <p className="practice-score">
            答对 <b>{stat.correct}</b> / {stat.answered}
            <span className="practice-score-pct">
              正确率 {stat.percent}% · 共 {stat.total} 空
              {emptyList.length ? ` · 未答 ${emptyList.length} 空` : ''}
            </span>
          </p>
          <div className="practice-actions">
            <button className="btn primary" onClick={reset}>
              <RotateCcw size={15} /> 重做本篇
            </button>
            <a className="btn" href={hrefFor('/cloze')}>
              返回题库
            </a>
            {nextPassage(data, paper) && (
              <a className="btn ghost" href={hrefFor(`/cloze/${nextPassage(data, paper)!.id}`)}>
                下一篇 <ChevronRight size={15} />
              </a>
            )}
          </div>
        </div>

        {wrongList.length > 0 ? (
          <div className="practice-review-list result">
            {wrongList.map((b) => (
              <div key={b.num} className="practice-review bad">
                <div className="practice-review-head">
                  <XCircle size={17} />
                  <span className="practice-review-num">第 {b.num} 空</span>
                </div>
                {b.evidence && (
                  <p className="cloze-evidence">
                    {b.evidence.replace(`___${b.num}___`, `【${b.answer.toLowerCase()}】`)}
                  </p>
                )}
                <div className="practice-review-answers">
                  <span className="wrong-mine">
                    你的答案：{picks[b.num]}. {(b.options[LETTERS.indexOf(picks[b.num])] || '').trim()}
                  </span>
                  <span className="right">
                    正确答案：{b.answer}. {(b.options[LETTERS.indexOf(b.answer)] || '').trim()}
                  </span>
                </div>
                {b.note && <p className="practice-explanation">{b.note}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="practice-empty">
            <CheckCircle2 size={26} />
            <p>本篇全对，换一篇继续。</p>
          </div>
        )}
      </div>
    );
  }

  // ---------- 题库 ----------
  return (
    <div className="page cloze-page">
      <div className="practice-head">
        <div>
          <span className="eyebrow">Cloze</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            完型填空
          </h1>
          <p className="section-sub">
            共 {data.total} 篇 / {data.blankTotal} 空，基础与进阶两档。先通读全文再逐空选词，选完立刻判定对错并给出原句依据；也可以切到背题模式，直接看答案逐空自评。
          </p>
        </div>
        <div className="practice-head-actions">
          <a className="btn ghost" href={hrefFor('/practice')}>
            <Play size={15} /> 单选练习
          </a>
          <a className="btn ghost" href={hrefFor('/grammar')}>
            <BookOpen size={15} /> 语法速查
          </a>
        </div>
      </div>

      <div className="cloze-summary">
        <div>
          <b>{summary.done}</b>
          <span>已做完</span>
        </div>
        <div>
          <b>{summary.answered}</b>
          <span>已答空数</span>
        </div>
        <div>
          <b>{summary.percent}%</b>
          <span>累计正确率</span>
        </div>
        <div>
          <b>{data.blankTotal}</b>
          <span>题库总空数</span>
        </div>
      </div>

      <div className="practice-block" style={{ marginTop: 8 }}>
        <ChipScroller className="practice-chips" activeKey={bank}>
          {banks.map((b) => {
            const list = b === '全部' ? passages : passages.filter((p) => p.bank === b);
            const blanks = list.reduce((n, p) => n + p.blanks.length, 0);
            return (
              <button
                key={b}
                className={`practice-chip ${bank === b ? 'on' : ''}`}
                data-active={bank === b ? 'true' : undefined}
                onClick={() => setBank(b)}
              >
                {b} <em>{list.length} 篇 / {blanks} 空</em>
              </button>
            );
          })}
        </ChipScroller>
      </div>

      <div className="cloze-grid">
        {shown.map((p) => {
          const stat = clozeStat(p, book[p.id]);
          const started = stat.answered > 0;
          return (
            <button key={p.id} className="cloze-card" onClick={() => openPassage(p)}>
              <div className="cloze-card-top">
                <span className="cloze-card-no">{String(p.no).padStart(2, '0')}</span>
                <span className="cloze-badge">{p.bank}</span>
                <span className="cloze-card-meta">
                  {p.blanks.length} 空 · {p.wordCount} 词
                </span>
              </div>
              <h3>{p.title}</h3>
              {p.zh && <p className="cloze-card-zh">{p.zh}</p>}
              <div className="cloze-card-foot">
                <div className="progress-bar" style={{ flex: 1 }}>
                  <i style={{ width: `${(stat.answered / stat.total) * 100}%` }} />
                </div>
                <span className={`cloze-card-state ${stat.done ? 'done' : started ? 'doing' : ''}`}>
                  {stat.done ? `已完成 · ${stat.percent}%` : started ? `已答 ${stat.answered} / ${stat.total}` : '未开始'}
                </span>
                <ChevronRight size={15} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="cloze-tip">
        <RotateCcw size={14} />
        <span>
          作答进度存在本机浏览器里，退出后再次点开同一篇会从上次的答案继续；题目与解析随题库一起更新。
        </span>
      </div>
    </div>
  );
}

// 把一段正文拆成「英文文本 + 空格胶囊」，文本里的批注按块内偏移切段渲染
function renderBlock(
  block: string,
  picks: Record<number, string>,
  blanks: ClozeBlank[],
  onJump: (num: number) => void,
  onWord: (word: string, el: HTMLElement) => void,
  active: number,
  anns: Annotation[],
  onAnnClick: (ann: Annotation, el: HTMLElement) => void,
) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let segKey = 0;
  BLANK_RE.lastIndex = 0;

  const pushText = (from: number, to: number) => {
    if (to <= from) return;
    const text = block.slice(from, to);
    for (const run of splitByAnnotations(text, from, anns)) {
      if (run.ann) {
        nodes.push(
          <mark
            key={`a${key++}`}
            data-ann={run.ann.id}
            className={`ann ann-${run.ann.color}`}
            title={run.ann.note || '点击圆点编辑批注'}
            onClickCapture={(e) => {
              const target = e.target as HTMLElement;
              // 点在词上交给词典；点在高亮本身或小圆点上才进入批注编辑
              if (!target.closest('.ann-dot') && target.closest('.w')) return;
              e.stopPropagation();
              onAnnClick(run.ann!, e.currentTarget);
            }}
          >
            <WordText text={run.text} onWordClick={onWord} />
            {run.showDot ? <sup className="ann-dot" aria-hidden="true" /> : null}
          </mark>,
        );
      } else {
        nodes.push(<WordText key={`t${segKey++}`} text={run.text} onWordClick={onWord} />);
      }
    }
  };

  for (const m of block.matchAll(BLANK_RE)) {
    const start = m.index ?? 0;
    const num = Number(m[1]);
    pushText(last, start);
    const blank = blanks.find((b) => b.num === num);
    const mine = picks[num];
    const state = !mine ? 'empty' : mine === blank?.answer ? 'right' : 'wrong';
    nodes.push(
      <button
        key={`b${key++}`}
        className={`cloze-inline ${state} ${active === num ? 'cur' : ''}`}
        data-num={num}
        onClick={(e) => {
          e.stopPropagation();
          onJump(num);
        }}
        title={mine ? `第 ${num} 空：已选 ${mine}` : `第 ${num} 空，点此作答`}
      >
        {mine || num}
      </button>,
    );
    last = start + m[0].length;
  }
  pushText(last, block.length);
  return nodes;
}

// 把一段纯文本按批注切成 [{text, ann?}]；偏移以整段 block 为坐标系
function splitByAnnotations(text: string, base: number, anns: Annotation[]) {
  const runs: Array<{ text: string; ann?: Annotation; showDot?: boolean }> = [];
  const hits = anns
    .map((a) => ({ ann: a, s: Math.max(a.start, base), e: Math.min(a.end, base + text.length) }))
    .filter((h) => h.e > h.s)
    .sort((a, b) => a.s - b.s);
  let pos = base;
  for (const hit of hits) {
    if (hit.s > pos) runs.push({ text: text.slice(pos - base, hit.s - base) });
    runs.push({
      text: text.slice(hit.s - base, hit.e - base),
      ann: hit.ann,
      // 一条标注会被空格胶囊切成多段，只在这条标注真正的结尾画小圆点
      showDot: hit.e === hit.ann.end,
    });
    pos = hit.e;
  }
  if (pos < base + text.length) runs.push({ text: text.slice(pos - base) });
  return runs.length ? runs : [{ text }];
}

// 空格胶囊在正文里占 ___N___ 这么长，偏移计算统一按这个宽度算
function chipWidth(el: HTMLElement): number {
  const num = Number(el.dataset.num || 0);
  return num ? `___${num}___`.length : (el.textContent || '').length;
}

function nodeWidth(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) return (node as Text).length;
  if (node.nodeType !== Node.ELEMENT_NODE) return 0;
  const el = node as HTMLElement;
  if (el.classList.contains('cloze-inline')) return chipWidth(el);
  return Array.from(el.childNodes).reduce((sum, child) => sum + nodeWidth(child), 0);
}

// 把 DOM 选区端点换算成块内字符偏移
function offsetInBlock(root: HTMLElement, node: Node, offset: number): number {
  let acc = 0;
  let found = -1;

  const walk = (n: Node): void => {
    if (found >= 0) return;
    if (n === node) {
      if (n.nodeType === Node.TEXT_NODE) {
        found = acc + offset;
      } else {
        let i = 0;
        for (const child of Array.from((n as HTMLElement).childNodes ?? [])) {
          if (i >= offset) break;
          i += 1;
          acc += nodeWidth(child);
        }
        found = acc;
      }
      return;
    }
    if (n.nodeType === Node.TEXT_NODE) {
      acc += (n as Text).length;
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const el = n as HTMLElement;
    if (el.classList.contains('cloze-inline')) {
      acc += chipWidth(el);
      return;
    }
    for (const child of Array.from(el.childNodes)) walk(child);
  };

  walk(root);
  return found >= 0 ? found : acc;
}

// 译文抽屉里的英文行：空格用正确答案补全并标绿
function renderTranslated(block: string, blanks: ClozeBlank[]) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  BLANK_RE.lastIndex = 0;
  for (const m of block.matchAll(BLANK_RE)) {
    const start = m.index ?? 0;
    const num = Number(m[1]);
    if (start > last) nodes.push(block.slice(last, start));
    const blank = blanks.find((b) => b.num === num);
    const word = blank ? blank.options[LETTERS.indexOf(blank.answer)] || '' : '';
    nodes.push(
      <b key={`a${key++}`} className="cloze-tr-word">
        {word}
      </b>,
    );
    last = start + m[0].length;
  }
  if (last < block.length) nodes.push(block.slice(last));
  return nodes;
}

function nextUnanswered(p: ClozePassage, picks: Record<number, string>): number {
  const found = p.blanks.find((b) => !picks[b.num]);
  return found ? found.num : p.blanks[0]?.num || 1;
}

function nextPassage(data: ClozeData, p: ClozePassage): ClozePassage | null {
  const i = data.passages.findIndex((x) => x.id === p.id);
  return i >= 0 && i + 1 < data.passages.length ? data.passages[i + 1] : null;
}
