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

function App() {
  const { employees: initialEmployees, timeEntries: initialTimeEntries, currentUser: initialUser } = loadFromStorage();
  const [employees, setEmployees] = useState(initialEmployees);
  const [timeEntries, setTimeEntries] = useState(initialTimeEntries);
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialUser);
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [loginError, setLoginError] = useState('');

  // Create a broadcast channel for real-time updates
  const broadcastChannel = useMemo(() => new BroadcastChannel('swissclock-updates'), []);

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

  // Poll for status updates every second
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
          const status = await response.json();
          const updatedEmployees = employees.map(emp => ({
            ...emp,
            isClockedIn: status[emp.id]?.isClockedIn || false
          }));
          setEmployees(updatedEmployees);
          
          // Update current user's status if they're logged in
          if (currentUser && status[currentUser.id]) {
            setCurrentUser(prev => ({ ...prev, isClockedIn: status[currentUser.id].isClockedIn }));
          }
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, [employees, currentUser]);

  const handleLogin = (username, password) => {
    console.log('Login attempt:', { username, password });
    const user = USERS[username.toLowerCase()];

    if (user && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      // Get the latest status from shared storage
      const storedData = localStorage.getItem('sharedData');
      const { employees: storedEmployees = [] } = storedData ? JSON.parse(storedData) : {};
      const storedUser = storedEmployees.find(emp => emp.id === userWithoutPassword.id);
      
      if (storedUser) {
        userWithoutPassword.isClockedIn = storedUser.isClockedIn;
      }
      
      setCurrentUser(userWithoutPassword);
      setIsLoggedIn(true);
      setLoginError('');
      
      // Update shared data with the new user status
      const updatedEmployees = employees.map(emp => 
        emp.id === userWithoutPassword.id ? userWithoutPassword : emp
      );
      updateSharedData(updatedEmployees, timeEntries);
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    if (currentUser && employees.find(emp => emp.id === currentUser.id)?.isClockedIn) {
      handleClockOut(currentUser.id);
    }
    setCurrentUser(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('currentUser');
  };

  const handleClockIn = async (employeeId) => {
    try {
      const now = new Date();
      const newTimeEntry = {
        id: Date.now(),
        employeeId,
        clockInTime: now,
        clockOutTime: null
      };
      
      const updatedTimeEntries = [...timeEntries, newTimeEntry];
      setTimeEntries(updatedTimeEntries);
      
      // Update status on the server
      const response = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, action: 'clockIn' })
      });

      if (response.ok) {
        const status = await response.json();
        const updatedEmployees = employees.map(emp => ({
          ...emp,
          isClockedIn: status[emp.id]?.isClockedIn || false
        }));
        setEmployees(updatedEmployees);
        
        if (currentUser && currentUser.id === employeeId) {
          setCurrentUser(prev => ({ ...prev, isClockedIn: true }));
        }
      }
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async (employeeId) => {
    try {
      const now = new Date();
      const updatedTimeEntries = timeEntries.map(entry => {
        if (entry.employeeId === employeeId && !entry.clockOutTime) {
          return { ...entry, clockOutTime: now };
        }
        return entry;
      });
      setTimeEntries(updatedTimeEntries);
      
      // Update status on the server
      const response = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, action: 'clockOut' })
      });

      if (response.ok) {
        const status = await response.json();
        const updatedEmployees = employees.map(emp => ({
          ...emp,
          isClockedIn: status[emp.id]?.isClockedIn || false
        }));
        setEmployees(updatedEmployees);
        
        if (currentUser && currentUser.id === employeeId) {
          setCurrentUser(prev => ({ ...prev, isClockedIn: false }));
        }
      }
    } catch (error) {
      console.error('Error clocking out:', error);
    }
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
                    {employee.isClockedIn ? '🟢 Clocked In' : '⚪ Clocked Out'}
                  </span>
                  <span className="total-hours">
                    Today: {calculateTodayHours(employee.id).toFixed(2)} hrs
                  </span>
                  <span className="total-hours">
                    Total: {calculateTotalHours(employee.id).toFixed(2)} hrs
                  </span>
                </div>
                {employee.id === currentUser.id && (
                  !employee.isClockedIn ? (
                    <button 
                      className="timer-button"
                      onClick={() => handleClockIn(employee.id)}
                    >
                      Clock In
                    </button>
                  ) : (
                    <button 
                      className="timer-button"
                      onClick={() => handleClockOut(employee.id)}
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