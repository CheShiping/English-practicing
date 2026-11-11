'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookX,
  CheckCircle2,
  ClipboardList,
  Flag,
  Layers,
  RefreshCw,
  Shuffle,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { hrefFor } from '@/lib/router';
import type { PracticeData, PracticeQuestion } from '@/lib/types';
import {
  addHistory,
  addWrong,
  buildPaper,
  clearWrongBook,
  getHistory,
  getWrongBook,
  getWrongIds,
  loadPractice,
  removeWrong,
  sortCategories,
  type PracticeMode,
} from '@/lib/practice';

type Phase = 'loading' | 'setup' | 'quiz' | 'result' | 'error';
const SIZE_OPTIONS = [10, 20, 50, 0]; // 0 = 全部

interface Paper {
  questions: PracticeQuestion[];
  label: string;
  source: 'pool' | 'wrong';
}

export default function PracticePage({ tab }: { tab?: 'wrong' }) {
  const { recordActivity, toast } = useApp();
  const [data, setData] = useState<PracticeData | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [view, setView] = useState<'setup' | 'wrong'>(tab === 'wrong' ? 'wrong' : 'setup');

  // 组卷设置
  const [category, setCategory] = useState<string>('全部');
  const [sub, setSub] = useState<string>('全部');
  const [size, setSize] = useState<number>(20);
  const [mode, setMode] = useState<PracticeMode>('random');

  // 练习状态
  const [paper, setPaper] = useState<Paper | null>(null);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [marks, setMarks] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [wrongIdsVersion, setWrongIdsVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    loadPractice()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setPhase('setup');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : '练习数据加载失败');
        setPhase('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  // 路由 tab 变化（#practice / #practice/wrong）
  useEffect(() => {
    setView(tab === 'wrong' ? 'wrong' : 'setup');
  }, [tab]);

  const wrongBook = useMemo(() => {
    void wrongIdsVersion;
    return getWrongBook();
  }, [wrongIdsVersion, view, phase]);

  const wrongCount = Object.keys(wrongBook).length;

  const categories = useMemo(() => {
    if (!data) return [];
    return sortCategories(data.categories);
  }, [data]);

  const subs = useMemo(() => {
    if (!data) return [];
    if (category === '全部') {
      const all = new Set<string>();
      for (const c of categories) (data.subcategories[c] || []).forEach((s) => all.add(s));
      return [...all].sort();
    }
    return (data.subcategories[category] || []).slice().sort();
  }, [data, category, categories]);

  const pool = useMemo(() => {
    if (!data) return [];
    return data.questions.filter(
      (q) => (category === '全部' || q.category === category) && (sub === '全部' || q.sub === sub),
    );
  }, [data, category, sub]);

  const startPractice = useCallback(
    (source: 'pool' | 'wrong') => {
      if (!data) return;
      let questions: PracticeQuestion[];
      let label: string;
      if (source === 'wrong') {
        const ids = new Set(getWrongIds());
        questions = data.questions.filter((q) => ids.has(q.id));
        if (!questions.length) {
          toast('错题本是空的，先去练一组吧', 'info');
          return;
        }
        label = '错题重做';
      } else {
        questions = pool;
        label = `${category === '全部' ? '全部考点' : category}${sub === '全部' ? '' : ' · ' + sub}`;
      }
      const picked = buildPaper(questions, source === 'wrong' ? 0 : size, mode);
      if (!picked.length) {
        toast('没有符合条件的题目', 'info');
        return;
      }
      setPaper({ questions: picked, label, source });
      setPicks({});
      setMarks([]);
      setCursor(0);
      setPhase('quiz');
    },
    [data, pool, category, sub, size, mode, toast],
  );

  const submit = useCallback(() => {
    if (!paper) return;
    const unanswered = paper.questions.filter((q) => !picks[q.id]);
    if (unanswered.length && !window.confirm(`还有 ${unanswered.length} 题未作答，确定交卷？`)) return;
    let correct = 0;
    for (const q of paper.questions) {
      const mine = picks[q.id] || '';
      if (mine && mine === q.answer) correct++;
      else if (mine) addWrong(q.id, mine);
    }
    recordActivity({ questions: paper.questions.length, correct });
    addHistory({ at: Date.now(), total: paper.questions.length, correct, label: paper.label });
    setWrongIdsVersion((v) => v + 1);
    setPhase('result');
  }, [paper, picks, recordActivity]);

  const restartWrong = useCallback(
    (onlyThese: string[]) => {
      if (!data) return;
      const ids = new Set(onlyThese);
      const questions = data.questions.filter((q) => ids.has(q.id));
      if (!questions.length) return;
      const picked = buildPaper(questions, 0, 'ordered');
      setPaper({ questions: picked, label: '错题重做', source: 'wrong' });
      setPicks({});
      setMarks([]);
      setCursor(0);
      setPhase('quiz');
    },
    [data],
  );

  if (phase === 'loading') {
    return (
      <div className="page practice-page">
        <div className="practice-loading">
          <ClipboardList size={22} />
          <span>正在展开题册…</span>
        </div>
      </div>
    );
  }
  if (phase === 'error') {
    return (
      <div className="page practice-page">
        <div className="practice-loading">
          <BookX size={22} />
          <span>{error}</span>
        </div>
      </div>
    );
  }
  if (!data) return null;

  // ---------- 练习中 ----------
  if (phase === 'quiz' && paper) {
    const q = paper.questions[cursor];
    const answered = paper.questions.filter((x) => picks[x.id]).length;
    return (
      <div className="page practice-page practice-quiz">
        <div className="practice-quiz-top">
          <button className="practice-back" onClick={() => { if (window.confirm('退出后本次作答不会保存，确定退出？')) setPhase('setup'); }}>
            <ArrowLeft size={16} /> 退出
          </button>
          <div className="practice-progress">
            <span className="practice-progress-text">
              第 {cursor + 1} / {paper.questions.length} 题 · 已答 {answered}
            </span>
            <div className="practice-progress-bar">
              <span style={{ width: `${((cursor + 1) / paper.questions.length) * 100}%` }} />
            </div>
          </div>
          <button
            className={`practice-mark ${marks.includes(q.id) ? 'on' : ''}`}
            onClick={() => setMarks((m) => (m.includes(q.id) ? m.filter((x) => x !== q.id) : [...m, q.id]))}
            title="标记本题"
          >
            <Flag size={15} /> {marks.includes(q.id) ? '已标记' : '标记'}
          </button>
        </div>

        <p className="practice-paper-label">{paper.label}</p>

        <div className="practice-qcard">
          <p className="practice-stem">{q.stem}</p>
          <div className="practice-options">
            {q.options.map((opt, i) => {
              const letter = LETTERS[i];
              const chosen = picks[q.id] === letter;
              return (
                <button
                  key={i}
                  className={`practice-option ${chosen ? 'chosen' : ''}`}
                  onClick={() => setPicks((p) => ({ ...p, [q.id]: letter }))}
                >
                  <span className="practice-option-letter">{letter}</span>
                  <span className="practice-option-text">{opt || '（选项缺失）'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="practice-nav">
          <button className="btn ghost" disabled={cursor === 0} onClick={() => setCursor((c) => Math.max(0, c - 1))}>
            <ArrowLeft size={15} /> 上一题
          </button>
          {cursor < paper.questions.length - 1 ? (
            <button className="btn primary" onClick={() => setCursor((c) => Math.min(paper.questions.length - 1, c + 1))}>
              下一题 <ArrowRight size={15} />
            </button>
          ) : (
            <button className="btn primary" onClick={submit}>
              <Send size={15} /> 交卷
            </button>
          )}
        </div>

        <div className="practice-sheet">
          <p className="practice-sheet-title">答题卡</p>
          <div className="practice-sheet-grid">
            {paper.questions.map((item, i) => (
              <button
                key={item.id}
                className={`practice-sheet-cell ${i === cursor ? 'cur' : ''} ${picks[item.id] ? 'done' : ''} ${marks.includes(item.id) ? 'marked' : ''}`}
                onClick={() => setCursor(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- 结果 ----------
  if (phase === 'result' && paper) {
    const total = paper.questions.length;
    const correct = paper.questions.filter((q) => picks[q.id] === q.answer).length;
    const wrongList = paper.questions.filter((q) => picks[q.id] !== q.answer);
    const percent = total ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="page practice-page">
        <div className="practice-score-card">
          <p className="practice-score-label">{paper.label} · 练习结果</p>
          <p className="practice-score">
            <b>{correct}</b> / {total}
            <span className="practice-score-pct">正确率 {percent}%</span>
          </p>
          <div className="practice-actions">
            {paper.source === 'pool' && (
              <button className="btn primary" onClick={() => setPhase('setup')}>
                <RefreshCw size={15} /> 再来一组
              </button>
            )}
            {wrongList.length > 0 && (
              <button className="btn" onClick={() => restartWrong(wrongList.map((q) => q.id))}>
                <Shuffle size={15} /> 只重做错题（{wrongList.length}）
              </button>
            )}
            <button className="btn ghost" onClick={() => { setPhase('setup'); setView('setup'); }}>
              返回
            </button>
          </div>
        </div>

        <div className="practice-review-list">
          {paper.questions.map((q, i) => {
            const mine = picks[q.id] || '';
            const ok = mine === q.answer;
            return (
              <div key={q.id} className={`practice-review ${ok ? 'ok' : 'bad'}`}>
                <div className="practice-review-head">
                  {ok ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                  <span className="practice-review-num">第 {i + 1} 题</span>
                  <span className="practice-tags">
                    <span className={`practice-tag cat-${TAG_CLASS[q.category] || 'other'}`}>{q.category}</span>
                    <span className="practice-tag sub">{q.sub}</span>
                  </span>
                </div>
                <p className="practice-stem">{q.stem}</p>
                <div className="practice-review-answers">
                  <span className={ok ? 'right' : 'wrong-mine'}>你的答案：{mine ? `${mine}. ${q.options[LETTERS.indexOf(mine)] || ''}` : '未作答'}</span>
                  {!ok && <span className="right">正确答案：{q.answer}. {q.options[LETTERS.indexOf(q.answer)] || ''}</span>}
                </div>
                {q.explanation && <p className="practice-explanation">{q.explanation}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- 错题本 ----------
  if (view === 'wrong') {
    const entries = Object.values(wrongBook).sort((a, b) => b.lastWrongAt - a.lastWrongAt);
    const byId = new Map(data.questions.map((q) => [q.id, q]));
    const history = getHistory();
    return (
      <div className="page practice-page">
        <div className="practice-head">
          <div>
            <span className="eyebrow">Practice</span>
            <h1 className="section-title" style={{ marginTop: 12 }}>错题本</h1>
            <p className="section-sub">做错的题会自动收进来，重做全对后可移出。</p>
          </div>
          <a className="btn ghost" href={hrefFor('/practice')}>← 考点练习</a>
        </div>

        <div className="practice-wrong-actions">
          <button className="btn primary" onClick={() => startPractice('wrong')} disabled={!entries.length}>
            <Shuffle size={15} /> 错题重做（{entries.length}）
          </button>
          {entries.length > 0 && (
            <button
              className="btn ghost"
              onClick={() => {
                if (window.confirm('确定清空全部错题记录？')) {
                  clearWrongBook();
                  setWrongIdsVersion((v) => v + 1);
                }
              }}
            >
              <Trash2 size={15} /> 清空
            </button>
          )}
        </div>

        {history.length > 0 && (
          <div className="practice-history">
            <p className="practice-sheet-title">最近练习</p>
            <div className="practice-history-list">
              {history.slice(0, 5).map((h, i) => (
                <div key={i} className="practice-history-item">
                  <span>{new Date(h.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="practice-history-label">{h.label}</span>
                  <b className={h.correct / Math.max(1, h.total) >= 0.7 ? 'good' : 'bad'}>
                    {h.correct}/{h.total}
                  </b>
                </div>
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 ? (
          <div className="practice-empty">
            <CheckCircle2 size={26} />
            <p>还没有错题，去练一组看看。</p>
            <a className="btn primary" href={hrefFor('/practice')}>开始练习</a>
          </div>
        ) : (
          <div className="practice-review-list">
            {entries.map((e) => {
              const q = byId.get(e.id);
              if (!q) return null;
              return (
                <div key={e.id} className="practice-review bad">
                  <div className="practice-review-head">
                    <XCircle size={17} />
                    <span className="practice-review-num">错 {e.wrongCount} 次</span>
                    <span className="practice-tags">
                      <span className={`practice-tag cat-${TAG_CLASS[q.category] || 'other'}`}>{q.category}</span>
                      <span className="practice-tag sub">{q.sub}</span>
                    </span>
                    <button
                      className="practice-wrong-remove"
                      title="移出错题本"
                      onClick={() => {
                        removeWrong(e.id);
                        setWrongIdsVersion((v) => v + 1);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="practice-stem">{q.stem}</p>
                  <div className="practice-review-answers">
                    <span className="wrong-mine">你的答案：{e.myAnswer || '未作答'}</span>
                    <span className="right">正确答案：{q.answer}. {q.options[LETTERS.indexOf(q.answer)] || ''}</span>
                  </div>
                  {q.explanation && <p className="practice-explanation">{q.explanation}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---------- 组卷设置 ----------
  return (
    <div className="page practice-page">
      <div className="practice-head">
        <div>
          <span className="eyebrow">Practice</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>单选练习</h1>
          <p className="section-sub">
            共 {data.total} 道专升本词汇语法单选题，按语法框架分好考点。选考点、定题量，答完逐题看解析。
          </p>
        </div>
        <a className="btn ghost" href={hrefFor('/practice/wrong')}>
          <BookX size={15} /> 错题本{wrongCount > 0 ? `（${wrongCount}）` : ''}
        </a>
      </div>

      <div className="practice-setup">
        <div className="practice-block">
          <p className="practice-block-title"><Layers size={15} /> 考点大类</p>
          <div className="practice-chips">
            <button className={`practice-chip ${category === '全部' ? 'on' : ''}`} onClick={() => { setCategory('全部'); setSub('全部'); }}>
              全部 <em>{data.total}</em>
            </button>
            {categories.map((c) => (
              <button key={c} className={`practice-chip ${category === c ? 'on' : ''}`} onClick={() => { setCategory(c); setSub('全部'); }}>
                {c} <em>{data.questions.filter((q) => q.category === c).length}</em>
              </button>
            ))}
          </div>
        </div>

        {category !== '全部' && (
          <div className="practice-block">
            <p className="practice-block-title"><Layers size={15} /> 细分考点</p>
            <div className="practice-chips">
              <button className={`practice-chip ${sub === '全部' ? 'on' : ''}`} onClick={() => setSub('全部')}>全部</button>
              {subs.map((s) => (
                <button key={s} className={`practice-chip ${sub === s ? 'on' : ''}`} onClick={() => setSub(s)}>
                  {s} <em>{data.questions.filter((q) => q.category === category && q.sub === s).length}</em>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="practice-block">
          <p className="practice-block-title"><ClipboardList size={15} /> 题量</p>
          <div className="practice-chips">
            {SIZE_OPTIONS.map((n) => (
              <button key={n} className={`practice-chip ${size === n ? 'on' : ''}`} onClick={() => setSize(n)}>
                {n === 0 ? '全部' : `${n} 题`}
              </button>
            ))}
          </div>
        </div>

        <div className="practice-block">
          <p className="practice-block-title"><Shuffle size={15} /> 顺序</p>
          <div className="practice-chips">
            <button className={`practice-chip ${mode === 'random' ? 'on' : ''}`} onClick={() => setMode('random')}>随机</button>
            <button className={`practice-chip ${mode === 'ordered' ? 'on' : ''}`} onClick={() => setMode('ordered')}>顺序</button>
          </div>
        </div>

        <div className="practice-start">
          <button className="btn primary large" onClick={() => startPractice('pool')}>
            开始练习（{Math.min(size && size > 0 ? size : pool.length, pool.length)} 题）
          </button>
          <p className="practice-pool-hint">当前考点池 {pool.length} 题</p>
        </div>
      </div>
    </div>
  );
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const TAG_CLASS: Record<string, string> = {
  六大词性: 'pos',
  两个态: 'voice',
  三大从句: 'clause',
  五大句型: 'pattern',
  四个重点: 'keyfour',
  其他: 'other',
};
