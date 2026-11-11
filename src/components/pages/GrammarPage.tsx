'use client';

import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, GraduationCap, Lightbulb, Search } from 'lucide-react';
import { GRAMMAR_SECTIONS } from '@/data/grammar';
import { hrefFor } from '@/lib/router';
import { cn } from '@/lib/utils';

export default function GrammarPage() {
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<string[]>([]);

  const pointNos = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of GRAMMAR_SECTIONS) {
      section.points.forEach((point, i) => map.set(point.id, `${section.order}.${i + 1}`));
    }
    return map;
  }, []);

  const allPoints = useMemo(
    () => GRAMMAR_SECTIONS.flatMap((section) => section.points),
    [],
  );

  const searching = query.trim().length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GRAMMAR_SECTIONS;
    return GRAMMAR_SECTIONS.map((section) => ({
      ...section,
      points: section.points.filter((point) =>
        [
          point.title,
          point.en,
          point.summary,
          point.tip,
          ...point.rules,
          point.example.en,
          point.example.zh,
        ].some((text) => text.toLowerCase().includes(q)),
      ),
    })).filter((section) => section.points.length > 0);
  }, [query]);

  const matchCount = filtered.reduce((sum, section) => sum + section.points.length, 0);
  const allOpen = openIds.length === allPoints.length;

  const toggle = (id: string) => {
    setOpenIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const toggleAll = () => {
    setOpenIds(allOpen ? [] : allPoints.map((point) => point.id));
  };

  const scrollToSection = (id: string) => {
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
            按 2 个态 → 3 大从句 → 4 个重点 → 5 大句型 → 6 大词性编排，做题时忘了就回来翻一页。
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
          <div className="grammar-aside-inner">
            <p className="grammar-aside-title">23456 框架</p>
            {GRAMMAR_SECTIONS.map((section) => (
              <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}>
                <em>{section.order}</em>
                <b>{section.title}</b>
                <span>{section.points.length}</span>
              </button>
            ))}
            <p className="grammar-aside-note">
              共 {allPoints.length} 个知识点。搜索框可查关键词，例如“虚拟”“倒装”“主谓一致”。
            </p>
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
              {searching ? `命中 ${matchCount} 个` : `${allPoints.length} 个知识点`}
            </span>
            {!searching && (
              <button className="btn small ghost" type="button" onClick={toggleAll}>
                {allOpen ? '收起全部' : '展开全部'}
              </button>
            )}
          </div>

          {filtered.map((section) => (
            <section key={section.id} id={section.id} className="grammar-section">
              <div className="grammar-section-head">
                <span className="grammar-section-num">{section.order}</span>
                <div>
                  <div className="grammar-section-title">
                    <h2>{section.title}</h2>
                    <em>{section.en}</em>
                  </div>
                  <p className="grammar-section-intro">{section.intro}</p>
                </div>
              </div>

              <div className="grammar-cards">
                {section.points.map((point) => {
                  const open = searching || openIds.includes(point.id);
                  return (
                    <article key={point.id} className={cn('grammar-card', open && 'open')}>
                      <button
                        type="button"
                        className="grammar-card-head"
                        aria-expanded={open}
                        disabled={searching}
                        onClick={() => toggle(point.id)}
                      >
                        <span className="grammar-point-no">{pointNos.get(point.id)}</span>
                        <span className="grammar-point-main">
                          <b>{point.title}</b>
                          <em>{point.en}</em>
                          <span>{point.summary}</span>
                        </span>
                        {!searching && <ChevronDown size={16} className="grammar-chevron" />}
                      </button>

                      {open && (
                        <div className="grammar-card-body">
                          <ul className="grammar-rules">
                            {point.rules.map((rule) => (
                              <li key={rule}>{rule}</li>
                            ))}
                          </ul>

                          <div className="grammar-example">
                            <span className="grammar-example-label">Example</span>
                            <p className="grammar-example-en">{point.example.en}</p>
                            <p className="grammar-example-zh">{point.example.zh}</p>
                          </div>

                          <div className="grammar-tip">
                            <Lightbulb size={14} />
                            <span>
                              <b>易错</b>
                              {point.tip}
                            </span>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {filtered.length === 0 && (
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
