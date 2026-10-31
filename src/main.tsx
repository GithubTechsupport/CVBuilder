import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import PrintPage from './pages/PrintPage';
import { ToastProvider } from './components/Toast';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/edit/:id" element={<Editor />} />
          <Route path="/print/:id?" element={<PrintPage />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
