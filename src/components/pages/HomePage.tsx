'use client';

import type { ComponentType } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock3,
  Flame,
  FlaskConical,
  Feather,
  FileText,
  TrendingUp,
  Quote,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { useAllArticles } from '@/lib/use-articles';
import { CATEGORIES, getCategory } from '@/lib/data';
import { hrefFor } from '@/lib/router';
import { todayKey } from '@/lib/utils';

const CAT_ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  kepu: FlaskConical,
  jingli: Feather,
  yingyong: FileText,
  jingji: TrendingUp,
};

export default function HomePage() {
  const articles = useAllArticles();
  const { progress, settings, stats, readingStreak, vocab, lastRead, recent } = useApp();

  const today = stats[todayKey()] || { minutes: 0, questions: 0, words: 0, correct: 0, articles: 0 };
  const totalWords = articles.reduce((s, a) => s + a.wordCount, 0);
  const totalQuestions = articles.reduce((s, a) => s + a.questions.length, 0);
  const completed = articles.filter((a) => progress[a.id]?.completed).length;

  const continueArticle =
    articles.find((a) => a.id === lastRead) ||
    articles.find((a) => recent.includes(a.id)) ||
    articles.find((a) => !progress[a.id]?.completed) ||
    articles[0];

  const continueProgress = continueArticle ? progress[continueArticle.id] : undefined;

  const categoryStats = CATEGORIES.map((c) => {
    const list = articles.filter((a) => a.catId === c.id);
    const done = list.filter((a) => progress[a.id]?.completed).length;
    return { ...c, total: list.length, done };
  });

  const recentArticles = [...articles]
    .sort((a, b) => {
      const pa = progress[a.id]?.updatedAt || 0;
      const pb = progress[b.id]?.updatedAt || 0;
      return pb - pa || a.number - b.number;
    })
    .slice(0, 6);

  const goalMinutes = 30;
  const goalPct = Math.min(100, Math.round((today.minutes / goalMinutes) * 100));

  return (
    <div className="home page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Read deeply · 精读训练</span>
          <h1>
            把每一篇真题，
            <br />
            读成自己的<em>语感</em>。
          </h1>
          <p className="hero-lead">
            点词查义、划句翻译、随手批注，做完题立刻看解析。把“读过”变成“读懂”，
            把每一次阅读都沉淀成可复习的词汇与笔记。
          </p>
          <div className="hero-actions">
            {continueArticle && (
              <a className="btn primary" href={hrefFor(`/read/${continueArticle.id}`)}>
                <BookOpen size={16} />
                {continueProgress && continueProgress.percent > 0 ? '继续阅读' : '开始第一篇'}
                <ArrowRight size={15} />
              </a>
            )}
            <a className="btn" href={hrefFor('/library')}>
              浏览文章库 <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="hero-note">
            <span className="avatars" aria-hidden="true">
              <span>读</span>
              <span>词</span>
              <span>句</span>
            </span>
            <span>
              已收录 <b style={{ color: 'var(--ink-2)' }}>{articles.length}</b> 篇真题 ·{' '}
              <b style={{ color: 'var(--ink-2)' }}>{totalQuestions}</b> 道阅读题
            </span>
          </div>
        </div>

        <div className="hero-paper" aria-hidden="true">
          <div className="hero-stamp">精读</div>
          <div className="hero-paper-label">PASSAGE · 01</div>
          <h3>Why the Body Needs Sleep</h3>
          <div className="hero-paper-sub">科普类 · 194 words · 5 questions</div>
          <p className="hero-paper-text">
            After a busy day of work and play, the body needs to rest.{' '}
            <span className="hl">Sleep is necessary for good health.</span> During this time, the
            body recovers from the activities of the previous day. The rest that you get while
            sleeping makes it possible for your body to{' '}
            <span className="w-note">prepare itself</span> for the next day.
          </p>
          <div className="hero-float">
            <b>sleep</b> /sliːp/ · n. 睡眠
            <div style={{ marginTop: 4, color: 'var(--muted)' }}>+ 加入生词本</div>
          </div>
        </div>
      </section>

      <section className="stat-strip" aria-label="学习概览">
        <div className="stat-cell">
          <b>{articles.length}</b>
          <span>篇精选文章</span>
        </div>
        <div className="stat-cell">
          <b>{totalQuestions}</b>
          <span>道阅读题</span>
        </div>
        <div className="stat-cell">
          <b>{totalWords.toLocaleString('en-US')}</b>
          <span>Total words</span>
        </div>
        <div className="stat-cell">
          <b>{vocab.length}</b>
          <span>生词本词汇</span>
        </div>
      </section>

      <section className="home-section" style={{ marginTop: 0 }}>
        <div className="home-section-head">
          <div>
            <span className="eyebrow">Pick up where you left</span>
            <h2 className="section-title" style={{ marginTop: 10 }}>
              今天，从这一篇开始
            </h2>
          </div>
          <a className="btn small ghost" href={hrefFor('/stats')}>
            查看学习数据 <ArrowRight size={14} />
          </a>
        </div>

        <div className="continue-grid">
          {continueArticle && (
            <a className="continue-card" href={hrefFor(`/read/${continueArticle.id}`)}>
              <div>
                <div className="continue-top">
                  <span>{continueArticle.catName}</span>
                  <span className="divider-dot" />
                  <span>{continueArticle.difficulty}</span>
                  {continueProgress?.completed && (
                    <span className="chip green" style={{ marginLeft: 'auto' }}>
                      <CheckCircle2 size={12} /> 已完成
                    </span>
                  )}
                </div>
                <h3>{continueArticle.title}</h3>
                <div className="continue-meta">
                  {continueArticle.subtitle || `Passage ${continueArticle.number}`} ·{' '}
                  {continueArticle.wordCount} words · {continueArticle.questions.length} 题
                </div>
              </div>
              <div>
                <div className="continue-bottom">
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <i style={{ width: `${continueProgress?.percent || 0}%` }} />
                  </div>
                  <span className="continue-meta" style={{ whiteSpace: 'nowrap' }}>
                    {continueProgress?.percent || 0}%
                  </span>
                  <span className="btn small primary">
                    阅读 <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </a>
          )}

          <div className="today-card">
            <div>
              <div className="today-top">
                <span>Today</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Flame size={12} /> {readingStreak} 天连续
                </span>
              </div>
              <h3>
                {today.minutes > 0 ? '保持这个节奏，今天已经读了一会儿。' : '今天还没有翻开书页。'}
              </h3>
            </div>
            <div>
              <div className="today-stats">
                <div>
                  <b>{Math.round(today.minutes)}</b>
                  <span>分钟</span>
                </div>
                <div>
                  <b>{today.questions}</b>
                  <span>道题</span>
                </div>
                <div>
                  <b>{today.words}</b>
                  <span>生词</span>
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 10.5,
                    color: 'rgba(246,239,227,.55)',
                    marginBottom: 6,
                  }}
                >
                  <span>今日目标 · {goalMinutes} 分钟</span>
                  <span>{goalPct}%</span>
                </div>
                <div className="progress-bar" style={{ background: 'rgba(255,255,255,.14)' }}>
                  <i
                    style={{
                      width: `${goalPct}%`,
                      background: 'linear-gradient(90deg,#e6b17e,#e07a5f)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span className="eyebrow">By category</span>
            <h2 className="section-title" style={{ marginTop: 10 }}>
              按题材训练
            </h2>
            <p className="section-sub">
              不同题材有不同的出题逻辑。先从你最想突破的一类开始。
            </p>
          </div>
          <div className="chip gold">
            <Bookmark size={12} /> 已完成 {completed} / {articles.length}
          </div>
        </div>

        <div className="category-grid">
          {categoryStats.map((c, i) => {
            const Icon = CAT_ICONS[c.id] || BookOpen;
            return (
              <a
                key={c.id}
                className="category-card"
                href={hrefFor(`/library/${c.id}`)}
                style={{ ['--cat-color' as string]: c.color }}
              >
                <span className="category-index">0{i + 1}</span>
                <span className="category-icon">
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="category-foot">
                  <span>
                    <b>{c.total}</b> 篇 · 已完成 {c.done}
                  </span>
                  <ArrowUpRight size={15} />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <div>
            <span className="eyebrow">Fresh from the desk</span>
            <h2 className="section-title" style={{ marginTop: 10 }}>
              最近可以读的
            </h2>
          </div>
          <a className="btn small ghost" href={hrefFor('/library')}>
            全部文章 <ArrowRight size={14} />
          </a>
        </div>

        <div className="article-list">
          {recentArticles.map((a) => {
            const p = progress[a.id];
            const cat = getCategory(a.catId);
            return (
              <a key={a.id} className="article-row" href={hrefFor(`/read/${a.id}`)}>
                <span className="article-row-num">{String(a.number).padStart(2, '0')}</span>
                <div className="article-row-main">
                  <div className="article-row-title">{a.title}</div>
                  <div className="article-row-sub">
                    <span style={{ color: cat?.color, fontWeight: 600 }}>{a.catName}</span>
                    <span className="divider-dot" />
                    <span>{a.subtitle || `Passage ${a.number}`}</span>
                    <span className="divider-dot" />
                    <span>
                      <Clock3 size={11} style={{ display: 'inline', verticalAlign: -1 }} />{' '}
                      {Math.max(3, Math.round(a.wordCount / 150))} 分钟
                    </span>
                  </div>
                </div>
                <div className="article-row-side">
                  <span>{a.questions.length} 题</span>
                  <div className="article-row-progress">
                    <div className="progress-bar">
                      <i style={{ width: `${p?.percent || 0}%` }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>
                    {p?.percent || 0}%
                  </span>
                  <ArrowRight size={15} />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="quote-banner">
        <blockquote>
          “Read not to contradict and confute, nor to believe and take for granted,
          <br />
          but to <span>weigh and consider</span>.”
        </blockquote>
        <cite>— Francis Bacon</cite>
      </section>
    </div>
  );
}
