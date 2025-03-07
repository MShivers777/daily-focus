'use client';

import { Manrope } from 'next/font/google';
import SettingsIcon from '../components/SettingsIcon';
import DarkModeToggle from '../components/DarkModeToggle';
import { usePathname, useRouter } from 'next/navigation';

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script 
          src="https://accounts.google.com/gsi/client" 
          async 
          defer
          importance="high"
        />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem('darkMode') === 'true' ||
                  (!('darkMode' in localStorage) &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (_) {}
          `
        }} />
        <div className="fixed top-4 right-16 z-50">
          <button
            onClick={() => router.push('/settings')}
            className={`p-2 rounded-lg transition-all ${
              pathname === '/settings'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <SettingsIcon />
          </button>
        </div>
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>
        <main className="container mx-auto py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
