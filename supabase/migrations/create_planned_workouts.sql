-- Create enum for recurrence types
CREATE TYPE recurrence_type AS ENUM ('once', 'daily', 'weekly', 'biweekly', 'custom');
CREATE TYPE end_type AS ENUM ('never', 'after', 'on');

-- Create table for planned workouts
CREATE TABLE planned_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    strength_volume INTEGER,
    cardio_load INTEGER,
    note TEXT,
    recurrence recurrence_type NOT NULL DEFAULT 'once',
    custom_days JSONB, -- Store array of weekdays for custom recurrence
    end_type end_type NOT NULL DEFAULT 'never',
    end_after INTEGER, -- Number of occurrences
    end_date DATE, -- Specific end date
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT valid_end_condition CHECK (
        (end_type = 'never') OR
        (end_type = 'after' AND end_after IS NOT NULL AND end_after > 0) OR
        (end_type = 'on' AND end_date IS NOT NULL AND end_date >= start_date)
    ),
    CONSTRAINT valid_custom_days CHECK (
        recurrence != 'custom' OR
        (custom_days IS NOT NULL AND jsonb_typeof(custom_days) = 'object')
    )
);

-- Add RLS policies
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own planned workouts"
    ON planned_workouts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planned workouts"
    ON planned_workouts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planned workouts"
    ON planned_workouts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planned workouts"
    ON planned_workouts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON planned_workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_planned_workouts_user_date 
    ON planned_workouts(user_id, start_date);
