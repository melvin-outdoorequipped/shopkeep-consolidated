'use client';

import { useState } from 'react';
import { Shield, FileText, Scale, Clock, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface TermsProps {
  theme?: 'light' | 'dark';
}

export default function Terms({ theme = 'dark' }: TermsProps) {
  const [showFullTerms, setShowFullTerms] = useState(false);
  const isDark = theme === 'dark';

  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: <CheckCircle className="w-5 h-5" />,
      content: `By accessing and using TARA (Listing Operations Tool), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our tools.

We reserve the right to modify these terms at any time. Your continued use of the tool after any changes indicates your acceptance of the modified terms.`
    },
    {
      id: 'use-of-tools',
      title: 'Use of Tools',
      icon: <Scale className="w-5 h-5" />,
      content: `You agree to use TARA tools only for legitimate business purposes related to Amazon listing management. You shall not:

• Use the tools for any illegal purposes
• Attempt to reverse engineer or decompile the tools
• Use automated scripts or bots to access the tools
• Interfere with or disrupt the operation of the tools
• Upload malicious code or harmful data
• Share access credentials with unauthorized users

The tools are provided for internal business use only and may not be resold or redistributed.`
    },
    {
      id: 'data-processing',
      title: 'Data Processing & Privacy',
      icon: <Shield className="w-5 h-5" />,
      content: `Important Information About Your Data:

• All data processing occurs locally in your browser
• We do not store, transmit, or have access to your data
• No data is collected for analytics or tracking
• Your information never leaves your computer
• Results are generated locally and can be exported at your discretion

You are responsible for:
• The accuracy of the data you input
• Compliance with data protection laws (GDPR, CCPA, etc.)
• Securing any exported files containing sensitive information
• Properly deleting sensitive data after use

We recommend clearing your browser cache and using the "Clear" button after each session.`
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      icon: <FileText className="w-5 h-5" />,
      content: `All content, features, and functionality of TARA tools, including but not limited to the user interface, design, source code, and documentation, are owned by the company and are protected by copyright, trademark, and other intellectual property laws.

You may not:
• Copy, modify, or create derivative works of the tools
• Remove any copyright or other proprietary notices
• Use the company's name or logos without permission
• Frame or mirror any part of the tools

The tools are licensed, not sold, to you for use under these Terms.`
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers',
      icon: <AlertCircle className="w-5 h-5" />,
      content: `THE TOOLS ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.

We do not warrant that:
• The tools will meet your specific requirements
• The tools will be uninterrupted, timely, secure, or error-free
• Results obtained will be accurate or reliable
• Any errors in the tools will be corrected

You assume all responsibility and risk for your use of the tools. We are not responsible for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the tools.

The tools assist in data analysis but do not guarantee listing performance or success on Amazon or other marketplaces.`
    },
    {
      id: 'limitations',
      title: 'Limitations of Liability',
      icon: <Clock className="w-5 h-5" />,
      content: `To the maximum extent permitted by law, in no event shall the company be liable for any damages whatsoever (including, without limitation, damages for loss of profits, business interruption, loss of information) arising out of the use or inability to use the tools, even if we have been advised of the possibility of such damages.

Our total liability to you for all claims arising from or related to these terms or your use of the tools shall not exceed the amount paid by you, if any, for accessing the tools (which is currently free of charge).

Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for incidental or consequential damages, so some of these limitations may not apply to you.`
    },
    {
      id: 'governing-law',
      title: 'Governing Law',
      icon: <Mail className="w-5 h-5" />,
      content: `These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the company operates, without regard to its conflict of law provisions.

Any legal suit, action, or proceeding arising out of, or related to, these Terms or the tools shall be instituted exclusively in the courts of the applicable jurisdiction. You waive any and all objections to the exercise of jurisdiction over you by such courts and to venue in such courts.

You agree that any claim or cause of action arising out of or related to use of the tools or these Terms must be filed within one (1) year after such claim or cause of action arose.`
    },
    {
      id: 'contact',
      title: 'Contact Information',
      icon: <Mail className="w-5 h-5" />,
      content: `If you have any questions about these Terms, please contact us through your system administrator or internal support channels.

For technical issues or feature requests, please submit a ticket through your company's IT support system.

Business Hours Support:
• Monday - Friday: 9:00 AM - 6:00 PM (EST)
• Response time: Within 24-48 hours

Emergency Issues:
• Critical system issues should be reported immediately to your IT department
• For urgent matters, use internal communication channels

We strive to respond to all inquiries within 2 business days.`
    }
  ];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Terms & Conditions
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Last updated: January 1, 2026
            </p>
          </div>
        </div>

        {/* Notice Banner */}
        <div className={`mt-4 p-4 rounded-lg border ${
          isDark 
            ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-emerald-100 border-emerald-300 text-emerald-800'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Please Read Carefully</p>
              <p className="text-xs opacity-90">
                By using TARA tools, you acknowledge that you have read, understood, and agree to be bound by these terms.
                If you do not agree with any part of these terms, please discontinue use immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 rounded-lg border overflow-auto ${
        isDark 
          ? 'bg-slate-900/50 border-slate-700/50' 
          : 'bg-white/50 border-gray-300/50'
      }`}>
        <div className="p-6 space-y-6">
          {sections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className={`p-6 rounded-lg border ${
                isDark 
                  ? 'bg-slate-800/30 border-slate-700/50' 
                  : 'bg-gray-50/50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-emerald-600/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {section.icon}
                </div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {section.title}
                </h2>
              </div>
              <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
                {section.content.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.includes('•')) {
                    return (
                      <ul key={idx} className={`list-disc pl-6 mb-4 space-y-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {paragraph.split('•').filter(item => item.trim()).map((item, itemIdx) => (
                          <li key={itemIdx} className="text-sm">
                            {item.trim()}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={idx} className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Acknowledgment Section */}
          <div className={`p-6 rounded-lg border-2 ${
            isDark 
              ? 'bg-yellow-600/10 border-yellow-500/30' 
              : 'bg-yellow-100 border-yellow-300'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                isDark ? 'bg-yellow-600/20' : 'bg-yellow-200'
              }`}>
                <Shield className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`} />
              </div>
              <div>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  Acknowledgment of Terms
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  By continuing to use TARA tools, you acknowledge that you have read these Terms & Conditions,
                  understand them, and agree to be bound by them. You also agree to comply with all applicable
                  laws and regulations regarding your use of the tools.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="acknowledge"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    onChange={(e) => setShowFullTerms(e.target.checked)}
                  />
                  <label htmlFor="acknowledge" className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    I acknowledge and agree to the Terms & Conditions
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t">
        <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
          © {new Date().getFullYear()} TARA - Listing Operations Tool. All rights reserved.
          <br />
          These terms constitute the entire agreement between you and the company regarding the use of our tools.
        </p>
      </div>
    </div>
  );
}