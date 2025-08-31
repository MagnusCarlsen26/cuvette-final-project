import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './auth/AuthContext';
import LoginPage from './auth/pages/Login';
import SignupPage from './auth/pages/Signup';
import ForgotPasswordPage from './auth/pages/ForgotPassword';
import OtpPage from './auth/pages/Otp';
import ResetPasswordPage from './auth/pages/ResetPassword';
import ProductPage from './dashboard/product/ProductPage';
import DashboardHome from './dashboard/pages/Home';
import SettingPage from './dashboard/pages/Setting';
import StatisticsPage from './dashboard/pages/Statistics';
import InvoicePage from './dashboard/pages/Invoice';
import AddProductPage from './dashboard/product/AddProduct';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/otp" element={<OtpPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard/home" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
          <Route path="/dashboard/product" element={<ProtectedRoute><ProductPage /></ProtectedRoute>} />
          <Route path="/dashboard/product/add" element={<ProtectedRoute><AddProductPage /></ProtectedRoute>} />
          <Route path="/dashboard/setting" element={<ProtectedRoute><SettingPage /></ProtectedRoute>} />
          <Route path="/dashboard/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
          <Route path="/dashboard/invoice" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}