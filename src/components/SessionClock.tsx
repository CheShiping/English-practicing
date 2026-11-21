'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/state/AppProvider';
import { formatDuration } from '@/lib/utils';

/**
 * 自动计时会话的实时读数。
 * 时间在组件内按秒刷新，避免整棵页面树跟着时钟重渲染。
 */
export default function SessionClock({
  fallback = '00:00',
  className,
}: {
  fallback?: string;
  className?: string;
}) {
  const { session } = useApp();
  const [, tick] = useState(0);
  const running = Boolean(session && session.startedAt != null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => tick((v) => (v + 1) % 1000), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  if (!session) return <span className={className}>{fallback}</span>;

  const ms = session.accumulated + (session.startedAt != null ? Math.max(0, Date.now() - session.startedAt) : 0);
  return <span className={className}>{formatDuration(ms)}</span>;
}
