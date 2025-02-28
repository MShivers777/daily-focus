import './globals.css';
import DarkModeToggle from '../components/DarkModeToggle';

export const metadata = {
  title: 'Daily Focus Tracker',
  description: 'Track your daily fitness and relationship goals',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script 
          src="https://accounts.google.com/gsi/client" 
          async 
          defer
          importance="high"
        />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            if (localStorage.getItem('darkMode') === 'true' || 
                (!localStorage.getItem('darkMode') && 
                window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark')
            }
          `
        }} />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
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
