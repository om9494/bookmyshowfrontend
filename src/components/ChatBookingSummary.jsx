import React from 'react';

const ChatBookingSummary = ({ movie, theater, time, seats, amount, onConfirm }) => {
  return (
    <div className="chatbot-booking-summary">
      <div className="chatbot-booking-summary-title">Booking Summary</div>
      <div className="chatbot-booking-summary-details">
        <div><strong>Movie:</strong> {movie}</div>
        <div><strong>Theater:</strong> {theater}</div>
        <div><strong>Time:</strong> {time}</div>
        <div><strong>Seats:</strong> {seats.join(', ')}</div>
        <div><strong>Total:</strong> ₹{amount}</div>
      </div>
      <button className="chatbot-booking-confirm-btn" onClick={onConfirm}>Confirm Booking</button>
    </div>
  );
};

export default ChatBookingSummary; 