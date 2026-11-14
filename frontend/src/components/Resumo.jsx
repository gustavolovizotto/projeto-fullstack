import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { api } from '../services/api.js'
import { dataBR, mesAtual, moeda } from '../services/formatos.js'
import { useCarregar } from '../services/useCarregar.js'
import Estado from './Estado.jsx'
import Totais from './Totais.jsx'

const nomeDoMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())

// Tela inicial: totais do mês e os últimos lançamentos. Usa a mesma rota da
// listagem (que já devolve os totais do período), sem endpoint próprio.
export default function Resumo() {
  const { usuario } = useAuth()
  const { dados, carregando, erro, recarregar } = useCarregar(
    () => api('/lancamentos', { params: { ...mesAtual(), porPagina: 5 } }),
    [],
  )

  return (
    <section>
      <h1>{usuario ? `Olá, ${usuario.nome.split(' ')[0]}` : 'Resumo'}</h1>
      <p className="texto-suave">Resumo de {nomeDoMes}</p>

      <Estado carregando={carregando && !dados} erro={erro} aoTentarDeNovo={recarregar}>
        {dados && (
          <>
            <Totais totais={dados.totais} />

            <div className="grade-2">
              <div className="cartao">
                <div className="titulo-com-acao">
                  <h2>Últimos lançamentos</h2>
                  <Link to="/lancamentos">Ver todos</Link>
                </div>
                {dados.itens.length === 0 ? (
                  <p className="texto-suave">Nenhum lançamento neste mês.</p>
                ) : (
                  <ul className="lista">
                    {dados.itens.map((l) => (
                      <li key={l.id} className="lista-item">
                        <span>
                          {l.descricao}
                          {l.totalParcelas > 1 && (
                            <span className="etiqueta">
                              {l.parcelaAtual}/{l.totalParcelas}
                            </span>
                          )}
                          <small className="texto-suave detalhe">
                            {dataBR(l.data)} · {l.categoriaNome}
                          </small>
                        </span>
                        <strong className={l.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida'}>
                          {l.tipo === 'entrada' ? '+ ' : '− '}
                          {moeda(l.valor)}
                        </strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="cartao">
                <h2>Atalhos</h2>
                <ul className="lista">
                  <li className="lista-item">
                    <Link to="/lancamentos">Registrar ou ver lançamentos</Link>
                  </li>
                  <li className="lista-item">
                    <Link to="/relatorios">Gastos por categoria e por fonte/destino</Link>
                  </li>
                  <li className="lista-item">
                    <Link to="/faturas">Faturas dos cartões</Link>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </Estado>
    </section>
  )
}
