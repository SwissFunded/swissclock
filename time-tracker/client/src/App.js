import React, { useState } from 'react';
import './App.css';
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

function App() {
  const [employees, setEmployees] = useState(Object.values(USERS).map(({ password, ...user }) => user));
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');

  const handleLogin = (username, password) => {
    console.log('Login attempt:', { username, password });
    const user = USERS[username.toLowerCase()];

    if (user && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
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
    
    setTimeEntries([...timeEntries, newTimeEntry]);
    setEmployees(employees.map(emp => {
      if (emp.id === employeeId) {
        return { ...emp, isClockedIn: true };
      }
      return emp;
    }));
  };

  const handleClockOut = (employeeId) => {
    const now = new Date();
    setTimeEntries(timeEntries.map(entry => {
      if (entry.employeeId === employeeId && !entry.clockOutTime) {
        return { ...entry, clockOutTime: now };
      }
      return entry;
    }));
    
    setEmployees(employees.map(emp => {
      if (emp.id === employeeId) {
        return { ...emp, isClockedIn: false };
      }
      return emp;
    }));
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
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="App">
      <div className="time-tracker-container">
        <h1>SwissClock</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout ({currentUser.name})
        </button>
        <ThemeToggle />
        
        <div className="employee-section">
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

        <Profile 
          employee={currentUser} 
          timeEntries={timeEntries.filter(entry => entry.employeeId === currentUser.id)}
        />
        <Statistics 
          employeeData={{
            ...currentUser,
            totalHours: calculateTotalHours(currentUser.id)
          }} 
        />

        <WorkCalendar 
          timeEntries={timeEntries.filter(entry => entry.employeeId === currentUser.id)} 
        />

        <div className="leaderboard">
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