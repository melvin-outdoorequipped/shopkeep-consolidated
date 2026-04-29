'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import SkuProcessor from './components/SkuProcessor';
import AsinConflictChecker from './components/AsinConflictChecker';
import Dashboard from './components/dashboard';
import Documentation from './components/documentation';
import Terms from './components/terms';

type Theme = 'light' | 'dark';
type ToolId = 'sku' | 'asin';
type MainMenuId = 'Dashboard' | 'Tools' | 'Documentation' | 'Terms';

interface MenuItem {
  id: MainMenuId;
  label: string;
  icon: ReactNode;
}

interface ToolItem {
  id: ToolId;
  name: string;
  description: string;
}

interface PageMeta {
  title: string;
  breadcrumb: string;
  description: string;
}

const STORAGE_THEME_KEY = 'theme';

const toolsSubItems: ToolItem[] = [
  {
    id: 'sku',
    name: 'Shopkeep Consolidated Tool',
    description: 'Clean, validate, and consolidate listing operation data.',
  },
  {
    id: 'asin',
    name: 'Multiple Parent ASIN Checker',
    description: 'Detect ASINs assigned to multiple parent listings.',
  },
];

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light-mode', theme === 'light');
  document.documentElement.classList.toggle('dark-mode', theme === 'dark');
}

function DashboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function DocumentationIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function TermsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={
          collapsed
            ? 'M13 5l7 7-7 7M5 5l7 7-7 7'
            : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'
        }
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

interface SectionLabelProps {
  collapsed: boolean;
  theme: Theme;
  label: string;
}

function SectionLabel({ collapsed, theme, label }: SectionLabelProps) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`mb-2 px-3 text-xs font-semibold tracking-wider ${
        collapsed ? 'text-center' : ''
      } ${isDark ? 'text-slate-500' : 'text-gray-400'}`}
    >
      {!collapsed ? (
        label
      ) : (
        <div
          className={`mx-auto h-1 w-1 rounded-full ${
            isDark ? 'bg-slate-600' : 'bg-gray-300'
          }`}
        />
      )}
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  collapsed: boolean;
  icon: ReactNode;
  label: string;
  theme: Theme;
  onClick: () => void;
}

function NavButton({
  active,
  collapsed,
  icon,
  label,
  theme,
  onClick,
}: NavButtonProps) {
  const isDark = theme === 'dark';

  const activeClass = isDark
    ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-600/5 border border-emerald-500/30 shadow-lg shadow-emerald-600/10 text-white'
    : 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 text-gray-900';

  const inactiveClass = isDark
    ? 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
    : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-900';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${
        active ? activeClass : inactiveClass
      }`}
    >
      <div
        className={`transition-colors ${
          active ? 'text-emerald-400' : 'group-hover:text-emerald-400'
        }`}
      >
        {icon}
      </div>

      <span
        className={`text-sm font-medium transition-all duration-300 ${
          collapsed ? 'hidden' : 'block'
        }`}
      >
        {label}
      </span>

      {active && !collapsed && (
        <div className="ml-auto h-6 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600" />
      )}

      {collapsed && (
        <div
          className={`pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 ${
            isDark
              ? 'bg-slate-900 text-white border border-slate-700'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
        >
          {label}
        </div>
      )}
    </button>
  );
}

