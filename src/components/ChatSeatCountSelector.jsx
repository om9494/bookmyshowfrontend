import React from 'react';

const ChatSeatCountSelector = ({ max = 10, onSelect, selectedCount }) => {
  return (
    <div className="chatbot-seat-count-selector">
      <div className="chatbot-seat-count-title">How many seats would you like to book?</div>
      <div className="chatbot-seat-count-list">
        {Array.from({ length: max }, (_, i) => i + 1).map((count) => (
          <button
            key={count}
            className={`chatbot-seat-count-btn${selectedCount === count ? ' selected' : ''}`}
            onClick={() => onSelect(count)}
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSeatCountSelector; 