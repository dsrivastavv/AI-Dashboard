import { Navigate, createBrowserRouter } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import NotificationsPage from '../pages/NotificationsPage';
import SystemInfoPage from '../pages/SystemInfoPage';
import TerminalPage from '../pages/TerminalPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/terminal', element: <TerminalPage /> },
      { path: '/system', element: <SystemInfoPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
