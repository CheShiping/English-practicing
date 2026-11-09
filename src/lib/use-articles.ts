'use client';

import { useMemo } from 'react';
import { BUNDLED_ARTICLES } from '@/lib/data';
import type { Article } from '@/lib/types';
import { useApp } from '@/state/AppProvider';

export function useAllArticles(): Article[] {
  const { imported } = useApp();
  return useMemo(() => [...BUNDLED_ARTICLES, ...imported], [imported]);
}
