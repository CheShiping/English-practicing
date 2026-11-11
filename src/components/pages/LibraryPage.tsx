'use client';

import { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Brain,
  Briefcase,
  CheckCircle2,
  Clock3,
  Feather,
  FileText,
  GraduationCap,
  HeartPulse,
  Search,
  SlidersHorizontal,
  Layers,
  Landmark,
  Leaf,
  Plane,
  Users,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { useAllArticles } from '@/lib/use-articles';
import { CATEGORIES, searchArticles } from '@/lib/data';
import { hrefFor } from '@/lib/router';
import ChipScroller from '@/components/ChipScroller';
import type { Article } from '@/lib/types';

const CAT_ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  health: HeartPulse,
  nature: Leaf,
  mind: Brain,
  education: GraduationCap,
  career: Briefcase,
  society: Users,
  travel: Plane,
  culture: Landmark,
  story: Feather,
  practical: FileText,
};

type SortKey = 'default' | 'words' | 'questions' | 'progress';

export default function LibraryPage({ catId }: { catId?: string }) {
  const articles = useAllArticles();
  const { progress, bookmarks, toggleBookmark } = useApp();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('default');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  const activeCat = CATEGORIES.find((c) => c.id === catId);

  const filtered = useMemo(() => {
    let list = articles;
    if (catId && CATEGORIES.some((c) => c.id === catId)) {
      list = list.filter((a) => a.catId === catId);
    }
    if (onlyBookmarks) list = list.filter((a) => bookmarks.includes(a.id));
    const q = query.trim();
    if (q) list = searchArticles(list, q);
    const sorted = [...list];
    if (sort === 'words') sorted.sort((a, b) => b.wordCount - a.wordCount);
    if (sort === 'questions') sorted.sort((a, b) => b.questions.length - a.questions.length);
    if (sort === 'progress') {
      sorted.sort((a, b) => (progress[b.id]?.percent || 0) - (progress[a.id]?.percent || 0));
    }
    return sorted;
  }, [articles, catId, onlyBookmarks, query, sort, bookmarks, progress]);

  const doneCount = filtered.filter((a) => progress[a.id]?.completed).length;

  return (
    <div className="page library-page">
      <div className="library-head">
        <div>
          <span className="eyebrow">The library</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            {activeCat ? activeCat.name : '文章库'}
          </h1>
          <p className="section-sub">
            {activeCat?.description ||
              '按题材整理的精读文章。每篇都配有题目、解析、可查词与可标注的原文。'}
          </p>
        </div>
        <div className="library-head-stats">
          <div>
            <b>{filtered.length}</b>
            <span>篇文章</span>
          </div>
          <div>
            <b>{doneCount}</b>
            <span>已完成</span>
          </div>
          <div>
            <b>{filtered.reduce((s, a) => s + a.questions.length, 0)}</b>
            <span>道题</span>
          </div>
        </div>
      </div>

      <div className="library-toolbar">
        <ChipScroller className="cat-chips" activeKey={catId || 'all'}>
          <a
            href={hrefFor('/library')}
            className={!catId ? 'cat-chip active' : 'cat-chip'}
            aria-current={!catId ? 'page' : undefined}
            data-active={!catId ? 'true' : undefined}
          >
            <Layers size={14} /> 全部
            <span>{articles.length}</span>
          </a>
          {CATEGORIES.map((c) => {
            const Icon = CAT_ICONS[c.id] || Layers;
            const count = articles.filter((a) => a.catId === c.id).length;
            return (
              <a
                key={c.id}
                href={hrefFor(`/library/${c.id}`)}
                className={catId === c.id ? 'cat-chip active' : 'cat-chip'}
                aria-current={catId === c.id ? 'page' : undefined}
                data-active={catId === c.id ? 'true' : undefined}
              >
                <Icon size={14} /> {c.name}
                <span>{count}</span>
              </a>
            );
          })}
        </ChipScroller>

        <div className="library-filters">
          <label className="search-box">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索标题、题材或关键词…"
              aria-label="搜索文章"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="清除搜索">
                ×
              </button>
            )}
          </label>
          <label className="sort-box">
            <SlidersHorizontal size={14} />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="排序方式">
              <option value="default">默认排序</option>
              <option value="words">按词数</option>
              <option value="questions">按题量</option>
              <option value="progress">按进度</option>
            </select>
          </label>
          <button
            type="button"
            className={onlyBookmarks ? 'filter-toggle active' : 'filter-toggle'}
            onClick={() => setOnlyBookmarks((v) => !v)}
            aria-pressed={onlyBookmarks}
          >
            <Bookmark size={14} /> 只看收藏
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={26} />
          <h3>这里还没有文章</h3>
          <p>换个关键词，或者去导入一篇你自己的文章。</p>
          <a className="btn primary" href={hrefFor('/import')}>
            导入文章 <ArrowRight size={15} />
          </a>
        </div>
      ) : (
        <div className="lib-grid">
          {filtered.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article: a }: { article: Article }) {
  const { progress, bookmarks, toggleBookmark } = useApp();
  const p = progress[a.id];
  const saved = bookmarks.includes(a.id);
  const cat = CATEGORIES.find((c) => c.id === a.catId);
  const Icon = CAT_ICONS[a.catId] || Layers;

  return (
    <a className="lib-card" href={hrefFor(`/read/${a.id}`)}>
      <div className="lib-card-top" style={{ ['--cat-color' as string]: cat?.color || 'var(--accent)' }}>
        <span className="lib-cat">
          <Icon size={13} /> {a.catName}
        </span>
        <span className="lib-num">No. {String(a.number).padStart(2, '0')}</span>
        <button
          type="button"
          className={saved ? 'lib-bookmark saved' : 'lib-bookmark'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleBookmark(a.id);
          }}
          aria-label={saved ? '取消收藏' : '收藏文章'}
          title={saved ? '取消收藏' : '收藏文章'}
        >
          {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      <h3 className="lib-title">{a.title}</h3>
      <div className="lib-sub">{a.subtitle || `Passage ${a.number}`}</div>
      {a.summary && <p className="lib-summary">{a.summary}</p>}

      <div className="lib-tags">
        {(a.tags || []).slice(0, 3).map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
        {a.source === 'imported' && <span className="tag" style={{ color: 'var(--accent)' }}>导入</span>}
      </div>

      <div className="lib-meta">
        <span>
          <Clock3 size={12} /> {Math.max(3, Math.round(a.wordCount / 150))} 分钟
        </span>
        <span>{a.wordCount} words</span>
        <span>{a.questions.length} 题</span>
        <span className="lib-diff">{a.difficulty}</span>
      </div>

      <div className="lib-progress">
        <div className="progress-bar">
          <i style={{ width: `${p?.percent || 0}%` }} />
        </div>
        <span>
          {p?.completed ? (
            <>
              <CheckCircle2 size={12} /> 已完成
            </>
          ) : (
            `${p?.percent || 0}%`
          )}
        </span>
      </div>
    </a>
  );
}
