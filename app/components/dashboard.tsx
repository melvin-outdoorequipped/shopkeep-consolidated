'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Database,
  Flame,
  Loader2,
  MessageSquare,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  TrendingUp,
  Zap,
  User,
  Trophy,
  Medal,
  Crown,
} from 'lucide-react';

import { supabase } from '@/lib/supabase/client';

interface DashboardProps {
  theme?: 'light' | 'dark';
}

interface ToolRun {
  id: string;
  tool_type: 'sku' | 'asin' | 'basecamp';
  status: 'completed' | 'failed' | 'warning';
  title: string;
  description: string | null;
  total_count: number;
  success_count: number;
  issue_count: number;
  filename: string | null;
  created_at: string;
  user_email?: string;
}

interface UserStats {
  email: string;
  totalRuns: number;
  completedRuns: number;
  lastRun: string;
}

interface ToolCardItem {
  id: 'sku' | 'asin' | 'basecamp';
  category: string;
  title: string;
  description: string;
  status: string;
  usage: string;
  accent: 'blue' | 'green' | 'purple';
  icon: React.ReactNode;
  comingSoon?: boolean;
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
  {
    id: 'basecamp',
    category: 'COMMUNICATIONS',
    title: 'Basecamp Response Generator',
    description:
      'Upload PO files and auto-generate formatted Basecamp messages for initial analysis, final analysis, pre-approval, or fixing updates.',
    status: 'Beta',
    usage: 'Unlimited',
    accent: 'purple',
    icon: <MessageSquare className="h-4 w-4" />,
    comingSoon: false,
  },
];

// --- Animated Counter Hook ---
function useAnimatedCounter(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// --- Mini Sparkline SVG ---
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80, h = 28;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * (h - 4)}`)
    .join(' ');
  const areaPoints = `0,${h} ` + points + ` ${w},${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="opacity-80">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color})`} />
      <polyline points={points} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(data.length - 1) * step}
        cy={h - (data[data.length - 1] / max) * (h - 4)}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// --- Status Dot (animated) ---
function StatusDot({ status }: { status: ToolRun['status'] }) {
  const color =
    status === 'completed' ? 'bg-emerald-400' :
    status === 'warning' ? 'bg-yellow-400' :
    'bg-red-400';
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 animate-ping`} style={{ animationDuration: '2s' }} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

