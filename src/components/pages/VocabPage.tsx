'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { cn, relativeTime } from '@/lib/utils';
import { hrefFor } from '@/lib/router';
import { speakWord } from '@/lib/dict';
import type { ReviewRating } from '@/state/AppProvider';
import type { VocabWord } from '@/lib/types';

type Filter = 'all' | 'due' | 'new' | 'mastered';

export default function VocabPage() {
  const { vocab, removeWord, reviewWord, toast } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<'new' | 'alpha' | 'mastery'>('new');
  const [reviewOpen, setReviewOpen] = useState(false);

  const now = Date.now();
  const due = vocab.filter((w) => (w.nextReviewAt || 0) <= now);
  const mastered = vocab.filter((w) => w.mastery >= 4);
  const thisWeek = vocab.filter((w) => w.createdAt > now - 7 * 86400000);

  const list = useMemo(() => {
    let out = [...vocab];
    if (filter === 'due') out = out.filter((w) => (w.nextReviewAt || 0) <= now);
    if (filter === 'new') out = out.filter((w) => w.reviewCount === 0);
    if (filter === 'mastered') out = out.filter((w) => w.mastery >= 4);
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (w) => w.word.includes(q) || (w.meaning || '').toLowerCase().includes(q),
      );
    }
    if (sort === 'alpha') out.sort((a, b) => a.word.localeCompare(b.word));
    else if (sort === 'mastery') out.sort((a, b) => a.mastery - b.mastery);
    else out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  }, [vocab, filter, query, sort, now]);

  const exportCsv = () => {
    if (!vocab.length) return;
    const rows = [
      ['word', 'phonetic', 'meaning', 'source', 'mastery', 'reviewCount', 'addedAt'],
      ...vocab.map((w) => [
        w.word,
        w.phonetic || '',
        (w.meaning || '').replace(/\n/g, ' '),
        w.articleTitle || '',
        String(w.mastery),
        String(w.reviewCount),
        new Date(w.createdAt).toISOString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `墨读生词本-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('生词本已导出', 'success');
  };

  return (
    <div className="page vocab-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Your wordbook</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            生词本
          </h1>
          <p className="section-sub">从阅读中收进来的词，按记忆节奏复习，才会真正留下来。</p>
        </div>
        <div className="page-head-actions">
          <button className="btn" onClick={exportCsv} disabled={!vocab.length}>
            <Download size={15} /> 导出 CSV
          </button>
          <button className="btn primary" onClick={() => setReviewOpen(true)} disabled={!vocab.length}>
            <Play size={15} /> 开始复习
            {due.length > 0 && <span className="btn-badge">{due.length}</span>}
          </button>
        </div>
      </div>

      <div className="vocab-summary">
        <div className="vocab-sum-card">
          <BookMarked size={18} />
          <b>{vocab.length}</b>
          <span>全部生词</span>
        </div>
        <div className="vocab-sum-card due">
          <Clock3 size={18} />
          <b>{due.length}</b>
          <span>待复习</span>
        </div>
        <div className="vocab-sum-card">
          <CheckCircle2 size={18} />
          <b>{mastered.length}</b>
          <span>已掌握</span>
        </div>
        <div className="vocab-sum-card">
          <Sparkles size={18} />
          <b>{thisWeek.length}</b>
          <span>近 7 天新增</span>
        </div>
      </div>

      <div className="vocab-toolbar">
        <label className="search-box">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索单词或释义…" />
          {query && (
            <button onClick={() => setQuery('')} aria-label="清除">
              ×
            </button>
          )}
        </label>
        <div className="segmented small vocab-filters">
          {[
            { key: 'all', label: '全部' },
            { key: 'due', label: '待复习' },
            { key: 'new', label: '新词' },
            { key: 'mastered', label: '已掌握' },
          ].map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? 'active' : ''}
              onClick={() => setFilter(f.key as Filter)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="sort-box">
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="排序">
            <option value="new">最近添加</option>
            <option value="alpha">字母顺序</option>
            <option value="mastery">掌握度</option>
          </select>
        </label>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <BookMarked size={28} />
          <h3>{vocab.length ? '这个筛选下没有单词' : '生词本还是空的'}</h3>
          <p>{vocab.length ? '换一个筛选条件试试。' : '打开一篇文章，点任意单词，把它收进来。'}</p>
          <a className="btn primary" href={hrefFor('/library')}>
            去阅读 <ArrowRight size={15} />
          </a>
        </div>
      ) : (
        <div className="vocab-grid">
          {list.map((w) => (
            <VocabCard
              key={w.word}
              word={w}
              onRemove={() => {
                removeWord(w.word);
                toast('已移出生词本');
              }}
              onMaster={() => {
                reviewWord(w.word, 'easy');
                toast('已标记为熟悉', 'success');
              }}
            />
          ))}
        </div>
      )}

      <div className="vocab-footer-tip">
        <ArrowLeft size={13} />
        <a href={hrefFor('/library')}>回到文章库</a>
        <span className="divider-dot" />
        <span>生词与复习进度只保存在当前浏览器</span>
      </div>

      {reviewOpen && (
        <ReviewModal
          queue={[...vocab].sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))}
          onClose={() => setReviewOpen(false)}
          onRate={(word, rating) => reviewWord(word, rating)}
        />
      )}
    </div>
  );
}

function VocabCard({ word, onRemove, onMaster }: { word: VocabWord; onRemove: () => void; onMaster: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('vocab-card', open && 'open')}>
      <div className="vocab-card-head">
        <button className="vocab-word" onClick={() => setOpen((v) => !v)}>
          <b>{word.word}</b>
          {word.phonetic && <span>/{word.phonetic}/</span>}
        </button>
        <div className="vocab-card-actions">
          <button onClick={() => speakWord(word.word)} aria-label="朗读">
            <Volume2 size={14} />
          </button>
          <button onClick={onRemove} aria-label="删除">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <button className="vocab-meaning" onClick={() => setOpen((v) => !v)}>
        {(word.meaning || '暂无释义').split('\n').slice(0, open ? 6 : 2).join('\n')}
      </button>
      <div className="vocab-card-foot">
        <div className="mastery-dots" title={`掌握度 ${word.mastery}/5`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} className={i < word.mastery ? 'on' : ''} />
          ))}
        </div>
        <span className="vocab-source">
          {word.articleTitle ? (
            <a href={hrefFor(`/read/${word.articleId}`)}>{word.articleTitle}</a>
          ) : (
            '手动添加'
          )}
        </span>
        <span className="vocab-date">{relativeTime(word.createdAt)}</span>
        <button className="vocab-master-btn" onClick={onMaster} title="标记为熟悉">
          <Check size={12} />
        </button>
      </div>
    </div>
  );
}

function ReviewModal({
  queue,
  onClose,
  onRate,
}: {
  queue: VocabWord[];
  onClose: () => void;
  onRate: (word: string, rating: ReviewRating) => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState({ again: 0, good: 0, easy: 0 });
  const current = queue[index];
  const done = index >= queue.length;

  const rate = (r: ReviewRating) => {
    if (!current) return;
    onRate(current.word, r);
    setCounts((c) => ({ ...c, [r]: c[r] + 1 }));
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal review-modal" role="dialog" aria-modal="true" aria-label="生词复习">
        <div className="modal-head">
          <div>
            <span className="eyebrow">Spaced review</span>
            <h3>生词复习</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="review-done">
            <div className="review-done-icon">
              <CheckCircle2 size={36} />
            </div>
            <h4>这一轮复习完成</h4>
            <p>
              共复习 {queue.length} 个词 · 忘了 {counts.again} · 一般 {counts.good} · 很熟 {counts.easy}
            </p>
            <div className="review-done-actions">
              <button className="btn" onClick={() => { setIndex(0); setRevealed(false); setCounts({ again: 0, good: 0, easy: 0 }); }}>
                <RotateCcw size={14} /> 再来一轮
              </button>
              <button className="btn primary" onClick={onClose}>
                完成
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="review-progress">
              <div className="progress-bar">
                <i style={{ width: `${(index / queue.length) * 100}%` }} />
              </div>
              <span>
                {index + 1} / {queue.length}
              </span>
            </div>

            <div className="review-card">
              <div className="review-word">{current.word}</div>
              {current.phonetic && <div className="review-phon">/{current.phonetic}/</div>}
              <button className="review-speak" onClick={() => speakWord(current.word)}>
                <Volume2 size={15} /> 听发音
              </button>
              {revealed ? (
                <div className="review-meaning">
                  {(current.meaning || '暂无释义').split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  {current.articleTitle && <span>来自《{current.articleTitle}》</span>}
                </div>
              ) : (
                <button className="review-reveal" onClick={() => setRevealed(true)}>
                  <Loader2 size={15} /> 想一下，再点开释义
                </button>
              )}
            </div>

            <div className="review-actions">
              {revealed ? (
                <>
                  <button className="review-rate again" onClick={() => rate('again')}>
                    忘了 <small>10 分钟后再来</small>
                  </button>
                  <button className="review-rate good" onClick={() => rate('good')}>
                    一般 <small>明天复习</small>
                  </button>
                  <button className="review-rate easy" onClick={() => rate('easy')}>
                    很熟 <small>过几天再见</small>
                  </button>
                </>
              ) : (
                <button className="btn primary" onClick={() => setRevealed(true)}>
                  显示释义
                </button>
              )}
            </div>
            <p className="review-hint">键盘：空格显示释义 · 1 忘了 · 2 一般 · 3 很熟</p>
          </>
        )}
      </div>
    </div>
  );
}
