import React from 'react';

const ChatDatePicker = ({ dates, onSelect, selectedDate }) => {
  return (
    <div className="chatbot-date-picker">
      <div className="chatbot-date-picker-title">Select a date:</div>
      <div className="chatbot-date-picker-list">
        {dates.map((date) => (
          <button
            key={date}
            className={`chatbot-date-btn${selectedDate === date ? ' selected' : ''}`}
            onClick={() => onSelect(date)}
          >
            {date}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatDatePicker; 