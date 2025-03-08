'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import supabase from '../api/supabase';  // Use shared instance

export default function KidsSettings() {
  const [hasKids, setHasKids] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        return;
      }

      console.log('Fetching profile for user:', session.user.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('has_kids')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Try to create profile if it doesn't exist
        if (error.code === 'PGRST116') {
          await createProfile(session.user.id);
          return;
        }
        throw error;
      }

      console.log('Fetched profile:', profile);
      setHasKids(!!profile?.has_kids);  // Convert to boolean

    } catch (error) {
      console.error('Error in fetchSetting:', error);
      toast.error('Failed to load setting');
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{ 
          id: userId,
          has_kids: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      setHasKids(false);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
    }
  };

  const updateSetting = async (value) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No active session');
        return;
      }

      console.log('Updating has_kids to:', value);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          has_kids: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setHasKids(value);
      toast.success('Setting updated successfully');
      
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />;
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => updateSetting(true)}
        className={`px-4 py-2 rounded-lg transition-all ${
          hasKids
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        Yes
      </button>
      <button
        onClick={() => updateSetting(false)}
        className={`px-4 py-2 rounded-lg transition-all ${
          !hasKids
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        No
      </button>
    </div>
  );
}
