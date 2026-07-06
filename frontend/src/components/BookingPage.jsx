import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { api, authApi } from '../api';
import { currency, getSeatList, minutesToText, timeText } from '../utils';
import { Field } from './UI';
import SeatMap, { SeatSelector } from './SeatMap';
import PaymentModal from './PaymentModal';
import SuccessModal from './SuccessModal';

export default function BookingPage() {
  const { tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(location.state?.trip || null);
  const [loading, setLoading] = useState(!trip);
  const [error, setError] = useState('');

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ passengerName: '', passengerPhone: '', passengerEmail: '' });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [saving, setSaving] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!trip && tripId) {
      api(`/trips/${tripId}`)
        .then((data) => { setTrip(data); setLoading(false); })
        .catch((err) => { setError(err.message); setLoading(false); });
    }
  }, [tripId]);

  const seatList = useMemo(() => trip ? getSeatList(trip.busType) : [], [trip]);
  const bookedSeatList = useMemo(() => {
    if (!trip) return [];
    const bookedCount = trip.totalSeats - trip.availableSeats;
    return seatList.slice(0, Math.min(bookedCount, seatList.length));
  }, [trip, seatList]);

  const totalPrice = trip ? Number(trip.price) * selectedSeats.length : 0;

  function toggleSeat(seat) {
    if (bookedSeatList.includes(seat)) return;
    setSelectedSeats((curr) => {
      if (curr.includes(seat)) {
        return curr.filter((s) => s !== seat);
      } else {
        if (curr.length >= 8) {
          setError('Chỉ đặt tối đa 8 ghế một lần.');
          return curr;
        }
        setError('');
        return [...curr, seat];
      }
    });
  }

  function goToConfirm() {
    if (selectedSeats.length === 0) {
      setError('Vui lòng chọn ít nhất 1 vị trí ghế.');
      return;
    }
    setError('');
    setStep(2);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await authApi('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          tripId: trip.id,
          seatCount: selectedSeats.length,
          seats: selectedSeats.join(', ')
        })
      });
      setPaymentBooking(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Đang tải thông tin chuyến...</p></div>;
  if (error && !trip) return <div className="page-loading"><p className="error">{error}</p><button className="primary-btn" onClick={() => navigate('/')}>Về trang chủ</button></div>;
  if (!trip) return null;

  return (
    <div className="booking-page">
      <header className="booking-page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} /> Quay lại
        </button>
        <h1>Đặt vé</h1>
        <div />
      </header>

      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-num">{step > 1 ? <Check size={14} /> : 1}</span>
          <span className="step-label">Chọn ghế</span>
        </div>
        <div className="step-line" />
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-num">2</span>
          <span className="step-label">Xác nhận</span>
        </div>
      </div>

      <div className="booking-page-content">
        {step === 1 && (
          <div className="booking-step-1">
            <div className="ticket-detail-header">
              <h2 className="ticket-route">{trip.origin} <ArrowRight size={18} /> {trip.destination}</h2>
            </div>

            <div className="ticket-info-grid">
              <div className="ticket-info-item">
                <CalendarDays size={18} />
                <div><small>Khởi hành</small><b>{timeText(trip.departureTime)}</b></div>
              </div>
              <div className="ticket-info-item">
                <Clock size={18} />
                <div><small>Thời gian</small><b>{minutesToText(trip.durationMinutes)}</b></div>
              </div>
              <div className="ticket-info-item">
                <MapPin size={18} />
                <div><small>Nhà xe</small><b>{trip.operatorName}</b></div>
              </div>
              <div className="ticket-info-item">
                <Users size={18} />
                <div><small>Loại xe</small><b>{trip.busType} ({trip.operatorRating}★)</b></div>
              </div>
            </div>

            <div className="ticket-price-display">
              <small>Giá vé</small>
              <b>{currency(trip.price)}</b>
              <small className="per-person">/ người</small>
            </div>

            <div className="booking-modal-grid">
              <SeatMap
                seatList={seatList}
                bookedSeatList={bookedSeatList}
                selectedSeats={selectedSeats}
                onToggle={toggleSeat}
                busType={trip.busType}
              />
              <SeatSelector
                selectedSeats={selectedSeats}
                onToggle={toggleSeat}
                totalPrice={totalPrice}
                onNext={goToConfirm}
                nextLabel="Tiếp tục"
                error={error}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <form className="booking-step-2" onSubmit={submit}>
            <div className="panel-title"><Check size={18} /> Xác nhận & Thanh toán</div>

            <div className="confirm-section">
              <h4 className="confirm-heading">Thông tin chuyến đi</h4>
              <div className="confirm-details">
                <div className="confirm-row"><span>Tuyến</span><b>{trip.origin} → {trip.destination}</b></div>
                <div className="confirm-row"><span>Khởi hành</span><b>{timeText(trip.departureTime)}</b></div>
                <div className="confirm-row"><span>Nhà xe</span><b>{trip.operatorName} ({trip.busType})</b></div>
                <div className="confirm-row"><span>Ghế</span><b>{selectedSeats.join(', ')}</b></div>
                <div className="confirm-row total-row"><span>Tổng tiền</span><b className="price-highlight">{currency(totalPrice)}</b></div>
              </div>
            </div>

            <div className="confirm-section">
              <h4 className="confirm-heading">Thông tin hành khách</h4>
              <div className="confirm-form">
                <Field label="Họ tên"><input required value={form.passengerName} onChange={(e) => setForm({ ...form, passengerName: e.target.value })} placeholder="Nhập họ và tên" /></Field>
                <Field label="Số điện thoại"><input required value={form.passengerPhone} onChange={(e) => setForm({ ...form, passengerPhone: e.target.value })} placeholder="Nhập số điện thoại" /></Field>
                <Field label="Email"><input type="email" value={form.passengerEmail} onChange={(e) => setForm({ ...form, passengerEmail: e.target.value })} placeholder="Nhập email (không bắt buộc)" /></Field>
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="confirm-actions">
              <button type="button" className="secondary-btn" onClick={() => setStep(1)}>Quay lại</button>
              <button type="submit" className="primary-btn" style={{ flex: 1 }} disabled={saving}>
                {saving ? 'Đang xử lý...' : 'Xác nhận đặt vé'}
              </button>
            </div>
          </form>
        )}
      </div>

      {paymentBooking && (
        <PaymentModal
          booking={paymentBooking}
          onClose={() => setPaymentBooking(null)}
          onPaid={(paidBooking) => {
            setPaymentBooking(null);
            setBooking(paidBooking);
          }}
        />
      )}

      {booking && (
        <SuccessModal
          booking={booking}
          onClose={() => { setBooking(null); navigate('/'); }}
        />
      )}
    </div>
  );
}
