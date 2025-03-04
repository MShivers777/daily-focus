import supabase from '../api/supabase';

export async function createPlannedWorkout(data) {
  const { data: result, error } = await supabase
    .from('planned_workouts')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getPlannedWorkouts(userId, startDate, endDate) {
  const query = supabase
    .from('planned_workouts')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: true });

  if (startDate) {
    query.gte('start_date', startDate);
  }
  if (endDate) {
    query.lte('start_date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updatePlannedWorkout(id, data) {
  const { data: result, error } = await supabase
    .from('planned_workouts')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deletePlannedWorkout(id) {
  const { error } = await supabase
    .from('planned_workouts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
