import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/app.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { applyThemeVariables } from './config/colors';

// Apply CSS variable tokens before first render so every page (including
// the login page, which renders outside AppLayout) picks up the values
// from colors.ts rather than falling back to the static app.css defaults.
const storedTheme = window.localStorage.getItem('ai-dashboard-theme');
applyThemeVariables(storedTheme === 'light' ? 'light' : 'dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
