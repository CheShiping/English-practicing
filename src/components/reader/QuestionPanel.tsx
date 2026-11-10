'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  Eye,
  Lightbulb,
  LocateFixed,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import type { Article, AnswerState } from '@/lib/types';
import { cn, formatDuration, percent } from '@/lib/utils';

function StemText({ text }: { text: string }) {
  const parts = text.split(/(_{3,})/g);
  return (
    <>
      {parts.map((p, i) => {
        if (!/^_{3,}$/.test(p)) return <span key={i}>{p}</span>;
        const next = parts[i + 1] || '';
        const punct = next.match(/^[.?!,;:]+/)?.[0];
        if (punct) {
          parts[i + 1] = next.slice(punct.length);
          return (
            <span key={i} className="q-blank-group">
              <span className="q-blank" />
              {punct}
            </span>
          );
        }
        return <span key={i} className="q-blank" />;
      })}
    </>
  );
}

interface Props {
  article: Article;
  answerState: AnswerState;
  quizStartedAt: number | null;
  onSelect: (qnum: number, letter: string) => void;
  onMark: (qnum: number) => void;
  onSubmit: (correct: number, timeMs: number) => void;
  onReset: () => void;
  onLocate?: (evidence: string) => void;
}

export default function QuestionPanel({
  article,
  answerState,
  quizStartedAt,
  onSelect,
  onMark,
  onSubmit,
  onReset,
  onLocate,
}: Props) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [analysis, setAnalysis] = useState<Record<number, boolean>>({});
  const [onlyWrong, setOnlyWrong] = useState(false);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const questions = article.questions;
  const withKey = questions.filter((q) => q.answer);
  const answeredCount = questions.filter((q) => answerState.answers[q.num]).length;
  const submitted = answerState.submitted === true;

  const correctCount = useMemo(
    () =>
      questions.filter((q) => q.answer && answerState.answers[q.num] === q.answer).length,
    [questions, answerState.answers],
  );

  const accuracy = withKey.length ? percent(correctCount, withKey.length) : 0;
  const wrongNums = questions
    .filter((q) => q.answer && answerState.answers[q.num] && answerState.answers[q.num] !== q.answer)
    .map((q) => q.num);

  const list = submitted && onlyWrong ? questions.filter((q) => wrongNums.includes(q.num)) : questions;

  const submit = () => {
    if (answeredCount < questions.length) {
      const missing = questions.length - answeredCount;
      if (!window.confirm(`还有 ${missing} 题没有作答，确定提交吗？`)) return;
    }
    const elapsed = quizStartedAt ? Date.now() - quizStartedAt : 0;
    onSubmit(correctCount, elapsed);
    window.setTimeout(() => {
      const el = cardRefs.current[questions[0]?.num];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const reset = () => {
    if (!window.confirm('重做会清空本篇的作答记录，确定吗？')) return;
    setRevealed({});
    setAnalysis({});
    setOnlyWrong(false);
    onReset();
  };

  if (!questions.length) {
    return (
      <div className="rail-empty">
        <Lightbulb size={22} />
        <p>本篇是纯阅读文章，暂无配套题目。</p>
        <span>可以点词查义、划句翻译，或选中句子添加批注。</span>
      </div>
    );
  }

  return (
    <div className="q-panel">
      <div className="q-panel-head">
        <div>
          <div className="q-panel-title">阅读题目</div>
          <div className="q-panel-sub">
            {questions.length} 题 · 已答 {answeredCount} 题
          </div>
        </div>
        <div className="q-panel-progress">
          <span>{percent(answeredCount, questions.length)}%</span>
          <div className="progress-bar">
            <i style={{ width: `${percent(answeredCount, questions.length)}%` }} />
          </div>
        </div>
      </div>

      <div className="q-nav" aria-label="题目导航">
        {questions.map((q) => {
          const ans = answerState.answers[q.num];
          const status = submitted && q.answer ? (ans === q.answer ? 'ok' : ans ? 'bad' : '') : ans ? 'done' : '';
          return (
            <button
              key={q.num}
              className={cn('q-nav-dot', status && `q-nav-${status}`, answerState.marked.includes(q.num) && 'marked')}
              onClick={() => cardRefs.current[q.num]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              aria-label={`第 ${q.num} 题`}
            >
              {q.num}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className="q-result">
          <div className="q-result-main">
            <div className="q-result-score">
              <b>{correctCount}</b>
              <span>/ {withKey.length || questions.length}</span>
            </div>
            <div className="q-result-meta">
              <b>{withKey.length ? `正确率 ${accuracy}%` : '本篇暂无标准答案'}</b>
              <span>
                用时 {formatDuration(answerState.timeSpent || 0)} ·{' '}
                {withKey.length ? '对照解析，看看错在哪一步' : '对照自己的理解，标记有疑问的题'}
              </span>
            </div>
          </div>
          <div className="q-result-actions">
            {wrongNums.length > 0 && (
              <button className={cn('btn small', onlyWrong && 'primary')} onClick={() => setOnlyWrong((v) => !v)}>
                {onlyWrong ? '看全部' : `只看错题 (${wrongNums.length})`}
              </button>
            )}
            <button className="btn small" onClick={reset}>
              <RotateCcw size={13} /> 重做
            </button>
          </div>
        </div>
      )}

      <div className="q-list">
        {list.map((q) => {
          const selected = answerState.answers[q.num];
          const showAnswer = revealed[q.num] || submitted;
          const showAnalysis = analysis[q.num];
          const isWrong = submitted && q.answer && selected && selected !== q.answer;
          const isRight = submitted && q.answer && selected === q.answer;
          return (
            <div
              key={q.num}
              className={cn('q-card', isRight && 'q-card-right', isWrong && 'q-card-wrong')}
              ref={(el) => {
                cardRefs.current[q.num] = el;
              }}
            >
              <div className="q-card-head">
                <span className="q-card-num">{q.num}</span>
                <p className="q-stem">
                  <StemText text={q.stem} />
                </p>
                <button
                  className={cn('q-mark', answerState.marked.includes(q.num) && 'active')}
                  onClick={() => onMark(q.num)}
                  aria-label="标记此题"
                  title="标记此题，稍后回看"
                >
                  <Bookmark size={15} fill={answerState.marked.includes(q.num) ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="q-options">
                {q.options.map((opt, i) => {
                  const letter = 'ABCD'[i];
                  const isSelected = selected === letter;
                  const isCorrect = showAnswer && q.answer === letter;
                  const isSelectedWrong = submitted && isSelected && q.answer && q.answer !== letter;
                  return (
                    <button
                      key={letter}
                      className={cn(
                        'q-option',
                        isSelected && 'selected',
                        isCorrect && 'correct',
                        isSelectedWrong && 'wrong',
                      )}
                      onClick={() => !submitted && onSelect(q.num, letter)}
                      disabled={submitted}
                      aria-pressed={isSelected}
                    >
                      <span className="q-letter">
                        {isCorrect && showAnswer ? <Check size={13} /> : isSelectedWrong ? <X size={13} /> : letter}
                      </span>
                      <span className="q-option-text">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="q-card-foot">
                <span className="q-my-answer">
                  我的答案：
                  <b>{selected || '未作答'}</b>
                </span>
                <div className="q-tools">
                  {q.answer && (
                    <button
                      className={cn('q-tool', showAnswer && 'active')}
                      onClick={() => setRevealed((r) => ({ ...r, [q.num]: !r[q.num] }))}
                    >
                      <Eye size={13} /> 答案
                    </button>
                  )}
                  <button
                    className={cn('q-tool', showAnalysis && 'active')}
                    onClick={() => setAnalysis((a) => ({ ...a, [q.num]: !a[q.num] }))}
                  >
                    <Lightbulb size={13} /> 解析
                  </button>
                </div>
              </div>

              {showAnswer && q.answer && (
                <div className="q-answer-line">
                  <span>
                    正确答案 <b>{q.answer}</b>
                  </span>
                  {selected && (
                    <span className={selected === q.answer ? 'ok' : 'bad'}>
                      {selected === q.answer ? '回答正确' : `你选了 ${selected}`}
                    </span>
                  )}
                </div>
              )}

              {showAnalysis && (
                <div className="q-analysis">
                  {q.explanation ? (
                    <p>{q.explanation}</p>
                  ) : (
                    <p className="muted">
                      {q.answer
                        ? `参考答案为 ${q.answer}。本篇暂无详细解析，可回到原文定位依据句。`
                        : '本篇暂无标准答案与解析，可先记录自己的理解，再与同学或老师核对。'}
                    </p>
                  )}
                  {q.evidence && (
                    <div className="q-evidence">
                      <span>原文依据：{q.evidence}</span>
                      {onLocate && (
                        <button className="btn small ghost" onClick={() => onLocate(q.evidence!)}>
                          <LocateFixed size={13} /> 定位原文
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="q-submit-bar">
        <div>
          <b>
            {answeredCount}/{questions.length}
          </b>
          <span>{submitted ? '已提交' : '已作答'}</span>
        </div>
        {submitted ? (
          <button className="btn small" onClick={reset}>
            <RotateCcw size={14} /> 再做一次
          </button>
        ) : (
          <button className="btn small primary" onClick={submit} disabled={answeredCount === 0}>
            <Send size={14} /> 提交答案
          </button>
        )}
      </div>
    </div>
  );
}
