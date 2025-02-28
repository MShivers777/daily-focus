'use client';
import { useEffect, useState, useRef } from 'react';
import supabase from '../api/supabase';

export default function AuthComponent() {
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    console.log('Auth component mounted');
    
    const checkGoogleScriptLoaded = () => {
      const scriptLoaded = typeof window !== 'undefined' && 
        window.google?.accounts?.id;

      console.log('Checking Google script status:', {
        hasWindow: typeof window !== 'undefined',
        hasGoogle: typeof window !== 'undefined' && !!window.google,
        hasAccounts: scriptLoaded
      });

      if (scriptLoaded) {
        console.log('Google script fully loaded');
        setIsLoaded(true);
        initializeGoogleSignIn();
      } else {
        console.log('Waiting for Google script...');
        setTimeout(checkGoogleScriptLoaded, 100);
      }
    };

    const initializeGoogleSignIn = () => {
      try {
        if (!buttonRef.current) {
          console.error('Button container not found');
          return;
        }

        console.log('Starting Google Sign-In initialization');
        
        window.oauth_callback = async function(response) {
          console.log('OAuth callback received:', response);
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
            });
            
            if (error) throw error;
            console.log('Signed in successfully:', data);
          } catch (error) {
            console.error('Google sign in error:', error);
            setError(error.message);
          }
        };

        window.google.accounts.id.initialize({
          client_id: '50413404459-vfhmo6k7hsil346h2jjct1m5jbuu2huj.apps.googleusercontent.com',
          callback: window.oauth_callback,
          auto_select: true,
          context: 'signin'
        });

        console.log('Attempting to render button in:', buttonRef.current);
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
        console.error('Error in Google Sign-In initialization:', err);
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
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
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
