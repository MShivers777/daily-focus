ALTER TABLE marriage_focus
ADD COLUMN spiritual_connection boolean DEFAULT false;

-- Add spiritual_connection to the daily_logs table as well
ALTER TABLE daily_marriage_logs
ADD COLUMN spiritual_connection_rating smallint CHECK (spiritual_connection_rating >= 1 AND spiritual_connection_rating <= 5);
