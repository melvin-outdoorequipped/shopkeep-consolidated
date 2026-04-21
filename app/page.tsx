'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export default function Home() {
  const [skus, setSkus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleProcess = async () => {
    if (!skus) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/process-skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skus }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      // Handle the Excel file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'Consolidated_SKUs.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to process SKUs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">Shopkeep Gathering</h1>
            <p className="text-slate-400">Shopkeep Consolidated SKU List</p>
          </div>
          <img 
            src="https://img.sanishtech.com/u/3d37f0af708035d0b169497c7f2557f0.png" 
            alt="Shopkeep Logo" 
            width="183" 
            height="249" 
            loading="lazy"
            className="max-w-[150px] h-auto"
          />
        </header>

        <section className="bg-[#1E293B] border border-slate-700 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Enter SKUs to gather shopkeep data</h2>
          <p className="text-sm text-slate-400 mb-4">
            Paste SKUs one per line (each SKU on a new line)
          </p>
          
          <textarea 
            className="w-full h-40 bg-[#0F172A] text-slate-200 border border-slate-600 rounded-lg p-4 focus:outline-none focus:border-emerald-500 mb-4 font-mono"
            placeholder="SK001&#10;SK002&#10;SK003&#10;SK004"
            value={skus}
            onChange={(e) => setSkus(e.target.value)}
          />

          <div className="flex justify-end">
            <button 
              onClick={handleProcess}
              disabled={isLoading || !skus}
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