-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting
CREATE POLICY "Users can insert their own workouts" ON workouts
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create policy for selecting
CREATE POLICY "Users can view their own workouts" ON workouts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy for updating
CREATE POLICY "Users can update their own workouts" ON workouts
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy for deleting
CREATE POLICY "Users can delete their own workouts" ON workouts
    FOR DELETE
    USING (auth.uid() = user_id);
