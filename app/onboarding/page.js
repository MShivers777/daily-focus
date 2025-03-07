'use client';
import { useRouter } from 'next/navigation';
import MarriageOnboarding from '../../components/MarriageOnboarding';
import supabase from '../../api/supabase';

export default function OnboardingPage() {
  const router = useRouter();

  const handleOnboardingComplete = async (selections) => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user.id,
          marriage_priorities: selections.priorities,
          marriage_additional: selections.additional,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <MarriageOnboarding onComplete={handleOnboardingComplete} />
    </div>
  );
}
