import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  AppBar,
  Toolbar,
  ThemeProvider,
  createTheme,
  CssBaseline,
  TextField
} from '@mui/material';
import { AccessTime, Person } from '@mui/icons-material';
import { format, differenceInHours } from 'date-fns';

interface TimeEntry {
  id: string;
  employeeName: string;
  clockIn: Date;
  clockOut?: Date;
}

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employeeName, setEmployeeName] = useState('');
  const [isClockedIn, setIsClockedIn] = useState(false);

  const handleClockIn = () => {
    if (!employeeName) return;
    
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      employeeName,
      clockIn: new Date(),
    };
    
    setTimeEntries([...timeEntries, newEntry]);
    setIsClockedIn(true);
  };

  const handleClockOut = () => {
    if (!isClockedIn) return;
    
    const updatedEntries = timeEntries.map(entry => {
      if (entry.employeeName === employeeName && !entry.clockOut) {
        return { ...entry, clockOut: new Date() };
      }
      return entry;
    });
    
    setTimeEntries(updatedEntries);
    setIsClockedIn(false);
  };

  const calculateTotalHours = (entry: TimeEntry) => {
    if (!entry.clockOut) return 0;
    return differenceInHours(entry.clockOut, entry.clockIn);
  };

  const getTopEmployees = () => {
    const employeeHours = timeEntries.reduce((acc, entry) => {
      if (!entry.clockOut) return acc;
      const hours = calculateTotalHours(entry);
      acc[entry.employeeName] = (acc[entry.employeeName] || 0) + hours;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(employeeHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <AccessTime sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SClock - Time Tracking
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Clock In/Out
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Enter your name"
                variant="outlined"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
              />
              {!isClockedIn ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleClockIn}
                  disabled={!employeeName}
                  sx={{ minWidth: '120px' }}
                >
                  Clock In
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleClockOut}
                  sx={{ minWidth: '120px' }}
                >
                  Clock Out
                </Button>
              )}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Employees
            </Typography>
            <List>
              {getTopEmployees().map(([name, hours]) => (
                <ListItem key={name}>
                  <Person sx={{ mr: 2 }} />
                  <ListItemText
                    primary={name}
                    secondary={`${hours} hours worked`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Time Entries
          </Typography>
          <List>
            {timeEntries.slice().reverse().map((entry) => (
              <ListItem key={entry.id}>
                <ListItemText
                  primary={entry.employeeName}
                  secondary={
                    <>
                      Clock In: {format(entry.clockIn, 'PPpp')}
                      {entry.clockOut && (
                        <>
                          <br />
                          Clock Out: {format(entry.clockOut, 'PPpp')}
                          <br />
                          Total Hours: {calculateTotalHours(entry)}
                        </>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App; 