'use client';

import { Fragment, useCallback, useRef } from 'react';
import type { Annotation, Article, Block } from '@/lib/types';
import { cn, normalizeWord } from '@/lib/utils';

export interface TextSelection {
  blockIndex: number;
  start: number;
  end: number;
  text: string;
  rect: DOMRect;
}

interface Props {
  article: Article;
  annotations: Annotation[];
  vocabSet: Set<string>;
  highlightVocab: boolean;
  guardMode: boolean;
  showTranslation: boolean;
  onWordClick: (word: string, el: HTMLElement) => void;
  onAnnotationClick: (ann: Annotation, el: HTMLElement) => void;
  onSelect: (sel: TextSelection | null) => void;
  onProgress?: () => void;
}

const WORD_RE = /[A-Za-z][A-Za-z'’\-]*/g;

function buildSegments(text: string, anns: Annotation[]): Array<{ text: string; ann?: Annotation }> {
  const valid = anns
    .filter((a) => a.start >= 0 && a.end <= text.length && a.end > a.start)
    .sort((a, b) => a.start - b.start);
  const out: Array<{ text: string; ann?: Annotation }> = [];
  let cursor = 0;
  for (const a of valid) {
    if (a.start < cursor) continue;
    if (a.start > cursor) out.push({ text: text.slice(cursor, a.start) });
    out.push({ text: text.slice(a.start, a.end), ann: a });
    cursor = a.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

function WordTokens({
  text,
  vocabSet,
  highlightVocab,
  guardMode,
  onWordClick,
}: {
  text: string;
  vocabSet: Set<string>;
  highlightVocab: boolean;
  guardMode: boolean;
  onWordClick: (word: string, el: HTMLElement) => void;
}) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let idx = 0;
  for (const m of text.matchAll(WORD_RE)) {
    const start = m.index ?? 0;
    const raw = m[0];
    if (start > last) parts.push(<Fragment key={`t${idx++}`}>{text.slice(last, start)}</Fragment>);
    const norm = normalizeWord(raw);
    const saved = highlightVocab && norm.length > 1 && vocabSet.has(norm);
    parts.push(
      <span
        key={`w${idx++}`}
        className={cn('w', saved && 'w-saved')}
        data-w={norm}
        onClick={guardMode ? undefined : (e) => {
          e.stopPropagation();
          onWordClick(raw, e.currentTarget);
        }}
        role={guardMode ? undefined : 'button'}
        tabIndex={guardMode ? undefined : 0}
        onKeyDown={
          guardMode
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onWordClick(raw, e.currentTarget);
                }
              }
        }
      >
        {raw}
      </span>,
    );
    last = start + raw.length;
  }
  if (last < text.length) parts.push(<Fragment key={`t${idx++}`}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

export default function ArticleBody({
  article,
  annotations,
  vocabSet,
  highlightVocab,
  guardMode,
  showTranslation,
  onWordClick,
  onAnnotationClick,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const captureSelection = useCallback(() => {
    if (guardMode) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      onSelect(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const anchorNode = range.startContainer;
    const focusNode = range.endContainer;
    const anchorEl =
      anchorNode.nodeType === Node.ELEMENT_NODE
        ? (anchorNode as Element)
        : anchorNode.parentElement;
    const focusEl =
      focusNode.nodeType === Node.ELEMENT_NODE ? (focusNode as Element) : focusNode.parentElement;
    const blockEl = anchorEl?.closest('[data-block-index]') as HTMLElement | null;
    const blockEnd = focusEl?.closest('[data-block-index]') as HTMLElement | null;
    if (!blockEl || !blockEnd || blockEl !== blockEnd) return;
    if (!containerRef.current?.contains(blockEl)) return;
    const text = sel.toString().replace(/\s+/g, ' ').trim();
    if (!text || text.length > 600) {
      onSelect(null);
      return;
    }
    const pre = document.createRange();
    pre.selectNodeContents(blockEl);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const rawText = sel.toString();
    const rect = range.getBoundingClientRect();
    onSelect({
      blockIndex: Number(blockEl.dataset.blockIndex),
      start,
      end: start + rawText.length,
      text: rawText,
      rect,
    });
  }, [guardMode, onSelect]);

  const handleMouseUp = useCallback(() => {
    window.setTimeout(captureSelection, 0);
  }, [captureSelection]);

  const handleTouchEnd = useCallback(() => {
    window.setTimeout(captureSelection, 60);
  }, [captureSelection]);

  const renderTokens = (text: string) => (
    <WordTokens
      text={text}
      vocabSet={vocabSet}
      highlightVocab={highlightVocab}
      guardMode={guardMode}
      onWordClick={onWordClick}
    />
  );

  const renderTable = (block: Block, index: number) => {
    const rows = block.rows || [];
    if (!rows.length) return null;
    const [header, ...body] = rows;
    return (
      <div className="article-table-wrap" key={`table-${index}`}>
        <table className="article-table">
          <thead>
            <tr>
              {header.map((cell, ci) => (
                <th key={ci} scope="col">
                  {renderTokens(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}>{renderTokens(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {header.length > 5 && <div className="article-table-hint">表格可左右滑动查看 →</div>}
      </div>
    );
  };

  const renderBlock = (block: Block, index: number) => {
    const anns = annotations.filter((a) => a.blockIndex === index);
    const segments = buildSegments(block.text, anns);
    const content = segments.map((seg, si) => {
      const inner = (
        <WordTokens
          text={seg.text}
          vocabSet={vocabSet}
          highlightVocab={highlightVocab}
          guardMode={guardMode}
          onWordClick={onWordClick}
        />
      );
      if (!seg.ann) return <Fragment key={`s${si}`}>{inner}</Fragment>;
      const ann = seg.ann;
      return (
        <mark
          key={`s${si}`}
          className={`ann ann-${ann.color}`}
          title={ann.note || '点击编辑批注'}
          onClick={(e) => {
            e.stopPropagation();
            onAnnotationClick(ann, e.currentTarget);
          }}
        >
          {inner}
          <sup className="ann-dot" aria-hidden="true" />
        </mark>
      );
    });

    const isSource = /^[—–-]{2,}\s*(Taken|From|Adapted)/i.test(block.text);
    const translation =
      showTranslation && block.translation ? (
        <div className="block-translation">{block.translation}</div>
      ) : null;

    if (block.type === 'li') {
      return (
        <li key={index} data-block-index={index} className="article-li">
          {content}
          {showTranslation && block.translation && (
            <div className="block-translation li-translation">{block.translation}</div>
          )}
        </li>
      );
    }
    return (
      <Fragment key={index}>
        <p
          data-block-index={index}
          className={isSource ? 'article-p article-source' : 'article-p'}
        >
          {content}
        </p>
        {translation}
      </Fragment>
    );
  };

  const nodes: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  const flushList = (key: string) => {
    if (listBuffer.length) {
      nodes.push(
        <ul className="article-ul" key={`ul-${key}`}>
          {listBuffer}
        </ul>,
      );
      listBuffer = [];
    }
  };

  article.blocks.forEach((block, i) => {
    if (block.type === 'table') {
      flushList(String(i));
      nodes.push(renderTable(block, i));
    } else if (block.type === 'li') {
      listBuffer.push(renderBlock(block, i));
    } else {
      flushList(String(i));
      nodes.push(renderBlock(block, i));
    }
  });
  flushList('end');

  return (
    <div
      className="article-body"
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
    >
      {nodes}
    </div>
  );
}
