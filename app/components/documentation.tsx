'use client';

import { useState } from 'react';
import { BookOpen, FileText, Search, ChevronRight, ExternalLink, Code, Database, Shield, Zap, Users, Clock } from 'lucide-react';

interface DocumentationProps {
  theme?: 'light' | 'dark';
}

interface DocSection {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

export default function Documentation({ theme = 'dark' }: DocumentationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const isDark = theme === 'dark';

  const sections: DocSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <BookOpen className="w-5 h-5" />,
      content: `The Listing Operations Tool (TARA) is a comprehensive suite designed to streamline and optimize your Amazon listing management workflow. Our tools help you process SKU data efficiently and identify ASIN conflicts before they become problems.

Key Features:
• SKU Consolidated Tool - Batch process and validate SKU data
• Multiple Parent ASIN Checker - Detect styles with multiple parent ASINs
• Real-time validation and error detection
• Export results in CSV format for further analysis
• Dark/Light mode support for comfortable viewing

This tool is designed for Amazon sellers, listing managers, and e-commerce operations teams who need to maintain clean, conflict-free product listings.`
    },
    {
      id: 'sku-tool',
      title: 'SKU Consolidated Tool',
      icon: <Database className="w-5 h-5" />,
      content: `The SKU Consolidated Tool helps you process and validate large volumes of SKU data efficiently.

How to use:
1. Paste your SKU data in the input area (one per line)
2. Click "Process SKUs" to start validation
3. Review the results showing valid and invalid SKUs
4. Export the results for record-keeping

Features:
• Bulk SKU validation
• Duplicate detection
• Format validation
• Export to CSV
• Real-time processing status

Best Practices:
• Process SKUs in batches of 500 for optimal performance
• Review invalid SKUs and correct them before re-processing
• Use the export feature to track changes over time`
    },
    {
      id: 'asin-tool',
      title: 'Multiple Parent ASIN Checker',
      icon: <Code className="w-5 h-5" />,
      content: `The Multiple Parent ASIN Checker identifies styles that have multiple unique parent ASINs mapped to them, which can cause listing conflicts.

How to use:
1. Paste Style IDs in the left column (one per line)
2. Paste corresponding Parent ASINs in the right column (one per line)
3. Click "Run Check" to analyze the data
4. Review styles flagged with multiple unique ASINs

Understanding Results:
• A conflict occurs when the same Style ID appears with different Parent ASINs
• Duplicate ASINs for the same style are ignored (only unique ASINs count)
• Results show each problematic style and all its unique parent ASINs

Tips:
• Ensure each row correctly pairs a Style ID with its Parent ASIN
• Use the "Load Sample" button to see how the tool works
• Export results to CSV for further investigation in Excel`
    },
    {
      id: 'data-format',
      title: 'Data Format Guidelines',
      icon: <FileText className="w-5 h-5" />,
      content: `Proper data formatting ensures accurate results from our tools.

SKU Format Guidelines:
• SKUs should be alphanumeric
• Avoid special characters except hyphens and underscores
• Maximum length: 50 characters
• Each SKU should be unique within your catalog

ASIN Format Guidelines:
• ASINs are 10-character alphanumeric codes
• Format: BXXXXXXXXX (starts with B followed by 9 characters)
• All ASINs should be uppercase
• ASINs are Amazon-specific identifiers

Style ID Format:
• Can include letters, numbers, and special characters
• Case-sensitive - maintain consistent formatting
• Maximum length: 100 characters

Input Format:
• One entry per line in the textarea
• No empty lines between entries
• Matching rows between columns are paired by line number`
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: <Shield className="w-5 h-5" />,
      content: `Your data security is our top priority.

Data Processing:
• All data processing occurs locally in your browser
• No data is stored on our servers
• No API calls to external services for data processing
• Your information never leaves your computer

Privacy Features:
• No login or registration required
• No tracking cookies used
• No data collection or analytics
• Results are never shared or transmitted

Best Security Practices:
• Always verify you're using the official tool URL
• Don't share exported CSV files containing sensitive data
• Clear your browser cache after processing sensitive information
• Use the clear button to remove data from the interface`
    }
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Documentation
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Learn how to use TARA tools effectively
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDark 
                ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <div className={`w-64 flex-shrink-0 rounded-lg border overflow-y-auto ${
          isDark 
            ? 'bg-slate-900/50 border-slate-700/50' 
            : 'bg-white/50 border-gray-300/50'
        }`}>
          <div className="p-4">
            <h3 className={`text-xs font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Contents
            </h3>
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    activeSection === section.id
                      ? isDark
                        ? 'bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-500'
                        : 'bg-emerald-100 text-emerald-700 border-l-2 border-emerald-500'
                      : isDark
                        ? 'hover:bg-slate-800/50 text-slate-300'
                        : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {section.icon}
                  <span className="text-sm">{section.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 rounded-lg border overflow-auto ${
          isDark 
            ? 'bg-slate-900/50 border-slate-700/50' 
            : 'bg-white/50 border-gray-300/50'
        }`}>
          {filteredSections.length > 0 ? (
            <div className="p-6">
              {filteredSections.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className={activeSection === section.id ? 'block' : 'hidden'}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-600/20' : 'bg-emerald-100'}`}>
                      {section.icon}
                    </div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {section.title}
                    </h2>
                  </div>
                  <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
                    {section.content.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('•')) {
                        return (
                          <ul key={idx} className={`list-disc pl-6 mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            {paragraph.split('\n').map((item, itemIdx) => (
                              <li key={itemIdx} className="mb-1">
                                {item.replace('•', '').trim()}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      if (paragraph.startsWith('Q:')) {
                        return (
                          <div key={idx} className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-slate-800/30' : 'bg-gray-100'}`}>
                            <p className={`font-semibold mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              {paragraph.split('\n')[0]}
                            </p>
                            <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                              {paragraph.split('\n').slice(1).join('\n')}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className={`mb-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Search className={`w-12 h-12 mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
              <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>No results found</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                Try adjusting your search terms
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t text-center">
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
          Need additional help? Contact your system administrator for support.
        </p>
      </div>
    </div>
  );
}