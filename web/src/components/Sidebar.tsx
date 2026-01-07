'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Trophy,
  Zap,
  Star,
  Scale,
  Building2,
  Calendar,
  Menu,
  X,
  MoreHorizontal
} from 'lucide-react';

const menuItems = [
  { href: '/', icon: LayoutDashboard, label: '대시보드' },
  { href: '/players', icon: Users, label: '선수 검색' },
  { href: '/schedule', icon: Calendar, label: '일정/매치업', badge: 'NEW' },
  { href: '/recommend', icon: Sparkles, label: 'AI 추천' },
  { href: '/compare', icon: Scale, label: '선수 비교' },
  { href: '/my-team', icon: Trophy, label: '팀 빌더' },
  { href: '/teams', icon: Building2, label: '팀별 선수' },
  { href: '/dark-horse', icon: Zap, label: '다크호스' },
];

// Bottom tab items for mobile (main 4 + more)
const mobileTabItems = [
  { href: '/', icon: LayoutDashboard, label: '홈' },
  { href: '/players', icon: Users, label: '선수' },
  { href: '/my-team', icon: Trophy, label: '팀빌더' },
  { href: '/recommend', icon: Sparkles, label: 'AI추천' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 모바일에서 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-[rgba(251,191,36,0.1)] z-50 px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
            <Star className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold gradient-text">K-Fantasy AI</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
          aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-[#0A0A0A] border-r border-[rgba(251,191,36,0.1)] z-50
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo - Hidden on mobile (shown in header instead) */}
        <div className="hidden lg:block p-6 border-b border-[rgba(251,191,36,0.1)]">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
              <Star className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">K-Fantasy AI</h1>
              <p className="text-xs text-zinc-500">AI가 픽하고, 당신이 이긴다</p>
            </div>
          </Link>
        </div>

        {/* Mobile Logo Space */}
        <div className="lg:hidden h-16 border-b border-[rgba(251,191,36,0.1)]" />

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isActive
                    ? 'active text-amber-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[rgba(251,191,36,0.1)]">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-zinc-500 mb-2">K리그 AI 경진대회</p>
            <p className="text-sm text-zinc-300 font-medium">Track 2: 아이디어 개발</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-nav lg:hidden flex justify-around items-center">
        {mobileTabItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item touch-target ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        {/* More Menu Button */}
        <button
          onClick={() => setIsOpen(true)}
          className={`mobile-nav-item touch-target ${
            !mobileTabItems.some(item => item.href === pathname) ? 'active' : ''
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">더보기</span>
        </button>
      </nav>
    </>
  );
}
