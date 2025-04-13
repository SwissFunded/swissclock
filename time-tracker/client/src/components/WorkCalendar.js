import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './WorkCalendar.css';

function WorkCalendar({ timeEntries }) {
  const [date, setDate] = useState(new Date());

  // Calculate hours worked for a specific date
  const getHoursForDate = (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const entriesForDay = timeEntries.filter(entry => {
      const clockIn = new Date(entry.clockInTime);
      return clockIn >= startOfDay && clockIn <= endOfDay;
    });

    return entriesForDay.reduce((total, entry) => {
      if (entry.clockOutTime) {
        const duration = new Date(entry.clockOutTime) - new Date(entry.clockInTime);
        return total + duration / (1000 * 60 * 60);
      }
      return total;
    }, 0);
  };

  // Custom tile content to show hours worked
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hours = getHoursForDate(date);
      return hours > 0 ? (
        <div className="hours-worked">
          {hours.toFixed(1)}h
        </div>
      ) : null;
    }
  };

  return (
    <div className="work-calendar">
      <h2>Work Calendar</h2>
      <Calendar
        onChange={setDate}
        value={date}
        tileContent={tileContent}
        className="calendar-container"
      />
      <div className="selected-date-info">
        <h3>Hours on {date.toLocaleDateString()}</h3>
        <p>{getHoursForDate(date).toFixed(2)} hours worked</p>
      </div>
    </div>
  );
}

export default WorkCalendar; 