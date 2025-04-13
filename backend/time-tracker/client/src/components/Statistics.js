import React from 'react';
import './Statistics.css';

function Statistics({ employeeData }) {
  return (
    <div className="statistics-section">
      <h2>Statistics</h2>
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-header">Hours This Week</div>
          <div className="stats-value">{employeeData.weeklyHours?.toFixed(1) || '0.0'}</div>
          <div className="stats-chart">
            {/* Chart placeholder - we'll add actual charts later */}
            <div className="chart-bars">
              <div className="bar" style={{ height: '60%' }}></div>
              <div className="bar" style={{ height: '80%' }}></div>
              <div className="bar" style={{ height: '40%' }}></div>
              <div className="bar" style={{ height: '90%' }}></div>
              <div className="bar" style={{ height: '70%' }}></div>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-header">Average Daily Hours</div>
          <div className="stats-value">{employeeData.avgDailyHours?.toFixed(1) || '0.0'}</div>
          <div className="stats-trend">
            <span className="trend-indicator">↑</span>
            <span className="trend-value">2.1%</span>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-header">Productivity Score</div>
          <div className="stats-value">92<span className="small">%</span></div>
          <div className="circular-progress">
            <svg viewBox="0 0 36 36">
              <path d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#eee"
                strokeWidth="2"
              />
              <path d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#000"
                strokeWidth="2"
                strokeDasharray="92, 100"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics; 