'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Mail,
  Scale,
  Shield,
} from 'lucide-react';

interface TermsProps {
  theme?: 'light' | 'dark';
}

interface TermsSection {
  id: string;
  title: string;
  summary: string;
  icon: React.ReactNode;
  items: string[];
}

const LAST_UPDATED = 'April 29, 2026';

const sections: TermsSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance',
    summary: 'Using TARA means you agree to these basic terms.',
    icon: <CheckCircle className="h-5 w-5" />,
    items: [
      'Use TARA only for approved listing operations work.',
      'Do not use the tools if you do not agree with these terms.',
      'Terms may be updated when needed.',
    ],
  },
  {
    id: 'use-of-tools',
    title: 'Use of Tools',
    summary: 'Use TARA responsibly and only for business purposes.',
    icon: <Scale className="h-5 w-5" />,
    items: [
      'Use the tools for SKU processing, ASIN checking, downloads, and Basecamp message generation.',
      'Do not upload harmful, unauthorized, or corrupted files.',
      'Do not try to bypass, disrupt, or misuse the tools.',
      'Do not share access with unauthorized users.',
    ],
  },
  {
    id: 'data',
    title: 'Data Handling',
    summary: 'Users are responsible for the data they upload and export.',
    icon: <Shield className="h-5 w-5" />,
    items: [
      'Review files before uploading or downloading.',
      'Clear sensitive input data after use when needed.',
      'Store exported files securely.',
      'Only process data you are allowed to use.',
    ],
  },
  {
    id: 'ownership',
    title: 'Ownership',
    summary: 'TARA and its content belong to the company or authorized owners.',
    icon: <FileText className="h-5 w-5" />,
    items: [
      'Do not copy, resell, or redistribute the tools.',
      'Do not remove ownership notices.',
      'Do not reuse the interface, workflows, or documentation without permission.',
    ],
  },
  {
    id: 'accuracy',
    title: 'Accuracy',
    summary: 'TARA helps with work, but users must still review results.',
    icon: <AlertCircle className="h-5 w-5" />,
    items: [
      'Tool outputs should be reviewed before business use.',
      'TARA does not guarantee that all results are perfect.',
      'Users are responsible for validating exports, messages, and reports.',
    ],
  },
  {
    id: 'support',
    title: 'Support',
    summary: 'Report issues through your approved internal support channel.',
    icon: <Mail className="h-5 w-5" />,
    items: [
      'Contact your administrator for access or technical issues.',
      'Include screenshots and error messages when reporting problems.',
      'Do not include confidential data unless approved.',
    ],
  },
];

