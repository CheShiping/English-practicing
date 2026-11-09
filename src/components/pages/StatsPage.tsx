'use client';

import {
  ArrowRight,
  BookMarked,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Flame,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { useAllArticles } from '@/lib/use-articles';
import { CATEGORIES } from '@/lib/data';
import { hrefFor } from '@/lib/router';
import { dayLabel, formatMinutes, lastNDays, percent } from '@/lib/utils';

export default function StatsPage() {
  const articles = useAllArticles();
  const { progress, stats, vocab, readingStreak, answers } = useApp();

  const days = lastNDays(14);
  const dayStats = days.map((d) => stats[d] || { date: d, minutes: 0, words: 0, questions: 0, correct: 0, articles: 0 });
  const maxMinutes = Math.max(30, ...dayStats.map((d) => d.minutes));

  const totalMinutes = Object.values(stats).reduce((s, d) => s + d.minutes, 0);
  const totalQuestions = Object.values(stats).reduce((s, d) => s + d.questions, 0);
  const totalCorrect = Object.values(stats).reduce((s, d) => s + d.correct, 0);
  const completed = articles.filter((a) => progress[a.id]?.completed).length;
  const accuracy = totalQuestions ? percent(totalCorrect, totalQuestions) : 0;

  const weekMinutes = dayStats.slice(-7).reduce((s, d) => s + d.minutes, 0);
  const weekQuestions = dayStats.slice(-7).reduce((s, d) => s + d.questions, 0);

  const recent = articles
    .filter((a) => progress[a.id])
    .sort((a, b) => (progress[b.id]?.updatedAt || 0) - (progress[a.id]?.updatedAt || 0))
    .slice(0, 6);

  const answeredTotal = Object.values(answers).reduce(
    (s, a) => s + Object.keys(a.answers || {}).length,
    0,
  );

  const hasData = totalMinutes > 0 || totalQuestions > 0 || vocab.length > 0 || completed > 0;

  return (
    <div className="page stats-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Learning dashboard</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            学习数据
          </h1>
          <p className="section-sub">每一个数字背后，都是你认真读过的一段英文。</p>
        </div>
        <div className="streak-big">
          <Flame size={20} />
          <div>
            <b>{readingStreak}</b>
            <span>天连续学习</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <TrendingUp size={28} />
          <h3>还没有学习记录</h3>
          <p>读完第一篇文章、做完第一组题，这里就会开始生长。</p>
          <a className="btn primary" href={hrefFor('/library')}>
            去读第一篇 <ArrowRight size={15} />
          </a>
        </div>
      ) : (
        <>
          <div className="stats-cards">
            <div className="stats-card">
              <Clock3 size={18} />
              <b>{formatMinutes(totalMinutes)}</b>
              <span>累计阅读</span>
              <small>近 7 天 {Math.round(weekMinutes)} 分钟</small>
            </div>
            <div className="stats-card">
              <BookOpenCheck size={18} />
              <b>{completed}</b>
              <span>完成文章</span>
              <small>共 {articles.length} 篇</small>
            </div>
            <div className="stats-card">
              <Target size={18} />
              <b>{accuracy}%</b>
              <span>做题正确率</span>
              <small>{totalQuestions} 次作答 · 近 7 天 {weekQuestions} 次</small>
            </div>
            <div className="stats-card">
              <BookMarked size={18} />
              <b>{vocab.length}</b>
              <span>生词本</span>
              <small>{answeredTotal} 道题留下作答记录</small>
            </div>
          </div>

          <div className="stats-grid">
            <section className="chart-card">
              <div className="chart-head">
                <div>
                  <span className="eyebrow">Last 14 days</span>
                  <h3>阅读时长</h3>
                </div>
                <span className="chip">{Math.round(weekMinutes)} 分钟 / 近 7 天</span>
              </div>
              <div className="bar-chart" role="img" aria-label="最近 14 天阅读时长柱状图">
                {dayStats.map((d, i) => (
                  <div className="bar-col" key={d.date} title={`${d.date} · ${Math.round(d.minutes)} 分钟`}>
                    <div className="bar-track">
                      <i
                        style={{
                          height: `${Math.max(d.minutes > 0 ? 4 : 0, (d.minutes / maxMinutes) * 100)}%`,
                        }}
                        className={i >= dayStats.length - 7 ? 'recent' : ''}
                      />
                    </div>
                    <span>{i % 2 === 0 ? dayLabel(d.date) : ''}</span>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span><i className="dot recent" /> 最近 7 天</span>
                <span><i className="dot" /> 更早</span>
                <span className="chart-max">峰值 {Math.round(maxMinutes)} 分钟</span>
              </div>
            </section>

            <section className="chart-card category-progress-card">
              <div className="chart-head">
                <div>
                  <span className="eyebrow">By category</span>
                  <h3>题材进度</h3>
                </div>
              </div>
              <div className="cat-progress-list">
                {CATEGORIES.map((c) => {
                  const list = articles.filter((a) => a.catId === c.id);
                  const done = list.filter((a) => progress[a.id]?.completed).length;
                  const p = percent(done, list.length || 1);
                  return (
                    <a key={c.id} className="cat-progress" href={hrefFor(`/library/${c.id}`)}>
                      <div className="cat-progress-head">
                        <span>
                          <i style={{ background: c.color }} />
                          {c.name}
                        </span>
                        <b>
                          {done}/{list.length}
                        </b>
                      </div>
                      <div className="progress-bar">
                        <i style={{ width: `${p}%`, background: c.color }} />
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="recent-card">
            <div className="chart-head">
              <div>
                <span className="eyebrow">Recent reading</span>
                <h3>最近在读</h3>
              </div>
              <a className="btn small ghost" href={hrefFor('/library')}>
                全部文章 <ArrowRight size={14} />
              </a>
            </div>
            <div className="recent-list">
              {recent.map((a) => {
                const p = progress[a.id];
                return (
                  <a key={a.id} className="recent-item" href={hrefFor(`/read/${a.id}`)}>
                    <div className="recent-icon">
                      {p?.completed ? <CheckCircle2 size={16} /> : <BookOpenCheck size={16} />}
                    </div>
                    <div className="recent-main">
                      <b>{a.title}</b>
                      <span>
                        {a.catName} · {p?.percent || 0}% · {formatMinutes((p?.timeSpent || 0) / 60000)}
                      </span>
                      <div className="progress-bar">
                        <i style={{ width: `${p?.percent || 0}%` }} />
                      </div>
                    </div>
                    <ArrowRight size={15} />
                  </a>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
