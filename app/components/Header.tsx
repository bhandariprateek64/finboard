'use client';

import { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  onAddWidget?: () => void;
  onReset?: () => void;
}

export default function Header({ title, onAddWidget, onReset }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);

    setIsDarkMode(isDark);
    applyTheme(isDark);
  }, []);

  const applyTheme = (isDark: boolean) => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    applyTheme(newDarkMode);
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow border-b border-gray-200 dark:border-slate-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📊</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-yellow-400"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm4.293 1.707a1 1 0 011.414 0l1.414 1.414a1 1 0 11-1.414 1.414l-1.414-1.414a1 1 0 010-1.414zm2 4.586a1 1 0 111.414-1.414l1.414 1.414a1 1 0 11-1.414 1.414l-1.414-1.414zM16 11a1 1 0 100-2h-2a1 1 0 100 2h2zm2.586 3.707a1 1 0 11-1.414 1.414l-1.414-1.414a1 1 0 111.414-1.414l1.414 1.414zM10 16a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm-4.293-1.293a1 1 0 011.414 0l1.414 1.414a1 1 0 11-1.414 1.414l-1.414-1.414a1 1 0 010-1.414zM4 11a1 1 0 100-2H2a1 1 0 100 2h2zm-2.586-3.707a1 1 0 111.414-1.414l1.414 1.414a1 1 0 11-1.414 1.414L1.414 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* Add Widget Button */}
            {onAddWidget && (
              <button
                onClick={onAddWidget}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors shadow-md hover:shadow-lg"
              >
                + Add Widget
              </button>
            )}

            {/* Reset Button */}
            {onReset && (
              <button
                onClick={onReset}
                className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 font-medium transition-colors shadow-md hover:shadow-lg text-sm"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
