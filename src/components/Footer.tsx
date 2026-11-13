'use client';

import { hrefFor } from '@/lib/router';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <b>墨读英语 Moread</b> · 把每一篇阅读，读成自己的语感
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <span>所有学习数据仅保存在你的浏览器</span>
          <a href={hrefFor('/settings')}>数据与备份</a>
          <a href={hrefFor('/import')}>导入文章</a>
        </div>
      </div>
    </footer>
  );
}
