'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  PenLine,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { hrefFor } from '@/lib/router';
import { loadPractice } from '@/lib/practice';
import { loadCloze } from '@/lib/cloze';
import {
  getReciteBook,
  getUnknownEntries,
  removeRecite,
  setReciteStatus,
  type ReciteEntry,
} from '@/lib/recite';
import type { ClozeBlank, ClozePassage, PracticeData, PracticeQuestion } from '@/lib/types';

type Scope = 'all' | 'practice' | 'cloze';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface PracticeEntry {
  entry: ReciteEntry;
  question: PracticeQuestion;
}

interface ClozeEntry {
  entry: ReciteEntry;
  passage: ClozePassage;
  blank: ClozeBlank;
}

export default function RecitePage() {
  const { toast } = useApp();
  const [scope, setScope] = useState<Scope>('all');
  const [data, setData] = useState<PracticeData | null>(null);
  const [cloze, setCloze] = useState<ClozePassage[] | null>(null);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    loadPractice()
      .then((d) => {
        if (!alive) return;
        setData(d);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : '练习数据加载失败');
      });
    loadCloze()
      .then((d) => {
        if (!alive) return;
        setCloze(d.passages);
      })
      .catch(() => {
        /* 完型题库拿不到时只显示单选部分 */
      });
    return () => {
      alive = false;
    };
  }, []);

  const entries = useMemo(() => {
    void version;
    return getUnknownEntries();
  }, [version]);

  const practiceEntries = useMemo<PracticeEntry[]>(() => {
    if (!data) return [];
    const byId = new Map(data.questions.map((q) => [q.id, q]));
    const out: PracticeEntry[] = [];
    for (const entry of entries) {
      if (entry.scope !== 'practice') continue;
      const question = byId.get(entry.ref);
      if (question) out.push({ entry, question });
    }
    return out;
  }, [entries, data]);

  const clozeEntries = useMemo<ClozeEntry[]>(() => {
    if (!cloze) return [];
    const byId = new Map(cloze.map((p) => [p.id, p]));
    const out: ClozeEntry[] = [];
    for (const entry of entries) {
      if (entry.scope !== 'cloze') continue;
      const [passageId, numText] = entry.ref.split('#');
      const passage = byId.get(passageId);
      const blank = passage?.blanks.find((b) => b.num === Number(numText));
      if (passage && blank) out.push({ entry, passage, blank });
    }
    return out;
  }, [entries, cloze]);

  const knownCount = useMemo(() => {
    void version;
    return Object.values(getReciteBook()).filter((e) => e.status === 'known').length;
  }, [version]);

  const shown = scope === 'all' ? 'both' : scope;

  const reveal = useCallback((id: string) => {
    setRevealed((r) => ({ ...r, [id]: true }));
  }, []);

  const rate = useCallback(
    (entry: ReciteEntry, status: 'known' | 'unknown') => {
      setReciteStatus(entry.scope, entry.ref, status);
      setVersion((v) => v + 1);
      setRevealed((r) => {
        const next = { ...r };
        delete next[entry.id];
        return next;
      });
      toast(status === 'known' ? '已从背题本移除' : '继续留在背题本', 'success');
    },
    [toast],
  );

  const drop = useCallback(
    (entry: ReciteEntry) => {
      removeRecite(entry.scope, entry.ref);
      setVersion((v) => v + 1);
      setRevealed((r) => {
        const next = { ...r };
        delete next[entry.id];
        return next;
      });
    },
    [],
  );

  if (error) {
    return (
      <div className="page recite-page">
        <div className="practice-loading">
          <Brain size={22} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const total = practiceEntries.length + clozeEntries.length;

  return (
    <div className="page recite-page">
      <div className="practice-head">
        <div>
          <span className="eyebrow">Recite</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            背题本
          </h1>
          <p className="section-sub">
            背题时标记「没记住」的题目和空格都会收在这里。先自己回想，再翻开答案核对，确认记住后再移出。
          </p>
        </div>
        <div className="practice-head-actions">
          <a className="btn ghost" href={hrefFor('/practice')}>
            <Layers size={15} /> 单选背题
          </a>
          <a className="btn ghost" href={hrefFor('/cloze')}>
            <PenLine size={15} /> 完型背题
          </a>
        </div>
      </div>

      <div className="cloze-summary">
        <div>
          <b>{total}</b>
          <span>待背条目</span>
        </div>
        <div>
          <b>{practiceEntries.length}</b>
          <span>单选题目</span>
        </div>
        <div>
          <b>{clozeEntries.length}</b>
          <span>完型空格</span>
        </div>
        <div>
          <b>{knownCount}</b>
          <span>已记住</span>
        </div>
      </div>

      {total === 0 ? (
        <div className="practice-empty">
          <CheckCircle2 size={26} />
          <p>背题本还是空的。练习或完型里点「没记住」，题目就会收到这里。</p>
          <a className="btn primary" href={hrefFor('/practice')}>
            去背题 <ArrowRight size={15} />
          </a>
        </div>
      ) : (
        <>
          <div className="practice-block">
            <ChipScrollerRow scope={scope} onChange={setScope} />
          </div>

          {shown !== 'cloze' && practiceEntries.length > 0 && (
            <section className="recite-section">
              <h2 className="recite-section-title">
                <Layers size={16} /> 单选题目（{practiceEntries.length}）
              </h2>
              <div className="recite-list">
                {practiceEntries.map(({ entry, question }) => {
                  const open = Boolean(revealed[entry.id]);
                  return (
                    <article key={entry.id} className="recite-card">
                      <div className="recite-card-head">
                        <span className="practice-tag cat-other">{question.category}</span>
                        <span className="practice-tag sub">{question.sub}</span>
                        <span className="recite-time">
                          {new Date(entry.at).toLocaleDateString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </span>
                        <button
                          className="practice-wrong-remove"
                          title="从背题本移除"
                          onClick={() => drop(entry)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="practice-stem">{question.stem}</p>
                      {open ? (
                        <>
                          <div className="recite-answer">
                            正确答案 {question.answer}.{' '}
                            {question.options[LETTERS.indexOf(question.answer)] || ''}
                          </div>
                          {question.explanation && (
                            <p className="practice-explanation">{question.explanation}</p>
                          )}
                          <div className="recite-actions">
                            <button className="btn small primary" onClick={() => rate(entry, 'known')}>
                              <CheckCircle2 size={14} /> 记住了
                            </button>
                            <button className="btn small ghost" onClick={() => rate(entry, 'unknown')}>
                              仍不熟
                            </button>
                          </div>
                        </>
                      ) : (
                        <button className="btn small recite-reveal-btn" onClick={() => reveal(entry.id)}>
                          <Eye size={14} /> 显示答案
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {shown !== 'practice' && clozeEntries.length > 0 && (
            <section className="recite-section">
              <h2 className="recite-section-title">
                <PenLine size={16} /> 完型空格（{clozeEntries.length}）
              </h2>
              <div className="recite-list">
                {clozeEntries.map(({ entry, passage, blank }) => {
                  const open = Boolean(revealed[entry.id]);
                  const answerText = blank.options[LETTERS.indexOf(blank.answer)] || '';
                  return (
                    <article key={entry.id} className="recite-card">
                      <div className="recite-card-head">
                        <span className="cloze-badge">{passage.bank}</span>
                        <span className="recite-cloze-title">
                          {passage.label} · 第 {blank.num} 空
                        </span>
                        <a className="recite-link" href={hrefFor(`/cloze/${passage.id}`)}>
                          回到本篇 <ChevronRight size={13} />
                        </a>
                        <button
                          className="practice-wrong-remove"
                          title="从背题本移除"
                          onClick={() => drop(entry)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {blank.evidence && <p className="cloze-evidence">{blank.evidence}</p>}
                      {open ? (
                        <>
                          <div className="recite-answer">
                            正确答案 {blank.answer}. {answerText}
                          </div>
                          {blank.note && <p className="practice-explanation">{blank.note}</p>}
                          <div className="recite-actions">
                            <button className="btn small primary" onClick={() => rate(entry, 'known')}>
                              <CheckCircle2 size={14} /> 记住了
                            </button>
                            <button className="btn small ghost" onClick={() => rate(entry, 'unknown')}>
                              仍不熟
                            </button>
                          </div>
                        </>
                      ) : (
                        <button className="btn small recite-reveal-btn" onClick={() => reveal(entry.id)}>
                          <Eye size={14} /> 显示答案
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ChipScrollerRow({ scope, onChange }: { scope: Scope; onChange: (s: Scope) => void }) {
  const items: { key: Scope; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'practice', label: '单选' },
    { key: 'cloze', label: '完型' },
  ];
  return (
    <div className="practice-chips">
      {items.map((it) => (
        <button
          key={it.key}
          className={`practice-chip ${scope === it.key ? 'on' : ''}`}
          data-active={scope === it.key ? 'true' : undefined}
          onClick={() => onChange(it.key)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
