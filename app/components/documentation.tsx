'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen,
  Database,
  FileText,
  MessageSquare,
  Search,
  Shield,
  Building2, // Added for Get Brand icon
} from 'lucide-react';

interface DocumentationProps {
  theme?: 'light' | 'dark';
}

interface DocSection {
  id: string;
  title: string;
  description: string;
  content: string[];
  icon: React.ReactNode;
}

const sections: DocSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    description: 'Quick guide for using TARA tools.',
    icon: <BookOpen className="h-5 w-5" />,
    content: [
      'TARA is a listing operations tool suite.',
      'It helps process SKUs, check ASIN conflicts, generate Basecamp messages, and retrieve brand information.',
      'Use the sidebar to open each tool.',
      'Dashboard shows tool usage and recent activity counts.',
    ],
  },
  {
    id: 'shopkeep',
    title: 'Shopkeep Consolidated Tool',
    description: 'Generate consolidated SKU files.',
    icon: <Database className="h-5 w-5" />,
    content: [
      'Paste SKUs one per line.',
      'Click Process to generate the consolidated export.',
      'The generated file is downloaded automatically.',
      'Completed files can be viewed in Downloads if storage is enabled.',
    ],
  },
  {
    id: 'asin',
    title: 'Multiple Parent ASIN',
    description: 'Check if one style has multiple parent ASINs.',
    icon: <Search className="h-5 w-5" />,
    content: [
      'Paste Style IDs in the left input.',
      'Paste matching Parent ASINs in the right input.',
      'Each line should match by row position.',
      'Click Run Check to see conflicts.',
      'Export or copy the results if conflicts are found.',
    ],
  },
  {
    id: 'basecamp',
    title: 'Basecamp Response Generator',
    description: 'Generate formatted Basecamp messages.',
    icon: <MessageSquare className="h-5 w-5" />,
    content: [
      'Choose the message type.',
      'Enter the PO number if available.',
      'Upload the required file.',
      'Click Generate Message.',
      'Copy the generated message and paste it into Basecamp.',
    ],
  },
  {
    id: 'brand',
    title: 'Get Brand',
    description: 'Retrieve brand names from SKU lists.',
    icon: <Building2 className="h-5 w-5" />,
    content: [
      'Upload a CSV or text file containing SKUs (one per line or comma-separated).',
      'Click "Get Brands" to process the SKUs.',
      'The tool will match each SKU to its corresponding brand name from the catalog database.',
      'Results can be downloaded as CSV with SKU and Brand Name columns.',
      'Supports bulk processing of up to 10,000 SKUs per batch.',
      'Coming soon: Integration with Amazon Brand Registry for real-time verification.',
    ],
  },
  {
    id: 'downloads',
    title: 'Downloads',
    description: 'Access generated files.',
    icon: <FileText className="h-5 w-5" />,
    content: [
      'Downloads shows generated export files from all tools including Shopkeep exports, ASIN conflict reports, Basecamp messages, and Brand lookup results.',
      'Use the download button to save the file again.',
      'Use delete only if the file is no longer needed.',
    ],
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Basic data handling reminders.',
    icon: <Shield className="h-5 w-5" />,
    content: [
      'Use only approved internal data.',
      'Do not share generated files with unauthorized users.',
      'Clear inputs when finished with sensitive data.',
      'Brand information is retrieved from trusted internal catalog sources.',
      'Report unexpected errors to the administrator.',
    ],
  },
];

