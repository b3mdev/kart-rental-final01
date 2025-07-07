import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-300 transition-transform duration-200 ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      <span className="absolute left-1 text-xs">
        {theme === 'light' ? '☀️' : '🌙'}
      </span>
    </button>
  );
}
