'use client';

import { Manrope } from 'next/font/google';
import SettingsIcon from '../components/SettingsIcon';
import DarkModeToggle from '../components/DarkModeToggle';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';  // Make sure this import exists

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <html lang="en" suppressHydrationWarning className={manrope.className}>
      <head>
        <script 
          src="https://accounts.google.com/gsi/client" 
          async 
          defer
          importance="high"
        />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 antialiased`}>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
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
        <div className="relative min-h-screen">
          <nav className="fixed top-0 right-0 p-4 flex items-center gap-4 z-50">
            <button
              onClick={() => router.push('/settings')}
              className={`p-2 rounded-lg transition-all ${
                pathname === '/settings'
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <SettingsIcon />
            </button>
            <DarkModeToggle />
          </nav>
          <main className="container mx-auto px-4 py-20 max-w-4xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
