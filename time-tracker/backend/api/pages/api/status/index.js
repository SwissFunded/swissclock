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
async function getUserIdFromSession(session) {
  if (!session) return null;
  
  const { data: { user } } = await supabase.auth.getUser(session);
  return user?.id;
}

export async function GET(request) {
  try {
    const session = request.headers.get('Authorization');
    const userId = await getUserIdFromSession(session);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = request.headers.get('Authorization');
    const userId = await getUserIdFromSession(session);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    
    if (!action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the employee ID based on the logged-in user
    const employeeId = userId === 'miro@example.com' ? 1 : 
                      userId === 'shein@example.com' ? 2 : 
                      userId === 'aymene@example.com' ? 3 : null;

    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }

    const isClockedIn = action === 'clockIn';
    
    // Update status in Supabase
    const { error } = await supabase
      .from('employee_status')
      .upsert({
        id: employeeId,
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

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 