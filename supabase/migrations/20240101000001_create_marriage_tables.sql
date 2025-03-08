
-- Create marriage_focus table
CREATE TABLE marriage_focus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    communication BOOLEAN DEFAULT false,
    quality_time BOOLEAN DEFAULT false,
    physical_intimacy BOOLEAN DEFAULT false,
    emotional_support BOOLEAN DEFAULT false,
    shared_goals BOOLEAN DEFAULT false,
    financial_harmony BOOLEAN DEFAULT false,
    spiritual_connection BOOLEAN DEFAULT false,
    personal_growth BOOLEAN DEFAULT false,
    family_planning BOOLEAN DEFAULT false,
    conflict_resolution BOOLEAN DEFAULT false,
    UNIQUE(user_id)
);

-- Create daily_marriage_logs table
CREATE TABLE daily_marriage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    communication_rating SMALLINT CHECK (communication_rating >= 1 AND communication_rating <= 5),
    quality_time_rating SMALLINT CHECK (quality_time_rating >= 1 AND quality_time_rating <= 5),
    physical_intimacy_rating SMALLINT CHECK (physical_intimacy_rating >= 1 AND physical_intimacy_rating <= 5),
    emotional_support_rating SMALLINT CHECK (emotional_support_rating >= 1 AND emotional_support_rating <= 5),
    shared_goals_rating SMALLINT CHECK (shared_goals_rating >= 1 AND shared_goals_rating <= 5),
    financial_harmony_rating SMALLINT CHECK (financial_harmony_rating >= 1 AND financial_harmony_rating <= 5),
    spiritual_connection_rating SMALLINT CHECK (spiritual_connection_rating >= 1 AND spiritual_connection_rating <= 5),
    personal_growth_rating SMALLINT CHECK (personal_growth_rating >= 1 AND personal_growth_rating <= 5),
    family_planning_rating SMALLINT CHECK (family_planning_rating >= 1 AND family_planning_rating <= 5),
    conflict_resolution_rating SMALLINT CHECK (conflict_resolution_rating >= 1 AND conflict_resolution_rating <= 5),
    notes TEXT,
    UNIQUE(user_id, date)
);

-- Create an updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_marriage_focus_updated_at
    BEFORE UPDATE ON marriage_focus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_marriage_logs_updated_at
    BEFORE UPDATE ON daily_marriage_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add row level security (RLS) policies
ALTER TABLE marriage_focus ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_marriage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for marriage_focus
CREATE POLICY "Users can view their own marriage focus"
    ON marriage_focus FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own marriage focus"
    ON marriage_focus FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marriage focus"
    ON marriage_focus FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policies for daily_marriage_logs
CREATE POLICY "Users can view their own daily logs"
    ON daily_marriage_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily logs"
    ON daily_marriage_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs"
    ON daily_marriage_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
