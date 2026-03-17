import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import ClientesPage from '@/pages/ClientesPage'
import ClienteChatPage from '@/pages/ClienteChatPage'
import NuevoTicketPage from '@/pages/NuevoTicketPage'
import SesionesPage from '@/pages/SesionesPage'
import LogsPage from '@/pages/LogsPage'
import GesiPage from '@/pages/GesiPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/',                        element: <DashboardPage /> },
      { path: '/clientes',                element: <ClientesPage /> },
      { path: '/clientes/nuevo',          element: <NuevoTicketPage /> },
      { path: '/clientes/:numero_ticket', element: <ClienteChatPage /> },
      { path: '/sesiones',                element: <SesionesPage /> },
      { path: '/logs',                    element: <LogsPage /> },
      { path: '/gesi',                    element: <GesiPage /> },
      { path: '*',                        element: <NotFoundPage /> },
    ],
  },
])
