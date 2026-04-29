'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen,
  Code,
  Database,
  FileText,
  Search,
  Shield,
} from 'lucide-react';

interface DocumentationProps {
  theme?: 'light' | 'dark';
}

interface DocSection {
  id: string;
  title: string;
  description: string;
  content: string;
  icon: React.ReactNode;
}

const sections: DocSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    description: 'Learn what TARA is and how it supports listing operations.',
    icon: <BookOpen className="h-5 w-5" />,
    content: `The Listing Operations Tool (TARA) is a comprehensive suite designed to streamline and optimize your Amazon listing management workflow. The tools help you process SKU data efficiently and identify ASIN conflicts before they become operational issues.

Key Features:
• SKU Consolidated Tool - Batch process and validate SKU data
• Multiple Parent ASIN Checker - Detect styles with multiple parent ASINs
• Real-time validation and error detection
• Export results for further analysis
• Dark and light mode support for comfortable viewing

This tool is designed for Amazon sellers, listing managers, and e-commerce operations teams who need to maintain clean, conflict-free product listings.`,
  },
  {
    id: 'sku-tool',
    title: 'SKU Consolidated Tool',
    description: 'Process and validate SKU data in batches.',
    icon: <Database className="h-5 w-5" />,
    content: `The SKU Consolidated Tool helps you process and validate large volumes of SKU data efficiently.

How to use:
1. Paste your SKU data in the input area, one SKU per line.
2. Click "Process" to start validation and matching.
3. Review the processing status and matched count.
4. Download the generated consolidated file.

Features:
• Bulk SKU validation
• Duplicate detection
• Batch processing status
• Brand detection
• Excel export

Best Practices:
• Remove unnecessary spaces before processing
• Review duplicate SKUs before submitting
• Process SKUs in manageable batches for best performance
• Keep downloaded files for audit and tracking purposes`,
  },
  {
    id: 'asin-tool',
    title: 'Multiple Parent ASIN Checker',
    description: 'Identify styles mapped to multiple unique parent ASINs.',
    icon: <Code className="h-5 w-5" />,
    content: `The Multiple Parent ASIN Checker identifies styles that have multiple unique parent ASINs mapped to them.

How to use:
1. Paste Style IDs in the left column, one per line.
2. Paste corresponding Parent ASINs in the right column, one per line.
3. Click "Run Check" to analyze the data.
4. Review styles flagged with multiple unique ASINs.

Understanding Results:
• A conflict occurs when the same Style ID appears with different Parent ASINs
• Duplicate ASINs for the same style are ignored
• Results show each problematic style and all unique parent ASINs

Tips:
• Make sure each row correctly pairs a Style ID with its Parent ASIN
• Use "Load Sample" to understand the expected format
• Export results to CSV for investigation in Excel`,
  },
  {
    id: 'data-format',
    title: 'Data Format Guidelines',
    description: 'Recommended formatting rules for SKUs, ASINs, and Style IDs.',
    icon: <FileText className="h-5 w-5" />,
    content: `Proper data formatting ensures accurate results from the tools.

SKU Format Guidelines:
• SKUs should be alphanumeric where possible
• Avoid unnecessary spaces
• Keep formatting consistent
• Each SKU should represent one catalog item

ASIN Format Guidelines:
• ASINs are usually 10-character alphanumeric codes
• Example format: BXXXXXXXXX
• Keep ASINs uppercase for consistency
• ASINs are Amazon-specific identifiers

Style ID Format:
• Style IDs can include letters, numbers, and separators
• Maintain consistent casing
• Avoid accidental extra spaces
• Use the same Style ID format across files

Input Format:
• One entry per line
• Matching rows between columns are paired by line number
• Rows with missing values may be ignored by some tools`,
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Understand how data is handled while using TARA.',
    icon: <Shield className="h-5 w-5" />,
    content: `Your data security is important.

Data Processing:
• ASIN conflict checking is processed in the browser
• SKU processing may communicate with your internal API endpoint
• Exported files are generated for user download
• Data should be cleared after processing sensitive information

Privacy Practices:
• Avoid uploading confidential data unless required
• Do not share exported files with unauthorized users
• Clear the interface after processing sensitive data
• Use only approved internal links and environments

Best Security Practices:
• Verify you are using the official tool URL
• Review files before sharing externally
• Delete unnecessary downloaded exports
• Contact your administrator if you notice unexpected behavior`,
  },
];

