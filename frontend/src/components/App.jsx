import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './Layout.jsx'
import RotaProtegida from './RotaProtegida.jsx'
import Login from './Login.jsx'
import Cadastro from './Cadastro.jsx'
import Categorias from './Categorias.jsx'
import FontesDestinos from './FontesDestinos.jsx'
import EmConstrucao from './EmConstrucao.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<EmConstrucao titulo="Resumo do mês" />} />
          <Route path="/lancamentos" element={<EmConstrucao titulo="Lançamentos" />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/fontes-destinos" element={<FontesDestinos />} />
          <Route path="/relatorios" element={<EmConstrucao titulo="Relatórios" />} />
          <Route path="/faturas" element={<EmConstrucao titulo="Faturas" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
