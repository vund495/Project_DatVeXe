import React from 'react';
import { X } from 'lucide-react';
import { currency } from '../utils';

export default function SeatMap({ seatList, bookedSeatList, selectedSeats, onToggle, busType, error }) {
  const totalPrice = 0; /* price calculated by parent */

  return (
    <div className="seat-map-container">
      <div className="seat-map-header">Sơ đồ ghế ({busType})</div>
      <div className="seat-legend">
        <span className="legend-item"><span className="seat-box available" style={{ width: '12px', height: '12px' }}></span>Trống</span>
        <span className="legend-item"><span className="seat-box selected" style={{ width: '12px', height: '12px' }}></span>Chọn</span>
        <span className="legend-item"><span className="seat-box booked" style={{ width: '12px', height: '12px' }}></span>Hết</span>
      </div>
      <div className="bus-layout">
        <div className="steering-wheel">🚌 Tài xế</div>
        <div className="seats-grid">
          {seatList.map((seat) => {
            const isBooked = bookedSeatList.includes(seat);
            const isSelected = selectedSeats.includes(seat);
            let seatClass = "seat-box available";
            if (isBooked) seatClass = "seat-box booked";
            else if (isSelected) seatClass = "seat-box selected";
            return (
              <button key={seat} type="button" className={seatClass} disabled={isBooked} onClick={() => onToggle(seat)}>
                {seat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SeatSelector({ selectedSeats, onToggle, totalPrice, onNext, nextLabel, error }) {
  return (
    <div className="seat-selection-sidebar">
      <div className="selection-summary">
        <h4>Ghế đã chọn</h4>
        {selectedSeats.length > 0 ? (
          <div className="selected-seats-list">
            {selectedSeats.map((s) => (
              <span key={s} className="selected-seat-badge">
                {s} <button type="button" onClick={() => onToggle(s)}><X size={12} /></button>
              </span>
            ))}
          </div>
        ) : (
          <p className="no-seats">Chưa chọn ghế nào</p>
        )}
        <div className="selection-total">
          <span>Tổng cộng</span>
          <b>{currency(totalPrice)}</b>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {onNext && (
        <button className="primary-btn full" onClick={onNext} disabled={selectedSeats.length === 0}>
          {nextLabel || 'Tiếp tục'}
        </button>
      )}
    </div>
  );
}
