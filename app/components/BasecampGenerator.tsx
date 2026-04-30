'use client';

export default function BasecampGenerator({
  theme,
}: {
  theme: 'light' | 'dark';
}) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl border p-6 ${
        isDark
          ? 'border-slate-700/60 bg-slate-900 text-slate-300'
          : 'border-gray-200 bg-white text-gray-700'
      }`}
    >
      <h3 className="text-lg font-semibold mb-2">
        Basecamp Response Generator
      </h3>

      <p className="text-sm opacity-80">
        This tool is ready. Page logic will be added step by step.
      </p>
    </div>
  );
}