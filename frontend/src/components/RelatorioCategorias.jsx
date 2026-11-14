import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../services/api.js'
import { dataBR, moeda, moedaCurta, percentual } from '../services/formatos.js'
import { useCarregar } from '../services/useCarregar.js'
import Estado from './Estado.jsx'

// Cores das duas séries (paleta categórica validada: azul e laranja passam
// nos testes de daltonismo e de contraste com o fundo claro).
const COR_PERIODO = '#2a78d6'
const COR_ANTERIOR = '#eb6834'

// Texto da variação com seta: a direção não depende só da cor.
function Variacao({ item }) {
  if (item.variacao === null) {
    return <span className="texto-suave">{item.total > 0 ? 'novo' : '—'}</span>
  }
  if (item.variacao === 0) return <span className="texto-suave">igual</span>
  const subiu = item.variacao > 0
  return (
    <span title={subiu ? 'Aumentou' : 'Diminuiu'}>
      {subiu ? '▲' : '▼'} {percentual(Math.abs(item.variacao))}
    </span>
  )
}

export default function RelatorioCategorias({ periodo, aoErroPeriodo }) {
  const { dados, carregando, erro, recarregar } = useCarregar(
    () =>
      api('/relatorios/categorias', { params: periodo }).catch((falha) => {
        aoErroPeriodo?.(falha.campos)
        throw falha
      }),
    [periodo.inicio, periodo.fim],
  )

  const comparacao = dados && `${dataBR(dados.comparadoCom.inicio)} a ${dataBR(dados.comparadoCom.fim)}`
  // Erro de período já aparece no campo de data; aqui só os outros erros.
  const erroGeral = Object.keys(erro?.campos ?? {}).length > 0 ? null : erro

  return (
    <Estado carregando={carregando && !dados} erro={erroGeral} aoTentarDeNovo={recarregar}>
      {dados && (
        <>
          <div className="cartao">
            <h2>Saídas por categoria</h2>
            <p className="texto-suave">
              Total de {moeda(dados.totalSaidas)}, comparado com {comparacao}.
            </p>
            {dados.categorias.length === 0 ? (
              <p className="texto-suave">Nenhuma saída neste período nem no anterior.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={60 + dados.categorias.length * 44}>
                  <BarChart data={dados.categorias} layout="vertical" barGap={2} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} stroke="#e7e9eb" />
                    <XAxis type="number" tickFormatter={moedaCurta} tick={{ fill: '#5f6b70', fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      width={110}
                      tick={{ fill: '#1c2427', fontSize: 13 }}
                    />
                    <Tooltip
                      formatter={(valor) => moeda(valor)}
                      cursor={{ fill: 'rgb(0 0 0 / 0.04)' }}
                    />
                    {/* itemSorter null: mantém a ordem das barras (o padrão ordena por nome) */}
                    <Legend verticalAlign="top" height={32} itemSorter={null} />
                    <Bar dataKey="total" name="Período escolhido" fill={COR_PERIODO} barSize={14} radius={[0, 4, 4, 0]} />
                    <Bar
                      dataKey="periodoAnterior"
                      name="Período anterior"
                      fill={COR_ANTERIOR}
                      barSize={14}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>

                <div className="tabela-rolagem">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th>Categoria</th>
                        <th className="numero">Total</th>
                        <th className="numero">% das saídas</th>
                        <th className="numero">Período anterior</th>
                        <th className="numero">Variação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.categorias.map((item) => (
                        <tr key={item.id}>
                          <td>{item.nome}</td>
                          <td className="numero">{moeda(item.total)}</td>
                          <td className="numero">{percentual(item.percentual)}</td>
                          <td className="numero">{moeda(item.periodoAnterior)}</td>
                          <td className="numero">
                            <Variacao item={item} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="cartao">
            <h2>Entradas por categoria</h2>
            {dados.entradas.length === 0 ? (
              <p className="texto-suave">Nenhuma entrada neste período nem no anterior.</p>
            ) : (
              <div className="tabela-rolagem">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th className="numero">Total</th>
                      <th className="numero">% das entradas</th>
                      <th className="numero">Período anterior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.entradas.map((item) => (
                      <tr key={item.id}>
                        <td>{item.nome}</td>
                        <td className="numero">{moeda(item.total)}</td>
                        <td className="numero">{percentual(item.percentual)}</td>
                        <td className="numero">{moeda(item.periodoAnterior)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th>Total</th>
                      <th className="numero">{moeda(dados.totalEntradas)}</th>
                      <th />
                      <th />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Estado>
  )
}
