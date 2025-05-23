'use client';
import { useEffect, Suspense } from 'react'; // Import Suspense
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Renamed original component to AuthCallbackContent
function AuthCallbackContent() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams(); // This hook requires Suspense

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error getting session in callback:', sessionError);
        router.push(`/login?error=${encodeURIComponent(sessionError.message || 'callback_failed')}`);
        return;
      }

      if (session) {
        router.push('/'); // Redirect to home or dashboard
      } else {
        // Check for error parameters from Supabase redirect
        const error_description = searchParams.get('error_description');
        const error = searchParams.get('error');

        if (error_description) {
          console.error('OAuth Error:', error_description);
          router.push(`/login?error=${encodeURIComponent(error_description)}`);
        } else if (error) {
          console.error('OAuth Error Code:', error);
          router.push(`/login?error=${encodeURIComponent(error)}`);
        }
         else {
          // This case might occur if the redirect happened without establishing a session
          // and without explicit error parameters.
          console.warn('No session and no explicit error in callback. Redirecting to login.');
          router.push('/login?error=auth_failed_no_session');
        }
      }
    };

    handleAuthCallback();
  }, [supabase, router, searchParams]);

  return (
    <div>
      <p>Processing authentication...</p>
    </div>
  );
}

// New default export for the page, wrapping AuthCallbackContent in Suspense
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading authentication details...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
