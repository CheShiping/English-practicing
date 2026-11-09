'use client';

import { useState } from 'react';
import {
  BarChart3,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  Highlighter,
  ListChecks,
  MessageSquareText,
  Trash2,
  Volume2,
} from 'lucide-react';
import type { Annotation, Article, AnswerState } from '@/lib/types';
import type { VocabWord } from '@/lib/types';
import { cn, formatDuration, percent, relativeTime } from '@/lib/utils';
import { speakWord } from '@/lib/dict';
import QuestionPanel from '@/components/reader/QuestionPanel';
import { hrefFor } from '@/lib/router';
import { useApp } from '@/state/AppProvider';

export type RailTab = 'questions' | 'vocab' | 'notes' | 'stats';

interface Props {
  article: Article;
  activeTab: RailTab;
  onTab: (tab: RailTab) => void;
  answerState: AnswerState;
  quizStartedAt: number | null;
  onSelect: (qnum: number, letter: string) => void;
  onMark: (qnum: number) => void;
  onSubmit: (correct: number, timeMs: number) => void;
  onReset: () => void;
  onLocateEvidence: (evidence: string) => void;
  onLocateAnnotation: (ann: Annotation) => void;
}

export default function ReaderRail(props: Props) {
  const { article, activeTab, onTab } = props;
  const { annotations, vocab, settings, updateSettings, progress, timerElapsed, timer, markComplete, removeWord, removeAnnotation, toast } =
    useApp();

  const articleAnns = annotations.filter((a) => a.articleId === article.id);
  const articleWords = vocab.filter((v) => v.articleId === article.id);
  const p = progress[article.id];
  const answered = Object.keys(props.answerState.answers).length;
  const accuracy = props.answerState.submitted && props.answerState.correctCount != null
    ? percent(props.answerState.correctCount, article.questions.filter((q) => q.answer).length || 1)
    : null;

  const tabs: Array<{ key: RailTab; label: string; icon: typeof ListChecks; count?: number }> = [
    { key: 'questions', label: '题目', icon: ListChecks, count: article.questions.length },
    { key: 'vocab', label: '生词', icon: BookMarked, count: articleWords.length },
    { key: 'notes', label: '批注', icon: MessageSquareText, count: articleAnns.length },
    { key: 'stats', label: '数据', icon: BarChart3 },
  ];

  return (
    <div className="reader-rail">
      <div className="rail-tabs" role="tablist" aria-label="阅读侧栏">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              className={cn('rail-tab', activeTab === t.key && 'active')}
              onClick={() => onTab(t.key)}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              {t.count != null && t.count > 0 && <b>{t.count}</b>}
            </button>
          );
        })}
      </div>

      <div className="rail-scroll">
        {activeTab === 'questions' && (
          <QuestionPanel
            article={article}
            answerState={props.answerState}
            quizStartedAt={props.quizStartedAt}
            onSelect={props.onSelect}
            onMark={props.onMark}
            onSubmit={props.onSubmit}
            onReset={props.onReset}
            onLocate={props.onLocateEvidence}
          />
        )}

        {activeTab === 'vocab' && (
          <div className="rail-vocab">
            <div className="rail-panel-head">
              <div>
                <div className="rail-panel-title">本篇生词</div>
                <div className="rail-panel-sub">
                  {articleWords.length} 个 · 全部 {vocab.length} 个
                </div>
              </div>
              <label className="rail-toggle" title="在正文中高亮已加入生词本的单词">
                <input
                  type="checkbox"
                  checked={settings.highlightVocab}
                  onChange={(e) => updateSettings({ highlightVocab: e.target.checked })}
                />
                <span>
                  <Highlighter size={13} /> 高亮
                </span>
              </label>
            </div>

            {articleWords.length === 0 ? (
              <div className="rail-empty small">
                <BookMarked size={22} />
                <p>在正文里点任意单词</p>
                <span>点「加入生词本」，这里就会出现它。</span>
              </div>
            ) : (
              <div className="rail-word-list">
                {articleWords.map((w) => (
                  <WordItem key={w.word} word={w} onRemove={() => { removeWord(w.word); toast('已移出生词本'); }} />
                ))}
              </div>
            )}

            <a className="rail-link" href={hrefFor('/vocab')}>
              去生词本复习 <ChevronRight size={14} />
            </a>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="rail-notes">
            <div className="rail-panel-head">
              <div>
                <div className="rail-panel-title">本篇批注</div>
                <div className="rail-panel-sub">{articleAnns.length} 条 · 自动保存</div>
              </div>
            </div>
            {articleAnns.length === 0 ? (
              <div className="rail-empty small">
                <MessageSquareText size={22} />
                <p>选中正文里的句子</p>
                <span>点击浮动工具条上的「批注」，就能留下高亮和笔记。</span>
              </div>
            ) : (
              <div className="rail-note-list">
                {articleAnns.map((a) => (
                  <div key={a.id} className={cn('rail-note', `rail-note-${a.color}`)}>
                    <button className="rail-note-main" onClick={() => props.onLocateAnnotation(a)}>
                      <span className="rail-note-quote">“{a.text.slice(0, 90)}{a.text.length > 90 ? '…' : ''}”</span>
                      {a.note && <span className="rail-note-text">{a.note}</span>}
                      <span className="rail-note-time">{relativeTime(a.updatedAt)}</span>
                    </button>
                    <button
                      className="rail-note-del"
                      onClick={() => {
                        removeAnnotation(a.id);
                        toast('批注已删除');
                      }}
                      aria-label="删除批注"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="rail-stats">
            <div className="rail-panel-head">
              <div>
                <div className="rail-panel-title">本篇数据</div>
                <div className="rail-panel-sub">只统计当前这篇文章</div>
              </div>
            </div>

            <div className="rail-big-stat">
              <div className="progress-ring" style={{ ['--p' as string]: p?.percent || 0, ['--size' as string]: '78px' }}>
                <span>{p?.percent || 0}%</span>
              </div>
              <div>
                <b>阅读进度</b>
                <span>滚动正文即可自动记录</span>
              </div>
            </div>

            <div className="rail-stat-grid">
              <div>
                <b>{formatDuration(p?.timeSpent || 0, false)}</b>
                <span>累计阅读</span>
              </div>
              <div>
                <b>{article.questions.length}</b>
                <span>题目数</span>
              </div>
              <div>
                <b>{accuracy == null ? '—' : `${accuracy}%`}</b>
                <span>做题正确率</span>
              </div>
              <div>
                <b>{answered}</b>
                <span>已作答</span>
              </div>
              <div>
                <b>{articleWords.length}</b>
                <span>生词</span>
              </div>
              <div>
                <b>{articleAnns.length}</b>
                <span>批注</span>
              </div>
            </div>

            {timer.status !== 'idle' && (
              <div className="rail-timer-row">
                <span>本次计时</span>
                <b>{formatDuration(timerElapsed)}</b>
              </div>
            )}

            <button
              className={cn('btn small', p?.completed ? '' : 'primary')}
              onClick={() => {
                markComplete(article.id);
                toast('已标记为完成', 'success');
              }}
              disabled={p?.completed}
            >
              <CheckCircle2 size={14} /> {p?.completed ? '已完成' : '标记为已完成'}
            </button>

            <div className="rail-note-tip">
              小提示：读完后先自己概括每段大意，再做题，正确率通常更高。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WordItem({ word, onRemove }: { word: VocabWord; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('rail-word', open && 'open')}>
      <button className="rail-word-main" onClick={() => setOpen((v) => !v)}>
        <b>{word.word}</b>
        {word.phonetic && <span className="rail-word-phon">/{word.phonetic}/</span>}
        <span className="rail-word-meaning">
          {(word.meaning || '').split(/[；\n]/)[0]}
        </span>
      </button>
      <div className="rail-word-actions">
        <button onClick={() => speakWord(word.word)} aria-label="朗读">
          <Volume2 size={13} />
        </button>
        <button onClick={onRemove} aria-label="移出生词本">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
