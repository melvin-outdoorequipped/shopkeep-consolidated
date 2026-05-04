'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Home,
  Menu,
  MessageSquare,
  Settings,
  X,
} from 'lucide-react';

import SkuProcessor from './components/SkuProcessor';
import AsinConflictChecker from './components/AsinConflictChecker';
import BasecampGenerator from './components/BasecampGenerator';
import Dashboard from './components/dashboard';
import Documentation from './components/documentation';
import Terms from './components/terms';
import DownloadPage from './components/download';

type Theme = 'light' | 'dark';
type ToolId = 'sku' | 'asin' | 'basecamp';

type MainMenuId =
  | 'Dashboard'
  | 'Tools'
  | 'Downloads'
  | 'Documentation'
  | 'Terms';

interface MenuItem {
  id: MainMenuId;
  label: string;
  icon: ReactNode;
}

interface ToolItem {
  id: ToolId;
  name: string;
  description: string;
  icon: ReactNode;
  accent: 'emerald' | 'cyan' | 'violet';
  comingSoon?: boolean;
}

const STORAGE_THEME_KEY = 'theme';

const toolsSubItems: ToolItem[] = [
  {
    id: 'sku',
    name: 'Shopkeep Consolidated Tool',
    description: 'Process and consolidate SKU data.',
    icon: <Settings className="h-4 w-4" />,
    accent: 'cyan',
  },
  {
    id: 'asin',
    name: 'Multiple Parent ASIN Checker',
    description: 'Detect styles with multiple parent ASINs.',
    icon: <Settings className="h-4 w-4" />,
    accent: 'emerald',
  },
  {
    id: 'basecamp',
    name: 'Basecamp Response Generator',
    description: 'Generate formatted Basecamp messages.',
    icon: <MessageSquare className="h-4 w-4" />,
    accent: 'violet',
  },
];

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light-mode', theme === 'light');
  document.documentElement.classList.toggle('dark-mode', theme === 'dark');
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export default function HomePage() {
  const [activeTool, setActiveTool] = useState<ToolId>('sku');
  const [activeMainMenu, setActiveMainMenu] =
    useState<MainMenuId>('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');

  const isDark = theme === 'dark';

  const mainMenuItems = useMemo<MenuItem[]>(
    () => [
      {
        id: 'Dashboard',
        label: 'Dashboard',
        icon: <Home className="h-5 w-5" />,
      },
      {
        id: 'Tools',
        label: 'Tools',
        icon: <Settings className="h-5 w-5" />,
      },
      {
        id: 'Downloads',
        label: 'Downloads',
        icon: <Download className="h-5 w-5" />,
      },
    ],
    []
  );

  const resourceMenuItems = useMemo<MenuItem[]>(
    () => [
      {
        id: 'Documentation',
        label: 'Documentation',
        icon: <BookOpen className="h-5 w-5" />,
      },
      {
        id: 'Terms',
        label: 'Terms & Conditions',
        icon: <FileText className="h-5 w-5" />,
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

      if (toolId !== 'sku' && toolId !== 'asin' && toolId !== 'basecamp') {
        return;
      }

      const selectedTool = toolsSubItems.find((tool) => tool.id === toolId);

      if (selectedTool?.comingSoon) {
        return;
      }

      setActiveMainMenu('Tools');
      setActiveTool(toolId);
      setIsMobileSidebarOpen(false);
    };

    window.addEventListener('navigateToTool', handleNavigateToTool);

    return () => {
      window.removeEventListener('navigateToTool', handleNavigateToTool);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
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

  const handleMainMenuClick = (id: MainMenuId) => {
    setActiveMainMenu(id);
    setIsMobileSidebarOpen(false);
  };

  const handleToolClick = (toolId: ToolId, comingSoon?: boolean) => {
    if (comingSoon) return;

    setActiveMainMenu('Tools');
    setActiveTool(toolId);
    setIsMobileSidebarOpen(false);
  };

  const selectedTool = toolsSubItems.find((tool) => tool.id === activeTool);

  const pageMeta = useMemo(() => {
    if (activeMainMenu === 'Dashboard') {
      return {
        title: 'Dashboard',
        breadcrumb: 'Overview / Dashboard',
        description: 'Monitor operation tools and launch listing workflows.',
      };
    }

    if (activeMainMenu === 'Tools') {
      const currentTool = toolsSubItems.find((tool) => tool.id === activeTool);

      return {
        title: currentTool?.name ?? 'Tools',
        breadcrumb: `Tools / ${currentTool?.name ?? 'Selected Tool'}`,
        description: currentTool?.description ?? 'Run listing operations tools.',
      };
    }

    if (activeMainMenu === 'Downloads') {
      return {
        title: 'Downloads',
        breadcrumb: 'Files / Downloads',
        description: 'Download generated files from completed tool runs.',
      };
    }

    if (activeMainMenu === 'Documentation') {
      return {
        title: 'Documentation',
        breadcrumb: 'Resources / Documentation',
        description: 'Simple guide for using TARA tools.',
      };
    }

    return {
      title: 'Terms & Conditions',
      breadcrumb: 'Resources / Terms & Conditions',
      description: 'Simple usage terms and reminders.',
    };
  }, [activeMainMenu, activeTool]);

  const renderContent = () => {
    if (activeMainMenu === 'Dashboard') {
      return <Dashboard theme={theme} />;
    }

    if (activeMainMenu === 'Downloads') {
      return <DownloadPage theme={theme} />;
    }

    if (activeMainMenu === 'Documentation') {
      return <Documentation theme={theme} />;
    }

    if (activeMainMenu === 'Terms') {
      return <Terms theme={theme} />;
    }

    if (activeMainMenu === 'Tools') {
      if (activeTool === 'sku') {
        return <SkuProcessor theme={theme} />;
      }

      if (activeTool === 'asin') {
        return <AsinConflictChecker theme={theme} />;
      }

      if (activeTool === 'basecamp') {
        return <BasecampGenerator theme={theme} />;
      }
    }

    return null;
  };

  return (
    <div
      className={`relative flex h-screen overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0F172A] text-slate-100' : 'bg-gray-100 text-gray-900'
      }`}
    >
      {/* Mobile Overlay */}
      <button
        type="button"
        aria-label="Close sidebar overlay"
        onClick={() => setIsMobileSidebarOpen(false)}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 ease-out lg:hidden ${
          isMobileSidebarOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r shadow-2xl
        transition-transform duration-200 ease-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        lg:transition-[width] lg:duration-200 lg:ease-out
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-80'}
        w-80 max-w-[85vw]
        ${
          isDark
            ? 'border-slate-700/60 bg-[#172235]'
            : 'border-gray-200 bg-white'
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`border-b p-4 sm:p-5 ${
            isDark ? 'border-slate-700/60' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div
              className={`min-w-0 overflow-hidden transition-[width,opacity] duration-200 ease-out ${
                isSidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-lg">
                  <span className="text-lg font-bold text-white">T</span>
                </div>

                <div className="min-w-0">
                  <h1
                    className={`truncate text-xl font-bold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    TARA
                  </h1>
                  <p
                    className={`truncate text-xs ${
                      isDark ? 'text-slate-400' : 'text-gray-500'
                    }`}
                  >
                    Listing Operations Tools
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                className={`hidden rounded-lg p-2 transition-colors duration-150 lg:block ${
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-label="Toggle sidebar"
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`rounded-lg p-2 transition-colors duration-150 lg:hidden ${
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <SectionLabel collapsed={isSidebarCollapsed} label="MAIN MENU" />

          <div className="space-y-2">
            {mainMenuItems.map((item) => (
              <SidebarButton
                key={item.id}
                label={item.label}
                icon={item.icon}
                active={activeMainMenu === item.id}
                collapsed={isSidebarCollapsed}
                theme={theme}
                onClick={() => handleMainMenuClick(item.id)}
              />
            ))}
          </div>

          {/* Expanded Tool List */}
          {activeMainMenu === 'Tools' && !isSidebarCollapsed && (
            <div className="mt-5 space-y-2 px-1 sm:px-2">
              {toolsSubItems.map((tool) => (
                <ToolSidebarButton
                  key={tool.id}
                  tool={tool}
                  active={activeTool === tool.id}
                  theme={theme}
                  onClick={() => handleToolClick(tool.id, tool.comingSoon)}
                />
              ))}
            </div>
          )}

          {/* Collapsed Tool Icons */}
          {activeMainMenu === 'Tools' && isSidebarCollapsed && (
            <div className="mt-5 hidden space-y-2 lg:block">
              {toolsSubItems.map((tool) => (
                <CollapsedToolButton
                  key={tool.id}
                  tool={tool}
                  active={activeTool === tool.id}
                  theme={theme}
                  onClick={() => handleToolClick(tool.id, tool.comingSoon)}
                />
              ))}
            </div>
          )}

          <div className="mt-7">
            <SectionLabel collapsed={isSidebarCollapsed} label="RESOURCES" />

            <div className="space-y-2">
              {resourceMenuItems.map((item) => (
                <SidebarButton
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  active={activeMainMenu === item.id}
                  collapsed={isSidebarCollapsed}
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
            isDark ? 'border-slate-700/60' : 'border-gray-200'
          }`}
        >
          {!isSidebarCollapsed ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 transition-colors duration-150 hover:border-emerald-500/50 hover:bg-emerald-500/15">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">
                  Tools ready
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Beta v1.0</p>
            </div>
          ) : (
            <div className="mx-auto h-2.5 w-2.5 rounded-full bg-emerald-400" />
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div
        className={`ml-0 flex h-full min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'
        }`}
      >
        {/* Top Header */}
        <header
          className={`sticky top-0 z-20 border-b px-4 py-3 shadow-lg backdrop-blur-md sm:px-6 lg:px-8 ${
            isDark
              ? 'border-slate-700/50 bg-[#172235]/85'
              : 'border-gray-200 bg-white/85'
          }`}
        >
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className={`flex-shrink-0 rounded-lg p-2 transition-colors duration-150 lg:hidden ${
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="truncate text-xs text-slate-400">
                  {pageMeta.breadcrumb}
                </p>

                <h2
                  className={`truncate text-lg font-semibold sm:text-xl ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {pageMeta.title}
                </h2>

                <p className="hidden truncate text-sm text-slate-500 sm:block">
                  {pageMeta.description}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              {activeMainMenu === 'Tools' && selectedTool && (
                <span
                  className={`hidden rounded-full border px-3 py-1 text-xs font-semibold md:inline-flex ${
                    selectedTool.accent === 'violet'
                      ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                      : selectedTool.accent === 'cyan'
                        ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  }`}
                >
                  {selectedTool.name}
                </span>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-full p-4 sm:p-6 lg:p-8">
            {renderContent()}
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
          --bg-secondary: #172235;
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

        * {
          -webkit-tap-highlight-color: transparent;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

function SectionLabel({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  return (
    <div className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">
      {collapsed ? (
        <span className="mx-auto block h-1 w-1 rounded-full bg-slate-600" />
      ) : (
        label
      )}
    </div>
  );
}

function SidebarButton({
  label,
  icon,
  active,
  collapsed,
  theme,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  collapsed: boolean;
  theme: Theme;
  onClick: () => void;
}) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors duration-150 ${
        active
          ? 'border-emerald-500/50 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/5'
          : isDark
            ? 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-white'
            : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span
        className={`flex-shrink-0 transition-colors ${
          active ? 'text-emerald-400' : 'group-hover:text-emerald-400'
        }`}
      >
        {icon}
      </span>

      <span
        className={`${
          collapsed ? 'hidden' : 'block'
        } min-w-0 truncate font-medium`}
      >
        {label}
      </span>

      {active && !collapsed && (
        <span className="ml-auto h-7 w-1 rounded-full bg-emerald-400" />
      )}

      {collapsed && (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
          {label}
        </span>
      )}
    </button>
  );
}

function ToolSidebarButton({
  tool,
  active,
  theme,
  onClick,
}: {
  tool: ToolItem;
  active: boolean;
  theme: Theme;
  onClick: () => void;
}) {
  const isDark = theme === 'dark';

  const activeClass =
    tool.accent === 'violet'
      ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
      : tool.accent === 'cyan'
        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={tool.comingSoon}
      className={`group w-full rounded-xl border px-3 py-3 text-left transition-colors duration-150 ${
        tool.comingSoon
          ? 'cursor-not-allowed opacity-60'
          : active
            ? activeClass
            : isDark
              ? 'border-slate-700/40 text-slate-400 hover:bg-slate-800/60 hover:text-white'
              : 'border-gray-200 text-gray-600 hover:bg-gray-100'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex-shrink-0">{tool.icon}</span>

        <span className="min-w-0 truncate text-sm font-semibold">
          {tool.name}
        </span>

        {tool.comingSoon && (
          <span className="ml-auto rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
            Soon
          </span>
        )}
      </div>

      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
        {tool.description}
      </p>
    </button>
  );
}

function CollapsedToolButton({
  tool,
  active,
  theme,
  onClick,
}: {
  tool: ToolItem;
  active: boolean;
  theme: Theme;
  onClick: () => void;
}) {
  const isDark = theme === 'dark';

  const activeColor =
    tool.accent === 'violet'
      ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
      : tool.accent === 'cyan'
        ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
        : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={tool.comingSoon}
      title={tool.name}
      className={`group relative mx-auto flex h-11 w-11 items-center justify-center rounded-xl border transition-colors duration-150 ${
        active
          ? activeColor
          : isDark
            ? 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-white'
            : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {tool.icon}

      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
        {tool.name}
      </span>
    </button>
  );
}