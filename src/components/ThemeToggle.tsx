'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-xs font-semibold"
      aria-label="테마 전환"
    >
      <span>{dark ? '☀️' : '🌙'}</span>
      <span>{dark ? 'Light' : 'Night'}</span>
      {/* 슬라이더 트랙 */}
      <span className="relative inline-flex w-8 h-4 rounded-full transition-colors bg-slate-200 dark:bg-indigo-500">
        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </button>
  );
}
