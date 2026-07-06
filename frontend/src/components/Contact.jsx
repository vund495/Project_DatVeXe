import React, { useState } from 'react';
import { Phone, MessageSquare, Mail, X } from 'lucide-react'; 

export default function Contact() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="contact-floating-container">
      {isOpen && (
        <div className="contact-popup-box">
          <div className="popup-header">
            <h3>Liên Hệ Với Chúng Tôi</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>
          
          <div className="popup-body">
            {/* Hotline */}
            <a href="tel:0369133273" className="popup-item">
              <div className="icon-wrapper phone-icon">
                <Phone size={18} />
              </div>
              <div>
                <p className="label">Hotline</p>
                <p className="value">0369 133 273</p>
              </div>
            </a>
            
            {/* Zalo */}
            <a href="https://zalo.me/0369133273" target="_blank" rel="noreferrer" className="popup-item">
              <div className="icon-wrapper zalo-icon">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="label">Zalo Chat</p>
                <p className="value">Hỗ trợ 24/7</p>
              </div>
            </a>

            {/* Email */}
            <a href="mailto:nguyenvu040905@gmail.com" className="popup-item">
              <div className="icon-wrapper mail-icon">
                <Mail size={18} />
              </div>
              <div>
                <p className="label">Email</p>
                <p className="value">nguyenvu040905@gmail.com</p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Cục nút tròn kích hoạt (Trigger) */}
      <button 
        className={`contact-trigger-btn ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Liên hệ hỗ trợ"
      >
        {isOpen ? <X size={22} /> : <Phone size={22} />}
      </button>
    </div>
  );
}