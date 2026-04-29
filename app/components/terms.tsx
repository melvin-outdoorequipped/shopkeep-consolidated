'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
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
  content: string;
}

const LAST_UPDATED = 'April 29, 2026';

const sections: TermsSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    summary: 'Your agreement to use TARA under these terms.',
    icon: <CheckCircle className="h-5 w-5" />,
    content: `By accessing and using TARA, also known as the Listing Operations Tool, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use the tools.

We reserve the right to modify these terms from time to time. Your continued use of the tool after changes are posted or communicated indicates your acceptance of the updated terms.`,
  },
  {
    id: 'use-of-tools',
    title: 'Use of Tools',
    summary: 'Permitted and prohibited use of the platform.',
    icon: <Scale className="h-5 w-5" />,
    content: `You agree to use TARA only for legitimate business purposes related to listing operations, catalog management, and marketplace data review.

You shall not:
• Use the tools for illegal, abusive, or unauthorized purposes
• Attempt to reverse engineer, decompile, or bypass tool restrictions
• Use automated scripts or bots without authorization
• Interfere with or disrupt the operation of the tools
• Upload malicious code, harmful files, or intentionally corrupted data
• Share access credentials with unauthorized users

The tools are provided for approved internal business use and may not be resold, redistributed, or made available to unauthorized third parties.`,
  },
  {
    id: 'data-processing',
    title: 'Data Processing & Privacy',
    summary: 'How data may be handled while using TARA.',
    icon: <Shield className="h-5 w-5" />,
    content: `Important information about your data:

• Some tools may process data locally in your browser
• Tools that require server-side processing may send data to approved internal API endpoints
• Exported files are generated for user download
• Users are responsible for reviewing, securing, and deleting exported files when no longer needed
• Sensitive or confidential data should only be processed when authorized

You are responsible for:
• The accuracy of the data you input
• Compliance with applicable data protection and company policies
• Securing exported files that may contain sensitive information
• Clearing input data after each session when appropriate

We recommend using the Clear button after processing sensitive information and following your company’s data handling policies.`,
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    summary: 'Ownership and restrictions related to the tool.',
    icon: <FileText className="h-5 w-5" />,
    content: `All content, features, and functionality of TARA, including the user interface, design, source code, workflows, and documentation, are owned by the company or its authorized owners and may be protected by copyright, trademark, and other intellectual property laws.

You may not:
• Copy, modify, or create derivative works of the tools
• Remove copyright or proprietary notices
• Use company names, marks, or logos without permission
• Frame, mirror, or redistribute any part of the tools

The tools are licensed for approved use and are not sold to users.`,
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    summary: 'Limitations on warranties and tool accuracy.',
    icon: <AlertCircle className="h-5 w-5" />,
    content: `The tools are provided “as is” and “as available” without warranties of any kind, whether express or implied.

We do not warrant that:
• The tools will meet every specific requirement
• The tools will be uninterrupted, timely, secure, or error-free
• Results will always be accurate, complete, or reliable
• Any issues or defects will be corrected immediately

You are responsible for reviewing outputs before relying on them for business decisions. TARA assists with data analysis but does not guarantee listing performance, marketplace compliance, or commercial results.`,
  },
  {
    id: 'limitations',
    title: 'Limitations of Liability',
    summary: 'Limits on responsibility for damages or losses.',
    icon: <Clock className="h-5 w-5" />,
    content: `To the maximum extent permitted by applicable law, the company shall not be liable for damages arising from the use or inability to use TARA, including loss of profits, business interruption, data loss, or other commercial damages.

Where liability cannot be excluded, the company’s total liability shall be limited to the maximum extent permitted by law.

Some jurisdictions do not allow certain warranty exclusions or liability limitations, so some limitations may not apply to every user.`,
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    summary: 'Legal jurisdiction and dispute handling.',
    icon: <Scale className="h-5 w-5" />,
    content: `These Terms shall be governed by the laws of the applicable jurisdiction in which the company operates, without regard to conflict of law provisions.

Any dispute, claim, or proceeding related to these Terms or the use of the tools shall be handled according to applicable company policy, contract terms, or legal requirements.

Users should contact the appropriate internal department for questions related to jurisdiction, compliance, or legal interpretation.`,
  },
  {
    id: 'contact',
    title: 'Contact Information',
    summary: 'Where to get support or ask questions.',
    icon: <Mail className="h-5 w-5" />,
    content: `If you have questions about these Terms, contact your system administrator, manager, or internal support channel.

For technical issues or feature requests:
• Submit a ticket through your company’s IT support system
• Include screenshots, sample file structure, and error messages when possible
• Avoid sharing confidential data unless required and approved

Support response times may vary depending on internal procedures and issue priority.`,
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
    ? 'bg-slate-900/50 border-slate-700/50'
    : 'bg-white/70 border-gray-300/60';

  const sectionClass = isDark
    ? 'bg-slate-800/30 border-slate-700/50'
    : 'bg-gray-50/80 border-gray-200';

  const strongTextClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextClass = isDark ? 'text-slate-400' : 'text-gray-600';

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className={`mb-1 text-2xl font-bold ${strongTextClass}`}>
            Terms & Conditions
          </h1>
          <p className={`text-sm ${mutedTextClass}`}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Notice Banner */}
        <div
          className={`mt-4 rounded-xl border p-4 ${
            isDark
              ? 'border-emerald-500/20 bg-emerald-600/10 text-emerald-400'
              : 'border-emerald-300 bg-emerald-100 text-emerald-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="mb-1 text-sm font-medium">Please read carefully</p>
              <p className="text-xs opacity-90">
                By using TARA tools, you acknowledge that you have read,
                understood, and agree to be bound by these terms. If you do not
                agree, discontinue use of the tools.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        {/* Sidebar */}
        <aside className={`overflow-hidden rounded-xl border ${cardClass}`}>
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

          <nav className="max-h-[32rem] overflow-y-auto p-3">
            <div className="space-y-1">
              {sections.map((section) => {
                const active = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
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
        <main className={`min-h-[34rem] overflow-auto rounded-xl border ${cardClass}`}>
          <article className="p-6">
            <div className={`rounded-xl border p-6 ${sectionClass}`}>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    isDark
                      ? 'bg-emerald-600/20 text-emerald-400'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {activeSectionData.icon}
                </div>

                <div>
                  <h2 className={`text-lg font-bold ${strongTextClass}`}>
                    {activeSectionData.title}
                  </h2>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    {activeSectionData.summary}
                  </p>
                </div>
              </div>

              <TermsContent content={activeSectionData.content} isDark={isDark} />
            </div>

            {/* Acknowledgment */}
            <div
              className={`mt-6 rounded-xl border-2 p-6 ${
                acknowledged
                  ? isDark
                    ? 'border-emerald-500/30 bg-emerald-600/10'
                    : 'border-emerald-300 bg-emerald-100'
                  : isDark
                    ? 'border-yellow-500/30 bg-yellow-600/10'
                    : 'border-yellow-300 bg-yellow-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 rounded-lg p-2 ${
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

                <div className="flex-1">
                  <h3
                    className={`mb-2 font-semibold ${
                      acknowledged
                        ? isDark
                          ? 'text-emerald-400'
                          : 'text-emerald-800'
                        : isDark
                          ? 'text-yellow-400'
                          : 'text-yellow-800'
                    }`}
                  >
                    Acknowledgment of Terms
                  </h3>

                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    By continuing to use TARA tools, you acknowledge that you
                    have read these Terms & Conditions, understand them, and
                    agree to comply with applicable policies and regulations.
                  </p>

                  <div className="mt-4 flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="acknowledge"
                      checked={acknowledged}
                      onChange={(event) => setAcknowledged(event.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label
                      htmlFor="acknowledge"
                      className={`text-sm ${
                        isDark ? 'text-slate-300' : 'text-gray-700'
                      }`}
                    >
                      I acknowledge and agree to the Terms & Conditions.
                    </label>
                  </div>

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
        <p className={`text-center text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
          © {new Date().getFullYear()} TARA - Listing Operations Tool. All rights reserved.
          <br />
          These terms summarize the conditions for using TARA tools.
        </p>
      </div>
    </div>
  );
}

function TermsContent({
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

        const isHeadingBlock = heading.endsWith(':') && rest.length > 0;
        const bulletLines = rest.filter((line) => line.trim().startsWith('•'));

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
                className={`text-sm leading-7 ${
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