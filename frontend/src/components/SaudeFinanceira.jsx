import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../services/api.js'
import { moeda, moedaCurta, percentual } from '../services/formatos.js'
import { useCarregar } from '../services/useCarregar.js'
import Estado from './Estado.jsx'

const formatoMesCurto = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
const formatoMesLongo = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

function mes(referencia, formato = formatoMesCurto) {
  const [ano, numero] = referencia.split('-').map(Number)
  return formato.format(new Date(ano, numero - 1, 1))
}

// Ícone + rótulo escrito: o tipo da dica não depende só da cor.
const TIPOS_DICA = {
  alerta: { icone: '⚠', rotulo: 'Atenção' },
  info: { icone: 'ℹ', rotulo: 'Informação' },
  positivo: { icone: '✓', rotulo: 'Ponto positivo' },
}

function Indicador({ titulo, valor, detalhe }) {
  return (
    <div className="cartao total">
      <span className="texto-suave">{titulo}</span>
      <strong>{valor}</strong>
      {detalhe && <small className="texto-suave">{detalhe}</small>}
    </div>
  )
}

export default function SaudeFinanceira() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => api('/saude-financeira'), [])
  const ind = dados?.indicadores

  return (
    <section>
      <h1>Saúde financeira</h1>
      <p className="alerta alerta-info">
        {dados?.aviso ??
          'As informações desta página são educativas e não constituem recomendação financeira profissional.'}
      </p>

      <Estado carregando={carregando && !dados} erro={erro} aoTentarDeNovo={recarregar}>
        {dados && (
          <>
            <div className="totais">
              <Indicador
                titulo="Taxa de poupança (3 meses)"
                valor={ind.taxaPoupancaMedia === null ? '—' : percentual(ind.taxaPoupancaMedia)}
                detalhe="da renda que sobrou"
              />
              <Indicador titulo="Renda média mensal" valor={moeda(ind.rendaMediaMensal)} />
              <Indicador
                titulo="Comprometimento com cartões"
                valor={
                  ind.comprometimentoCartoes.percentualDaRenda === null
                    ? '—'
                    : percentual(ind.comprometimentoCartoes.percentualDaRenda)
                }
                detalhe={`${moeda(ind.comprometimentoCartoes.totalProximasFaturas)} nas próximas 3 faturas`}
              />
              <Indicador
                titulo="Parcelas a vencer"
                valor={moeda(ind.parcelasFuturas.total)}
                detalhe={ind.parcelasFuturas.ate ? `até ${mes(ind.parcelasFuturas.ate, formatoMesLongo)}` : 'nenhuma'}
              />
            </div>

            <div className="cartao">
              <h2>Dicas</h2>
              <ul className="lista dicas">
                {dados.dicas.map((dica) => (
                  <li key={dica.texto} className={`lista-item dica dica-${dica.tipo}`}>
                    <span className="dica-icone" aria-hidden="true">
                      {TIPOS_DICA[dica.tipo].icone}
                    </span>
                    <span>
                      <span className="sr-only">{TIPOS_DICA[dica.tipo].rotulo}: </span>
                      {dica.texto}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cartao">
              <h2>Saldo projetado nos próximos 6 meses</h2>
              <p className="texto-suave">
                Saldo acumulado a partir de hoje, mantendo a renda e os gastos à vista médios dos últimos meses e
                somando as parcelas já conhecidas.
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={dados.projecao.map((p) => ({ ...p, mes: mes(p.referencia) }))}
                  margin={{ top: 8, left: 8, right: 24 }}
                >
                  <CartesianGrid vertical={false} stroke="#e7e9eb" />
                  <XAxis dataKey="mes" tick={{ fill: '#5f6b70', fontSize: 12 }} />
                  <YAxis tickFormatter={moedaCurta} width={80} tick={{ fill: '#5f6b70', fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="#9aa3a7" />
                  <Tooltip formatter={(valor) => moeda(valor)} />
                  <Line
                    type="monotone"
                    dataKey="saldoAcumulado"
                    name="Saldo acumulado"
                    stroke="#2a78d6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="tabela-rolagem">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th className="numero">Entradas</th>
                      <th className="numero">Saídas</th>
                      <th className="numero">das quais parcelas</th>
                      <th className="numero">Saldo do mês</th>
                      <th className="numero">Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.projecao.map((p) => (
                      <tr key={p.referencia}>
                        <td>{mes(p.referencia, formatoMesLongo)}</td>
                        <td className="numero">{moeda(p.entradas)}</td>
                        <td className="numero">{moeda(p.saidas)}</td>
                        <td className="numero">{moeda(p.parcelas)}</td>
                        <td className={`numero ${p.saldoMes < 0 ? 'valor-saida' : ''}`}>{moeda(p.saldoMes)}</td>
                        <td className={`numero ${p.saldoAcumulado < 0 ? 'valor-saida' : ''}`}>
                          {moeda(p.saldoAcumulado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="cartao">
              <h2>Últimos 3 meses</h2>
              <div className="tabela-rolagem">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th className="numero">Entradas</th>
                      <th className="numero">Saídas</th>
                      <th className="numero">Taxa de poupança</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.meses.map((m, i) => (
                      <tr key={m.referencia}>
                        <td>
                          {mes(m.referencia, formatoMesLongo)}
                          {i === dados.meses.length - 1 && <span className="etiqueta">até hoje</span>}
                        </td>
                        <td className="numero">{moeda(m.entradas)}</td>
                        <td className="numero">{moeda(m.saidas)}</td>
                        <td className="numero">{m.taxaPoupanca === null ? '—' : percentual(m.taxaPoupanca)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Estado>
    </section>
  )
}