export default function Documentation({ theme = 'dark' }: DocumentationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const isDark = theme === 'dark';

  const filteredSections = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return sections;

    return sections.filter((section) => {
      const searchableText = [
        section.title,
        section.description,
        ...section.content,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [searchTerm]);

  const selectedSection = useMemo(() => {
    if (searchTerm.trim()) {
      return filteredSections[0] ?? null;
    }

    return sections.find((section) => section.id === activeSection) ?? sections[0];
  }, [activeSection, filteredSections, searchTerm]);

  const cardClass = isDark
    ? 'border-slate-700/50 bg-slate-900/60'
    : 'border-gray-200 bg-white';

  const panelClass = isDark
    ? 'border-slate-700/50 bg-slate-900/70'
    : 'border-gray-200 bg-white';

  const pageText = isDark ? 'text-white' : 'text-gray-900';
  const mutedText = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-xl font-bold sm:text-2xl ${pageText}`}>
          Documentation
        </h1>
        <p className={`mt-1 text-sm ${mutedText}`}>
          Simple guide for using the TARA tools.
        </p>

        {/* Search */}
        <div className="relative mt-4">
          <Search
            className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
              isDark ? 'text-slate-400' : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            placeholder="Search guide..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={`w-full rounded-lg border py-2 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${
              isDark
                ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr] lg:gap-6">
        {/* Navigation */}
        <aside className={`min-w-0 overflow-hidden rounded-xl border ${cardClass}`}>
          <div
            className={`border-b p-4 ${
              isDark ? 'border-slate-700/50' : 'border-gray-200'
            }`}
          >
            <h3
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              Contents
            </h3>
          </div>

          <div className="max-h-[18rem] overflow-y-auto p-3 lg:max-h-[32rem]">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((section) => {
                const active =
                  !searchTerm.trim() && activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(section.id);
                      setSearchTerm('');
                    }}
                    className={`flex w-full min-w-0 items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${
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
                      <span className="block truncate text-sm font-medium">
                        {section.title}
                      </span>
                      <span
                        className={`mt-0.5 line-clamp-2 block text-xs ${
                          isDark ? 'text-slate-500' : 'text-gray-500'
                        }`}
                      >
                        {section.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main
          className={`min-h-[24rem] min-w-0 overflow-hidden rounded-xl border ${panelClass}`}
        >
          {searchTerm.trim() && (
            <div
              className={`border-b px-4 py-3 text-sm sm:px-6 ${
                isDark
                  ? 'border-slate-700/50 bg-slate-800/30 text-slate-300'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            >
              {filteredSections.length > 0 ? (
                <>
                  Showing {filteredSections.length} result
                  {filteredSections.length !== 1 ? 's' : ''} for{' '}
                  <span className="font-semibold text-emerald-500">
                    “{searchTerm}”
                  </span>
                </>
              ) : (
                <>
                  No results found for{' '}
                  <span className="font-semibold text-emerald-500">
                    “{searchTerm}”
                  </span>
                </>
              )}
            </div>
          )}

          {selectedSection ? (
            <article className="p-4 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                    isDark
                      ? 'bg-emerald-600/20 text-emerald-400'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {selectedSection.icon}
                </div>

                <div className="min-w-0">
                  <h2 className={`break-words text-lg font-bold sm:text-xl ${pageText}`}>
                    {selectedSection.title}
                  </h2>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    {selectedSection.description}
                  </p>
                </div>
              </div>

              <SimpleContent
                items={selectedSection.content}
                isDark={isDark}
              />

              {searchTerm.trim() && filteredSections.length > 1 && (
                <div className="mt-8">
                  <h3
                    className={`mb-3 text-sm font-semibold ${
                      isDark ? 'text-slate-300' : 'text-gray-700'
                    }`}
                  >
                    Other matching sections
                  </h3>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {filteredSections
                      .filter((section) => section.id !== selectedSection.id)
                      .map((section) => (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => {
                            setActiveSection(section.id);
                            setSearchTerm('');
                          }}
                          className={`min-w-0 rounded-lg border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${
                            isDark
                              ? 'border-slate-700/60 bg-slate-800/30 hover:bg-slate-800/60'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="mb-2 flex min-w-0 items-center gap-2 text-emerald-500">
                            <span className="flex-shrink-0">{section.icon}</span>
                            <span className="truncate text-sm font-semibold">
                              {section.title}
                            </span>
                          </div>
                          <p
                            className={`line-clamp-2 text-xs ${
                              isDark ? 'text-slate-400' : 'text-gray-600'
                            }`}
                          >
                            {section.description}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </article>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center px-4 text-center">
              <Search
                className={`mb-4 h-12 w-12 ${
                  isDark ? 'text-slate-500' : 'text-gray-400'
                }`}
              />
              <p className={`font-medium ${mutedText}`}>No results found</p>
              <p
                className={`mt-1 max-w-sm text-sm ${
                  isDark ? 'text-slate-500' : 'text-gray-500'
                }`}
              >
                Try a simpler search term.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <div
        className={`mt-6 border-t pt-4 text-center ${
          isDark ? 'border-slate-700/50' : 'border-gray-200'
        }`}
      >
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
          For additional help, contact your administrator.
        </p>
      </div>
    </div>
  );
}

function SimpleContent({
  items,
  isDark,
}: {
  items: string[];
  isDark: boolean;
}) {
  return (
    <ul
      className={`space-y-3 text-sm leading-6 ${
        isDark ? 'text-slate-300' : 'text-gray-700'
      }`}
    >
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}