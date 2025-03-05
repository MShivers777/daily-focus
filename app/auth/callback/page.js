'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../api/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { searchParams } = new URL(window.location.href);
        const code = searchParams.get('code');

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
        router.push('/');
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/auth/error');
      }
    };

    handleAuth();
  }, [router]);

  return <div>Processing authentication...</div>;
}