// --- Relative time helper ---
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard({ theme = 'dark' }: DashboardProps) {
  const [runs, setRuns] = useState<ToolRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const isDark = theme === 'dark';

  const fetchDashboardData = async () => {
  setIsLoading(true);
  setErrorMessage('');
  
  // Query tool_runs directly - use the user_email column that's now in the table
  const { data, error } = await supabase
    .from('tool_runs')
    .select('id, tool_type, status, title, description, total_count, success_count, issue_count, filename, created_at, user_email')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    setRuns([]);
    setErrorMessage(error.message);
  } else {
    // Simply use the data as is - user_email is already there
    setRuns((data ?? []) as ToolRun[]);
    setLastRefreshed(new Date());
  }
  setIsLoading(false);
};

  useEffect(() => { fetchDashboardData(); }, []);

  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate top users
  const topUsers = useMemo(() => {
    const userMap = new Map<string, UserStats>();
    
    runs.forEach(run => {
      const email = run.user_email || 'System';
      if (!userMap.has(email)) {
        userMap.set(email, {
          email,
          totalRuns: 0,
          completedRuns: 0,
          lastRun: run.created_at,
        });
      }
      
      const stats = userMap.get(email)!;
      stats.totalRuns++;
      if (run.status === 'completed') stats.completedRuns++;
      if (new Date(run.created_at) > new Date(stats.lastRun)) {
        stats.lastRun = run.created_at;
      }
    });
    
    return Array.from(userMap.values())
      .sort((a, b) => b.totalRuns - a.totalRuns)
      .slice(0, 5);
  }, [runs]);

  const metrics = useMemo(() => {
    const totalRuns = runs.length;
    const completedRuns = runs.filter(r => r.status === 'completed').length;
    const warningRuns = runs.filter(r => r.status === 'warning').length;
    const failedRuns = runs.filter(r => r.status === 'failed').length;
    const skuRuns = runs.filter(r => r.tool_type === 'sku').length;
    const asinRuns = runs.filter(r => r.tool_type === 'asin').length;
    const basecampRuns = runs.filter(r => r.tool_type === 'basecamp').length;
    const totalProcessed = runs.reduce((s, r) => s + Number(r.total_count ?? 0), 0);
    const totalSuccess = runs.reduce((s, r) => s + Number(r.success_count ?? 0), 0);
    const totalIssues = runs.reduce((s, r) => s + Number(r.issue_count ?? 0), 0);
    const completionRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;
    const successRate = totalProcessed > 0 ? Math.round((totalSuccess / totalProcessed) * 100) : 0;

    return {
      totalRuns, completedRuns, warningRuns, failedRuns,
      skuRuns, asinRuns, basecampRuns,
      totalProcessed, totalSuccess, totalIssues,
      completionRate, successRate,
      activeTools: operationTools.filter(t => !t.comingSoon).length,
    };
  }, [runs]);

  const sparklineData = useMemo(() => {
    const days = 7;
    const now = Date.now();
    const getSparkline = (toolType: string) =>
      Array.from({ length: days }, (_, i) => {
        const dayStart = now - (days - 1 - i) * 86400000;
        const dayEnd = dayStart + 86400000;
        return runs.filter(r =>
          r.tool_type === toolType &&
          new Date(r.created_at).getTime() >= dayStart &&
          new Date(r.created_at).getTime() < dayEnd
        ).length;
      });
    return {
      sku: getSparkline('sku'),
      asin: getSparkline('asin'),
      basecamp: getSparkline('basecamp'),
    };
  }, [runs]);

  const recentRuns = useMemo(() => runs.slice(0, 8), [runs]);

  const navigateToTool = (toolId: 'sku' | 'asin' | 'basecamp') => {
    window.dispatchEvent(new CustomEvent('navigateToTool', { detail: { toolId } }));
  };

  const getRunCount = (id: 'sku' | 'asin' | 'basecamp') =>
    id === 'sku' ? metrics.skuRuns : id === 'asin' ? metrics.asinRuns : metrics.basecampRuns;

  const getSparkline = (id: 'sku' | 'asin' | 'basecamp') => sparklineData[id];

  const maxToolRuns = Math.max(metrics.skuRuns, metrics.asinRuns, metrics.basecampRuns, 1);

  const panelClass = isDark
    ? 'border-slate-700/50 bg-slate-900/70'
    : 'border-gray-200 bg-white';

  const pageText = isDark ? 'text-white' : 'text-gray-900';
  const mutedText = isDark ? 'text-slate-400' : 'text-gray-500';

  const toolLabel: Record<string, string> = {
    sku: 'Shopkeep',
    asin: 'ASIN Checker',
    basecamp: 'Basecamp',
  };

  // Get rank icon
  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Crown className="h-4 w-4 text-yellow-500" />;
      case 1: return <Medal className="h-4 w-4 text-gray-400" />;
      case 2: return <Medal className="h-4 w-4 text-amber-600" />;
      default: return <Trophy className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden sm:space-y-8">

      {/* ── Header ── */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className={`break-words text-xl font-bold sm:text-2xl ${pageText}`}>
              OPERATION TOOLS
            </h1>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className={`mt-1.5 text-sm ${mutedText}`}>
            Active Tools:{' '}
            <span className="font-semibold text-emerald-400">{metrics.activeTools}</span>
            <span className="mx-2 opacity-40">·</span>
            <span className="text-xs">
              Last synced {relativeTime(lastRefreshed.toISOString())}
            </span>
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </div>
      </section>

      {errorMessage && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${
          isDark ? 'border-red-500/30 bg-red-600/10 text-red-400' : 'border-red-300 bg-red-100 text-red-700'
        }`}>
          Dashboard error: {errorMessage}
        </div>
      )}

      {/* ── Tool Cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {operationTools.map(tool => (
          <ToolCard
            key={tool.id}
            tool={tool}
            theme={theme}
            runCount={getRunCount(tool.id)}
            sparkline={getSparkline(tool.id)}
            onOpen={() => navigateToTool(tool.id)}
          />
        ))}
      </section>

      {/* ── Metrics Grid ── */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard theme={theme} label="Total Runs" value={metrics.totalRuns}
          helper="Recorded tool activities" icon={<Activity className="h-5 w-5" />} tone="emerald" />
        <SummaryCard theme={theme} label="Processed Items" value={metrics.totalProcessed}
          helper="Rows, SKUs, pairs & messages" icon={<Zap className="h-5 w-5" />} tone="cyan" />
        <SummaryCard theme={theme} label="Issues Found" value={metrics.totalIssues}
          helper="Conflicts, duplicates & warnings" icon={<AlertTriangle className="h-5 w-5" />} tone="yellow" />
        <SummaryCard theme={theme} label="Completion Rate" value={metrics.completionRate} suffix="%"
          helper={`${metrics.completedRuns} completed runs`} icon={<CheckCircle2 className="h-5 w-5" />} tone="blue" />
      </section>

      {/* ── Top Users Section ── */}
      <section className={`rounded-2xl border p-4 shadow-lg sm:p-5 ${panelClass}`}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 flex-shrink-0 text-yellow-500" />
          <div>
            <h2 className={`text-base font-semibold ${pageText}`}>Top Users</h2>
            <p className={`text-xs ${mutedText}`}>Most active team members</p>
          </div>
        </div>

        {topUsers.length === 0 ? (
          <div className={`py-8 text-center text-sm ${mutedText}`}>No user data available yet</div>
        ) : (
          <div className="space-y-3">
            {topUsers.map((user, index) => {
              const maxRuns = topUsers[0]?.totalRuns || 1;
              const percentage = (user.totalRuns / maxRuns) * 100;
              
              return (
                <div key={user.email} className="group">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex-shrink-0 w-7">
                      {getRankIcon(index)}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                        {user.email[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-sm font-semibold ${pageText}`}>
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold tabular-nums text-emerald-400`}>
                            {user.totalRuns}
                          </span>
                          <span className={`text-[10px] ${mutedText}`}>runs</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="flex-1">
                          <div className={`h-1.5 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-[10px] ${mutedText}`}>
                          Completed: {user.completedRuns}
                        </span>
                      </div>
                      <p className={`text-[10px] ${mutedText} mt-1`}>
                        Last run: {relativeTime(user.lastRun)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Bottom Row: Usage Summary + Recent Activity ── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">

        {/* Usage bars — 2 cols */}
        <div className={`rounded-2xl border p-4 shadow-lg sm:p-5 lg:col-span-2 ${panelClass}`}>
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-400" />
            <div>
              <h2 className={`text-base font-semibold ${pageText}`}>Tool Usage</h2>
              <p className={`text-xs ${mutedText}`}>Run distribution across tools</p>
            </div>
          </div>
          <div className="space-y-5">
            <UsageLine theme={theme} label="Shopkeep Consolidated" value={metrics.skuRuns} maxValue={maxToolRuns} color="cyan" />
            <UsageLine theme={theme} label="Multiple Parent ASIN" value={metrics.asinRuns} maxValue={maxToolRuns} color="emerald" />
            <UsageLine theme={theme} label="Basecamp Generator" value={metrics.basecampRuns} maxValue={maxToolRuns} color="violet" />
          </div>

          <div className={`mt-5 rounded-xl border px-3 py-2.5 text-xs ${
            isDark ? 'border-slate-700/40 bg-slate-800/50' : 'border-gray-100 bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="font-semibold">7-day sparklines visible in tool cards</span>
            </div>
          </div>
        </div>

        {/* Recent runs — 3 cols with User Email */}
        <div className={`rounded-2xl border p-4 shadow-lg sm:p-5 lg:col-span-3 ${panelClass}`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 flex-shrink-0 text-orange-400" />
              <div>
                <h2 className={`text-base font-semibold ${pageText}`}>Recent Activity</h2>
                <p className={`text-xs ${mutedText}`}>Latest tool runs</p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'
            }`}>
              {recentRuns.length} shown
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className={`h-6 w-6 animate-spin ${mutedText}`} />
            </div>
          ) : recentRuns.length === 0 ? (
            <div className={`py-10 text-center text-sm ${mutedText}`}>No activity yet</div>
          ) : (
            <div className="space-y-1 overflow-hidden">
              {recentRuns.map((run, i) => (
                <div
                  key={run.id}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    isDark ? 'hover:bg-slate-800/60' : 'hover:bg-gray-50'
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <StatusDot status={run.status} />

                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${pageText}`}>{run.title}</p>
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-xs ${mutedText}`}>
                        {toolLabel[run.tool_type] ?? run.tool_type}
                        {run.total_count > 0 && ` · ${run.total_count.toLocaleString()} items`}
                      </p>
                    </div>
                    {run.user_email && run.user_email !== 'System' && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <User className="h-2.5 w-2.5 text-emerald-400" />
                        <span className={`text-[10px] ${mutedText}`}>{run.user_email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      run.status === 'completed'
                        ? isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        : run.status === 'warning'
                          ? isDark ? 'bg-yellow-500/15 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                          : isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-700'
                    }`}>
                      {run.status}
                    </span>
                    <span className={`flex items-center gap-0.5 text-[10px] ${mutedText}`}>
                      <Clock className="h-3 w-3" />
                      {relativeTime(run.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ── Tool Card ── */
function ToolCard({
  tool, theme, runCount, sparkline, onOpen,
}: {
  tool: ToolCardItem;
  theme: 'light' | 'dark';
  runCount: number;
  sparkline: number[];
  onOpen: () => void;
}) {
  const isDark = theme === 'dark';
  const animCount = useAnimatedCounter(runCount);

  const accentConfig = {
    purple: {
      card: isDark
        ? 'border-violet-500/25 bg-violet-950/40 hover:bg-violet-900/40 hover:border-violet-500/40'
        : 'border-violet-200 bg-violet-50 hover:bg-violet-100',
      badge: isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700',
      spark: '#8b5cf6',
      count: 'text-violet-400',
    },
    green: {
      card: isDark
        ? 'border-emerald-500/25 bg-emerald-950/40 hover:bg-emerald-900/40 hover:border-emerald-500/40'
        : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100',
      badge: isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
      spark: '#10b981',
      count: 'text-emerald-400',
    },
    blue: {
      card: isDark
        ? 'border-cyan-500/25 bg-cyan-950/40 hover:bg-cyan-900/40 hover:border-cyan-500/40'
        : 'border-cyan-200 bg-cyan-50 hover:bg-cyan-100',
      badge: isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700',
      spark: '#06b6d4',
      count: 'text-cyan-400',
    },
  }[tool.accent];

  const statusBadge =
    tool.status === 'Active' ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
    : tool.status === 'Beta' ? isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
    : isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700';

  return (
    <button
      type="button"
      onClick={() => !tool.comingSoon && onOpen()}
      disabled={tool.comingSoon}
      className={`group relative flex min-h-[220px] w-full flex-col rounded-2xl border p-5 text-left shadow-lg transition-all duration-200
        ${accentConfig.card}
        ${tool.comingSoon ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${
          isDark ? 'bg-slate-900/50 text-slate-300' : 'bg-white/70 text-gray-600'
        }`}>
          <span className="flex-shrink-0">{tool.icon}</span>
          <span className="truncate">{tool.category}</span>
        </div>
        <div className="flex-shrink-0 pt-0.5">
          <Sparkline data={sparkline} color={accentConfig.spark} />
        </div>
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <h3 className={`break-words text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {tool.title}
        </h3>
        <p className={`mt-1.5 line-clamp-3 text-sm leading-5 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
          {tool.description}
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${statusBadge}`}>
            {tool.status}
          </span>
          <p className={`mt-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {tool.usage} usage
          </p>
        </div>

        <div className="flex flex-shrink-0 items-end gap-4">
          <div className="text-right">
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Runs</p>
            <p className={`mt-0.5 text-xl font-bold tabular-nums ${accentConfig.count}`}>
              {animCount.toLocaleString()}
            </p>
          </div>
          {!tool.comingSoon && (
            <div className={`rounded-full bg-black/40 p-2 text-white transition-all duration-200 group-hover:translate-x-1 group-hover:bg-black/60`}>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── Summary Card ── */
function SummaryCard({
  theme, label, value, suffix = '', helper, icon, tone,
}: {
  theme: 'light' | 'dark'; label: string; value: number; suffix?: string;
  helper: string; icon: React.ReactNode; tone: 'emerald' | 'cyan' | 'yellow' | 'blue';
}) {
  const isDark = theme === 'dark';
  const animValue = useAnimatedCounter(value);

  const toneClass = {
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
    yellow: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-lg sm:p-5 ${
      isDark ? 'border-slate-700/50 bg-slate-900/60' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{label}</p>
          <p className={`mt-2 break-words text-2xl font-bold tabular-nums sm:text-3xl ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {animValue.toLocaleString()}{suffix}
          </p>
        </div>
        <div className={`flex-shrink-0 rounded-xl border p-2 ${toneClass}`}>{icon}</div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <ArrowUpRight className={`h-3 w-3 flex-shrink-0 ${
          tone === 'yellow' ? 'text-yellow-400' : 'text-emerald-400'
        }`} />
        <p className={`text-xs leading-5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{helper}</p>
      </div>
    </div>
  );
}

/* ── Usage Line ── */
function UsageLine({
  theme, label, value, maxValue, color = 'emerald',
}: {
  theme: 'light' | 'dark'; label: string; value: number; maxValue: number;
  color?: 'emerald' | 'cyan' | 'violet';
}) {
  const isDark = theme === 'dark';
  const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  const barColor = color === 'violet' ? 'bg-violet-500' : color === 'cyan' ? 'bg-cyan-500' : 'bg-emerald-500';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`truncate text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
          {label}
        </span>
        <span className={`flex-shrink-0 text-sm tabular-nums ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          {value.toLocaleString()} runs
        </span>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className={`mt-1 text-right text-[10px] tabular-nums ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
        {percentage}% of peak
      </p>
    </div>
  );
}