export default function Documentation({ theme = 'dark' }: DocumentationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const isDark = theme === 'dark';

  const filteredSections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return sections;

    return sections.filter((section) => {
      return (
        section.title.toLowerCase().includes(normalizedSearch) ||
        section.description.toLowerCase().includes(normalizedSearch) ||
        section.content.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [searchTerm]);

  const selectedSection = useMemo(() => {
    if (searchTerm.trim()) {
      return filteredSections[0] ?? null;
    }

    return sections.find((section) => section.id === activeSection) ?? sections[0];
  }, [activeSection, filteredSections, searchTerm]);

  const cardClass = isDark
    ? 'bg-slate-900/50 border-slate-700/50'
    : 'bg-white/70 border-gray-300/60';

  const mutedTextClass = isDark ? 'text-slate-400' : 'text-gray-600';
  const strongTextClass = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className={`mb-1 text-2xl font-bold ${strongTextClass}`}>
            Documentation
          </h1>
          <p className={`text-sm ${mutedTextClass}`}>
            Learn how to use TARA tools effectively.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search
            className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
              isDark ? 'text-slate-400' : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            placeholder="Search documentation..."
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

      {/* Main Content */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        {/* Sidebar Navigation */}
        <aside className={`overflow-hidden rounded-xl border ${cardClass}`}>
          <div className="border-b border-slate-700/30 p-4">
            <h3
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              Contents
            </h3>
          </div>

          <div className="max-h-[28rem] overflow-y-auto p-3">
            <div className="space-y-1">
              {sections.map((section) => {
                const active = !searchTerm.trim() && activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(section.id);
                      setSearchTerm('');
                    }}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${
                      active
                        ? isDark
                          ? 'border-l-2 border-emerald-500 bg-emerald-600/20 text-emerald-400'
                          : 'border-l-2 border-emerald-500 bg-emerald-100 text-emerald-700'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800/50'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mt-0.5 flex-shrink-0">{section.icon}</span>
                    <span>
                      <span className="block text-sm font-medium">
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

        {/* Content Area */}
        <main className={`min-h-[30rem] overflow-auto rounded-xl border ${cardClass}`}>
          {searchTerm.trim() && (
            <div
              className={`border-b px-6 py-3 text-sm ${
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
            <article className="p-6">
              <div className="mb-5 flex items-start gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    isDark ? 'bg-emerald-600/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {selectedSection.icon}
                </div>

                <div>
                  <h2 className={`text-xl font-bold ${strongTextClass}`}>
                    {selectedSection.title}
                  </h2>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    {selectedSection.description}
                  </p>
                </div>
              </div>

              <DocumentationContent
                content={selectedSection.content}
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
                          className={`rounded-lg border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/70 ${
                            isDark
                              ? 'border-slate-700/60 bg-slate-800/30 hover:bg-slate-800/60'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2 text-emerald-500">
                            {section.icon}
                            <span className="text-sm font-semibold">
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
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Search
                className={`mb-4 h-12 w-12 ${
                  isDark ? 'text-slate-500' : 'text-gray-400'
                }`}
              />
              <p className={`font-medium ${mutedTextClass}`}>No results found</p>
              <p
                className={`mt-1 text-sm ${
                  isDark ? 'text-slate-500' : 'text-gray-500'
                }`}
              >
                Try adjusting your search terms.
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
          Need additional help? Contact your system administrator for support.
        </p>
      </div>
    </div>
  );
}

function DocumentationContent({
  content,
  isDark,
}: {
  content: string;
  isDark: boolean;
}) {
  const blocks = content.split('\n\n');

  return (
    <div className="max-w-none">
      {blocks.map((block, index) => {
        const lines = block.split('\n');
        const heading = lines[0];
        const rest = lines.slice(1);

        const isHeadingBlock =
          heading.endsWith(':') && rest.length > 0;

        const bulletLines = lines.filter((line) => line.trim().startsWith('•'));
        const numberedLines = lines.filter((line) => /^\d+\./.test(line.trim()));

        if (isHeadingBlock && bulletLines.length > 0) {
          return (
            <section key={`${heading}-${index}`} className="mb-6">
              <h3
                className={`mb-3 text-sm font-semibold ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                {heading}
              </h3>
              <ul
                className={`list-disc space-y-2 pl-6 text-sm leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}
              >
                {bulletLines.map((line) => (
                  <li key={line}>{line.replace('•', '').trim()}</li>
                ))}
              </ul>
            </section>
          );
        }

        if (isHeadingBlock && numberedLines.length > 0) {
          return (
            <section key={`${heading}-${index}`} className="mb-6">
              <h3
                className={`mb-3 text-sm font-semibold ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                {heading}
              </h3>
              <ol
                className={`list-decimal space-y-2 pl-6 text-sm leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}
              >
                {numberedLines.map((line) => (
                  <li key={line}>{line.replace(/^\d+\.\s*/, '').trim()}</li>
                ))}
              </ol>
            </section>
          );
        }

        if (isHeadingBlock) {
          return (
            <section key={`${heading}-${index}`} className="mb-6">
              <h3
                className={`mb-3 text-sm font-semibold ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                {heading}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}
              >
                {rest.join(' ')}
              </p>
            </section>
          );
        }

        return (
          <p
            key={`${block.slice(0, 20)}-${index}`}
            className={`mb-5 text-sm leading-7 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}