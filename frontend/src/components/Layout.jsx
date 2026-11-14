import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

const MENU = [
  { para: '/', rotulo: 'Resumo' },
  { para: '/lancamentos', rotulo: 'Lançamentos' },
  { para: '/categorias', rotulo: 'Categorias' },
  { para: '/fontes-destinos', rotulo: 'Fontes/destinos' },
  { para: '/relatorios', rotulo: 'Relatórios' },
  { para: '/faturas', rotulo: 'Faturas' },
  { para: '/saude', rotulo: 'Saúde' },
]

// Moldura das telas logadas: cabeçalho com menu e o conteúdo da rota.
export default function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  function sair() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app">
      <header className="cabecalho">
        <span className="marca">Controle Financeiro</span>
        <nav className="menu">
          {MENU.map(({ para, rotulo }) => (
            <NavLink key={para} to={para} end={para === '/'}>
              {rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="usuario">
          {usuario && <span className="texto-suave">{usuario.nome}</span>}
          <button className="botao-link" type="button" onClick={sair}>
            Sair
          </button>
        </div>
      </header>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  )
}
