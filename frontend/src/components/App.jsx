import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Clock, LogIn, MapPin, Menu, Navigation, Search, Ticket, Users, X, User } from 'lucide-react';
import { api, authApi } from '../api';
import { getStoredUser, clearAuth } from '../auth';
import { currency, minutesToText, timeText, todayInput } from '../utils';
import { Field, SectionTitle } from './UI';
import TripCard from './TripCard';
import PaymentModal from './PaymentModal';
import SuccessModal from './SuccessModal';
import AIChatbot from './AIChatbot';

export default function App() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const [query, setQuery] = useState({
    origin: 'Hồ Chí Minh',
    destination: 'Đà Nẵng',
    date: todayInput(),
    passengers: 1
  });

  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [booking, setBooking] = useState(null);

  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Xin chào! Tôi là trợ lý ảo VietRide AI. Tôi có thể giúp tìm vé xe, thông tin lịch trình, giá vé và tư vấn chính sách cho bạn. Bạn cần đi đâu?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api('/cities'),
      api('/routes/popular'),
      api(`/trips/search?origin=${encodeURIComponent(query.origin)}&destination=${encodeURIComponent(query.destination)}&date=${query.date}`)
    ])
      .then(([cityData, routeData, tripData]) => {
        setCities(cityData);
        setRoutes(routeData);
        setTrips(tripData);
      })
      .catch((err) => setError(err.message));
  }, []);

  const cityOptions = useMemo(() => cities.map((city) => city.name), [cities]);

  async function searchTrips(event) {
    if (event) event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        origin: query.origin,
        destination: query.destination,
        date: query.date
      });
      const data = await api(`/trips/search?${params}`);
      setTrips(data);
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillRoute(route) {
    setQuery((current) => ({ ...current, origin: route.origin, destination: route.destination }));
    setTimeout(() => {
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function handleLookup(e) {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    try {
      const data = await api(`/bookings/lookup?query=${encodeURIComponent(lookupQuery.trim())}`);
      setLookupResults(data);
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleSendChat(e) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const res = await authApi('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg })
      });
      setChatMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Hệ thống AI đang bận, vui lòng thử lại sau.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    const log = document.getElementById('chat-log');
    if (log) log.scrollTop = log.scrollHeight;
  }, [chatMessages, chatLoading, aiOpen]);

  return (
    <div className="app">
      <nav className="nav">
        <Link className="logo" to="/">VietRide<span>X</span></Link>
        <button className="icon-button menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mo menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <a href="#results" onClick={() => setMenuOpen(false)}>Kết quả</a>
          <a href="#lookup" onClick={() => setMenuOpen(false)}>Tra cứu vé</a>
          <a href="#routes" onClick={() => setMenuOpen(false)}>Tuyến hot</a>
        </div>
        <div className="nav-auth">
          {user ? (
            <div className="nav-auth-dropdown">
              <button className="nav-user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <User size={16} /> {user.name}
              </button>
              {userMenuOpen && (
                <div className="nav-dropdown-menu">
                  <Link to="/my-tickets" onClick={() => setUserMenuOpen(false)}><Ticket size={14} /> Vé của tôi</Link>
                  <Link to="/profile" onClick={() => setUserMenuOpen(false)}><Users size={14} /> Thông tin cá nhân</Link>
                  {user.role === 'admin' && <Link to="/admin" onClick={() => setUserMenuOpen(false)}><Navigation size={14} /> Quản lý</Link>}
                  <button onClick={() => { clearAuth(); setUser(null); setUserMenuOpen(false); }}><LogIn size={14} /> Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <Link className="nav-auth-btn" to="/login"><LogIn size={16} /> Đăng nhập</Link>
          )}
        </div>
      </nav>

      <main>
        <section id="hero" className="hero">
          <div className="hero-bg" />
          <div className="hero-inner">
            <div className="hero-text">
              <h1>Đặt vé xe khách <span>toàn quốc</span></h1>
              <p>Chọn ghế trực quan, thanh toán nhanh, hỗ trợ AI 24/7</p>
            </div>
            <form className="hero-search" onSubmit={searchTrips}>
              <div className="hero-search-grid">
                <div className="hero-field">
                  <label>Điểm đi</label>
                  <select value={query.origin} onChange={(e) => setQuery({ ...query, origin: e.target.value })}>
                    {cityOptions.map((city) => <option key={city}>{city}</option>)}
                  </select>
                </div>
                <div className="hero-field">
                  <label>Điểm đến</label>
                  <select value={query.destination} onChange={(e) => setQuery({ ...query, destination: e.target.value })}>
                    {cityOptions.map((city) => <option key={city}>{city}</option>)}
                  </select>
                </div>
                <div className="hero-field">
                  <label>Ngày đi</label>
                  <input type="date" min={todayInput()} value={query.date} onChange={(e) => setQuery({ ...query, date: e.target.value })} />
                </div>
                <div className="hero-field">
                  <label>Số khách</label>
                  <input min="1" max="8" type="number" value={query.passengers} onChange={(e) => setQuery({ ...query, passengers: Number(e.target.value) })} />
                </div>
              </div>
              <button className="hero-search-btn" disabled={loading}>
                <Search size={18} /> {loading ? 'Đang tìm...' : 'Tìm chuyến'}
              </button>
              {error && <div className="hero-error">{error}</div>}
            </form>
          </div>
        </section>

        <section id="results" className="results section-pad">
          <SectionTitle label="LIVE INVENTORY" title="Chuyến xe phù hợp" accent="hôm nay" />
          <div className="trip-list">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} passengers={query.passengers} onBook={() => navigate(`/booking/${trip.id}`, { state: { trip } })} />
            ))}
            {!trips.length && <div className="empty">Không có chuyến xe phù hợp vào ngày này. Hãy thử chọn các điểm đi/đến khác hoặc thay đổi ngày.</div>}
          </div>
        </section>

        <section id="lookup" className="section-pad">
          <SectionTitle label="TICKET LOOKUP" title="Tra cứu" accent="vé xe" />
          <form className="booking-panel" onSubmit={handleLookup}>
            <div className="panel-title"><Ticket size={18} /> Tra cứu thông tin vé</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                style={{ flex: 1, minWidth: '240px', height: '46px', padding: '0 14px', background: 'var(--bg-tertiary)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }}
                placeholder="Nhập số điện thoại hoặc mã đặt vé (ví dụ: VRX-XXXXX)"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
              />
              <button type="submit" className="primary-btn" disabled={lookupLoading}>Tìm kiếm</button>
            </div>
            {lookupError && <div className="error">{lookupError}</div>}
            {lookupResults.length > 0 && (
              <div className="trip-list" style={{ marginTop: '24px' }}>
                {lookupResults.map((b) => (
                  <article className="trip-card" key={b.id} style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', color: 'var(--primary)', marginBottom: '8px' }}>Mã vé: {b.bookingCode}</h3>
                      <p style={{ margin: '8px 0', fontSize: '15px' }}>
                        Khách hàng: <b>{b.passengerName}</b> | SĐT: {b.passengerPhone}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '15px' }}>
                        Tuyến: <b>{b.trip.origin} {'→'} {b.trip.destination}</b>
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '15px' }}>
                        Số ghế: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{b.seats || b.seatCount + ' ghế'}</span>
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                        Khởi hành: {timeText(b.trip.departureTime)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <span className={`badge-status ${b.status === 'PAID' ? 'paid' : 'pending'}`}>
                          {b.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                        </span>
                        <b style={{ display: 'block', fontSize: '20px', color: 'var(--primary)', marginTop: '10px' }}>{currency(b.totalPrice)}</b>
                      </div>
                      {b.status !== 'PAID' && (
                        <button
                          type="button"
                          className="primary-btn"
                          style={{ minHeight: '36px', height: '36px', padding: '0 16px', fontSize: '11px', marginTop: '10px' }}
                          onClick={() => setPaymentBooking(b)}
                        >
                          Thanh toán ngay
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            {lookupResults.length === 0 && lookupQuery && !lookupLoading && (
              <div className="empty" style={{ marginTop: '24px' }}>Không tìm thấy lịch sử đặt vé phù hợp.</div>
            )}
          </form>
        </section>

        <section id="routes" className="section-pad">
          <SectionTitle label="HOT ROUTES" title="Tuyến phổ biến" accent="Việt Nam" />
          <div className="routes-grid">
            {routes.map((route) => (
              <button className="route-card" key={route.id} onClick={() => fillRoute(route)}>
                <div className="badge">{route.badge}</div>
                <div className="route-line"><b>{route.origin}</b><span /> <b>{route.destination}</b></div>
                <div className="route-meta">
                  <small>{minutesToText(route.durationMinutes)}</small>
                  <small>Từ {currency(route.minPrice)}</small>
                  <small>{route.availableSeats} ghế</small>
                </div>
              </button>
            ))}
          </div>
        </section>

      </main>

      <footer>
        <div className="footer-inner">
          <a className="logo" href="#hero">VietRide<span>X</span></a>
          <p className="footer-copy">© VietRideX 2026. All rights reserved.</p>
        </div>
      </footer>

      <div className="ai-float">
        <AIChatbot open={aiOpen} onClose={() => setAiOpen(false)} messages={chatMessages} setMessages={setChatMessages} input={chatInput} setInput={setChatInput} loading={chatLoading} setLoading={setChatLoading} handleSend={handleSendChat} />
        <button className="ai-button" onClick={() => setAiOpen(!aiOpen)} aria-label="AI assistant"><Bot size={24} /></button>
      </div>

      {paymentBooking && (
        <PaymentModal
          booking={paymentBooking}
          onClose={() => setPaymentBooking(null)}
          onPaid={(paidBooking) => {
            setPaymentBooking(null);
            setBooking(paidBooking);
            if (lookupQuery) {
              api(`/bookings/lookup?query=${encodeURIComponent(lookupQuery.trim())}`).then(setLookupResults).catch(() => {});
            }
          }}
        />
      )}

      {booking && <SuccessModal booking={booking} onClose={() => setBooking(null)} />}
    </div>
  );
}
