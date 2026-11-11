'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';

interface ChipScrollerProps {
  className?: string;
  activeKey?: string;
  children: ReactNode;
}

// 横向滚动的分类条：切换分类后把当前按钮自动滑到可视区中间。
export default function ChipScroller({ className, activeKey, children }: ChipScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);

  const center = useCallback((behavior: ScrollBehavior) => {
    const wrap = ref.current;
    if (!wrap) return;
    const active = wrap.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    const wrapRect = wrap.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const delta = activeRect.left - wrapRect.left - (wrapRect.width - activeRect.width) / 2;
    const max = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    wrap.scrollTo({
      left: Math.max(0, Math.min(wrap.scrollLeft + delta, max)),
      behavior,
    });
  }, []);

  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => center('smooth'));
    });
    return () => cancelAnimationFrame(raf);
  }, [activeKey, center]);

  useEffect(() => {
    const onResize = () => center('auto');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [center]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
