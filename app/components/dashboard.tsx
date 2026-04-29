'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
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

interface ToolCardItem {
  id: 'sku' | 'asin';
  category: string;
  title: string;
  description: string;
  status: string;
  usage: string;
  accent: 'blue' | 'green';
  icon: React.ReactNode;
}

const operationTools: ToolCardItem[] = [
  {
    id: 'sku',
    category: 'LISTINGS',
    title: 'Shopkeep Consolidated Tool',
    description:
      'Process SKU lists, consolidate Shopkeep data, generate exports, and track batch imports.',
    status: 'Beta',
    usage: 'Unlimited',
    accent: 'blue',
    icon: <Database className="h-4 w-4" />,
  },
  {
    id: 'asin',
    category: 'LISTINGS',
    title: 'Multiple Parent ASIN',
    description:
      'Detect styles connected to multiple unique parent ASINs before listing conflicts occur.',
    status: 'Active',
    usage: 'Unlimited',
    accent: 'green',
    icon: <SearchCheck className="h-4 w-4" />,
  },
];

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
      .limit(100);

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

  const metrics = useMemo(() => {
    const totalRuns = runs.length;

    const completedRuns = runs.filter(
      (run) => run.status === 'completed'
    ).length;

    const warningRuns = runs.filter(
      (run) => run.status === 'warning'
    ).length;

    const failedRuns = runs.filter((run) => run.status === 'failed').length;

    const skuRuns = runs.filter((run) => run.tool_type === 'sku').length;
    const asinRuns = runs.filter((run) => run.tool_type === 'asin').length;

    const totalProcessed = runs.reduce(
      (sum, run) => sum + Number(run.total_count ?? 0),
      0
    );

    const totalSuccess = runs.reduce(
      (sum, run) => sum + Number(run.success_count ?? 0),
      0
    );

    const totalIssues = runs.reduce(
      (sum, run) => sum + Number(run.issue_count ?? 0),
      0
    );

    const completionRate =
      totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

    const successRate =
      totalProcessed > 0
        ? Math.round((totalSuccess / totalProcessed) * 100)
        : 0;

    return {
      totalRuns,
      completedRuns,
      warningRuns,
      failedRuns,
      skuRuns,
      asinRuns,
      totalProcessed,
      totalSuccess,
      totalIssues,
      completionRate,
      successRate,
      activeTools: operationTools.length,
    };
  }, [runs]);

  const navigateToTool = (toolId: 'sku' | 'asin') => {
    window.dispatchEvent(
      new CustomEvent('navigateToTool', {
        detail: {
          toolId,
        },
      })
    );
  };

  const pageText = isDark ? 'text-white' : 'text-gray-900';
  const mutedText = isDark ? 'text-slate-400' : 'text-gray-500';

  const panelClass = isDark
    ? 'border-slate-700/50 bg-slate-900/70'
    : 'border-gray-200 bg-white';

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${pageText}`}>
            OPERATION TOOLS
          </h1>

          <p className={`mt-2 text-sm ${mutedText}`}>
            Current Active Tools:{' '}
            <span className="font-semibold text-emerald-400">
              {metrics.activeTools}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
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

          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              isDark
                ? 'bg-cyan-900/60 text-cyan-100 hover:bg-cyan-800'
                : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
            }`}
          >
            Feedback
          </button>
        </div>
      </section>

      {errorMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            isDark
              ? 'border-red-500/30 bg-red-600/10 text-red-400'
              : 'border-red-300 bg-red-100 text-red-700'
          }`}
        >
          Dashboard error: {errorMessage}
        </div>
      )}

      {/* Tool Cards */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
        {operationTools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            theme={theme}
            runCount={tool.id === 'sku' ? metrics.skuRuns : metrics.asinRuns}
            onOpen={() => navigateToTool(tool.id)}
          />
        ))}
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          theme={theme}
          label="Total Runs"
          value={metrics.totalRuns}
          helper="Recorded tool activities"
          icon={<Activity className="h-5 w-5" />}
          tone="emerald"
        />

        <SummaryCard
          theme={theme}
          label="Processed Items"
          value={metrics.totalProcessed}
          helper="Rows, SKUs, and checked pairs"
          icon={<Zap className="h-5 w-5" />}
          tone="cyan"
        />

        <SummaryCard
          theme={theme}
          label="Issues Found"
          value={metrics.totalIssues}
          helper="Conflicts, duplicates, warnings"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="yellow"
        />

        <SummaryCard
          theme={theme}
          label="Completion Rate"
          value={metrics.completionRate}
          suffix="%"
          helper={`${metrics.completedRuns} completed runs`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="blue"
        />
      </section>

      {/* Usage Summary */}
      <section className={`rounded-2xl border p-5 shadow-lg ${panelClass}`}>
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />

          <div>
            <h2 className={`text-lg font-semibold ${pageText}`}>
              Tool Usage Summary
            </h2>
            <p className={`text-sm ${mutedText}`}>
              Quick usage split between available operation tools.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <UsageLine
            theme={theme}
            label="Shopkeep Consolidated Tool"
            value={metrics.skuRuns}
            maxValue={Math.max(metrics.skuRuns, metrics.asinRuns, 1)}
          />

          <UsageLine
            theme={theme}
            label="Multiple Parent ASIN"
            value={metrics.asinRuns}
            maxValue={Math.max(metrics.skuRuns, metrics.asinRuns, 1)}
          />
        </div>
      </section>
    </div>
  );
}

function ToolCard({
  tool,
  theme,
  runCount,
  onOpen,
}: {
  tool: ToolCardItem;
  theme: 'light' | 'dark';
  runCount: number;
  onOpen: () => void;
}) {
  const isDark = theme === 'dark';

  const accentClass =
    tool.accent === 'green'
      ? isDark
        ? 'border-emerald-500/20 bg-emerald-950/50 hover:bg-emerald-900/50'
        : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
      : isDark
        ? 'border-cyan-500/20 bg-cyan-950/40 hover:bg-cyan-900/40'
        : 'border-cyan-200 bg-cyan-50 hover:bg-cyan-100';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative min-h-[190px] rounded-2xl border p-5 text-left shadow-lg transition-all ${accentClass}`}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <div
            className={`mb-3 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              isDark
                ? 'bg-slate-900/50 text-slate-300'
                : 'bg-white/70 text-gray-600'
            }`}
          >
            {tool.icon}
            {tool.category}
          </div>

          <h3
            className={`text-xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            {tool.title}
          </h3>

          <p
            className={`mt-2 max-w-xl text-sm leading-5 ${
              isDark ? 'text-slate-300' : 'text-gray-600'
            }`}
          >
            {tool.description}
          </p>
        </div>

        <div className="mt-8 flex items-end justify-between">
          <div>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              {tool.status}
            </p>

            <p
              className={`mt-1 text-2xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {tool.usage}
            </p>
          </div>

          <div className="flex items-end gap-4">
            <div className="text-right">
              <p
                className={`text-xs ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}
              >
                Runs
              </p>

              <p className="mt-1 text-lg font-bold text-emerald-400">
                {runCount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-full bg-black/50 p-2 text-white transition-transform group-hover:translate-x-1">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function SummaryCard({
  theme,
  label,
  value,
  suffix = '',
  helper,
  icon,
  tone,
}: {
  theme: 'light' | 'dark';
  label: string;
  value: number;
  suffix?: string;
  helper: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'cyan' | 'yellow' | 'blue';
}) {
  const isDark = theme === 'dark';

  const toneClass = {
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
    yellow: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  }[tone];

  return (
    <div
      className={`rounded-2xl border p-5 shadow-lg ${
        isDark
          ? 'border-slate-700/50 bg-slate-900/60'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {label}
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            {value.toLocaleString()}
            {suffix}
          </p>
        </div>

        <div className={`rounded-xl border p-2 ${toneClass}`}>{icon}</div>
      </div>

      <p
        className={`mt-3 text-xs ${
          isDark ? 'text-slate-500' : 'text-gray-500'
        }`}
      >
        {helper}
      </p>
    </div>
  );
}

function UsageLine({
  theme,
  label,
  value,
  maxValue,
}: {
  theme: 'light' | 'dark';
  label: string;
  value: number;
  maxValue: number;
}) {
  const isDark = theme === 'dark';
  const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`text-sm font-semibold ${
            isDark ? 'text-slate-200' : 'text-gray-800'
          }`}
        >
          {label}
        </span>

        <span
          className={`text-sm ${
            isDark ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          {value.toLocaleString()} runs
        </span>
      </div>

      <div
        className={`h-2 overflow-hidden rounded-full ${
          isDark ? 'bg-slate-800' : 'bg-gray-100'
        }`}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}