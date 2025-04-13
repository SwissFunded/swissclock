import React, { useState, useEffect } from 'react';
import './App.css';
import './animations.css';
import Login from './Login';
import Statistics from './components/Statistics';
import Profile from './components/Profile';
import ThemeToggle from './components/ThemeToggle';
import WorkCalendar from './components/WorkCalendar';

// Create a broadcast channel for real-time updates
const clockChannel = new BroadcastChannel('clock_status');

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
    const storedEmployees = localStorage.getItem('sharedEmployees');
    const storedTimeEntries = localStorage.getItem('sharedTimeEntries');
    const storedUser = sessionStorage.getItem('currentUser');

    return {
      employees: storedEmployees ? JSON.parse(storedEmployees) : Object.values(USERS).map(({ password, ...user }) => user),
      timeEntries: storedTimeEntries ? JSON.parse(storedTimeEntries) : [],
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

  // Save shared data to localStorage
  useEffect(() => {
    localStorage.setItem('sharedEmployees', JSON.stringify(employees));
    localStorage.setItem('sharedTimeEntries', JSON.stringify(timeEntries));
  }, [employees, timeEntries]);

  // Save current user to sessionStorage
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Listen for broadcast updates
  useEffect(() => {
    const handleBroadcast = (event) => {
      const { type, data } = event.data;
      if (type === 'UPDATE_EMPLOYEES') {
        setEmployees(data);
      } else if (type === 'UPDATE_TIME_ENTRIES') {
        setTimeEntries(data);
      }
    };

    clockChannel.addEventListener('message', handleBroadcast);
    return () => {
      clockChannel.removeEventListener('message', handleBroadcast);
    };
  }, []);

  const broadcastUpdates = (type, data) => {
    clockChannel.postMessage({ type, data });
  };

  // Add scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.scroll-animate').forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleLogin = (username, password) => {
    console.log('Login attempt:', { username, password });
    const user = USERS[username.toLowerCase()];

    if (user && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      // Get the latest status from shared storage
      const storedEmployees = JSON.parse(localStorage.getItem('sharedEmployees') || '[]');
      const storedUser = storedEmployees.find(emp => emp.id === userWithoutPassword.id);
      if (storedUser) {
        userWithoutPassword.isClockedIn = storedUser.isClockedIn;
      }
      setCurrentUser(userWithoutPassword);
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    if (currentUser && employees.find(emp => emp.id === currentUser.id)?.isClockedIn) {
      handleClockOut(currentUser.id);
    }
    sessionStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  const handleClockIn = (employeeId) => {
    const now = new Date();
    const newTimeEntry = {
      id: Date.now(),
      employeeId,
      clockInTime: now,
      clockOutTime: null
    };
    
    const updatedTimeEntries = [...timeEntries, newTimeEntry];
    setTimeEntries(updatedTimeEntries);
    
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        return { ...emp, isClockedIn: true };
      }
      return emp;
    });
    setEmployees(updatedEmployees);

    // Broadcast updates to other users
    broadcastUpdates('UPDATE_EMPLOYEES', updatedEmployees);
    broadcastUpdates('UPDATE_TIME_ENTRIES', updatedTimeEntries);
  };

  const handleClockOut = (employeeId) => {
    const now = new Date();
    const updatedTimeEntries = timeEntries.map(entry => {
      if (entry.employeeId === employeeId && !entry.clockOutTime) {
        return { ...entry, clockOutTime: now };
      }
      return entry;
    });
    setTimeEntries(updatedTimeEntries);
    
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        return { ...emp, isClockedIn: false };
      }
      return emp;
    });
    setEmployees(updatedEmployees);

    // Broadcast updates to other users
    broadcastUpdates('UPDATE_EMPLOYEES', updatedEmployees);
    broadcastUpdates('UPDATE_TIME_ENTRIES', updatedTimeEntries);
  };

  const calculateTotalHours = (employeeId) => {
    const employeeEntries = timeEntries.filter(entry => entry.employeeId === employeeId);
    return employeeEntries.reduce((total, entry) => {
      if (entry.clockOutTime) {
        const duration = new Date(entry.clockOutTime) - new Date(entry.clockInTime);
        return total + duration / (1000 * 60 * 60);
      }
      return total;
    }, 0);
  };

  const sortedEmployees = [...employees].map(emp => ({
    ...emp,
    totalHours: calculateTotalHours(emp.id)
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
                    Total Hours: {calculateTotalHours(employee.id).toFixed(2)}
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
          />
        </div>

        <div className="scroll-animate">
          <Statistics 
            employeeData={{
              ...currentUser,
              totalHours: calculateTotalHours(currentUser.id)
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
                <span className="hours">{employee.totalHours.toFixed(2)} hours</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 