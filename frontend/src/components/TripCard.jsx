import React from 'react';
import { Clock, CalendarDays, Users, MapPin } from 'lucide-react';
import { currency, minutesToText, timeText } from '../utils';

export default function TripCard({ trip, passengers, onBook }) {
  return (
    <article className="trip-card">
      <div className="trip-main">
        <div className="badge">{trip.badge}</div>
        <h3>{trip.origin} <span /> {trip.destination}</h3>
        <p><MapPin size={16} /> {trip.operatorName} - {trip.busType} - {trip.operatorRating} sao</p>
      </div>
      <div className="trip-info">
        <div><Clock size={16} /><b>{timeText(trip.departureTime)}</b><small>Khởi hành</small></div>
        <div><CalendarDays size={16} /><b>{minutesToText(trip.durationMinutes)}</b><small>Thời gian</small></div>
        <div><Users size={16} /><b>{trip.availableSeats}</b><small>Ghế trống</small></div>
      </div>
      <div className="trip-price">
        <small>Giá từ</small>
        <b>{currency(trip.price)}</b>
        <span>{passengers} khách: {currency(Number(trip.price) * passengers)}</span>
        <button onClick={onBook} disabled={trip.availableSeats < passengers}>Đặt vé</button>
      </div>
    </article>
  );
}
