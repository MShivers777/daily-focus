'use client';
import { useEffect, useState, useRef } from 'react';
import supabase from '../api/supabase';
import ErrorMessage from './ErrorMessage';

export default function AuthComponent() {
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    
    let retryCount = 0;
    const maxRetries = 3;

    const checkGoogleScriptLoaded = () => {
      if (retryCount >= maxRetries) {
        setLoadError('Failed to load Google Sign In. Please refresh the page.');
        return;
      }

      const scriptLoaded = typeof window !== 'undefined' && 
        window.google?.accounts?.id;

      if (scriptLoaded) {
        setIsLoaded(true);
        initializeGoogleSignIn();
      } else {
        retryCount++;
        setTimeout(checkGoogleScriptLoaded, 1000);
      }
    };

    const initializeGoogleSignIn = () => {
      try {
        if (!buttonRef.current) return;
        
        window.oauth_callback = async function(response) {
          try {
            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
            });
            
            if (error) throw error;
          } catch (error) {
            setError(error.message);
          }
        };

        window.google.accounts.id.initialize({
          client_id: '50413404459-vfhmo6k7hsil346h2jjct1m5jbuu2huj.apps.googleusercontent.com',
          callback: window.oauth_callback,
          auto_select: true,
          context: 'signin'
        });

        window.google.accounts.id.renderButton(
          buttonRef.current,
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'center'
          }
        );
      } catch (err) {
        setError(err.message);
      }
    };

    checkGoogleScriptLoaded();
  }, []);

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-8">Daily Focus Tracker</h1>
      <div className="p-8 border rounded-lg shadow-lg">
        <h2 className="text-xl mb-4">Please Sign In</h2>
        {error && <ErrorMessage message={error} className="mb-4" />}
        {loadError && <ErrorMessage message={loadError} className="mb-4" />}
        <div 
          ref={buttonRef}
          className="flex justify-center"
        />
        {!isLoaded && isClient && (
          <p className="mt-4 text-sm text-gray-600">
            Loading sign in options...
          </p>
        )}
      </div>
    </div>
  );
}
