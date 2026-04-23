'use client';

import { useState } from 'react';
import SkuProcessor from './components/SkuProcessor';
import AsinConflictChecker from './components/AsinConflictChecker';

export default function Home() {
  // Use state to determine which tool is currently active
  const [activeTool, setActiveTool] = useState<'sku' | 'asin'>('sku');

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-200 flex flex-col">
      {/* Universal Header */}
      <header className="border-b border-slate-700/50 bg-gradient-to-r from-[#1E293B] to-[#0F172A] px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">TARA</h1>
            <p className="text-xs text-slate-400 mt-0.5">Listings Ops Tools</p>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-3 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
            <button 
              onClick={() => setActiveTool('sku')} 
              className={`text-sm px-4 py-2 rounded-md transition-all duration-200 ${
                activeTool === 'sku' 
                  ? 'bg-emerald-600/90 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Shopkeep Consolidated
            </button>
            <button 
              onClick={() => setActiveTool('asin')} 
              className={`text-sm px-4 py-2 rounded-md transition-all duration-200 ${
                activeTool === 'asin' 
                  ? 'bg-emerald-600/90 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Multiple Parent ASIN Checker
            </button>
          </div>

          <img
            src="https://img.sanishtech.com/u/3d37f0af708035d0b169497c7f2557f0.png"
            alt="Shopkeep Logo"
            width="100"
            height="135"
            loading="lazy"
            className="max-w-[80px] h-auto hidden sm:block opacity-80"
          />
        </div>
      </header>

      {/* Dynamic Content Area */}
      <div className="max-w-7xl mx-auto p-6 w-full flex-1 flex flex-col">
        {activeTool === 'sku' ? (
          <div className="animate-in fade-in duration-300 w-full">
            <SkuProcessor />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300 w-full h-full flex flex-col">
            <AsinConflictChecker />
          </div>
        )}
      </div>
    </main>
  );
}