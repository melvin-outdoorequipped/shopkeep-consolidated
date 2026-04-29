'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Tag,
  Trash2,
  UploadCloud,
} from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import { logToolRun } from '@/lib/tara/logActivity';

interface SkuProcessorProps {
  theme?: 'light' | 'dark';
}

type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface SkuBatchRow {
  id: string;
  batch_id: string;
  sku_count: number;
  unique_sku_count: number;
  duplicate_count: number;
  matched_count: number;
  status: BatchStatus;
  brands_found: string[] | null;
  filename: string | null;
  error: string | null;
  created_at: string;
}

interface Feedback {
  type: 'success' | 'error' | 'info';
  message: string;
}

const SAMPLE_SKUS = `SKU12345
SKU67890
SKU11111`;

function parseSkus(input: string) {
  const rawSkus = input
    .split(/\r?\n/)
    .map((sku) => sku.trim())
    .filter(Boolean);

  const uniqueSkus = Array.from(new Set(rawSkus));

  return {
    rawSkus,
    uniqueSkus,
    duplicateCount: rawSkus.length - uniqueSkus.length,
  };
}

function getDownloadFilename(contentDisposition: string | null): string {
  if (!contentDisposition) return 'Consolidated_SKUs.xlsx';

  const match = contentDisposition.match(
    /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i
  );

  if (!match?.[1]) return 'Consolidated_SKUs.xlsx';

  return decodeURIComponent(match[1]);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getProgress(batch: SkuBatchRow) {
  if (batch.status === 'failed') return 0;
  if (batch.status === 'processing') return 44;
  if (batch.status === 'pending') return 10;
  return 100;
}

function getProgressColor(status: BatchStatus) {
  if (status === 'completed') return 'bg-green-500';
  if (status === 'processing') return 'bg-orange-400';
  if (status === 'failed') return 'bg-red-500';
  return 'bg-slate-400';
}

function getStatusLabel(status: BatchStatus) {
  if (status === 'completed') return 'Completed';
  if (status === 'processing') return 'Running';
  if (status === 'failed') return 'Failed';
  return 'Pending';
}

export default function SkuProcessor({ theme = 'dark' }: SkuProcessorProps) {
  const [skus, setSkus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [batches, setBatches] = useState<SkuBatchRow[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<SkuBatchRow | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const isDark = theme === 'dark';

  const parsed = useMemo(() => parseSkus(skus), [skus]);
  const hasValidSkus = parsed.uniqueSkus.length > 0;

  const showFeedback = (type: Feedback['type'], message: string) => {
    setFeedback({ type, message });

    window.setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const fetchBatches = async () => {
    setIsLoadingBatches(true);

    const { data, error } = await supabase
      .from('sku_batches')
      .select(
        'id, batch_id, sku_count, unique_sku_count, duplicate_count, matched_count, status, brands_found, filename, error, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error(error);
      showFeedback('error', `Failed to load batches: ${error.message}`);
      setBatches([]);
    } else {
      setBatches((data ?? []) as SkuBatchRow[]);
    }

    setIsLoadingBatches(false);
  };

  useEffect(() => {
    fetchBatches();
  }, []);
  const handleProcess = async () => {
    if (!hasValidSkus || isProcessing) {
      showFeedback('error', 'Please enter at least one valid SKU.');
      return;
    }

    const batchId = `GD-${Math.floor(100000 + Math.random() * 899999)}`;
    const now = new Date().toISOString();

    const temporaryRow: SkuBatchRow = {
      id: `temp-${Date.now()}`,
      batch_id: batchId,
      sku_count: parsed.rawSkus.length,
      unique_sku_count: parsed.uniqueSkus.length,
      duplicate_count: parsed.duplicateCount,
      matched_count: 0,
      status: 'processing',
      brands_found: [],
      filename: 'shopkeep-consolidated-tool',
      error: null,
      created_at: now,
    };

    setBatches((previous) => [temporaryRow, ...previous]);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/process-skus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skus: parsed.uniqueSkus.join('\n'),
        }),
      });

      if (!response.ok) {
        let message = 'Processing failed.';

        try {
          const errorData = await response.json();
          message = errorData?.error || message;
        } catch {
          message = response.statusText || message;
        }

        throw new Error(message);
      }

      const matchedCount = Number.parseInt(
        response.headers.get('x-match-count') ?? '0',
        10
      );

      let brands: string[] = [];

      try {
        brands = JSON.parse(response.headers.get('x-brands-found') ?? '[]');
      } catch {
        brands = [];
      }

      const totalRequested = Number.parseInt(
        response.headers.get('x-total-requested') ??
          String(parsed.uniqueSkus.length),
        10
      );

      const filename = getDownloadFilename(
        response.headers.get('content-disposition')
      );

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('The generated export file is empty.');
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);

      const { data: insertedBatch, error: insertError } = await supabase
        .from('sku_batches')
        .insert({
          batch_id: batchId,
          sku_count: totalRequested,
          unique_sku_count: parsed.uniqueSkus.length,
          duplicate_count: parsed.duplicateCount,
          matched_count: matchedCount,
          status: 'completed',
          brands_found: brands,
          filename,
        })
        .select(
          'id, batch_id, sku_count, unique_sku_count, duplicate_count, matched_count, status, brands_found, filename, error, created_at'
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      await logToolRun({
        toolType: 'sku',
        status: matchedCount > 0 ? 'completed' : 'warning',
        title: 'SKU batch processed',
        description: `${matchedCount} of ${totalRequested} SKUs matched.`,
        totalCount: totalRequested,
        successCount: matchedCount,
        issueCount: parsed.duplicateCount,
        filename,
        metadata: {
          batchId,
          brandsFound: brands,
          duplicateCount: parsed.duplicateCount,
        },
      });

      setBatches((previous) => [
        insertedBatch as SkuBatchRow,
        ...previous.filter((batch) => batch.id !== temporaryRow.id),
      ]);

      showFeedback(
        matchedCount > 0 ? 'success' : 'info',
        matchedCount > 0
          ? 'Batch completed and file downloaded.'
          : 'Batch completed, but no matching SKUs were found.'
      );

      if (matchedCount > 0) {
        setSkus('');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error.';

      const { data: failedBatch } = await supabase
        .from('sku_batches')
        .insert({
          batch_id: batchId,
          sku_count: parsed.rawSkus.length,
          unique_sku_count: parsed.uniqueSkus.length,
          duplicate_count: parsed.duplicateCount,
          matched_count: 0,
          status: 'failed',
          brands_found: [],
          filename: 'shopkeep-consolidated-tool',
          error: message,
        })
        .select(
          'id, batch_id, sku_count, unique_sku_count, duplicate_count, matched_count, status, brands_found, filename, error, created_at'
        )
        .single();

      await logToolRun({
        toolType: 'sku',
        status: 'failed',
        title: 'SKU batch failed',
        description: message,
        totalCount: parsed.rawSkus.length,
        successCount: 0,
        issueCount: parsed.rawSkus.length,
        metadata: {
          batchId,
          error: message,
        },
      });

      if (failedBatch) {
        setBatches((previous) => [
          failedBatch as SkuBatchRow,
          ...previous.filter((batch) => batch.id !== temporaryRow.id),
        ]);
      } else {
        setBatches((previous) =>
          previous.map((batch) =>
            batch.id === temporaryRow.id
              ? {
                  ...batch,
                  status: 'failed',
                  error: message,
                }
              : batch
          )
        );
      }

      showFeedback('error', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBatch = async (batch: SkuBatchRow) => {
    if (batch.id.startsWith('temp-')) {
      setBatches((previous) => previous.filter((item) => item.id !== batch.id));
      return;
    }

    const { error } = await supabase
      .from('sku_batches')
      .delete()
      .eq('id', batch.id);

    if (error) {
      showFeedback('error', `Delete failed: ${error.message}`);
      return;
    }

    setBatches((previous) => previous.filter((item) => item.id !== batch.id));
    showFeedback('success', 'Batch deleted.');
  };

  const handleDownloadSummary = (batch: SkuBatchRow) => {
    const rows = [
      ['Batch ID', batch.batch_id],
      ['Date Imported', formatDateTime(batch.created_at)],
      ['Status', getStatusLabel(batch.status)],
      ['Total Items', String(batch.sku_count)],
      ['Unique SKUs', String(batch.unique_sku_count)],
      ['Duplicate SKUs', String(batch.duplicate_count)],
      ['Matched SKUs', String(batch.matched_count)],
      ['Brands Found', (batch.brands_found ?? []).join(', ')],
      ['Filename', batch.filename ?? ''],
      ['Error', batch.error ?? ''],
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${batch.batch_id}-summary.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const loadSample = () => {
    setSkus(SAMPLE_SKUS);
    showFeedback('info', 'Sample SKUs loaded.');
  };

  const clearInput = () => {
    setSkus('');
  };

  const pageBg = isDark
    ? 'border-slate-700/50 bg-slate-900/50'
    : 'border-gray-200 bg-white/80';

  const inputClass = isDark
    ? 'border-slate-700 bg-slate-950 text-slate-200 placeholder-slate-500'
    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400';

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? isDark
                ? 'border-emerald-500/30 bg-emerald-600/10 text-emerald-400'
                : 'border-emerald-300 bg-emerald-100 text-emerald-700'
              : feedback.type === 'error'
                ? isDark
                  ? 'border-red-500/30 bg-red-600/10 text-red-400'
                  : 'border-red-300 bg-red-100 text-red-700'
                : isDark
                  ? 'border-blue-500/30 bg-blue-600/10 text-blue-400'
                  : 'border-blue-300 bg-blue-100 text-blue-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Input Area */}
      <div className={`rounded-xl border p-5 shadow-lg ${pageBg}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-emerald-500" />
              <div>
                <h2
                  className={`text-sm font-semibold uppercase tracking-wider ${
                    isDark ? 'text-slate-200' : 'text-gray-900'
                  }`}
                >
                  Shopkeep Consolidated Tool
                </h2>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}
                >
                  Paste SKUs below, process, download the export, and track the
                  batch in the table.
                </p>
              </div>
            </div>

            <textarea
              className={`h-32 w-full resize-none rounded-lg border p-3 font-mono text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
              placeholder={`Enter SKUs one per line:\nSKU12345\nSKU67890\nSKU11111`}
              value={skus}
              onChange={(event) => setSkus(event.target.value)}
              disabled={isProcessing}
              spellCheck={false}
            />
          </div>

          <div className="w-full lg:w-72">
            <div className="mb-3 grid grid-cols-3 gap-2">
              <MiniStat label="Rows" value={parsed.rawSkus.length} theme={theme} />
              <MiniStat label="Unique" value={parsed.uniqueSkus.length} theme={theme} />
              <MiniStat label="Dupes" value={parsed.duplicateCount} theme={theme} />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleProcess}
                disabled={!hasValidSkus || isProcessing}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isProcessing ? 'Processing' : 'Process'}
              </button>

              <button
                type="button"
                onClick={loadSample}
                disabled={isProcessing}
                className={`rounded-lg px-3 py-2.5 text-sm transition-colors disabled:opacity-50 ${
                  isDark
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Sample
              </button>

              <button
                type="button"
                onClick={clearInput}
                disabled={isProcessing || !hasValidSkus}
                className={`rounded-lg px-3 py-2.5 transition-colors disabled:opacity-50 ${
                  isDark
                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
                title="Clear input"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {parsed.duplicateCount > 0 && (
              <div
                className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                  isDark
                    ? 'border-yellow-500/30 bg-yellow-600/10 text-yellow-400'
                    : 'border-yellow-300 bg-yellow-100 text-yellow-800'
                }`}
              >
                Duplicate SKUs detected. Only unique SKUs will be submitted.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Batch Table */}
      <div className={`overflow-hidden rounded-xl border shadow-lg ${pageBg}`}>
        <div
          className={`flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
            isDark ? 'border-slate-700/50' : 'border-gray-200'
          }`}
        >
          <div>
            <h3
              className={`text-sm font-semibold ${
                isDark ? 'text-slate-100' : 'text-gray-900'
              }`}
            >
              Batch Import History
            </h3>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              Supabase-powered import records for the Shopkeep Consolidated Tool.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchBatches}
            disabled={isLoadingBatches}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
              isDark
                ? 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isLoadingBatches ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[1350px] border-collapse text-sm">
            <thead>
              <tr
                className={
                  isDark
                    ? 'bg-cyan-950/70 text-slate-100'
                    : 'bg-cyan-900 text-white'
                }
              >
                <th className="w-10 px-3 py-3 text-left">
                  <input type="checkbox" className="h-4 w-4 rounded" />
                </th>
                <TableHead>Date Imported</TableHead>
                <TableHead>Date Updated</TableHead>
                <TableHead>Import By</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>Import Name & Tool</TableHead>
                <TableHead>Total Items</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead alignRight>Actions</TableHead>
              </tr>
            </thead>

            <tbody>
              {isLoadingBatches ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
                    <p
                      className={`mt-2 text-sm ${
                        isDark ? 'text-slate-400' : 'text-gray-500'
                      }`}
                    >
                      Loading batches...
                    </p>
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <UploadCloud
                      className={`mx-auto h-10 w-10 ${
                        isDark ? 'text-slate-500' : 'text-gray-400'
                      }`}
                    />
                    <p
                      className={`mt-2 text-sm font-medium ${
                        isDark ? 'text-slate-300' : 'text-gray-700'
                      }`}
                    >
                      No batch records yet
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isDark ? 'text-slate-500' : 'text-gray-500'
                      }`}
                    >
                      Process SKUs to create your first import record.
                    </p>
                  </td>
                </tr>
              ) : (
                batches.map((batch, index) => (
                  <BatchTableRow
                    key={batch.id}
                    batch={batch}
                    index={index}
                    theme={theme}
                    onView={() => setSelectedBatch(batch)}
                    onDelete={() => handleDeleteBatch(batch)}
                    onDownload={() => handleDownloadSummary(batch)}
                    onRefresh={fetchBatches}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBatch && (
        <BatchDetailsModal
          batch={selectedBatch}
          theme={theme}
          onClose={() => setSelectedBatch(null)}
        />
      )}
    </div>
  );
}

function BatchTableRow({
  batch,
  index,
  theme,
  onView,
  onDelete,
  onDownload,
  onRefresh,
}: {
  batch: SkuBatchRow;
  index: number;
  theme: 'light' | 'dark';
  onView: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onRefresh: () => void;
}) {
  const isDark = theme === 'dark';
  const progress = getProgress(batch);
  const brands = batch.brands_found ?? [];

  return (
    <tr
      className={`border-b transition-colors ${
        isDark
          ? index % 2 === 0
            ? 'border-slate-700/60 bg-slate-950/60 hover:bg-slate-800/70'
            : 'border-slate-700/60 bg-slate-800/60 hover:bg-slate-800/90'
          : index % 2 === 0
            ? 'border-gray-200 bg-white hover:bg-gray-50'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <td className="px-3 py-3">
        <input type="checkbox" className="h-4 w-4 rounded" />
      </td>

      <td
        className={`px-4 py-3 text-xs ${
          isDark ? 'text-slate-200' : 'text-gray-700'
        }`}
      >
        {formatDateTime(batch.created_at)}
      </td>

      <td
        className={`px-4 py-3 text-xs ${
          isDark ? 'text-slate-200' : 'text-gray-700'
        }`}
      >
        {formatDateTime(batch.created_at)}
      </td>

      <td
        className={`px-4 py-3 text-xs ${
          isDark ? 'text-slate-100' : 'text-gray-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-700/50 text-[10px] text-white">
            T
          </div>
          <span>TARA User</span>
        </div>
      </td>

      <td
        className={`px-4 py-3 font-mono text-xs ${
          isDark ? 'text-slate-100' : 'text-gray-800'
        }`}
      >
        {batch.batch_id}
      </td>

      <td className="px-4 py-3 text-xs">
        <div className={isDark ? 'text-slate-100' : 'text-gray-800'}>
          {batch.filename || 'shopkeep-consolidated-tool'}
        </div>

        <div className="mt-0.5 flex flex-wrap gap-1 text-cyan-400">
          {brands.length > 0 ? (
            brands.slice(0, 2).map((brand) => (
              <span key={brand} className="inline-flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {brand}
              </span>
            ))
          ) : (
            <span>listing-loader-v2</span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-cyan-400">
          {batch.sku_count}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="w-36">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/70">
            <div
              className={`h-full rounded-full ${getProgressColor(batch.status)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-300">
            {progress}% of {batch.sku_count} items
          </p>
        </div>
      </td>

      <td className="px-4 py-3">
        <StatusBadge status={batch.status} />
      </td>

      <td className="px-4 py-3">
        <div className="flex justify-end gap-1.5">
          <ActionButton
            label="Download summary"
            icon={<Download className="h-3.5 w-3.5" />}
            color="cyan"
            onClick={onDownload}
          />
          <ActionButton
            label="View details"
            icon={<Eye className="h-3.5 w-3.5" />}
            color="cyan"
            onClick={onView}
          />
          <ActionButton
            label="Refresh"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            color="cyan"
            onClick={onRefresh}
          />
          <ActionButton
            label="Delete"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            color="red"
            onClick={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}

function TableHead({
  children,
  alignRight = false,
}: {
  children: React.ReactNode;
  alignRight?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold ${
        alignRight ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: BatchStatus }) {
  const statusClass =
    status === 'completed'
      ? 'bg-emerald-500/30 text-emerald-100'
      : status === 'processing'
        ? 'bg-orange-400 text-orange-950'
        : status === 'failed'
          ? 'bg-red-500/30 text-red-100'
          : 'bg-slate-500/30 text-slate-100';

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${statusClass}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function ActionButton({
  label,
  icon,
  color,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  color: 'cyan' | 'red';
  onClick: () => void;
}) {
  const colorClass =
    color === 'red'
      ? 'bg-red-500/50 text-white hover:bg-red-500/70'
      : 'bg-cyan-700/70 text-cyan-50 hover:bg-cyan-600/80';

  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`rounded-md p-1.5 transition-colors ${colorClass}`}
    >
      {icon}
    </button>
  );
}

function MiniStat({
  label,
  value,
  theme,
}: {
  label: string;
  value: number;
  theme: 'light' | 'dark';
}) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-lg border p-2 ${
        isDark
          ? 'border-slate-700/50 bg-slate-800/40'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <p
        className={`text-[10px] uppercase ${
          isDark ? 'text-slate-500' : 'text-gray-500'
        }`}
      >
        {label}
      </p>
      <p
        className={`text-sm font-semibold ${
          isDark ? 'text-slate-100' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BatchDetailsModal({
  batch,
  theme,
  onClose,
}: {
  batch: SkuBatchRow;
  theme: 'light' | 'dark';
  onClose: () => void;
}) {
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-xl rounded-xl border p-6 shadow-2xl ${
          isDark
            ? 'border-slate-700 bg-slate-950 text-slate-100'
            : 'border-gray-200 bg-white text-gray-900'
        }`}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Batch Details</h3>
            <p className="font-mono text-xs text-emerald-500">
              {batch.batch_id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-3 py-1 text-sm ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <DetailItem label="Date Imported" value={formatDateTime(batch.created_at)} />
          <DetailItem label="Date Updated" value={formatDateTime(batch.created_at)} />
          <DetailItem label="Status" value={getStatusLabel(batch.status)} />
          <DetailItem label="Total Items" value={String(batch.sku_count)} />
          <DetailItem label="Unique SKUs" value={String(batch.unique_sku_count)} />
          <DetailItem label="Duplicate SKUs" value={String(batch.duplicate_count)} />
          <DetailItem label="Matched SKUs" value={String(batch.matched_count)} />
          <DetailItem label="Filename" value={batch.filename ?? '—'} />
        </div>

        {batch.brands_found && batch.brands_found.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-slate-400">Brands Found</p>
            <div className="flex flex-wrap gap-2">
              {batch.brands_found.map((brand) => (
                <span
                  key={brand}
                  className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        )}

        {batch.error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{batch.error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700/40 bg-slate-900/40 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm">{value}</p>
    </div>
  );
}