const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bmgfvicqoxldpxcphiew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZ2Z2aWNxb3hsZHB4Y3BoaWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NTUwMzYsImV4cCI6MjA2MDEzMTAzNn0.9kkltDMNgYKabf93bRlh0MysVTmMAGWbj-Omv8fsWZQ';
const supabase = createClient(supabaseUrl, supabaseKey);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for database operations
ipcMain.handle('login', async (event, { username, password }) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', username)
      .single();

    if (error) throw error;
    if (!data) return null;

    // In production, you should hash passwords
    if (data.password === password) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
});

ipcMain.handle('clock-in', async (event, userId) => {
  try {
    // Create time entry
    const { data: timeEntry, error: timeError } = await supabase
      .from('time_entries')
      .insert([
        {
          user_id: userId,
          start_time: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (timeError) throw timeError;

    // Update user status
    const { error: userError } = await supabase
      .from('users')
      .update({ is_clocked_in: true })
      .eq('id', userId);

    if (userError) throw userError;

    return timeEntry;
  } catch (error) {
    console.error('Clock in error:', error);
    return null;
  }
});

ipcMain.handle('clock-out', async (event, userId) => {
  try {
    // Find active time entry
    const { data: activeEntry, error: findError } = await supabase
      .from('time_entries')
      .select()
      .eq('user_id', userId)
      .is('end_time', null)
      .single();

    if (findError) throw findError;
    if (!activeEntry) return null;

    // Update time entry
    const { data: timeEntry, error: timeError } = await supabase
      .from('time_entries')
      .update({ end_time: new Date().toISOString() })
      .eq('id', activeEntry.id)
      .select()
      .single();

    if (timeError) throw timeError;

    // Update user status
    const { error: userError } = await supabase
      .from('users')
      .update({ is_clocked_in: false })
      .eq('id', userId);

    if (userError) throw userError;

    return timeEntry;
  } catch (error) {
    console.error('Clock out error:', error);
    return null;
  }
});

ipcMain.handle('getAllUsersData', async () => {
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        *,
        time_entries (*)
      `);

    if (usersError) throw usersError;

    // Calculate total hours for each user
    const usersWithHours = users.map(user => {
      const totalHours = user.time_entries.reduce((total, entry) => {
        if (entry.end_time) {
          const duration = new Date(entry.end_time) - new Date(entry.start_time);
          return total + (duration / (1000 * 60 * 60));
        }
        return total;
      }, 0);

      return {
        ...user,
        totalHours: Math.round(totalHours * 100) / 100
      };
    });

    return usersWithHours;
  } catch (error) {
    console.error('Error fetching all users data:', error);
    return [];
  }
}); 