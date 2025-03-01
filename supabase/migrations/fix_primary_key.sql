-- First, backup the data
CREATE TABLE workouts_backup AS SELECT * FROM workouts;

-- Drop existing table
DROP TABLE workouts;

-- Recreate table with serial primary key
CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    workout_date DATE NOT NULL,
    strength_volume INTEGER,
    cardio_load INTEGER,
    note TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    strength_acute_load NUMERIC,
    cardio_acute_load NUMERIC,
    strength_chronic_load NUMERIC,
    cardio_chronic_load NUMERIC,
    strength_ratio NUMERIC,
    cardio_ratio NUMERIC,
    combined_ratio NUMERIC
);

-- Create index for performance
CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date);

-- Restore data (if needed)
INSERT INTO workouts (
    workout_date,
    strength_volume,
    cardio_load,
    note,
    user_id,
    created_at,
    strength_acute_load,
    cardio_acute_load,
    strength_chronic_load,
    cardio_chronic_load,
    strength_ratio,
    cardio_ratio,
    combined_ratio
)
SELECT 
    workout_date,
    strength_volume,
    cardio_load,
    note,
    user_id,
    created_at,
    strength_acute_load,
    cardio_acute_load,
    strength_chronic_load,
    cardio_chronic_load,
    strength_ratio,
    cardio_ratio,
    combined_ratio
FROM workouts_backup;

-- Drop backup table
DROP TABLE workouts_backup;

-- Modify the ID column to be a serial
ALTER TABLE workouts 
ALTER COLUMN id SET DEFAULT nextval('workouts_id_seq');

-- Create the sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS workouts_id_seq;

-- Set the sequence to start after the highest existing ID
SELECT setval('workouts_id_seq', COALESCE((SELECT MAX(id) FROM workouts), 0));

-- Verify sequence is properly attached
ALTER TABLE workouts ALTER COLUMN id SET DEFAULT nextval('workouts_id_seq');

-- Verify constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'workouts';
