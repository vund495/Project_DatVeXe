import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './components/App';
import BookingPage from './components/BookingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import MyTicketsPage from './components/MyTicketsPage';
import AdminPage from './components/AdminPage';
import ProfilePage from './components/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import Contact from './components/Contact';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Contact />
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/booking/:tripId" element={<BookingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/my-tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
);
