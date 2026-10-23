import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Overlay from './pages/Overlay';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Clean, transparent OBS Browser Source (No buttons or inputs) */}
        <Route path="/overlay/:streamerId" element={<Overlay />} />
        
        {/* Default fallback for /overlay without an ID */}
        <Route path="/overlay" element={<Navigate to="/overlay/default_streamer" replace />} />

        {/* 2. Streamer Control Panel (Match Logger & Rank Editor) */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Redirect root '/' to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}