import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmgfvicqoxldpxcphiew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZ2Z2aWNxb3hsZHB4Y3BoaWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NTUwMzYsImV4cCI6MjA2MDEzMTAzNn0.9kkltDMNgYKabf93bRlh0MysVTmMAGWbj-Omv8fsWZQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize the employee_status table if it doesn't exist
async function initializeTable() {
  try {
    const { error } = await supabase.rpc('create_employee_status_table');
    if (error) throw error;
  } catch (error) {
    console.error('Error initializing table:', error);
  }
}

// Call initializeTable when the API starts
initializeTable();

// Helper function to get user ID from session
function getUserIdFromSession(session) {
  if (!session) return null;
  
  // Extract the username from the token
  const token = session.replace('Bearer ', '');
  const username = token.split(':')[0];
  
  // Map username to employee ID
  switch (username) {
    case 'miro':
      return 1;
    case 'shein':
      return 2;
    case 'aymene':
      return 3;
    default:
      return null;
  }
}

export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const session = req.headers.authorization;
    const userId = getUserIdFromSession(session);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('employee_status')
        .select('*');

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      // If no data exists, create initial records
      if (!data || data.length === 0) {
        const initialData = [
          { id: 1, is_clocked_in: false },
          { id: 2, is_clocked_in: false },
          { id: 3, is_clocked_in: false }
        ];

        const { error: insertError } = await supabase
          .from('employee_status')
          .insert(initialData);

        if (insertError) {
          console.error('Insert error:', insertError);
          return res.status(500).json({ error: 'Database error' });
        }

        // Fetch the newly inserted data
        const { data: newData, error: fetchError } = await supabase
          .from('employee_status')
          .select('*');

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          return res.status(500).json({ error: 'Database error' });
        }
        data = newData;
      }

      // Convert array to object with id as key
      const status = data.reduce((acc, curr) => {
        acc[curr.id] = {
          id: curr.id,
          name: curr.id === 1 ? 'Miro' : curr.id === 2 ? 'Shein' : 'Aymene',
          isClockedIn: curr.is_clocked_in
        };
        return acc;
      }, {});

      return res.status(200).json(status);
    }

    if (req.method === 'POST') {
      const { action } = req.body;
      
      if (!action) {
        return res.status(400).json({ error: 'Missing action' });
      }

      const { data: currentStatus, error: fetchError } = await supabase
        .from('employee_status')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        return res.status(500).json({ error: 'Database error' });
      }

      const newStatus = action === 'clockIn';

      const { error: updateError } = await supabase
        .from('employee_status')
        .update({ is_clocked_in: newStatus })
        .eq('id', userId);

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: 'Database error' });
      }

      // Fetch all statuses after update
      const { data: allStatus, error: getAllError } = await supabase
        .from('employee_status')
        .select('*');

      if (getAllError) {
        console.error('Get all error:', getAllError);
        return res.status(500).json({ error: 'Database error' });
      }

      // Convert array to object with id as key
      const status = allStatus.reduce((acc, curr) => {
        acc[curr.id] = {
          id: curr.id,
          name: curr.id === 1 ? 'Miro' : curr.id === 2 ? 'Shein' : 'Aymene',
          isClockedIn: curr.is_clocked_in
        };
        return acc;
      }, {});

      return res.status(200).json(status);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 