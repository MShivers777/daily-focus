'use client';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ErrorMessage from './ErrorMessage';

export default function AuthComponent() {
  const supabase = createClientComponentClient();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure window.location.origin is available for redirectTo
      if (typeof window === 'undefined' || !window.location || !window.location.origin) {
        // This case should ideally not happen in a client component context
        console.error('Cannot determine redirect origin: window.location.origin is not available.');
        throw new Error('Cannot determine redirect origin.');
      }
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (signInError) {
        console.error('Supabase sign-in error details:', signInError);
        throw signInError; // Rethrow to be caught by the catch block
      }
      // If signInError is null, Supabase handles the redirect.
      // setLoading(false) is not strictly needed here if a redirect occurs,
      // as the component instance might be replaced.
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      // Attempt to provide a more specific error message.
      const message = err.message || (typeof err === 'string' ? err : 'An unexpected error occurred. Please try again.');
      setError(`Could not sign in with Google: ${message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-8">Daily Focus Tracker</h1>
      <div className="p-8 border rounded-lg shadow-lg">
        <h2 className="text-xl mb-4">Please Sign In</h2>
        {error && <ErrorMessage message={error} className="mb-4" />}
        
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In with Google'}
        </button>
      </div>
    </div>
  );
}
