'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../api/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { searchParams } = new URL(window.location.href);
        const code = searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        // Redirect to home page
        window.location.href = '/';
      } catch (error) {
        console.error('Auth error:', error);
        setError(error.message);
        // Wait a bit before redirecting on error
        setTimeout(() => {
          router.push('/auth/error');
        }, 2000);
      }
    };

    handleAuth();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Authentication failed: {error}</p>
          <p>Redirecting to error page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Processing authentication...</p>
      </div>
    </div>
  );
}
