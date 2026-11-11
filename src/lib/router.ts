'use client';

import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'library'; catId?: string }
  | { name: 'reader'; id: string }
  | { name: 'practice'; tab?: 'wrong' }
  | { name: 'vocab' }
  | { name: 'stats' }
  | { name: 'import' }
  | { name: 'settings' }
  | { name: 'notfound' };

export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#/, '').replace(/^\/+/, '');
  if (!clean) return { name: 'home' };
  const parts = clean.split('/').filter(Boolean).map(decodeURIComponent);
  const [head, ...rest] = parts;
  switch (head) {
    case 'library':
      return { name: 'library', catId: rest[0] };
    case 'read':
      return rest[0] ? { name: 'reader', id: rest[0] } : { name: 'library' };
    case 'practice':
      return { name: 'practice', tab: rest[0] === 'wrong' ? 'wrong' : undefined };
    case 'vocab':
      return { name: 'vocab' };
    case 'stats':
      return { name: 'stats' };
    case 'import':
      return { name: 'import' };
    case 'settings':
      return { name: 'settings' };
    case 'home':
      return { name: 'home' };
    default:
      return { name: 'notfound' };
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>({ name: 'home' });

  useEffect(() => {
    const sync = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return route;
}

export function navigate(path: string, opts: { replace?: boolean; scroll?: boolean } = {}): void {
  const target = path.startsWith('#') ? path : `#${path.startsWith('/') ? '' : '/'}${path}`;
  if (opts.replace) {
    const url = `${window.location.pathname}${window.location.search}${target}`;
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = target;
  }
  if (opts.scroll !== false) {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }
}

export function hrefFor(path: string): string {
  return `#${path.startsWith('/') ? '' : '/'}${path}`;
}
