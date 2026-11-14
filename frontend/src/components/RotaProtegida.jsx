import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

// Envolve as rotas que exigem login. Sem token, manda para o /login
// lembrando de onde o usuário veio, para voltar depois de entrar.
export default function RotaProtegida() {
  const { autenticado, validando } = useAuth()
  const local = useLocation()

  if (!autenticado) return <Navigate to="/login" replace state={{ de: local.pathname }} />
  if (validando) return <p className="texto-suave carregando">Carregando…</p>
  return <Outlet />
}
