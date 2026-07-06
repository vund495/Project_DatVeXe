import React from 'react';
import { Check, X } from 'lucide-react';
import { currency, timeText } from '../utils';

export default function SuccessModal({ booking, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal success">
        <button type="button" className="close" onClick={onClose}><X size={18} /></button>
        <Check size={44} />
        <h2>Đặt Vé Thành Công!</h2>
        <p>Mã vé điện tử của bạn là: <b style={{ color: 'var(--primary)', fontSize: '20px' }}>{booking.bookingCode}</b></p>
        <div className="success-details">
          <p style={{ margin: '4px 0' }}>Tuyến xe: <b>{booking.trip.origin} {'→'} {booking.trip.destination}</b></p>
          <p style={{ margin: '4px 0' }}>Nhà xe: <b>{booking.trip.operatorName} ({booking.trip.busType})</b></p>
          <p style={{ margin: '4px 0' }}>Khởi hành: <b>{timeText(booking.trip.departureTime)}</b></p>
          <p style={{ margin: '4px 0' }}>Số ghế đặt: <b style={{ color: 'var(--accent)' }}>{booking.seats}</b> ({booking.seatCount} ghế)</p>
          <p style={{ margin: '4px 0' }}>Tổng số tiền: <b>{currency(booking.totalPrice)}</b></p>
          <p style={{ margin: '4px 0' }}>Trạng thái: <span className="badge-status paid">ĐÃ THANH TOÁN</span></p>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Vé điện tử đã được gửi về số điện thoại và email của bạn. Quý khách vui lòng có mặt trước giờ xuất bến 15 phút để làm thủ tục lên xe.</p>
      </div>
    </div>
  );
}
