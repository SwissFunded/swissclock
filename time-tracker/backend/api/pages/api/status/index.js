import { NextResponse } from 'next/server';
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
        throw error;
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

        if (insertError) throw insertError;

        // Fetch the newly inserted data
        const { data: newData, error: fetchError } = await supabase
          .from('employee_status')
          .select('*');

        if (fetchError) throw fetchError;
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
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const isClockedIn = action === 'clockIn';
      
      // Update status in Supabase
      const { error } = await supabase
        .from('employee_status')
        .upsert({
          id: userId,
          is_clocked_in: isClockedIn,
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Fetch updated status for all employees
      const { data, error: fetchError } = await supabase
        .from('employee_status')
        .select('*');

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
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

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in status API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 