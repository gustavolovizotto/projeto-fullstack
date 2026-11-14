import { mesRelativo } from '../services/formatos.js'
import Campo from './Campo.jsx'

// De/Até com atalhos para este mês e o mês anterior.
export default function SeletorPeriodo({ periodo, aoMudar, erros = {} }) {
  return (
    <div className="cartao filtros">
      <Campo
        id="periodo-inicio"
        rotulo="De"
        type="date"
        value={periodo.inicio}
        onChange={(e) => aoMudar({ ...periodo, inicio: e.target.value })}
        erro={erros.inicio}
      />
      <Campo
        id="periodo-fim"
        rotulo="Até"
        type="date"
        value={periodo.fim}
        onChange={(e) => aoMudar({ ...periodo, fim: e.target.value })}
        erro={erros.fim}
      />
      <div className="acoes atalhos-periodo">
        <button className="botao-secundario" type="button" onClick={() => aoMudar(mesRelativo(0))}>
          Este mês
        </button>
        <button className="botao-secundario" type="button" onClick={() => aoMudar(mesRelativo(-1))}>
          Mês anterior
        </button>
      </div>
    </div>
  )
}
