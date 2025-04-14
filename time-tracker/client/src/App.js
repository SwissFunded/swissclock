import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import './animations.css';
import Login from './Login';
import Statistics from './components/Statistics';
import Profile from './components/Profile';
import ThemeToggle from './components/ThemeToggle';
import WorkCalendar from './components/WorkCalendar';

// Hardcoded users
const USERS = {
  miro: {
    id: 1,
    name: 'Miro',
    email: 'miro',
    password: 'miro123',
    isClockedIn: false
  },
  shein: {
    id: 2,
    name: 'Shein',
    email: 'shein',
    password: 'shein123',
    isClockedIn: false
  },
  aymene: {
    id: 3,
    name: 'Aymene',
    email: 'aymene',
    password: 'aymene123',
    isClockedIn: false
  }
};

// Use sessionStorage for current user and localStorage for shared data
const loadFromStorage = () => {
  try {
    const storedUser = sessionStorage.getItem('currentUser');
    const storedData = localStorage.getItem('sharedData');
    const { employees = [], timeEntries = [] } = storedData ? JSON.parse(storedData) : {};

    return {
      employees: employees.length ? employees : Object.values(USERS).map(({ password, ...user }) => user),
      timeEntries,
      currentUser: storedUser ? JSON.parse(storedUser) : null
    };
  } catch (error) {
    console.error('Error loading from storage:', error);
    return {
      employees: Object.values(USERS).map(({ password, ...user }) => user),
      timeEntries: [],
      currentUser: null
    };
  }
};

const API_URL = 'https://swissclock.vercel.app';

