import React from 'react';
import './Profile.css';

function Profile({ employee, timeEntries }) {
  // Calculate total time worked today
  const getTotalHoursToday = () => {
    const today = new Date().setHours(0, 0, 0, 0);
    return timeEntries
      .filter(entry => new Date(entry.startTime).setHours(0, 0, 0, 0) === today)
      .reduce((total, entry) => {
        const duration = entry.endTime 
          ? (new Date(entry.endTime) - new Date(entry.startTime)) / 3600000
          : (new Date() - new Date(entry.startTime)) / 3600000;
        return total + duration;
      }, 0);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="profile-section">
      <div className="profile-header">
        <div className="profile-avatar">
          {employee.name.charAt(0)}
        </div>
        <div className="profile-info">
          <h3>{employee.name}</h3>
          <span className="profile-status">
            {employee.isClockedIn ? '🟢 Active Now' : '⚪ Away'}
          </span>
        </div>
        <div className="time-worked">
          <div className="time-worked-label">Time Worked Today</div>
          <div className="time-worked-value">
            {getTotalHoursToday().toFixed(2)} hrs
          </div>
        </div>
      </div>
      
      <div className="time-entries">
        <h4>Today's Activity</h4>
        <div className="timeline">
          {timeEntries
            .filter(entry => {
              const today = new Date().setHours(0, 0, 0, 0);
              return new Date(entry.startTime).setHours(0, 0, 0, 0) === today;
            })
            .map((entry, index) => (
              <div key={index} className="timeline-entry">
                <div className="time-point"></div>
                <div className="time-details">
                  <div className="time-range">
                    <span>{formatTime(entry.startTime)}</span>
                    {entry.endTime && (
                      <>
                        <span className="time-separator">→</span>
                        <span>{formatTime(entry.endTime)}</span>
                      </>
                    )}
                  </div>
                  <div className="session-duration">
                    {entry.endTime ? (
                      `${((new Date(entry.endTime) - new Date(entry.startTime)) / 3600000).toFixed(2)} hours`
                    ) : (
                      'Current Session'
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="notifications">
        <div className="notification">
          <span className="notification-dot"></span>
          {employee.isClockedIn ? 'Currently on shift' : 'Not clocked in'}
        </div>
        {employee.isClockedIn && (
          <div className="notification">
            <span className="notification-dot"></span>
            Break reminder in 30 minutes
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile; 