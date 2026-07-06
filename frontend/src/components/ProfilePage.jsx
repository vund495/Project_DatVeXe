import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { User, Mail, Phone, UserCheck, Edit2, Save, X, Eye, EyeOff, Lock } from 'lucide-react';
import { authApi } from '../api';
import { getStoredUser, saveAuth } from '../auth';
import { Field } from './UI';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  if (!user) return <Navigate to="/login" replace />;

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!editForm.name.trim()) {
      setError('Tên không được để trống');
      setLoading(false);
      return;
    }

    if (editForm.phone && !editForm.phone.replace(/\s|-/g, '').match(/^\d+$/)) {
      setError('Số điện thoại chỉ được chứa chữ số, khoảng trắng hoặc dấu gạch ngang');
      setLoading(false);
      return;
    }

    if (editForm.phone && editForm.phone.replace(/\s|-/g, '').length < 10) {
      setError('Số điện thoại phải có ít nhất 10 chữ số');
      setLoading(false);
      return;
    }

    try {
      const response = await authApi('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
        }),
      });

      // Update stored user
      const storedAuth = {
        access_token: localStorage.getItem('vietride_access_token'),
        refresh_token: localStorage.getItem('vietride_refresh_token'),
        user: response,
      };
      saveAuth(storedAuth);

      setSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!passwordForm.currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      setLoading(false);
      return;
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    try {
      // Call change password API
      await authApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });

      setSuccess('Đổi mật khẩu thành công!');
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  }

  function handleCancelPassword() {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsChangingPassword(false);
    setError('');
    setSuccess('');
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={40} />
          </div>
          <div className="profile-header-info">
            <h1>{user.name}</h1>
            <p className="text-secondary">{user.email}</p>
            {user.role !== 'user' && (
              <span className="profile-badge">{user.role === 'admin' ? 'Quản trị viên' : user.role}</span>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Main Content */}
        <div className="profile-content">
          {/* Profile Information Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Thông tin cá nhân</h2>
              {!isEditing && (
                <button 
                  className="secondary-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 size={18} /> Chỉnh sửa
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <Field label="Email">
                  <input 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="profile-input disabled"
                  />
                </Field>

                <Field label="Tên">
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="profile-input"
                    placeholder="Nhập tên của bạn"
                    required
                  />
                </Field>

                <Field label="Số điện thoại">
                  <input 
                    type="tel" 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="profile-input"
                    placeholder="Nhập số điện thoại"
                  />
                </Field>

                <div className="profile-actions">
                  <button 
                    type="submit" 
                    className="primary-btn"
                    disabled={loading}
                  >
                    <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button 
                    type="button" 
                    className="secondary-btn"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X size={18} /> Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <div className="info-item">
                    <span className="info-label"><Mail size={18} /> Email</span>
                    <span className="info-value">{user.email}</span>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-item">
                    <span className="info-label"><UserCheck size={18} /> Tên</span>
                    <span className="info-value">{user.name}</span>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-item">
                    <span className="info-label"><Phone size={18} /> Số điện thoại</span>
                    <span className="info-value">{user.phone || 'Chưa có số điện thoại'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Section */}
          <div className="profile-section">
            <div className="section-header">
              <h2>Bảo mật</h2>
              {!isChangingPassword && (
                <button 
                  className="secondary-btn"
                  onClick={() => setIsChangingPassword(true)}
                >
                  <Lock size={18} /> Đổi mật khẩu
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <form onSubmit={handleChangePassword} className="profile-form">
                <Field label="Mật khẩu hiện tại">
                  <div className="password-input-group">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="profile-input"
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>

                <Field label="Mật khẩu mới">
                  <div className="password-input-group">
                    <input 
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="profile-input"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>

                <Field label="Xác nhận mật khẩu">
                  <div className="password-input-group">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="profile-input"
                      placeholder="Nhập lại mật khẩu mới"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>

                <div className="profile-actions">
                  <button 
                    type="submit" 
                    className="primary-btn"
                    disabled={loading}
                  >
                    <Lock size={18} /> {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                  <button 
                    type="button" 
                    className="secondary-btn"
                    onClick={handleCancelPassword}
                    disabled={loading}
                  >
                    <X size={18} /> Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="security-info">
                <p className="info-text">Mật khẩu của bạn được mã hóa và lưu trữ an toàn trên máy chủ.</p>
                <p className="info-text">Vui lòng đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn.</p>
              </div>
            )}
          </div>

          {/* Account Type Section */}
          <div className="profile-section">
            <h2>Loại tài khoản</h2>
            <div className="account-type">
              <div className="account-info">
                <User size={24} />
                <div>
                  <p className="account-name">{user.role === 'admin' ? 'Tài khoản Quản trị' : 'Tài khoản Người dùng'}</p>
                  <p className="account-desc">
                    {user.role === 'admin' 
                      ? 'Bạn có quyền truy cập vào bảng điều khiển quản trị' 
                      : 'Bạn là người dùng thông thường của hệ thống'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
