import React from 'react';
import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../auth';

export default function ProtectedRoute({ children, adminOnly }) {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
