-- Create the employee_status table
CREATE TABLE IF NOT EXISTS employee_status (
  id INTEGER PRIMARY KEY,
  is_clocked_in BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the function to initialize the table
CREATE OR REPLACE FUNCTION create_employee_status_table()
RETURNS void AS $$
BEGIN
  -- Insert initial records if they don't exist
  INSERT INTO employee_status (id, is_clocked_in)
  VALUES 
    (1, FALSE),
    (2, FALSE),
    (3, FALSE)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON employee_status TO anon;
GRANT ALL ON employee_status TO authenticated;
GRANT EXECUTE ON FUNCTION create_employee_status_table() TO anon;
GRANT EXECUTE ON FUNCTION create_employee_status_table() TO authenticated; 