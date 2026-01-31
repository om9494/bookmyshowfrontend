import React from 'react';

const ChatShowtimeSelector = ({ showtimes, onSelect, selectedShowtime }) => {
  return (
    <div className="chatbot-showtime-selector">
      <div className="chatbot-showtime-selector-title">Select a showtime:</div>
      <div className="chatbot-showtime-selector-list">
        {showtimes.map((show) => (
          <button
            key={show.showId}
            className={`chatbot-showtime-btn${selectedShowtime === show.showId ? ' selected' : ''}`}
            onClick={() => onSelect(show)}
          >
            {show.showTime}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatShowtimeSelector; 