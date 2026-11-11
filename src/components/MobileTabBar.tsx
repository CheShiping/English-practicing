'use client';

import { BarChart3, BookOpen, GraduationCap, Home, Library } from 'lucide-react';
import { hrefFor } from '@/lib/router';

const ITEMS = [
  { key: 'home', label: '首页', href: '/', icon: Home },
  { key: 'library', label: '文库', href: '/library', icon: Library },
  { key: 'practice', label: '练习', href: '/practice', icon: GraduationCap },
  { key: 'grammar', label: '语法', href: '/grammar', icon: BookOpen },
  { key: 'stats', label: '数据', href: '/stats', icon: BarChart3 },
];

export default function MobileTabBar({ routeName }: { routeName: string }) {
  return (
    <nav className="mobile-tabbar" aria-label="移动端导航">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = routeName === item.key;
        return (
          <a key={item.key} href={hrefFor(item.href)} aria-current={active ? 'page' : undefined}>
            <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
