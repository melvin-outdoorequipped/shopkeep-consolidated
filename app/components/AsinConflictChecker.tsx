'use client';

import { useState, useRef } from 'react';
import { Loader2, Play, Trash2, Upload, Download, HelpCircle, AlertCircle, CheckCircle, Copy, FileText } from 'lucide-react';

interface AsinConflictCheckerProps {
  theme?: 'light' | 'dark';
}

interface StyleAsinPair {
  style: string;
  asin: string;
}

interface Conflict {
  style: string;
  asins: string[];
}

export default function AsinConflictChecker({ theme = 'dark' }: AsinConflictCheckerProps) {
  const [stylesInput, setStylesInput] = useState<string>('');
  const [asinsInput, setAsinsInput] = useState<string>('');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastRan, setLastRan] = useState<{ date: string; time: string } | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const stylesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const asinsTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isDark = theme === 'dark';

  // Sample data for demonstration
  const loadSampleData = (): void => {
    setStylesInput('PAN1P/8080AP121\nPAN1P/9180AP121\nPAN3P/5353AZ531\nPAN3P/8080AP531\nPAN3P/9180AP531\nXAC9P/6253AP534\nXAC9P/9180AP533\nXAN1P/8080AP131\nXAN1P/9180AP131\nXAN3P/9180AP531\nXAN9E/9180AP506\nXAN9P/8080AP536');
    setAsinsInput('B09X25ZFH6\nB09X25ZFH6\nB09XBXH44D\nB09XBXH44D\nB09XBXH44D\nB09XFXNMFV\nB09XFXNMFV\nB0DVCCHV1Q\nB0DVCCHV1Q\nB0B578QHH7\nB09WRV711W\nB09WRV711W');
  };

  const handleRun = async (): Promise<void> => {
    if (!stylesInput.trim() && !asinsInput.trim()) return;
    
    setIsChecking(true);
    
    const stylesArray: string[] = stylesInput.split('\n');
    const asinsArray: string[] = asinsInput.split('\n');
    const maxRows: number = Math.max(stylesArray.length, asinsArray.length);
    const pairs: StyleAsinPair[] = [];
    
    for (let i = 0; i < maxRows; i++) {
      const style: string | undefined = stylesArray[i]?.trim();
      const asin: string | undefined = asinsArray[i]?.trim();
      if (style && asin) {
        pairs.push({ style, asin });
      }
    }

    // Simulate API delay
    setTimeout((): void => {
      const styleMap = new Map<string, Set<string>>();
      
      pairs.forEach((pair: StyleAsinPair): void => {
        if (!styleMap.has(pair.style)) {
          styleMap.set(pair.style, new Set<string>());
        }
        styleMap.get(pair.style)!.add(pair.asin);
      });
      
      const conflictsWithMultiple: Conflict[] = [];
      for (const [style, asinsSet] of styleMap.entries()) {
        const uniqueAsins: string[] = Array.from(asinsSet);
        if (uniqueAsins.length > 1) {
          conflictsWithMultiple.push({
            style: style,
            asins: uniqueAsins
          });
        }
      }
      
      setConflicts(conflictsWithMultiple);
      
      const now: Date = new Date();
      setLastRan({
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      setIsChecking(false);
    }, 500);
  };

  const handleClear = (): void => {
    setStylesInput('');
    setAsinsInput('');
    setConflicts([]);
    setLastRan(null);
  };

  const handleCopyResults = (): void => {
    if (conflicts.length === 0) return;
    
    let copyText: string = 'Style\t' + Array.from({ length: Math.max(...conflicts.map(c => c.asins.length)) }, (_, i) => `Parent ASIN ${i + 1}`).join('\t') + '\n';
    conflicts.forEach(conflict => {
      copyText += conflict.style + '\t' + conflict.asins.join('\t') + '\n';
    });
    
    navigator.clipboard.writeText(copyText);
    alert('Results copied to clipboard!');
  };

  const handleExportCSV = (): void => {
    if (conflicts.length === 0) return;
    
    const headers: string[] = ['Style', ...Array.from({ length: Math.max(...conflicts.map(c => c.asins.length)) }, (_, i) => `Parent ASIN ${i + 1}`)];
    const rows: string[][] = conflicts.map(conflict => [conflict.style, ...conflict.asins]);
    
    const csvContent: string = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob: Blob = new Blob([csvContent], { type: 'text/csv' });
    const url: string = URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = `asin-conflicts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxAsins: number = conflicts.length > 0 ? Math.max(...conflicts.map((c) => c.asins.length)) : 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Section with Instructions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Multiple Parent ASIN Checker
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Identify styles that have multiple UNIQUE parent ASINs mapped to them
            </p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400' 
                : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-600'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Help Panel */}
        {showHelp && (
          <div className={`mt-4 p-4 rounded-lg border ${
            isDark 
              ? 'bg-emerald-600/10 border-emerald-500/20' 
              : 'bg-emerald-100/50 border-emerald-300/50'
          }`}>
            <h3 className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              <HelpCircle className="w-4 h-4" />
              How to use this tool
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>1.</span>
                  <span>Paste your Style IDs in the left column</span>
                </div>
                <div className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>2.</span>
                  <span>Paste corresponding Parent ASINs in the right column</span>
                </div>
                <div className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>3.</span>
                  <span>Click RUN to check for conflicts</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>4.</span>
                  <span>Results show styles with multiple UNIQUE parent ASINs</span>
                </div>
                <div className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>5.</span>
                  <span>Duplicate ASINs for the same style are ignored</span>
                </div>
                <div className={`flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>💡</span>
                  <span>Each row represents one Style-ASIN pair</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`rounded-xl border overflow-hidden flex-1 flex flex-col ${
        isDark 
          ? 'bg-slate-900/50 border-slate-700/50' 
          : 'bg-white/50 border-gray-300/50'
      }`}>
        {/* Toolbar */}
        <div className={`border-b p-4 flex flex-wrap items-center justify-between gap-3 ${
          isDark 
            ? 'bg-slate-800/50 border-slate-700' 
            : 'bg-gray-100/50 border-gray-300'
        }`}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRun}
              disabled={(!stylesInput && !asinsInput) || isChecking}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              Run Check
            </button>
            <button
              onClick={handleClear}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                isDark 
                  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30' 
                  : 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
            {conflicts.length > 0 && (
              <>
                <button
                  onClick={handleCopyResults}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isDark 
                      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  Copy Results
                </button>
                <button
                  onClick={handleExportCSV}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isDark 
                      ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/30' 
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSampleData}
              className={`flex items-center gap-2 text-sm transition-colors ${
                isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Load Sample
            </button>
            {lastRan && (
              <div className={`flex items-center gap-3 text-xs pl-3 border-l ${
                isDark ? 'border-slate-700' : 'border-gray-300'
              }`}>
                <div className="flex items-center gap-1">
                  <span className={isDark ? 'text-slate-500' : 'text-gray-500'}>Last run:</span>
                  <span className={`font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    {lastRan.date} {lastRan.time}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
          <div className={`grid grid-cols-2 ${isDark ? 'bg-slate-800/30' : 'bg-gray-100/50'}`}>
            <div className={`p-3 text-sm font-semibold border-r flex items-center gap-2 ${
              isDark 
                ? 'text-emerald-400 border-slate-700' 
                : 'text-emerald-700 border-gray-300'
            }`}>
              <span>📦 Style IDs</span>
              <span className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>(one per line)</span>
            </div>
            <div className={`p-3 text-sm font-semibold flex items-center gap-2 ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              <span>🔗 Parent ASINs</span>
              <span className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>(one per line)</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 h-64">
            <textarea
              ref={stylesTextareaRef}
              className={`w-full h-full p-4 font-mono text-sm resize-none focus:outline-none border-r ${
                isDark 
                  ? 'bg-transparent text-slate-200 focus:bg-slate-800/30 border-slate-700 placeholder-slate-600' 
                  : 'bg-transparent text-gray-900 focus:bg-gray-100/50 border-gray-300 placeholder-gray-400'
              }`}
              placeholder="Example:&#10;STYLE-001&#10;STYLE-002&#10;STYLE-003"
              value={stylesInput}
              onChange={(e) => setStylesInput(e.target.value)}
              onScroll={(e) => {
                if (asinsTextareaRef.current) {
                  asinsTextareaRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              disabled={isChecking}
            />
            <textarea
              ref={asinsTextareaRef}
              className={`w-full h-full p-4 font-mono text-sm resize-none focus:outline-none ${
                isDark 
                  ? 'bg-transparent text-slate-200 focus:bg-slate-800/30 placeholder-slate-600' 
                  : 'bg-transparent text-gray-900 focus:bg-gray-100/50 placeholder-gray-400'
              }`}
              placeholder="Example:&#10;B08XYZ123AB&#10;B09ABC456CD&#10;B07DEF789EF"
              value={asinsInput}
              onChange={(e) => setAsinsInput(e.target.value)}
              onScroll={(e) => {
                if (stylesTextareaRef.current) {
                  stylesTextareaRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              disabled={isChecking}
            />
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className={`px-4 py-2 border-b flex items-center justify-between ${
            isDark 
              ? 'bg-slate-800/30 border-slate-700' 
              : 'bg-gray-100/50 border-gray-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Results</span>
              {conflicts.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isDark 
                    ? 'bg-yellow-600/20 text-yellow-400' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
            {conflicts.length > 0 && (
              <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                <AlertCircle className="w-3 h-3" />
                Styles with multiple UNIQUE parent ASINs are listed below
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {conflicts.length === 0 && lastRan && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-emerald-600/10' : 'bg-emerald-100'
                }`}>
                  <CheckCircle className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No conflicts found!</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>All styles have unique parent ASINs</p>
              </div>
            )}
            
            {conflicts.length === 0 && !lastRan && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-slate-800/50' : 'bg-gray-200/50'
                }`}>
                  <Upload className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-gray-500'}`} />
                </div>
                <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Ready to check for conflicts</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Paste your data above and click "Run Check"</p>
              </div>
            )}

            {conflicts.length > 0 && (
              <div className="min-w-max">
                <div className={`flex border-b sticky top-0 ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-200 border-gray-300'
                }`}>
                  <div className={`w-96 p-3 text-xs font-semibold border-r ${
                    isDark ? 'text-slate-300 border-slate-700' : 'text-gray-700 border-gray-300'
                  }`}>
                    Style ID
                  </div>
                  <div className={`flex-1 p-3 text-xs font-semibold ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Unique Parent ASINs ({maxAsins} found)
                  </div>
                </div>

                {conflicts.map((conflict: Conflict, index: number) => (
                  <div key={index} className={`flex border-b transition-colors ${
                    isDark 
                      ? 'border-slate-700/50 hover:bg-slate-800/30' 
                      : 'border-gray-200 hover:bg-gray-100/50'
                  }`}>
                    <div className={`w-96 p-3 text-sm font-medium border-r truncate ${
                      isDark 
                        ? 'text-slate-200 border-slate-700/50 bg-yellow-600/5' 
                        : 'text-gray-800 border-gray-200 bg-yellow-100/30'
                    }`}>
                      {conflict.style}
                    </div>
                    <div className="flex-1 p-3">
                      <div className="flex flex-wrap gap-2">
                        {conflict.asins.map((asin: string, idx: number) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono border ${
                              isDark 
                                ? 'bg-red-600/10 text-red-400 border-red-600/20' 
                                : 'bg-red-100 text-red-700 border-red-300'
                            }`}
                          >
                            {asin}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}