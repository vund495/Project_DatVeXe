import React from 'react';
import { SectionTitle } from './UI';

const REVIEWS = [
  ['TH', 'Trần Hương', 'Đặt vé từ HCM đi Đà Lạt chỉ mất 1 phút. Sơ đồ ghế chọn rất rõ ràng, giả lập quét VietQR nhận vé lập tức.'],
  ['NL', 'Nguyễn Long', 'Trợ lý AI hỗ trợ siêu đỉnh! Hỏi lịch trình sapa trả lời rất nhanh và chính xác lịch đi.'],
  ['PM', 'Phạm Minh', 'Tiện ích tra cứu vé bằng SĐT rất tiện lợi, lấy lại thông tin mã vé điện tử nhanh chóng khi cần lên xe.'],
];

export default function ReviewsSection() {
  return (
    <section className="section-pad reviews">
      <SectionTitle label="USER REVIEWS" title="Khách hàng" accent="nói gì" />
      <div className="review-grid">
        {REVIEWS.map(([avatar, name, text]) => (
          <div className="review-card" key={name}>
            <div className="quote">"</div>
            <p>{text}</p>
            <div className="author"><span>{avatar}</span><b>{name}</b></div>
          </div>
        ))}
      </div>
    </section>
  );
}
