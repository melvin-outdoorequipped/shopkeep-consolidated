'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  MessageSquare,
  Upload,
  FileText,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { supabase } from '@/lib/supabase/client';
import { logToolRun } from '@/lib/tara/logActivity';

interface BasecampGeneratorProps {
  theme?: 'light' | 'dark';
}

type AnalysisType = 'initial' | 'final' | 'pre-approval' | 'for-fixing';

interface POFileData {
  filename: string;
  content: string;
  rows: string[][];
}

interface GenerationStats {
  totalSkus: number;
  totalQty: number;
  issueCount: number;
}

export default function BasecampGenerator({
  theme = 'dark',
}: BasecampGeneratorProps) {
  const [uploadedFiles, setUploadedFiles] = useState<{
    preApproval?: POFileData;
    listingData?: POFileData;
    excluded?: POFileData;
  }>({});

  const [analysisType, setAnalysisType] = useState<AnalysisType>('initial');
  const [poNumber, setPoNumber] = useState('');

  const [shippingPlanError, setShippingPlanError] = useState<'no' | 'yes'>(
    'no'
  );
  const [suggest3PL, setSuggest3PL] = useState<'yes' | 'no'>('no');
  const [doneTracker, setDoneTracker] = useState(false);
  const [doneFbaErrorTracker, setDoneFbaErrorTracker] = useState(false);
  const [doneTrackerSubmission, setDoneTrackerSubmission] = useState(false);

  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const isDark = theme === 'dark';

  const getHighlightColor = () => {
    switch (analysisType) {
      case 'initial':
      case 'final':
        return isDark
          ? 'bg-emerald-950/40 border border-emerald-500/30'
          : 'bg-emerald-50/70 border border-emerald-300';
      case 'pre-approval':
        return isDark
          ? 'bg-amber-950/40 border border-amber-500/30'
          : 'bg-amber-50/70 border border-amber-300';
      case 'for-fixing':
        return isDark
          ? 'bg-blue-950/40 border border-blue-500/30'
          : 'bg-blue-50/70 border border-blue-300';
      default:
        return isDark
          ? 'bg-slate-900/50 border border-slate-700'
          : 'bg-gray-50 border border-gray-200';
    }
  };

  const getHighlightTextColor = () => {
    switch (analysisType) {
      case 'initial':
      case 'final':
        return isDark ? 'text-emerald-300' : 'text-emerald-800';
      case 'pre-approval':
        return isDark ? 'text-amber-300' : 'text-amber-800';
      case 'for-fixing':
        return isDark ? 'text-blue-300' : 'text-blue-800';
      default:
        return isDark ? 'text-slate-300' : 'text-gray-700';
    }
  };

  const parseExcelFile = async (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            header: 1,
            defval: '',
          });

          const rows = jsonData as string[][];

          const nonEmptyRows = rows.filter((row) =>
            row.some((cell) => cell && cell.toString().trim() !== '')
          );

          resolve(nonEmptyRows);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCsvText = (text: string): string[][] => {
    const lines = text.split(/\r?\n/);
    const rows: string[][] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const row: string[] = [];
      let insideQuote = false;
      let entry = '';

      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];

        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          row.push(entry.trim());
          entry = '';
        } else {
          entry += char;
        }
      }

      row.push(entry.trim());
      rows.push(row);
    }

    return rows;
  };

  const handleFileUpload = async (
    type: 'preApproval' | 'listingData' | 'excluded',
    file: File
  ) => {
    if (!file || file.name === '') {
      setUploadedFiles((previous) => {
        const newFiles = { ...previous };
        delete newFiles[type];
        return newFiles;
      });
      return;
    }

    try {
      let rows: string[][] = [];

      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        rows = parseCsvText(text);
      } else {
        rows = await parseExcelFile(file);
      }

      if (rows.length === 0) {
        throw new Error('File contains no data.');
      }

      setUploadedFiles((previous) => ({
        ...previous,
        [type]: {
          filename: file.name,
          content: file.name,
          rows,
        },
      }));

      setError('');
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(
        `Failed to parse ${file.name}. Please ensure it is a valid Excel or CSV file.`
      );
    }
  };

  const parseForInitial = (fileData?: POFileData) => {
    if (!fileData || !fileData.rows || fileData.rows.length <= 1) {
      return {
        totalSkus: 0,
        totalQty: 0,
        issuesMap: {} as Record<string, { skus: number; qty: number }>,
      };
    }

    const headers = fileData.rows[0].map((header) =>
      String(header || '').toLowerCase().trim()
    );

    const skuIndex = headers.findIndex((header) => header === 'sku');
    const qtyIndex = headers.findIndex(
      (header) => header === 'qty' || header === 'order'
    );
    const notesIndex = headers.findIndex((header) => header === 'notes');

    const finalSkuIndex = skuIndex !== -1 ? skuIndex : 0;
    const finalQtyIndex = qtyIndex !== -1 ? qtyIndex : 6;

    let totalSkus = 0;
    let totalQty = 0;

    const issuesMap: Record<string, { skus: number; qty: number }> = {};

    for (let index = 1; index < fileData.rows.length; index += 1) {
      const row = fileData.rows[index];

      if (row && row.length > Math.max(finalSkuIndex, finalQtyIndex)) {
        const skuValue = row[finalSkuIndex]?.toString().trim();

        if (skuValue && skuValue !== '') {
          totalSkus += 1;

          const qtyValue =
            Number.parseInt(row[finalQtyIndex]?.toString(), 10) || 0;

          totalQty += qtyValue;

          if (notesIndex !== -1 && row[notesIndex]) {
            const noteText = row[notesIndex].toString().trim();

            if (
              noteText &&
              noteText !== '' &&
              noteText !== '#N/A' &&
              !noteText.startsWith('=') &&
              noteText !== 'Good to Order' &&
              noteText !== 'Good'
            ) {
              if (!issuesMap[noteText]) {
                issuesMap[noteText] = {
                  skus: 0,
                  qty: 0,
                };
              }

              issuesMap[noteText].skus += 1;
              issuesMap[noteText].qty += qtyValue;
            }
          }
        }
      }
    }

    return {
      totalSkus,
      totalQty,
      issuesMap,
    };
  };

  const parseWithRemarks = (fileData?: POFileData) => {
    if (!fileData || !fileData.rows || fileData.rows.length <= 1) {
      return {
        totalSkus: 0,
        totalQty: 0,
        issuesMap: {} as Record<string, { skus: number; qty: number }>,
      };
    }

    const headers = fileData.rows[0].map((header) =>
      String(header || '').toLowerCase().trim()
    );

    const skuIndex = headers.findIndex((header) => header === 'sku');
    const qtyIndex = headers.findIndex(
      (header) => header === 'qty' || header === 'order'
    );
    const remarksIndex = headers.findIndex((header) => header === 'remarks');

    const finalSkuIndex = skuIndex !== -1 ? skuIndex : 0;
    const finalQtyIndex = qtyIndex !== -1 ? qtyIndex : 6;

    let totalSkus = 0;
    let totalQty = 0;

    const issuesMap: Record<string, { skus: number; qty: number }> = {};

    for (let index = 1; index < fileData.rows.length; index += 1) {
      const row = fileData.rows[index];

      if (row && row.length > Math.max(finalSkuIndex, finalQtyIndex)) {
        const skuValue = row[finalSkuIndex]?.toString().trim();

        if (skuValue && skuValue !== '') {
          totalSkus += 1;

          const qtyValue =
            Number.parseInt(row[finalQtyIndex]?.toString(), 10) || 0;

          totalQty += qtyValue;

          let category = 'Standalone';

          if (remarksIndex !== -1 && row[remarksIndex]) {
            const remarkText = row[remarksIndex].toString().trim();

            if (
              remarkText &&
              remarkText !== '' &&
              remarkText !== '#N/A' &&
              !remarkText.startsWith('=')
            ) {
              category = remarkText;
            }
          }

          if (!issuesMap[category]) {
            issuesMap[category] = {
              skus: 0,
              qty: 0,
            };
          }

          issuesMap[category].skus += 1;
          issuesMap[category].qty += qtyValue;
        }
      }
    }

    return {
      totalSkus,
      totalQty,
      issuesMap,
    };
  };

  const saveBasecampGeneration = async ({
    message,
    stats,
    status,
    errorMessage,
  }: {
    message: string | null;
    stats: GenerationStats;
    status: 'completed' | 'failed';
    errorMessage?: string | null;
  }) => {
    const { error: insertError } = await supabase
      .from('basecamp_generations')
      .insert({
        po_number: poNumber.trim() || null,
        analysis_type: analysisType,

        total_skus: stats.totalSkus,
        total_qty: stats.totalQty,
        issue_count: stats.issueCount,

        shipping_plan_error: shippingPlanError,
        suggest_3pl: suggest3PL,

        done_tracker: doneTracker,
        done_fba_error_tracker: doneFbaErrorTracker,
        done_tracker_submission: doneTrackerSubmission,

        pre_approval_filename: uploadedFiles.preApproval?.filename ?? null,
        listing_data_filename: uploadedFiles.listingData?.filename ?? null,
        excluded_filename: uploadedFiles.excluded?.filename ?? null,

        message_preview: message ? message.slice(0, 500) : null,
        message_full: message,

        status,
        error: errorMessage ?? null,
      });

    if (insertError) {
      throw insertError;
    }
  };

  const generateMessage = async () => {
    setIsGenerating(true);
    setError('');

    try {
      let message = '';
      const poPrefix = poNumber.trim() ? `${poNumber.trim()}` : '[PO Number]';

      let generationStats: GenerationStats = {
        totalSkus: 0,
        totalQty: 0,
        issueCount: 0,
      };

      if (analysisType === 'initial') {
        const { totalSkus, totalQty, issuesMap } = parseForInitial(
          uploadedFiles.listingData
        );

        generationStats = {
          totalSkus,
          totalQty,
          issueCount: Object.keys(issuesMap).length,
        };

        message = `Hi Ms, kindly see the initial analysis for this PO#: ${poPrefix}. Thank you!\n`;
        message += `Total No. of SKUs in Order: ${totalSkus} | QTY: ${totalQty} (Good to Order)\n\n`;

        Object.entries(issuesMap).forEach(([note, data]) => {
          message += ` | ${note}: ${data.skus} | QTY: ${data.qty}\n`;
        });

        if (doneTracker) {
          message += `\n✅Done updating the tracker\n`;
        }
      } else if (analysisType === 'final') {
        const { totalSkus, totalQty, issuesMap } = parseWithRemarks(
          uploadedFiles.listingData
        );

        generationStats = {
          totalSkus,
          totalQty,
          issueCount: Object.keys(issuesMap).length,
        };

        message = `Hi Ms, kindly see the Listing Data and Excluded file for this PO#: ${poPrefix}. Thank you!\n`;
        message += `Total No. of SKUs in Order: ${totalSkus} | QTY: ${totalQty} (Good to Order)\n`;

        if (uploadedFiles.excluded) {
          const { totalSkus: excludedSkus, totalQty: excludedQty } =
            parseWithRemarks(uploadedFiles.excluded);

          if (excludedSkus > 0) {
            message += `Total No. of Excluded SKUs in Order: ${excludedSkus} | QTY: ${excludedQty}\n`;
          }
        }

        message += '\n';

        Object.entries(issuesMap).forEach(([remark, data]) => {
          message += ` | ${remark}: ${data.skus} | QTY: ${data.qty}\n`;
        });

        if (shippingPlanError === 'yes') {
          message += `\nShipping Plan Error\n`;
        } else {
          message += `\nNo error in shipping plan creation\n`;
        }

        if (doneTracker) {
          message += `✅Done updating the tracker\n`;
        }

        if (doneFbaErrorTracker) {
          message += `✅Done adding to FBA ASIN Errors Encountered tracker\n`;
        }

        if (doneTrackerSubmission) {
          message += `✅Added to Thorogood - Amazon Deliverables Tracker & Form Submission:\n`;
        }

        if (suggest3PL === 'yes') {
          message += `Note: Please see the remarks column for items suggested for 3PL.\n`;
        }
      } else if (analysisType === 'pre-approval') {
        const { totalSkus, totalQty } = parseWithRemarks(
          uploadedFiles.preApproval
        );

        generationStats = {
          totalSkus,
          totalQty,
          issueCount: 0,
        };

        message = `Hi, please see the attached Pre-Approval file for these items to see if it is good to order or exclude. Thank you!\n`;
        message += `Total No. of SKUs for Pre-Approval: ${totalSkus} | QTY: ${totalQty}\n\n`;
        message += ` | Standalone: ${totalSkus} | QTY: ${totalQty}\n`;
      } else {
        const { totalSkus, totalQty, issuesMap } = parseWithRemarks(
          uploadedFiles.listingData || uploadedFiles.preApproval
        );

        generationStats = {
          totalSkus,
          totalQty,
          issueCount: Object.keys(issuesMap).length,
        };

        message = `Hi Ms, forwarding this file for fixing. Thank you!\n`;
        message += `Total No. of SKUs For Fixing in Order: ${totalSkus} | QTY: ${totalQty}\n\n`;

        Object.entries(issuesMap).forEach(([remark, data]) => {
          message += ` | ${remark}: ${data.skus} | QTY: ${data.qty}\n`;
        });

        if (doneTracker) {
          message += `\n✅Done updating the tracker\n`;
        }
      }

      setGeneratedMessage(message);

      await saveBasecampGeneration({
        message,
        stats: generationStats,
        status: 'completed',
      });

      await logToolRun({
        toolType: 'basecamp',
        status: 'completed',
        title: 'Basecamp message generated',
        description: `${analysisType.replace('-', ' ')} message generated${
          poNumber.trim() ? ` for PO ${poNumber.trim()}` : ''
        }.`,
        totalCount: generationStats.totalSkus,
        successCount: generationStats.totalQty,
        issueCount: generationStats.issueCount,
        metadata: {
          poNumber: poNumber.trim() || null,
          analysisType,
          totalSkus: generationStats.totalSkus,
          totalQty: generationStats.totalQty,
          issueCount: generationStats.issueCount,
          preApprovalFilename: uploadedFiles.preApproval?.filename ?? null,
          listingDataFilename: uploadedFiles.listingData?.filename ?? null,
          excludedFilename: uploadedFiles.excluded?.filename ?? null,
        },
      });
    } catch (err) {
      console.error('BASECAMP GENERATION ERROR:', err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to generate Basecamp message.';

      try {
        await saveBasecampGeneration({
          message: null,
          stats: {
            totalSkus: 0,
            totalQty: 0,
            issueCount: 1,
          },
          status: 'failed',
          errorMessage,
        });
      } catch (saveError) {
        console.error('FAILED TO SAVE BASECAMP FAILURE LOG:', saveError);
      }

      await logToolRun({
        toolType: 'basecamp',
        status: 'failed',
        title: 'Basecamp message generation failed',
        description: errorMessage,
        totalCount: 0,
        successCount: 0,
        issueCount: 1,
        metadata: {
          poNumber: poNumber.trim() || null,
          analysisType,
        },
      });

      setError('Failed to generate message. Please check your files and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedMessage);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const clearAll = () => {
    setUploadedFiles({});
    setPoNumber('');
    setGeneratedMessage('');
    setError('');
    setShippingPlanError('no');
    setSuggest3PL('no');
    setDoneTracker(false);
    setDoneFbaErrorTracker(false);
    setDoneTrackerSubmission(false);
  };

  const hasRequiredFiles = () => {
    if (analysisType === 'pre-approval') return !!uploadedFiles.preApproval;
    return !!uploadedFiles.listingData;
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left Panel */}
        <div
          className={`min-w-0 rounded-2xl border p-4 shadow-lg sm:p-6 ${
            isDark
              ? 'border-slate-700/50 bg-slate-900/70'
              : 'border-gray-200 bg-white'
          }`}
        >
          <h2
            className={`mb-4 text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Configuration
          </h2>

          <div className="mb-6">
            <label
              className={`mb-2 block text-sm font-medium ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}
            >
              Message Type
            </label>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-4">
              {(['initial', 'final', 'pre-approval', 'for-fixing'] as const).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAnalysisType(type)}
                    className={`min-h-[42px] rounded-lg px-2 py-2 text-xs font-semibold capitalize transition-colors sm:text-sm ${
                      analysisType === type
                        ? 'bg-emerald-500 text-white'
                        : isDark
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.replace('-', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="mb-4">
            <label
              className={`mb-2 block text-sm font-medium ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}
            >
              PO Number
            </label>

            <input
              type="text"
              value={poNumber}
              onChange={(event) => setPoNumber(event.target.value)}
              placeholder="e.g. FDANN010726PBB"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          <div className="mb-6 space-y-4 border-y border-slate-700/20 py-4">
            {(analysisType === 'initial' || analysisType === 'final') && (
              <div className="flex flex-col gap-2">
                <label
                  className={`text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}
                >
                  Shipping Plan Status
                </label>

                <select
                  value={shippingPlanError}
                  onChange={(event) =>
                    setShippingPlanError(event.target.value as 'no' | 'yes')
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-100'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="no">No error in shipping plan creation</option>
                  <option value="yes">Shipping Plan Error</option>
                </select>
              </div>
            )}

            {analysisType === 'final' && (
              <div className="flex flex-col gap-2">
                <label
                  className={`text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}
                >
                  Suggest to 3PL
                </label>

                <select
                  value={suggest3PL}
                  onChange={(event) =>
                    setSuggest3PL(event.target.value as 'yes' | 'no')
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-100'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="no">Do not suggest items to 3PL</option>
                  <option value="yes">Suggest to 3PL</option>
                </select>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <label
                className={`text-sm font-medium ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}
              >
                Checklist
              </label>

              <div
                className={`flex flex-col gap-2 text-sm ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}
              >
                {(analysisType === 'initial' ||
                  analysisType === 'for-fixing') && (
                  <CheckboxRow
                    label="Done updating the tracker"
                    checked={doneTracker}
                    onChange={() => setDoneTracker((current) => !current)}
                  />
                )}

                {analysisType === 'final' && (
                  <>
                    <CheckboxRow
                      label="Done updating the tracker"
                      checked={doneTracker}
                      onChange={() => setDoneTracker((current) => !current)}
                    />

                    <CheckboxRow
                      label="Done adding to FBA ASIN Errors Encountered tracker"
                      checked={doneFbaErrorTracker}
                      onChange={() =>
                        setDoneFbaErrorTracker((current) => !current)
                      }
                    />

                    <CheckboxRow
                      label="Added to Thorogood - Amazon Deliverables Tracker & Form Submission"
                      checked={doneTrackerSubmission}
                      onChange={() =>
                        setDoneTrackerSubmission((current) => !current)
                      }
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {analysisType === 'pre-approval' && (
              <FileUploadArea
                theme={theme}
                label="Pre-Approval PO File"
                description="Upload the pre-approval PO file for review"
                accept=".csv,.xlsx,.xls"
                onUpload={(file) => handleFileUpload('preApproval', file)}
                filename={uploadedFiles.preApproval?.filename}
              />
            )}

            {(analysisType === 'initial' ||
              analysisType === 'final' ||
              analysisType === 'for-fixing') && (
              <>
                <FileUploadArea
                  theme={theme}
                  label="Listing Data PO File"
                  description="Upload the main listing data PO file"
                  accept=".csv,.xlsx,.xls"
                  required
                  onUpload={(file) => handleFileUpload('listingData', file)}
                  filename={uploadedFiles.listingData?.filename}
                />

                {analysisType === 'final' && (
                  <FileUploadArea
                    theme={theme}
                    label="Excluded Items File"
                    description="Upload the excluded items reference file if available"
                    accept=".csv,.xlsx,.xls"
                    onUpload={(file) => handleFileUpload('excluded', file)}
                    filename={uploadedFiles.excluded?.filename}
                  />
                )}
              </>
            )}
          </div>

          {error && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
                isDark
                  ? 'border-red-500/30 bg-red-600/10 text-red-400'
                  : 'border-red-300 bg-red-100 text-red-700'
              }`}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={generateMessage}
              disabled={!hasRequiredFiles() || isGenerating}
              className={`flex w-full flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-all ${
                hasRequiredFiles() && !isGenerating
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Message
                </>
              )}
            </button>

            <button
              type="button"
              onClick={clearAll}
              className={`w-full rounded-lg px-4 py-2.5 font-semibold transition-colors sm:w-auto ${
                isDark
                  ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div
          className={`min-w-0 rounded-2xl border p-4 shadow-lg sm:p-6 ${
            isDark
              ? 'border-slate-700/50 bg-slate-900/70'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2
              className={`text-lg font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Generated Message
            </h2>

            {generatedMessage && (
              <button
                type="button"
                onClick={copyToClipboard}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:w-auto ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>

          <div
            className={`min-h-[360px] rounded-lg border p-3 sm:min-h-[420px] sm:p-4 ${
              isDark
                ? 'border-slate-700 bg-slate-950/50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            {generatedMessage ? (
              <div
                className={`max-w-full overflow-hidden rounded-lg p-4 ${getHighlightColor()} ${getHighlightTextColor()}`}
              >
                <pre className="max-w-full whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                  {generatedMessage}
                </pre>
              </div>
            ) : (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-4 text-center sm:min-h-[400px]">
                <MessageSquare
                  className={`mb-3 h-12 w-12 ${
                    isDark ? 'text-slate-600' : 'text-gray-400'
                  }`}
                />
                <p
                  className={`max-w-sm text-sm ${
                    isDark ? 'text-slate-500' : 'text-gray-500'
                  }`}
                >
                  {!hasRequiredFiles()
                    ? 'Upload required files and click generate'
                    : 'Click "Generate Message" to create your Basecamp response'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer select-none items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 flex-shrink-0 rounded text-emerald-500 focus:ring-emerald-500"
      />
      <span className="break-words leading-5">{label}</span>
    </label>
  );
}

function FileUploadArea({
  theme,
  label,
  description,
  accept,
  required = false,
  onUpload,
  filename,
}: {
  theme: 'light' | 'dark';
  label: string;
  description: string;
  accept: string;
  required?: boolean;
  onUpload: (file: File) => void;
  filename?: string;
}) {
  const isDark = theme === 'dark';
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <label
        className={`text-sm font-medium ${
          isDark ? 'text-slate-300' : 'text-gray-700'
        }`}
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {filename ? (
        <div
          className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
            isDark
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <FileText
              className={`h-4 w-4 flex-shrink-0 ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            />
            <span
              className={`truncate text-sm ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}
              title={filename}
            >
              {filename}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onUpload(new File([], ''))}
            className={`self-start text-xs sm:self-auto ${
              isDark
                ? 'text-slate-400 hover:text-red-400'
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          className={`relative rounded-lg border-2 border-dashed p-4 text-center transition-colors sm:p-5 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : isDark
                ? 'border-slate-700 bg-slate-900/50'
                : 'border-gray-300 bg-gray-50'
          }`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);

            const file = event.dataTransfer.files[0];

            if (file) {
              onUpload(file);
            }
          }}
        >
          <Upload
            className={`mx-auto mb-2 h-8 w-8 ${
              isDark ? 'text-slate-500' : 'text-gray-400'
            }`}
          />

          <p
            className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-gray-600'
            }`}
          >
            Drag and drop or{' '}
            <label className="cursor-pointer text-emerald-500 hover:text-emerald-400">
              browse
              <input
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </p>

          <p
            className={`mx-auto mt-1 max-w-md text-xs ${
              isDark ? 'text-slate-500' : 'text-gray-500'
            }`}
          >
            {description}
          </p>
        </div>
      )}
    </div>
  );
}