import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { authApi } from '../api';
import { currency, timeText } from '../utils';

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi('/my-bookings')
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Đang tải...</p></div>;

  return (
    <div className="booking-page">
      <header className="booking-page-header">
        <button className="back-btn" onClick={() => navigate('/')}><ArrowLeft size={20} /> Quay lại</button>
        <h1>Vé của tôi</h1>
        <div />
      </header>

      {bookings.length === 0 ? (
        <div className="empty">Bạn chưa có vé nào. <a href="/">Đặt vé ngay</a></div>
      ) : (
        <div className="trip-list">
          {bookings.map((b) => (
            <article className="trip-card" key={b.id} style={{ gridTemplateColumns: '1.5fr 1fr' }}>
              <div>
                <h3 style={{ color: 'var(--primary)', fontSize: '18px', marginBottom: '8px' }}>Mã vé: {b.bookingCode}</h3>
                <p style={{ margin: '8px 0' }}>Tuyến: <b>{b.trip.origin} → {b.trip.destination}</b></p>
                <p style={{ margin: '4px 0', color: 'var(--text-muted)' }}><Clock size={14} /> {timeText(b.trip.departureTime)}</p>
                <p style={{ margin: '4px 0', color: 'var(--text-muted)' }}><MapPin size={14} /> Nhà xe: {b.trip.operatorName}</p>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span className={`badge-status ${b.status === 'PAID' ? 'paid' : 'pending'}`}>
                  {b.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                </span>
                <b style={{ color: 'var(--primary)', fontSize: '20px', marginTop: '10px' }}>{currency(b.totalPrice)}</b>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
