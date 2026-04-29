'use client';

import { useState, useEffect } from 'react';
import SkuProcessor from './components/SkuProcessor';
import AsinConflictChecker from './components/AsinConflictChecker';
import Dashboard from './components/dashboard';
import Documentation from './components/documentation';
import Terms from './components/terms';

export default function Home() {
  const [activeTool, setActiveTool] = useState<'sku' | 'asin'>('sku');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMainMenu, setActiveMainMenu] = useState('Dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Handle theme switching
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('light-mode', savedTheme === 'light');
      document.documentElement.classList.toggle('dark-mode', savedTheme === 'dark');
    } else {
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.classList.toggle('light-mode', initialTheme === 'light');
      document.documentElement.classList.toggle('dark-mode', initialTheme === 'dark');
    }
  }, []);

  // Listen for navigation events from Dashboard
  useEffect(() => {
    const handleNavigateToTool = (event: CustomEvent) => {
      const { toolId } = event.detail;
      setActiveMainMenu('Tools');
      setActiveTool(toolId as 'sku' | 'asin');
    };

    window.addEventListener('navigateToTool', handleNavigateToTool as EventListener);
    
    return () => {
      window.removeEventListener('navigateToTool', handleNavigateToTool as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light-mode', newTheme === 'light');
    document.documentElement.classList.toggle('dark-mode', newTheme === 'dark');
  };

  const mainMenuItems = [
    { id: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { id: 'Tools', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  const secondaryMenuItems = [
    { id: 'Documentation', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )},
    { id: 'Terms', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
  ];

  // Tools sub-items
  const toolsSubItems = [
    { id: 'sku', name: 'Shopkeep Consolidated Tool'},
    { id: 'asin', name: 'Multiple Parent ASIN Checker'},
  ];

  // Get current page title and breadcrumb
  const getPageTitle = () => {
    if (activeMainMenu === 'Dashboard') {
      return 'Dashboard';
    } else if (activeMainMenu === 'Tools') {
      return activeTool === 'sku' ? 'Shopkeep Consolidated Tool' : 'Multiple Parent ASIN Checker';
    } else if (activeMainMenu === 'Documentation') {
      return 'Documentation';
    } else if (activeMainMenu === 'Terms') {
      return 'Terms & Conditions';
    }
    return activeMainMenu;
  };

  const getBreadcrumb = () => {
    if (activeMainMenu === 'Dashboard') {
      return 'Overview / Dashboard';
    } else if (activeMainMenu === 'Tools') {
      return `Tools / ${activeTool === 'sku' ? 'Shopkeep Consolidated Tool' : 'Multiple Parent ASIN Checker'}`;
    } else if (activeMainMenu === 'Documentation') {
      return 'Resources / Documentation';
    } else if (activeMainMenu === 'Terms') {
      return 'Resources / Terms & Conditions';
    }
    return activeMainMenu;
  };

  return (
    <div className={`h-screen overflow-hidden transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1E293B] text-slate-200' 
        : 'bg-gradient-to-br from-[#F3F4F6] via-[#F9FAFB] to-[#E5E7EB] text-gray-900'
    } flex relative`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-colors duration-300 ${
          theme === 'dark' ? 'bg-emerald-600/10' : 'bg-emerald-400/20'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl transition-colors duration-300 ${
          theme === 'dark' ? 'bg-blue-600/10' : 'bg-blue-400/20'
        }`}></div>
      </div>

      {/* Sidebar - Fixed position */}
      <aside className={`fixed left-0 top-0 h-full z-30 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-80'} ${
        theme === 'dark'
          ? 'bg-gradient-to-b from-[#1E293B]/95 to-[#0F172A]/95 border-slate-700/50'
          : 'bg-gradient-to-b from-white/95 to-gray-50/95 border-gray-200/50'
      } backdrop-blur-sm border-r flex flex-col shadow-2xl`}>
        {/* Sidebar Header with Logo */}
        <div className={`p-5 border-b flex-shrink-0 ${theme === 'dark' ? 'border-slate-700/50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div>
                  <h1 className={`text-xl font-bold bg-gradient-to-r ${
                    theme === 'dark' ? 'from-white to-slate-300' : 'from-gray-900 to-gray-600'
                  } bg-clip-text text-transparent`}>
                    TARA
                  </h1>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Listings Ops Tools</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                theme === 'dark' 
                  ? 'hover:bg-slate-800/50 text-slate-400 hover:text-white' 
                  : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Navigation - Scrollable if content overflows */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-4">
            <div className={`text-xs font-semibold tracking-wider mb-2 px-3 ${isSidebarCollapsed ? 'text-center' : ''} ${
              theme === 'dark' ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {!isSidebarCollapsed && 'MAIN MENU'}
              {isSidebarCollapsed && <div className={`w-1 h-1 rounded-full mx-auto ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}></div>}
            </div>
            <div className="space-y-1">
              {mainMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveMainMenu(item.id);
                    if (item.id === 'Dashboard') {
                      setActiveTool('sku');
                    }
                  }}
                  className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                    activeMainMenu === item.id
                      ? theme === 'dark'
                        ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-600/5 border border-emerald-500/30 shadow-lg shadow-emerald-600/10 text-white'
                        : 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 text-gray-900'
                      : theme === 'dark'
                        ? 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                        : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <div className={`text-current transition-colors ${activeMainMenu === item.id ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`}>
                    {item.icon}
                  </div>
                  <span className={`text-sm font-medium transition-all duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                    {item.id}
                  </span>
                  {activeMainMenu === item.id && !isSidebarCollapsed && (
                    <div className="ml-auto w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tools Sub-items - Only visible when Tools is active */}
          {activeMainMenu === 'Tools' && !isSidebarCollapsed && (
            <div className="px-3 mb-4">
              <div className={`text-xs font-semibold tracking-wider mb-2 px-3 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
                AVAILABLE TOOLS
              </div>
              <div className="space-y-2">
                {toolsSubItems.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as 'sku' | 'asin')}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-200 ${
                      activeTool === tool.id
                        ? theme === 'dark'
                          ? 'bg-emerald-600/20 border-l-2 border-emerald-500'
                          : 'bg-emerald-500/10 border-l-2 border-emerald-500'
                        : theme === 'dark'
                          ? 'hover:bg-slate-800/50'
                          : 'hover:bg-gray-200/50'
                    }`}
                  >
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{tool.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Navigation */}
          <div className="px-3">
            <div className={`text-xs font-semibold tracking-wider mb-2 px-3 ${isSidebarCollapsed ? 'text-center' : ''} ${
              theme === 'dark' ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {!isSidebarCollapsed && 'RESOURCES'}
              {isSidebarCollapsed && <div className={`w-1 h-1 rounded-full mx-auto mt-2 ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}></div>}
            </div>
            <div className="space-y-1">
              {secondaryMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveMainMenu(item.id)}
                  className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                    activeMainMenu === item.id
                      ? theme === 'dark'
                        ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-600/5 border border-emerald-500/30 shadow-lg shadow-emerald-600/10 text-white'
                        : 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 text-gray-900'
                      : theme === 'dark'
                        ? 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                        : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <div className="group-hover:text-emerald-400 transition-colors">
                    {item.icon}
                  </div>
                  <span className={`text-sm transition-all duration-300 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                    {item.id === 'Terms' ? 'Terms & Conditions' : item.id}
                  </span>
                  {activeMainMenu === item.id && !isSidebarCollapsed && (
                    <div className="ml-auto w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area - With left margin to account for fixed sidebar */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-80'}`}>
        {/* Header - Sticky */}
        <header className={`relative border-b flex-shrink-0 ${
          theme === 'dark' 
            ? 'border-slate-700/50 bg-gradient-to-r from-[#1E293B]/50 via-[#0F172A]/50 to-[#1E293B]/50' 
            : 'border-gray-200/50 bg-gradient-to-r from-white/50 via-gray-50/50 to-white/50'
        } backdrop-blur-sm px-8 py-4 shadow-xl z-20`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
              <div>
                <h2 className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                  {getBreadcrumb()}
                </h2>
                <p className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {getPageTitle()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  theme === 'dark'
                    ? 'hover:bg-slate-800/50 text-slate-400 hover:text-yellow-400'
                    : 'hover:bg-gray-200/50 text-gray-500 hover:text-gray-900'
                }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-emerald-400 font-medium">System Operational</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              {/* Main Content Card */}
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600/5 to-transparent rounded-2xl blur-xl"></div>
                
                <div className={`relative backdrop-blur-sm rounded-2xl border shadow-2xl overflow-hidden transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-[#1E293B]/30 to-[#0F172A]/30 border-slate-700/30'
                    : 'bg-gradient-to-br from-white/80 to-gray-100/80 border-gray-200/50'
                }`}>
                  <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl ${
                    theme === 'dark' ? 'bg-emerald-600/5' : 'bg-emerald-400/10'
                  }`}></div>
                  
                  <div className="relative p-6">
                    {activeMainMenu === 'Dashboard' ? (
                      <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 w-full">
                        <Dashboard theme={theme} />
                      </div>
                    ) : activeMainMenu === 'Tools' ? (
                      activeTool === 'sku' ? (
                        <div className="animate-in slide-in-from-right-4 fade-in duration-500 w-full">
                          <SkuProcessor />
                        </div>
                      ) : (
                        <div className="animate-in slide-in-from-left-4 fade-in duration-500 w-full h-full flex flex-col">
                          <AsinConflictChecker theme={theme} />
                        </div>
                      )
                    ) : activeMainMenu === 'Documentation' ? (
                      <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 w-full">
                        <Documentation theme={theme} />
                      </div>
                    ) : activeMainMenu === 'Terms' ? (
                      <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 w-full">
                        <Terms theme={theme} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-8 text-center pb-4">
                <p className={`text-xs flex items-center justify-center gap-2 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  © Listing Ops Tool 2026. All rights reserved
                  <span className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}></span>
                  <span className="text-emerald-500/60">beta v1.0</span>
                </p>
              </div>
            </div>
          </div>
        </div>
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

        /* Smooth transitions for all elements */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
        }
      `}</style>
    </div>
  );
}