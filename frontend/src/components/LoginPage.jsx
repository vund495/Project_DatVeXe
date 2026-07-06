import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { LogIn,LogOut } from 'lucide-react';
import { login, getStoredUser } from '../auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Đăng nhập</h1>
        <p className="auth-sub">Đăng nhập để quản lý vé của bạn</p>
        <form onSubmit={submit}>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          </div>
          <div className="auth-field">
            <label>Mật khẩu</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="primary-btn full" disabled={loading}>
            <LogIn size={18} /> {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="auth-footer">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
      </div>
    </div>
  );
}
