-- Drop existing columns
ALTER TABLE marriage_focus
DROP COLUMN IF EXISTS communication,
DROP COLUMN IF EXISTS quality_time,
DROP COLUMN IF EXISTS physical_intimacy,
DROP COLUMN IF EXISTS emotional_support,
DROP COLUMN IF EXISTS shared_goals,
DROP COLUMN IF EXISTS financial_harmony,
DROP COLUMN IF EXISTS spiritual_connection,
DROP COLUMN IF EXISTS personal_growth,
DROP COLUMN IF EXISTS family_planning,
DROP COLUMN IF EXISTS conflict_resolution;

-- Add new columns
ALTER TABLE marriage_focus
ADD COLUMN effective_communication BOOLEAN DEFAULT false,
ADD COLUMN emotional_connection BOOLEAN DEFAULT false,
ADD COLUMN financial_unity BOOLEAN DEFAULT false,
ADD COLUMN quality_time BOOLEAN DEFAULT false,
ADD COLUMN physical_intimacy BOOLEAN DEFAULT false,
ADD COLUMN shared_values BOOLEAN DEFAULT false,
ADD COLUMN mutual_respect BOOLEAN DEFAULT false,
ADD COLUMN shared_responsibilities BOOLEAN DEFAULT false,
ADD COLUMN community_connection BOOLEAN DEFAULT false,
ADD COLUMN adaptability BOOLEAN DEFAULT false,
ADD COLUMN forgiveness BOOLEAN DEFAULT false,
ADD COLUMN spiritual_connection BOOLEAN DEFAULT false;

-- Update daily logs table
ALTER TABLE daily_marriage_logs
DROP COLUMN IF EXISTS communication_rating,
DROP COLUMN IF EXISTS quality_time_rating,
DROP COLUMN IF EXISTS physical_intimacy_rating,
DROP COLUMN IF EXISTS emotional_support_rating,
DROP COLUMN IF EXISTS shared_goals_rating,
DROP COLUMN IF EXISTS financial_harmony_rating,
DROP COLUMN IF EXISTS spiritual_connection_rating,
DROP COLUMN IF EXISTS personal_growth_rating,
DROP COLUMN IF EXISTS family_planning_rating,
DROP COLUMN IF EXISTS conflict_resolution_rating;

ALTER TABLE daily_marriage_logs
ADD COLUMN effective_communication_rating SMALLINT CHECK (effective_communication_rating >= 1 AND effective_communication_rating <= 5),
ADD COLUMN emotional_connection_rating SMALLINT CHECK (emotional_connection_rating >= 1 AND emotional_connection_rating <= 5),
ADD COLUMN financial_unity_rating SMALLINT CHECK (financial_unity_rating >= 1 AND financial_unity_rating <= 5),
ADD COLUMN quality_time_rating SMALLINT CHECK (quality_time_rating >= 1 AND quality_time_rating <= 5),
ADD COLUMN physical_intimacy_rating SMALLINT CHECK (physical_intimacy_rating >= 1 AND physical_intimacy_rating <= 5),
ADD COLUMN shared_values_rating SMALLINT CHECK (shared_values_rating >= 1 AND shared_values_rating <= 5),
ADD COLUMN mutual_respect_rating SMALLINT CHECK (mutual_respect_rating >= 1 AND mutual_respect_rating <= 5),
ADD COLUMN shared_responsibilities_rating SMALLINT CHECK (shared_responsibilities_rating >= 1 AND shared_responsibilities_rating <= 5),
ADD COLUMN community_connection_rating SMALLINT CHECK (community_connection_rating >= 1 AND community_connection_rating <= 5),
ADD COLUMN adaptability_rating SMALLINT CHECK (adaptability_rating >= 1 AND adaptability_rating <= 5),
ADD COLUMN forgiveness_rating SMALLINT CHECK (forgiveness_rating >= 1 AND forgiveness_rating <= 5),
ADD COLUMN spiritual_connection_rating SMALLINT CHECK (spiritual_connection_rating >= 1 AND spiritual_connection_rating <= 5);
