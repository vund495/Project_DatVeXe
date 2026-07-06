import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, MapPin, Bus, Users, DollarSign, Ticket, CalendarCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { getStoredUser } from '../auth';
import { authApi } from '../api';
import { currency, minutesToText, timeText } from '../utils';

function hasPerm(perm) {
  const u = getStoredUser();
  if (!u) return false;
  if (u.role === 'admin') return true;
  return (u.permissions || '').split(',').map(p => p.trim()).includes(perm);
}

export default function AdminPage() {
  const navigate = useNavigate();
  const canManage = hasPerm('trips:manage');
  const [tab, setTab] = useState('trips');
  
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [operators, setOperators] = useState([]);
  const [users, setUsers] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTrip, setEditTrip] = useState(null);

  const [showUserForm, setShowUserForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [stats, setStats] = useState(null);

  function loadData() {
    setLoading(true);
    Promise.all([
      authApi('/admin/trips').catch(() => []),
      authApi('/admin/routes').catch(() => []),
      authApi('/admin/operators').catch(() => []),
      authApi('/admin/users').catch(() => []),
      authApi('/admin/stats').catch(() => null),
    ]).then(([t, r, o, u, s]) => { 
      setTrips(t); 
      setRoutes(r); 
      setOperators(o); 
      setUsers(u);
      setStats(s);
      setLoading(false); 
    });
  }

  useEffect(loadData, []);

  async function deleteUser(id) {
    if (!confirm('Xoá người dùng này?')) return;
    await authApi(`/admin/users/${id}`, { method: 'DELETE' });
    loadData();
  }

  async function saveUser(data) {
    if (data.id) {
      await authApi(`/admin/users/${data.id}`, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await authApi('/admin/users', { method: 'POST', body: JSON.stringify(data) });
    }
    setShowUserForm(false);
    setEditUser(null);
    loadData();
  }

  async function deleteTrip(id) {
    if (!confirm('Xoá chuyến này?')) return;
    await authApi(`/admin/trips/${id}`, { method: 'DELETE' });
    loadData();
  }

  async function saveTrip(data) {
    if (editTrip) {
      await authApi(`/admin/trips/${editTrip.id}`, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await authApi('/admin/trips', { method: 'POST', body: JSON.stringify(data) });
    }
    setShowForm(false);
    setEditTrip(null);
    loadData();
  }

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Đang tải...</p></div>;

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      
      
      <aside className="admin-sidebar" style={{ width: '260px', background: '#1e293b', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="sidebar-brand">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, paddingBottom: '15px', borderBottom: '1px solid #334155' }}>
            Quản lý hệ thống
          </h2>
        </div>
        
        <nav className="sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            className={`sidebar-item ${tab === 'revenue' ? 'active' : ''}`} 
            onClick={() => setTab('revenue')}
            style={sidebarBtnStyle(tab === 'revenue')}
          >
            <DollarSign size={18} /> <span>Doanh thu</span>
          </button>

          <button 
            className={`sidebar-item ${tab === 'trips' ? 'active' : ''}`} 
            onClick={() => setTab('trips')}
            style={sidebarBtnStyle(tab === 'trips')}
          >
            <Bus size={18} /> <span>Chuyến xe</span>
          </button>
          
          <button 
            className={`sidebar-item ${tab === 'routes' ? 'active' : ''}`} 
            onClick={() => setTab('routes')}
            style={sidebarBtnStyle(tab === 'routes')}
          >
            <MapPin size={18} /> <span>Tuyến đường</span>
          </button>
          
          <button 
            className={`sidebar-item ${tab === 'users' ? 'active' : ''}`} 
            onClick={() => setTab('users')}
            style={sidebarBtnStyle(tab === 'users')}
          >
            <Users size={18} /> <span>Người dùng</span>
          </button>


        </nav>

        <button className="back-btn" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '10px', borderRadius: '6px', cursor: 'pointer', justifyContent: 'center' }}>
          <ArrowLeft size={16} /> Quay lại trang chủ
        </button>
      </aside>

      <main className="admin-main" style={{ flex: 1, padding: '30px', background: '#f8fafc' }}>
        
        {tab === 'trips' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Danh sách chuyến xe</h2>
              {canManage && (
                <button className="primary-btn" onClick={() => { setEditTrip(null); setShowForm(true); }}>
                  <Plus size={16} /> Thêm chuyến
                </button>
              )}
            </div>

            {showForm && canManage && (
              <AdminTripForm
                routes={routes}
                operators={operators}
                editTrip={editTrip}
                onSave={saveTrip}
                onCancel={() => { setShowForm(false); setEditTrip(null); }}
              />
            )}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>ID</th><th>Tuyến</th><th>Nhà xe</th><th>Giờ</th><th>Giá</th><th>Ghế</th><th>Hành động</th></tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td><strong>{t.origin} → {t.destination}</strong></td>
                      <td>{t.operatorName}</td>
                      <td>{timeText(t.departureTime)}</td>
                      <td>{currency(t.price)}</td>
                      <td>{t.availableSeats}/{t.totalSeats}</td>
                      <td className="admin-actions">
                        <button className="admin-btn" onClick={() => { setEditTrip(t); setShowForm(true); }}><Pencil size={14} /></button>
                        <button className="admin-btn danger" onClick={() => deleteTrip(t.id)}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'revenue' && (
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>Báo cáo doanh thu</h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.9rem' }}>Tổng quan hoạt động kinh doanh</p>

            {!stats ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <DollarSign size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p>Chưa có dữ liệu thống kê</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '12px', padding: '20px', color: '#fff' }}>
                    <DollarSign size={24} style={{ opacity: 0.8, marginBottom: '12px' }} />
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Doanh thu hôm nay</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '4px' }}>{currency(stats.todayStats.revenue)}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', padding: '20px', color: '#fff' }}>
                    <TrendingUp size={24} style={{ opacity: 0.8, marginBottom: '12px' }} />
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Tổng doanh thu</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '4px' }}>{currency(stats.allTimeStats.totalRevenue)}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '12px', padding: '20px', color: '#fff' }}>
                    <Ticket size={24} style={{ opacity: 0.8, marginBottom: '12px' }} />
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Đặt vé hôm nay</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '4px' }}>{stats.todayStats.bookings}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '12px', padding: '20px', color: '#fff' }}>
                    <CalendarCheck size={24} style={{ opacity: 0.8, marginBottom: '12px' }} />
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Tổng đặt vé</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '4px' }}>{stats.allTimeStats.totalBookings}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)', borderRadius: '12px', padding: '20px', color: '#fff' }}>
                    <Users size={24} style={{ opacity: 0.8, marginBottom: '12px' }} />
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Người dùng</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold', marginTop: '4px' }}>{stats.allTimeStats.totalUsers}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#1e293b' }}>Trạng thái đặt vé</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <StatusBar label="Đã thanh toán" value={stats.bookingStatus.paid} total={stats.allTimeStats.totalBookings} color="#10b981" />
                      <StatusBar label="Chờ thanh toán" value={stats.bookingStatus.pending} total={stats.allTimeStats.totalBookings} color="#f59e0b" />
                      <StatusBar label="Đã hủy" value={stats.bookingStatus.cancelled} total={stats.allTimeStats.totalBookings} color="#ef4444" />
                    </div>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#1e293b' }}>Thông tin nhanh</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <QuickInfoRow label="Tổng doanh thu" value={currency(stats.allTimeStats.totalRevenue)} />
                      <QuickInfoRow label="Doanh thu hôm nay" value={currency(stats.todayStats.revenue)} />
                      <QuickInfoRow label="Tổng đặt vé" value={String(stats.allTimeStats.totalBookings)} />
                      <QuickInfoRow label="Đặt vé hôm nay" value={String(stats.todayStats.bookings)} />
                      <QuickInfoRow label="Người dùng" value={String(stats.allTimeStats.totalUsers)} />
                      <QuickInfoRow label="Đã thanh toán" value={String(stats.bookingStatus.paid)} />
                      <QuickInfoRow label="Chờ thanh toán" value={String(stats.bookingStatus.pending)} />
                      <QuickInfoRow label="Đã hủy" value={String(stats.bookingStatus.cancelled)} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'routes' && (
          <div>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Danh sách tuyến đường</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>ID</th><th>Điểm đi</th><th>Điểm đến</th><th>Khoảng cách</th><th>Thời gian</th></tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.origin}</td>
                      <td>{r.destination}</td>
                      <td>{r.distanceKm} km</td>
                      <td>{minutesToText(r.durationMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Quản lý người dùng</h2>
              <button className="primary-btn" onClick={() => { setEditUser(null); setShowUserForm(true); }}>
                <Plus size={16} /> Thêm người dùng
              </button>
            </div>

            {showUserForm && (
              <AdminUserForm 
                editUser={editUser}
                onSave={saveUser}
                onCancel={() => { setShowUserForm(false); setEditUser(null); }}
              />
            )}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Quyền hạn</th><th>Hành động</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.85rem', 
                          fontWeight: '600',
                          background: u.role === 'admin' ? '#fef3c7' : '#e0f2fe', 
                          color: u.role === 'admin' ? '#d97706' : '#0369a1' 
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {u.permissions ? (
                            u.permissions.split(',').map((p, idx) => (
                              <span key={idx} style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                {p.trim()}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Không có quyền</span>
                          )}
                        </div>
                      </td>
                      <td className="admin-actions">
                        <button className="admin-btn" onClick={() => { setEditUser(u); setShowUserForm(true); }}><Pencil size={14} /></button>
                        <button className="admin-btn danger" onClick={() => deleteUser(u.id)}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function StatusBar({ label, value, total, color }) {
  const pct = total > 0 ? (value / total * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
        <span style={{ color: '#475569' }}>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value} <span style={{ fontWeight: 400, color: '#94a3b8' }}>({pct.toFixed(1)}%)</span></span>
      </div>
      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function QuickInfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#1e293b' }}>{value}</span>
    </div>
  );
}

function sidebarBtnStyle(isActive) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    background: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? '#fff' : '#94a3b8',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    fontWeight: isActive ? '600' : 'normal'
  };
}

function AdminUserForm({ editUser, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: editUser?.id || null,
    name: editUser?.name || '',
    email: editUser?.email || '',
    role: editUser?.role || 'user',
  });
  
  const [selectedPerms, setSelectedPerms] = useState(
    editUser?.permissions ? editUser.permissions.split(',').map(p => p.trim()) : []
  );
  
  const [saving, setSaving] = useState(false);
  const availablePermissions = ['trips:view', 'trips:manage', 'users:manage'];

  function handlePermChange(perm) {
    if (selectedPerms.includes(perm)) {
      setSelectedPerms(selectedPerms.filter(p => p !== perm));
    } else {
      setSelectedPerms([...selectedPerms, perm]);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      permissions: selectedPerms.join(', ')
    };
    await onSave(payload);
    setSaving(false);
  }

  return (
    <form className="admin-form" onSubmit={submit} style={{ marginBottom: '24px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 16px 0' }}>{editUser ? `Chỉnh sửa: ${editUser.name}` : 'Thêm người dùng mới'}</h3>
      <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        <div className="admin-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Họ tên</label>
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
        </div>

        <div className="admin-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Email</label>
          <input type="email" required disabled={!!editUser} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: editUser ? '#f1f5f9' : '#fff' }} />
        </div>

        <div className="admin-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Vai trò</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <label style={{ fontWeight: '500', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>
          Quyền hạn hệ thống {form.role === 'admin' && <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>(Admin mặc định có tất cả quyền)</span>}
        </label>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {availablePermissions.map((perm) => (
            <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={selectedPerms.includes(perm) || form.role === 'admin'} 
                disabled={form.role === 'admin'} 
                onChange={() => handlePermChange(perm)} 
              />
              <code>{perm}</code>
            </label>
          ))}
        </div>
      </div>

      <div className="admin-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button type="button" className="secondary-btn" onClick={onCancel}>Hủy</button>
        <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thông tin'}</button>
      </div>
    </form>
  );
}

