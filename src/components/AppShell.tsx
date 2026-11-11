'use client';

import { useApp } from '@/state/AppProvider';
import { useRoute } from '@/lib/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileTabBar from '@/components/MobileTabBar';
import ToastStack from '@/components/ToastStack';
import HomePage from '@/components/pages/HomePage';
import LibraryPage from '@/components/pages/LibraryPage';
import ReaderPage from '@/components/pages/ReaderPage';
import PracticePage from '@/components/pages/PracticePage';
import GrammarPage from '@/components/pages/GrammarPage';
import VocabPage from '@/components/pages/VocabPage';
import StatsPage from '@/components/pages/StatsPage';
import ImportPage from '@/components/pages/ImportPage';
import SettingsPage from '@/components/pages/SettingsPage';
import { BookOpen } from 'lucide-react';

const BRAND_MARK = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/brand/moread-owl.png`;

function Splash() {
  return (
    <div className="splash">
      <div className="splash-seal">
        <img src={BRAND_MARK} alt="" width={52} height={52} />
      </div>
      <div className="splash-text">
        <b>墨读英语</b>
        <span>正在展开纸页…</span>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page" style={{ padding: '100px 0', textAlign: 'center' }}>
      <div className="splash-seal" style={{ margin: '0 auto 20px' }}>
        <img src={BRAND_MARK} alt="" width={52} height={52} />
      </div>
      <h1 className="section-title">这一页还没有被写下</h1>
      <p className="section-sub" style={{ margin: '10px auto 26px' }}>
        链接可能已经失效，回到首页继续阅读吧。
      </p>
      <a className="btn primary" href="#/">
        <BookOpen size={16} /> 返回首页
      </a>
    </div>
  );
}

export default function AppShell() {
  const route = useRoute();
  const { hydrated } = useApp();

  if (!hydrated) return <Splash />;

  const isReader = route.name === 'reader';
  const routeName = route.name;

  return (
    <div className="app">
      {!isReader && <Header routeName={routeName} />}
      <main className={isReader ? 'app-main reader-main-shell' : 'app-main'}>
        {route.name === 'home' && <HomePage />}
        {route.name === 'library' && <LibraryPage catId={route.catId} />}
        {route.name === 'reader' && <ReaderPage articleId={route.id} />}
        {route.name === 'practice' && <PracticePage tab={route.tab} />}
        {route.name === 'grammar' && <GrammarPage />}
        {route.name === 'vocab' && <VocabPage />}
        {route.name === 'stats' && <StatsPage />}
        {route.name === 'import' && <ImportPage />}
        {route.name === 'settings' && <SettingsPage />}
        {route.name === 'notfound' && <NotFound />}
      </main>
      {!isReader && <Footer />}
      {!isReader && <MobileTabBar routeName={routeName} />}
      <ToastStack />
    </div>
  );
}
