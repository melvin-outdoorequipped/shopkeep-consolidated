'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  FileText,
  HelpCircle,
  Loader2,
  Play,
  Trash2,
  Upload,
} from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import { logToolRun } from '@/lib/tara/logActivity';

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

interface RunStats {
  totalRows: number;
  validPairs: number;
  ignoredRows: number;
  uniqueStyles: number;
}

type FeedbackType = 'success' | 'error' | 'info';

interface Feedback {
  type: FeedbackType;
  message: string;
}

const sampleStyles = `PAN1P/8080AP121
PAN1P/9180AP121
PAN3P/5353AZ531
PAN3P/8080AP531
PAN3P/9180AP531
XAC9P/6253AP534
XAC9P/9180AP533
XAN1P/8080AP131
XAN1P/9180AP131
XAN3P/9180AP531
XAN9E/9180AP506
XAN9P/8080AP536`;

const sampleAsins = `B09X25ZFH6
B09X25ZFH6
B09XBXH44D
B09XBXH44D
B09XBXH44D
B09XFXNMFV
B09XFXNMFV
B0DVCCHV1Q
B0DVCCHV1Q
B0B578QHH7
B09WRV711W
B09WRV711W`;

function splitLines(value: string): string[] {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

function csvEscape(value: string): string {
  const safeValue = value ?? '';

  if (
    safeValue.includes(',') ||
    safeValue.includes('"') ||
    safeValue.includes('\n')
  ) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }

  return safeValue;
}

function buildPairs(stylesInput: string, asinsInput: string) {
  const stylesArray = splitLines(stylesInput);
  const asinsArray = splitLines(asinsInput);
  const maxRows = Math.max(stylesArray.length, asinsArray.length);

  const pairs: StyleAsinPair[] = [];
  let ignoredRows = 0;

  for (let i = 0; i < maxRows; i += 1) {
    const style = stylesArray[i]?.trim() ?? '';
    const asin = asinsArray[i]?.trim() ?? '';

    if (style && asin) {
      pairs.push({ style, asin });
    } else if (style || asin) {
      ignoredRows += 1;
    }
  }

  return {
    pairs,
    totalRows: maxRows,
    ignoredRows,
  };
}

function findConflicts(pairs: StyleAsinPair[]): Conflict[] {
  const styleMap = new Map<string, Set<string>>();

  pairs.forEach(({ style, asin }) => {
    if (!styleMap.has(style)) {
      styleMap.set(style, new Set<string>());
    }

    styleMap.get(style)?.add(asin);
  });

  return Array.from(styleMap.entries())
    .filter(([, asinsSet]) => asinsSet.size > 1)
    .map(([style, asinsSet]) => ({
      style,
      asins: Array.from(asinsSet).sort(),
    }))
    .sort((a, b) => a.style.localeCompare(b.style));
}

