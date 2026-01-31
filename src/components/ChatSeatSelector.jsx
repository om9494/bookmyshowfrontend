import React from 'react';

const ChatSeatSelector = ({ seatRows, soldSeats, selectedSeats, onSelect, seatCount, onProceed }) => {
  const handleSelect = (row, num) => {
    const seatId = row + num;
    if (selectedSeats.includes(seatId)) {
      onSelect(selectedSeats.filter((s) => s !== seatId));
    } else if (selectedSeats.length < seatCount) {
      onSelect([...selectedSeats, seatId]);
    }
  };

  return (
    <div className="chatbot-seat-selector">
      <div className="chatbot-seat-selector-title">Select your seats:</div>
      <div className="chatbot-seat-map">
        {seatRows.map((row) => (
          <div key={row.label} className="chatbot-seat-row">
            <span className="chatbot-seat-row-label">{row.label}</span>
            <div className="chatbot-seat-row-seats">
              {Array.from({ length: row.count }, (_, i) => {
                const seatId = row.label + (i + 1);
                const isSold = soldSeats.includes(seatId);
                const isSelected = selectedSeats.includes(seatId);
                return (
                  <button
                    key={seatId}
                    disabled={isSold}
                    className={`chatbot-seat-btn${isSold ? ' sold' : ''}${isSelected ? ' selected' : ''}`}
                    onClick={() => handleSelect(row.label, i + 1)}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <span className="chatbot-seat-row-price">Rs. {row.price} {row.type}</span>
          </div>
        ))}
      </div>
      <button
        className="chatbot-booking-confirm-btn"
        style={{ marginTop: 16 }}
        disabled={selectedSeats.length !== seatCount}
        onClick={() => onProceed(selectedSeats)}
      >
        Proceed
      </button>
    </div>
  );
};

export default ChatSeatSelector; 