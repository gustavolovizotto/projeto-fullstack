import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './Layout.jsx'
import EmConstrucao from './EmConstrucao.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<EmConstrucao titulo="Entrar" />} />
      <Route path="/cadastro" element={<EmConstrucao titulo="Criar conta" />} />

      <Route element={<Layout />}>
        <Route path="/" element={<EmConstrucao titulo="Resumo do mês" />} />
        <Route path="/lancamentos" element={<EmConstrucao titulo="Lançamentos" />} />
        <Route path="/categorias" element={<EmConstrucao titulo="Categorias" />} />
        <Route path="/fontes-destinos" element={<EmConstrucao titulo="Fontes e destinos" />} />
        <Route path="/relatorios" element={<EmConstrucao titulo="Relatórios" />} />
        <Route path="/faturas" element={<EmConstrucao titulo="Faturas" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
