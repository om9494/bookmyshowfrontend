import React from 'react';

const ChatTheaterSelector = ({ theaters, onSelect, selectedTheater }) => {
  return (
    <div className="chatbot-theater-selector">
      <div className="chatbot-theater-selector-title">Select a theater:</div>
      <div className="chatbot-theater-selector-list">
        {theaters.map((theater) => (
          <button
            key={theater.id}
            className={`chatbot-theater-btn${selectedTheater === theater.id ? ' selected' : ''}`}
            onClick={() => onSelect(theater)}
          >
            {theater.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatTheaterSelector; 