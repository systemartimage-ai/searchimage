import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from './HomePage'
import { LoginPage } from './LoginPage'
import { AdminPage } from './AdminPage'
import { ResetPasswordPage } from './ResetPasswordPage'
import { RequireAuth, RequireAdmin } from '@/domains/auth/RequireAuth'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        element: <RequireAdmin />,
        children: [{ path: '/admin', element: <AdminPage /> }],
      },
    ],
  },
])
