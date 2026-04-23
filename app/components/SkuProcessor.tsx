'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle2, AlertCircle, Tag, Eye, RefreshCw, Trash2, Clock } from 'lucide-react';

interface BatchStatus {
  id: string;
  skuCount: number;
  matchedCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  timestamp: string;
  dateImported: string;
  brandsFound: string[];
  filename: string;
}

export default function SkuProcessor() {
  const [skus, setSkus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [batchHistory, setBatchHistory] = useState<BatchStatus[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed'>('all');

  const handleProcess = async () => {
    if (!skus) return;

    const skuArray = skus
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    const now = new Date();
    const batchId = `BATCH-${Date.now()}`;
    const initialBatch: BatchStatus = {
      id: batchId,
      skuCount: skuArray.length,
      matchedCount: 0,
      status: 'pending',
      progress: 0,
      timestamp: now.toLocaleTimeString(),
      dateImported: now.toLocaleString(),
      brandsFound: [],
      filename: '',
    };

    setBatchStatus(initialBatch);
    setShowStatus(true);
    setIsLoading(true);

    try {
      setBatchStatus((prev) =>
        prev ? { ...prev, status: 'processing', progress: 15 } : null
      );

      await new Promise((r) => setTimeout(r, 300));

      const response = await fetch('/api/process-skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const brandsHeader = response.headers.get('x-brands-found');
      const matchCountHeader = response.headers.get('x-match-count');
      const brands = brandsHeader ? JSON.parse(brandsHeader) : [];
      const matchedCount = matchCountHeader ? parseInt(matchCountHeader) : 0;

      setBatchStatus((prev) =>
        prev
          ? {
              ...prev,
              progress: 85,
              matchedCount,
              brandsFound: brands,
            }
          : null
      );

      await new Promise((r) => setTimeout(r, 200));

      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'Consolidated_SKUs.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      const completedBatch: BatchStatus = {
        id: batchId,
        skuCount: skuArray.length,
        matchedCount,
        status: 'completed',
        progress: 100,
        timestamp: now.toLocaleTimeString(),
        dateImported: now.toLocaleString(),
        brandsFound: brands,
        filename,
      };

      setBatchStatus(completedBatch);
      setBatchHistory([completedBatch, ...batchHistory]);

      setTimeout(() => {
        setShowStatus(false);
        setBatchStatus(null);
        setSkus('');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      const failedBatch: BatchStatus = {
        id: batchId,
        skuCount: skuArray.length,
        matchedCount: 0,
        status: 'failed',
        progress: 0,
        timestamp: now.toLocaleTimeString(),
        dateImported: now.toLocaleString(),
        brandsFound: [],
        filename: '',
      };
      setBatchStatus(failedBatch);
      setBatchHistory([failedBatch, ...batchHistory]);

      setTimeout(() => {
        setShowStatus(false);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setBatchHistory([]);
  };

  const handleDeleteBatch = (id: string) => {
    setBatchHistory(batchHistory.filter((batch) => batch.id !== id));
  };

  const filteredHistory = batchHistory.filter((batch) => {
    if (filterStatus === 'all') return true;
    return batch.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'processing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'pending':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-slate-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/50 rounded-xl p-6 shadow-lg">
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-500 rounded"></div>
              Input SKUs
            </h2>

            <textarea
              className="w-full h-40 bg-slate-950 text-slate-200 border border-slate-600 rounded-lg p-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 mb-4 font-mono text-xs resize-none transition-all placeholder-slate-500"
              placeholder="SK001&#10;SK002&#10;SK003"
              value={skus}
              onChange={(e) => setSkus(e.target.value)}
              disabled={isLoading}
            />

            <button
              onClick={handleProcess}
              disabled={isLoading || !skus}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Process & Download
                </>
              )}
            </button>

            {batchStatus && (
              <div className="mt-5 pt-5 border-t border-slate-700/50 space-y-3">
                <div className="text-xs text-slate-400 font-mono bg-slate-950 p-2 rounded border border-slate-700/50 break-all">
                  {batchStatus.id}
                </div>
                <div className="text-sm text-slate-300">
                  <span className="text-emerald-400 font-semibold">
                    {batchStatus.matchedCount}
                  </span>
                  <span> / </span>
                  <span className="text-emerald-400 font-semibold">
                    {batchStatus.skuCount}
                  </span>
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${batchStatus.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Status Card */}
        <div className="lg:col-span-3">
          {showStatus && batchStatus ? (
            <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/50 rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${
                  batchStatus.status === 'completed' ? 'bg-emerald-500/10' :
                  batchStatus.status === 'processing' ? 'bg-blue-500/10' :
                  batchStatus.status === 'pending' ? 'bg-slate-600/20' :
                  'bg-red-500/10'
                }`}>
                  {getStatusIcon(batchStatus.status)}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {batchStatus.status === 'completed'
                      ? 'Batch Processed Successfully'
                      : batchStatus.status === 'processing'
                      ? 'Processing Batch'
                      : batchStatus.status === 'failed'
                      ? 'Processing Failed'
                      : 'Pending'}
                  </h3>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="text-slate-300">
                      <span className="text-emerald-400 font-semibold">
                        {batchStatus.matchedCount}
                      </span>
                      <span> of </span>
                      <span className="text-emerald-400 font-semibold">
                        {batchStatus.skuCount}
                      </span>
                      <span> SKUs matched</span>
                    </div>

                    {batchStatus.brandsFound.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {batchStatus.brandsFound.map((brand) => (
                          <span
                            key={brand}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 text-slate-200 rounded text-xs font-medium"
                          >
                            <Tag className="w-3 h-3" />
                            {brand}
                          </span>
                        ))}
                      </div>
                    )}

                    {batchStatus.filename && (
                      <div className="pt-2 mt-2 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400">Exported File:</p>
                        <p className="text-xs font-mono text-emerald-400 break-all mt-1">
                          {batchStatus.filename}
                        </p>
                      </div>
                    )}
                  </div>

                  {batchStatus.status === 'processing' && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <div className="w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${batchStatus.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/50 rounded-xl p-8 shadow-lg flex items-center justify-center min-h-[224px]">
              <div className="text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-slate-400 text-sm">
                  Enter SKUs and click Process to begin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch History Table */}
      {batchHistory.length > 0 && (
        <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700/50 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-transparent flex items-center justify-between">
            <h3 className="font-semibold text-slate-200">Batch History</h3>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-xs bg-slate-800/50 border border-slate-600 text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Batches</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              {batchHistory.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-800/50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/20">
                  <th className="px-6 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Date Imported</th>
                  <th className="px-6 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Filename</th>
                  <th className="px-6 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Matched Items</th>
                  <th className="px-6 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-slate-400 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-slate-400 font-medium text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((batch) => (
                  <tr key={batch.id} className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3 text-xs text-slate-300">{batch.dateImported}</td>
                    <td className="px-6 py-3 text-xs font-mono text-emerald-400">{batch.id}</td>
                    <td className="px-6 py-3 text-xs text-slate-300 max-w-xs truncate">{batch.filename || '-'}</td>
                    <td className="px-6 py-3 text-xs">
                      <span className="text-emerald-400 font-semibold">{batch.matchedCount}</span>
                      <span className="text-slate-400"> of </span>
                      <span className="text-emerald-400 font-semibold">{batch.skuCount}</span>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      <div className="w-full max-w-xs bg-slate-700/30 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            batch.status === 'completed' ? 'bg-emerald-500' : batch.status === 'failed' ? 'bg-red-500' : 'bg-slate-600'
                          }`}
                          style={{ width: `${batch.progress}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(batch.status)}`}>
                        {getStatusIcon(batch.status)}
                        {getStatusLabel(batch.status)}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button title="View details" className="p-1 hover:bg-slate-700/50 rounded transition-colors text-slate-400 hover:text-slate-200">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button title="Reprocess" className="p-1 hover:bg-slate-700/50 rounded transition-colors text-slate-400 hover:text-slate-200">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button title="Delete" onClick={() => handleDeleteBatch(batch.id)} className="p-1 hover:bg-red-500/20 rounded transition-colors text-slate-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredHistory.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-400">
              <p className="text-sm">No batches found for the selected filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}