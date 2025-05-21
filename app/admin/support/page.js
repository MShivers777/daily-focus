'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BackIcon from '../../../components/icons/BackIcon';

export default function SupportMessagesPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndLoadMessages();
  }, []);

  const checkAdminAndLoadMessages = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      if (!adminData) {
        router.push('/');
        return;
      }

      setIsAdmin(true);

      // Fetch messages with user info
      const { data: messages, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          profiles:user_id (
            custom_name,
            email:auth.users!auth_users (email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(messages);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) return null;

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => router.push('/')}
        className="absolute top-0 left-0 p-2 rounded-lg transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Back to dashboard"
      >
        <BackIcon />
      </button>
      
      <div className="max-w-4xl mx-auto pt-16">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Support Messages
        </h1>

        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">
                    {message.profiles?.custom_name || message.profiles?.email?.email || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  message.status === 'resolved' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {message.status || 'new'}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {message.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
