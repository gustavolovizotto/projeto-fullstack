import { useState } from 'react'
import { mesAtual } from '../services/formatos.js'
import RelatorioCategorias from './RelatorioCategorias.jsx'
import SeletorPeriodo from './SeletorPeriodo.jsx'

export default function Relatorios() {
  const [periodo, setPeriodo] = useState(mesAtual)
  const [errosPeriodo, setErrosPeriodo] = useState({})

  function mudarPeriodo(novo) {
    setErrosPeriodo({})
    setPeriodo(novo)
  }

  return (
    <section>
      <h1>Relatórios</h1>
      <SeletorPeriodo periodo={periodo} aoMudar={mudarPeriodo} erros={errosPeriodo} />
      <RelatorioCategorias periodo={periodo} aoErroPeriodo={setErrosPeriodo} />
    </section>
  )
}
