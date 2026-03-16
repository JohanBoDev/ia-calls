import { createBrowserRouter } from 'react-router-dom'
import DashboardPage from '@/pages/DashboardPage'
import ClientesPage from '@/pages/ClientesPage'
import ClienteChatPage from '@/pages/ClienteChatPage'
import NuevoTicketPage from '@/pages/NuevoTicketPage'
import SesionesPage from '@/pages/SesionesPage'
import LogsPage from '@/pages/LogsPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/',                        element: <DashboardPage /> },
  { path: '/clientes',                element: <ClientesPage /> },
  { path: '/clientes/nuevo',          element: <NuevoTicketPage /> },
  { path: '/clientes/:numero_ticket', element: <ClienteChatPage /> },
  { path: '/sesiones',                element: <SesionesPage /> },
  { path: '/logs',                    element: <LogsPage /> },
  { path: '*',                        element: <NotFoundPage /> },
])
