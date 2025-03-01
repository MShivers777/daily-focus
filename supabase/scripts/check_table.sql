-- Check table structure
SELECT *
FROM information_schema.columns
WHERE table_name = 'workouts'
ORDER BY ordinal_position;

-- Check existing constraints
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints 
WHERE table_name = 'workouts';

-- Check primary key details
SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid
AND a.attnum = ANY(i.indkey)
WHERE i.indrelid = 'workouts'::regclass
AND i.indisprimary;