export default function Terms({ theme = 'dark' }: TermsProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [activeSection, setActiveSection] = useState(sections[0].id);

  const isDark = theme === 'dark';

  const activeSectionData = useMemo(() => {
    return sections.find((section) => section.id === activeSection) ?? sections[0];
  }, [activeSection]);

  const cardClass = isDark
    ? 'border-slate-700/50 bg-slate-900/60'
    : 'border-gray-200 bg-white';

  const sectionClass = isDark
    ? 'border-slate-700/50 bg-slate-800/30'
    : 'border-gray-200 bg-gray-50';

  const strongTextClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextClass = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-xl font-bold sm:text-2xl ${strongTextClass}`}>
          Terms & Conditions
        </h1>

        <p className={`mt-1 text-sm ${mutedTextClass}`}>
          Last updated: {LAST_UPDATED}
        </p>

        <div
          className={`mt-4 rounded-xl border p-4 ${
            isDark
              ? 'border-emerald-500/20 bg-emerald-600/10 text-emerald-400'
              : 'border-emerald-300 bg-emerald-100 text-emerald-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

            <div className="min-w-0">
              <p className="text-sm font-semibold">Simple usage reminder</p>
              <p className="mt-1 text-xs leading-5 opacity-90">
                Use TARA only for approved work. Review outputs before using
                generated data, files, or messages.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr] lg:gap-6">
        {/* Section Navigation */}
        <aside className={`min-w-0 overflow-hidden rounded-xl border ${cardClass}`}>
          <div
            className={`border-b p-4 ${
              isDark ? 'border-slate-700/50' : 'border-gray-200'
            }`}
          >
            <h2
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              Sections
            </h2>
          </div>

          <nav className="max-h-[20rem] overflow-y-auto p-3 lg:max-h-[34rem]">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((section) => {
                const active = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex min-w-0 items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${
                      active
                        ? isDark
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : isDark
                          ? 'border-transparent text-slate-300 hover:bg-slate-800/60'
                          : 'border-transparent text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mt-0.5 flex-shrink-0">{section.icon}</span>

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {section.title}
                      </span>
                      <span
                        className={`mt-0.5 line-clamp-2 block text-xs ${
                          isDark ? 'text-slate-500' : 'text-gray-500'
                        }`}
                      >
                        {section.summary}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main
          className={`min-h-[28rem] min-w-0 overflow-hidden rounded-xl border ${cardClass}`}
        >
          <article className="p-4 sm:p-6">
            <div className={`rounded-xl border p-4 sm:p-6 ${sectionClass}`}>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                    isDark
                      ? 'bg-emerald-600/20 text-emerald-400'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {activeSectionData.icon}
                </div>

                <div className="min-w-0">
                  <h2
                    className={`break-words text-lg font-bold sm:text-xl ${strongTextClass}`}
                  >
                    {activeSectionData.title}
                  </h2>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    {activeSectionData.summary}
                  </p>
                </div>
              </div>

              <ul
                className={`space-y-3 text-sm leading-6 ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}
              >
                {activeSectionData.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Acknowledgment */}
            <div
              className={`mt-6 rounded-xl border-2 p-4 sm:p-6 ${
                acknowledged
                  ? isDark
                    ? 'border-emerald-500/30 bg-emerald-600/10'
                    : 'border-emerald-300 bg-emerald-100'
                  : isDark
                    ? 'border-yellow-500/30 bg-yellow-600/10'
                    : 'border-yellow-300 bg-yellow-100'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                    acknowledged
                      ? isDark
                        ? 'bg-emerald-600/20'
                        : 'bg-emerald-200'
                      : isDark
                        ? 'bg-yellow-600/20'
                        : 'bg-yellow-200'
                  }`}
                >
                  <Shield
                    className={`h-5 w-5 ${
                      acknowledged
                        ? isDark
                          ? 'text-emerald-400'
                          : 'text-emerald-700'
                        : isDark
                          ? 'text-yellow-400'
                          : 'text-yellow-700'
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-semibold ${
                      acknowledged
                        ? isDark
                          ? 'text-emerald-400'
                          : 'text-emerald-800'
                        : isDark
                          ? 'text-yellow-400'
                          : 'text-yellow-800'
                    }`}
                  >
                    Acknowledgment
                  </h3>

                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isDark ? 'text-slate-300' : 'text-gray-700'
                    }`}
                  >
                    Please confirm that you understand these simple usage terms
                    for this session.
                  </p>

                  <label className="mt-4 flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(event) => setAcknowledged(event.target.checked)}
                      className="mt-0.5 flex-shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />

                    <span
                      className={`text-sm leading-5 ${
                        isDark ? 'text-slate-300' : 'text-gray-700'
                      }`}
                    >
                      I acknowledge and agree to use TARA responsibly.
                    </span>
                  </label>

                  {acknowledged && (
                    <div
                      className={`mt-4 rounded-lg border px-3 py-2 text-xs ${
                        isDark
                          ? 'border-emerald-500/20 bg-emerald-600/10 text-emerald-400'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      Acknowledgment recorded for this session.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        </main>
      </div>

      {/* Footer */}
      <div
        className={`mt-6 border-t pt-4 ${
          isDark ? 'border-slate-700/50' : 'border-gray-200'
        }`}
      >
        <p
          className={`text-center text-xs leading-5 ${
            isDark ? 'text-slate-500' : 'text-gray-500'
          }`}
        >
          © {new Date().getFullYear()} TARA - Listing Operations Tool.
          <br />
          For questions, contact your administrator.
        </p>
      </div>
    </div>
  );
}