export default function AsinConflictChecker({
  theme = 'dark',
}: AsinConflictCheckerProps) {
  const [stylesInput, setStylesInput] = useState('');
  const [asinsInput, setAsinsInput] = useState('');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastRan, setLastRan] = useState<{ date: string; time: string } | null>(
    null
  );
  const [showHelp, setShowHelp] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [stats, setStats] = useState<RunStats | null>(null);

  const stylesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const asinsTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isDark = theme === 'dark';

  const stylesLineCount = useMemo(
    () => (stylesInput.trim() ? splitLines(stylesInput).length : 0),
    [stylesInput]
  );

  const asinsLineCount = useMemo(
    () => (asinsInput.trim() ? splitLines(asinsInput).length : 0),
    [asinsInput]
  );

  const hasInput = stylesInput.trim().length > 0 || asinsInput.trim().length > 0;
  const hasBothInputs =
    stylesInput.trim().length > 0 && asinsInput.trim().length > 0;

  const lineCountMismatch =
    stylesLineCount > 0 &&
    asinsLineCount > 0 &&
    stylesLineCount !== asinsLineCount;

  const maxAsins =
    conflicts.length > 0
      ? Math.max(...conflicts.map((conflict) => conflict.asins.length))
      : 0;

  const showFeedback = (type: FeedbackType, message: string) => {
    setFeedback({ type, message });

    window.setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  const loadSampleData = () => {
    setStylesInput(sampleStyles);
    setAsinsInput(sampleAsins);
    setConflicts([]);
    setLastRan(null);
    setStats(null);
    showFeedback('info', 'Sample data loaded.');
  };

  const handleRun = async () => {
    if (!hasBothInputs) {
      showFeedback('error', 'Please provide both Style IDs and Parent ASINs.');
      return;
    }

    setIsChecking(true);
    setFeedback(null);

    try {
      const { pairs, totalRows, ignoredRows } = buildPairs(
        stylesInput,
        asinsInput
      );

      if (pairs.length === 0) {
        setConflicts([]);
        setStats(null);
        showFeedback('error', 'No valid Style-ASIN pairs were found.');
        return;
      }

      const result = findConflicts(pairs);
      const uniqueStyles = new Set(pairs.map((pair) => pair.style)).size;

      const runStats: RunStats = {
        totalRows,
        validPairs: pairs.length,
        ignoredRows,
        uniqueStyles,
      };

      setConflicts(result);
      setStats(runStats);

      const now = new Date();

      setLastRan({
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });

      await supabase.from('asin_checks').insert({
        total_rows: totalRows,
        valid_pairs: pairs.length,
        ignored_rows: ignoredRows,
        conflict_count: result.length,
        conflicts: result,
        status: 'completed',
      });

      await logToolRun({
        toolType: 'asin',
        status: result.length > 0 ? 'warning' : 'completed',
        title: 'ASIN conflict check completed',
        description:
          result.length > 0
            ? `${result.length} conflict${result.length === 1 ? '' : 's'} found.`
            : 'No conflicts found.',
        totalCount: pairs.length,
        successCount: pairs.length - result.length,
        issueCount: result.length,
        metadata: {
          totalRows,
          validPairs: pairs.length,
          ignoredRows,
          uniqueStyles,
          conflicts: result,
        },
      });

      showFeedback(
        result.length > 0 ? 'error' : 'success',
        result.length > 0
          ? `${result.length} conflict${result.length === 1 ? '' : 's'} found.`
          : 'No conflicts found.'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'ASIN check failed.';

      await supabase.from('asin_checks').insert({
        total_rows: 0,
        valid_pairs: 0,
        ignored_rows: 0,
        conflict_count: 0,
        conflicts: [],
        status: 'failed',
      });

      await logToolRun({
        toolType: 'asin',
        status: 'failed',
        title: 'ASIN conflict check failed',
        description: message,
        totalCount: 0,
        successCount: 0,
        issueCount: 0,
        metadata: {
          error: message,
        },
      });

      showFeedback('error', message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClear = () => {
    setStylesInput('');
    setAsinsInput('');
    setConflicts([]);
    setLastRan(null);
    setStats(null);
    setFeedback(null);
  };

  const handleCopyResults = async () => {
    if (conflicts.length === 0) return;

    try {
      const headerColumns = [
        'Style',
        ...Array.from({ length: maxAsins }, (_, index) => `Parent ASIN ${index + 1}`),
      ];

      const rows = conflicts.map((conflict) => [
        conflict.style,
        ...conflict.asins,
      ]);

      const copyText = [headerColumns, ...rows]
        .map((row) => row.join('\t'))
        .join('\n');

      await navigator.clipboard.writeText(copyText);
      showFeedback('success', 'Results copied to clipboard.');
    } catch {
      showFeedback('error', 'Unable to copy results.');
    }
  };

  const handleExportCSV = () => {
    if (conflicts.length === 0) return;

    const headers = [
      'Style',
      ...Array.from({ length: maxAsins }, (_, index) => `Parent ASIN ${index + 1}`),
    ];

    const rows = conflicts.map((conflict) => [
      conflict.style,
      ...conflict.asins,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `asin-conflicts-${new Date().toISOString().split('T')[0]}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
    showFeedback('success', 'CSV exported successfully.');
  };

  const cardClass = isDark
    ? 'bg-slate-900/50 border-slate-700/50'
    : 'bg-white/70 border-gray-300/60';

  const panelHeaderClass = isDark
    ? 'bg-slate-800/50 border-slate-700'
    : 'bg-gray-100/70 border-gray-300';

  const mutedTextClass = isDark ? 'text-slate-400' : 'text-gray-600';
  const strongTextClass = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={`mb-1 text-2xl font-bold ${strongTextClass}`}>
              Multiple Parent ASIN Checker
            </h2>
            <p className={`text-sm ${mutedTextClass}`}>
              Identify styles that have multiple unique parent ASINs mapped to
              them.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowHelp((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isDark
                ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/60'
                : 'bg-gray-200/70 text-gray-700 hover:bg-gray-300/70'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </button>
        </div>

        {showHelp && (
          <div
            className={`mt-4 rounded-xl border p-4 ${
              isDark
                ? 'border-emerald-500/20 bg-emerald-600/10'
                : 'border-emerald-300/60 bg-emerald-100/60'
            }`}
          >
            <h3
              className={`mb-3 flex items-center gap-2 font-semibold ${
                isDark ? 'text-emerald-400' : 'text-emerald-700'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              How to use this tool
            </h3>

            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              {[
                'Paste your Style IDs in the left column.',
                'Paste corresponding Parent ASINs in the right column.',
                'Each row represents one Style-ASIN pair.',
                'Click Run Check to scan for conflicts.',
                'Duplicate ASINs for the same style are ignored.',
                'Results are saved to Supabase activity logs.',
              ].map((instruction, index) => (
                <div
                  key={instruction}
                  className={`flex items-start gap-2 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}
                >
                  <span className="font-bold text-emerald-500">
                    {index + 1}.
                  </span>
                  <span>{instruction}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
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
          {feedback.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {feedback.message}
        </div>
      )}

      <div className={`flex flex-1 flex-col overflow-hidden rounded-xl border ${cardClass}`}>
        <div
          className={`flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between ${panelHeaderClass}`}
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRun}
              disabled={!hasBothInputs || isChecking}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              {isChecking ? 'Checking...' : 'Run Check'}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={!hasInput && conflicts.length === 0}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? 'border-red-600/30 bg-red-600/20 text-red-400 hover:bg-red-600/30'
                  : 'border-red-300 bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>

            {conflicts.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCopyResults}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
                    isDark
                      ? 'border-blue-600/30 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                      : 'border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <Copy className="h-4 w-4" />
                  Copy Results
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
                    isDark
                      ? 'border-purple-600/30 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                      : 'border-purple-300 bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadSampleData}
              className={`inline-flex items-center gap-2 text-sm ${
                isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              Load Sample
            </button>

            {lastRan && (
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Last run:{' '}
                <span className="font-mono text-cyan-500">
                  {lastRan.date} {lastRan.time}
                </span>
              </div>
            )}
          </div>
        </div>

        {lineCountMismatch && (
          <div
            className={`border-b px-4 py-2 text-xs ${
              isDark
                ? 'border-yellow-500/20 bg-yellow-600/10 text-yellow-400'
                : 'border-yellow-300 bg-yellow-100 text-yellow-800'
            }`}
          >
            Warning: Style rows and ASIN rows do not match. Rows with missing
            values will be ignored.
          </div>
        )}

        {stats && (
          <div
            className={`grid grid-cols-2 gap-2 border-b p-4 text-sm md:grid-cols-4 ${
              isDark ? 'border-slate-700' : 'border-gray-300'
            }`}
          >
            <StatCard label="Total Rows" value={stats.totalRows} theme={theme} />
            <StatCard label="Valid Pairs" value={stats.validPairs} theme={theme} />
            <StatCard label="Unique Styles" value={stats.uniqueStyles} theme={theme} />
            <StatCard label="Ignored Rows" value={stats.ignoredRows} theme={theme} />
          </div>
        )}

        <div className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              isDark ? 'bg-slate-800/30' : 'bg-gray-100/50'
            }`}
          >
            <InputHeader title="📦 Style IDs" subtitle="one per line" isDark={isDark} bordered />
            <InputHeader title="🔗 Parent ASINs" subtitle="one per line" isDark={isDark} />
          </div>

          <div className="grid h-[28rem] grid-cols-1 md:grid-cols-2">
            <textarea
              ref={stylesTextareaRef}
              className={`h-full w-full resize-none border-b p-4 font-mono text-sm focus:outline-none md:border-b-0 md:border-r ${
                isDark
                  ? 'border-slate-700 bg-transparent text-slate-200 placeholder-slate-600 focus:bg-slate-800/30'
                  : 'border-gray-300 bg-transparent text-gray-900 placeholder-gray-400 focus:bg-gray-100/50'
              }`}
              placeholder={`Example:\nSTYLE-001\nSTYLE-002\nSTYLE-003`}
              value={stylesInput}
              onChange={(event) => setStylesInput(event.target.value)}
              onScroll={(event) => {
                if (asinsTextareaRef.current) {
                  asinsTextareaRef.current.scrollTop = event.currentTarget.scrollTop;
                }
              }}
              disabled={isChecking}
              spellCheck={false}
            />

            <textarea
              ref={asinsTextareaRef}
              className={`h-full w-full resize-none p-4 font-mono text-sm focus:outline-none ${
                isDark
                  ? 'bg-transparent text-slate-200 placeholder-slate-600 focus:bg-slate-800/30'
                  : 'bg-transparent text-gray-900 placeholder-gray-400 focus:bg-gray-100/50'
              }`}
              placeholder={`Example:\nB08XYZ123AB\nB09ABC456CD\nB07DEF789EF`}
              value={asinsInput}
              onChange={(event) => setAsinsInput(event.target.value)}
              onScroll={(event) => {
                if (stylesTextareaRef.current) {
                  stylesTextareaRef.current.scrollTop = event.currentTarget.scrollTop;
                }
              }}
              disabled={isChecking}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex min-h-[300px] flex-1 flex-col">
          <div
            className={`flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
              isDark
                ? 'border-slate-700 bg-slate-800/30'
                : 'border-gray-300 bg-gray-100/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${strongTextClass}`}>
                Results
              </span>

              {conflicts.length > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isDark
                      ? 'bg-yellow-600/20 text-yellow-400'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {conflicts.length} conflict
                  {conflicts.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {conflicts.length === 0 && lastRan && (
              <EmptyResult
                icon={<CheckCircle className="h-8 w-8" />}
                title="No conflicts found!"
                description="All styles have unique parent ASINs."
                theme={theme}
                success
              />
            )}

            {conflicts.length === 0 && !lastRan && (
              <EmptyResult
                icon={<Upload className="h-8 w-8" />}
                title="Ready to check for conflicts"
                description='Paste your data above and click "Run Check".'
                theme={theme}
              />
            )}

            {conflicts.length > 0 && (
              <div className="min-w-max">
                <div
                  className={`sticky top-0 flex border-b ${
                    isDark
                      ? 'border-slate-700 bg-slate-800'
                      : 'border-gray-300 bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-96 border-r p-3 text-xs font-semibold ${
                      isDark
                        ? 'border-slate-700 text-slate-300'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Style ID
                  </div>
                  <div
                    className={`flex-1 p-3 text-xs font-semibold ${
                      isDark ? 'text-slate-300' : 'text-gray-700'
                    }`}
                  >
                    Unique Parent ASINs
                  </div>
                </div>

                {conflicts.map((conflict) => (
                  <div
                    key={conflict.style}
                    className={`flex border-b transition-colors ${
                      isDark
                        ? 'border-slate-700/50 hover:bg-slate-800/30'
                        : 'border-gray-200 hover:bg-gray-100/50'
                    }`}
                  >
                    <div
                      className={`w-96 truncate border-r p-3 text-sm font-medium ${
                        isDark
                          ? 'border-slate-700/50 bg-yellow-600/5 text-slate-200'
                          : 'border-gray-200 bg-yellow-100/30 text-gray-800'
                      }`}
                      title={conflict.style}
                    >
                      {conflict.style}
                    </div>

                    <div className="flex-1 p-3">
                      <div className="flex flex-wrap gap-2">
                        {conflict.asins.map((asin) => (
                          <span
                            key={`${conflict.style}-${asin}`}
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs ${
                              isDark
                                ? 'border-red-600/20 bg-red-600/10 text-red-400'
                                : 'border-red-300 bg-red-100 text-red-700'
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

function StatCard({
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
      className={`rounded-lg border p-3 ${
        isDark
          ? 'border-slate-700/60 bg-slate-800/30'
          : 'border-gray-200 bg-white/70'
      }`}
    >
      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}

function InputHeader({
  title,
  subtitle,
  isDark,
  bordered = false,
}: {
  title: string;
  subtitle: string;
  isDark: boolean;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-3 text-sm font-semibold ${
        bordered ? 'md:border-r' : ''
      } ${
        isDark
          ? 'border-slate-700 text-emerald-400'
          : 'border-gray-300 text-emerald-700'
      }`}
    >
      <span>{title}</span>
      <span
        className={`text-xs font-normal ${
          isDark ? 'text-slate-500' : 'text-gray-500'
        }`}
      >
        ({subtitle})
      </span>
    </div>
  );
}

function EmptyResult({
  icon,
  title,
  description,
  theme,
  success = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  theme: 'light' | 'dark';
  success?: boolean;
}) {
  const isDark = theme === 'dark';

  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <div
        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
          success
            ? isDark
              ? 'bg-emerald-600/10 text-emerald-400'
              : 'bg-emerald-100 text-emerald-600'
            : isDark
              ? 'bg-slate-800/50 text-slate-500'
              : 'bg-gray-200/50 text-gray-500'
        }`}
      >
        {icon}
      </div>

      <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
        {title}
      </p>
      <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        {description}
      </p>
    </div>
  );
}