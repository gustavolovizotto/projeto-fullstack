import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './Layout.jsx'
import RotaProtegida from './RotaProtegida.jsx'
import Login from './Login.jsx'
import Cadastro from './Cadastro.jsx'
import Categorias from './Categorias.jsx'
import FontesDestinos from './FontesDestinos.jsx'
import Lancamentos from './Lancamentos.jsx'
import Resumo from './Resumo.jsx'
import Relatorios from './Relatorios.jsx'
import Faturas from './Faturas.jsx'
import SaudeFinanceira from './SaudeFinanceira.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Resumo />} />
          <Route path="/lancamentos" element={<Lancamentos />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/fontes-destinos" element={<FontesDestinos />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/faturas" element={<Faturas />} />
          <Route path="/saude" element={<SaudeFinanceira />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
