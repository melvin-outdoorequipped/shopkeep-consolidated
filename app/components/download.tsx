'use client';

import { useEffect, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { supabase } from '@/lib/supabase/client';

interface DownloadPageProps {
  theme?: 'light' | 'dark';
}

interface DownloadRow {
  id: string;
  batch_id: string;
  filename: string | null;
  export_path: string | null;
  sku_count: number;
  matched_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export default function DownloadPage({ theme = 'dark' }: DownloadPageProps) {
  const [downloads, setDownloads] = useState<DownloadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const isDark = theme === 'dark';

  const fetchDownloads = async () => {
    setIsLoading(true);
    setFeedback('');

    const { data, error } = await supabase
      .from('sku_batches')
      .select(
        'id, batch_id, filename, export_path, sku_count, matched_count, status, created_at'
      )
      .not('export_path', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setFeedback(error.message);
      setDownloads([]);
    } else {
      setDownloads((data ?? []) as DownloadRow[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const handleDownload = async (row: DownloadRow) => {
    if (!row.export_path) return;

    const { data, error } = await supabase.storage
      .from('exports')
      .download(row.export_path);

    if (error) {
      setFeedback(`Download failed: ${error.message}`);
      return;
    }

    const url = URL.createObjectURL(data);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = row.filename ?? `${row.batch_id}.xlsx`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const handleDelete = async (row: DownloadRow) => {
    if (row.export_path) {
      const { error: storageError } = await supabase.storage
        .from('exports')
        .remove([row.export_path]);

      if (storageError) {
        setFeedback(`Storage delete failed: ${storageError.message}`);
        return;
      }
    }

    const { error } = await supabase
      .from('sku_batches')
      .delete()
      .eq('id', row.id);

    if (error) {
      setFeedback(`Delete failed: ${error.message}`);
      return;
    }

    setDownloads((previous) => previous.filter((item) => item.id !== row.id));
  };

  const cardClass = isDark
    ? 'border-slate-700/50 bg-slate-900/50'
    : 'border-gray-200 bg-white/80';

  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedText = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${textClass}`}>Downloads</h1>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Download generated files from completed SKU batches.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDownloads}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            isDark
              ? 'border-red-500/30 bg-red-600/10 text-red-400'
              : 'border-red-300 bg-red-100 text-red-700'
          }`}
        >
          {feedback}
        </div>
      )}

      <div className={`overflow-hidden rounded-xl border shadow-lg ${cardClass}`}>
        <div className="overflow-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead
              className={
                isDark ? 'bg-cyan-950/70 text-white' : 'bg-cyan-900 text-white'
              }
            >
              <tr>
                <th className="px-4 py-3 text-left text-xs">File</th>
                <th className="px-4 py-3 text-left text-xs">Batch ID</th>
                <th className="px-4 py-3 text-left text-xs">Items</th>
                <th className="px-4 py-3 text-left text-xs">Matched</th>
                <th className="px-4 py-3 text-left text-xs">Status</th>
                <th className="px-4 py-3 text-left text-xs">Generated</th>
                <th className="px-4 py-3 text-right text-xs">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
                  </td>
                </tr>
              ) : downloads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    No downloadable files yet.
                  </td>
                </tr>
              ) : (
                downloads.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b ${
                      isDark
                        ? index % 2 === 0
                          ? 'border-slate-700 bg-slate-950/60'
                          : 'border-slate-700 bg-slate-800/60'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                        <span className={textClass}>
                          {row.filename ?? 'Generated export'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-cyan-400">
                      {row.batch_id}
                    </td>

                    <td className={`px-4 py-3 ${mutedText}`}>
                      {row.sku_count}
                    </td>

                    <td className="px-4 py-3 text-emerald-400">
                      {row.matched_count}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          row.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : row.status === 'failed'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    <td className={`px-4 py-3 text-xs ${mutedText}`}>
                      {new Date(row.created_at).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownload(row)}
                          className="rounded bg-cyan-700/70 p-2 text-white hover:bg-cyan-600"
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="rounded bg-red-600/50 p-2 text-white hover:bg-red-600"
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}