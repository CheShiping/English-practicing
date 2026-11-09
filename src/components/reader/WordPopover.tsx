'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Check,
  Copy,
  Languages,
  Volume2,
  X,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { LookupResult } from '@/lib/dict';
import { lookupWord, parseTags, speakWord } from '@/lib/dict';
import { translateText } from '@/lib/translate';
import { useApp } from '@/state/AppProvider';
import { cn } from '@/lib/utils';
import type { Article } from '@/lib/types';

interface Props {
  word: string;
  anchor: DOMRect;
  article?: Article;
  onClose: () => void;
}

function rankLabel(rank?: number): string {
  if (!rank) return '';
  if (rank <= 1200) return '高频词';
  if (rank <= 3500) return '常用词';
  if (rank <= 7000) return '进阶词';
  return '拓展词';
}

export default function WordPopover({ word, anchor, article, onClose }: Props) {
  const { vocab, addWord, removeWord, toast } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState('');
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setResult(null);
    setOnline('');
    setOnlineError('');
    lookupWord(word).then((r) => {
      if (!alive) return;
      setResult(r);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [word]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pop = el.getBoundingClientRect();
    const gap = 10;
    let top = anchor.top - pop.height - gap;
    let left = anchor.left + anchor.width / 2 - pop.width / 2;
    if (top < 12) top = anchor.bottom + gap;
    if (top + pop.height > window.innerHeight - 12) top = Math.max(12, window.innerHeight - pop.height - 12);
    left = Math.max(12, Math.min(left, window.innerWidth - pop.width - 12));
    setPos({ top, left });
  }, [anchor, result, loading, online]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onDown);
      document.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const savedWord = result?.base || word;
  const saved = vocab.some((v) => v.word === savedWord);
  const meaning = online || result?.meaning || '';
  const tags = parseTags(result?.tag);

  const handleAdd = () => {
    if (!result) return;
    const ok = addWord({
      word: result.base,
      phonetic: result.phonetic,
      meaning: meaning.split('\n').slice(0, 3).join('；'),
      tag: result.tag,
      articleId: article?.id,
      articleTitle: article?.title,
    });
    if (ok) {
      toast(`已加入生词本：${result.base}`, 'success');
    } else {
      toast('这个词已经在生词本里了');
    }
  };

  const handleOnline = async () => {
    setOnlineLoading(true);
    setOnlineError('');
    const r = await translateText(word);
    setOnlineLoading(false);
    if (r.error) setOnlineError(r.error);
    else setOnline(r.text);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${word}${meaning ? '  ' + meaning.split('\n')[0] : ''}`);
      toast('已复制', 'success');
    } catch {
      toast('复制失败，请手动选择', 'error');
    }
  };

  return (
    <div
      ref={ref}
      className="word-pop"
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
      aria-label={`${word} 的释义`}
    >
      <div className="wp-head">
        <div>
          <div className="wp-word-row">
            <span className="wp-word">{word}</span>
            {tags.map((t) => (
              <span className="wp-tag" key={t}>
                {t}
              </span>
            ))}
            {result && rankLabel(result.rank) && (
              <span className="wp-tag ghost">{rankLabel(result.rank)}</span>
            )}
          </div>
          <div className="wp-phon-row">
            {result?.phonetic ? <span className="wp-phon">/{result.phonetic}/</span> : <span />}
            {result && !result.isBaseForm && (
              <span className="wp-base">
                原形 <b>{result.base}</b>
              </span>
            )}
          </div>
        </div>
        <button className="wp-close" onClick={onClose} aria-label="关闭词典">
          <X size={15} />
        </button>
      </div>

      <div className="wp-audio-row">
        <button onClick={() => speakWord(word, 'uk')} title="英式发音">
          <Volume2 size={13} /> UK
        </button>
        <button onClick={() => speakWord(word, 'us')} title="美式发音">
          <Volume2 size={13} /> US
        </button>
        <button onClick={copy} title="复制释义">
          <Copy size={13} /> 复制
        </button>
      </div>

      <div className="wp-meaning">
        {loading ? (
          <div className="wp-loading">
            <Loader2 size={15} className="spin" /> 正在查词…
          </div>
        ) : meaning ? (
          meaning
            .split('\n')
            .filter(Boolean)
            .slice(0, 6)
            .map((line, i) => (
              <p key={i} className={cn('wp-line', i === 0 && 'first')}>
                {line}
              </p>
            ))
        ) : (
          <div className="wp-empty">
            <p>本地词典暂未收录这个词。</p>
            {!online && (
              <button className="btn small" onClick={handleOnline} disabled={onlineLoading}>
                {onlineLoading ? <Loader2 size={13} className="spin" /> : <Languages size={13} />}
                在线翻译
              </button>
            )}
            {onlineError && <p className="wp-error">{onlineError}</p>}
          </div>
        )}
      </div>

      <div className="wp-actions">
        {saved ? (
          <button className="btn small" onClick={() => removeWord(savedWord)}>
            <Trash2 size={13} /> 移出生词本
          </button>
        ) : (
          <button className="btn small primary" onClick={handleAdd} disabled={!result || !meaning}>
            {saved ? <Check size={13} /> : <BookmarkPlus size={13} />} 加入生词本
          </button>
        )}
        <button className="btn small ghost" onClick={() => speakWord(result?.base || word)}>
          <Volume2 size={13} /> 朗读
        </button>
      </div>
    </div>
  );
}
