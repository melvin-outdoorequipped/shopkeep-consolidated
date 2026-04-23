'use client';

import { useState } from 'react';
import { Loader2, Play, Trash2 } from 'lucide-react';

export default function AsinConflictChecker() {
  const [stylesInput, setStylesInput] = useState('');
  const [asinsInput, setAsinsInput] = useState('');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastRan, setLastRan] = useState<{ date: string; time: string } | null>(null);

  const handleRun = async () => {
    if (!stylesInput.trim() && !asinsInput.trim()) return;
    
    setIsChecking(true);
    
    // Split both inputs by line
    const stylesArray = stylesInput.split('\n');
    const asinsArray = asinsInput.split('\n');
    
    // Pair them up by row index
    const maxRows = Math.max(stylesArray.length, asinsArray.length);
    const pairs = [];
    
    for (let i = 0; i < maxRows; i++) {
      const style = stylesArray[i]?.trim();
      const asin = asinsArray[i]?.trim();
      
      // Only add to processing if both exist
      if (style && asin) {
        pairs.push({ style, asin });
      }
    }

    try {
      const res = await fetch('/api/check-asin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairs }),
      });
      
      const { conflicts } = await res.json();
      setConflicts(conflicts || []);
      
      // Update Last Ran timestamps
      const now = new Date();
      setLastRan({
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (error) {
      console.error("Failed to check ASINs", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClear = () => {
    setStylesInput('');
    setAsinsInput('');
    setConflicts([]);
    setLastRan(null);
  };

  // Calculate the maximum number of ASINs to generate the right number of table columns
  const maxAsins = conflicts.length > 0 
    ? Math.max(...conflicts.map((c) => c.asins.length)) 
    : 0;

  // Sync scrolling between the two input textareas for better UX
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>, targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="bg-[#1E293B] border border-slate-700/50 rounded-xl shadow-lg flex flex-col w-full min-h-[700px] flex-1 overflow-hidden">
      
      {/* Top Meta Bar */}
      <div className="bg-slate-800/80 border-b border-slate-700 p-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex gap-4">
          <button 
            onClick={handleRun} 
            disabled={(!stylesInput && !asinsInput) || isChecking}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            RUN
          </button>
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-semibold text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>

        {lastRan && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-400 font-semibold">Date:</span>
              <span className="bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded border border-cyan-800/50">{lastRan.date}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-400 font-semibold">Time:</span>
              <span className="bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded border border-cyan-800/50">{lastRan.time}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden h-full">
        
        {/* Left Column: Input Area */}
        <div className="col-span-4 lg:col-span-3 border-r border-slate-700 flex flex-col bg-slate-900/50 h-full">
          <div className="grid grid-cols-2 bg-amber-600/20 border-b border-amber-600/30 shrink-0">
            <div className="p-3 text-xs font-bold text-amber-500 border-r border-amber-600/30 flex items-center justify-between">
              Style <span className="text-amber-500/50">▼</span>
            </div>
            <div className="p-3 text-xs font-bold text-amber-500 flex items-center justify-between">
              Parent ASIN <span className="text-amber-500/50">▼</span>
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            <textarea
              id="styles-input"
              className="w-1/2 h-full bg-transparent text-slate-200 p-3 font-mono text-sm resize-none focus:outline-none focus:bg-slate-800/50 border-r border-slate-700/50 placeholder-slate-600 whitespace-pre hide-scrollbar"
              placeholder="Paste Styles...&#10;Style1&#10;Style2"
              value={stylesInput}
              onChange={(e) => setStylesInput(e.target.value)}
              onScroll={(e) => handleScroll(e, 'asins-input')}
              disabled={isChecking}
            />
            <textarea
              id="asins-input"
              className="w-1/2 h-full bg-transparent text-slate-200 p-3 font-mono text-sm resize-none focus:outline-none focus:bg-slate-800/50 placeholder-slate-600 whitespace-pre custom-scrollbar"
              placeholder="Paste ASINs...&#10;B08XYZ&#10;B09ABC"
              value={asinsInput}
              onChange={(e) => setAsinsInput(e.target.value)}
              onScroll={(e) => handleScroll(e, 'styles-input')}
              disabled={isChecking}
            />
          </div>
        </div>

        {/* Right Column: Output Table */}
        <div className="col-span-8 lg:col-span-9 flex flex-col bg-[#0F172A] overflow-auto custom-scrollbar h-full">
          <div className="min-w-max">
            {/* Dynamic Headers */}
            <div className="flex bg-[#ff7b00] border-b border-orange-600 sticky top-0 z-10">
              <div className="w-80 p-3 text-xs font-bold text-white border-r border-orange-500/50">
                Style with Multiple Parent ASIN
              </div>
              {Array.from({ length: Math.max(maxAsins, 1) }).map((_, i) => (
                <div key={i} className="w-64 p-3 text-xs font-bold text-white border-r border-orange-500/50">
                  Parent ASIN {i + 1}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {conflicts.length === 0 && lastRan && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No styles with multiple Parent ASINs found.
              </div>
            )}
            {conflicts.length === 0 && !lastRan && (
              <div className="p-8 text-center text-slate-500 text-sm italic">
                Paste columns on the left and click RUN to see results.
              </div>
            )}

            {/* Data Rows */}
            {conflicts.map((conflict, index) => (
              <div key={index} className="flex border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                <div className="w-80 p-3 text-sm font-medium text-slate-200 border-r border-slate-700/50 truncate">
                  {conflict.style}
                </div>
                {Array.from({ length: Math.max(maxAsins, 1) }).map((_, i) => (
                  <div key={i} className="w-64 p-3 text-sm text-slate-400 font-mono border-r border-slate-700/50 truncate">
                    {conflict.asins[i] || '-'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}