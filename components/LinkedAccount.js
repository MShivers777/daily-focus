'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';

export default function LinkedAccount() {
  const [linkEmail, setLinkEmail] = useState('');
  const [linkedAccount, setLinkedAccount] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchLinkedAccount();
  }, []);

  const fetchLinkedAccount = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      // Check for active link
      const { data: activeLink } = await supabase
        .from('account_links')
        .select('*, linked_profiles:auth.users!account_links_linked_user_id_fkey(email)')
        .or(`user_id.eq.${session.user.id},linked_user_id.eq.${session.user.id}`)
        .eq('status', 'active')
        .single();

      if (activeLink) {
        setLinkedAccount(activeLink);
      }

      // Check for pending requests
      const { data: pendingLinks } = await supabase
        .from('account_links')
        .select('*, requesting_user:auth.users!account_links_user_id_fkey(email)')
        .eq('linked_user_id', session.user.id)
        .eq('status', 'pending');

      setPendingRequests(pendingLinks || []);
    } catch (error) {
      console.error('Error fetching linked account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendLinkRequest = async (e) => {
    e.preventDefault();
    try {
      const { data: targetUser, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', linkEmail)
        .single();

      if (userError || !targetUser) {
        toast.error('User not found');
        return;
      }

      const { error: linkError } = await supabase
        .from('account_links')
        .insert({
          user_id: (await supabase.auth.getSession()).data.session.user.id,
          linked_user_id: targetUser.id
        });

      if (linkError) throw linkError;

      toast.success('Link request sent!');
      setLinkEmail('');
    } catch (error) {
      console.error('Error sending link request:', error);
      toast.error('Failed to send link request');
    }
  };

  const handleLinkResponse = async (requestId, accept) => {
    try {
      const { error } = await supabase
        .from('account_links')
        .update({ status: accept ? 'active' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(accept ? 'Account linked!' : 'Request rejected');
      fetchLinkedAccount();
    } catch (error) {
      console.error('Error responding to link request:', error);
      toast.error('Failed to process request');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {linkedAccount ? (
        <div className="p-4 bg-green-100 dark:bg-green-800/30 rounded-lg">
          <p className="text-green-800 dark:text-green-200">
            Linked with: {linkedAccount.linked_profiles.email}
          </p>
        </div>
      ) : (
        <form onSubmit={sendLinkRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Link with Spouse
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter spouse's email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Send Link Request
              </button>
            </div>
          </div>
        </form>
      )}

      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">
            Pending Requests
          </h3>
          {pendingRequests.map((request) => (
            <div key={request.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg space-y-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Link request from: {request.requesting_user.email}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLinkResponse(request.id, true)}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleLinkResponse(request.id, false)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
