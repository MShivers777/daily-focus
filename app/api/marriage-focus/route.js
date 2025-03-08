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
      effective_communication: priorities.includes('effective_communication'),
      emotional_connection: priorities.includes('emotional_connection'),
      financial_unity: priorities.includes('financial_unity'),
      quality_time: priorities.includes('quality_time'),
      physical_intimacy: priorities.includes('physical_intimacy'),
      shared_values: priorities.includes('shared_values'),
      mutual_respect: priorities.includes('mutual_respect'),
      shared_responsibilities: priorities.includes('shared_responsibilities'),
      community_connection: priorities.includes('community_connection'),
      adaptability: priorities.includes('adaptability'),
      forgiveness: priorities.includes('forgiveness'),
      spiritual_connection: priorities.includes('spiritual_connection')
    });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }));
}
