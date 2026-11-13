'use client';

import { Fragment } from 'react';

const WORD_RE = /[A-Za-z][A-Za-z'’\-]*/g;

interface Props {
  text: string;
  onWordClick: (word: string, el: HTMLElement) => void;
}

/** 把一段英文渲染成可点词的形式，点词后交给调用方弹出词典 */
export default function WordText({ text, onWordClick }: Props) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let idx = 0;

  for (const m of text.matchAll(WORD_RE)) {
    const start = m.index ?? 0;
    const raw = m[0];
    if (start > last) parts.push(<Fragment key={`t${idx++}`}>{text.slice(last, start)}</Fragment>);
    parts.push(
      <span
        key={`w${idx++}`}
        className="w"
        onClick={(e) => {
          e.stopPropagation();
          onWordClick(raw, e.currentTarget);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onWordClick(raw, e.currentTarget);
          }
        }}
      >
        {raw}
      </span>,
    );
    last = start + raw.length;
  }

  if (last < text.length) parts.push(<Fragment key={`t${idx++}`}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}
