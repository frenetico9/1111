import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './index.css'; // Main CSS file if needed in future, for now Tailwind handles global styles

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Elemento root não encontrado para montar a aplicação.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
);