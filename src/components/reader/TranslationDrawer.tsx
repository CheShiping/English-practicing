'use client';

import { useMemo, useState } from 'react';
import { Copy, Languages, Loader2, RefreshCw, X } from 'lucide-react';
import type { Article } from '@/lib/types';
import { translateText } from '@/lib/translate';
import { useApp } from '@/state/AppProvider';
import { cn } from '@/lib/utils';

export default function TranslationDrawer({
  article,
  onClose,
}: {
  article: Article;
  onClose: () => void;
}) {
  const { settings, updateSettings, toast } = useApp();
  const initial = useMemo(
    () => article.blocks.map((b) => b.translation || ''),
    [article],
  );
  const [translations, setTranslations] = useState<string[]>(initial);
  const [translating, setTranslating] = useState(false);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');

  const missing = article.blocks.filter((_, i) => !translations[i]).length;
  const hasAny = translations.some(Boolean);

  const run = async () => {
    if (translating) return;
    setTranslating(true);
    setError('');
    const next = [...translations];
    for (let i = 0; i < article.blocks.length; i++) {
      if (next[i]) continue;
      setCurrent(i);
      const r = await translateText(article.blocks[i].text);
      if (r.error) {
        setError(r.error);
        break;
      }
      next[i] = r.text;
      setTranslations([...next]);
      await new Promise((res) => setTimeout(res, 260));
    }
    setTranslating(false);
  };

  const copyAll = async () => {
    const text = article.blocks
      .map((b, i) => (translations[i] ? translations[i] : ''))
      .filter(Boolean)
      .join('\n');
    if (!text) {
      toast('还没有可复制的译文', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('全文译文已复制', 'success');
    } catch {
      toast('复制失败', 'error');
    }
  };

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer translation-drawer" role="dialog" aria-modal="true" aria-label="全文翻译">
        <div className="drawer-head">
          <div>
            <span className="eyebrow">Bilingual reading</span>
            <h3>全文翻译</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-toolbar">
          <span className="drawer-meta">
            {article.wordCount} words · {article.blocks.length} 段
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn small ghost" onClick={copyAll}>
              <Copy size={13} /> 复制
            </button>
            <button
              className={cn('btn small', settings.showTranslation && 'primary')}
              onClick={() => updateSettings({ showTranslation: !settings.showTranslation })}
              title="在正文每段下方显示译文"
            >
              <Languages size={13} /> {settings.showTranslation ? '正文对照中' : '正文对照'}
            </button>
          </div>
        </div>

        <div className="drawer-body">
          {!hasAny && !translating && (
            <div className="trans-empty">
              <Languages size={26} />
              <h4>这篇还没有内置译文</h4>
              <p>可以使用在线翻译生成全文译文。首次生成后会缓存在本地，下次打开更快。</p>
              <button className="btn primary" onClick={run}>
                <Languages size={15} /> 生成全文翻译
              </button>
            </div>
          )}

          {translating && (
            <div className="trans-progress">
              <Loader2 size={14} className="spin" />
              正在翻译第 {current + 1} / {article.blocks.length} 段…
              <div className="progress-bar">
                <i style={{ width: `${((current + 1) / article.blocks.length) * 100}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="trans-error">
              翻译服务暂时不可用：{error}
              <button className="btn small" onClick={run}>
                <RefreshCw size={13} /> 重试
              </button>
            </div>
          )}

          {hasAny && (
            <div className="trans-list">
              {article.blocks.map((b, i) => (
                <div key={i} className={cn('trans-item', b.type === 'li' && 'is-li')}>
                  <div className="trans-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="trans-content">
                    <p className="trans-source">{b.text}</p>
                    {translations[i] ? (
                      <p className="trans-text">{translations[i]}</p>
                    ) : (
                      <p className="trans-missing">待翻译</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasAny && missing > 0 && !translating && (
            <button className="btn small trans-more" onClick={run}>
              <Languages size={13} /> 继续翻译剩余 {missing} 段
            </button>
          )}

          <p className="trans-note">译文由机器翻译生成，仅供理解原文参考；细节以英文原句为准。</p>
        </div>
      </aside>
    </div>
  );
}
