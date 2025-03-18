-- Workout goals enum
CREATE TYPE workout_goal AS ENUM (
  'build_muscle',
  'build_strength', 
  'improve_cardio',
  'improve_endurance',
  'improve_speed',
  'lose_fat',
  'recomp',
  'maintain'
);

-- Progress pace enum
CREATE TYPE progress_pace AS ENUM (
  'slow_steady',
  'maintain',
  'aggressive'
);

-- Create user_workout_settings table
CREATE TABLE user_workout_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    goals workout_goal[] NOT NULL,
    progress_pace progress_pace NOT NULL DEFAULT 'slow_steady',
    deload_frequency INTEGER NOT NULL DEFAULT 4,
    workouts_per_week INTEGER NOT NULL,
    workout_duration INTEGER NOT NULL, -- in minutes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    training_experience INTEGER NOT NULL, -- in months
    CONSTRAINT valid_deload_frequency CHECK (deload_frequency BETWEEN 4 AND 6),
    CONSTRAINT valid_workouts_per_week CHECK (workouts_per_week BETWEEN 1 AND 7),
    CONSTRAINT valid_workout_duration CHECK (workout_duration > 0)
);

-- Create user_fitness_baselines table
CREATE TABLE user_fitness_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise VARCHAR(50) NOT NULL,
    one_rm INTEGER, -- for strength exercises
    recent_time INTEGER, -- for cardio (in seconds)
    distance DECIMAL, -- for cardio (in meters)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workout_schedule table
CREATE TABLE workout_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    workout_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, day_of_week)
);

-- Create mesocycle_templates table
CREATE TABLE mesocycle_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL,
    workout_goal workout_goal NOT NULL,
    progress_pace progress_pace NOT NULL,
    strength_progression jsonb,
    cardio_progression jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE user_workout_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fitness_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_schedule ENABLE ROW LEVEL SECURITY;

-- Add policies for user_workout_settings
CREATE POLICY "Users can view their own settings"
    ON user_workout_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON user_workout_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON user_workout_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Add policies for user_fitness_baselines
CREATE POLICY "Users can view their own baselines"
    ON user_fitness_baselines FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baselines"
    ON user_fitness_baselines FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baselines"
    ON user_fitness_baselines FOR UPDATE
    USING (auth.uid() = user_id);

-- Add policies for workout_schedule
CREATE POLICY "Users can view their own schedule"
    ON workout_schedule FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule"
    ON workout_schedule FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule"
    ON workout_schedule FOR UPDATE
    USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_user_workout_settings_updated_at
    BEFORE UPDATE ON user_workout_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_fitness_baselines_updated_at
    BEFORE UPDATE ON user_fitness_baselines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_schedule_updated_at
    BEFORE UPDATE ON workout_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate workouts based on settings
CREATE OR REPLACE FUNCTION generate_workout_plan(
    user_id UUID,
    start_date DATE,
    weeks INTEGER DEFAULT 4
)
RETURNS TABLE (
    planned_date DATE,
    workout_type TEXT,
    strength_volume INTEGER,
    cardio_load INTEGER,
    notes TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    -- Implementation will generate workouts based on:
    -- 1. User's goals and settings
    -- 2. Selected workout days
    -- 3. Deload timing
    -- 4. Progress pace
    -- This is a placeholder - actual implementation would be more complex
    RETURN QUERY
    SELECT
        start_date + (d || ' days')::INTERVAL AS planned_date,
        'strength' AS workout_type,
        100 AS strength_volume,
        0 AS cardio_load,
        'Generated workout' AS notes
    FROM generate_series(0, weeks * 7 - 1) AS d;
END;
$$;
