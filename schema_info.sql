
-- Tables and Columns with their data types
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length
FROM 
    information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name, c.ordinal_position;

-- Functions
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition,
    l.lanname as language,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END as volatility
FROM 
    pg_proc p
    LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE 
    p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Triggers
SELECT 
    tg.tgname as trigger_name,
    t.relname as table_name,
    p.proname as function_name,
    CASE 
        WHEN tg.tgtype & 2 = 2 THEN 'BEFORE'
        WHEN tg.tgtype & 16 = 16 THEN 'AFTER'
        WHEN tg.tgtype & 64 = 64 THEN 'INSTEAD OF'
    END as timing,
    CASE 
        WHEN tg.tgtype & 4 = 4 THEN 'INSERT'
        WHEN tg.tgtype & 8 = 8 THEN 'DELETE'
        WHEN tg.tgtype & 16 = 16 THEN 'UPDATE'
        WHEN tg.tgtype & 32 = 32 THEN 'TRUNCATE'
    END as event,
    pg_get_triggerdef(tg.oid) as trigger_definition
FROM 
    pg_trigger tg
    JOIN pg_class t ON tg.tgrelid = t.oid
    JOIN pg_proc p ON tg.tgfoid = p.oid
WHERE 
    t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND NOT tg.tgisinternal;
