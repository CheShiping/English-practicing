'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookX,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  Play,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { hrefFor, navigate } from '@/lib/router';
import ChipScroller from '@/components/ChipScroller';
import WordText from '@/components/WordText';
import WordPopover from '@/components/reader/WordPopover';
import { normalizeWord } from '@/lib/utils';
import {
  clearClozeRecord,
  clozeStat,
  finishCloze,
  getClozeBook,
  loadCloze,
  saveClozePick,
} from '@/lib/cloze';
import type { ClozeBlank, ClozeData, ClozePassage } from '@/lib/types';

const LETTERS = ['A', 'B', 'C', 'D'];
const BLANK_RE = /___(\d{1,2})___/g;

type Phase = 'loading' | 'list' | 'quiz' | 'result' | 'error';

export default function ClozePage({ passageId }: { passageId?: string }) {
  const { recordActivity, toast } = useApp();
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
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
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
  const banks = useMemo(() => {
    const list = ['全部', ...(data?.banks.map((b) => b.name) || [])];
    return list;
  }, [data]);

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
    setActive(1);
    setPhase('quiz');
    setShowSheet(false);
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
    setPaper(target);
    setPicks(getClozeBook()[target.id]?.picks || {});
    setActive(1);
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

  const jumpTo = useCallback((num: number) => {
    setActive(num);
    setShowSheet(false);
    const el = cardRefs.current[num];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const finish = useCallback(() => {
    if (!paper) return;
    finishCloze(paper.id);
    setVersion((v) => v + 1);
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

        <div className="cloze-paper">
          <div className="cloze-paper-head">
            <p className="cloze-paper-kicker">
              <span className="cloze-badge">{paper.bank}</span>
              {paper.label} · {paper.blanks.length} 空 · {paper.wordCount} 词
            </p>
            <h1 className="cloze-paper-title">{paper.title}</h1>
            {paper.zh && <p className="cloze-paper-zh">{paper.zh}</p>}
            <p className="cloze-paper-hint">先通读全文，再逐空选词；点文中空格可直接跳到对应小题。</p>
          </div>
          <div className="cloze-text">
            {paper.blocks.map((block, bi) => (
              <p key={bi} className="cloze-para">
                {renderBlock(block, picks, paper.blanks, (num) => jumpTo(num), handleWord)}
              </p>
            ))}
          </div>
        </div>

        <div className="cloze-questions">
          {paper.blanks.map((b, i) => {
            const mine = picks[b.num];
            const revealed = Boolean(mine);
            const right = revealed && mine === b.answer;
            return (
              <div
                key={b.num}
                className={`cloze-q ${revealed ? (right ? 'right' : 'wrong') : ''} ${active === b.num ? 'active' : ''}`}
                ref={(el) => {
                  cardRefs.current[b.num] = el;
                }}
                onClick={() => setActive(b.num)}
              >
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
                      `第 ${i + 1} / ${paper.blanks.length} 空`
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
              </div>
            );
          })}
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
            <button className="btn ghost" onClick={() => jumpTo(nextUnanswered(paper, picks))}>
              跳到下一空 <ArrowRight size={15} />
            </button>
          )}
        </div>

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
                      onClick={() => jumpTo(b.num)}
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
            共 {data.total} 篇 / {data.blankTotal} 空，基础与进阶两档。先通读全文再逐空选词，选完立刻判定对错并给出原句依据。
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
        <RefreshCw size={14} />
        <span>
          作答进度存在本机浏览器里，退出后再次点开同一篇会从上次的答案继续；题目与解析随题库一起更新。
        </span>
      </div>
    </div>
  );
}

// 把一段正文拆成「英文文本 + 空格胶囊」
function renderBlock(
  block: string,
  picks: Record<number, string>,
  blanks: ClozeBlank[],
  onJump: (num: number) => void,
  onWord: (word: string, el: HTMLElement) => void,
) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  BLANK_RE.lastIndex = 0;
  for (const m of block.matchAll(BLANK_RE)) {
    const start = m.index ?? 0;
    const num = Number(m[1]);
    if (start > last) {
      nodes.push(<WordText key={`t${key++}`} text={block.slice(last, start)} onWordClick={onWord} />);
    }
    const blank = blanks.find((b) => b.num === num);
    const mine = picks[num];
    const state = !mine ? 'empty' : mine === blank?.answer ? 'right' : 'wrong';
    nodes.push(
      <button
        key={`b${key++}`}
        className={`cloze-inline ${state}`}
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
  if (last < block.length) {
    nodes.push(<WordText key={`t${key++}`} text={block.slice(last)} onWordClick={onWord} />);
  }
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
