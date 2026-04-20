'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export default function Home() {
  const [upcs, setUpcs] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleProcess = async () => {
    if (!upcs) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/process-upcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upcs }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      // Handle the Excel file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Consolidated_UPCs_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to process UPCs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">Shopkeep Gathering</h1>
          <p className="text-slate-400">Shopkeep Consolidated UPC List</p>
        </header>

        <section className="bg-[#1E293B] border border-slate-700 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">UPC Consolidator</h2>
          <p className="text-sm text-slate-400 mb-4">
            Paste UPCs one per line (each UPC on a new line)
          </p>
          
          <textarea 
            className="w-full h-40 bg-[#0F172A] text-slate-200 border border-slate-600 rounded-lg p-4 focus:outline-none focus:border-emerald-500 mb-4 font-mono"
            placeholder="810095858505&#10;810095858512&#10;810095858529&#10;810095858536"
            value={upcs}
            onChange={(e) => setUpcs(e.target.value)}
          />

          <div className="flex justify-end">
            <button 
              onClick={handleProcess}
              disabled={isLoading || !upcs}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
              {isLoading ? 'Processing...' : 'Process & Download Excel'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}