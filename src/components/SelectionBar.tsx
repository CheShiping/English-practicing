'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Copy, Languages } from 'lucide-react';

interface Props {
  text: string;
  rect: DOMRect;
  onTranslate: () => void;
  onCopy: () => void;
}

/** 练习页题干选区工具条：只保留翻译与复制，样式与阅读器选区条一致 */
export default function SelectionBar({ text, rect, onTranslate, onCopy }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: -999, left: -999 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    let top = rect.top - box.height - 10;
    let left = rect.left + rect.width / 2 - box.width / 2;
    if (top < 10) top = rect.bottom + 10;
    left = Math.max(10, Math.min(left, window.innerWidth - box.width - 10));
    setPos({ top, left });
  }, [rect, text]);

  return (
    <div
      ref={ref}
      className="sel-toolbar"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
      role="toolbar"
      aria-label="选区操作"
    >
      <button className="sel-btn" onClick={onTranslate} title="翻译并解析">
        <Languages size={15} />
        <span>翻译</span>
      </button>
      <span className="sel-sep" />
      <button className="sel-btn icon" onClick={onCopy} title="复制">
        <Copy size={15} />
      </button>
    </div>
  );
}