export default function Home() {
  const [activeTool, setActiveTool] = useState<ToolId>('sku');
  const [activeMainMenu, setActiveMainMenu] = useState<MainMenuId>('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');

  const isDark = theme === 'dark';

  const mainMenuItems = useMemo<MenuItem[]>(
    () => [
      {
        id: 'Dashboard',
        label: 'Dashboard',
        icon: <DashboardIcon />,
      },
      {
        id: 'Tools',
        label: 'Tools',
        icon: <ToolsIcon />,
      },
    ],
    []
  );

  const secondaryMenuItems = useMemo<MenuItem[]>(
    () => [
      {
        id: 'Documentation',
        label: 'Documentation',
        icon: <DocumentationIcon />,
      },
      {
        id: 'Terms',
        label: 'Terms & Conditions',
        icon: <TermsIcon />,
      },
    ],
    []
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme: Theme =
      savedTheme === 'light' || savedTheme === 'dark'
        ? savedTheme
        : prefersDark
          ? 'dark'
          : 'light';

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    const handleNavigateToTool = (event: Event) => {
      const customEvent = event as CustomEvent<{ toolId: ToolId }>;
      const toolId = customEvent.detail?.toolId;

      if (toolId !== 'sku' && toolId !== 'asin') return;

      setActiveMainMenu('Tools');
      setActiveTool(toolId);
      setIsMobileSidebarOpen(false);
    };

    window.addEventListener('navigateToTool', handleNavigateToTool);

    return () => {
      window.removeEventListener('navigateToTool', handleNavigateToTool);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';

      localStorage.setItem(STORAGE_THEME_KEY, nextTheme);
      applyTheme(nextTheme);

      return nextTheme;
    });
  }, []);

  const pageMeta = useMemo<PageMeta>(() => {
    if (activeMainMenu === 'Dashboard') {
      return {
        title: 'Dashboard',
        breadcrumb: 'Overview / Dashboard',
        description: 'Monitor listing operations tools, recent activity, and quick access modules.',
      };
    }

    if (activeMainMenu === 'Tools') {
      const selectedTool = toolsSubItems.find((tool) => tool.id === activeTool);

      return {
        title: selectedTool?.name ?? 'Tools',
        breadcrumb: `Tools / ${selectedTool?.name ?? 'Selected Tool'}`,
        description:
          selectedTool?.description ??
          'Choose a tool to process listing operation data.',
      };
    }

    if (activeMainMenu === 'Documentation') {
      return {
        title: 'Documentation',
        breadcrumb: 'Resources / Documentation',
        description: 'Guides, usage notes, supported formats, and workflow instructions.',
      };
    }

    return {
      title: 'Terms & Conditions',
      breadcrumb: 'Resources / Terms & Conditions',
      description: 'Usage policies, limitations, and important information about this tool.',
    };
  }, [activeMainMenu, activeTool]);

  const handleMainMenuClick = (itemId: MainMenuId) => {
    setActiveMainMenu(itemId);

    if (itemId === 'Dashboard') {
      setActiveTool('sku');
    }

    setIsMobileSidebarOpen(false);
  };

  const handleToolClick = (toolId: ToolId) => {
    setActiveMainMenu('Tools');
    setActiveTool(toolId);
    setIsMobileSidebarOpen(false);
  };

  const renderContent = () => {
    if (activeMainMenu === 'Dashboard') {
      return (
        <div className="animate-in slide-in-from-bottom-4 fade-in w-full duration-500">
          <Dashboard theme={theme} />
        </div>
      );
    }

    if (activeMainMenu === 'Tools') {
      if (activeTool === 'sku') {
        return (
          <div className="animate-in slide-in-from-right-4 fade-in w-full duration-500">
            <SkuProcessor />
          </div>
        );
      }

      return (
        <div className="animate-in slide-in-from-left-4 fade-in flex h-full w-full flex-col duration-500">
          <AsinConflictChecker theme={theme} />
        </div>
      );
    }

    if (activeMainMenu === 'Documentation') {
      return (
        <div className="animate-in slide-in-from-bottom-4 fade-in w-full duration-500">
          <Documentation theme={theme} />
        </div>
      );
    }

    if (activeMainMenu === 'Terms') {
      return (
        <div className="animate-in slide-in-from-bottom-4 fade-in w-full duration-500">
          <Terms theme={theme} />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`relative flex h-screen overflow-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1E293B] text-slate-200'
          : 'bg-gradient-to-br from-[#F3F4F6] via-[#F9FAFB] to-[#E5E7EB] text-gray-900'
      }`}
    >
      {/* Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`absolute -right-40 -top-40 h-80 w-80 rounded-full blur-3xl transition-colors duration-300 ${
            isDark ? 'bg-emerald-600/10' : 'bg-emerald-400/20'
          }`}
        />
        <div
          className={`absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl transition-colors duration-300 ${
            isDark ? 'bg-blue-600/10' : 'bg-blue-400/20'
          }`}
        />
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close mobile sidebar"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r shadow-2xl backdrop-blur-sm transition-all duration-300
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-80'}
        w-80
        ${
          isDark
            ? 'border-slate-700/50 bg-gradient-to-b from-[#1E293B]/95 to-[#0F172A]/95'
            : 'border-gray-200/50 bg-gradient-to-b from-white/95 to-gray-50/95'
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`flex-shrink-0 border-b p-5 ${
            isDark ? 'border-slate-700/50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isSidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <span className="text-lg font-bold text-white">T</span>
                </div>

                <div>
                  <h1
                    className={`bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent ${
                      isDark ? 'from-white to-slate-300' : 'from-gray-900 to-gray-600'
                    }`}
                  >
                    TARA
                  </h1>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Listing Operations Suite
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={`hidden rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 lg:block ${
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-900'
                }`}
              >
                <CollapseIcon collapsed={isSidebarCollapsed} />
              </button>

              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Close sidebar"
                className={`rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 lg:hidden ${
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-900'
                }`}
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-4 px-3">
            <SectionLabel collapsed={isSidebarCollapsed} theme={theme} label="MAIN MENU" />

            <div className="space-y-1">
              {mainMenuItems.map((item) => (
                <NavButton
                  key={item.id}
                  active={activeMainMenu === item.id}
                  collapsed={isSidebarCollapsed}
                  icon={item.icon}
                  label={item.label}
                  theme={theme}
                  onClick={() => handleMainMenuClick(item.id)}
                />
              ))}
            </div>
          </div>

          {activeMainMenu === 'Tools' && !isSidebarCollapsed && (
            <div className="mb-4 px-3">
              <SectionLabel collapsed={false} theme={theme} label="AVAILABLE TOOLS" />

              <div className="space-y-2">
                {toolsSubItems.map((tool) => {
                  const active = activeTool === tool.id;

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleToolClick(tool.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full rounded-xl px-3 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${
                        active
                          ? isDark
                            ? 'border-l-2 border-emerald-500 bg-emerald-600/20'
                            : 'border-l-2 border-emerald-500 bg-emerald-500/10'
                          : isDark
                            ? 'hover:bg-slate-800/50'
                            : 'hover:bg-gray-200/50'
                      }`}
                    >
                      <div
                        className={`text-sm font-semibold ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {tool.name}
                      </div>
                      <p
                        className={`mt-1 line-clamp-2 text-xs ${
                          isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}
                      >
                        {tool.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="px-3">
            <SectionLabel collapsed={isSidebarCollapsed} theme={theme} label="RESOURCES" />

            <div className="space-y-1">
              {secondaryMenuItems.map((item) => (
                <NavButton
                  key={item.id}
                  active={activeMainMenu === item.id}
                  collapsed={isSidebarCollapsed}
                  icon={item.icon}
                  label={item.label}
                  theme={theme}
                  onClick={() => handleMainMenuClick(item.id)}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`border-t p-4 ${
            isDark ? 'border-slate-700/50' : 'border-gray-200'
          }`}
        >
          {!isSidebarCollapsed ? (
            <div
              className={`rounded-xl border p-3 ${
                isDark
                  ? 'border-emerald-500/20 bg-emerald-600/10'
                  : 'border-emerald-500/20 bg-emerald-500/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-500">
                  Tools ready
                </span>
              </div>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Beta v1.0
              </p>
            </div>
          ) : (
            <div className="mx-auto h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div
        className={`flex h-full flex-1 flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'
        } ml-0`}
      >
        {/* Header */}
        <header
          className={`relative z-20 flex-shrink-0 border-b px-4 py-4 shadow-lg backdrop-blur-sm sm:px-6 lg:px-8 ${
            isDark
              ? 'border-slate-700/50 bg-gradient-to-r from-[#1E293B]/70 via-[#0F172A]/70 to-[#1E293B]/70'
              : 'border-gray-200/50 bg-gradient-to-r from-white/70 via-gray-50/70 to-white/70'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open sidebar"
                className={`rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 lg:hidden ${
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-900'
                }`}
              >
                <MenuIcon />
              </button>

              <div className="hidden h-10 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 sm:block" />

              <div className="min-w-0">
                <h2
                  className={`truncate text-xs font-medium sm:text-sm ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}
                >
                  {pageMeta.breadcrumb}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`truncate text-lg font-semibold sm:text-xl ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {pageMeta.title}
                  </p>

                  {activeMainMenu === 'Tools' && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                      Active Tool
                    </span>
                  )}
                </div>
                <p
                  className={`mt-0.5 hidden text-sm sm:block ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}
                >
                  {pageMeta.description}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
              {activeMainMenu === 'Tools' && (
                <button
                  type="button"
                  className={`hidden rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 md:block ${
                    isDark
                      ? 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'border-gray-200 bg-white/70 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  View Guide
                </button>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                className={`rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-yellow-400'
                    : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-900'
                }`}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>

              <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-600/10 px-3 py-1.5 sm:flex">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-400">
                  Tools ready
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <section className="relative">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-600/5 to-transparent blur-xl" />

                <div
                  className={`relative overflow-hidden rounded-2xl border shadow-xl backdrop-blur-sm transition-colors duration-300 ${
                    isDark
                      ? 'border-slate-700/30 bg-gradient-to-br from-[#1E293B]/40 to-[#0F172A]/40'
                      : 'border-gray-200/50 bg-gradient-to-br from-white/90 to-gray-100/90'
                  }`}
                >
                  <div
                    className={`absolute right-0 top-0 h-64 w-64 rounded-full blur-3xl ${
                      isDark ? 'bg-emerald-600/5' : 'bg-emerald-400/10'
                    }`}
                  />

                  <div className="relative p-4 sm:p-6">{renderContent()}</div>
                </div>
              </section>

              <footer className="mt-8 pb-4 text-center">
                <p
                  className={`flex flex-wrap items-center justify-center gap-2 text-xs ${
                    isDark ? 'text-slate-500' : 'text-gray-400'
                  }`}
                >
                  <InfoIcon />
                  © Listing Ops Tool 2026. All rights reserved
                  <span
                    className={`h-1 w-1 rounded-full ${
                      isDark ? 'bg-slate-600' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-emerald-500/60">Beta v1.0</span>
                </p>
              </footer>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .light-mode {
          --bg-primary: #ffffff;
          --bg-secondary: #f3f4f6;
          --text-primary: #111827;
          --text-secondary: #6b7280;
          --border-color: #e5e7eb;
        }

        .dark-mode {
          --bg-primary: #0f172a;
          --bg-secondary: #1e293b;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --border-color: #334155;
        }

        html {
          scroll-behavior: smooth;
        }

        ::selection {
          background: rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  );
}