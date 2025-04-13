import React, { useState, useEffect } from 'react';
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

// Load data from localStorage
const loadFromStorage = () => {
  try {
    const storedEmployees = localStorage.getItem('employees');
    const storedTimeEntries = localStorage.getItem('timeEntries');
    const storedUser = localStorage.getItem('currentUser');

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
  const [lastSync, setLastSync] = useState(Date.now());

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
    localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [employees, timeEntries, currentUser]);

  // Polling for updates
  useEffect(() => {
    const pollInterval = setInterval(() => {
      // Simulate checking for updates
      const now = Date.now();
      if (now - lastSync > 2000) { // Check every 2 seconds
        setLastSync(now);
        // In a real app, this would be an API call to get updates
        const storedEmployees = localStorage.getItem('employees');
        if (storedEmployees) {
          const parsedEmployees = JSON.parse(storedEmployees);
          setEmployees(prevEmployees => {
            // Only update if there are actual changes
            if (JSON.stringify(prevEmployees) !== JSON.stringify(parsedEmployees)) {
              return parsedEmployees;
            }
            return prevEmployees;
          });
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [lastSync]);

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
      // Check if user is already clocked in from localStorage
      const storedEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
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
    localStorage.removeItem('currentUser');
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

    // Update localStorage immediately
    localStorage.setItem('timeEntries', JSON.stringify(updatedTimeEntries));
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    setLastSync(Date.now());
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

    // Update localStorage immediately
    localStorage.setItem('timeEntries', JSON.stringify(updatedTimeEntries));
    localStorage.setItem('employees', JSON.stringify(updatedEmployees));
    setLastSync(Date.now());
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