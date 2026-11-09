import raw from '@/data/articles.generated.json';
import type { Article, ArticleData, Category } from '@/lib/types';
import { applyMeta, CATEGORY_META } from '@/data/article-meta';

const data = raw as unknown as ArticleData;

export const BUNDLED_ARTICLES: Article[] = applyMeta(data.articles);
export const CATEGORIES: Category[] = data.categories
  .filter((c) => c.count > 0)
  .map((c) => ({
    ...c,
    description: CATEGORY_META[c.id]?.description || '自定义题材训练',
    color: CATEGORY_META[c.id]?.color || '#8A8175',
    icon: CATEGORY_META[c.id]?.icon || 'book',
  }))
  .sort((a, b) => a.order - b.order);

export const BUNDLED_STATS = data.stats;

export function getBundledArticle(id: string): Article | undefined {
  return BUNDLED_ARTICLES.find((a) => a.id === id);
}

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getCategoryArticles(articles: Article[], catId: string): Article[] {
  return articles.filter((a) => a.catId === catId);
}

export function getNeighbors(articles: Article[], id: string): { prev?: Article; next?: Article } {
  const list = articles;
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return {};
  return {
    prev: idx > 0 ? list[idx - 1] : undefined,
    next: idx < list.length - 1 ? list[idx + 1] : undefined,
  };
}

export function searchArticles(articles: Article[], query: string): Article[] {
  const q = query.trim().toLowerCase();
  if (!q) return articles;
  return articles.filter((a) => {
    const hay = [a.title, a.subtitle, a.summary, a.catName, ...(a.tags || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (hay.includes(q)) return true;
    return a.blocks.some((b) => b.text.toLowerCase().includes(q));
  });
}

export function articleText(a: Article): string {
  return a.blocks.map((b) => b.text).join('\n');
}
