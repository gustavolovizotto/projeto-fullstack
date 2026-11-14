import { NavLink, Outlet } from 'react-router-dom'

const MENU = [
  { para: '/', rotulo: 'Resumo' },
  { para: '/lancamentos', rotulo: 'Lançamentos' },
  { para: '/categorias', rotulo: 'Categorias' },
  { para: '/fontes-destinos', rotulo: 'Fontes/destinos' },
  { para: '/relatorios', rotulo: 'Relatórios' },
  { para: '/faturas', rotulo: 'Faturas' },
]

// Moldura das telas logadas: cabeçalho com menu e o conteúdo da rota.
export default function Layout() {
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
      </header>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  )
}
