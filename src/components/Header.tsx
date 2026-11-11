'use client';

import { Flame, Moon, Settings2, Sun, Upload } from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { hrefFor } from '@/lib/router';

const NAV = [
  { key: 'home', label: '首页', href: '/' },
  { key: 'library', label: '文章库', href: '/library' },
  { key: 'practice', label: '单选练习', href: '/practice' },
  { key: 'vocab', label: '生词本', href: '/vocab' },
  { key: 'stats', label: '学习数据', href: '/stats' },
];

const BRAND_MARK = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/brand/moread-owl.png`;

export default function Header({ routeName }: { routeName: string }) {
  const { settings, updateSettings, readingStreak } = useApp();
  const dark = settings.theme === 'dark';

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href={hrefFor('/')} className="brand" aria-label="墨读英语首页">
          <span className="brand-seal" aria-hidden="true">
            <img src={BRAND_MARK} alt="" width={36} height={36} />
          </span>
          <span className="brand-text">
            <span className="brand-name">墨读英语</span>
            <span className="brand-en">Moread English</span>
          </span>
        </a>

        <nav className="site-nav" aria-label="主导航">
          {NAV.map((n) => (
            <a
              key={n.key}
              href={hrefFor(n.href)}
              aria-current={routeName === n.key || (n.key === 'library' && routeName === 'library') ? 'page' : undefined}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="site-header-actions">
          {readingStreak > 0 && (
            <span className="streak-pill" title="连续学习天数">
              <Flame size={14} /> <b>{readingStreak}</b> 天
            </span>
          )}
          <a className="btn small ghost header-import" href={hrefFor('/import')}>
            <Upload size={14} /> 导入文章
          </a>
          <button
            className="icon-btn"
            title={dark ? '切换到纸感主题' : '切换到夜间主题'}
            aria-label="切换主题"
            onClick={() => updateSettings({ theme: dark ? 'paper' : 'dark' })}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a
            className="icon-btn"
            href={hrefFor('/settings')}
            title="设置"
            aria-label="设置"
            aria-current={routeName === 'settings' ? 'page' : undefined}
          >
            <Settings2 size={18} />
          </a>
        </div>
      </div>
    </header>
  );
}
