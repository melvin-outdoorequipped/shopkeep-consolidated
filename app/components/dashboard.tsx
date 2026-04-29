'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  FileWarning,
  Loader2,
  RefreshCw,
  SearchCheck,
  Zap,
} from 'lucide-react';

import { supabase } from '@/lib/supabase/client';

interface DashboardProps {
  theme?: 'light' | 'dark';
}

interface ToolRun {
  id: string;
  tool_type: 'sku' | 'asin';
  status: 'completed' | 'failed' | 'warning';
  title: string;
  description: string | null;
  total_count: number;
  success_count: number;
  issue_count: number;
  filename: string | null;
  created_at: string;
}

export default function Dashboard({ theme = 'dark' }: DashboardProps) {
  const [runs, setRuns] = useState<ToolRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const isDark = theme === 'dark';

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const { data, error } = await supabase
      .from('tool_runs')
      .select(
        'id, tool_type, status, title, description, total_count, success_count, issue_count, filename, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      setRuns([]);
      setErrorMessage(error.message);
    } else {
      setRuns((data ?? []) as ToolRun[]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const totalRuns = runs.length;
    const skuRuns = runs.filter((run) => run.tool_type === 'sku').length;
    const asinRuns = runs.filter((run) => run.tool_type === 'asin').length;
    const failedRuns = runs.filter((run) => run.status === 'failed').length;
    const issuesFound = runs.reduce(
      (sum, run) => sum + Number(run.issue_count ?? 0),
      0
    );
    const totalProcessed = runs.reduce(
      (sum, run) => sum + Number(run.total_count ?? 0),
      0
    );

    return {
      totalRuns,
      skuRuns,
      asinRuns,
      failedRuns,
      issuesFound,
      totalProcessed,
    };
  }, [runs]);

  const navigateToTool = (toolId: 'sku' | 'asin') => {
    window.dispatchEvent(
      new CustomEvent('navigateToTool', {
        detail: { toolId },
      })
    );
  };

  const cardClass = isDark
    ? 'border-slate-700/50 bg-slate-900/50'
    : 'border-gray-200 bg-white/80';

  const panelClass = isDark
    ? 'border-slate-700/50 bg-gradient-to-br from-[#1E293B] to-[#0F172A]'
    : 'border-gray-200 bg-white/80';

  const strongTextClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextClass = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${strongTextClass}`}>
            Operations Dashboard
          </h1>
          <p className={`mt-1 text-sm ${mutedTextClass}`}>
            Monitor SKU processing, ASIN checks, recent activity, and tool usage.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isDark
              ? 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
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

      {errorMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            isDark
              ? 'border-red-500/30 bg-red-600/10 text-red-400'
              : 'border-red-300 bg-red-100 text-red-700'
          }`}
        >
          Supabase error: {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          theme={theme}
          icon={<Activity className="h-5 w-5" />}
          label="Total Runs"
          value={stats.totalRuns}
          description="Latest saved tool activities"
          color="emerald"
        />
        <MetricCard
          theme={theme}
          icon={<Database className="h-5 w-5" />}
          label="Processed Items"
          value={stats.totalProcessed}
          description="Total SKU rows / ASIN pairs"
          color="blue"
        />
        <MetricCard
          theme={theme}
          icon={<FileWarning className="h-5 w-5" />}
          label="Issues Found"
          value={stats.issuesFound}
          description="Duplicates, conflicts, or warnings"
          color="yellow"
        />
        <MetricCard
          theme={theme}
          icon={<AlertCircle className="h-5 w-5" />}
          label="Failed Runs"
          value={stats.failedRuns}
          description="Runs that returned errors"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`rounded-xl border p-6 shadow-lg xl:col-span-1 ${panelClass}`}>
          <h2 className={`mb-4 text-lg font-semibold ${strongTextClass}`}>
            Quick Actions
          </h2>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigateToTool('sku')}
              className="flex w-full items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-left text-white transition-colors hover:bg-emerald-500"
            >
              <span>
                <span className="block text-sm font-semibold">Process SKUs</span>
                <span className="text-xs text-emerald-100">
                  Consolidate and export matched SKUs.
                </span>
              </span>
              <Zap className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => navigateToTool('asin')}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800'
                  : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span>
                <span className="block text-sm font-semibold">
                  Check ASIN Conflicts
                </span>
                <span className={`text-xs ${mutedTextClass}`}>
                  Find styles with multiple parent ASINs.
                </span>
              </span>
              <SearchCheck className="h-5 w-5 text-emerald-500" />
            </button>
          </div>

          <div className={`mt-6 rounded-xl border p-4 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className={`text-sm font-medium ${strongTextClass}`}>
                Tools ready
              </span>
            </div>
            <p className={`mt-1 text-xs ${mutedTextClass}`}>
              Dashboard data is pulled from Supabase activity logs.
            </p>
          </div>
        </div>

        <div className={`rounded-xl border shadow-lg xl:col-span-2 ${panelClass}`}>
          <div
            className={`border-b px-6 py-4 ${
              isDark ? 'border-slate-700/50' : 'border-gray-200'
            }`}
          >
            <h2 className={`font-semibold ${strongTextClass}`}>
              Recent Activity
            </h2>
            <p className={`text-xs ${mutedTextClass}`}>
              Latest SKU and ASIN tool runs from Supabase.
            </p>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : runs.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <Activity className={`mb-3 h-10 w-10 ${mutedTextClass}`} />
                <p className={`text-sm font-medium ${strongTextClass}`}>
                  No activity yet
                </p>
                <p className={`mt-1 text-xs ${mutedTextClass}`}>
                  Run the SKU Processor or ASIN Checker to populate this dashboard.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/30">
                {runs.map((run) => (
                  <ActivityRow key={run.id} run={run} theme={theme} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  theme,
  icon,
  label,
  value,
  description,
  color,
}: {
  theme: 'light' | 'dark';
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  color: 'emerald' | 'blue' | 'yellow' | 'red';
}) {
  const isDark = theme === 'dark';

  const colorClass = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
  }[color];

  return (
    <div
      className={`rounded-xl border p-5 shadow-lg ${
        isDark
          ? 'border-slate-700/50 bg-slate-900/50'
          : 'border-gray-200 bg-white/80'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {label}
          </p>
          <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value.toLocaleString()}
          </p>
        </div>

        <div className={`rounded-lg border p-2 ${colorClass}`}>{icon}</div>
      </div>

      <p className={`mt-3 text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        {description}
      </p>
    </div>
  );
}

function ActivityRow({
  run,
  theme,
}: {
  run: ToolRun;
  theme: 'light' | 'dark';
}) {
  const isDark = theme === 'dark';

  const statusClass =
    run.status === 'completed'
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : run.status === 'warning'
        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        : 'bg-red-500/10 text-red-500 border-red-500/20';

  return (
    <div className="flex items-start gap-4 px-6 py-4">
      <div
        className={`mt-1 rounded-lg border p-2 ${
          run.tool_type === 'sku'
            ? 'border-blue-500/20 bg-blue-500/10 text-blue-500'
            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
        }`}
      >
        {run.tool_type === 'sku' ? (
          <Database className="h-4 w-4" />
        ) : (
          <SearchCheck className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {run.title}
          </p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusClass}`}>
            {run.status}
          </span>
        </div>

        {run.description && (
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {run.description}
          </p>
        )}

        <div className={`mt-2 flex flex-wrap gap-3 text-[11px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
          <span>Total: {run.total_count ?? 0}</span>
          <span>Success: {run.success_count ?? 0}</span>
          <span>Issues: {run.issue_count ?? 0}</span>
          {run.filename && <span className="truncate">File: {run.filename}</span>}
        </div>
      </div>

      <span className={`whitespace-nowrap text-[11px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        {new Date(run.created_at).toLocaleString()}
      </span>
    </div>
  );
}