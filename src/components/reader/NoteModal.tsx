'use client';

import { useEffect, useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import type { Annotation, Article, HighlightColor } from '@/lib/types';
import { useApp } from '@/state/AppProvider';
import { cn } from '@/lib/utils';

const COLORS: Array<{ key: HighlightColor; label: string }> = [
  { key: 'yellow', label: '重点' },
  { key: 'green', label: '理解' },
  { key: 'blue', label: '疑问' },
  { key: 'pink', label: '积累' },
];

interface Props {
  article: Article;
  annotation?: Annotation;
  draft?: { blockIndex: number; start: number; end: number; text: string };
  onClose: () => void;
}

export default function NoteModal({ article, annotation, draft, onClose }: Props) {
  const { addAnnotation, updateAnnotation, removeAnnotation, toast } = useApp();
  const [note, setNote] = useState(annotation?.note || '');
  const [color, setColor] = useState<HighlightColor>(annotation?.color || 'yellow');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const quote = annotation?.text || draft?.text || '';

  const save = () => {
    if (annotation) {
      updateAnnotation(annotation.id, { note: note.trim(), color });
      toast('批注已更新', 'success');
    } else if (draft) {
      addAnnotation({
        articleId: article.id,
        blockIndex: draft.blockIndex,
        start: draft.start,
        end: draft.end,
        text: draft.text,
        color,
        note: note.trim(),
      });
      toast('已添加批注', 'success');
    }
    onClose();
  };

  const remove = () => {
    if (annotation) {
      removeAnnotation(annotation.id);
      toast('批注已删除');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal note-modal" role="dialog" aria-modal="true" aria-label="批注">
        <div className="modal-head">
          <div>
            <span className="eyebrow">{annotation ? 'Edit note' : 'New note'}</span>
            <h3>{annotation ? '编辑批注' : '添加批注'}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <blockquote className="note-quote">“{quote}”</blockquote>

          <div className="note-colors">
            {COLORS.map((c) => (
              <button
                key={c.key}
                className={cn('note-color', `note-color-${c.key}`, color === c.key && 'active')}
                onClick={() => setColor(c.key)}
                aria-pressed={color === c.key}
              >
                <i />
                {c.label}
              </button>
            ))}
          </div>

          <label className="note-field">
            <span>写下你的理解、疑问或积累（可留空，只做高亮）</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              placeholder="例如：这里的 however 转折的是上一段的观点…"
              autoFocus
            />
          </label>
        </div>
        <div className="modal-foot">
          {annotation ? (
            <button className="btn small danger" onClick={remove}>
              <Trash2 size={14} /> 删除
            </button>
          ) : (
            <span className="modal-hint">批注会保存在本篇的「批注」面板里</span>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn small ghost" onClick={onClose}>
              取消
            </button>
            <button className="btn small primary" onClick={save}>
              <Save size={14} /> 保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
