import type { Metadata, Viewport } from 'next';
import './globals.css';
import './reader.css';
import './pages.css';
import { AppProvider } from '@/state/AppProvider';
import AppShell from '@/components/AppShell';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: '墨读英语 · 沉浸式英语阅读与精读训练',
  description:
    '把每一篇真题读成自己的语感。支持点词查义、划句翻译、生词本、批注、计时与做题解析，所有学习数据保存在本地。',
  applicationName: '墨读英语',
  keywords: ['英语阅读', '专升本', '精读', '背单词', '阅读理解', '英语真题'],
  icons: { icon: `${basePath}/brand/moread-owl.png` },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f6f1e7',
};

const themeScript = `(function(){try{
  var s=JSON.parse(localStorage.getItem('moread.settings.v1')||'{}');
  var t=s.theme||'paper';
  document.documentElement.dataset.theme=t;
  if(s.fontSize)document.documentElement.style.setProperty('--reader-font-size',s.fontSize+'px');
  if(s.lineHeight)document.documentElement.style.setProperty('--reader-line-height',String(s.lineHeight));
  if(s.contentWidth)document.documentElement.style.setProperty('--reader-width',s.contentWidth+'px');
  if(s.fontFamily)document.documentElement.style.setProperty('--reader-font',s.fontFamily==='sans'?'var(--font-sans)':'var(--font-serif)');
  if(s.justify)document.documentElement.style.setProperty('--reader-justify','justify');
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Serif+SC:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </body>
    </html>
  );
}
