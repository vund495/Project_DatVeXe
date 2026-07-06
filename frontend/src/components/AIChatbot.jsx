import React from 'react';
import { X } from 'lucide-react';

export default function AIChatbot({ open, onClose, messages, setMessages, input, setInput, loading, setLoading, handleSend }) {
  if (!open) return null;

  return (
    <div className="ai-popup chat-window">
      <div className="chat-header">
        <span>Trợ lý ảo VietRide AI</span>
        <button className="close-chat" onClick={onClose}><X size={16} /></button>
      </div>
      <div id="chat-log" className="chat-log">
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-message ${m.role}`}>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <div className="bubble loading-dots">AI đang trả lời<span>.</span><span>.</span><span>.</span></div>
          </div>
        )}
      </div>
      <form onSubmit={handleSend} className="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi về giá vé, tuyến xe, lịch trình, chính sách..."
          disabled={loading}
        />
        <button type="submit" className="send-btn" disabled={loading || !input.trim()}>Gửi</button>
      </form>
    </div>
  );
}