function AdminTripForm({ routes, operators, editTrip, onSave, onCancel }) {
  const [form, setForm] = useState({
    routeId: editTrip?.routeId || (routes[0]?.id || ''),
    operatorId: editTrip?.operatorId || (operators[0]?.id || ''),
    departureTime: editTrip?.departureTime || '',
    price: editTrip?.price || '',
    totalSeats: editTrip?.totalSeats || 34,
  });
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, price: Number(form.price), totalSeats: Number(form.totalSeats) });
    setSaving(false);
  }

  return (
    <form className="admin-form" onSubmit={submit} style={{ marginBottom: '24px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3>{editTrip ? 'Sửa chuyến' : 'Thêm chuyến mới'}</h3>
      <div className="admin-form-grid">
        <div className="admin-field">
          <label>Tuyến</label>
          <select value={form.routeId} onChange={(e) => setForm({ ...form, routeId: Number(e.target.value) })}>
            {routes.map((r) => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
          </select>
        </div>
        <div className="admin-field">
          <label>Nhà xe</label>
          <select value={form.operatorId} onChange={(e) => setForm({ ...form, operatorId: Number(e.target.value) })}>
            {operators.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.busType})</option>)}
          </select>
        </div>
        <div className="admin-field">
          <label>Giờ khởi hành</label>
          <input type="datetime-local" required value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} />
        </div>
        <div className="admin-field">
          <label>Giá vé</label>
          <input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="admin-field">
          <label>Tổng số ghế</label>
          <input type="number" min="1" value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: e.target.value })} />
        </div>
      </div>
      <div className="admin-form-actions">
        <button type="button" className="secondary-btn" onClick={onCancel}>Hủy</button>
        <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
      </div>
    </form>
  );
}