function App() {
  const { employees: initialEmployees, timeEntries: initialTimeEntries, currentUser: initialUser } = loadFromStorage();
  const [employees, setEmployees] = useState(initialEmployees);
  const [timeEntries, setTimeEntries] = useState(initialTimeEntries);
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialUser);
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [loginError, setLoginError] = useState('');
  const [employeeStatus, setEmployeeStatus] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  // Create a broadcast channel for real-time updates
  const broadcastChannel = new BroadcastChannel('employee_status');

  // Save shared data and broadcast updates
  const updateSharedData = useCallback((employees, timeEntries) => {
    // Save to localStorage for persistence
    localStorage.setItem('sharedData', JSON.stringify({ employees, timeEntries }));
    
    // Broadcast the update to other windows
    broadcastChannel.postMessage({
      type: 'update',
      data: { employees, timeEntries }
    });
  }, [broadcastChannel]);

  // Listen for updates from other windows
  useEffect(() => {
    const handleMessage = (event) => {
      const { type, data } = event.data;
      if (type === 'update') {
        const { employees: updatedEmployees, timeEntries: updatedTimeEntries } = data;
        setEmployees(updatedEmployees);
        setTimeEntries(updatedTimeEntries);
        
        // Update current user's status if they're logged in
        if (currentUser) {
          const updatedUser = updatedEmployees.find(emp => emp.id === currentUser.id);
          if (updatedUser) {
            setCurrentUser(prev => ({ ...prev, isClockedIn: updatedUser.isClockedIn }));
          }
        }
      }
    };

    broadcastChannel.addEventListener('message', handleMessage);
    return () => broadcastChannel.removeEventListener('message', handleMessage);
  }, [broadcastChannel, currentUser]);

  // Initialize shared data on component mount
  useEffect(() => {
    const storedData = localStorage.getItem('sharedData');
    if (!storedData) {
      updateSharedData(employees, timeEntries);
    }
  }, [employees, timeEntries, updateSharedData]);

  // Save current user to sessionStorage
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      setIsLoggedIn(true);
    } else {
      sessionStorage.removeItem('currentUser');
      setIsLoggedIn(false);
    }
  }, [currentUser]);

  const fetchEmployeeStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/status`, {
        headers: {
          'Authorization': token,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsLoggedIn(false);
          localStorage.removeItem('token');
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      setEmployeeStatus(data);
      setError(null);
      setLoading(false);
      
      // Broadcast the update to other windows
      broadcastChannel.postMessage({ type: 'status_update', data });
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username) return;

    // Simple token generation (in production, this should be handled by a proper auth system)
    const token = `${username}:${Date.now()}`;
    localStorage.setItem('token', `Bearer ${token}`);
    setIsLoggedIn(true);
    await fetchEmployeeStatus();
  };

  const handleClockAction = async (action) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsLoggedIn(false);
          localStorage.removeItem('token');
          throw new Error('Unauthorized');
        }
        throw new Error(`Failed to ${action}`);
      }

      const data = await response.json();
      setEmployeeStatus(data);
      setError(null);
      
      // Broadcast the update to other windows
      broadcastChannel.postMessage({ type: 'status_update', data });
    } catch (err) {
      console.error(`Error during ${action}:`, err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchEmployeeStatus();
    }

    // Set up polling
    const intervalId = setInterval(fetchEmployeeStatus, 1000);

    // Listen for updates from other windows
    broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'status_update') {
        setEmployeeStatus(event.data.data);
      }
    };

    return () => {
      clearInterval(intervalId);
      broadcastChannel.close();
    };
  }, [fetchEmployeeStatus]);

  const handleLogout = () => {
    if (currentUser && employees.find(emp => emp.id === currentUser.id)?.isClockedIn) {
      handleClockAction('clockOut');
    }
    setCurrentUser(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('currentUser');
  };

  const calculateTotalHours = (employeeId) => {
    const employeeEntries = timeEntries.filter(entry => entry.employeeId === employeeId);
    return employeeEntries.reduce((total, entry) => {
      if (entry.clockOutTime) {
        const duration = new Date(entry.clockOutTime) - new Date(entry.clockInTime);
        return total + duration / (1000 * 60 * 60);
      } else if (entry.clockInTime) {
        // For active sessions, calculate time until now
        const duration = new Date() - new Date(entry.clockInTime);
        return total + duration / (1000 * 60 * 60);
      }
      return total;
    }, 0);
  };

  const calculateTodayHours = (employeeId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.clockInTime);
      return entry.employeeId === employeeId && entryDate >= today;
    });

    return todayEntries.reduce((total, entry) => {
      const clockOut = entry.clockOutTime ? new Date(entry.clockOutTime) : new Date();
      const clockIn = new Date(entry.clockInTime);
      const duration = clockOut - clockIn;
      return total + duration / (1000 * 60 * 60);
    }, 0);
  };

  const sortedEmployees = [...employees].map(emp => ({
    ...emp,
    totalHours: calculateTotalHours(emp.id),
    todayHours: calculateTodayHours(emp.id)
  })).sort((a, b) => b.totalHours - a.totalHours);

  if (!isLoggedIn) {
    return (
      <div className="login-container stagger-animation">
        <Login onLogin={handleLogin} error={loginError} />
      </div>
    );
  }

  return (
    <div className="App theme-transition">
      <div className="time-tracker-container stagger-animation">
        <h1>SwissClock</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout ({currentUser.name})
        </button>
        <ThemeToggle />
        
        <div className="employee-section scroll-animate">
          <h2>Employees</h2>
          <div className="employee-list">
            {employees.map(employee => (
              <div key={employee.id} className="employee-card">
                <div className="employee-info">
                  <span className="employee-name">{employee.name}</span>
                  <span className="employee-status">
                    {employeeStatus && employeeStatus[employee.id]?.isClockedIn ? '🟢 Clocked In' : '⚪ Clocked Out'}
                  </span>
                  <span className="total-hours">
                    Today: {calculateTodayHours(employee.id).toFixed(2)} hrs
                  </span>
                  <span className="total-hours">
                    Total: {calculateTotalHours(employee.id).toFixed(2)} hrs
                  </span>
                </div>
                {employee.id === currentUser.id && (
                  !employeeStatus || !employeeStatus[employee.id]?.isClockedIn ? (
                    <button 
                      className="timer-button"
                      onClick={() => handleClockAction('clockIn')}
                    >
                      Clock In
                    </button>
                  ) : (
                    <button 
                      className="timer-button"
                      onClick={() => handleClockAction('clockOut')}
                    >
                      Clock Out
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="scroll-animate">
          <Profile 
            employee={currentUser} 
            timeEntries={timeEntries.filter(entry => entry.employeeId === currentUser.id)}
            todayHours={calculateTodayHours(currentUser.id)}
          />
        </div>

        <div className="scroll-animate">
          <Statistics 
            employeeData={{
              ...currentUser,
              totalHours: calculateTotalHours(currentUser.id),
              todayHours: calculateTodayHours(currentUser.id)
            }} 
          />
        </div>

        <div className="scroll-animate">
          <WorkCalendar 
            timeEntries={timeEntries.filter(entry => entry.employeeId === currentUser.id)} 
          />
        </div>

        <div className="leaderboard scroll-animate">
          <h2>Leaderboard</h2>
          <div className="leaderboard-list">
            {sortedEmployees.map((employee, index) => (
              <div key={employee.id} className="leaderboard-item">
                <span className="rank">#{index + 1}</span>
                <span className="name">{employee.name}</span>
                <span className="hours">
                  Today: {employee.todayHours.toFixed(2)} hrs | 
                  Total: {employee.totalHours.toFixed(2)} hrs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 