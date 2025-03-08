import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const DEFAULT_SCHEDULE = [
  { day: 1, week: 1, topic: 'effective_communication' },
  { day: 2, week: 1, topic: 'emotional_connection' },
  { day: 3, week: 1, topic: 'financial_unity' },
  { day: 4, week: 1, topic: 'quality_time' },
  { day: 5, week: 1, topic: 'physical_intimacy' },
  { day: 6, week: 1, topic: 'shared_values' },
  { day: 0, week: 1, topic: 'mutual_respect' },
  { day: 1, week: 2, topic: 'effective_communication' },
  { day: 2, week: 2, topic: 'emotional_connection' },
  { day: 3, week: 2, topic: 'shared_responsibilities' },
  { day: 4, week: 2, topic: 'community_connection' },
  { day: 5, week: 2, topic: 'physical_intimacy' },
  { day: 6, week: 2, topic: 'adaptability' },
  { day: 0, week: 2, topic: 'forgiveness' }
];

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { priorities } = await request.json();

    // First, get topic IDs
    const { data: topics } = await supabase
      .from('marriage_topics')
      .select('id, identifier');

    // Create the schedule using topic IDs
    const scheduleData = DEFAULT_SCHEDULE.map(item => ({
      day_of_week: item.day,
      week_number: item.week,
      topic_id: topics.find(t => t.identifier === item.topic)?.id
    })).filter(item => item.topic_id); // Only include items with valid topic IDs

    // Insert schedule template
    const { error: scheduleError } = await supabase
      .from('marriage_schedule_template')
      .upsert(scheduleData);

    if (scheduleError) throw scheduleError;

    // Update marriage focus priorities
    const { error: focusError } = await supabase
      .from('marriage_focus')
      .upsert({
        user_id: session.user.id,
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

    if (focusError) throw focusError;

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
