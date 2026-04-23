'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2, CheckCircle2, AlertCircle, Clock, Tag } from 'lucide-react';

interface StatusItem {
  id: string;
  sku: string;
  brand: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  timestamp: string;
}

export default function Home() {
  const [skus, setSkus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusItems, setStatusItems] = useState<StatusItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [brandsFound, setBrandsFound] = useState<string[]>([]);
  const [exportedFilename, setExportedFilename] = useState('');

  const handleProcess = async () => {
    if (!skus) return;

    // Initialize status items
    const skuArray = skus
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    setTotalCount(skuArray.length);
    setCompletedCount(0);
    setOverallProgress(0);
    setBrandsFound([]);
    setExportedFilename('');

    const items: StatusItem[] = skuArray.map((sku, idx) => ({
      id: `${idx}-${Date.now()}`,
      sku,
      brand: 'Loading...',
      status: 'pending',
      progress: 0,
      timestamp: new Date().toLocaleTimeString(),
    }));

    setStatusItems(items);
    setIsLoading(true);

    try {
      // Simulate progressive processing for UI feedback
      for (let i = 0; i < items.length; i++) {
        setStatusItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'processing',
                  progress: 25,
                  timestamp: new Date().toLocaleTimeString(),
                }
              : item
          )
        );

        await new Promise((r) => setTimeout(r, 200));

        setStatusItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, progress: 75 } : item
          )
        );

        await new Promise((r) => setTimeout(r, 100));
      }

      // Make the actual API call
      const response = await fetch('/api/process-skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      // Extract brands from response header
      const brandsHeader = response.headers.get('x-brands-found');
      const brands = brandsHeader ? JSON.parse(brandsHeader) : [];
      setBrandsFound(brands);

      // Mark all as completed
      setStatusItems((prev) =>
        prev.map((item) => ({
          ...item,
          status: 'completed',
          progress: 100,
          brand: brands.length > 0 ? brands[0] : 'Multiple',
        }))
      );
      setCompletedCount(skuArray.length);
      setOverallProgress(100);

      // Handle the Excel file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'Consolidated_SKUs.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      setExportedFilename(filename);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Keep status visible for 2 seconds then reset
      setTimeout(() => {
        setStatusItems([]);
        setSkus('');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setStatusItems((prev) =>
        prev.map((item) => ({
          ...item,
          status: item.status === 'completed' ? 'completed' : 'failed',
        }))
      );
      alert('Failed to process SKUs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-slate-200 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between gap-6 pb-6 border-b border-slate-700/50">
          <div className="flex items-center gap-6 flex-1">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-1">TARA</h1>
              <p className="text-slate-400">Consolidated SKU List Processor</p>
              {brandsFound.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-sm text-slate-400">Brands found:</span>
                  {brandsFound.map((brand) => (
                    <span
                      key={brand}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium"
                    >
                      <Tag className="w-3 h-3" />
                      {brand}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <img
            src="https://img.sanishtech.com/u/3d37f0af708035d0b169497c7f2557f0.png"
            alt="Shopkeep Logo"
            width="183"
            height="249"
            loading="lazy"
            className="max-w-[120px] h-auto hidden sm:block"
          />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <section className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/50 rounded-2xl p-6 shadow-xl sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-emerald-400 flex items-center gap-2">
                <div className="w-1 h-6 bg-emerald-500 rounded"></div>
                Enter SKUs
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Paste SKUs one per line
              </p>

              <textarea
                className="w-full h-48 bg-[#0F172A] text-slate-200 border border-slate-600 rounded-lg p-4 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 mb-4 font-mono text-sm resize-none transition-all"
                placeholder="SK001&#10;SK002&#10;SK003&#10;SK004"
                value={skus}
                onChange={(e) => setSkus(e.target.value)}
                disabled={isLoading}
              />

              <button
                onClick={handleProcess}
                disabled={isLoading || !skus}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Process & Download
                  </>
                )}
              </button>

              {totalCount > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-3">
                    <span className="text-emerald-400 font-semibold">{completedCount}</span>
                    <span> of </span>
                    <span className="text-emerald-400 font-semibold">{totalCount}</span>
                    <span> processed</span>
                  </div>
                  <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    ></div>
                  </div>
                  {exportedFilename && (
                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-xs text-emerald-400 font-mono break-all">
                        {exportedFilename}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Status Table */}
          <div className="lg:col-span-2">
            {statusItems.length > 0 ? (
              <section className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-transparent">
                  <h3 className="font-semibold text-slate-200">Processing Status</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {completedCount === totalCount
                      ? `All items processed - ${brandsFound.length > 0 ? brandsFound.join(', ') : 'All brands'}`
                      : `${isLoading ? 'Processing' : 'Completed'} ${completedCount} of ${totalCount} items`}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50 bg-slate-800/20">
                        <th className="px-6 py-3 text-left text-slate-400 font-medium">SKU</th>
                        <th className="px-6 py-3 text-left text-slate-400 font-medium">Brand</th>
                        <th className="px-6 py-3 text-left text-slate-400 font-medium">Status</th>
                        <th className="px-6 py-3 text-left text-slate-400 font-medium">Progress</th>
                        <th className="px-6 py-3 text-left text-slate-400 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="px-6 py-3 font-mono text-emerald-400 text-sm">
                            {item.sku}
                          </td>
                          <td className="px-6 py-3">
                            {item.brand !== 'Loading...' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 text-slate-200 rounded text-xs font-medium">
                                <Tag className="w-3 h-3" />
                                {item.brand}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              {item.status === 'completed' && (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span className="text-emerald-400">Completed</span>
                                </>
                              )}
                              {item.status === 'processing' && (
                                <>
                                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                  <span className="text-blue-400">Processing</span>
                                </>
                              )}
                              {item.status === 'pending' && (
                                <>
                                  <Clock className="w-4 h-4 text-slate-400" />
                                  <span className="text-slate-400">Pending</span>
                                </>
                              )}
                              {item.status === 'failed' && (
                                <>
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-red-400">Failed</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden max-w-xs">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : item.status === 'processing'
                                    ? 'bg-blue-500'
                                    : 'bg-slate-600'
                                }`}
                                style={{ width: `${item.progress}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-slate-400 text-xs">
                            {item.timestamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <section className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/50 rounded-2xl p-12 shadow-xl flex items-center justify-center min-h-96">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-slate-400">
                    Enter SKUs and click Process to see status updates
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}