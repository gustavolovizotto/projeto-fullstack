import { api } from '../services/api.js'
import { dataBR, moeda } from '../services/formatos.js'
import { useCarregar } from '../services/useCarregar.js'
import Estado from './Estado.jsx'

const formatadorMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

// '2026-12' → 'Dezembro de 2026'
function nomeDoMes(referencia) {
  const [ano, mes] = referencia.split('-').map(Number)
  const nome = formatadorMes.format(new Date(ano, mes - 1, 1))
  return nome[0].toUpperCase() + nome.slice(1)
}

function BarraLimite({ cartao }) {
  const usado = cartao.limite > 0 ? Math.min(100, (cartao.limiteUtilizado / cartao.limite) * 100) : 0
  const estourou = cartao.limiteDisponivel < 0
  return (
    <div className="limite">
      <div
        className="limite-barra"
        role="meter"
        aria-label={`Limite utilizado do ${cartao.nome}`}
        aria-valuemin={0}
        aria-valuemax={cartao.limite}
        aria-valuenow={cartao.limiteUtilizado}
      >
        <div className={estourou ? 'limite-uso estourou' : 'limite-uso'} style={{ width: `${usado}%` }} />
      </div>
      <p className="texto-suave">
        Utilizado <strong className="texto-normal">{moeda(cartao.limiteUtilizado)}</strong> de{' '}
        {moeda(cartao.limite)} · Disponível{' '}
        <strong className={estourou ? 'valor-saida' : 'texto-normal'}>{moeda(cartao.limiteDisponivel)}</strong>
        {estourou && ' (limite ultrapassado)'}
      </p>
    </div>
  )
}

function Fatura({ fatura }) {
  return (
    <div className={fatura.aberta ? 'fatura aberta' : 'fatura'}>
      <div className="fatura-cabecalho">
        <strong>{nomeDoMes(fatura.referencia)}</strong>
        {fatura.aberta && <span className="etiqueta">aberta</span>}
      </div>
      <p className="texto-suave detalhe">
        Fecha {dataBR(fatura.fechamento)} · vence {dataBR(fatura.vencimento)}
      </p>
      <p className="fatura-total">{moeda(fatura.total)}</p>
      {fatura.itens.length === 0 ? (
        <p className="texto-suave detalhe">Nenhuma compra nesta fatura.</p>
      ) : (
        <ul className="lista">
          {fatura.itens.map((item) => (
            <li key={item.id} className="lista-item">
              <span>
                {item.descricao}
                {item.totalParcelas > 1 && ` — ${item.parcelaAtual}/${item.totalParcelas}`}
              </span>
              <span>{moeda(item.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Faturas() {
  const { dados, carregando, erro, recarregar } = useCarregar(
    () => api('/relatorios/faturas', { params: { meses: 3 } }),
    [],
  )

  return (
    <section>
      <h1>Faturas</h1>
      <p className="texto-suave">
        Fatura aberta e a previsão das próximas 3 de cada cartão, contando as parcelas futuras.
      </p>

      <Estado
        carregando={carregando && !dados}
        erro={erro}
        aoTentarDeNovo={recarregar}
        vazio={dados?.cartoes.length === 0}
        textoVazio="Nenhum cartão de crédito cadastrado. Cadastre um em Fontes/destinos."
      >
        {dados?.cartoes.map((cartao) => (
          <div key={cartao.id} className="cartao cartao-credito">
            <div className="titulo-com-acao">
              <h2>{cartao.nome}</h2>
              <span className="texto-suave">
                Fecha dia {cartao.diaFechamento} · vence dia {cartao.diaVencimento}
              </span>
            </div>
            <BarraLimite cartao={cartao} />
            <div className="faturas">
              {cartao.faturas.map((fatura) => (
                <Fatura key={fatura.referencia} fatura={fatura} />
              ))}
            </div>
          </div>
        ))}
      </Estado>
    </section>
  )
}
