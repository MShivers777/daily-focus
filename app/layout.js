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
      </head>
      <body className="bg-gray-50 min-h-screen">
        <main className="container mx-auto py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
