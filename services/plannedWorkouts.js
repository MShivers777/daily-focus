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

export async function getPlannedWorkouts(startDate = null, endDate = null) {
  let query = supabase
    .from('planned_workouts')
    .select('*')
    .order('start_date', { ascending: true });

  if (startDate) {
    query = query.gte('start_date', startDate);
  }
  if (endDate) {
    query = query.lte('start_date', endDate);
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
