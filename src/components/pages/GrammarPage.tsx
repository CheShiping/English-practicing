'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, GraduationCap, Search } from 'lucide-react';
import { GRAMMAR_SECTIONS } from '@/data/grammar';
import { grammarMarkdownToHtml } from '@/lib/grammar-md';
import { hrefFor } from '@/lib/router';

export default function GrammarPage() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(GRAMMAR_SECTIONS[0]?.id || '');
  const navRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GRAMMAR_SECTIONS.filter(
      (section) =>
        !q || `${section.title} ${section.en} ${section.content}`.toLowerCase().includes(q),
    ).map((section) => ({ ...section, html: grammarMarkdownToHtml(section.content) }));
  }, [query]);

  // 滚动时高亮当前分区
  useEffect(() => {
    const sync = () => {
      let current = GRAMMAR_SECTIONS[0]?.id || '';
      for (const section of GRAMMAR_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= 160) current = section.id;
      }
      setActive(current);
    };
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => window.removeEventListener('scroll', sync);
  }, []);

  // 当前分区按钮自动滑到导航中间
  useEffect(() => {
    const wrap = navRef.current;
    if (!wrap) return;
    const button = wrap.querySelector<HTMLElement>('[data-active="true"]');
    if (!button) return;
    const left = button.offsetLeft - (wrap.clientWidth - button.offsetWidth) / 2;
    wrap.scrollTo({
      left: Math.max(0, Math.min(left, wrap.scrollWidth - wrap.clientWidth)),
      behavior: 'smooth',
    });
  }, [active]);

  const scrollToSection = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page grammar-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Grammar handbook · 23456</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            语法知识点
          </h1>
          <p className="section-sub">
            按 2 个态 → 3 大从句 → 4 个重点 → 5 大句型 → 6 大词性原样收录完整框架，做题时忘了就回来翻一页。
          </p>
        </div>
        <div className="page-head-actions">
          <a className="btn primary" href={hrefFor('/practice')}>
            <GraduationCap size={15} /> 去做语法题
          </a>
        </div>
      </div>

      <div className="grammar-layout">
        <aside className="grammar-aside" aria-label="语法框架索引">
          <div className="grammar-aside-inner" ref={navRef}>
            <p className="grammar-aside-title">23456 框架</p>
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                data-active={active === section.id ? 'true' : undefined}
                onClick={() => scrollToSection(section.id)}
              >
                <em>{section.order}</em>
                <b>{section.title}</b>
              </button>
            ))}
          </div>
        </aside>

        <div className="grammar-main">
          <div className="grammar-toolbar">
            <label className="search-box">
              <Search size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索知识点，如：虚拟语气、倒装、冠词…"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="清除">
                  ×
                </button>
              )}
            </label>
            <span className="grammar-result-count">
              {query.trim() ? `命中 ${sections.length} 个分区` : `共 ${sections.length} 个分区`}
            </span>
          </div>

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="grammar-section">
              <div className="grammar-section-head">
                <span className="grammar-section-num">{section.order}</span>
                <div>
                  <div className="grammar-section-title">
                    <h2>{section.title}</h2>
                    <em>{section.en}</em>
                  </div>
                </div>
              </div>
              <div
                className="grammar-content"
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </section>
          ))}

          {sections.length === 0 && (
            <div className="grammar-empty">
              <Search size={26} />
              <h3>没有找到对应的知识点</h3>
              <p>换个关键词试试，例如“从句”“时态”“比较级”。</p>
              <button className="btn" type="button" onClick={() => setQuery('')}>
                清空搜索
              </button>
            </div>
          )}

          <div className="grammar-footnote">
            <BookOpen size={16} />
            <p>
              固定搭配、词汇辨析、介词、动词短语和连词属于词汇题，不在 23456 语法框架内；可在{' '}
              <a href={hrefFor('/practice')}>单选练习</a> 的「其他」分类中练。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
