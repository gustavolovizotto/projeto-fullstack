import { useState } from 'react'
import { mesAtual } from '../services/formatos.js'
import RelatorioCategorias from './RelatorioCategorias.jsx'
import RelatorioFontesDestinos from './RelatorioFontesDestinos.jsx'
import SeletorPeriodo from './SeletorPeriodo.jsx'

const ABAS = [
  { id: 'categorias', rotulo: 'Por categoria', Componente: RelatorioCategorias },
  { id: 'fontes', rotulo: 'Por fonte/destino', Componente: RelatorioFontesDestinos },
]

export default function Relatorios() {
  const [periodo, setPeriodo] = useState(mesAtual)
  const [errosPeriodo, setErrosPeriodo] = useState({})
  const [aba, setAba] = useState('categorias')

  function mudarPeriodo(novo) {
    setErrosPeriodo({})
    setPeriodo(novo)
  }

  const { Componente } = ABAS.find((a) => a.id === aba)

  return (
    <section>
      <h1>Relatórios</h1>
      <SeletorPeriodo periodo={periodo} aoMudar={mudarPeriodo} erros={errosPeriodo} />

      <div className="abas" role="tablist">
        {ABAS.map(({ id, rotulo }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            className={aba === id ? 'aba ativa' : 'aba'}
            onClick={() => setAba(id)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <Componente periodo={periodo} aoErroPeriodo={setErrosPeriodo} />
    </section>
  )
}
