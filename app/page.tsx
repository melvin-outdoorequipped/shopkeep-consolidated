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
  Settings,
  X,
} from 'lucide-react';

import SkuProcessor from './components/SkuProcessor';
import AsinConflictChecker from './components/AsinConflictChecker';
import Dashboard from './components/dashboard';
import Documentation from './components/documentation';
import Terms from './components/terms';
import DownloadPage from './components/download';

type Theme = 'light' | 'dark';
type ToolId = 'sku' | 'asin';

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
}

const STORAGE_THEME_KEY = 'theme';

const toolsSubItems: ToolItem[] = [
  {
    id: 'sku',
    name: 'Shopkeep Consolidated Tool',
    description: 'Process and consolidate SKU data.',
  },
  {
    id: 'asin',
    name: 'Multiple Parent ASIN Checker',
    description: 'Detect styles with multiple parent ASINs.',
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

  const handleMainMenuClick = (id: MainMenuId) => {
    setActiveMainMenu(id);
    setIsMobileSidebarOpen(false);
  };

  const handleToolClick = (toolId: ToolId) => {
    setActiveMainMenu('Tools');
    setActiveTool(toolId);
    setIsMobileSidebarOpen(false);
  };

  const pageMeta = useMemo(() => {
    if (activeMainMenu === 'Dashboard') {
      return {
        title: 'Dashboard',
        breadcrumb: 'Overview / Dashboard',
        description: 'Monitor operation tools and launch listing workflows.',
      };
    }

    if (activeMainMenu === 'Tools') {
      const selectedTool = toolsSubItems.find((tool) => tool.id === activeTool);

      return {
        title: selectedTool?.name ?? 'Tools',
        breadcrumb: `Tools / ${selectedTool?.name ?? 'Selected Tool'}`,
        description: selectedTool?.description ?? 'Run listing operations tools.',
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
        description: 'Guides, instructions, and tool usage notes.',
      };
    }

    return {
      title: 'Terms & Conditions',
      breadcrumb: 'Resources / Terms & Conditions',
      description: 'Usage policies and important information.',
    };
  }, [activeMainMenu, activeTool]);

  const renderContent = () => {
    if (activeMainMenu === 'Dashboard') {
      return <Dashboard theme={theme} />;
    }

    if (activeMainMenu === 'Downloads') {
      return <DownloadPage theme={theme} />;
    }

    if (activeMainMenu === 'Tools') {
      if (activeTool === 'sku') {
        return <SkuProcessor theme={theme} />;
      }

      return <AsinConflictChecker theme={theme} />;
    }

    if (activeMainMenu === 'Documentation') {
      return <Documentation theme={theme} />;
    }

    if (activeMainMenu === 'Terms') {
      return <Terms theme={theme} />;
    }

    return null;
  };

  return (
    <div
      className={`relative flex h-screen overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#0F172A] text-slate-100' : 'bg-gray-100 text-gray-900'
      }`}
    >
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r shadow-2xl transition-all duration-300
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-80'}
        w-80
        ${
          isDark
            ? 'border-slate-700/60 bg-[#172235]'
            : 'border-gray-200 bg-white'
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`border-b p-5 ${
            isDark ? 'border-slate-700/60' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isSidebarCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-lg">
                  <span className="text-lg font-bold text-white">T</span>
                </div>

                <div>
                  <h1 className="text-xl font-bold text-white">TARA</h1>
                  <p className="text-xs text-slate-400">
                    Listing Operations Tools
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                className={`hidden rounded-lg p-2 transition-colors lg:block ${
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
                className={`rounded-lg p-2 transition-colors lg:hidden ${
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

          {activeMainMenu === 'Tools' && !isSidebarCollapsed && (
            <div className="mt-5 space-y-2 px-2">
              {toolsSubItems.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleToolClick(tool.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    activeTool === tool.id
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : isDark
                        ? 'border-slate-700/40 text-slate-400 hover:bg-slate-800/60 hover:text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm font-semibold">{tool.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {tool.description}
                  </div>
                </button>
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
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">
                  Tools ready
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Beta v1.0</p>
            </div>
          ) : (
            <div className="mx-auto h-2 w-2 rounded-full bg-emerald-400" />
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex h-full flex-1 flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'
        } ml-0`}
      >
        {/* Header */}
        <header
          className={`border-b px-4 py-4 shadow-xl backdrop-blur-sm sm:px-6 lg:px-8 ${
            isDark
              ? 'border-slate-700/50 bg-[#172235]/80'
              : 'border-gray-200 bg-white/80'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className={`rounded-lg p-2 transition-colors lg:hidden ${
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
                  className={`truncate text-xl font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {pageMeta.title}
                </h2>

                <p className="hidden text-sm text-slate-500 sm:block">
                  {pageMeta.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
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
      className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-all ${
        active
          ? 'border-emerald-500/50 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/5'
          : isDark
            ? 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-white'
            : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span
        className={`transition-colors ${
          active ? 'text-emerald-400' : 'group-hover:text-emerald-400'
        }`}
      >
        {icon}
      </span>

      <span className={`${collapsed ? 'hidden' : 'block'} font-medium`}>
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