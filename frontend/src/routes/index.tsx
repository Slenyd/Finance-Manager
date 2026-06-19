import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/app-layout';
import { AuthLayout } from '@/components/layouts/auth-layout';

const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password'));
const ResetPasswordPage = lazy(() => import('@/pages/reset-password'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const TransactionsPage = lazy(() => import('@/pages/transactions'));
const BudgetsPage = lazy(() => import('@/pages/budgets'));
const GoalsPage = lazy(() => import('@/pages/goals'));
const AnalyticsPage = lazy(() => import('@/pages/analytics'));
const NotificationsPage = lazy(() => import('@/pages/notifications'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const LoadingPage = lazy(() => import('@/pages/loading'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'budgets', element: <BudgetsPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/loading',
    element: <LoadingPage />,
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
