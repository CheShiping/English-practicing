'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Languages,
  MoreHorizontal,
  Settings2,
  Timer as TimerIcon,
} from 'lucide-react';
import type { Article } from '@/lib/types';
import { cn, formatDuration } from '@/lib/utils';
import { useApp } from '@/state/AppProvider';
import { hrefFor } from '@/lib/router';

interface Props {
  article: Article;
  percent: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTimer: () => void;
  onTranslate: () => void;
  onSettings: () => void;
}

export default function ReaderBar({
  article,
  percent,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onTimer,
  onTranslate,
  onSettings,
}: Props) {
  const { bookmarks, toggleBookmark, timer, timerElapsed, timerRemaining, toast } = useApp();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bookmarked = bookmarks.includes(article.id);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menu]);

  return (
    <header className="reader-bar">
      <div className="reader-bar-progress">
        <i style={{ width: `${percent}%` }} />
      </div>
      <div className="reader-bar-inner">
        <a className="reader-back" href={hrefFor(`/library/${article.catId}`)} aria-label="返回文章库">
          <ArrowLeft size={18} />
        </a>

        <div className="reader-bar-title">
          <span className="reader-bar-cat">{article.catName}</span>
          <span className="reader-bar-name">{article.title}</span>
        </div>

        <div className="reader-bar-actions">
          <button
            className={cn('rb-btn', timer.status !== 'idle' && 'active')}
            onClick={onTimer}
            title="阅读计时"
          >
            <TimerIcon size={15} />
            <span className="rb-label">
              {timer.status === 'idle'
                ? '计时'
                : formatDuration(timer.mode === 'down' ? timerRemaining : timerElapsed)}
            </span>
          </button>

          <button className="rb-btn" onClick={onTranslate} title="全文翻译">
            <Languages size={15} />
            <span className="rb-label">翻译</span>
          </button>

          <button className="rb-btn" onClick={onSettings} title="阅读排版">
            <Settings2 size={15} />
            <span className="rb-label">排版</span>
          </button>

          <button
            className={cn('rb-btn', bookmarked && 'active')}
            onClick={() => {
              toggleBookmark(article.id);
              toast(bookmarked ? '已取消收藏' : '已收藏这篇', 'success');
            }}
            title={bookmarked ? '取消收藏' : '收藏文章'}
          >
            {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            <span className="rb-label">{bookmarked ? '已收藏' : '收藏'}</span>
          </button>

          <div className="rb-nav">
            <button onClick={onPrev} disabled={!hasPrev} title="上一篇" aria-label="上一篇">
              <ChevronLeft size={16} />
            </button>
            <button onClick={onNext} disabled={!hasNext} title="下一篇" aria-label="下一篇">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="rb-more" ref={menuRef}>
            <button
              className="rb-btn icon-only"
              onClick={() => setMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-label="更多操作"
            >
              <MoreHorizontal size={18} />
            </button>
            {menu && (
              <div className="rb-menu" role="menu">
                <button onClick={() => { onPrev(); setMenu(false); }} disabled={!hasPrev}>
                  上一篇
                </button>
                <button onClick={() => { onNext(); setMenu(false); }} disabled={!hasNext}>
                  下一篇
                </button>
                <a href={hrefFor('/library')}>返回文章库</a>
                <a href={hrefFor('/import')}>导入文章</a>
                <a href={hrefFor('/settings')}>数据与设置</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
