import { supabase } from './supabase';

async function testConnection() {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('Testing Supabase connection...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('Error fetching users:', usersError.message);
      return;
    }

    console.log('Successfully connected to Supabase!');
    console.log('Found', users.length, 'users in the database');
    console.log('Users:', users);

    // Test 2: Check if we can query time entries
    console.log('\nTesting time entries table...');
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select('*');

    if (entriesError) {
      console.error('Error fetching time entries:', entriesError.message);
      return;
    }

    console.log('Successfully queried time entries!');
    console.log('Found', entries.length, 'time entries in the database');
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Run the test
testConnection(); 