import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import Landing from './pages/Landing';
import AboutPage from './pages/AboutPage';
import Admin from './Admin';
import ResetPassword from './ResetPassword';
import ReceiptsPage from './pages/ReceiptsPage';
import InvoiceStyleEditor from './pages/InvoiceStyleEditor';
import CustomerManagement from './pages/CustomerManagement';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 客戶頁面 */}
        <Route path="/" element={<BookingPage />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/about" element={<AboutPage />} />

        {/* 管理員頁面 */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/receipts" element={<ReceiptsPage />} />
        <Route path="/admin/invoice-style" element={<InvoiceStyleEditor />} />
        <Route path="/admin/customers" element={<CustomerManagement />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/customers" element={<CustomerManagement />} />

        {/* 其他 URL 全部去首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
