'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Copy,
  Languages,
  Loader2,
  StickyNote,
  Volume2,
  X,
} from 'lucide-react';
import type { SentenceAnalysis } from '@/lib/translate';
import { analyzeSentence } from '@/lib/translate';
import type { HighlightColor } from '@/lib/types';
import { speakWord } from '@/lib/dict';

const COLORS: Array<{ key: HighlightColor; label: string; hex: string }> = [
  { key: 'yellow', label: '黄色高亮', hex: '#f2d675' },
  { key: 'green', label: '绿色高亮', hex: '#a9cfa9' },
  { key: 'blue', label: '蓝色高亮', hex: '#a9c4e0' },
  { key: 'pink', label: '粉色高亮', hex: '#e8b3c2' },
];

export interface SelectionInfo {
  text: string;
  rect: DOMRect;
  isWord: boolean;
}

export function SelectionToolbar({
  selection,
  onHighlight,
  onNote,
  onTranslate,
  onCopy,
  onAddWord,
}: {
  selection: SelectionInfo;
  onHighlight: (color: HighlightColor) => void;
  onNote: () => void;
  onTranslate: () => void;
  onCopy: () => void;
  onAddWord: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: -999, left: -999 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    let top = selection.rect.top - box.height - 10;
    let left = selection.rect.left + selection.rect.width / 2 - box.width / 2;
    if (top < 10) top = selection.rect.bottom + 10;
    left = Math.max(10, Math.min(left, window.innerWidth - box.width - 10));
    setPos({ top, left });
  }, [selection]);

  return (
    <div
      ref={ref}
      className="sel-toolbar"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
      role="toolbar"
      aria-label="选区操作"
    >
      <div className="sel-colors">
        {COLORS.map((c) => (
          <button
            key={c.key}
            className="sel-color"
            style={{ background: c.hex }}
            title={c.label}
            aria-label={c.label}
            onClick={() => onHighlight(c.key)}
          />
        ))}
      </div>
      <span className="sel-sep" />
      <button className="sel-btn" onClick={onNote} title="添加批注">
        <StickyNote size={15} />
        <span>批注</span>
      </button>
      <button className="sel-btn" onClick={onTranslate} title="翻译并解析">
        <Languages size={15} />
        <span>翻译</span>
      </button>
      {selection.isWord && (
        <button className="sel-btn" onClick={onAddWord} title="加入生词本">
          <BookmarkPlus size={15} />
          <span>生词</span>
        </button>
      )}
      <button className="sel-btn icon" onClick={onCopy} title="复制">
        <Copy size={15} />
      </button>
    </div>
  );
}

export function SelectionAnalysisModal({
  text,
  fallbackTranslation,
  onClose,
}: {
  text: string;
  fallbackTranslation?: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<SentenceAnalysis | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setData(null);
    analyzeSentence(text).then((r) => {
      if (!alive) return;
      setData(r);
      if (r.translationError && !fallbackTranslation) setError(r.translationError);
    });
    return () => {
      alive = false;
    };
  }, [text, fallbackTranslation]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const preferFallback = !!fallbackTranslation && text.length > 140;
  const translation = preferFallback
    ? fallbackTranslation
    : data?.translation || fallbackTranslation || '';

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal analysis-modal" role="dialog" aria-modal="true" aria-label="句子翻译与解析">
        <div className="modal-head">
          <div>
            <span className="eyebrow">Sentence lab</span>
            <h3>翻译与句法提示</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div className="analysis-source">
            <p>{text}</p>
            <div className="analysis-source-actions">
              <button className="btn small ghost" onClick={() => speakWord(text)}>
                <Volume2 size={13} /> 朗读
              </button>
              <button
                className="btn small ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(text);
                }}
              >
                <Copy size={13} /> 复制
              </button>
            </div>
          </div>

          <div className="analysis-block">
            <div className="analysis-label">参考译文</div>
            {!data && <div className="analysis-loading"><Loader2 size={15} className="spin" /> 正在翻译…</div>}
            {data && translation && <p className="analysis-translation">{translation}</p>}
            {!translation && error && (
              <p className="analysis-error">
                {error}
                {fallbackTranslation ? '' : '（可稍后重试，或查阅本段译文）'}
              </p>
            )}
            {(preferFallback || (fallbackTranslation && !data?.translation)) && (
              <p className="analysis-fallback-note">以上为本段参考译文，仅作理解辅助。</p>
            )}
          </div>

          {data?.words && data.words.length > 0 && (
            <div className="analysis-block">
              <div className="analysis-label">重点词汇</div>
              <div className="analysis-words">
                {data.words.map((w) => (
                  <div className="analysis-word" key={w.word}>
                    <b>{w.word}</b>
                    <span>{w.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.structures && data.structures.length > 0 && (
            <div className="analysis-block">
              <div className="analysis-label">句法提示</div>
              <ul className="analysis-structures">
                {data.structures.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="analysis-tip">
                共识别到约 {data.clauses} 个分句/停顿。先找主谓宾，再看从句修饰谁。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
