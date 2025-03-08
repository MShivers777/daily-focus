import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { priorities } = await request.json();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { error } = await supabase
    .from('marriage_focus')
    .upsert({
      user_id: user.id,
      communication: priorities.includes('Communication'),
      quality_time: priorities.includes('Quality Time'),
      physical_intimacy: priorities.includes('Physical Intimacy'),
      emotional_support: priorities.includes('Emotional Support'),
      shared_goals: priorities.includes('Shared Goals'),
      financial_harmony: priorities.includes('Financial Harmony'),
      spiritual_connection: priorities.includes('Spiritual Connection'),
      personal_growth: priorities.includes('Personal Growth'),
      family_planning: priorities.includes('Family Planning'),
      conflict_resolution: priorities.includes('Conflict Resolution'),
    });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }));
}
