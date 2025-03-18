SELECT 
    t.table_name,
    c.column_name,
    CASE 
        WHEN c.data_type = 'ARRAY' 
        THEN 'ARRAY[' || c.udt_name || ']'
        WHEN c.data_type = 'USER-DEFINED' 
        THEN c.udt_name
        ELSE c.data_type
    END as data_type
FROM 
    information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY 
    t.table_name,
    c.ordinal_position;
