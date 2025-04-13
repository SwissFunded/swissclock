import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Login from './Login';
import Statistics from './components/Statistics';
import Profile from './components/Profile';
import ThemeToggle from './components/ThemeToggle';

const API_URL = '/api';

function App() {
  const [employees, setEmployees] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');

  // Fetch employees and time entries
  useEffect(() => {
    if (isLoggedIn) {
      fetchEmployees();
      fetchTimeEntries();
      // Set up polling for real-time updates
      const pollInterval = setInterval(() => {
        fetchEmployees();
        fetchTimeEntries();
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(pollInterval);
    }
  }, [isLoggedIn]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      const response = await axios.get(`${API_URL}/time-entries`);
      setTimeEntries(response.data);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      console.log('Attempting login with:', { username, password });
      const response = await axios.post('/api/auth/login', {
        email: username,
        password: password
      });
      
      console.log('Login successful:', response.data);
      setCurrentUser(response.data.user);
      setIsLoggedIn(true);
      setLoginError('');
    } catch (error) {
      console.error('Login failed:', error.response?.data || error);
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = async () => {
    if (currentUser && employees.find(emp => emp.id === currentUser.id)?.isClockedIn) {
      await handleClockOut(currentUser.id);
    }
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  const handleClockIn = async (employeeId) => {
    try {
      const response = await axios.post(`${API_URL}/clock-in`, { employeeId });
      const newTimeEntry = response.data;
      
      setTimeEntries([...timeEntries, newTimeEntry]);
      setEmployees(employees.map(emp => {
        if (emp.id === employeeId) {
          return { ...emp, isClockedIn: true };
        }
        return emp;
      }));
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async (employeeId) => {
    try {
      const response = await axios.post(`${API_URL}/clock-out`, { employeeId });
      const updatedTimeEntry = response.data;
      
      setTimeEntries(timeEntries.map(entry => 
        entry.id === updatedTimeEntry.id ? updatedTimeEntry : entry
      ));
      setEmployees(employees.map(emp => {
        if (emp.id === employeeId) {
          return { ...emp, isClockedIn: false };
        }
        return emp;
      }));
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