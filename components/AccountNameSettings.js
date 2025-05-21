'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import ErrorMessage from './ErrorMessage';

const AccountNameSettings = ({ userId }) => {
  const supabase = createClientComponentClient();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Initial session check error:', sessionError);
          return;
        }

        if (!session) {
          console.log('No session, waiting for auth state change...');
          return;
        }

        await fetchUserProfile(session);
      } catch (error) {
        console.error('Error in initial session check:', error);
      }
    };

    checkSessionAndFetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (session) {
        await fetchUserProfile(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (session) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('custom_name')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      const name = profile?.custom_name || 
                   session.user.user_metadata?.full_name || 
                   session.user.email?.split('@')[0] ||
                   'Anonymous User';

      console.log('Setting name:', name);
      setDisplayName(name);
      setOriginalName(name);

    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setError(error.message);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          custom_name: displayName,
          updated_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;

      toast.success('Name updated successfully');
      setOriginalName(displayName);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Failed to update name');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />;
  }

  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400">
        Error loading profile: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
            placeholder="Enter your name"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Save
          </button>
          <button
            onClick={() => {
              setDisplayName(originalName);
              setIsEditing(false);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <span className="text-gray-700 dark:text-gray-300">{displayName}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountNameSettings;
