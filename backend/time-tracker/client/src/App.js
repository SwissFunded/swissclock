import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Login from './Login';
import Statistics from './components/Statistics';
import Profile from './components/Profile';
import ThemeToggle from './components/ThemeToggle';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [employees, setEmployees] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [clockInTime, setClockInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
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

  useEffect(() => {
    let interval;
    if (selectedEmployee && selectedEmployee.isClockedIn) {
      interval = setInterval(() => {
        setCurrentTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedEmployee]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username: username.toLowerCase(),
        password
      });
      
      setCurrentUser(response.data.user);
      setIsLoggedIn(true);
      setLoginError('');
    } catch (error) {
      setLoginError(error.response?.data?.message || 'Invalid username or password');
    }
  };

  const handleLogout = async () => {
    if (selectedEmployee && selectedEmployee.isClockedIn) {
      await handleClockOut(selectedEmployee.id);
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
          const updatedEmployee = { ...emp, isClockedIn: true };
          setSelectedEmployee(updatedEmployee);
          setClockInTime(new Date());
          return updatedEmployee;
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
          setSelectedEmployee(null);
          setClockInTime(null);
          setCurrentTime(0);
          return { 
            ...emp, 
            isClockedIn: false,
            totalHours: calculateTotalHours(employeeId)
          };
        }
        return emp;
      }));
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  // Add function to calculate total hours from time entries
  const calculateTotalHours = (employeeId) => {
    return timeEntries
      .filter(entry => entry.employeeId === employeeId)
      .reduce((total, entry) => {
        if (!entry.endTime && entry.startTime) {
          // For current session
          return total + (new Date() - new Date(entry.startTime)) / (1000 * 60 * 60);
        } else if (entry.endTime && entry.startTime) {
          // For completed sessions
          return total + (new Date(entry.endTime) - new Date(entry.startTime)) / (1000 * 60 * 60);
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