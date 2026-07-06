import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { authApi } from '../api';
import { currency, timeText } from '../utils';

export default function PaymentModal({ booking, onClose, onPaid }) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  async function handlePay() {
    setPaying(true);
    setError('');
    try {
      const updated = await authApi(`/bookings/${booking.id}/pay`, { method: 'POST' });
      onPaid(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  const bankInfo = {
    bin: 'BIDV',
    account: '7621982567',
    name: 'VIETRIDE X TRANSIT',
  };
  const qrUrl = `https://img.vietqr.io/image/${bankInfo.bin}-${bankInfo.account}-compact.png?amount=${booking.totalPrice}&addInfo=VietRideX%20${booking.bookingCode}`;

  return (
    <div className="modal-backdrop">
      <div className="modal payment-modal">
        <button type="button" className="close" onClick={onClose}><X size={18} /></button>
        <div className="panel-title"><ShieldCheck size={18} /> Cổng thanh toán quét mã VietQR</div>
        <p className="modal-route">Mã đặt vé: <b>{booking.bookingCode}</b></p>

        <div className="payment-grid">
          <div className="qr-container">
            {timeLeft > 0 ? (
              <img src={qrUrl} alt="VietQR code" className="qr-image" />
            ) : (
              <div className="qr-expired">Mã QR hết hạn</div>
            )}
            <div className="timer">
              Mã giao dịch hết hiệu lực sau: <b style={{ color: 'var(--accent)' }}>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</b>
            </div>
          </div>

          <div className="payment-info">
            <div className="pay-row"><span>Hành trình:</span><b>{booking.trip.origin} {'→'} {booking.trip.destination}</b></div>
            <div className="pay-row"><span>Khởi hành:</span><b>{timeText(booking.trip.departureTime)}</b></div>
            <div className="pay-row"><span>Vị trí ghế:</span><b>{booking.seats}</b></div>
            <div className="pay-row"><span>Tổng số tiền:</span><b style={{ color: 'var(--primary)', fontSize: '20px' }}>{currency(booking.totalPrice)}</b></div>

            <div className="bank-details">
              <div>Ngân hàng: <b>{bankInfo.bin}</b></div>
              <div>Số tài khoản: <b>{bankInfo.account}</b></div>
              <div>Tên người nhận: <b>{bankInfo.name}</b></div>
              <div>Nội dung thanh toán: <b style={{ color: 'var(--accent)' }}>VietRideX {booking.bookingCode}</b></div>
            </div>

            {error && <div className="error">{error}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button type="button" className="secondary-btn" style={{ flex: 1 }} onClick={onClose}>Hủy bỏ</button>
              <button type="button" className="primary-btn" style={{ flex: 1.5 }} onClick={handlePay} disabled={paying || timeLeft <= 0}>
                {paying ? 'Đang đối soát...' : 'Giả lập đã thanh toán'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
